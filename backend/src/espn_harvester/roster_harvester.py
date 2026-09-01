import os
import time
import random
import json
import logging
from urllib.parse import urlparse
import requests
import pg8000.native
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DIRECT_URL") or os.getenv("DATABASE_URL")
ESPN_ROSTER_URL = "https://site.web.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams/360/roster"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
]

def get_db_connection():
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is not set.")
    parsed = urlparse(DATABASE_URL)
    return pg8000.native.Connection(
        user=parsed.username,
        password=parsed.password,
        host=parsed.hostname,
        port=parsed.port or 5432,
        database=parsed.path.lstrip('/'),
        ssl_context=True
    )

def fetch_roster_data():
    session = requests.Session()
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "application/json",
        "Referer": "https://www.espn.com/"
    }
    jitter = 1.0 + random.uniform(0.5, 1.0)
    logger.info(f"Sleeping for {jitter:.2f} seconds before requesting ESPN API...")
    time.sleep(jitter)
    
    logger.info(f"Fetching roster from {ESPN_ROSTER_URL}")
    response = session.get(ESPN_ROSTER_URL, headers=headers, timeout=10)
    response.raise_for_status()
    return response.json()

def clean_headshot_url(url: str) -> str:
    if not url:
        return None
    if 'default' in url.lower() or 'no-headshot' in url.lower():
        return None
    return url.split('&')[0].split('?')[0]

def process_and_upsert_players(con, roster_data):
    athletes_groups = roster_data.get('athletes', [])
    if not athletes_groups:
         athletes_groups = roster_data.get('team', {}).get('athletes', [])

    players_upserted = 0

    # The web API sometimes returns a flat list of players rather than position groups
    is_flat = False
    if athletes_groups and 'id' in athletes_groups[0]:
        is_flat = True

    if is_flat:
        groups_to_process = [{"name": "SENIOR", "items": athletes_groups}]
    else:
        groups_to_process = athletes_groups

    for group in groups_to_process:
        raw_name = group.get('name')
        group_name = (raw_name.get('name', '') if isinstance(raw_name, dict) else str(raw_name or '')).upper()
        if not group_name:
            raw_pos = group.get('position')
            group_name = (raw_pos.get('name', '') if isinstance(raw_pos, dict) else str(raw_pos or '')).upper()
            
        squad_role = "ACADEMY" if "ACADEMY" in group_name or "U21" in group_name or "RESERVE" in group_name else "SENIOR"
        items = group.get('items', [])
        
        for item in items:
            espn_id = str(item.get('id'))
            if not espn_id or espn_id == 'None':
                continue
                
            full_name = item.get('fullName', '')
            
            # The web endpoint often strips headshot metadata; reconstruct the standard ESPN CDN path
            headshot_url_raw = item.get('headshot', {}).get('href', '')
            if not headshot_url_raw:
                headshot_url_raw = f"https://a.espncdn.com/i/headshots/soccer/players/full/{espn_id}.png"
            headshot_url = clean_headshot_url(headshot_url_raw)
            
            metadata = {
                "firstName": item.get('firstName'),
                "lastName": item.get('lastName'),
                "shortName": item.get('shortName'),
                "weight": item.get('displayWeight'),
                "height": item.get('displayHeight'),
                "jersey": item.get('jersey'),
                "position": item.get('position', {}).get('name'),
                "injuries": item.get('injuries', []),
                "status": item.get('status', {})
            }
            
            upsert_query = """
                INSERT INTO "Player" ("espnId", "name", "photo", "squadRole", "metadata", "updatedAt")
                VALUES (:espnId, :fullName, :headshotUrl, :squadRole, :metadata::jsonb, NOW())
                ON CONFLICT ("espnId") DO UPDATE
                SET 
                    "name" = EXCLUDED."name",
                    "photo" = COALESCE(EXCLUDED."photo", "Player"."photo"),
                    "squadRole" = EXCLUDED."squadRole",
                    "metadata" = "Player"."metadata" || EXCLUDED."metadata",
                    "updatedAt" = NOW()
            """
            
            try:
                con.run(
                    upsert_query,
                    espnId=espn_id,
                    fullName=full_name,
                    headshotUrl=headshot_url,
                    squadRole=squad_role,
                    metadata=json.dumps(metadata)
                )
                players_upserted += 1
                logger.info(f"Upserted {full_name} ({squad_role})")
            except Exception as e:
                logger.error(f"Error upserting player {full_name} ({espn_id}): {e}")
                
    logger.info(f"Successfully processed and upserted {players_upserted} players.")

def main():
    con = None
    try:
        roster_data = fetch_roster_data()
        con = get_db_connection()
        process_and_upsert_players(con, roster_data)
    except Exception as e:
        logger.error(f"Harvester script failed: {e}")
    finally:
        if con:
            con.close()

if __name__ == "__main__":
    print("\n🟢 RUNNING ESPN ROSTER HARVESTER\n" + "="*50)
    main()
    print("="*50 + "\n")
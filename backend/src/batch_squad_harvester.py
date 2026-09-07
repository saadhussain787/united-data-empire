import os
import time
import random
import json
import urllib.parse
import pg8000.native
import requests
from dotenv import load_dotenv

# Helper to traverse and find dicts with 'percentileRank' and 'title'
def extract_stats(node, radar_percentiles):
    if isinstance(node, dict):
        if "percentileRank" in node and ("title" in node or "localizedTitleId" in node):
            title = node.get("title") or node.get("localizedTitleId")
            radar_percentiles[title] = {
                "percentileRank": node.get("percentileRank"),
                "percentileRankPer90": node.get("percentileRankPer90"),
                "statValue": node.get("statValue")
            }
        for v in node.values():
            extract_stats(v, radar_percentiles)
    elif isinstance(node, list):
        for item in node:
            extract_stats(item, radar_percentiles)

# Helper to extract players from squad JSON
def extract_players_from_squad(group, squad_map):
    if isinstance(group, list):
        for item in group:
            extract_players_from_squad(item, squad_map)
    elif isinstance(group, dict):
        if 'members' in group:
            for member in group['members']:
                name = member.get('name')
                fotmob_id = member.get('id')
                if name and fotmob_id:
                    squad_map[name] = fotmob_id
        for v in group.values():
            if isinstance(v, (list, dict)):
                extract_players_from_squad(v, squad_map)

def main():
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
    
    zenrows_key = os.getenv("ZENROWS_API_KEY")
    if not zenrows_key:
        print("Error: ZENROWS_API_KEY missing in .env")
        return
        
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL missing in .env")
        return

    # 1. Smart Delta Database Query
    print("[1] Querying Un-Scraped Players...")
    parsed = urllib.parse.urlparse(db_url)
    user = parsed.username
    password = parsed.password
    host = parsed.hostname
    port = parsed.port or 5432
    database = parsed.path.lstrip('/')
    
    try:
        conn = pg8000.native.Connection(
            user=user,
            password=password,
            host=host,
            port=port,
            database=database
        )
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return

    sql_select = """
    SELECT "id", "name", "espnId", "metadata" 
    FROM "Player" 
    WHERE "squadRole" = 'SENIOR' 
      AND "isActiveSquad" = true
    ORDER BY "id" ASC;
    """
    
    players = conn.run(sql_select)
    if not players:
        print("No players awaiting harvest! All up to date.")
        conn.close()
        return
        
    print(f"Found {len(players)} players awaiting harvest.")

    # 2. Fetch Team Squad Map
    print("[2] Fetching FotMob Squad Map via ZenRows...")
    squad_res = requests.get(
        "https://api.zenrows.com/v1/",
        params={
            "apikey": zenrows_key,
            "url": "https://www.fotmob.com/api/data/teams?id=10260",
            "premium_proxy": "true"
        }
    )
    if squad_res.status_code != 200:
        print(f"Error: Squad fetch failed with status {squad_res.status_code}")
        conn.close()
        return

    squad_data = squad_res.json()
    squad_map = {}
    extract_players_from_squad(squad_data.get("squad", []), squad_map)
    print(f"Mapped {len(squad_map)} players from squad endpoint.")

    # 3. The 2-Player Test Loop
    print(f"[3] Commencing Harvest Loop for {len(players)} players...")
    
    sql_update = """
    UPDATE "Player"
    SET 
        "nationality" = COALESCE(:nationality, "nationality"),
        "preferredFoot" = COALESCE(:preferred_foot, "preferredFoot"),
        metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb) || :payload::jsonb,
            '{percentiles}', 
            :percentiles::jsonb, 
            true
        )
    WHERE "id" = :id
    RETURNING "id";
    """
    
    from datetime import datetime

    for idx, row in enumerate(players, 1):
        p_id = row[0]
        p_name = row[1]
        
        fotmob_id = squad_map.get(p_name)
        if not fotmob_id:
            print(f"Warning: Could not find FotMob ID for {p_name} in squad map. Skipping.")
            continue
            
        print(f"  -> Fetching {p_name} (ID: {fotmob_id})...")
        
        # Fetch profile
        player_res = requests.get(
            "https://api.zenrows.com/v1/",
            params={
                "apikey": zenrows_key,
                "url": f"https://www.fotmob.com/api/data/playerData?id={fotmob_id}",
                "premium_proxy": "true"
            }
        )
        
        if player_res.status_code != 200:
            print(f"  -> Error fetching {p_name}: HTTP {player_res.status_code}")
            continue
            
        player_data = player_res.json()
        
        # Extract Percentiles
        radar_percentiles = {}
        extract_stats(player_data.get("firstSeasonStats", {}), radar_percentiles)
        
        # Extract Bio
        nationality = None
        preferred_foot = None
        contract_end = None
        market_value = None

        for info in player_data.get("playerInformation", []):
            title = info.get("title", "")
            val_dict = info.get("value", {})
            fallback = val_dict.get("fallback", "")
            
            if title == "Country":
                nationality = fallback
            elif title == "Preferred foot":
                preferred_foot = fallback
            elif title == "Market value":
                market_value = fallback
            elif title == "Contract end":
                date_val = val_dict.get("dateValue")
                if not date_val and isinstance(fallback, dict):
                    utc_time = fallback.get("utcTime", "")
                    if "T" in utc_time:
                        date_val = utc_time.split("T")[0]
                if date_val:
                    try:
                        dt = datetime.strptime(date_val, "%Y-%m-%d")
                        contract_end = dt.strftime("%b %d, %Y")
                    except Exception:
                        contract_end = date_val
                        
        payload = {
            "team": "Manchester United",
            "league": "Premier League"
        }
        if contract_end:
            payload["contractEnd"] = contract_end
        if market_value:
            payload["marketValue"] = market_value
            
        # Execute DB Update
        conn.run(
            sql_update,
            id=p_id,
            nationality=nationality,
            preferred_foot=preferred_foot,
            payload=json.dumps(payload),
            percentiles=json.dumps(radar_percentiles)
        )
        
        print(f"[Test {idx}/{len(players)}] [OK] Successfully harvested {p_name} (FotMob ID: {fotmob_id}).")
        
        if idx < len(players):
            time.sleep(1.5 + random.uniform(0.5, 1.0))
            
    conn.close()
    print("[4] Harvest Complete.")

if __name__ == "__main__":
    main()

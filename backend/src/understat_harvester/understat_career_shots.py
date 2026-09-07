import json
import os
import ssl
import time
import random
import unicodedata
from urllib.parse import urlparse
import requests
import pg8000.native
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

TEAM_URL = "https://understat.com/getTeamData/Manchester_United/2026"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest"
}

def get_db_connection():
    db_url = os.getenv("DIRECT_URL") or os.getenv("DATABASE_URL")
    if not db_url:
        raise Exception("Missing DIRECT_URL or DATABASE_URL in .env")
    parsed = urlparse(db_url)
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    return pg8000.native.Connection(
        user=parsed.username,
        password=parsed.password,
        host=parsed.hostname,
        port=parsed.port or 5432,
        database=parsed.path.lstrip("/"),
        ssl_context=ssl_context
    )

def normalize(s):
    if not s:
        return ""
    s = unicodedata.normalize('NFKD', s).encode('ASCII', 'ignore').decode('utf-8')
    return s.lower().strip()

def matches_player(u_name, db_name, short_name, last_name):
    u_norm = normalize(u_name)
    n_norm = normalize(db_name)
    s_norm = normalize(short_name)
    l_norm = normalize(last_name)
    
    if u_norm == n_norm: return True
    if s_norm and u_norm == s_norm: return True
    if l_norm and u_norm == l_norm: return True
    if n_norm in u_norm or u_norm in n_norm: return True
    return False

def harvest_career_shots():
    print(f"🎯 [SCOUT 2B] Initiating Career Shot Map Harvesting...")
    
    session = requests.Session()
    
    # 1. Fetch Squad from Understat
    res = session.get(TEAM_URL, headers=HEADERS, timeout=15)
    if res.status_code != 200:
        raise Exception(f"Understat API returned status {res.status_code}")
    
    try:
        data_store = res.json()
    except Exception as e:
        raise Exception(f"Failed to parse JSON response for squad: {e}")
            
    players_data = data_store.get("players", [])
    if not players_data:
        raise Exception("Could not find players in Understat API response.")
    
    understat_players = {}
    for p in players_data:
        name = p.get("player_name")
        u_id = p.get("id")
        if name and u_id:
            understat_players[name] = u_id
            
    # 2. Match with DB
    conn = get_db_connection()
    print("🔐 Connected to Supabase Postgres Vault.")
    
    rows = conn.run('SELECT "id", "name", "metadata" FROM "Player";')
    
    matched_players = []
    for row in rows:
        db_id = row[0]
        db_name = row[1]
        metadata = row[2] if row[2] else {}
        
        short_name = metadata.get("shortName", "")
        last_name = metadata.get("lastName", "")
        
        matched_u_id = None
        for u_name, u_id in understat_players.items():
            if matches_player(u_name, db_name, short_name, last_name):
                matched_u_id = u_id
                break
                
        if matched_u_id:
            matched_players.append({
                "db_id": db_id,
                "db_name": db_name,
                "understat_id": matched_u_id
            })

    print(f"✅ Matched {len(matched_players)} players for shot harvesting.")

    # 3. Scrape and Update
    total_shots_harvested = 0
    for idx, player in enumerate(matched_players):
        db_id = player["db_id"]
        db_name = player["db_name"]
        u_id = player["understat_id"]
        
        # Stealth Jitter Delay
        if idx > 0:
            delay = 1.5 + random.uniform(0.5, 1.5)
            time.sleep(delay)
            
        player_api_url = f"https://understat.com/getPlayerData/{u_id}"
        player_res = session.get(player_api_url, headers=HEADERS, timeout=15)
        
        if player_res.status_code != 200:
            print(f"⚠️ Failed to fetch shots for {db_name} (Status: {player_res.status_code})")
            continue
            
        player_data = player_res.json()
        shots_raw = player_data.get("shots", [])
        
        normalized_shots = []
        for s in shots_raw:
            normalized_shots.append({
                "id": s.get("id"),
                "minute": s.get("minute"),
                "result": s.get("result"),
                "x": float(s.get("X", 0)) * 100,
                "y": float(s.get("Y", 0)) * 100,
                "xG": round(float(s.get("xG", 0)), 3),
                "season": s.get("season"),
                "situation": s.get("situation"),
                "shotType": s.get("shotType"),
                "date": s.get("date"),
                "h_team": s.get("h_team"),
                "a_team": s.get("a_team"),
            })
            
        # Update DB using jsonb merge
        update_payload = {"careerShots": normalized_shots}
        
        update_sql = """
        UPDATE "Player"
        SET "metadata" = COALESCE("metadata", '{}'::jsonb) || :new_metadata::jsonb
        WHERE "id" = :player_id;
        """
        
        conn.run(
            update_sql,
            new_metadata=json.dumps(update_payload),
            player_id=db_id
        )
        
        total_shots_harvested += len(normalized_shots)
        print(f"[SCOUT 2B] Harvested {len(normalized_shots)} career shots for {db_name} (ID: {u_id})")

    print(f"\n🏆 VAULT ENRICHED: {total_shots_harvested} total career shots integrated into Postgres!")
    conn.close()

if __name__ == "__main__":
    harvest_career_shots()

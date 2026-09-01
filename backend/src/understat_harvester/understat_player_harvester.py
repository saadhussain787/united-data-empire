import json
import os
import re
import ssl
import unicodedata
from urllib.parse import urlparse
import requests
import pg8000.native
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

TEAM_URL = "https://understat.com/team/Manchester_United/2026"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
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

def harvest_understat_players():
    print(f"🎯 [SCOUT 3] Intercepting Understat Team Data via API...")
    
    session = requests.Session()
    headers = HEADERS.copy()
    headers["X-Requested-With"] = "XMLHttpRequest"
    
    API_URL = "https://understat.com/getTeamData/Manchester_United/2026"
    res = session.get(API_URL, headers=headers, timeout=15)
    
    if res.status_code != 200:
        raise Exception(f"Understat returned status {res.status_code}")

    try:
        data_store = res.json()
    except Exception as e:
        raise Exception(f"Failed to parse JSON response: {e}")
            
    players_data = data_store.get("players", [])
    if not players_data:
        raise Exception("Could not find players in Understat API response.")
        
    print(f"📊 Extracted {len(players_data)} player records from Understat.")

    # Process and map stats
    understat_stats = {}
    for p in players_data:
        name = p.get("player_name")
        if not name:
            continue
        
        understat_stats[name] = {
            "apps": int(p.get("games", 0)),
            "minutes": int(p.get("time", 0)),
            "goals": int(p.get("goals", 0)),
            "assists": int(p.get("assists", 0)),
            "yc": int(p.get("yellow_cards", 0)),
            "rc": int(p.get("red_cards", 0)),
            "xG": round(float(p.get("xG", 0)), 2),
            "xA": round(float(p.get("xA", 0)), 2)
        }

    conn = get_db_connection()
    print("🔐 Connected to Supabase Postgres Vault.")
    
    # Fetch DB players
    rows = conn.run('SELECT "id", "name", "metadata" FROM "Player";')
    
    matched_count = 0
    for row in rows:
        db_id = row[0]
        db_name = row[1]
        metadata = row[2] if row[2] else {}
        
        short_name = metadata.get("shortName", "")
        last_name = metadata.get("lastName", "")
        
        # Find matching understat player
        matched_u_name = None
        for u_name in understat_stats.keys():
            if matches_player(u_name, db_name, short_name, last_name):
                matched_u_name = u_name
                break
                
        if matched_u_name:
            stats = understat_stats[matched_u_name]
            
            # JSONB Merge payload
            update_payload = {"seasonStats": stats}
            
            update_sql = """
            UPDATE "Player"
            SET "metadata" = COALESCE("metadata", '{}'::jsonb) || :new_stats::jsonb
            WHERE "id" = :player_id;
            """
            conn.run(
                update_sql,
                new_stats=json.dumps(update_payload),
                player_id=db_id
            )
            matched_count += 1
            print(f"  ✅ Matched & Updated: {db_name} <-> {matched_u_name}")
            
    print(f"\n🏆 VAULT ENRICHED: {matched_count} players updated with Understat season stats!")
    conn.close()

if __name__ == "__main__":
    harvest_understat_players()

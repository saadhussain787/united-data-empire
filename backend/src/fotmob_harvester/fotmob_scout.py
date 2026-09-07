import os
import json
import urllib.parse
import pg8000.native
import requests
from dotenv import load_dotenv

def main():
    # Load .env variables
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))
    
    # 1. Extraction Engine
    print("[1] Fetching FotMob via ZenRows...")
    fotmob_url = "https://www.fotmob.com/api/data/playerData?id=422685"
    zenrows_key = os.getenv("ZENROWS_API_KEY")
    if not zenrows_key:
        print("Error: ZENROWS_API_KEY missing in .env")
        return
        
    res = requests.get(
        "https://api.zenrows.com/v1/",
        params={
            "apikey": zenrows_key,
            "url": fotmob_url,
            "premium_proxy": "true"
        }
    )
    
    if res.status_code != 200:
        print(f"Error: ZenRows returned status code {res.status_code}")
        print(res.text)
        return
        
    data = res.json()
    
    # 2. Parser
    print("[2] Parsing JSON for Percentiles...")
    radar_percentiles = {}
    
    # Helper to traverse and find dicts with 'percentileRank' and 'title'
    def extract_stats(node):
        if isinstance(node, dict):
            if "percentileRank" in node and ("title" in node or "localizedTitleId" in node):
                title = node.get("title") or node.get("localizedTitleId")
                radar_percentiles[title] = {
                    "percentileRank": node.get("percentileRank"),
                    "percentileRankPer90": node.get("percentileRankPer90"),
                    "statValue": node.get("statValue")
                }
            for v in node.values():
                extract_stats(v)
        elif isinstance(node, list):
            for item in node:
                extract_stats(item)
                
    # Focus extraction on firstSeasonStats which contains the radar and percentile data
    extract_stats(data.get("firstSeasonStats", {}))
    
    print(f"Extracted {len(radar_percentiles)} percentile metrics.")
    
    # 3. Database Injection
    print("[3] Connecting to Supabase DB & Injecting...")
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL missing in .env")
        return
        
    # parse postgres://user:pass@host:port/db?args
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
        
        # Idempotent JSONB Merge
        # jsonb_set(COALESCE(metadata, '{}'::jsonb), '{percentiles}', :percentiles::jsonb, true)
        sql = """
        UPDATE "Player"
        SET metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb), 
            '{percentiles}', 
            :percentiles::jsonb, 
            true
        )
        WHERE "espnId" = '124091'
        RETURNING "espnId";
        """
        
        percentiles_json = json.dumps(radar_percentiles)
        
        result = conn.run(sql, percentiles=percentiles_json)
        conn.close()
        
        if result:
            print("[4] Success! metadata->percentiles updated for Bruno Fernandes (espnId='124091').")
        else:
            print("[4] Warning: Update ran, but no rows were modified. Ensure espnId '124091' exists in Player table.")
        
    except Exception as e:
        print(f"DB Error: {e}")

if __name__ == "__main__":
    main()

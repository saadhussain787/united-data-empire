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
    
    print("[2B] Parsing Bio Information...")
    nationality = None
    preferred_foot = None
    contract_end = None
    market_value = None
    
    from datetime import datetime

    for info in data.get("playerInformation", []):
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
                    
    bio_metadata = {}
    if contract_end:
        bio_metadata["contractEnd"] = contract_end
    if market_value:
        bio_metadata["marketValue"] = market_value
    
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
        sql = """
        UPDATE "Player"
        SET 
            "nationality" = COALESCE(:nationality, "nationality"),
            "preferredFoot" = COALESCE(:preferred_foot, "preferredFoot"),
            metadata = jsonb_set(
                COALESCE(metadata, '{}'::jsonb) || :bio_metadata::jsonb,
                '{percentiles}', 
                :percentiles::jsonb, 
                true
            )
        WHERE "espnId" = '124091'
        RETURNING "espnId";
        """
        
        percentiles_json = json.dumps(radar_percentiles)
        bio_metadata_json = json.dumps(bio_metadata)
        
        result = conn.run(
            sql, 
            percentiles=percentiles_json, 
            nationality=nationality,
            preferred_foot=preferred_foot,
            bio_metadata=bio_metadata_json
        )
        conn.close()
        
        if result:
            print("[4] Success! Nationality, foot, and metadata updated for Bruno Fernandes.")
        else:
            print("[4] Warning: Update ran, but no rows were modified. Ensure espnId '124091' exists in Player table.")
        
    except Exception as e:
        print(f"DB Error: {e}")

if __name__ == "__main__":
    main()

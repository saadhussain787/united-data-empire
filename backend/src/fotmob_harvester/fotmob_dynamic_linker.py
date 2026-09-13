import os
import json
import ssl
from urllib.parse import urlparse
from datetime import datetime
import pg8000.native
import requests
from dotenv import load_dotenv

# Import the harvest_match function from fotmob_match_harvester
from fotmob_match_harvester import harvest_match

def get_db_connection():
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))
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

def run_fotmob_linker():
    print("\n🟢 RUNNING DYNAMIC FOTMOB LINKER 🟢\n" + "="*55)
    
    conn = get_db_connection()
    
    # We want FT matches where season=2026, we don't have fotmob teamStats yet,
    # AND we already have the fotmob_id seeded in matchContext.
    query = """
    SELECT "id", "date", "homeTeamName", "awayTeamName", "matchContext"->>'fotmob_id' as fotmob_id
    FROM "Match"
    WHERE "status" = 'FT'
      AND "season" = 2026
      AND ("teamStats" IS NULL OR "teamStats"::text NOT LIKE '%fotmob%')
      AND "matchContext"->>'fotmob_id' IS NOT NULL
    ORDER BY "date" DESC;
    """
    
    matches = conn.run(query)
    
    if not matches:
        print("✅ No missing FotMob matches found.")
        conn.close()
        return

    print(f"🔍 Found {len(matches)} matches needing FotMob data enrichment.")
        
    processed_count = 0
    for row in matches:
        db_id, dt, h_name, a_name, fotmob_id_str = row
        
        target_date_str = dt.isoformat() if hasattr(dt, 'isoformat') else str(dt)
        target_date = target_date_str[:10]
        
        print(f"\n⚡ Processing Match ID {db_id}: {h_name} vs {a_name} ({target_date})")
        print(f"  🎯 Using Pre-Seeded FotMob Match #{fotmob_id_str}")
        
        if fotmob_id_str:
            try:
                harvest_match(fotmob_id_str)
                processed_count += 1
            except Exception as e:
                print(f"  ❌ Error running FotMob harvester for match #{fotmob_id_str}: {e}")
        else:
            print(f"  ❌ FotMob ID is empty for Match {db_id}.")

    conn.close()
    print(f"\n🎉 Finished. Enriched {processed_count} matches with FotMob stats.")

if __name__ == "__main__":
    run_fotmob_linker()

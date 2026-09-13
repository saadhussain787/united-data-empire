import os
import json
import ssl
from urllib.parse import urlparse
from datetime import datetime
import pg8000.native
import requests
from dotenv import load_dotenv

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

def fetch_fotmob_fixtures():
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))
    print("  🔍 Fetching ALL Man Utd Team Fixtures from FotMob via ZenRows...")
    zenrows_key = os.getenv("ZENROWS_API_KEY")
    if not zenrows_key:
        print("  ❌ ZENROWS_API_KEY missing in .env")
        return []
        
    res = requests.get(
        "https://api.zenrows.com/v1/",
        params={
            "apikey": zenrows_key,
            "url": "https://www.fotmob.com/api/data/teams?id=10260",
            "premium_proxy": "true"
        },
        timeout=60
    )
    
    if res.status_code != 200:
        print(f"  ❌ ZenRows returned {res.status_code}")
        return []
        
    try:
        data = res.json()
        return data.get("fixtures", {}).get("allFixtures", {}).get("fixtures", [])
    except Exception as e:
        print(f"  ❌ Error parsing ZenRows response: {e}")
        return []

def seed_fotmob_ids():
    print("\nRUNNING FOTMOB BULK ID SEEDER\n" + "="*55)
    
    fotmob_fixtures = fetch_fotmob_fixtures()
    if not fotmob_fixtures:
        print("  Failed to get FotMob fixtures. Aborting.")
        return
        
    conn = get_db_connection()
    
    # We want ALL matches for the 2026 season where we haven't stored the fotmob_id yet
    query = """
    SELECT "id", "date", "homeTeamName", "awayTeamName", "matchContext"
    FROM "Match"
    WHERE "season" = 2026
      AND ("matchContext" IS NULL OR "matchContext"->>'fotmob_id' IS NULL)
    ORDER BY "date" DESC;
    """
    
    matches = conn.run(query)
    
    if not matches:
        print("✅ No matches missing FotMob IDs found.")
        conn.close()
        return

    print(f"🔍 Found {len(matches)} matches in DB to map against {len(fotmob_fixtures)} FotMob fixtures.")
    
    updated_count = 0
    for row in matches:
        db_id, dt, h_name, a_name, match_context = row
        
        target_date_str = dt.isoformat() if hasattr(dt, 'isoformat') else str(dt)
        target_date = target_date_str[:10]
        
        try:
            target_dt = datetime.strptime(target_date, "%Y-%m-%d")
        except ValueError:
            print(f"  ❌ Invalid date format: {target_date}")
            continue
            
        is_home = "United" in h_name or "Man Utd" in h_name
        opponent_espn_name = a_name if is_home else h_name
        
        matched_fotmob_id = None
        for f in fotmob_fixtures:
            # We don't check for 'FT' here because we want to map future matches too!
            f_time_str = f.get('status', {}).get('utcTime', '')[:10]
            if not f_time_str:
                continue
                
            try:
                f_dt = datetime.strptime(f_time_str, "%Y-%m-%d")
            except ValueError:
                continue
                
            # Date tolerance +/- 2 days for timezone/rescheduling issues
            if abs((target_dt - f_dt).days) <= 2:
                f_home = f.get('home', {}).get('name', '')
                f_away = f.get('away', {}).get('name', '')
                
                f_opponent = f_away if is_home else f_home
                
                # Simple loose string matching for opponent
                if f_opponent.lower() in opponent_espn_name.lower() or opponent_espn_name.lower() in f_opponent.lower() or f_opponent.split()[0].lower() in opponent_espn_name.lower():
                    matched_fotmob_id = f.get('id')
                    break
                    
        if matched_fotmob_id:
            print(f"  🎯 Match ID {db_id} ({target_date} vs {opponent_espn_name}) -> FotMob #{matched_fotmob_id}")
            
            # Prepare new matchContext
            ctx = match_context if match_context else {}
            if isinstance(ctx, str):
                ctx = json.loads(ctx)
            
            ctx['fotmob_id'] = matched_fotmob_id
            
            # Update DB
            update_q = """
            UPDATE "Match"
            SET "matchContext" = :ctx
            WHERE "id" = :id
            """
            conn.run(update_q, ctx=json.dumps(ctx), id=db_id)
            updated_count += 1
        else:
            print(f"  ❌ No matching FotMob fixture found for Match ID {db_id} ({target_date} vs {opponent_espn_name}).")

    conn.close()
    print(f"\n🎉 Finished. Seeded {updated_count} matches with their FotMob Match IDs.")

if __name__ == "__main__":
    seed_fotmob_ids()

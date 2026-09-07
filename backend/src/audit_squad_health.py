import os
import sys
import json
import urllib.parse
import pg8000.native
from dotenv import load_dotenv

# Fix Windows console emoji encoding issues
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')

def main():
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL missing in .env")
        return

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
    SELECT "id", "name", "espnId", "nationality", "preferredFoot", "metadata" 
    FROM "Player" 
    WHERE "squadRole" = 'SENIOR' 
      AND "isActiveSquad" = true 
    ORDER BY "id" ASC;
    """
    
    players = conn.run(sql_select)
    conn.close()

    if not players:
        print("No active senior players found.")
        return

    print("=" * 125)
    print(f"{'PLAYER NAME':<25} | {'NATION':<15} | {'FOOT':<10} | {'CONTRACT':<15} | {'VALUE':<10} | {'STATS':<5} | {'RADAR':<5} | {'SHOT MAP'}")
    print("=" * 125)

    count_total = len(players)
    count_nat_foot = 0
    count_market_contract = 0
    count_radar = 0
    total_shots_vault = 0

    for row in players:
        p_id = row[0]
        name = row[1]
        espnId = row[2]
        nat = row[3]
        foot = row[4]
        meta = row[5] or {}
        
        # Determine Statuses
        str_nat = f"✅ {nat}" if nat else "⚠️ None"
        str_foot = f"✅ {foot}" if foot else "⚠️ None"
        
        contract = meta.get("contractEnd")
        str_contract = f"✅ {contract}" if contract else "⚠️ None"
        
        value = meta.get("marketValue")
        str_value = f"✅ {value}" if value else "⚠️ None"
        
        season = meta.get("seasonStats", {})
        has_season = "✅ Yes" if season and ("games" in season or "apps" in season or "time" in season) else "⚠️ No"
        
        percentiles = meta.get("percentiles", {})
        radar_count = len(percentiles) if isinstance(percentiles, dict) else 0
        str_radar = f"✅ {radar_count}" if radar_count > 0 else "⚠️ 0"
        
        shots = meta.get("careerShots", [])
        shots_count = len(shots) if isinstance(shots, list) else 0
        str_shots = f"🎯 {shots_count}" if shots_count > 0 else "0"
        
        # Update metrics
        if nat and foot:
            count_nat_foot += 1
        if contract and value:
            count_market_contract += 1
        if radar_count > 0:
            count_radar += 1
        total_shots_vault += shots_count

        # Truncate strings for table formatting
        name_trunc = name[:24]
        nat_trunc = str_nat[:14]
        foot_trunc = str_foot[:9]
        contract_trunc = str_contract[:14]
        value_trunc = str_value[:9]
        
        print(f"{name_trunc:<25} | {nat_trunc:<15} | {foot_trunc:<10} | {contract_trunc:<15} | {value_trunc:<10} | {has_season:<5} | {str_radar:<5} | {str_shots}")

    print("=" * 125)
    print("\nEXECUTIVE SUMMARY SCORECARD")
    print("-" * 35)
    print(f"Total Senior Squad Count             : {count_total}")
    
    pct_nat = (count_nat_foot / count_total) * 100 if count_total else 0
    print(f"Verified Nationality & Foot          : {pct_nat:.1f}% ({count_nat_foot}/{count_total})")
    
    pct_market = (count_market_contract / count_total) * 100 if count_total else 0
    print(f"Market Values & Contract Dates       : {pct_market:.1f}% ({count_market_contract}/{count_total})")
    
    pct_radar = (count_radar / count_total) * 100 if count_total else 0
    print(f"Active 360° Radar Percentiles        : {pct_radar:.1f}% ({count_radar}/{count_total})")
    
    print(f"Total Career Shot Coordinates Vaulted: 🎯 {total_shots_vault}")
    print("-" * 35)

if __name__ == "__main__":
    main()

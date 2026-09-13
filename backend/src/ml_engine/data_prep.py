import os
import pandas as pd
import json
import urllib.parse as up
import ssl
import pg8000.native
from dotenv import load_dotenv

# Load env variables
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.env"))
load_dotenv(env_path)

def get_db_connection():
    db_url = os.getenv("DIRECT_URL") or os.getenv("DATABASE_URL")
    if not db_url:
        raise Exception("Missing DIRECT_URL or DATABASE_URL in .env")
    parsed = up.urlparse(db_url)
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

def fetch_historical_metrics():
    print("Fetching historical match metrics...")
    conn = get_db_connection()
    
    # Step 2: Query the last 100 matches for Manchester United
    query = """
    SELECT "id", "date", "homeTeamId", "homeTeamName", "awayTeamId", "awayTeamName", "teamStats", "homeScore", "awayScore"
    FROM "Match"
    WHERE "status" = 'FT'
      AND ("homeTeamName" LIKE '%Manchester United%' OR "awayTeamName" LIKE '%Manchester United%')
      AND "teamStats" IS NOT NULL
    ORDER BY "date" DESC
    LIMIT 100;
    """
    
    rows = conn.run(query)
    conn.close()
    
    data = []
    
    for row in rows:
        match_id, date, home_id, home_name, away_id, away_name, team_stats, home_score, away_score = row
        
        is_home = "Manchester United" in home_name
        utd_id = str(home_id) if is_home else str(away_id)
        opp_id = str(away_id) if is_home else str(home_id)
        
        if isinstance(team_stats, str):
            try:
                stats = json.loads(team_stats)
            except:
                continue
        else:
            stats = team_stats
            
        if not stats or utd_id not in stats or opp_id not in stats:
            continue
            
        utd_stats = stats[utd_id]
        opp_stats = stats[opp_id]
        
        # Step 3: Extract xG, PPDA, deep completions
        utd_xg = float(utd_stats.get("expectedGoals", 0))
        opp_xg = float(opp_stats.get("expectedGoals", 0))
        
        utd_ppda = float(utd_stats.get("ppda", 0))
        opp_ppda = float(opp_stats.get("ppda", 0))
        
        utd_deep = int(utd_stats.get("deepCompletions", 0))
        opp_deep = int(opp_stats.get("deepCompletions", 0))
        
        # Determine match result
        utd_score = home_score if is_home else away_score
        opp_score = away_score if is_home else home_score
        
        # Step 4: Label Data (Win = 1, Draw/Loss = 0)
        win = 1 if utd_score > opp_score else 0
        
        data.append({
            "match_id": match_id,
            "date": date,
            "opponent": away_name if is_home else home_name,
            "is_home": int(is_home),
            "utd_xg": utd_xg,
            "opp_xg": opp_xg,
            "xg_diff": utd_xg - opp_xg,
            "utd_ppda": utd_ppda,
            "opp_ppda": opp_ppda,
            "utd_deep": utd_deep,
            "opp_deep": opp_deep,
            "win": win
        })
        
    df = pd.DataFrame(data)
    print(f"Constructed DataFrame with {len(df)} valid matches.")
    return df

if __name__ == "__main__":
    df = fetch_historical_metrics()
    print(df.head())

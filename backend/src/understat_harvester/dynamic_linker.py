import json
import os
import re
import ssl
import time
import random
from urllib.parse import urlparse
import requests
import pg8000.native
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

# ESPN Name to Understat Slug Mapping
TEAM_MAPPING = {
    "Arsenal": "Arsenal",
    "Aston Villa": "Aston_Villa",
    "Bournemouth": "Bournemouth",
    "Brentford": "Brentford",
    "Brighton & Hove Albion": "Brighton",
    "Brighton": "Brighton",
    "Chelsea": "Chelsea",
    "Crystal Palace": "Crystal_Palace",
    "Everton": "Everton",
    "Fulham": "Fulham",
    "Ipswich Town": "Ipswich",
    "Leicester City": "Leicester",
    "Liverpool": "Liverpool",
    "Manchester City": "Manchester_City",
    "Manchester United": "Manchester_United",
    "Man Utd": "Manchester_United",
    "Newcastle United": "Newcastle_United",
    "Nottingham Forest": "Nottingham_Forest",
    "Southampton": "Southampton",
    "Tottenham Hotspur": "Tottenham",
    "Spurs": "Tottenham",
    "West Ham United": "West_Ham",
    "Wolverhampton Wanderers": "Wolverhampton_Wanderers",
    "Wolves": "Wolverhampton_Wanderers",
    "Hull City": "Hull",
    "Burnley": "Burnley",
    "Luton Town": "Luton",
    "Sheffield United": "Sheffield_United",
    "Leeds United": "Leeds"
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive"
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

def stealth_delay():
    delay = random.uniform(1.5, 3.5)
    print(f"  [Stealth] Waiting {delay:.2f}s...")
    time.sleep(delay)

def get_understat_match_id(session, espn_home_team, espn_away_team, match_date_str, season="2026"):
    slug = TEAM_MAPPING.get(espn_home_team)
    is_home = True
    
    if not slug:
        slug = TEAM_MAPPING.get(espn_away_team)
        is_home = False
        
    if not slug:
        print(f"  ❌ Cannot map either {espn_home_team} or {espn_away_team} to Understat slug.")
        return None
        
    print(f"  🔍 Querying Understat schedule for {slug} (Season {season})...")
    stealth_delay()
    
    url = f"https://understat.com/getTeamData/{slug}/{season}"
    headers = HEADERS.copy()
    headers["X-Requested-With"] = "XMLHttpRequest"
    res = session.get(url, headers=headers, timeout=15)
    
    if res.status_code != 200:
        print(f"  ❌ Failed to fetch team page for {slug}")
        return None
        
    try:
        dates_data = res.json().get("dates", [])
    except Exception as e:
        print(f"  ❌ Error parsing datesData API response: {e}")
        return None
        
    target_date = match_date_str[:10] 
    
    for match in dates_data:
        if not match.get("isResult"):
            continue
            
        understat_date = match.get("datetime", "")[:10]
        
        if target_date == understat_date:
            return match.get("id")
            
    print(f"  ❌ No matching fixture found for date {target_date}.")
    return None

def extract_match_data(session, match_id):
    print(f"  ⚡ Fetching Understat Match Page #{match_id}...")
    stealth_delay()
    
    # 1. Get Match Info from HTML Page
    html_url = f"https://understat.com/match/{match_id}"
    res_html = session.get(html_url, headers=HEADERS, timeout=15)
    if res_html.status_code != 200:
        raise Exception(f"Understat HTML returned status {res_html.status_code}")
        
    all_json_vars = re.findall(r"(?:var\s+)?(\w+)\s*=\s*JSON\.parse\('([^']+)'\)", res_html.text)
    data_store = {}
    for var_name, hex_content in all_json_vars:
        try:
            decoded_str = hex_content.encode("utf-8").decode("unicode_escape")
            data_store[var_name] = json.loads(decoded_str)
        except Exception:
            pass
            
    match_info_raw = data_store.get("match_info") or {}
    
    # 2. Get Shots Data from API
    stealth_delay()
    api_url = f"https://understat.com/getMatchData/{match_id}"
    api_headers = HEADERS.copy()
    api_headers["X-Requested-With"] = "XMLHttpRequest"
    res_api = session.get(api_url, headers=api_headers, timeout=15)
    if res_api.status_code != 200:
        raise Exception(f"Understat API returned status {res_api.status_code}")
        
    try:
        api_data = res_api.json()
        shots_raw = api_data.get("shots", {})
    except Exception:
        shots_raw = {}
    
    # Process shots
    all_shots = []
    if isinstance(shots_raw, dict):
        for team_key in ["h", "a"]:
            for s in shots_raw.get(team_key, []):
                all_shots.append({
                    "id": s.get("id"),
                    "minute": int(s.get("minute", 0)),
                    "result": s.get("result", "Miss"),
                    "x": round(float(s.get("X", 0)) * 100, 1),
                    "y": round(float(s.get("Y", 0)) * 100, 1),
                    "xG": round(float(s.get("xG", 0)), 3),
                    "player": s.get("player", "Unknown Player"),
                    "team": "home" if team_key == "h" else "away",
                    "situation": s.get("situation", "OpenPlay"),
                    "shotType": s.get("shotType", "RightFoot"),
                    "assistedBy": s.get("player_assisted", None)
                })
                
    # Process match info (PPDA, DEEP, xG)
    def parse_ppda(p):
        if isinstance(p, dict) and p.get("def") and int(p.get("def")) > 0:
            return round(float(p.get("att", 0)) / float(p.get("def")), 2)
        elif isinstance(p, (int, float, str)):
            try:
                return round(float(p), 2)
            except:
                pass
        return None
        
    def extract_metrics(team_key, info_dict):
        metrics = {}
        if not info_dict: return metrics
        
        # In the API structure we observed, the stats are flat keys like "h_xg", "a_ppda"
        if f"{team_key}_xg" in info_dict: 
            metrics["expectedGoals"] = round(float(info_dict[f"{team_key}_xg"]), 3)
        if f"{team_key}_ppda" in info_dict: 
            metrics["ppda"] = round(float(info_dict[f"{team_key}_ppda"]), 2)
        if f"{team_key}_deep" in info_dict: 
            metrics["deepCompletions"] = info_dict[f"{team_key}_deep"]
            
        # Calculate xPTS (Expected Points) based on win/draw/loss probabilities
        try:
            if team_key == "h":
                w = float(info_dict.get("h_w", 0))
                d = float(info_dict.get("h_d", 0))
                metrics["xpts"] = round((w * 3) + (d * 1), 2)
            else:
                # For the away team, home loss is away win
                w = float(info_dict.get("h_l", 0))
                d = float(info_dict.get("h_d", 0))
                metrics["xpts"] = round((w * 3) + (d * 1), 2)
        except Exception:
            pass
            
        return metrics

    home_stats = extract_metrics("h", match_info_raw)
    away_stats = extract_metrics("a", match_info_raw)
    
    return all_shots, home_stats, away_stats

def run_dynamic_linker():
    print("\n🟢 RUNNING DYNAMIC UNDERSTAT LINKER 🟢\n" + "="*55)
    conn = get_db_connection()
    
    query = """
    SELECT "id", "apiFixtureId", "date", "homeTeamId", "homeTeamName", "awayTeamId", "awayTeamName", "teamStats"
    FROM "Match"
    WHERE "status" = 'FT'
      AND "season" = 2026
      AND ("shotData" IS NULL OR "shotData"::text = '[]' OR "shotData"::text = '{}')
    ORDER BY "date" DESC;
    """
    
    matches = conn.run(query)
    print(f"🔍 Found {len(matches)} matches needing spatial data enrichment.")
    
    session = requests.Session()
    
    processed_count = 0
    for row in matches:
        db_id, fixture_id, dt, h_id, h_name, a_id, a_name, existing_stats = row
        dt_str = dt.isoformat() if hasattr(dt, 'isoformat') else str(dt)
        print(f"\n⚡ Processing Match ID {db_id}: {h_name} vs {a_name} ({dt_str[:10]})")
        
        understat_id = get_understat_match_id(session, h_name, a_name, dt_str, season="2026")
        
        if not understat_id:
            print(f"  ❌ Skipping. Could not find Understat ID.")
            continue
            
        print(f"  🎯 Mapped to Understat Match #{understat_id}")
        
        try:
            shots, u_home_stats, u_away_stats = extract_match_data(session, understat_id)
            
            # Safely parse existing stats into a Python dictionary to prevent Blind Overwrite Bug
            if isinstance(existing_stats, str):
                try:
                    stats = json.loads(existing_stats)
                except Exception:
                    stats = {}
            elif isinstance(existing_stats, dict):
                stats = dict(existing_stats) # copy to avoid reference mutation
            else:
                stats = {}
                
            h_id_str = str(h_id)
            a_id_str = str(a_id)
            
            if h_id_str not in stats: stats[h_id_str] = {}
            if a_id_str not in stats: stats[a_id_str] = {}
            
            for k, v in u_home_stats.items():
                stats[h_id_str][k] = str(v)
            for k, v in u_away_stats.items():
                stats[a_id_str][k] = str(v)
                
            update_sql = """
            UPDATE "Match"
            SET "shotData" = :shots::jsonb,
                "teamStats" = :stats::jsonb,
                "updatedAt" = NOW()
            WHERE "id" = :match_id;
            """
            
            conn.run(
                update_sql,
                shots=json.dumps(shots),
                stats=json.dumps(stats),
                match_id=db_id
            )
            print(f"  ✅ DB Updated! Shots: {len(shots)}, Home xG: {u_home_stats.get('expectedGoals', '?')}, Away xG: {u_away_stats.get('expectedGoals', '?')}")
            processed_count += 1
            
        except Exception as e:
            print(f"  ❌ Error processing Understat match #{understat_id}: {e}")
            
    conn.close()
    print(f"\n🎉 Finished. Enriched {processed_count} matches.")

if __name__ == "__main__":
    run_dynamic_linker()

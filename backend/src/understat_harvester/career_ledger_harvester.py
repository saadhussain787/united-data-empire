import os
import json
import requests
import pg8000.native
from dotenv import load_dotenv

def resolve_comp(club_name):
    # A simple mapping of clubs to leagues for the top players
    premier_league = ["Manchester United", "Brentford", "Leicester", "Aston Villa", "Arsenal", "Chelsea", "Liverpool", "Manchester City", "Tottenham", "Everton", "Newcastle United"]
    la_liga = ["Barcelona", "Atlético", "Real Madrid", "Sevilla", "Valencia"]
    serie_a = ["AC Milan", "Udinese", "Juventus", "Inter", "Napoli", "Roma", "Sampdoria"]
    ligue_1 = ["Monaco", "Troyes", "PSG", "Lyon", "Marseille", "Lille"]
    bundesliga = ["Leipzig", "Bayern Munich", "Borussia Dortmund", "Bayer Leverkusen"]
    
    # Clean up club name for matching just in case
    c = club_name.strip()
    
    if c in premier_league: return "Premier League"
    if c in la_liga: return "La Liga"
    if c in serie_a: return "Serie A"
    if c in ligue_1: return "Ligue 1"
    if c in bundesliga: return "Bundesliga"
    
    # Sporting CP, etc.
    if c == "Sporting CP": return "Primeira Liga"
    if c == "Ajax": return "Eredivisie"
    
    return "Top Flight"

def fetch_understat_team():
    url = "https://understat.com/getTeamData/Manchester_United/2026"
    session = requests.Session()
    session.headers.update({"X-Requested-With": "XMLHttpRequest"})
    
    print(f"Fetching squad from {url}...")
    response = session.get(url)
    if not response.ok:
        print(f"Failed to fetch team data: {response.status_code}")
        return []
    
    data = response.json()
    players = data.get("players", [])
    return players

def fetch_player_career(player_id, session):
    url = f"https://understat.com/getPlayerData/{player_id}"
    response = session.get(url)
    if not response.ok:
        print(f"Failed to fetch player data for ID {player_id}: {response.status_code}")
        return None
    
    data = response.json()
    season_data = data.get("groups", {}).get("season", [])
    
    career_history = []
    for s in season_data:
        try:
            apps = int(s.get("games", 0))
            mins = int(s.get("time", 0))
            goals = int(s.get("goals", 0))
            assists = int(s.get("assists", 0))
            
            xG = float(s.get("xG", 0.0))
            xA = float(s.get("xA", 0.0))
            
            delta_xG = goals - xG
            delta_xA = assists - xA
            
            format_delta = lambda d: f"+{d:.2f}" if d > 0 else f"{d:.2f}"
            
            club = s.get("team", "")
            comp = resolve_comp(club)
            
            career_history.append({
                "season": s.get("season"),
                "club": club,
                "comp": comp,
                "apps": apps,
                "mins": mins,
                "goals": goals,
                "assists": assists,
                "xG_str": f"{xG:.2f} ({format_delta(delta_xG)})",
                "xA_str": f"{xA:.2f} ({format_delta(delta_xA)})"
            })
        except Exception as e:
            print(f"Error parsing season row: {e}")
            
    # Sort newest on top
    career_history.sort(key=lambda x: str(x["season"]), reverse=True)
    return career_history

def main():
    # Load .env
    env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
    load_dotenv(env_path)
    
    db_url = os.getenv("DIRECT_URL") or os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DIRECT_URL or DATABASE_URL missing in .env")
        return
        
    print("[1] Connecting to Database...")
    import urllib.parse
    parsed = urllib.parse.urlparse(db_url)
    db_password = urllib.parse.unquote(parsed.password) if parsed.password else None
    
    db = pg8000.native.Connection(
        user=parsed.username,
        password=db_password,
        host=parsed.hostname,
        port=parsed.port,
        database=parsed.path.lstrip('/')
    )
    print("Connected to Postgres.")

    players = fetch_understat_team()
    if not players:
        print("No players found.")
        return
        
    print(f"Found {len(players)} players. Processing the first 2...")
    
    session = requests.Session()
    session.headers.update({"X-Requested-With": "XMLHttpRequest"})
    
    for p in players[:2]:
        understat_id = p.get("id")
        player_name = p.get("player_name")
        
        print(f"\n--- Player: {player_name} (Understat ID: {understat_id}) ---")
        
        career = fetch_player_career(understat_id, session)
        if career is None:
            print("Failed to fetch career data.")
            continue
            
        print(f"Extracted {len(career)} career seasons for {player_name}.")
        
        # Match player in Database by name or partial name
        # Understat uses e.g. "Bruno Fernandes", "Bryan Mbeumo". 
        # In our DB they are "Bruno Fernandes", "Bryan Mbeumo".
        query = """
        SELECT "id", "name", "metadata" 
        FROM "Player" 
        WHERE "name" ILIKE :name OR "metadata"->>'shortName' ILIKE :name
        LIMIT 1
        """
        db_match = db.run(query, name=f"%{player_name}%")
        
        if not db_match:
            print(f"Could not find '{player_name}' in Postgres database. Skipping.")
            continue
            
        db_id = db_match[0][0]
        db_name = db_match[0][1]
        print(f"Matched DB Player: {db_name} (ID: {db_id})")
        
        # JSONB merge
        update_query = """
        UPDATE "Player" 
        SET "metadata" = "metadata" || jsonb_build_object('careerHistory', :career_history::jsonb) 
        WHERE "id" = :player_id
        """
        
        db.run(update_query, career_history=json.dumps(career), player_id=db_id)
        print(f"Successfully injected career history for {db_name} into Postgres.")
        
    db.close()
    print("\nNano-Step 1B completed successfully!")

if __name__ == "__main__":
    main()

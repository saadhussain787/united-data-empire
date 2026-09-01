import json
import os
import ssl
from urllib.parse import urlparse
from datetime import datetime
import requests
import pg8000.native
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

MAN_UTD_ID = "360"
SCHEDULE_ENDPOINT = f"https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams/{MAN_UTD_ID}/schedule?season=2026"
SUMMARY_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary"

HEADERS = {
    "Accept": "application/json",
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

def fetch_match_summary(match_id, session, home_id, away_id):
    try:
        url = f"{SUMMARY_BASE_URL}?event={match_id}"
        res = session.get(url, headers=HEADERS, timeout=10)
        if res.status_code != 200:
            return [], [], [], [], {}
        
        data = res.json()
        
        home_scorers, away_scorers, cards, substitutions = [], [], [], []
        
        # 1. Parse Goals
        details = data.get("header", {}).get("competitions", [{}])[0].get("details", [])
        for d in details:
            event_type = d.get("type", {}).get("text", "").lower()
            event_text = d.get("text", "").lower()
            
            if "goal" in event_type or d.get("scoringPlay"):
                # Grab ONLY the first participant (The Scorer)
                participants = d.get("participants", [])
                if not participants:
                    continue
                scorer_name = participants[0].get("athlete", {}).get("shortName", "Unknown Player")
                
                # Check for Own Goal flag
                is_own_goal = d.get("ownGoal", False) or "own goal" in event_text or "own goal" in event_type
                display_name = f"(OG) {scorer_name}" if is_own_goal else scorer_name
                
                # ESPN already assigns the team.id to the team that gets the point! NO FLIPPING!
                target_team_id = str(d.get("team", {}).get("id", ""))
                
                clock_str = d.get("clock", {}).get("displayValue", "")
                if not clock_str:
                    clock_str = d.get("text", "")
                    
                minute_list = [m.strip() for m in clock_str.split(",")]
                
                for minute in minute_list:
                    if not minute:
                        continue
                    goal_item = {"player": display_name, "minute": minute, "text": d.get("text", "")}
                    
                    if target_team_id == str(home_id):
                        home_scorers.append(goal_item)
                    else:
                        away_scorers.append(goal_item)
                    
        # 2. Parse Cards & Subs
        raw_events = data.get("keyEvents", [])
        for e in raw_events:
            event_type = e.get("type", {}).get("text", "").lower()
            team_id = str(e.get("team", {}).get("id", ""))
            clock = e.get("clock", {}).get("displayValue", "0'")
            event_text = e.get("text", "")
            
            participants = [p.get("athlete", {}).get("displayName") for p in e.get("participants", []) if p.get("athlete")]
            player_name = participants[0] if participants else "Unknown Player"
            
            if "card" in event_type or "yellow" in event_type or "red" in event_type:
                cards.append({"player": player_name, "minute": clock, "type": e.get("type", {}).get("text", "Card"), "teamId": team_id})
            elif "sub" in event_type or "substitution" in event_type:
                substitutions.append({"minute": clock, "text": event_text, "teamId": team_id})
                
        # 3. Parse Team Stats
        team_stats = {}
        for b_team in data.get("boxscore", {}).get("teams", []):
            t_id = str(b_team.get("team", {}).get("id"))
            stats_list = b_team.get("statistics", [])
            stats_dict = {s.get("name"): s.get("displayValue") for s in stats_list}
            team_stats[t_id] = stats_dict
            
        return home_scorers, away_scorers, cards, substitutions, team_stats
    except Exception as e:
        print(f"⚠️ Warning: Could not parse deep summary for {match_id}: {str(e)}")
        return [], [], [], [], {}

def sync_espn_to_database():
    session = requests.Session()
    print(f"[SCOUT 1] Intercepting Master Schedule (Past/Current)...")
    response_past = session.get(SCHEDULE_ENDPOINT, headers=HEADERS, timeout=15)
    
    if response_past.status_code != 200:
        raise Exception(f"ESPN Scout failed with status code: {response_past.status_code}")
        
    print(f"[SCOUT 2] Intercepting Master Schedule (Future)...")
    response_future = session.get(SCHEDULE_ENDPOINT + "&fixture=true", headers=HEADERS, timeout=15)
    
    if response_future.status_code != 200:
        raise Exception(f"ESPN Scout failed with status code: {response_future.status_code}")
    
    past_events = response_past.json().get("events", [])
    future_events = response_future.json().get("events", [])
    
    # Combine and deduplicate just in case
    all_events = past_events + future_events
    unique_events = {str(e['id']): e for e in all_events}.values()
    events = list(unique_events)
    conn = get_db_connection()
    print("Connected to Supabase Postgres Vault.")
    
    synced_count = 0
    
    for event in events:
        espn_id = int(event.get("id"))
        date_str = event.get("date")
        match_date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        
        competitions = event.get("competitions", [])
        if not competitions:
            continue
            
        comp = competitions[0]
        venue_name = comp.get("venue", {}).get("fullName", "Old Trafford")
        status_type = comp.get("status", {}).get("type", {}).get("name", "STATUS_SCHEDULED")
        status_short = "FT" if status_type == "STATUS_FULL_TIME" else ("LIVE" if status_type in ["STATUS_IN_PROGRESS", "STATUS_HALFTIME"] else "NS")
        
        competitors = comp.get("competitors", [])
        home_team, away_team = {}, {}
        for c in competitors:
            team_info = {
                "id": int(c.get("id", 0)),
                "name": c.get("team", {}).get("displayName", "Unknown Team"),
                "logo": c.get("team", {}).get("logos", [{}])[0].get("href", "") if c.get("team", {}).get("logos") else "",
                "score": int(c.get("score", {}).get("value", 0)) if c.get("score") and c.get("score", {}).get("value") is not None else 0
            }
            if c.get("homeAway") == "home":
                home_team = team_info
            else:
                away_team = team_info
                
        home_scorers, away_scorers, cards, substitutions, team_stats = [], [], [], [], {}
        if status_short in ["FT", "LIVE"]:
            home_scorers, away_scorers, cards, substitutions, team_stats = fetch_match_summary(
                espn_id, session, home_team["id"], away_team["id"]
            )
            
        upsert_sql = """
        INSERT INTO "Match" (
            "apiFixtureId", "date", "competition", "venue", "season", "status", "statusLong",
            "homeTeamId", "homeTeamName", "homeTeamLogo", "homeScore",
            "awayTeamId", "awayTeamName", "awayTeamLogo", "awayScore",
            "homeGoalscorers", "awayGoalscorers", "cards", "substitutions", "teamStats",
            "createdAt", "updatedAt"
        )
        VALUES (
            :fixture_id, :date, :comp, :venue, 2026, :status, :status_long,
            :home_id, :home_name, :home_logo, :home_score,
            :away_id, :away_name, :away_logo, :away_score,
            :home_scorers::jsonb, :away_scorers::jsonb, :cards::jsonb, :subs::jsonb, :stats::jsonb,
            NOW(), NOW()
        )
        ON CONFLICT ("apiFixtureId") DO UPDATE SET
            "homeScore" = EXCLUDED."homeScore",
            "awayScore" = EXCLUDED."awayScore",
            "status" = EXCLUDED."status",
            "statusLong" = EXCLUDED."statusLong",
            "homeGoalscorers" = EXCLUDED."homeGoalscorers",
            "awayGoalscorers" = EXCLUDED."awayGoalscorers",
            "cards" = EXCLUDED."cards",
            "substitutions" = EXCLUDED."substitutions",
            "teamStats" = EXCLUDED."teamStats",
            "updatedAt" = NOW()
        """
        try:
            conn.run(
                upsert_sql,
                fixture_id=espn_id, date=match_date, comp=comp.get("league", {}).get("description", "Premier League"),
                venue=venue_name, status=status_short, status_long=status_type,
                home_id=home_team["id"], home_name=home_team["name"], home_logo=home_team["logo"], home_score=home_team["score"],
                away_id=away_team["id"], away_name=away_team["name"], away_logo=away_team["logo"], away_score=away_team["score"],
                home_scorers=json.dumps(home_scorers), away_scorers=json.dumps(away_scorers),
                cards=json.dumps(cards), subs=json.dumps(substitutions), stats=json.dumps(team_stats)
            )
            synced_count += 1
        except Exception as e:
            print(f"Error saving match {espn_id}: {e}")
            
    conn.close()
    return synced_count

if __name__ == "__main__":
    print("\n[RUNNING ESPN DATA REFRESH (BUG FIX VERSION)]\n" + "="*50)
    count = sync_espn_to_database()
    print(f"Refresh complete. Synced {count} matches.")
    print("="*50 + "\n")
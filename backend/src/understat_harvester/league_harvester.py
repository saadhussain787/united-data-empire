import json
import os
from playwright.sync_api import sync_playwright

def parse_league_table(raw_teams_data):
    parsed_table = []
    
    for team_id, team in raw_teams_data.items():
        team_name = team.get('title')
        history = team.get('history', [])
        
        played = len(history)
        wins = sum(1 for m in history if m['result'] == 'w')
        draws = sum(1 for m in history if m['result'] == 'd')
        losses = sum(1 for m in history if m['result'] == 'l')
        goalsFor = sum(int(m['scored']) for m in history)
        goalsAgainst = sum(int(m['missed']) for m in history)
        actualPoints = sum(int(m['pts']) for m in history)
        xgFor = sum(float(m['xG']) for m in history)
        xgAgainst = sum(float(m['xGA']) for m in history)
        xPts = sum(float(m['xpts']) for m in history)
        
        xPtsDelta = xPts - actualPoints
        
        parsed_table.append({
            'team': team_name,
            'played': played,
            'wins': wins,
            'draws': draws,
            'losses': losses,
            'goalsFor': goalsFor,
            'goalsAgainst': goalsAgainst,
            'xgFor': round(xgFor, 2),
            'xgAgainst': round(xgAgainst, 2),
            'actualPoints': actualPoints,
            'xPts': round(xPts, 2),
            'xPtsDelta': round(xPtsDelta, 2)
        })
        
    parsed_table.sort(key=lambda x: x['xPts'], reverse=True)
    return parsed_table

def parse_unsung_heroes(raw_players_data):
    united_players = []
    
    for player in raw_players_data:
        if player.get('team_title') == 'Manchester United':
            player_name = player.get('player_name')
            position = player.get('position')
            games = int(player.get('games', 0))
            minutes = int(player.get('time', 0))
            goals = int(player.get('goals', 0))
            assists = int(player.get('assists', 0))
            xG = round(float(player.get('xG', 0)), 2)
            xA = round(float(player.get('xA', 0)), 2)
            xGChain = round(float(player.get('xGChain', 0)), 2)
            xGBuildup = round(float(player.get('xGBuildup', 0)), 2)
            
            buildupPer90 = round((xGBuildup / minutes) * 90, 2) if minutes >= 45 else 0.0
            chainPer90 = round((xGChain / minutes) * 90, 2) if minutes >= 45 else 0.0
            
            united_players.append({
                'player_name': player_name,
                'position': position,
                'games': games,
                'minutes': minutes,
                'goals': goals,
                'assists': assists,
                'xG': xG,
                'xA': xA,
                'xGChain': xGChain,
                'xGBuildup': xGBuildup,
                'buildupPer90': buildupPer90,
                'chainPer90': chainPer90
            })
            
    united_players.sort(key=lambda x: x['xGBuildup'], reverse=True)
    return united_players

def parse_finishing_efficiency(raw_players_data):
    efficiency_data = []
    
    for player in raw_players_data:
        shots = int(player.get('shots', 0))
        minutes = int(player.get('time', 0))
        
        if shots >= 2 or minutes >= 60:
            player_name = player.get('player_name')
            team_title = player.get('team_title')
            isUnited = team_title == 'Manchester United'
            goals = int(player.get('goals', 0))
            npGoals = int(player.get('npg', 0))
            npXG = round(float(player.get('npxG', 0)), 2)
            
            finishingDelta = round(npGoals - npXG, 2)
            finishingRatio = round(npGoals / npXG, 2) if npXG > 0 else 1.0
            
            efficiency_data.append({
                'player_name': player_name,
                'team_title': team_title,
                'isUnited': isUnited,
                'shots': shots,
                'goals': goals,
                'npGoals': npGoals,
                'npXG': npXG,
                'finishingDelta': finishingDelta,
                'finishingRatio': finishingRatio
            })
            
    efficiency_data.sort(key=lambda x: x['npXG'], reverse=True)
    return efficiency_data

def harvest_understat():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://understat.com/league/EPL", wait_until="networkidle")
        
        teams_data = page.evaluate("teamsData")
        players_data = page.evaluate("playersData")
        
        print(f"Bypassed Cloudflare! Extracted {len(teams_data)} teams and {len(players_data)} players.")
        
        # Save raw data
        raw_output_file = "backend/src/understat_harvester/epl_league_table.json"
        with open(raw_output_file, "w", encoding="utf-8") as f:
            json.dump(teams_data, f, indent=4)
        print(f"Saved raw data to {raw_output_file}")
            
        # Parse and aggregate data
        parsed_data = parse_league_table(teams_data)
        
        # Save parsed data
        frontend_data_dir = "frontend/src/data"
        os.makedirs(frontend_data_dir, exist_ok=True)
        parsed_output_file = os.path.join(frontend_data_dir, "epl_moneyball_table.json")
        with open(parsed_output_file, "w", encoding="utf-8") as f:
            json.dump(parsed_data, f, indent=4)
        print(f"Saved parsed data to {parsed_output_file}")
        
        # Print top 3 teams
        print("\nTop 3 Teams by xPTS:")
        for i, team in enumerate(parsed_data[:3]):
            print(f"{i+1}. {team['team']} - xPTS: {team['xPts']}")
        
        
        # Unsung heroes logic
        unsung_heroes = parse_unsung_heroes(players_data)
        
        unsung_output_file = os.path.join(frontend_data_dir, "unsung_heroes.json")
        with open(unsung_output_file, "w", encoding="utf-8") as f:
            json.dump(unsung_heroes, f, indent=4)
        print(f"Saved unsung heroes data to {unsung_output_file}")
        
        print("\nTop 3 United Players by xGBuildup:")
        for i, player in enumerate(unsung_heroes[:3]):
            print(f"{i+1}. {player['player_name']} - xGBuildup: {player['xGBuildup']}")
        
        # Finishing efficiency logic
        finishing_efficiency = parse_finishing_efficiency(players_data)
        
        finishing_output_file = os.path.join(frontend_data_dir, "finishing_efficiency.json")
        with open(finishing_output_file, "w", encoding="utf-8") as f:
            json.dump(finishing_efficiency, f, indent=4)
        print(f"Saved finishing efficiency data to {finishing_output_file}")
        
        print(f"\nTotal eligible shooters parsed: {len(finishing_efficiency)}")
        
        # Find top United finisher by npXG
        united_shooters = [p for p in finishing_efficiency if p['isUnited']]
        if united_shooters:
            top_united = united_shooters[0]
            print(f"Top United finisher by npXG: {top_united['player_name']} (npXG: {top_united['npXG']}, Delta: {top_united['finishingDelta']})")

        browser.close()

if __name__ == "__main__":
    harvest_understat()

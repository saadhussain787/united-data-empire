import pandas as pd
from statsbombpy import sb
import sys
import json
import os

# Append parent dir so we can import ml_engine modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from ml_engine.data_prep import get_db_connection

def init_statsbomb():
    print("Initializing StatsBomb Open Data Connection...")
    # StatsBomb open data requires no authentication keys for its free datasets.
    try:
        # Fetch available competitions as a test
        comps = sb.competitions()
        print(f"Successfully connected to StatsBomb! Found {len(comps)} open competitions.")
        
        # Display a sample of competitions to verify
        print("\nSample Competitions:")
        print(comps[['competition_id', 'competition_name', 'season_name']].head())
        return True
    except Exception as e:
        print(f"Error connecting to StatsBomb: {e}")
        return False

def fetch_match_passes(match_id):
    print(f"Fetching events for StatsBomb Match #{match_id}...")
    try:
        # Fetch all events for the match
        events = sb.events(match_id=match_id)
        
        # Filter for only pass events
        passes = events[events['type'] == 'Pass']
        print(f"Successfully retrieved {len(passes)} passes from the match.")
        
        # Display sample pass columns to see what data we have
        
        return passes
    except Exception as e:
        print(f"Error fetching match passes: {e}")
        return None

def generate_pass_network(passes_df, target_team):
    print(f"Generating pass network for {target_team}...")
    
    # Filter for the specific team
    team_passes = passes_df[passes_df['team'] == target_team].copy()
    
    if team_passes.empty:
        print(f"No passes found for {target_team}.")
        return None
        
    print(f"Found {len(team_passes)} passes for {target_team}.")
    
    # We only want successful passes (usually pass_outcome is NaN for successful passes in StatsBomb)
    if 'pass_outcome' in team_passes.columns:
        team_passes = team_passes[team_passes['pass_outcome'].isna()]
    
    # Extract X and Y coordinates from the 'location' list [x, y]
    # StatsBomb pitch is 120x80.
    team_passes['x'] = team_passes['location'].apply(lambda loc: loc[0] if isinstance(loc, list) and len(loc) >= 2 else 0)
    team_passes['y'] = team_passes['location'].apply(lambda loc: loc[1] if isinstance(loc, list) and len(loc) >= 2 else 0)
    
    # 1. Calculate Average Position (Nodes)
    # Group by player to get average x, y and total passes made
    avg_positions = team_passes.groupby('player').agg(
        avg_x=('x', 'mean'),
        avg_y=('y', 'mean'),
        total_passes=('player', 'count')
    ).reset_index()
    
    nodes = []
    for _, row in avg_positions.iterrows():
        nodes.append({
            "id": row['player'],
            "name": row['player'],
            "x": round(row['avg_x'], 2),
            "y": round(row['avg_y'], 2),
            "value": int(row['total_passes'])
        })
        
    # 2. Calculate Pass Combinations (Links)
    # Group by player (passer) and pass_recipient
    pass_combos = team_passes.groupby(['player', 'pass_recipient']).size().reset_index(name='pass_count')
    
    # Filter out combinations with very few passes to keep network clean
    min_passes = 3
    pass_combos = pass_combos[pass_combos['pass_count'] >= min_passes]
    
    links = []
    for _, row in pass_combos.iterrows():
        links.append({
            "source": row['player'],
            "target": row['pass_recipient'],
            "value": int(row['pass_count'])
        })
        
    network_data = {
        "nodes": nodes,
        "links": links
    }
    
    print(f"Network generated: {len(nodes)} nodes, {len(links)} links.")
    return network_data

def push_pass_network_to_db(match_id, network_data):
    print(f"Pushing pass network to DB for Match #{match_id}...")
    try:
        conn = get_db_connection()
        
        # Fetch existing teamStats
        query = 'SELECT "teamStats" FROM "Match" WHERE "id" = :match_id'
        rows = conn.run(query, match_id=match_id)
        if not rows:
            print(f"Match #{match_id} not found in database.")
            conn.close()
            return
            
        existing_stats = rows[0][0]
        if isinstance(existing_stats, str):
            try:
                stats = json.loads(existing_stats)
            except Exception:
                stats = {}
        elif isinstance(existing_stats, dict):
            stats = dict(existing_stats)
        else:
            stats = {}
            
        stats["pass_network"] = network_data
        
        update_sql = '''
        UPDATE "Match"
        SET "teamStats" = :stats::jsonb
        WHERE "id" = :match_id;
        '''
        conn.run(update_sql, stats=json.dumps(stats), match_id=match_id)
        conn.close()
        print("Successfully pushed pass network to DB!")
    except Exception as e:
        print(f"Error pushing to DB: {e}")

if __name__ == "__main__":
    success = init_statsbomb()
    if not success:
        sys.exit(1)
        
    # StatsBomb has the 2018 World Cup Final (France vs Croatia) as open data, Match ID: 8658
    # We use this as a test match to grab passes
    passes = fetch_match_passes(8658)
    
    if passes is not None:
        network = generate_pass_network(passes, target_team="France")
        if network:
            print("\nSample Node:")
            print(network["nodes"][0])
            print("Sample Link:")
            print(network["links"][0])
            
            # Use a dummy ID or existing Match ID for the push (e.g. 692, the Ipswich match)
            push_pass_network_to_db(692, network)

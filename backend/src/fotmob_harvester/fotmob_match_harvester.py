import argparse
import sys
import os
import requests
import ssl
from urllib.parse import urlparse
import pg8000.native
from dotenv import load_dotenv
import json

# Fix Windows terminal encoding for emoji output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

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
        port=parsed.port,
        database=parsed.path.lstrip("/"),
        ssl_context=ssl_context
    )

def fetch_fotmob_data(match_id):
    """
    Step 1.2 & 1.3: Hit the FotMob API using ZenRows to bypass anti-bot blocks.
    """
    url = f"https://www.fotmob.com/api/data/matchDetails?matchId={match_id}"
    zenrows_key = os.getenv("ZENROWS_API_KEY")
    
    if not zenrows_key:
        print("❌ Error: ZENROWS_API_KEY missing from environment.")
        return None

    proxy_url = "https://api.zenrows.com/v1/"
    params = {
        "apikey": os.getenv("ZENROWS_API_KEY"),
        "url": url,
        "premium_proxy": "true",
    }
    
    headers = {
        "Accept": "application/json"
    }

    try:
        print(f"📡 Fetching data via ZenRows from: {url}")
        response = requests.get(proxy_url, params=params, headers=headers, timeout=60)
        
        if response.status_code == 200:
            print("✅ Successfully bypassed Cloudflare and connected to FotMob API.")
            try:
                return response.json()
            except Exception as e:
                print(f"❌ JSON Parse Error (FotMob returned HTML instead of API JSON): {e}")
                print(f"Response prefix: {response.text[:200]}")
                return None
        else:
            print(f"❌ Error: API returned status code {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        return None

def process_team_stats(conn, db_match_id, data):
    """
    Step 1.4: Parse team stats and inject them into Match.teamStats
    """
    print("📊 [1.4] Parsing Team Stats...")
    try:
        # FotMob structure usually has 'content' -> 'stats' -> 'Periods'
        # For safety, we will just grab the raw stats block and update the JSON
        content = data.get('content', {})
        stats = content.get('stats', {})
        
        if not stats:
            print("⚠️ No stats found in JSON.")
            return
            
        update_sql = """
        UPDATE "Match"
        SET "teamStats" = jsonb_set(
            COALESCE("teamStats", '{}'::jsonb),
            '{fotmob}',
            :fotmob_stats::jsonb,
            true
        )
        WHERE "id" = :match_id;
        """
        conn.run(update_sql, fotmob_stats=json.dumps(stats), match_id=db_match_id)
        print("✅ Team Stats successfully injected into the database.")
    except Exception as e:
        print(f"❌ Error processing team stats: {e}")

def process_attacking_zones(conn, db_match_id, data):
    """
    Step 1.7: Extract Match Attacking Zones from FotMob data and upsert into Match.teamStats.
    """
    print("⚽ [1.7] Parsing Attacking Zones...")
    try:
        content = data.get('content', {})
        stats = content.get('stats', {})
        periods = stats.get('Periods', {})
        all_stats = periods.get('All', {})
        stat_categories = all_stats.get('stats', [])
        
        attacking_zones = None
        for category in stat_categories:
            for item in category.get('stats', []):
                if item.get('key') == 'attacking_zones' or item.get('title') == 'Attacking zones':
                    attacking_zones = item
                    break
            if attacking_zones:
                break
                
        if not attacking_zones:
            print("  No attacking zones found.")
            return
            
        stats_array = attacking_zones.get('stats', [])
        if not stats_array or len(stats_array) < 3:
            print("  Attacking zones data is incomplete.")
            return
            
        home_total = {'left': 0, 'center': 0, 'right': 0}
        away_total = {'left': 0, 'center': 0, 'right': 0}
        
        for zone_stat in stats_array:
            title = zone_stat.get('title', '').lower()
            vals = zone_stat.get('stats', [0, 0])
            if 'left' in title:
                home_total['left'] = vals[0]
                away_total['left'] = vals[1]
            elif 'center' in title or 'middle' in title:
                home_total['center'] = vals[0]
                away_total['center'] = vals[1]
            elif 'right' in title:
                home_total['right'] = vals[0]
                away_total['right'] = vals[1]
                
        zone_data = {
            "home": home_total,
            "away": away_total
        }
        
        update_sql = """
        UPDATE "Match"
        SET "teamStats" = jsonb_set(
            COALESCE("teamStats", '{}'::jsonb),
            '{attackingZones}',
            :zones::jsonb,
            true
        )
        WHERE "id" = :match_id;
        """
        conn.run(update_sql, zones=json.dumps(zone_data), match_id=db_match_id)
        print("✅ Attacking Zones successfully injected into the database.")
    except Exception as e:
        print(f"❌ Error processing attacking zones: {e}")

def _extract_stat(stats_list, key, default=0):
    """Helper to extract a stat value by key from FotMob's player stats array."""
    for item in stats_list or []:
        if item.get('key') == key:
            val = item.get('value')
            try:
                return float(val) if val is not None else default
            except (ValueError, TypeError):
                return default
    return default

def process_player_stats(conn, match_id, db_match_id, data):
    """
    Step 1.5: Parse FotMob player lineup and stats, then upsert into MatchStat.
    
    Correct FotMob structure (discovered via inspection):
    - content.lineup.homeTeam.starters  → list of player objects
    - content.lineup.homeTeam.subs      → list of sub player objects
    - content.lineup.awayTeam.starters  → same
    - content.lineup.awayTeam.subs      → same
    Each player: { id, name, shirtNumber, performance.rating, ... }
    
    - content.playerStats  → dict keyed by fotmob_player_id
    Each entry: { name, id, stats: [{key, value, ...}] }
    """
    print("🏃 [1.5] Parsing Player Stats & Lineups...")
    try:
        content = data.get('content', {})
        lineup_data = content.get('lineup', {})
        player_stats_dict = content.get('playerStats', {})

        home_team = lineup_data.get('homeTeam', {})
        away_team = lineup_data.get('awayTeam', {})

        if not home_team and not away_team:
            print("⚠️ No lineup found in JSON.")
            return

        upserted = 0
        skipped = 0

        # Fetch team IDs from DB to assign to MatchStat
        db_match_info = conn.run(
            'SELECT "homeTeamId", "awayTeamId" FROM "Match" WHERE id = :mid',
            mid=db_match_id
        )
        home_team_id, away_team_id = db_match_info[0] if db_match_info else (0, 0)

        all_players = []
        for team_data, is_home in [(home_team, True), (away_team, False)]:
            starters = team_data.get('starters', [])
            subs = team_data.get('subs', [])
            for p in starters:
                all_players.append((p, is_home, True))
            for p in subs:
                all_players.append((p, is_home, False))

        for player_entry, is_home, is_starter in all_players:
            player_name = player_entry.get('name', '').strip()
            if not player_name:
                skipped += 1
                continue

            fotmob_pid = str(player_entry.get('id', ''))
            
            ps_entry = player_stats_dict.get(fotmob_pid, {})
            with open('fotmob_ps_entry.json', 'a') as f:
                f.write(json.dumps(ps_entry) + "\n")

            # Get rating from performance block in lineup
            perf = player_entry.get('performance', {})
            rating = float(perf.get('rating', 0) or 0)

            # Get detailed stats from playerStats dict
            ps_entry = player_stats_dict.get(fotmob_pid, {})
            detailed_stats = ps_entry.get('stats', [])
            # detailed_stats is a list of sections: [{title, key, stats: {label: {key, stat: {value, total}}}}]
            # Build a flat lookup: stat_key -> value
            stat_lookup = {}
            stat_total_lookup = {}
            for section in (detailed_stats if isinstance(detailed_stats, list) else []):
                section_stats = section.get('stats', {}) if isinstance(section, dict) else {}
                for label, stat_entry in section_stats.items():
                    if isinstance(stat_entry, dict):
                        skey = stat_entry.get('key')
                        sval = stat_entry.get('stat', {})
                        if skey and isinstance(sval, dict):
                            stat_lookup[skey] = sval.get('value', 0)
                            stat_lookup[label] = sval.get('value', 0)  # also index by label
                            stat_total_lookup[skey] = sval.get('total', 0)

            def get_stat(key, default=0):
                val = stat_lookup.get(key, default)
                try:
                    return float(val) if val is not None else default
                except (ValueError, TypeError):
                    return default

            minutes_played     = int(get_stat('Minutes played', 0))
            goals              = int(get_stat('goals', 0))
            assists            = int(get_stat('assists', 0))
            shots_total        = int(get_stat('total_shots', 0))
            shots_on_target    = int(get_stat('ShotsOnTarget', 0))
            passes_accurate    = int(get_stat('accurate_passes', 0))
            passes_total_acc   = stat_total_lookup.get('accurate_passes', 0) or 0
            passes_total       = int(passes_accurate + (passes_total_acc - passes_accurate))
            if passes_total == 0:
                passes_total = passes_accurate  # fallback
            passes_key         = int(get_stat('chances_created', 0))
            pass_accuracy_raw  = stat_lookup.get('accurate_passes', None)
            pass_acc_total     = stat_total_lookup.get('accurate_passes', 0)
            pass_accuracy      = round((passes_accurate / pass_acc_total * 100), 1) if pass_acc_total > 0 else 0.0
            tackles            = int(get_stat('matchstats.headers.tackles', 0))
            interceptions      = int(get_stat('interceptions', 0))
            blocks_val         = int(get_stat('blocked_shots', 0) + get_stat('shot_blocks', 0))
            duels_won          = int(get_stat('duel_won', 0))
            duels_total        = int(duels_won + get_stat('duel_lost', 0))
            yellow_cards       = int(get_stat('Yellow cards', 0))
            red_cards          = int(get_stat('Red cards', 0))
            xg_val             = float(get_stat('expected_goals', 0.0))
            xa_val             = float(get_stat('expected_assists', 0.0))
            progressive_passes = int(get_stat('passes_into_final_third', 0))
            progressive_carries = int(get_stat('dribbles_succeeded', 0))
            long_balls         = int(get_stat('long_balls_accurate', 0))
            crosses            = int(get_stat('accurate_crosses', 0))
            clearances         = int(get_stat('clearances', 0))

            # Map position
            pos_map = {0: 'GK', 1: 'DEF', 2: 'MID', 3: 'ATT'}
            usual_pos_id = player_entry.get('usualPlayingPositionId')
            
            # Use 'Sub' if they are not a starter. Otherwise map usual_pos_id.
            if not is_starter:
                role_str = 'Sub'
            else:
                role_str = pos_map.get(usual_pos_id, '-')

            raw_json = json.dumps({
                'fotmob_player_id': fotmob_pid,
                'fotmob_player_name': player_name,
                'shirt': player_entry.get('shirtNumber'),
                'positionId': player_entry.get('positionId'),
                'role': role_str,
                'positionStringShort': role_str,
                'teamId': home_team_id if is_home else away_team_id,
                'totalDistance': perf.get('totalDistanceCovered'),
                'topSpeed': perf.get('topSpeed'),
                'passesAccurate': passes_accurate,
                'longBalls': long_balls,
                'crosses': crosses,
                'clearances': clearances,
                'detailed_stats': detailed_stats
            })

            # Try to match Player in DB by name
            player_rows = conn.run(
                'SELECT id FROM "Player" WHERE LOWER(name) = LOWER(:pname) LIMIT 1',
                pname=player_name
            )
            player_id = player_rows[0][0] if player_rows else None

            # Upsert by fotmob_player_id in rawStatsJson
            existing = conn.run(
                """SELECT id FROM "MatchStat" 
                   WHERE "matchId" = :mid 
                   AND "rawStatsJson"->>'fotmob_player_id' = :fpid
                   LIMIT 1""",
                mid=db_match_id, fpid=fotmob_pid
            )

            if existing:
                stat_id = existing[0][0]
                conn.run(
                    """UPDATE "MatchStat" SET
                        "playerId"           = :pid,
                        "minutes"            = :mins,
                        "rating"             = :rating,
                        "goals"              = :goals,
                        "assists"            = :assists,
                        "shotsTotal"         = :shots_total,
                        "shotsOnTarget"      = :shots_on,
                        "passesTotal"        = :passes_total,
                        "passesKey"          = :passes_key,
                        "passAccuracy"       = :pass_acc,
                        "tackles"            = :tackles,
                        "interceptions"      = :interceptions,
                        "blocks"             = :blocks,
                        "duelsTotal"         = :duels_total,
                        "duelsWon"           = :duels_won,
                        "yellowCards"        = :yellow,
                        "redCards"           = :red,
                        "xG"                 = :xg,
                        "xA"                 = :xa,
                        "progressivePasses"  = :prog_passes,
                        "progressiveCarries" = :prog_carries,
                        "rawStatsJson"       = :raw::jsonb,
                        "updatedAt"          = NOW()
                    WHERE id = :sid""",
                    pid=player_id, mins=minutes_played, rating=rating,
                    goals=goals, assists=assists, shots_total=shots_total,
                    shots_on=shots_on_target, passes_total=passes_total,
                    passes_key=passes_key, pass_acc=pass_accuracy,
                    tackles=tackles, interceptions=interceptions, blocks=blocks_val,
                    duels_total=duels_total, duels_won=duels_won,
                    yellow=yellow_cards, red=red_cards, xg=xg_val, xa=xa_val,
                    prog_passes=progressive_passes, prog_carries=progressive_carries,
                    raw=raw_json, sid=stat_id
                )
            else:
                conn.run(
                    """INSERT INTO "MatchStat" (
                        "matchId", "playerId", "minutes", "rating",
                        "goals", "assists", "shotsTotal", "shotsOnTarget",
                        "passesTotal", "passesKey", "passAccuracy",
                        "tackles", "interceptions", "blocks",
                        "duelsTotal", "duelsWon",
                        "yellowCards", "redCards",
                        "xG", "xA",
                        "progressivePasses", "progressiveCarries",
                        "rawStatsJson", "createdAt", "updatedAt"
                    ) VALUES (
                        :mid, :pid, :mins, :rating,
                        :goals, :assists, :shots_total, :shots_on,
                        :passes_total, :passes_key, :pass_acc,
                        :tackles, :interceptions, :blocks,
                        :duels_total, :duels_won,
                        :yellow, :red,
                        :xg, :xa,
                        :prog_passes, :prog_carries,
                        :raw::jsonb, NOW(), NOW()
                    )""",
                    mid=db_match_id, pid=player_id, mins=minutes_played, rating=rating,
                    goals=goals, assists=assists, shots_total=shots_total,
                    shots_on=shots_on_target, passes_total=passes_total,
                    passes_key=passes_key, pass_acc=pass_accuracy,
                    tackles=tackles, interceptions=interceptions, blocks=blocks_val,
                    duels_total=duels_total, duels_won=duels_won,
                    yellow=yellow_cards, red=red_cards, xg=xg_val, xa=xa_val,
                    prog_passes=progressive_passes, prog_carries=progressive_carries,
                    raw=raw_json
                )

            upserted += 1
            linked = "linked" if player_id else "unlinked"
            print(f"   {'G' if goals else ' '} {player_name} | {rating:.1f} | Mins:{minutes_played} G:{goals} A:{assists} | {linked}")

        print(f"\n[OK] {upserted} MatchStat rows upserted. {skipped} skipped.")

    except Exception as e:
        import traceback
        print(f"[ERROR] process_player_stats: {e}")
        traceback.print_exc()


def process_attacking_zones(conn, match_id, data):
    """
    Step 1.7: Parse attackingZones from FotMob and store in Match.teamStats.
    Structure: content.attackingZones.home.total.{left, center, right}
    """
    print("[1.7] Parsing Attacking Zones...")
    try:
        content = data.get('content', {})
        zones = content.get('attackingZones', {})
        
        if not zones:
            print("  No attacking zones found.")
            return

        conn.run(
            """
            UPDATE "Match"
            SET "teamStats" = jsonb_set(
                COALESCE("teamStats", '{}'::jsonb),
                '{attackingZones}',
                :zones::jsonb,
                true
            )
            WHERE "apiFixtureId" = :mid
            """,
            zones=json.dumps(zones),
            mid=int(match_id)
        )
        home_total = zones.get('home', {}).get('total', {})
        away_total = zones.get('away', {}).get('total', {})
        print(f"  Home zones: L:{home_total.get('left')} C:{home_total.get('center')} R:{home_total.get('right')}")
        print(f"  Away zones: L:{away_total.get('left')} C:{away_total.get('center')} R:{away_total.get('right')}")
        print("[OK] Attacking Zones stored in teamStats.")
    except Exception as e:
        import traceback
        print(f"[ERROR] process_attacking_zones: {e}")
        traceback.print_exc()


def process_match_context(conn, db_match_id, data):
    """
    Step 1.6: Parse match context (Referee name, stadium capacity, weather)
    and save it to a new JSON column `Match.matchContext`.
    """
    print("🏟️ [1.6] Parsing Match Context...")
    try:
        content = data.get('content', {})
        match_facts = content.get('matchFacts', {})
        
        if not match_facts:
            print("⚠️ No match context found in JSON.")
            return
            
        update_sql = """
        UPDATE "Match"
        SET "matchContext" = :context::jsonb
        WHERE "id" = :match_id;
        """
        conn.run(update_sql, context=json.dumps(match_facts), match_id=db_match_id)
        print("✅ Match Context parsed and simulated DB Upsert ready.")
    except Exception as e:
        print(f"❌ Error processing match context: {e}")

def harvest_match(match_id):
    """
    Main function to harvest FotMob data for a specific match.
    """
    print(f"\n========================================")
    print(f"🚀 Initializing FotMob Harvester for Match ID: {match_id}")
    print(f"========================================\n")
    
    # Execute Steps 1.2 & 1.3
    data = fetch_fotmob_data(match_id)
    
    if not data:
        print("⚠️ Aborting harvest due to API failure.")
        return
        
    print("[1.3] Data successfully fetched. Ready for parsing (Steps 1.4 & 1.5).")
    
    # Just to verify, let's print some top-level keys
    print(f"🔑 Top-level keys found: {list(data.keys())}")
    
    # Connect to DB
    print("🔌 Connecting to database...")
    try:
        conn = get_db_connection()
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return
        
    # Name-based match lookup
    general = data.get('content', {}).get('general', {})
    if not general:
        # Fallback if general is in root
        general = data.get('general', {})
    home_team_name = general.get('homeTeam', {}).get('name', '')
    away_team_name = general.get('awayTeam', {}).get('name', '')

    rows = conn.run(
        'SELECT id FROM "Match" WHERE "apiFixtureId" = :mid',
        mid=int(match_id)
    )
    if not rows and home_team_name:
        rows = conn.run(
            """SELECT id FROM "Match" 
               WHERE (LOWER("homeTeamName") LIKE LOWER(:home) OR LOWER("awayTeamName") LIKE LOWER(:home))
               AND (LOWER("homeTeamName") LIKE LOWER(:away) OR LOWER("awayTeamName") LIKE LOWER(:away))
               ORDER BY ABS(EXTRACT(EPOCH FROM ("date" - NOW()))) ASC
               LIMIT 1""",
            home=f"%{home_team_name.split()[0]}%",
            away=f"%{away_team_name.split()[0]}%"
        )
        if rows:
            print(f"  Matched via team names: {home_team_name} vs {away_team_name}")

    if not rows:
        print(f"[WARN] No Match found in DB for FotMob ID={match_id} or team names. Aborting.")
        conn.close()
        return
    db_match_id = rows[0][0]
    print(f"  Using DB Match id={db_match_id}")

    # Execute Step 1.4
    process_team_stats(conn, db_match_id, data)
    
    # Execute Step 1.5
    process_player_stats(conn, match_id, db_match_id, data)
    
    # Execute Step 1.6
    process_match_context(conn, db_match_id, data)

    # Execute Step 1.7
    process_attacking_zones(conn, db_match_id, data)
    
    # Close connection
    conn.close()
    print("\n[DONE] Harvest Complete!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="FotMob Match Data Harvester")
    parser.add_argument("match_id", type=int, help="The FotMob Match ID to scrape (e.g. 5795432)")
    
    # Parse arguments
    args = parser.parse_args()
    
    harvest_match(args.match_id)

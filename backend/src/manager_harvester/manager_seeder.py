import os
import pg8000.native
from urllib.parse import urlparse
from dotenv import load_dotenv

def seed_managers():
    # The Hardcoded Post-Ferguson Ledger
    managers_data = [
        {
            'name': 'Rúben Amorim', 'totalMatches': 0, 'wins': 0, 'draws': 0, 'losses': 0,
            'preferredShape': '3-4-2-1', 'appointedDate': '2024-11-11', 'leftDate': None,
            'isCurrent': True, 'photo': 'https://a.espncdn.com/i/headshots/soccer/players/full/80208.png'
        },
        {
            'name': 'Erik ten Hag', 'totalMatches': 128, 'wins': 72, 'draws': 20, 'losses': 36,
            'preferredShape': '4-2-3-1', 'appointedDate': '2022-05-23', 'leftDate': '2024-10-28',
            'isCurrent': False, 'photo': 'https://a.espncdn.com/i/headshots/soccer/managers/full/8122.png'
        },
        {
            'name': 'Ole Gunnar Solskjær', 'totalMatches': 168, 'wins': 91, 'draws': 37, 'losses': 40,
            'preferredShape': '4-2-3-1', 'appointedDate': '2018-12-19', 'leftDate': '2021-11-21',
            'isCurrent': False, 'photo': 'https://a.espncdn.com/i/headshots/soccer/players/full/11796.png'
        },
        {
            'name': 'José Mourinho', 'totalMatches': 144, 'wins': 84, 'draws': 32, 'losses': 28,
            'preferredShape': '4-3-3', 'appointedDate': '2016-05-27', 'leftDate': '2018-12-18',
            'isCurrent': False, 'photo': 'https://a.espncdn.com/i/headshots/soccer/managers/full/152.png'
        },
        {
            'name': 'Louis van Gaal', 'totalMatches': 103, 'wins': 54, 'draws': 25, 'losses': 24,
            'preferredShape': '3-5-2', 'appointedDate': '2014-07-16', 'leftDate': '2016-05-23',
            'isCurrent': False, 'photo': 'https://a.espncdn.com/i/headshots/soccer/managers/full/156.png'
        },
        {
            'name': 'David Moyes', 'totalMatches': 51, 'wins': 27, 'draws': 9, 'losses': 15,
            'preferredShape': '4-2-3-1', 'appointedDate': '2013-07-01', 'leftDate': '2014-04-22',
            'isCurrent': False, 'photo': 'https://a.espncdn.com/i/headshots/soccer/managers/full/148.png'
        }
    ]

    # Database Connection
    load_dotenv(os.path.join(os.path.dirname(__file__), '../../../.env'))
    db_url = os.environ.get('DIRECT_URL') or os.environ.get('DATABASE_URL')
    
    if not db_url:
        print("No DATABASE_URL or DIRECT_URL found in .env")
        return

    parsed = urlparse(db_url)
    try:
        conn = pg8000.native.Connection(
            user=parsed.username,
            password=parsed.password,
            host=parsed.hostname,
            port=parsed.port or 5432,
            database=parsed.path.lstrip('/')
        )
        
        # Ensure a clean slate
        conn.run('DELETE FROM "Manager"')
        print("Cleaned existing records from Manager table.")
        
        # Insert each record
        for m in managers_data:
            # Calculate win percentage
            if m['totalMatches'] > 0:
                win_pct = round((m['wins'] / m['totalMatches']) * 100, 2)
            else:
                win_pct = 0.0

            conn.run(
                """
                INSERT INTO "Manager" (
                    name, photo, "appointedDate", "leftDate", "isCurrent",
                    "totalMatches", wins, draws, losses, "winPercentage",
                    "preferredShape", "createdAt", "updatedAt"
                ) VALUES (
                    :name, :photo, :appointedDate, :leftDate, :isCurrent,
                    :totalMatches, :wins, :draws, :losses, :winPercentage,
                    :preferredShape, NOW(), NOW()
                )
                """,
                name=m['name'],
                photo=m['photo'],
                appointedDate=m['appointedDate'],
                leftDate=m['leftDate'],
                isCurrent=m['isCurrent'],
                totalMatches=m['totalMatches'],
                wins=m['wins'],
                draws=m['draws'],
                losses=m['losses'],
                winPercentage=win_pct,
                preferredShape=m['preferredShape']
            )
            print(f"Inserted: {m['name']} (Win %: {win_pct}%)")

        conn.close()
        print(f"\\nSUCCESS: Inserted {len(managers_data)} managers into the Postgres database.")
        
    except Exception as e:
        print(f"Database error: {e}")

if __name__ == "__main__":
    seed_managers()

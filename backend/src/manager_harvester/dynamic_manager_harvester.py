import os
import json
import re
from datetime import datetime
import pg8000.native
from urllib.parse import urlparse
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

def parse_date(date_str):
    if not date_str or date_str in ["-", "expected"]:
        return None
    try:
        # Transfermarkt usually formats dates like "Jul 1, 2024" or "01/07/2024" or "Sep 1, 2024"
        # Often it is like "Jul 1, 2013"
        return datetime.strptime(date_str, "%b %d, %Y").date()
    except ValueError:
        pass
    try:
        # Handle variations like '1 Jul 2013'
        return datetime.strptime(date_str, "%d %b %Y").date()
    except ValueError:
        pass
    try:
        # Handle DD/MM/YYYY
        return datetime.strptime(date_str, "%d/%m/%Y").date()
    except ValueError:
        pass
    return None

def harvest_dynamic_managers():
    url = "https://www.transfermarkt.com/manchester-united/mitarbeiterhistorie/verein/985"
    print(f"Connecting to: {url}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page.goto(url, wait_until="domcontentloaded")
        
        raw_managers = page.evaluate("""
            () => {
                const results = [];
                const table = document.querySelector('table.items');
                if (!table) return results;
                
                const rows = table.querySelectorAll('tbody > tr.odd, tbody > tr.even');
                rows.forEach(row => {
                    // Filter out rows that might be inner tables or pagination
                    const tds = row.querySelectorAll(':scope > td');
                    if (tds.length < 7) return;
                    
                    // Column 0: Name and Photo
                    const nameCell = tds[0];
                    const img = nameCell.querySelector('img');
                    const photo = img ? img.getAttribute('src') : null;
                    
                    const nameAnchor = nameCell.querySelector('.hauptlink a');
                    const name = nameAnchor ? nameAnchor.innerText.trim() : null;
                    
                    // Column 2: Appointed
                    const appointedStr = tds[2].innerText.trim();
                    
                    // Column 3: Left
                    const leftStr = tds[3].innerText.trim();
                    
                    // Column 5: Matches
                    const matchesStr = tds[5].innerText.trim();
                    
                    // Column 6: PPG
                    const ppgStr = tds[6].innerText.trim();
                    
                    if (name) {
                        results.push({
                            name: name,
                            photo: photo,
                            appointedStr: appointedStr,
                            leftStr: leftStr,
                            matchesStr: matchesStr,
                            ppgStr: ppgStr
                        });
                    }
                });
                return results;
            }
        """)
        
        browser.close()

    print(f"Total managers dynamically extracted: {len(raw_managers)}")
    
    sanitized_managers = []
    active_manager = None

    for m in raw_managers:
        name = m.get('name')
        photo = m.get('photo')
        
        # Determine if current
        left_str = m.get('leftStr', '')
        is_current = False
        if not left_str or left_str in ["-", "expected"] or "expected" in left_str.lower():
            is_current = True
            
        appointed_date = parse_date(m.get('appointedStr'))
        left_date = parse_date(left_str)
        
        if left_date and left_date > datetime.now().date():
            is_current = True
            
        if is_current:
            left_date = None
        
        # If we couldn't parse the date, fallback to something basic or leave None (but appointedDate is required in Prisma)
        # However, Prisma schema requires appointedDate to be a DateTime. We will format it as ISO string if available.
        # Transfermarkt returns dates in 'MMM d, yyyy' e.g. 'Nov 1, 2024'. Our parser handles it.
        
        try:
            total_matches = int(m.get('matchesStr', '0'))
        except ValueError:
            total_matches = 0
            
        try:
            ppg = float(m.get('ppgStr', '0').replace(',', '.'))
        except ValueError:
            ppg = 0.0
            
        # Win Percentage estimate from PPG (Max 3.0 PPG = 100%)
        # Better formula: assuming mostly wins/losses, win% is roughly (PPG / 3) * 100
        win_percentage = round((ppg / 3.0) * 100, 2)
        
        record = {
            'name': name,
            'photo': photo,
            'appointedDate': appointed_date.isoformat() if appointed_date else "1900-01-01",
            'leftDate': left_date.isoformat() if left_date else None,
            'isCurrent': is_current,
            'totalMatches': total_matches,
            'ppg': ppg,
            'winPercentage': win_percentage,
            'preferredShape': None,
            'wins': 0,
            'draws': 0,
            'losses': 0
        }
        sanitized_managers.append(record)
        
        if is_current:
            active_manager = record

    if active_manager:
        print(f"\\nACTIVE MANAGER: {active_manager['name']} (Matches: {active_manager['totalMatches']}, PPG: {active_manager['ppg']})")
    else:
        print("\\nACTIVE MANAGER: Not found")

    # Local JSON Backup
    frontend_data_dir = os.path.join(os.path.dirname(__file__), '../../../frontend/src/data')
    os.makedirs(frontend_data_dir, exist_ok=True)
    json_path = os.path.join(frontend_data_dir, 'manager_history.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(sanitized_managers, f, indent=4)
    print(f"Saved JSON backup to {json_path}")

    # Database Insertion
    load_dotenv(os.path.join(os.path.dirname(__file__), '../../../.env'))
    db_url = os.environ.get('DIRECT_URL') or os.environ.get('DATABASE_URL')
    
    if db_url:
        parsed = urlparse(db_url)
        conn = pg8000.native.Connection(
            user=parsed.username,
            password=parsed.password,
            host=parsed.hostname,
            port=parsed.port or 5432,
            database=parsed.path.lstrip('/')
        )
        
        conn.run('DELETE FROM "Manager"')
        print("Cleared Vault: Deleted all existing records in the Manager table.")
        
        for m in sanitized_managers:
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
                winPercentage=m['winPercentage'],
                preferredShape=m['preferredShape']
            )
            
        print(f"SUCCESS: Inserted {len(sanitized_managers)} dynamic historical managers into the database!")
        conn.close()
    else:
        print("No DATABASE_URL or DIRECT_URL found. Skipping Postgres insertion.")

if __name__ == "__main__":
    harvest_dynamic_managers()

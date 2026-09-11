import asyncio
from playwright.async_api import async_playwright
import json
import os
import pg8000.native
from dotenv import load_dotenv

load_dotenv()

async def scrape_trophies():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Using a typical user agent to avoid basic blocks
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        print("Navigating to Transfermarkt...")
        await page.goto('https://www.transfermarkt.com/manchester-united/erfolge/verein/985', wait_until='domcontentloaded')
        
        # Wait a bit for potential JS execution or Cloudflare
        await page.wait_for_timeout(3000)
        
        html = await page.content()
        with open('html_dump.html', 'w', encoding='utf-8') as f:
            f.write(html)
        
        print("Extracting trophies...")
        # We can extract the data inside evaluate
        trophies = await page.evaluate('''() => {
            const results = {};
            const rows = document.querySelectorAll('tr');
            
            rows.forEach(row => {
                const nameTd = row.querySelector('td.no-border-links');
                const seasonTd = row.querySelector('td.zentriert');
                
                if (nameTd && seasonTd) {
                    const name = nameTd.textContent.trim();
                    const season = seasonTd.textContent.trim();
                    
                    if (!name || !season) return;
                    
                    // Simple validation for season format (e.g., 22/23, 1999, 2022/23)
                    if (season.match(/^\\d{2,4}\\/?\\d{0,2}$/) || season.match(/^\\d{4}$/)) {
                        // We might want to skip negative records like "Relegated"
                        if (name.includes("Relegated") || name.includes("Runner up")) {
                            // The user asked for the trophy cabinet, let's keep it broad or just store everything
                            // We can just store it for now.
                        }
                        
                        if (!results[name]) {
                            results[name] = { competitionName: name, totalCount: 0, winningSeasons: [] };
                        }
                        if (!results[name].winningSeasons.includes(season)) {
                            results[name].winningSeasons.push(season);
                            results[name].totalCount++;
                        }
                    }
                }
            });
            return Object.values(results);
        }''')
        
        await browser.close()
        return trophies

def save_to_db_and_json(trophies):
    # JSON backup
    json_path = os.path.join(os.path.dirname(__file__), '../../../frontend/src/data/trophy_cabinet.json')
    # Resolve the path properly just in case
    json_path = os.path.abspath(json_path)
    os.makedirs(os.path.dirname(json_path), exist_ok=True)
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(trophies, f, indent=2)
    print(f"Saved {len(trophies)} distinct competitions to {json_path}")
    
    if len(trophies) == 0:
        print("No trophies extracted. Aborting database update.")
        return

    # Top 3 major honors
    print("\\n--- Top 3 Honors ---")
    sorted_trophies = sorted(trophies, key=lambda x: x['totalCount'], reverse=True)
    for t in sorted_trophies[:3]:
        recent = t['winningSeasons'][0] if t['winningSeasons'] else 'N/A'
        print(f"Name: {t['competitionName']} | Count: {t['totalCount']} | Most Recent: {recent}")
    
    # DB update
    # Need to parse DATABASE_URL
    # Format: postgresql://user:password@host:port/dbname
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found in .env")
        return
        
    db_url = db_url.replace("postgresql://", "").replace("postgres://", "")
    credentials, host_db = db_url.split("@")
    user, password = credentials.split(":")
    # host_db might contain parameters like ?pgbouncer=true
    host_db = host_db.split("?")[0]
    
    if "/" in host_db:
        host_port, dbname = host_db.split("/")
    else:
        host_port = host_db
        dbname = "postgres"
    
    if ":" in host_port:
        host, port = host_port.split(":")
        port = int(port)
    else:
        host = host_port
        port = 5432
        
    print(f"\\nConnecting to Postgres at {host}:{port}/{dbname}...")
    try:
        con = pg8000.native.Connection(user=user, password=password, host=host, port=port, database=dbname)
        print("Clearing stale Trophy data...")
        con.run('DELETE FROM "Trophy"')
        
        print("Inserting new trophies...")
        for t in trophies:
            if not t['winningSeasons']:
                seasons_pg = "{}"
            else:
                seasons_pg = "{" + ",".join([f'"{s}"' for s in t['winningSeasons']]) + "}"
                
            con.run(
                'INSERT INTO "Trophy" ("competitionName", "totalCount", "winningSeasons", "trophyImage", "updatedAt") VALUES (:name, :count, :seasons, NULL, NOW())',
                name=t['competitionName'],
                count=t['totalCount'],
                seasons=seasons_pg
            )
        con.close()
        print("Database updated successfully.")
    except Exception as e:
        print(f"Database error: {e}")


if __name__ == "__main__":
    trophies = asyncio.run(scrape_trophies())
    save_to_db_and_json(trophies)

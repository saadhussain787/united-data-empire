import re
import os
import json
import pg8000.native
from urllib.parse import urlparse
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

def sanitize_transfers(raw_transfers):
    sanitized = []
    for t in raw_transfers:
        fee_string = t.get('feeString', '')
        sub_text = t.get('subText', '')
        
        other_club = t.get('otherClub') or 'Unknown Club'
        other_club_logo = t.get('otherClubLogo') or 'https://tmssl.akamaized.net/images/wappen/tiny/default.png'
        
        combined_text = (fee_string + " " + sub_text).lower()
        
        is_academy_promotion = False
        lower_club = other_club.lower()
        if 'manchester united u' in lower_club or 'man utd u' in lower_club or 'academy' in lower_club:
            is_academy_promotion = True
            
        is_loan_return = 'end of loan' in combined_text
        
        if is_loan_return:
            transfer_type = 'Loan Return'
        elif is_academy_promotion:
            transfer_type = 'Academy Promotion'
        elif 'loan fee' in combined_text:
            transfer_type = 'Loan'
        else:
            transfer_type = 'Permanent'
            
        fee_numeric = 0.0
        lower_fee = fee_string.lower()
        if 'm' in lower_fee:
            clean_str = re.sub(r'[^\d.]', '', fee_string)
            try:
                fee_numeric = float(clean_str)
            except ValueError:
                pass
        elif 'k' in lower_fee or 'th.' in lower_fee:
            clean_str = re.sub(r'[^\d.]', '', fee_string)
            try:
                fee_numeric = float(clean_str) / 1000.0
            except ValueError:
                pass
                
        if transfer_type in ['Loan Return', 'Academy Promotion']:
            fee_numeric = 0.0
                
        record = {
            'playerName': t['playerName'],
            'feeString': fee_string,
            'isIncoming': t['isIncoming'],
            'feeNumeric': fee_numeric,
            'transferType': transfer_type,
            'otherClub': other_club,
            'otherClubLogo': other_club_logo,
            'isAcademyPromotion': is_academy_promotion,
            'currency': 'EUR',
            'contractYears': 5 if t['isIncoming'] else None,
            'season': '2026/27'
        }
        sanitized.append(record)
    return sanitized


def harvest_transfers():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # Set a standard desktop User-Agent to help avoid anti-bot blocks
        page = browser.new_page(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        
        url = "https://www.transfermarkt.com/manchester-united/transfers/verein/985"
        print(f"Connecting to: {url}")
        
        page.goto(url, wait_until="domcontentloaded")
        
        title = page.title()
        print(f"Successfully connected! Page Title: {title}")
        
        # DOM Evaluation Logic
        raw_transfers = page.evaluate("""
            () => {
                const results = [];
                // Locate the main content boxes on the Transfermarkt page
                const boxes = document.querySelectorAll('.box');

                boxes.forEach(box => {
                    const header = box.querySelector('h2');
                    if (!header) return;
                    
                    const headerText = header.innerText.trim().toLowerCase();
                    
                    let isIncoming = null;
                    if (headerText === 'arrivals') {
                        isIncoming = true;
                    } else if (headerText === 'departures') {
                        isIncoming = false;
                    }
                    
                    if (isIncoming !== null) {
                        // query all the standard table rows from the items table to avoid nested tables
                        const rows = box.querySelectorAll('table.items > tbody > tr');
                        rows.forEach(row => {
                            // Only direct child tds
                            const tds = row.querySelectorAll(':scope > td');
                            // Filter out rows that don't have enough columns (e.g. summary rows or empty rows)
                            if (tds.length < 5) return;
                            
                            // Get player name from hauptlink class inside the row
                            const playerLink = row.querySelector('.hauptlink a') || row.querySelector('.hauptlink');
                            if (!playerLink) return;
                            
                            const playerName = playerLink.innerText.trim();
                            
                            let otherClub = null;
                            let otherClubLogo = null;
                            const clubImg = row.querySelector('img.tiny_wappen');
                            if (clubImg) {
                                otherClub = clubImg.getAttribute('title') || clubImg.getAttribute('alt');
                                otherClubLogo = clubImg.getAttribute('src');
                            } else {
                                const clubA = row.querySelector('td:nth-child(5) a') || row.querySelector('td:nth-child(4) a');
                                if (clubA) {
                                    otherClub = clubA.getAttribute('title') || clubA.innerText;
                                }
                            }
                            
                            // Fee string is in the very last table cell
                            const feeTd = tds[tds.length - 1];
                            const feeString = feeTd.innerText.trim();
                            
                            const subTextEl = feeTd.querySelector('i') || feeTd.querySelector('span') || feeTd.querySelector('div');
                            const subText = subTextEl ? subTextEl.innerText.trim() : "";
                            
                            if (playerName) {
                                results.push({
                                    playerName: playerName,
                                    feeString: feeString,
                                    subText: subText,
                                    otherClub: otherClub,
                                    otherClubLogo: otherClubLogo,
                                    isIncoming: isIncoming
                                });
                            }
                        });
                    }
                });
                return results;
            }
        """)

        print(f"Total raw transfer records extracted: {len(raw_transfers)}")
        
        sanitized_transfers = sanitize_transfers(raw_transfers)
        
        # Calculate macro financial totals
        gross_spend = sum(t['feeNumeric'] for t in sanitized_transfers if t['isIncoming'])
        sales_revenue = sum(t['feeNumeric'] for t in sanitized_transfers if not t['isIncoming'])
        net_spend = gross_spend - sales_revenue
        
        # Annual Amortization Commitment: Sum of (feeNumeric / contractYears) for incoming permanent signings
        amortization = sum(
            (t['feeNumeric'] / t['contractYears']) 
            for t in sanitized_transfers 
            if t['isIncoming'] and t['transferType'] == 'Permanent' and t['contractYears']
        )
        
        print("\\n--- Financial Balance Sheet Summary ---")
        print(f"Total Incoming Players & Gross Spend (€M): {gross_spend:.2f}")
        print(f"Total Outgoing Players & Sales Revenue (€M): {sales_revenue:.2f}")
        print(f"Net Spend (€M): {net_spend:.2f}")
        print(f"Estimated Annual Amortization Burden (€M / year): {amortization:.2f}")
        
        incoming = [t for t in sanitized_transfers if t['isIncoming']]
        outgoing = [t for t in sanitized_transfers if not t['isIncoming']]
        
        if incoming:
            first_in = incoming[0]
            print(f"\n--- Verified First Incoming Transfer ---")
            print(f"Player: {first_in['playerName']}")
            print(f"Other Club: {first_in['otherClub']}")
            print(f"Other Club Logo: {first_in['otherClubLogo']}")
            print(f"Transfer Type: {first_in['transferType']}")
            print(f"Is Academy Promotion: {first_in['isAcademyPromotion']}")
            print("----------------------------------------\n")
        
        incoming_sorted = sorted(incoming, key=lambda x: x['feeNumeric'], reverse=True)
        outgoing_sorted = sorted(outgoing, key=lambda x: x['feeNumeric'], reverse=True)
        
        print("\\nTop 2 Highest Incoming Purchases:")
        for t in incoming_sorted[:2]:
            print(t)
            
        print("\\nTop 2 Highest Outgoing Sales:")
        for t in outgoing_sorted[:2]:
            print(t)
            
        # Local JSON Cache Generation
        ledger = {
            "grossSpend": gross_spend,
            "salesRevenue": sales_revenue,
            "netSpend": net_spend,
            "annualAmortization": amortization,
            "transfers": sanitized_transfers
        }
        
        frontend_data_dir = os.path.join(os.path.dirname(__file__), '../../../../frontend/src/data')
        os.makedirs(frontend_data_dir, exist_ok=True)
        json_path = os.path.join(frontend_data_dir, 'transfer_ledger.json')
        
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(ledger, f, indent=4)
        print(f"\\nSuccessfully wrote {len(sanitized_transfers)} transfers to frontend/src/data/transfer_ledger.json")

        # Supabase Postgres Database Persistence
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
            
            # Clean Existing Stale Records
            conn.run("""DELETE FROM "Transfer" WHERE season = '2026/27'""")
            
            # Batch Insert
            for t in sanitized_transfers:
                conn.run(
                    """
                    INSERT INTO "Transfer" (
                        "playerName", season, "window", "isIncoming", "otherClub", "otherClubLogo",
                        fee, "feeNumeric", currency, "contractYears", "weeklyWage", 
                        "transferType", "createdAt", "updatedAt"
                    ) VALUES (
                        :playerName, :season, :window, :isIncoming, :otherClub, :otherClubLogo,
                        :fee, :feeNumeric, :currency, :contractYears, :weeklyWage,
                        :transferType, NOW(), NOW()
                    )
                    """,
                    playerName=t['playerName'],
                    season=t['season'],
                    window='Summer',
                    isIncoming=t['isIncoming'],
                    otherClub=t['otherClub'],
                    otherClubLogo=t['otherClubLogo'],
                    fee=t['feeString'],
                    feeNumeric=t['feeNumeric'],
                    currency=t['currency'],
                    contractYears=t.get('contractYears'),
                    weeklyWage=t.get('weeklyWage', 0.0),
                    transferType=t['transferType']
                )
            
            print(f"Successfully inserted {len(sanitized_transfers)} rows into Postgres 'Transfer' table.")
            conn.close()
        else:
            print("No DATABASE_URL or DIRECT_URL found. Skipping Postgres insertion.")
        
        browser.close()

if __name__ == "__main__":
    harvest_transfers()

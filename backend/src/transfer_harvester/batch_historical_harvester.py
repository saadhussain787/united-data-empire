import re
import os
import json
import time
import pg8000.native
from urllib.parse import urlparse
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

def sanitize_transfers(raw_transfers, season_str):
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
            'season': season_str
        }
        sanitized.append(record)
    return sanitized


def harvest_historical_transfers():
    all_historical_transfers = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        page = browser.new_page(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        
        for year in range(1992, 2027):
            season_str = f"{year}/{str(year+1)[-2:]}"
            url = f"https://www.transfermarkt.com/manchester-united/transfers/verein/985/plus/1?saison_id={year}"
            
            # Navigate to the season page
            page.goto(url, wait_until="domcontentloaded")
            
            raw_transfers = page.evaluate("""
                () => {
                    const results = [];
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
                            const rows = box.querySelectorAll('table.items > tbody > tr');
                            rows.forEach(row => {
                                const tds = row.querySelectorAll(':scope > td');
                                if (tds.length < 5) return;
                                
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
            
            sanitized_transfers = sanitize_transfers(raw_transfers, season_str)
            all_historical_transfers.extend(sanitized_transfers)
            
            print(f"Harvested {season_str}: {len(sanitized_transfers)} transactions.")
            
            # Rate Limiting
            time.sleep(1.5)
            
        browser.close()

    print(f"\\nSUCCESS: Harvested {len(all_historical_transfers)} total historical transfers.")

    # Database Bulk Ingestion
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
        
        # Clean Existing Stale Records completely to avoid duplicates
        conn.run("""DELETE FROM "Transfer" """)
        print("Cleared Vault: Deleted all existing records in the Transfer table.")
        
        # Batch Insert
        for t in all_historical_transfers:
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
        
        print(f"SUCCESS: Inserted {len(all_historical_transfers)} historical transfers into the database!")
        conn.close()
    else:
        print("No DATABASE_URL or DIRECT_URL found. Skipping Postgres insertion.")


if __name__ == "__main__":
    harvest_historical_transfers()

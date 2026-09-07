import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

def test_fotmob():
    print("=== Target 1: FotMob (via ZenRows) ===")
    fotmob_url = "https://www.fotmob.com/api/data/playerData?id=422685"
    zenrows_key = os.getenv("ZENROWS_API_KEY")
    
    if not zenrows_key:
        print("Error: ZENROWS_API_KEY not found in .env")
        return

    try:
        res = requests.get(
            "https://api.zenrows.com/v1/",
            params={
                "apikey": zenrows_key,
                "url": fotmob_url,
                "premium_proxy": "true"
            }
        )
        print(f"Status Code: {res.status_code}")
        
        if res.status_code == 200:
            data = res.json()
            
            with open("fotmob_dump.json", "w") as f:
                json.dump(data, f, indent=2)
            print("Dumped to fotmob_dump.json")
    except Exception as e:
        print(f"Error fetching FotMob via ZenRows: {e}")

if __name__ == "__main__":
    test_fotmob()



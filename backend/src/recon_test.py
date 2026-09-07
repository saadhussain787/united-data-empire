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
            
            # Helper to search dict recursively for keys
            def find_keys(d, keys, path=""):
                if isinstance(d, dict):
                    for k, v in d.items():
                        current_path = f"{path}.{k}" if path else k
                        if any(target in k.lower() for target in keys):
                            print(f"Found match at {current_path}:")
                            print(json.dumps(v, indent=2)[:500]) # Print snippet
                            print("-" * 40)
                        find_keys(v, keys, current_path)
                elif isinstance(d, list):
                    for i, item in enumerate(d):
                        find_keys(item, keys, f"{path}[{i}]")
                        
            print("Searching for trait/percentile data...")
            find_keys(data, ['trait', 'radar', 'percentile', 'stat'])
            
    except Exception as e:
        print(f"Error fetching FotMob via ZenRows: {e}")

if __name__ == "__main__":
    test_fotmob()



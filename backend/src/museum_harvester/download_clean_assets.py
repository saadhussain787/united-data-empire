import os
import json
import requests

# Output directories
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'frontend'))
TROPHY_DIR = os.path.join(FRONTEND_DIR, 'public', 'trophies')
os.makedirs(TROPHY_DIR, exist_ok=True)

ASSET_MAP_PATH = os.path.join(TROPHY_DIR, 'asset_map.json')

TROPHIES_TO_DOWNLOAD = [
    "English Champion",
    "Champions League Winner",
    "FA Cup Winner",
    "Europa League Winner",
    "English League Cup winner",
    "FIFA Club World Cup winner",
    "Intercontinental Cup Winner",
    "UEFA Supercup Winner",
    "Cup Winners Cup Winner",
    "English Supercup Winner"
]

def search_wikimedia_api(competition_name):
    query = f"{competition_name} trophy"
    search_url = "https://commons.wikimedia.org/w/api.php"
    
    # 1. Search for the file title
    headers = {'User-Agent': 'TheUnitedDataBot/1.0 (test@example.com)'}
    search_params = {
        "action": "query",
        "format": "json",
        "list": "search",
        "srsearch": f"filetype:bitmap {query}",
        "srnamespace": 6, # File namespace
        "srlimit": 1
    }
    
    try:
        res = requests.get(search_url, params=search_params, headers=headers).json()
        search_results = res.get('query', {}).get('search', [])
        
        if not search_results:
            return None
            
        file_title = search_results[0]['title']
        
        # 2. Get the actual URL for the file title
        imageinfo_params = {
            "action": "query",
            "format": "json",
            "titles": file_title,
            "prop": "imageinfo",
            "iiprop": "url"
        }
        
        res2 = requests.get(search_url, params=imageinfo_params, headers=headers).json()
        pages = res2.get('query', {}).get('pages', {})
        for page_id, page_data in pages.items():
            if 'imageinfo' in page_data:
                return page_data['imageinfo'][0]['url']
                
    except Exception as e:
        print(f"Error calling Wikimedia API: {e}")
        
    return None


def main():
    print("Fetching perfectly transparent assets exclusively from Wikimedia Commons API...")
    
    asset_map = {}
    
    for trophy in TROPHIES_TO_DOWNLOAD:
        print(f"Searching for: {trophy}...")
        url = search_wikimedia_api(trophy)
        
        if url:
            print(f"  Found URL: {url}")
            safe_name = trophy.replace(" ", "_").replace("'", "").lower() + ".png"
            file_path = os.path.join(TROPHY_DIR, safe_name)
            
            try:
                # Download the image
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TheUnitedData/1.0'}
                response = requests.get(url, headers=headers, timeout=10)
                if response.status_code == 200:
                    with open(file_path, 'wb') as f:
                        f.write(response.content)
                    # Use a relative URL for Next.js public directory
                    asset_map[trophy] = f"/trophies/{safe_name}"
                    print(f"  -> Saved to {file_path}")
                else:
                    print(f"  -> HTTP {response.status_code} downloading {url}")
            except Exception as e:
                print(f"  -> Failed to download: {e}")
        else:
            print(f"  -> No valid image found on Wikimedia.")

    print(f"\nWriting asset map to {ASSET_MAP_PATH}")
    with open(ASSET_MAP_PATH, 'w') as f:
        json.dump(asset_map, f, indent=2)
        
    print("Done!")

if __name__ == "__main__":
    main()

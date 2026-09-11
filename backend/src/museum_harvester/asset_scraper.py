import os
import json
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote
from dotenv import load_dotenv

# Load env variables
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.env"))
load_dotenv(env_path)
ZENROWS_API_KEY = os.getenv("ZENROWS_API_KEY")

PUBLIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend/public/trophies"))
os.makedirs(PUBLIC_DIR, exist_ok=True)

# The search queries for the remaining missing trophies
TARGETS = {
    "Champions League Winner": "uefa champions league trophy png transparent",
    "English Supercup Winner": "fa community shield trophy png transparent",
    "Cup Winners Cup Winner": "uefa cup winners cup trophy png transparent",
    "Intercontinental Cup Winner": "intercontinental cup trophy football png transparent",
    "UEFA Supercup Winner": "uefa super cup trophy png transparent",
}

def sanitize_filename(name):
    return "".join(c for c in name if c.isalnum() or c in (' ', '_')).rstrip().replace(" ", "_")

def get_image_url_via_zenrows(query):
    search_url = f"https://images.search.yahoo.com/search/images?p={quote(query)}"
    
    # ZenRows API endpoint
    api_url = "https://api.zenrows.com/v1/"
    params = {
        "apikey": ZENROWS_API_KEY,
        "url": search_url,
        "js_render": "true",
        "premium_proxy": "true",
    }
    
    try:
        response = requests.get(api_url, params=params, timeout=45)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            img_tags = soup.find_all('img')
            for img in img_tags:
                src = img.get('data-src') or img.get('src')
                if src and src.startswith('http') and 'yimg' not in src:
                    return src
    except Exception as e:
        print(f"    ZenRows Error: {e}")
    return None

def download_image(url, filepath):
    try:
        response = requests.get(url, stream=True, timeout=10)
        if response.status_code == 200:
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            return True
    except Exception:
        pass
    return False

def run_scraper():
    print("Starting Asset Scraper Phase 1 (ZenRows Edition - Retry missing)...")
    
    mapping_file = os.path.join(PUBLIC_DIR, "asset_map.json")
    if os.path.exists(mapping_file):
        with open(mapping_file, "r") as f:
            downloaded_files = json.load(f)
    else:
        downloaded_files = {}

    for comp_name, query in TARGETS.items():
        filename = f"{sanitize_filename(comp_name)}.png"
        filepath = os.path.join(PUBLIC_DIR, filename)
        
        print(f"\nScraping: {comp_name} via ZenRows...")
        
        img_url = get_image_url_via_zenrows(query)
        
        if img_url:
            print(f"  -> Found URL: {img_url[:80]}...")
            success = download_image(img_url, filepath)
            if success:
                print(f"  -> SUCCESS: Saved {filename}")
                downloaded_files[comp_name] = f"/trophies/{filename}"
            else:
                print("  -> FAILED: Could not download the image file.")
        else:
            print("  -> FAILED: Could not extract image URL from search results.")
            
    with open(mapping_file, "w") as f:
        json.dump(downloaded_files, f, indent=2)
    print(f"\nPhase 1 Retry Complete. Asset mapping updated in {mapping_file}")

if __name__ == "__main__":
    if not ZENROWS_API_KEY:
        print("ERROR: ZENROWS_API_KEY not found in .env")
    else:
        run_scraper()

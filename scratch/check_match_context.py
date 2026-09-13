import os, json
from urllib.parse import urlparse
from dotenv import load_dotenv
load_dotenv('.env')
import pg8000.native

db_url = os.getenv("DIRECT_URL") or os.getenv("DATABASE_URL")
parsed = urlparse(db_url)

conn = pg8000.native.Connection(
    user=parsed.username,
    password=parsed.password,
    host=parsed.hostname,
    port=parsed.port,
    database=parsed.path.lstrip("/")
)

res = conn.run('SELECT "matchContext" FROM "Match" WHERE "matchContext" IS NOT NULL LIMIT 1')
if res and res[0][0]:
    print(json.dumps(res[0][0], indent=2))
else:
    print("No matchContext found")

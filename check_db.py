import os, ssl, pg8000.native, urllib.parse, json
from dotenv import load_dotenv; load_dotenv()
url = urllib.parse.urlparse(os.environ['DATABASE_URL'])
conn = pg8000.native.Connection(
    user=url.username, password=url.password,
    host=url.hostname, port=url.port, database=url.path.lstrip('/'),
    ssl_context=ssl._create_unverified_context()
)
res = conn.run('SELECT "teamStats" FROM "Match" WHERE id = 692')
print(json.dumps(res[0][0]))

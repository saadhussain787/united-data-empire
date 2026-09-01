import os
import ssl
from urllib.parse import urlparse
import pg8000.native
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

conn = pg8000.native.Connection(
    user=urlparse(os.environ['DATABASE_URL']).username,
    password=urlparse(os.environ['DATABASE_URL']).password,
    host=urlparse(os.environ['DATABASE_URL']).hostname,
    port=urlparse(os.environ['DATABASE_URL']).port or 5432,
    database=urlparse(os.environ['DATABASE_URL']).path.lstrip('/'),
    ssl_context=ssl._create_unverified_context(),
    timeout=15
)
rows = conn.run("SELECT \"id\", \"teamStats\" FROM \"Match\" WHERE \"teamStats\" IS NOT NULL")
for row in rows:
    if row[1] and row[1] != {} and str(row[1]) != '{}':
        print(row)
        break
conn.close()

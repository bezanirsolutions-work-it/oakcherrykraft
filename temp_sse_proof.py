import json
import time
import urllib.request
from pathlib import Path
import http.client

root = Path(r'c:\Users\USER\Documents\OAK CHERRY KRAFT')
env_path = root / '.env'
if not env_path.exists():
    raise FileNotFoundError('.env missing')

keys = {}
for line in env_path.read_text().splitlines():
    if '=' in line and not line.strip().startswith('#'):
        k, v = line.split('=', 1)
        keys[k.strip()] = v.strip()

ANON = keys.get('VITE_SUPABASE_ANON_KEY')
if not ANON:
    raise ValueError('VITE_SUPABASE_ANON_KEY missing')

BASE = 'https://jmrxmexmlejfksjlzvit.supabase.co/functions/v1/live_chat_proxy'

def create_session():
    payload = {'visitor_token': f'proof-{int(time.time()*1000)}', 'visitor_name': 'Proof Customer'}
    body = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(f'{BASE}/session', data=body, headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {ANON}'
    }, method='POST')
    with urllib.request.urlopen(req, timeout=30) as res:
        text = res.read().decode('utf-8')
        print('SESSION_STATUS', res.status)
        print('SESSION_BODY', text)
        return json.loads(text)


def open_stream(session_id):
    parsed = urllib.request.urlparse(f'{BASE}/events?session_id={session_id}')
    conn = http.client.HTTPSConnection(parsed.hostname, timeout=30)
    conn.putrequest('GET', parsed.path + '?' + parsed.query)
    conn.putheader('Accept', 'text/event-stream')
    conn.putheader('Authorization', f'Bearer {ANON}')
    conn.endheaders()
    resp = conn.getresponse()
    print('EVENTS_STATUS', resp.status)
    print('EVENTS_HEADERS', resp.getheaders())
    return resp


def post_message(session_id, content):
    payload = {'session_id': session_id, 'author': 'agent', 'content': content}
    body = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(f'{BASE}/message', data=body, headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {ANON}'
    }, method='POST')
    with urllib.request.urlopen(req, timeout=30) as res:
        text = res.read().decode('utf-8')
        print('MESSAGE_STATUS', res.status)
        print('MESSAGE_BODY', text)
        return json.loads(text)


def read_stream(resp, unique):
    buffer = ''
    found = False
    start = time.time()
    while time.time() - start < 15:
        chunk = resp.read(1024)
        if chunk is None:
            print('chunk None')
            break
        if len(chunk) == 0:
            print('chunk empty')
            break
        text = chunk.decode('utf-8', errors='replace')
        print('CHUNK', repr(text))
        buffer += text
        if unique in buffer:
            found = True
            break
    print('FOUND', found)
    print('BUFFER_FINAL', buffer[:2000])


if __name__ == '__main__':
    session = create_session()
    session_id = session['id']
    resp = open_stream(session_id)
    unique = f'LIVE SSE DELIVERY TEST 2026 {int(time.time()*1000)}'
    post_message(session_id, unique)
    read_stream(resp, unique)

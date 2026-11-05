"""Disposable backend + production frontend for manual browser integration checks.

Run after npm run build. Runtime credentials and XLSX fixtures stay in ignored .qa/.
Create .qa/stop to shut down. The normal demo and production databases are untouched.
"""
import json
import os
from pathlib import Path
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone

FRONTEND = Path(__file__).resolve().parents[1]
ROOT = FRONTEND.parent
sys.path[:0] = [str(ROOT / 'backend' / 'tests'), str(ROOT / 'backend' / 'scripts')]
from support import instance
from test_access import make_staff
from workbook_writer import write_workbook
from test_operations import HEADERS


def main():
    qa = FRONTEND / '.qa'
    qa.mkdir(exist_ok=True)
    stop = qa / 'stop'
    stop.unlink(missing_ok=True)
    with instance() as backend:
        staff = make_staff(backend, 'frontend-qa')
        today = datetime.now(timezone(timedelta(hours=7))).date()
        start, end = today.isoformat(), (today + timedelta(days=30)).isoformat()
        payload = {'route': staff['route']['id'], 'carrier': staff['carrier']['id'],
                   'valid_from': start, 'valid_to': end, 'service_type': 'direct', 'transit_days': 18,
                   'public_note': 'QA PUBLIC', 'internal_note': 'QA PRIVATE',
                   'lines': [{'container_type': '40HC', 'cost_price_cents': 100050,
                              'margin_mode': 'row', 'margin_cents': 10000, 'expected_revision': 0}]}
        saved = backend.api('/api/megaworld/admin/rates', payload, staff['token'], 201)['items'][0]
        valid = ['TEST', 'POL', 'POD', '20GP', '500.25', 'row', '50.50', start, end, 'direct', '18', '', '', 'QA IMPORT', 'QA PRIVATE']
        replacement = ['TEST', 'POL', 'POD', '40HC', '1200.50', 'row', '100', start, end, 'direct', '18', '', '', 'QA IMPORT', 'QA PRIVATE']
        invalid = ['TEST', 'POL', 'MISSING', '40GP', '800', 'row', '50', start, end, 'direct', '18']
        (qa / 'mixed.xlsx').write_bytes(write_workbook([HEADERS, valid, replacement, invalid]))
        (qa / 'invalid.xlsx').write_bytes(write_workbook([HEADERS, invalid]))
        session = {'url': 'http://127.0.0.1:3002', 'backend': f'http://127.0.0.1:{backend.port}',
                   'email': 'frontend-qa@example.test', 'password': backend.password,
                   'token': staff['token'], 'rate': saved, 'payload': payload}
        (qa / 'session.json').write_text(json.dumps(session), encoding='utf-8')
        log = (qa / 'frontend.log').open('w', encoding='utf-8')
        process = subprocess.Popen(['node', str(FRONTEND / 'node_modules' / 'next' / 'dist' / 'bin' / 'next'),
                                    'start', '--hostname', '127.0.0.1', '--port', '3002'], cwd=FRONTEND,
                                   env={**os.environ, 'POCKETBASE_URL': session['backend']}, stdout=log, stderr=log,
                                   creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0)
        try:
            print('QA ready: http://127.0.0.1:3002 (credentials in ignored frontend/.qa/session.json)', flush=True)
            while not stop.exists():
                if process.poll() is not None:
                    raise RuntimeError('Frontend stopped; inspect .qa/frontend.log')
                time.sleep(.5)
        finally:
            process.terminate()
            process.wait(timeout=10)
            log.close()
            (qa / 'session.json').unlink(missing_ok=True)


if __name__ == '__main__':
    main()

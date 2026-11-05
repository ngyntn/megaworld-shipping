import http.client
import json


def check_realtime(b, staff_token):
    for token in [None, staff_token]:
        connection = http.client.HTTPConnection("127.0.0.1", b.port, timeout=5)
        connection.request("GET", "/api/realtime")
        response = connection.getresponse()
        assert response.status == 200
        try:
            while True:
                line = response.readline().decode().strip()
                if line.startswith("data:"):
                    client_id = json.loads(line[5:].strip())["clientId"]
                    break
            b.api("/api/realtime", {"clientId": client_id,
                "subscriptions": ["rate_costs/*", "rate_versions/*"]}, token, expected=403)
        finally:
            response.close()
            connection.close()
    print("PASS: anonymous/staff realtime subscriptions cannot expose private data")

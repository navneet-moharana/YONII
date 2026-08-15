"""Check whether /api/chat preserves multi-turn context for the same session_id."""
import os

import requests
from dotenv import dotenv_values

env = dotenv_values("/app/frontend/.env")
BASE = (os.environ.get("REACT_APP_BACKEND_URL") or env["REACT_APP_BACKEND_URL"]).rstrip("/") + "/api"


def test_multi_turn_context():
    s = requests.Session()
    r1 = s.post(f"{BASE}/chat", json={"message": "What causes erectile difficulties?"}, timeout=180)
    assert r1.status_code == 200, r1.text
    sid = r1.json()["session_id"]

    r2 = s.post(f"{BASE}/chat", json={"session_id": sid, "message": "Is it common in men over 40?"}, timeout=180)
    assert r2.status_code == 200, r2.text
    a2 = r2.json()["answer"].lower()
    print("FOLLOW-UP ANSWER:\n", a2[:800])
    lost = any(p in a2 for p in ["need a bit more context", "what specific concern", "could you let me know",
                                 "what are you referring to", "more context"])
    assert not lost, "Conversation history is NOT preserved across turns for the same session_id"

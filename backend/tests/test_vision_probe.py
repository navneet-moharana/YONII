"""Probe whether the vision model actually receives the uploaded image."""
import io
import os

import requests
from dotenv import dotenv_values
from PIL import Image, ImageDraw

env = dotenv_values("/app/frontend/.env")
BASE = (os.environ.get("REACT_APP_BACKEND_URL") or env["REACT_APP_BACKEND_URL"]).rstrip("/") + "/api"


def make_image():
    img = Image.new("RGB", (400, 400), (255, 255, 255))
    d = ImageDraw.Draw(img)
    d.ellipse((100, 100, 300, 300), fill=(0, 0, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_vision_receives_image():
    s = requests.Session()
    order = s.post(f"{BASE}/payments/order", timeout=60).json()
    s.post(f"{BASE}/payments/verify", json={
        "razorpay_order_id": order["order_id"],
        "razorpay_payment_id": "pay_mock_probe",
        "razorpay_signature": "x"}, timeout=60)
    r = s.post(f"{BASE}/image-check",
               data={"order_id": order["order_id"], "note": "TEST_probe what shape and color is visible?"},
               files={"file": ("probe.jpg", make_image(), "image/jpeg")}, timeout=240)
    assert r.status_code == 200, r.text
    result = r.json()["result"]
    print("RESULT:\n", result[:1500])
    low = result.lower()
    assert "unable to view" not in low and "can't view" not in low and "cannot view" not in low, \
        "Vision model reports it cannot see the image -> image not reaching the model"
    assert "blue" in low or "circle" in low or "round" in low, "Model did not describe visible image features"

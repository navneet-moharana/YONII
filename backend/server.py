"""YONII - Anonymous Sexual Health Companion (backend).

Single-file FastAPI app that powers:
- Anonymous AI chat (Claude via Emergent Universal Key)
- Image Health Check (vision AI) gated by Razorpay ₹9 payment
- Admin dashboard (JWT)
"""

import os
import io
import uuid
import hmac
import base64
import hashlib
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional, List

import jwt
import razorpay
from PIL import Image
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from passlib.hash import bcrypt

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

# ---- Config ----------------------------------------------------------------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-5-20250929")
VISION_MODEL = os.environ.get("VISION_MODEL", "gpt-4o")
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "rzp_placeholder_key_id")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "rzp_placeholder_key_secret")
IMAGE_PRICE_PAISE = int(os.environ.get("IMAGE_PRICE_PAISE", "900"))
JWT_SECRET = os.environ["JWT_SECRET"]
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]

IS_RAZORPAY_MOCK = RAZORPAY_KEY_ID.startswith("rzp_placeholder")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s | %(message)s")
log = logging.getLogger("yonii")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

razorpay_client = None
if not IS_RAZORPAY_MOCK:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
else:
    log.warning("Razorpay running in MOCK mode — replace RAZORPAY_KEY_ID/SECRET to go live.")

# ---- App -------------------------------------------------------------------
app = FastAPI(title="YONII API")
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)

# ---- Safety prompt ---------------------------------------------------------
MEDICAL_SYSTEM_PROMPT = """You are YONII, a private, judgment-free sexual-health, reproductive-health & wellness companion for adults 18+.

Your job is EDUCATION. You are NOT a doctor and do NOT diagnose.

TOPICS YOU CAN HELP WITH
- All aspects of sexual health for every gender: anatomy, hygiene, safe sex, STIs/STDs, contraception, sexual anxiety, performance, libido, pain during sex, intimacy, consent, boundaries, relationships.
- Reproductive & menstrual health: periods, cycle irregularities, PMS/PMDD, cramps, missed periods, perimenopause, menopause, PCOS, endometriosis-like symptoms, fertility and pregnancy prevention.
- Genital, urinary and pelvic-area concerns: itching, discharge, rashes, bumps, lumps, pain, burning during urination, UTIs, yeast infections, bacterial vaginosis.
- Skin & dermatology questions on and around the private parts and body in general: rashes, moles, acne, folliculitis, ingrown hair, eczema, fungal infections, allergic reactions.
- Interpreting lab-test or medical-report language a user shares (in plain English), while always recommending confirmation with a clinician.
- Questions about medications, side-effects, birth-control options, morning-after pill — general education only, never dosages or prescriptions.
- Sexuality in the broadest sense: orientation, identity, body image, first-time concerns, aging and sexuality, disability and sexuality, kink safety, pleasure.

RESPONSE STYLE
- Warm, respectful, non-shaming, inclusive of all genders and orientations.
- Plain language. Avoid jargon. Explain terms briefly when used.
- Never make definitive diagnoses. Use phrases like "this can sometimes be associated with…", "possible explanations include…".
- Never prescribe medications, dosages, or brand names.
- Never claim to cure a disease.

RESPONSE STRUCTURE (use these headings in **bold** when clinically relevant):
**What it could mean** — possible explanations
**Possible causes** — common possibilities without claiming certainty
**What you can do** — safe general measures
**Precautions** — how to reduce risk
**What to avoid** — potentially harmful practices
**When to see a doctor** — clear medical-care guidance
**Urgent warning** — red-flag symptoms that need urgent medical attention (only include if relevant)

REFUSE / REDIRECT
- Erotic roleplay, pornographic requests, sexual entertainment → politely redirect to sexual-health education.
- Anything involving minors → firmly refuse and redirect to appropriate resources.
- Non-consensual scenarios → refuse and provide crisis resources.

EMERGENCIES
- Severe pain, heavy bleeding, trouble breathing, loss of consciousness, suspected sexual assault, suicidal ideation → advise contacting local emergency services immediately.

PRIVACY
- Do not ask for name, address, phone, or any identifying information.
- Encourage users to seek confidential in-person care when appropriate.

Keep responses concise but complete. End when appropriate with a gentle reminder that professional evaluation may be needed for personal medical concerns."""


VISION_SYSTEM_PROMPT = MEDICAL_SYSTEM_PROMPT + """

IMAGE-SPECIFIC RULES
You may receive any of the following types of images from an adult 18+ user:
- Genital-area or intimate-area photos showing a possible medical concern (rash, bumps, discharge visible on skin, lesions, swelling, discoloration, ingrown hair, etc.)
- Photos of any skin concern anywhere on the body — moles, rashes, patches, eczema, fungal-looking areas, acne, folliculitis.
- Photos of medical reports, prescriptions, lab-test results, ultrasound reports, pathology reports the user has photographed with their phone.
- Photos of medication packaging or an unknown pill.

For every image:
- Describe only medically relevant visible characteristics (colour, shape, distribution, apparent texture, wording on reports).
- If it's a medical report or lab test, read the values/wording carefully and explain in plain English what the terms likely mean — but never confirm a diagnosis; always recommend the user discuss it with the ordering clinician.
- Never identify a person, guess age, or comment on attractiveness.
- Always state: "An image alone cannot reliably establish a medical diagnosis."
- Never say "You have X disease."
- If the image is unclear, blurry or non-medical, say so kindly and suggest what a better photo would show.
- Be respectful — many users are anxious. Reassure where appropriate.
"""

MODERATION_SYSTEM_PROMPT = """You are a strict content moderator for a sexual-HEALTH and reproductive-HEALTH education platform serving adults 18+.

Return exactly one word:
ALLOW  — any legitimate question about sexual health, reproductive health, periods/menstruation, contraception, pregnancy, STIs, genital/urinary/pelvic concerns, skin problems (including on private parts), medical reports the user wants explained, medications the user is asking about, intimacy, relationships, consent, sexual orientation and identity, aging and sexuality, or general wellness.
REDIRECT — erotic roleplay, pornographic content, requests to describe someone attractively, sexual entertainment, requests to rate looks.
BLOCK — content involving minors, non-consent, sexual violence solicitation, illegal activity, explicit self-harm ideation without help-seeking framing.

Reply with ONLY one of: ALLOW, REDIRECT, BLOCK."""


# ---- Models ----------------------------------------------------------------
class ChatIn(BaseModel):
    session_id: Optional[str] = None
    message: str = Field(min_length=1, max_length=4000)


class ChatOut(BaseModel):
    session_id: str
    answer: str
    disclaimer: str = "YONII provides general educational information, not medical diagnosis. Consult a qualified healthcare professional for personal concerns."


class SymptomIn(BaseModel):
    symptom: str = Field(min_length=1, max_length=500)
    body_area: Optional[str] = None
    duration: Optional[str] = None
    severity: Optional[str] = None
    associated: Optional[str] = None
    context: Optional[str] = None


class OrderOut(BaseModel):
    order_id: str
    amount: int
    currency: str = "INR"
    key_id: str
    mock: bool


class VerifyIn(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class AdminLoginIn(BaseModel):
    email: str
    password: str


# ---- Period Tracker Models ------------------------------------------------
class PeriodSignupIn(BaseModel):
    email: str = Field(min_length=3, max_length=200)
    password: str = Field(min_length=6, max_length=128)


class PeriodEntryIn(BaseModel):
    start_date: str  # ISO date (YYYY-MM-DD)
    end_date: Optional[str] = None
    flow: Optional[str] = None  # light | medium | heavy
    notes: Optional[str] = Field(default=None, max_length=300)


class PeriodEntryOut(PeriodEntryIn):
    id: str
    created_at: str


# ---- Helpers ---------------------------------------------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def moderate(text: str) -> str:
    """Return ALLOW / REDIRECT / BLOCK."""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"mod-{uuid.uuid4()}",
            system_message=MODERATION_SYSTEM_PROMPT,
        ).with_model("openai", "gpt-4o-mini")
        result = await chat.send_message(UserMessage(text=text))
        verdict = (result or "").strip().upper().split()[0] if result else "ALLOW"
        if verdict not in ("ALLOW", "REDIRECT", "BLOCK"):
            verdict = "ALLOW"
        return verdict
    except Exception as exc:  # fail-open to ALLOW to avoid breaking chat; log it
        log.warning("moderation failed: %s", exc)
        return "ALLOW"


async def claude_chat(session_id: str, message: str) -> str:
    # Load prior turns for this anonymous session (bounded) and replay them so
    # follow-up questions have real conversational context.
    prior = await db.chats.find(
        {"session_id": session_id, "verdict": "ALLOW"},
        {"_id": 0, "question": 1, "answer": 1},
    ).sort("created_at", 1).to_list(10)

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=MEDICAL_SYSTEM_PROMPT,
    ).with_model("anthropic", CLAUDE_MODEL)

    if prior:
        history_snippet = "\n\n".join(
            f"User previously asked: {p['question']}\nYONII previously answered: {p['answer']}"
            for p in prior if p.get("answer")
        )
        composed = (
            f"[Conversation so far — for your reference, do not repeat verbatim]\n{history_snippet}\n\n"
            f"[New user message]\n{message}"
        )
        return await chat.send_message(UserMessage(text=composed))

    return await chat.send_message(UserMessage(text=message))


async def vision_analyze(image_b64: str, note: str) -> str:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"vision-{uuid.uuid4()}",
        system_message=VISION_SYSTEM_PROMPT,
    ).with_model("openai", VISION_MODEL)
    prompt = (
        "A user has uploaded a photo related to their sexual, reproductive, or general skin health. "
        "It may be an image of an intimate/genital area, a skin concern anywhere on the body, "
        "a medical report / lab result / prescription they photographed, or medication packaging. "
        f"Their note: '{note or 'no note provided'}'. "
        "Provide educational guidance using the required response structure. "
        "If it's a medical report, translate the terminology into plain English and explain what is worth discussing with a clinician. "
        "Remember: no diagnosis, describe only visible features, recommend professional evaluation."
    )
    return await chat.send_message(
        UserMessage(text=prompt, file_contents=[ImageContent(image_base64=image_b64)])
    )


def strip_exif(raw: bytes) -> bytes:
    """Re-encode image without EXIF metadata."""
    img = Image.open(io.BytesIO(raw))
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=88)
    return buf.getvalue()


def create_admin_token(email: str) -> str:
    payload = {"sub": email, "role": "admin", "exp": datetime.now(timezone.utc) + timedelta(hours=12)}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def create_period_token(user_id: str) -> str:
    payload = {"sub": user_id, "role": "period", "exp": datetime.now(timezone.utc) + timedelta(days=30)}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def require_period_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> str:
    if creds is None:
        raise HTTPException(401, "Missing token")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=["HS256"])
        if payload.get("role") != "period":
            raise HTTPException(403, "Not a period-tracker token")
        return payload["sub"]
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid or expired token")


def require_admin(creds: HTTPAuthorizationCredentials = Depends(security)) -> str:
    if creds is None:
        raise HTTPException(401, "Missing token")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=["HS256"])
        if payload.get("role") != "admin":
            raise HTTPException(403, "Not an admin")
        return payload["sub"]
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid or expired token")


async def bump_metric(name: str, inc: int = 1):
    await db.metrics.update_one({"name": name}, {"$inc": {"value": inc}}, upsert=True)


# ---- Startup: seed admin ---------------------------------------------------
@app.on_event("startup")
async def startup():
    existing = await db.admins.find_one({"email": ADMIN_EMAIL})
    if not existing:
        await db.admins.insert_one({
            "email": ADMIN_EMAIL,
            "password_hash": bcrypt.hash(ADMIN_PASSWORD),
            "created_at": now_iso(),
        })
        log.info("Seeded admin account: %s", ADMIN_EMAIL)


@app.on_event("shutdown")
async def shutdown():
    client.close()


# ---- Public routes ---------------------------------------------------------
@api.get("/")
async def root():
    return {"app": "YONII", "status": "ok", "mock_payments": IS_RAZORPAY_MOCK}


@api.get("/health")
async def health():
    return {"ok": True, "time": now_iso()}


@api.post("/chat", response_model=ChatOut)
async def chat_endpoint(body: ChatIn):
    session_id = body.session_id or f"anon-{uuid.uuid4()}"
    verdict = await moderate(body.message)

    if verdict == "BLOCK":
        answer = (
            "I can't help with this request. If you're in distress or facing a crisis, please contact your local emergency services or a trusted helpline. "
            "YONII is here to support sexual-health education for adults 18+."
        )
    elif verdict == "REDIRECT":
        answer = (
            "YONII is a sexual-health education platform, not an entertainment or roleplay service. "
            "If you have a genuine question about sexual health, wellness, symptoms, contraception, STIs, or relationships, I'm happy to help — please rephrase your question."
        )
    else:
        try:
            answer = await claude_chat(session_id, body.message)
        except Exception as exc:
            log.exception("claude error")
            raise HTTPException(503, f"YONII is temporarily unavailable. Please try again later.")

    await db.chats.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "question": body.message[:1000],
        "answer": answer[:5000] if answer else "",
        "verdict": verdict,
        "model": CLAUDE_MODEL,
        "created_at": now_iso(),
    })
    await bump_metric("chat_messages")
    return ChatOut(session_id=session_id, answer=answer)


@api.post("/symptom-check", response_model=ChatOut)
async def symptom_check(body: SymptomIn):
    parts = [f"Main symptom: {body.symptom}"]
    if body.body_area: parts.append(f"Body area: {body.body_area}")
    if body.duration: parts.append(f"Duration: {body.duration}")
    if body.severity: parts.append(f"Severity: {body.severity}")
    if body.associated: parts.append(f"Associated symptoms: {body.associated}")
    if body.context: parts.append(f"Other context: {body.context}")
    parts.append("Please give me educational guidance using your standard structure.")
    message = "\n".join(parts)
    session_id = f"symptom-{uuid.uuid4()}"
    try:
        answer = await claude_chat(session_id, message)
    except Exception:
        log.exception("symptom llm error")
        raise HTTPException(503, "YONII is temporarily unavailable. Please try again later.")
    await bump_metric("symptom_checks")
    return ChatOut(session_id=session_id, answer=answer)


# ---- Payments --------------------------------------------------------------
@api.post("/payments/order", response_model=OrderOut)
async def create_order():
    if IS_RAZORPAY_MOCK:
        order_id = f"order_mock_{uuid.uuid4().hex[:16]}"
    else:
        order = razorpay_client.order.create({
            "amount": IMAGE_PRICE_PAISE,
            "currency": "INR",
            "receipt": f"yonii_{uuid.uuid4().hex[:16]}",
            "payment_capture": 1,
        })
        order_id = order["id"]

    await db.payments.insert_one({
        "order_id": order_id,
        "amount": IMAGE_PRICE_PAISE,
        "currency": "INR",
        "status": "created",
        "mock": IS_RAZORPAY_MOCK,
        "created_at": now_iso(),
    })
    return OrderOut(
        order_id=order_id,
        amount=IMAGE_PRICE_PAISE,
        key_id=RAZORPAY_KEY_ID,
        mock=IS_RAZORPAY_MOCK,
    )


@api.post("/payments/verify")
async def verify_payment(body: VerifyIn):
    row = await db.payments.find_one({"order_id": body.razorpay_order_id})
    if not row:
        raise HTTPException(400, "Unknown order")

    if row.get("mock") or IS_RAZORPAY_MOCK:
        pass  # accept mock signatures
    else:
        message = f"{body.razorpay_order_id}|{body.razorpay_payment_id}".encode()
        expected = hmac.new(RAZORPAY_KEY_SECRET.encode(), message, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, body.razorpay_signature):
            raise HTTPException(400, "Invalid payment signature")

    await db.payments.update_one(
        {"order_id": body.razorpay_order_id},
        {"$set": {
            "status": "verified",
            "payment_id": body.razorpay_payment_id,
            "verified_at": now_iso(),
        }},
    )
    await bump_metric("payments_verified")
    return {"ok": True, "order_id": body.razorpay_order_id}


# ---- Image Health Check ----------------------------------------------------
@api.post("/image-check")
async def image_check(
    order_id: str = Form(...),
    note: str = Form(""),
    file: UploadFile = File(...),
):
    row = await db.payments.find_one({"order_id": order_id})
    if not row or row.get("status") != "verified":
        raise HTTPException(402, "Payment not verified for this order")
    if row.get("analysis_completed"):
        raise HTTPException(409, "Analysis already completed for this order")

    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(415, "Only JPEG, PNG or WEBP images are supported.")
    raw = await file.read()
    if len(raw) > 8 * 1024 * 1024:
        raise HTTPException(413, "Image too large (max 8MB).")

    try:
        clean = strip_exif(raw)
    except Exception:
        raise HTTPException(400, "Could not read image file.")

    b64 = base64.b64encode(clean).decode()

    try:
        result = await vision_analyze(b64, note)
    except Exception:
        log.exception("vision error")
        raise HTTPException(503, "We couldn't analyze this image. Please try again.")

    # Do NOT store the image. Store only the textual analysis + metadata.
    analysis_id = str(uuid.uuid4())
    await db.image_analyses.insert_one({
        "id": analysis_id,
        "order_id": order_id,
        "analysis": result[:8000] if result else "",
        "note": note[:500],
        "model": VISION_MODEL,
        "created_at": now_iso(),
    })
    await db.payments.update_one(
        {"order_id": order_id},
        {"$set": {"analysis_completed": True, "analysis_id": analysis_id}},
    )
    await bump_metric("image_analyses")

    # Explicit variable overwrite for cleanliness
    del raw, clean, b64
    return {"analysis_id": analysis_id, "result": result, "notice": "Your image was processed in memory only and has been discarded."}


@api.delete("/image-check/{analysis_id}")
async def delete_analysis(analysis_id: str):
    res = await db.image_analyses.delete_one({"id": analysis_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Analysis not found")
    return {"ok": True}


# ---- Admin -----------------------------------------------------------------
@api.post("/admin/login")
async def admin_login(body: AdminLoginIn):
    admin = await db.admins.find_one({"email": body.email})
    if not admin or not bcrypt.verify(body.password, admin["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    return {"token": create_admin_token(body.email), "email": body.email}


@api.get("/admin/stats")
async def admin_stats(_: str = Depends(require_admin)):
    metrics = {m["name"]: m["value"] for m in await db.metrics.find({}).to_list(100)}
    payments = await db.payments.count_documents({"status": "verified"})
    revenue = payments * (IMAGE_PRICE_PAISE / 100)
    recent_chats = await db.chats.count_documents({})
    recent_images = await db.image_analyses.count_documents({})
    return {
        "metrics": metrics,
        "payments_verified": payments,
        "revenue_inr": revenue,
        "total_chats": recent_chats,
        "total_image_analyses": recent_images,
        "mock_payments": IS_RAZORPAY_MOCK,
    }


@api.get("/admin/recent-chats")
async def admin_recent_chats(_: str = Depends(require_admin), limit: int = 20):
    docs = await db.chats.find({}, {"_id": 0, "question": 1, "verdict": 1, "created_at": 1, "session_id": 1}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"chats": docs}


@api.get("/admin/recent-payments")
async def admin_recent_payments(_: str = Depends(require_admin), limit: int = 20):
    docs = await db.payments.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"payments": docs}


class KBItem(BaseModel):
    title: str
    body: str
    source_url: Optional[str] = None
    category: Optional[str] = None


@api.get("/admin/knowledge")
async def list_knowledge(_: str = Depends(require_admin)):
    docs = await db.knowledge.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"items": docs}


@api.post("/admin/knowledge")
async def add_knowledge(item: KBItem, _: str = Depends(require_admin)):
    doc = {"id": str(uuid.uuid4()), **item.model_dump(), "created_at": now_iso()}
    await db.knowledge.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.delete("/admin/knowledge/{item_id}")
async def delete_knowledge(item_id: str, _: str = Depends(require_admin)):
    res = await db.knowledge.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Knowledge item not found")
    return {"ok": True}


# ---- Period Tracker (single opt-in account feature) ------------------------
def _parse_iso_date(s: str):
    try:
        return datetime.fromisoformat(s).date()
    except Exception:
        raise HTTPException(400, "start_date/end_date must be YYYY-MM-DD")


@api.post("/period/signup")
async def period_signup(body: PeriodSignupIn):
    email = body.email.strip().lower()
    if "@" not in email or "." not in email:
        raise HTTPException(400, "Please provide a valid email address.")
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(409, "An account with that email already exists.")
    user_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": user_id,
        "email": email,
        "password_hash": bcrypt.hash(body.password),
        "created_at": now_iso(),
    })
    return {"token": create_period_token(user_id), "email": email, "user_id": user_id}


@api.post("/period/login")
async def period_login(body: PeriodSignupIn):
    email = body.email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user or not bcrypt.verify(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    return {"token": create_period_token(user["id"]), "email": email, "user_id": user["id"]}


@api.get("/period/me")
async def period_me(user_id: str = Depends(require_period_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(404, "Account not found")
    return user


@api.get("/period/entries")
async def period_entries(user_id: str = Depends(require_period_user)):
    docs = await db.period_entries.find(
        {"user_id": user_id}, {"_id": 0, "user_id": 0}
    ).sort("start_date", -1).to_list(500)
    return {"entries": docs}


@api.post("/period/entries", response_model=PeriodEntryOut)
async def period_entry_create(body: PeriodEntryIn, user_id: str = Depends(require_period_user)):
    start = _parse_iso_date(body.start_date)
    end = _parse_iso_date(body.end_date) if body.end_date else None
    if end and end < start:
        raise HTTPException(400, "end_date must be on or after start_date")
    entry = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "start_date": start.isoformat(),
        "end_date": end.isoformat() if end else None,
        "flow": body.flow,
        "notes": (body.notes or "")[:300],
        "created_at": now_iso(),
    }
    await db.period_entries.insert_one(entry)
    entry.pop("user_id", None)
    return entry


@api.delete("/period/entries/{entry_id}")
async def period_entry_delete(entry_id: str, user_id: str = Depends(require_period_user)):
    res = await db.period_entries.delete_one({"id": entry_id, "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Entry not found")
    return {"ok": True}


@api.get("/period/prediction")
async def period_prediction(user_id: str = Depends(require_period_user)):
    docs = await db.period_entries.find(
        {"user_id": user_id}, {"_id": 0, "start_date": 1, "end_date": 1}
    ).sort("start_date", 1).to_list(500)
    if not docs:
        return {"has_data": False, "message": "Log at least one period to see predictions."}

    starts = [datetime.fromisoformat(d["start_date"]).date() for d in docs]
    # Cycle lengths between consecutive starts
    cycles = [(starts[i] - starts[i - 1]).days for i in range(1, len(starts)) if 15 <= (starts[i] - starts[i - 1]).days <= 60]
    avg_cycle = round(sum(cycles) / len(cycles)) if cycles else 28

    # Period length estimate
    lengths = []
    for d in docs:
        if d.get("end_date"):
            try:
                lengths.append((datetime.fromisoformat(d["end_date"]).date() - datetime.fromisoformat(d["start_date"]).date()).days + 1)
            except Exception:
                pass
    avg_period_length = round(sum(lengths) / len(lengths)) if lengths else 5

    last_start = starts[-1]
    next_start = last_start + timedelta(days=avg_cycle)
    ovulation = next_start - timedelta(days=14)
    fertile_start = ovulation - timedelta(days=5)
    fertile_end = ovulation + timedelta(days=1)

    return {
        "has_data": True,
        "avg_cycle_length": avg_cycle,
        "avg_period_length": avg_period_length,
        "last_period_start": last_start.isoformat(),
        "next_period_start": next_start.isoformat(),
        "predicted_ovulation": ovulation.isoformat(),
        "fertile_window_start": fertile_start.isoformat(),
        "fertile_window_end": fertile_end.isoformat(),
        "entries_logged": len(starts),
        "note": "Predictions are estimates based on your logged history and are for information only.",
    }


app.include_router(api)

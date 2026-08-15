# YONII — Product Requirements Doc (living)

## Original problem statement (verbatim from user)
Build YONII — a free, anonymous sexual-health and sexual-wellness web application for adults 18+. No account, no email, no phone. Anonymous AI chat, educational hubs (Men's Health, Women's Health, STI/STD, Contraception, Sexual Wellness, Relationships), symptom checker, ₹9 paid Image Health Check with Razorpay, medical-safety layer (input validation → moderation → intent → medical LLM → safety validation), image privacy (temporary, EXIF-stripped, auto-deleted), admin dashboard with usage/revenue/KB management, SEO-ready pages, legal pages, mobile-first premium health-tech design.

## User personas
- **Curious adult** who is embarrassed to ask their GP.
- **Person noticing a symptom** unsure whether it's serious.
- **Someone in a new relationship** wanting reliable prevention info.
- **Health-conscious professional** in India who values privacy and anonymity.

## Core requirements (static)
- Adults 18+ only, self-attested at entry.
- Absolutely no login / no accounts.
- Anonymous AI chat with structured, uncertainty-aware, non-diagnostic responses.
- ₹9 one-time payment for image analysis. No subscription.
- No permanent storage of uploaded intimate images.
- Educational hubs and symptom checker for free.
- Admin: JWT-protected dashboard (stats, chats, payments, KB manager).
- Medical-safety system prompt + separate moderation model.
- Premium calm health-tech design (Forest Green + Terracotta, Outfit/Manrope fonts). No purple gradients, no provocative imagery.

## Architecture (as built)
- FastAPI backend on 8001, all routes under `/api`.
- MongoDB collections: `chats`, `image_analyses`, `payments`, `admins`, `metrics`, `knowledge`.
- Emergent LLM key for Claude (chat) + GPT-4o (vision + moderation).
- Razorpay integration present but running in MOCK mode until real keys are added (any `RAZORPAY_KEY_ID` starting with `rzp_placeholder` toggles mock verify).
- Server-side payment verification with HMAC signature check for live mode.
- Image pipeline: validate MIME/size → EXIF strip via Pillow → base64 → vision AI → text-only result stored → image bytes discarded.
- React 19 frontend, React Router 7, Tailwind + custom CSS variables.
- Age gate stored in `localStorage`, admin JWT stored in `localStorage`.

## What's been implemented (2026-02)
- Age gate with 18+ self-attestation + "under 18" back-navigation.
- Home page: hero, anonymous chat input, 7 example prompts, 6 hub bento cards, service strip (chat / symptom / image ₹9), privacy promise, disclaimer, full footer.
- Anonymous chat page with **multi-turn context** (server replays prior turns for a session).
- Six educational hubs (Men's Health, Women's Health, STI/STD, Contraception, Sexual Wellness, Relationships) with full content.
- Symptom checker (guided fields → AI guidance).
- ₹9 Image Health Check flow (upload → Razorpay checkout / auto mock → server-side verify → vision analysis → discard image → delete-analysis button).
- Legal pages: Privacy, Terms, Medical Disclaimer, Refund, Image Privacy.
- Admin login (email/password JWT) + dashboard: stats, revenue, mock/live indicator, recent chats, recent payments, KB CRUD.
- Markdown rendering (`#`/`##`/`###`/`**bold**`/lists) for AI responses.
- All key elements carry `data-testid` attributes.
- Test suite present (`/app/backend/tests/backend_test.py`, `test_vision_probe.py`, `test_chat_context.py`).

## Known limitations / backlog (prioritized)
### P1 — next up
- Replace Razorpay MOCK keys with real ones (already fully wired for live mode).
- Reconsider raw-question storage in `db.chats` given the "no history" promise — hash or auto-expire.
- Consistent shadcn Select for symptom-checker Severity field.
- Right-side abstract visual on desktop hero to fill the empty band.

### P2 — polish
- Migrate FastAPI `on_event` hooks to `lifespan`.
- Better low-information-image guardrail in vision prompt (avoid "I cannot see the image" replies).
- Sources/references citations under AI responses when KB is populated.
- FAQ schema.org markup on hub pages for SEO.
- Rate limiting per IP for chat + image-check.
- 404 route with useful navigation.

### P3
- Article management UI in admin.
- Multi-language support.
- Sonner toasts for success/error states across pages.

## Auth / credentials
- Admin: `admin@yonii.app` / `Admin@Yonii123`
- No end-user accounts.

## Files added / changed
- Backend: `/app/backend/server.py`, `/app/backend/.env`, `/app/backend/tests/*`
- Frontend: `/app/frontend/src/App.js`, `App.css`, `index.css`, `components/{AgeGate,Layout,Disclaimer,AIMessage}.jsx`, `pages/{Home,Chat,Hub,SymptomChecker,ImageCheck,Legal,AdminLogin,AdminDashboard}.jsx`, `lib/api.js`, `data/hubs.js`, `constants/testIds.js`

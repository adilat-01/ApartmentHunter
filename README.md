# ApartmentHunter

Live: [apartment-hunter-ecru.vercel.app](https://apartment-hunter-ecru.vercel.app)

A full-stack MVP that turns messy apartment listing text (Facebook / Yad2 style posts) into structured data, then ranks listings against personal filters.

Paste a listing → Gemini extracts price, rooms, mamad, entry date, and more → you get a match score you can actually compare.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, Tailwind, Playwright e2e |
| Backend | FastAPI (Python) |
| AI | Gemini (structured JSON extraction) |
| Database | SQLite (MVP) |
| Deploy | Vercel (frontend) · Render (API) |

## Repo layout

```
├── main.py              # FastAPI app
├── auth.py              # JWT + password hashing
├── database.py          # SQLAlchemy models
├── seed_demo.py         # Demo accounts
├── frontend/            # React client
├── Apartment_examp/     # Sample listing images
├── uploads/             # User photos (demo)
├── PRD.md               # Product requirements
└── .env.example         # Required env vars (no secrets)
```

## Quick start

**Backend**

```bash
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env         # then fill NEW_GEM_KEY
uvicorn main:app --reload
```

**Frontend**

```bash
cd frontend
npm install
copy .env.example .env         # optional: VITE_API_URL for production API
npm run dev
```

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEW_GEM_KEY` | backend `.env` | Gemini API key (never `VITE_` / public) |
| `JWT_SECRET_KEY` | backend `.env` | Token signing (set a strong value in production) |
| `VITE_API_URL` | `frontend/.env` | API origin in production |

## Security

- Real keys live only in `.env` (gitignored)
- Copy `.env.example` — it contains placeholders only
- Passwords are hashed with bcrypt; sessions are isolated per user

If a key was ever committed, rotate it in Google AI Studio and update Render / local `.env`.

## MVP limits

- SQLite on Render’s free tier resets when the instance sleeps or rebuilds
- First request after idle can take ~30 seconds (cold start)
- Images are stored on the server, not a CDN

## License

Personal portfolio project.

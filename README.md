# ApartmentHunter

**Live:** [apartment-hunter-ecru.vercel.app](https://apartment-hunter-ecru.vercel.app)

Apartment search is usually chaos: Facebook posts, Yad2 screenshots, half-filled notes, and “wait, how many rooms was that one?”  
ApartmentHunter turns messy listing text into structured data and a **personal match score**, so you can compare apartments on facts — not vibes.

## Why it exists

Couples (and anyone hunting together) need one place to:

- collect listings from social posts
- extract the important fields automatically
- rank options against **their** budget and preferences
- track status (interested / contacted / visited / rejected)

## What you can do

- **Paste a listing** — raw text from Facebook / Yad2-style posts
- **AI extraction** — Gemini fills price, rooms, mamad, entry date, and more
- **Review before save** — edit anything the model got wrong
- **Match score** — see how well the apartment fits your filters (with a transparent breakdown)
- **Track the pipeline** — status, notes, and a dashboard of candidates
- **Try demo accounts** — explore the flow without setting everything up first

## How it works (user flow)

1. **Set preferences** — budget and what matters most to you
2. **Paste listing text** into the ingest box
3. **AI extracts** a structured apartment card
4. **You review / edit**, then save
5. **Dashboard** shows scored apartments you can sort, filter, and update

## Product notes

- Built as a full-stack **MVP** to practice product characterization, AI prompts, and shipping
- Responsive on mobile and desktop
- Demo accounts are isolated so data doesn’t leak between users

### Current MVP limits

- Free-tier SQLite on Render can reset when the server sleeps/rebuilds
- First request after idle may take ~30 seconds (cold start)
- Photos are stored on the server, not a dedicated image CDN

---

## For developers

### Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, Tailwind, Playwright e2e |
| Backend | FastAPI (Python) |
| AI | Gemini (structured JSON extraction) |
| Database | SQLite (MVP) |
| Deploy | Vercel (frontend) · Render (API) |

### Quick start

**Backend**

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env         # fill NEW_GEM_KEY
uvicorn main:app --reload
```

**Frontend**

```bash
cd frontend
npm install
copy .env.example .env         # optional VITE_API_URL
npm run dev
```

### Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEW_GEM_KEY` | backend `.env` | Gemini API key (server only) |
| `JWT_SECRET_KEY` | backend `.env` | JWT signing secret |
| `VITE_API_URL` | `frontend/.env` | API origin in production |

### Security

- Never commit `.env`
- See [SECURITY.md](SECURITY.md) if a key was ever exposed in Git history

Full product spec: [PRD.md](PRD.md)

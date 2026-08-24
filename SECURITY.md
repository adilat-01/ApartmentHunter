# Security

- Secrets belong in `.env` / hosting dashboards, never in Git.
- `.env.example` is placeholders only.
- Gemini keys must stay on the **server** (`NEW_GEM_KEY`). Do not prefix with `VITE_`.

## If a key leaked

History of this public repo once contained a Gemini key in `main.py` / `API.txt` (removed in a later commit). Git history still has it.

1. Rotate the key in [Google AI Studio](https://aistudio.google.com/apikey)
2. Update Render and your local `.env`
3. Do not reuse the old key

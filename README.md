# AI Placement Preparation Assistant

Full-stack AI web application for placement preparation.

## Stack

- Frontend: HTML, CSS, JavaScript
- Backend: FastAPI (Python)
- AI: Groq API

## Folder Structure

- `frontend/` - responsive UI
- `backend/` - FastAPI API server

## Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Add your Groq key in `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Run backend:

```bash
uvicorn app.main:app --reload --port 8000
```

## Frontend Setup

```bash
cd frontend
python3 -m http.server 5500
```

Open `http://127.0.0.1:5500`.

## Production Notes

- Set `ENVIRONMENT=production` in `backend/.env`.
- Set `CORS_ORIGINS` to your frontend domain(s) only.
- Run API with workers:

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

- Serve frontend behind a reverse proxy and route `/api` to backend port 8000.
- Frontend auto-uses `http://127.0.0.1:8000` on localhost and `/api` on deployed hosts.

## Deploy On Vercel (Frontend + Backend)

This repository is configured for single-project Vercel deployment:

- Frontend static files are served from `frontend/`
- FastAPI backend is exposed via `api/index.py` under `/api/*`

### Steps

1. Push repository to GitHub.
2. Import the repo in Vercel.
3. In Vercel Project Settings, add Environment Variables:
	- `GROQ_API_KEY` = your Groq API key
	- `GROQ_MODEL` = `llama-3.3-70b-versatile` (or your preferred model)
	- `ENVIRONMENT` = `production`
	- `CORS_ORIGINS` = your Vercel domain (for example `https://your-app.vercel.app`)
4. Deploy.

### Important

- Backend runs as a serverless function on Vercel.
- AI generation and PDF extraction can be slower in serverless cold starts.
- If traffic grows or request timeouts become frequent, move backend to Render/Railway/Fly and keep frontend on Vercel.

### If You See `404: NOT_FOUND` On Vercel

1. Ensure Vercel Project Root is repository root (`Flinder_AI`), not `backend/` or `frontend/`.
2. Confirm `vercel.json` exists at repo root.
3. Redeploy latest commit from `main`.
4. Open:
	- `/` for frontend
	- `/api/health` for backend health

### Vercel Project Settings (Required)

Set these values exactly in Vercel dashboard:

1. `Root Directory`: repository root (`Flinder_AI`)
2. `Framework Preset`: `Other`
3. `Build Command`: empty
4. `Output Directory`: empty (do not set `public`)
5. `Install Command`: empty

Why: this repo uses `vercel.json` rewrites + `api/index.py`. If `Output Directory` is set to `public`, Vercel can fail with "Missing public directory".

## API Routes

- `POST /upload_resume`
- `POST /generate_questions`
- `GET /health`

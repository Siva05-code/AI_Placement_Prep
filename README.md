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

## API Routes

- `POST /upload_resume`
- `POST /generate_questions`
- `GET /health`

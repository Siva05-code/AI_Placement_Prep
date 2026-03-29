# Backend - AI Placement Preparation Assistant

## Setup

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Set your `GROQ_API_KEY` in `.env`.
5. Start server:

```bash
uvicorn app.main:app --reload --port 8000
```

## Production Run

1. Use `ENVIRONMENT=production` in `.env`.
2. Set strict `CORS_ORIGINS` for your deployed frontend domain.
3. Start with multiple workers:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

4. Put a reverse proxy (Nginx/Caddy) in front of the API and route `/api` to this backend.

Notes:
- `/docs`, `/redoc`, and `/openapi.json` are disabled automatically when `ENVIRONMENT=production`.
- Backend health response includes status, environment, and version.

## API Endpoints

- `POST /upload_resume` (multipart form-data with `file`)
- `POST /generate_questions` (JSON body)
- `POST /clarify_question` (JSON body for per-question doubt clarification)
- `GET /health`

# Frontend - AI Placement Preparation Assistant

## Run

You can serve the frontend with any static server.

Example using Python:

```bash
cd frontend
python3 -m http.server 5500
```

Then open:

- `http://127.0.0.1:5500`

By default, frontend calls backend at:

- `http://127.0.0.1:8000`

Generated questions are shown as separate cards with:

- clear question text
- suggested answer
- per-question doubt chat box (calls backend `/clarify_question`)

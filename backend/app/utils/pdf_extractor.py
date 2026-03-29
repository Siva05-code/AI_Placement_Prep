from io import BytesIO

import pdfplumber


class ResumeExtractionError(Exception):
    pass


def extract_resume_text(file_bytes: bytes, filename: str) -> str:
    lowered = filename.lower()

    if lowered.endswith(".pdf"):
        return _extract_pdf_text(file_bytes)
    if lowered.endswith(".txt"):
        return _extract_text_file(file_bytes)

    raise ResumeExtractionError("Unsupported file type. Please upload a PDF or TXT file.")


def _extract_pdf_text(file_bytes: bytes) -> str:
    try:
        with pdfplumber.open(BytesIO(file_bytes)) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
            text = "\n".join(pages).strip()
    except Exception as exc:
        raise ResumeExtractionError("Could not read PDF resume.") from exc

    if not text:
        raise ResumeExtractionError("PDF appears empty or unreadable.")

    return text


def _extract_text_file(file_bytes: bytes) -> str:
    try:
        text = file_bytes.decode("utf-8").strip()
    except UnicodeDecodeError:
        text = file_bytes.decode("latin-1", errors="ignore").strip()

    if not text:
        raise ResumeExtractionError("Text resume is empty.")

    return text

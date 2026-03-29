from fastapi import APIRouter, File, HTTPException, UploadFile, status

from ..models.schemas import (
    ClarifyQuestionRequest,
    ClarifyQuestionResponse,
    GenerateQuestionsRequest,
    GenerateQuestionsResponse,
    ResumeUploadResponse,
)
from ..services.groq_client import GroqServiceError, generate_with_groq
from ..services.prompt_builder import build_clarification_prompt, build_prompt
from ..services.resume_store import resume_store
from ..utils.pdf_extractor import ResumeExtractionError, extract_resume_text

router = APIRouter()


@router.post("/upload_resume", response_model=ResumeUploadResponse)
async def upload_resume(file: UploadFile = File(...)) -> ResumeUploadResponse:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename is required.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    try:
        resume_text = extract_resume_text(file_bytes=file_bytes, filename=file.filename)
    except ResumeExtractionError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    resume_id = resume_store.add(resume_text)

    return ResumeUploadResponse(
        message="Resume uploaded and processed successfully.",
        resume_id=resume_id,
        extracted_chars=len(resume_text),
    )


@router.post("/generate_questions", response_model=GenerateQuestionsResponse)
async def generate_questions(payload: GenerateQuestionsRequest) -> GenerateQuestionsResponse:
    resume_text = resume_store.get(payload.resume_id)
    if not resume_text:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found. Please upload your resume again.",
        )

    prompt = build_prompt(
        resume_text=resume_text,
        job_description=payload.job_description,
        mode=payload.mode,
    )

    try:
        content = await generate_with_groq(prompt)
    except GroqServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return GenerateQuestionsResponse(mode=payload.mode, content=content)


@router.post("/clarify_question", response_model=ClarifyQuestionResponse)
async def clarify_question(payload: ClarifyQuestionRequest) -> ClarifyQuestionResponse:
    prompt = build_clarification_prompt(
        mode=payload.mode,
        question=payload.question,
        expected_answer=payload.expected_answer,
        doubt=payload.doubt,
    )

    try:
        clarification = await generate_with_groq(prompt)
    except GroqServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return ClarifyQuestionResponse(clarification=clarification)

from enum import Enum

from pydantic import BaseModel, Field


class PreparationMode(str, Enum):
    aptitude = "aptitude"
    coding = "coding"
    technical = "technical"
    hr = "hr"


class ResumeUploadResponse(BaseModel):
    message: str
    resume_id: str
    extracted_chars: int


class GenerateQuestionsRequest(BaseModel):
    resume_id: str = Field(min_length=1)
    job_description: str = Field(min_length=30, max_length=10000)
    mode: PreparationMode


class GenerateQuestionsResponse(BaseModel):
    mode: PreparationMode
    content: str


class ClarifyQuestionRequest(BaseModel):
    mode: PreparationMode
    question: str = Field(min_length=5, max_length=4000)
    expected_answer: str = Field(min_length=1, max_length=8000)
    doubt: str = Field(min_length=3, max_length=2000)


class ClarifyQuestionResponse(BaseModel):
    clarification: str

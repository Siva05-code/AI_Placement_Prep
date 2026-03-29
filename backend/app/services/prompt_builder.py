from ..models.schemas import PreparationMode


def _mode_instructions(mode: PreparationMode) -> str:
    if mode == PreparationMode.aptitude:
        return (
            "Generate exactly 10 aptitude questions tailored to the job role. "
            "Mix quantitative, logical reasoning, and verbal ability. "
            "After each question provide the correct answer and a short explanation."
        )
    if mode == PreparationMode.coding:
        return (
            "Generate coding interview questions based on the role and candidate skills. "
            "Include easy, medium, and hard levels. "
            "For each question include expected solution approach and important concepts."
        )
    if mode == PreparationMode.technical:
        return (
            "Generate technical round questions using both resume and job description. "
            "Include project-based questions, concept-based questions, and follow-up questions. "
            "Provide concise model answers or expected talking points."
        )
    return (
        "Generate personalized HR interview questions for this candidate profile. "
        "Include self-introduction, strengths and weaknesses, why this company, and situational HR questions. "
        "Provide strong sample answers aligned to the candidate's experience."
    )


def build_prompt(resume_text: str, job_description: str, mode: PreparationMode) -> str:
    mode_label = mode.value.upper()
    instructions = _mode_instructions(mode)

    return f"""
Role: Placement Interview Assistant
Task: Generate personalized preparation content.

Context:
Resume = {resume_text}
Job Description = {job_description}
Mode = {mode_label}

Instructions:
1. Analyze resume skills, projects, and experience.
2. Map them to job requirements.
3. {instructions}
4. Keep tone practical and interview-focused.
5. Return clean markdown with section headings and numbered questions.
6. For every question include an answer immediately after it.

Output Format:
- Start with a short section called "Profile Match Summary" (3-5 bullet points).
- Then provide mode-specific content in clear sections.
- Use numbered questions.
- Keep answers concise and actionable.
""".strip()


def build_clarification_prompt(
    *,
    mode: PreparationMode,
    question: str,
    expected_answer: str,
    doubt: str,
) -> str:
    return f"""
You are an interview coach helping a candidate understand one generated interview question.

Mode: {mode.value.upper()}
Question: {question}
Suggested Answer: {expected_answer}
Candidate Doubt: {doubt}

Instructions:
1. First, explain the answer in simple terms.
2. Then give a short step-by-step way to think about this question in an interview.
3. If useful, provide one short example.
4. End with one quick follow-up tip.
5. Keep response under 180 words.
""".strip()

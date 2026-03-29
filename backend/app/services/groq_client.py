from groq import AsyncGroq

from ..core.config import get_settings


class GroqServiceError(Exception):
    pass


async def generate_with_groq(prompt: str) -> str:
    settings = get_settings()

    if not settings.groq_api_key:
        raise GroqServiceError("Missing GROQ_API_KEY in environment.")

    try:
        client = AsyncGroq(api_key=settings.groq_api_key)
        response = await client.chat.completions.create(
            model=settings.groq_model,
            temperature=0.3,
            max_tokens=2200,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert placement preparation assistant.",
                },
                {"role": "user", "content": prompt},
            ],
        )
    except Exception as exc:
        raise GroqServiceError("Groq API request failed.") from exc

    content = (response.choices[0].message.content or "").strip()
    if not content:
        raise GroqServiceError("Groq returned an empty response.")

    return content

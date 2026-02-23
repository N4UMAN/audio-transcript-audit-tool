from fastapi import APIRouter, Request, HTTPException, Depends
from app.config import settings
import json
from .utils import validate_api_key
from .schema import AuditPayload, AuditResponse
from .services.deterministic_parser import run_deterministic_audit

router = APIRouter(dependencies=[Depends(validate_api_key)])


@router.post("/audit", response_model=AuditResponse)
async def generate_chat(payload: AuditPayload, request: Request, skipLLM: bool = True):
    groq_client = request.app.state.groq
    system_prompt = request.app.state.prompt_cache.get("system_prompt")

    data = payload.values

    corrections = run_deterministic_audit(data)

    if skipLLM:
        return {
            "sheetName": "null",
            "corrections": corrections
        }

    prompt = f"{system_prompt}\n{data}"
    try:
        response = await groq_client.chat.completions.create(
            model=settings.GROQ_MODEL,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "audit_results",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "issues": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "cellAddress": {"type": "string"},
                                        "issue": {"type": "string"},
                                        "fixedValue": {"type": "string"},
                                        "issueType": {"type": "string", "enum": ["SPEAKER_FORMAT", "SPEAKER_CONSISTENCY", "LANGUAGE_FORMAT", "LOCALE_FORMAT", "ACCENT_MISSING", "ACCENT_INVALID", "EMOTION_FORMAT", "NONSPEECH_FORMAT", "NONSPEECH_LANGUAGE", "TRANSCRIPT_STUTTER", "TRANSCRIPT_NUMBER", "TRANSCRIPT_TRUNCATION", "TRANSCRIPT_CAPITALIZATION", "TRANSCRIPT_OVERLAP", "TRANSCRIPT_PAUSE", "TIMESTAMP_ORDER", "TIMESTAMP_GAP"]},
                                        "originalValue": {"type": "string"}
                                    },
                                    "required": ["cellAddress", "issue", "fixedValue", "issueType", "originalValue"],
                                    "additionalProperties": False
                                }
                            }
                        },
                        "required": ["issues"],
                        "additionalProperties": False
                    }
                }
            },
            messages=[
                {"role": "system", "content": prompt},
            ]
        )

        content = response.choices[0].message.content
        corrections = json.loads(content)["issues"]

        return {
            "sheetName": payload.sheetName,
            "corrections": corrections
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Groq Error: {str(e)}")

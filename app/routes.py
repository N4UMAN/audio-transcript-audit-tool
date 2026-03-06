from fastapi import APIRouter, Request, HTTPException, Depends, status
from app.config import settings
import json
from .utils import validate_api_key
from .schema import AuditPayload, AuditResponse
from .services.deterministic_parser import run_deterministic_audit
import time
router = APIRouter(dependencies=[Depends(validate_api_key)])


@router.post("/audit", response_model=AuditResponse)
async def generate_chat(payload: AuditPayload, request: Request, skipLLM: bool = True):
    start = time.perf_counter()

    data = payload.values
    try:
        corrections = run_deterministic_audit(data)

        elapsed_ms = (time.perf_counter() - start) * 1000
        print(f"Finished evaluating in {elapsed_ms:.2f} ms")

        return {
            "sheetName": "null",
            "corrections": corrections
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error: {str(e)}")

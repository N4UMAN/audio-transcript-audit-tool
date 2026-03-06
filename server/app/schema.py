from pydantic import BaseModel, Field
from typing import List, Any
from datetime import datetime


class AuditPayload(BaseModel):
    id: str
    sheetName: str
    values: List[List[Any]]


class AuditIssue(BaseModel):
    cellAddress: str
    issue: str
    fixedValue: str
    issueType: str
    originalValue: str


class AuditResponse(BaseModel):
    sheetName: str
    corrections: List[AuditIssue]
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

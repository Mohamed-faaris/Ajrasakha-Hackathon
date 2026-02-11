from datetime import datetime
from typing import Optional, List, Dict, Any, Union, Literal
from pydantic import BaseModel, Field

class Pagination(BaseModel):
    type: Literal["none", "page", "offset", "cursor"] = "none"
    param: Optional[str] = None
    limitParam: Optional[str] = None
    step: Optional[int] = None

class Endpoint(BaseModel):
    url: str
    method: Literal["GET", "POST"] = "GET"
    headers: Dict[str, str] = {}
    bodyTemplate: Optional[Dict[str, Any]] = None
    pagination: Pagination = Field(default_factory=Pagination)

class HtmlMapping(BaseModel):
    tableSelector: str
    rowSelector: str
    columns: Dict[str, int]  # Mapping column names to indices

class SchemaMapping(BaseModel):
    date: str
    state: str
    district: str
    mandi: str
    crop: str
    variety: str
    min_price: str
    max_price: str
    modal_price: str
    unit: str

class Discovery(BaseModel):
    status: Literal["MANUAL", "AI_FOUND", "PROCESSING", "FAILED", "MANUAL_REQUIRED"]
    method: Optional[str] = None
    confidence: float = 0.0
    lastDiscoveryAt: datetime = Field(default_factory=datetime.utcnow)
    lastFailureReason: Optional[str] = None

class Health(BaseModel):
    status: Literal["OK", "STALE", "BROKEN"] = "OK"
    lastFetchedAt: Optional[datetime] = None
    lastSuccessAt: Optional[datetime] = None
    failCount: int = 0
    lastHttpCode: Optional[int] = None

class MandiSource(BaseModel):
    name: str
    state: str
    baseUrl: str
    entryUrl: str
    type: Literal["API", "HTML_TABLE", "PDF", "EXCEL", "UNDEFINED"] = "UNDEFINED"
    discovery: Discovery = Field(default_factory=lambda: Discovery(status="PROCESSING"))
    endpoint: Optional[Endpoint] = None
    htmlMapping: Optional[HtmlMapping] = None
    schemaMapping: SchemaMapping = Field(default_factory=lambda: SchemaMapping(
        date="date",
        state="state",
        district="district",
        mandi="mandi",
        crop="crop",
        variety="variety",
        min_price="min_price",
        max_price="max_price",
        modal_price="modal_price",
        unit="unit"
    ))
    health: Health = Field(default_factory=Health)

class DiscoveryOutput(BaseModel):
    type: Literal["API", "HTML_TABLE", "PDF", "EXCEL", "UNDEFINED"]
    confidence: float
    bestUrl: str
    endpoint: Optional[Endpoint] = None
    htmlMapping: Optional[HtmlMapping] = None
    schemaMapping: Dict[str, str] = {}
    reasoningSummary: str
    nextAction: Literal["SAVE_CONFIG", "RETRY", "MANUAL_REQUIRED"]

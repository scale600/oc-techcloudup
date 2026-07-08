"""OC Public Services Platform — FastAPI Backend with RAG Pipeline."""

import json
import logging
import os
from contextlib import asynccontextmanager
from typing import Optional

import httpx
import oracledb
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_CHAT = os.getenv("OLLAMA_CHAT_MODEL", "phi3:mini")
OLLAMA_EMBED = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")

WALLET_DIR = os.getenv("ORACLE_WALLET_DIR", "/app/wallet")
ORACLE_DSN = os.getenv("ORACLE_DSN", "ocpublic_medium")
ORACLE_USER = os.getenv("ORACLE_USER", "ocpublic")
ORACLE_PASSWORD = os.getenv("ORACLE_PASSWORD", "")

CONFIDENCE_THRESHOLD_HIGH = float(os.getenv("CONFIDENCE_THRESHOLD_HIGH", "0.8"))
CONFIDENCE_THRESHOLD_LOW = float(os.getenv("CONFIDENCE_THRESHOLD_LOW", "0.5"))

LOG_LEVEL = os.getenv("LOG_LEVEL", "info").upper()
logging.basicConfig(level=getattr(logging, LOG_LEVEL, logging.INFO))
logger = logging.getLogger("oc-api")

# ---------------------------------------------------------------------------
# Global state
# ---------------------------------------------------------------------------
db_pool = None
http_client: Optional[httpx.AsyncClient] = None

# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client
    http_client = httpx.AsyncClient(timeout=httpx.Timeout(120.0))
    yield
    if http_client:
        await http_client.aclose()

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="OC Public Services API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    language: str = Field(default="en", pattern="^(en|es)$")

class ChatResponse(BaseModel):
    answer: str
    confidence: str  # confirmed | estimated | verify_needed | cannot_answer
    sources: list[dict] = Field(default_factory=list)
    suggested_questions: list[str] = Field(default_factory=list)

class FeedbackRequest(BaseModel):
    query: str
    helpful: bool
    comment: Optional[str] = None

class DatasetInfo(BaseModel):
    name: str
    description: str
    last_updated: str
    source_url: str

class AlertInfo(BaseModel):
    title: str
    description: str
    severity: str
    created_at: str

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
async def get_embedding(text: str) -> list[float]:
    """Get embedding vector from Ollama."""
    resp = await http_client.post(
        f"{OLLAMA_BASE}/api/embeddings",
        json={"model": OLLAMA_EMBED, "prompt": text},
        timeout=30.0,
    )
    resp.raise_for_status()
    return resp.json()["embedding"]


def vector_search(embedding: list[float], top_k: int = 3) -> list[dict]:
    """Search Autonomous DB for similar documents."""
    if not db_pool:
        return []

    vector_str = json.dumps(embedding)
    sql = """
        SELECT content, source_name, source_url, last_updated,
               VECTOR_DISTANCE(embedding, :vec, COSINE) AS similarity
        FROM public_data.documents
        ORDER BY similarity
        FETCH FIRST :k ROWS ONLY
    """
    with db_pool.acquire() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, vec=vector_str, k=top_k)
            rows = cur.fetchall()
    return [
        {
            "content": row[0],
            "source_name": row[1],
            "source_url": row[2],
            "last_updated": str(row[3]) if row[3] else None,
            "similarity": float(row[4]) if row[4] else 0.0,
        }
        for row in rows
    ]


def determine_confidence(hits: list[dict]) -> tuple[str, list[dict]]:
    """Determine confidence tier from vector search results."""
    if not hits:
        return "cannot_answer", []
    top_score = hits[0]["similarity"]
    if top_score >= CONFIDENCE_THRESHOLD_HIGH:
        return "confirmed", hits
    if top_score >= CONFIDENCE_THRESHOLD_LOW:
        return "estimated", hits
    return "verify_needed", hits


async def generate_answer(query: str, context: str, confidence: str) -> str:
    """Generate answer via Ollama with RAG context."""
    if confidence == "cannot_answer":
        return (
            "Sorry, we couldn't find reliable information on this topic. "
            "We recommend contacting the relevant Orange County agency directly."
        )
    if confidence == "verify_needed":
        return (
            "Insufficient recent data on this topic. "
            "Please verify with the official source listed below."
        )

    system_prompt = (
        "You are a helpful public service assistant for Orange County, California. "
        "Answer the user's question using ONLY the provided context below. "
        "If the context doesn't contain enough information, say so honestly. "
        "Always cite which source you used. Keep answers concise."
    )
    prompt = f"{system_prompt}\n\nContext:\n{context}\n\nQuestion: {query}"

    resp = await http_client.post(
        f"{OLLAMA_BASE}/api/generate",
        json={"model": OLLAMA_CHAT, "prompt": prompt, "stream": False},
        timeout=90.0,
    )
    resp.raise_for_status()
    return resp.json()["response"].strip()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/health")
async def health():
    return {"status": "healthy", "db": db_pool is not None}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Main Q&A endpoint — direct Ollama call (RAG disabled on 1CPU)."""
    system = (
        "You are a helpful public service assistant for Orange County, California. "
        "Answer concisely. If unsure, say so and suggest checking official sources. "
        "Respond in the same language as the user."
    )
    prompt = f"{system}\n\nQuestion: {req.query}"

    try:
        resp = await http_client.post(
            f"{OLLAMA_BASE}/api/generate",
            json={"model": OLLAMA_CHAT, "prompt": prompt, "stream": False},
            timeout=120.0,
        )
        resp.raise_for_status()
        answer = resp.json()["response"].strip()
    except Exception as exc:
        logger.error("Ollama error: %s", exc)
        raise HTTPException(status_code=500, detail="LLM generation error")

    return ChatResponse(answer=answer, confidence="cannot_answer", sources=[], suggested_questions=[])


@app.get("/api/datasets")
async def list_datasets():
    return []

@app.get("/api/alerts")
async def list_alerts():
    return []


@app.post("/api/feedback")
async def submit_feedback(req: FeedbackRequest):
    """Record user feedback (thumbs up/down)."""
    logger.info("Feedback: query=%s helpful=%s", req.query[:80], req.helpful)
    return {"status": "ok"}

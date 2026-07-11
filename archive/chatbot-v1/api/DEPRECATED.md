# Deprecated — FastAPI Backend

This directory contains the original FastAPI backend (Python) that powered the
chatbot interface. It was decommissioned in July 2026 when the project pivoted
from an LLM-powered chatbot to a fully static infographic map.

## Why Removed

- Frontend is now a static Next.js export — loads data from `/oc-cities.json` directly
- No API endpoints are called from the frontend
- Ollama LLM inference was too slow on ARM (15-30 sec response time)
- The chatbot approach saturated the free-tier OCPU

## What It Did

- `POST /api/chat` — RAG-based Q&A using Ollama + ATP vector search
- `GET /api/datasets` — List available datasets
- `GET /api/alerts` — List active public alerts
- `POST /api/feedback` — Record user feedback

## Keep for Reference

This code is kept for reference in case backend functionality is needed in the
future. The RAG pipeline (embedding → ATP vector search → Ollama generation)
could be repurposed with a faster model or dedicated GPU.

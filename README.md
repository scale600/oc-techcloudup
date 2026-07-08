# OC TechCloudUp

> Orange County public data platform — interactive infographic maps on OCI Always Free, $0 operating cost.

[![Stack](https://img.shields.io/badge/OCI-Always_Free-ED1C24?logo=oracle)](https://www.oracle.com/cloud/free/)
[![Frontend](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Overview

An interactive BI infographic platform that visualizes Orange County, CA demographics through choropleth maps, city-level comparisons, and a lightweight analytics pipeline — all running on Oracle Cloud Infrastructure's Always Free tier at near-zero cost.

**Live**: [oc.techcloudup.com](https://oc.techcloudup.com)

| Before (Chatbot) | After (Infographic Map) |
|---|---|
| LLM response: 15–30 sec | Map load: < 1 sec |
| 1 OCPU saturated | Static + CDN-ready |
| Text-only answers | Visual, color-coded, interactive |

## Architecture

```
                          Internet
                             │
                     Cloudflare DNS (gray cloud)
                             │
                    ┌────────▼────────┐
                    │  OCI LB (Free)   │ 161.153.46.132
                    │  Health: /health │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼────────┐     │     ┌────────▼────────┐
     │  Compute (A1)    │     │     │  ATP (Free)      │
     │  2 OCPU / 12GB   │     │     │  OCPU: 1, 20GB   │
     │  Oracle Linux 9  │     │     │  ocpublic_medium │
     └────────┬────────┘     │     └─────────────────┘
              │              │
     ┌────────▼────────┐     │
     │  Docker Compose  │     │
     │                  │     │
     │  ┌────────────┐  │     │
     │  │  Nginx      │  │     │
     │  │  :80 reverse│  │     │
     │  │  proxy      │  │     │
     │  └─────┬──────┘  │     │
     │        │         │     │
     │  ┌─────▼──────┐  │     │     ┌─────────────────┐
     │  │  Frontend  │  │     │     │  n8n (standalone)│
     │  │  Next.js   │  │     │     │  Census ACS      │
     │  │  static    │  │     │     │  → DB pipeline   │
     │  └───────────┘  │     │     └─────────────────┘
     │  ┌────────────┐  │     │
     │  │  FastAPI    │  │     │
     │  │  :8000      │──┼─────┘
     │  └────────────┘  │
     │  ┌────────────┐  │
     │  │  Ollama     │  │
     │  │  :11434     │  │
     │  └────────────┘  │
     │  ┌────────────┐  │
     │  │  Open WebUI │  │
     │  │  :3000      │  │
     │  └────────────┘  │
     └──────────────────┘
```

## Tech Stack

### Infrastructure (OCI Always Free)

| Resource | Spec | Purpose |
|---|---|---|
| **Compute** | Ampere A1.Flex (2 OCPU, 12 GB) | All workloads in Docker |
| **ATP DB** | Autonomous Transaction Processing, 1 OCPU | Census & structured data |
| **Load Balancer** | 10 Mbps | Health checks, single entry point |
| **VCN** | 10.0.0.0/16, 2 public + 1 private subnet | Network isolation |
| **Object Storage** | 20 GB | Static assets, backups |

### Application

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript 5 | Static export, zero JS server needed |
| **Styling** | Tailwind CSS 4 | Utility-first, small bundle |
| **Maps** | Leaflet + react-leaflet v5 | Lightweight (42 KB), no API key needed |
| **Charts** | Chart.js + react-chartjs-2 | City comparison bar charts |
| **State** | Zustand | Tiny (1 KB) global state for i18n |
| **Backend** | FastAPI (Python 3.12) | Async, auto-docs, Slim Docker image |
| **LLM** | Ollama (tinyllama) | Local inference, no external API cost |
| **LLM UI** | Open WebUI | Chat playground for RAG testing |
| **Reverse Proxy** | Nginx | Route `/`, `/api/`, `/chat-ui/`, `/health` |
| **Orchestration** | n8n | Census ACS → DB ETL pipeline |
| **i18n** | Custom React context | EN / ES toggle, 2 locales |

### Key Libraries

```
# Frontend (package.json)
leaflet, react-leaflet         # Interactive choropleth maps
chart.js, react-chartjs-2      # City comparison charts
zustand                        # i18n state management
tailwindcss                    # Utility CSS framework

# Backend (requirements.txt)
fastapi, uvicorn               # Async REST API
oracledb                       # Oracle ATP driver
httpx                          # Async HTTP (Ollama calls)
pydantic                       # Request validation
```

## Features

- **Choropleth Map** — 34 OC cities with color-coded metric layers (Income, Population, Homes)
- **3 Metrics** — Toggle between Median Household Income, Population, and Median Home Value
- **City Detail Panel** — Click any city for full stats + OC ranking comparison
- **Mobile First** — Bottom sheet panel, horizontal scroll metric pills, 100dvh height
- **Permanent City Labels** — Faint overlay labels with hover tooltips showing actual values
- **i18n** — English / Spanish toggle, persisted in localStorage
- **$0 Ops** — OCI Always Free tier covers all compute, storage, and networking

## Quick Start

### Prerequisites

- Node.js 20+, Python 3.12+, Docker
- OCI account with Always Free resources provisioned

### Development

```bash
# Frontend
cd frontend
npm install
npm run dev          # http://localhost:3000

# Backend
cd src/api
pip install -r requirements.txt
uvicorn main:app --reload  # http://localhost:8000

# Full stack (Docker)
cd docker
docker compose up -d
```

### Production Build

```bash
# Build static frontend
cd frontend && npm run build    # outputs to frontend/out/

# Deploy static files
scp -r frontend/out/* opc@<vm>:/var/www/oc-platform/

# Deploy API container
cd docker && docker compose up -d --build api
```

## Data Pipeline

```
Census ACS API ──(n8n: cron)──► Transform ──► ATP DB (ocpublic)
                                                    │
GeoJSON (static) ◄──────────────────────────────────┘
       │
Leaflet Map (browser)
```

Data sources:
- **U.S. Census Bureau ACS 5-Year** — Demographics, income, housing
- **OC Cities GeoJSON** — Static boundary data

## Infrastructure as Config

All OCI resource IDs and deployment scripts live in `scripts/`:

| Script | Purpose |
|---|---|
| `a1-capacity-check.sh` | Poll PHX ADs for A1.Flex availability → auto-provision |
| `a1-migration.sh` | Cut over from E2.1 to A1 — Docker, Nginx, LB, terminate old VM |
| `deploy-a1-watcher.sh` | One-command deploy watcher to VM + cron setup |
| `cloud-init/a1-bootstrap.sh` | First-boot provisioning for A1 instances |

## License

MIT — see [LICENSE](LICENSE) for details.

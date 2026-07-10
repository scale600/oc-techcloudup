# OC TechCloudUp

> Orange County public data platform — interactive infographic maps on OCI Always Free, $0 operating cost.

[![Stack](https://img.shields.io/badge/OCI-Always_Free-ED1C24?logo=oracle)](https://www.oracle.com/cloud/free/)
[![Frontend](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Overview

An interactive BI infographic platform that visualizes Orange County, CA demographics through choropleth maps, city-level comparisons — running on Oracle Cloud Infrastructure's Always Free tier at **$0/month**.

**Live**: [oc.techcloudup.com](https://oc.techcloudup.com)

![OC Dashboard — Irvine selected](oc-dashboard-irvine.png)

| Before (Chatbot) | After (Infographic Map) |
|---|---|
| LLM response: 15–30 sec | Map load: < 1 sec |
| 1 OCPU saturated | Static + CDN-ready |
| Text-only answers | Visual, color-coded, interactive |

## Architecture (Post-Pivot — July 2026)

```
                        Internet
                           │
                   Cloudflare DNS (gray cloud)
                           │
                  ┌────────▼────────┐
                  │  Compute (A1)    │
                  │  1 OCPU / 6 GB   │
                  │  Oracle Linux 9  │
                  │                  │
                  │  ┌────────────┐  │
                  │  │  Nginx     │  │
                  │  │  :80       │  │
                  │  │  static    │  │
                  │  │  files     │  │
                  │  └────────────┘  │
                  └──────────────────┘

        Previously removed (chatbot pivot):
          ✗ OCI Load Balancer   ✗ ATP Database
          ✗ FastAPI             ✗ Ollama / Open WebUI
          ✗ Redis               ✗ n8n pipeline
```

## Tech Stack

### Infrastructure (OCI Always Free — $0/month)

| Resource | Spec | Cost |
|---|---|---|
| **Compute** | Ampere A1.Flex (1 OCPU, 6 GB) | $0 (744h of 1,500h) |
| **Boot Volume** | ~47 GB | $0 (within 200 GB) |
| **VCN** | Public subnet | $0 |
| **DNS** | Cloudflare (gray cloud) | $0 |

### Application

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript 5 | Static export, zero JS server needed |
| **Styling** | Tailwind CSS 4 | Utility-first, small bundle |
| **Maps** | Leaflet + react-leaflet v5 | Lightweight (42 KB), no API key needed |
| **Charts** | Chart.js + react-chartjs-2 | City comparison bar charts |
| **State** | Zustand | Tiny (1 KB) global state for i18n |
| **Web Server** | Nginx | Serve static files, gzip, security headers |
| **i18n** | Custom React context | EN / ES toggle, 2 locales |
| **Data** | Static JSON (`oc-cities.json`, 26 KB) | No database needed |

### Key Libraries

```
leaflet, react-leaflet         # Interactive choropleth maps
chart.js, react-chartjs-2      # City comparison charts
zustand                        # i18n state management
tailwindcss                    # Utility CSS framework
```

## Features

- **Choropleth Map** — 34 OC cities with 7 color-coded metric layers
- **City Detail Panel** — Click any city for full stats + OC ranking comparison
- **City Search** — Autocomplete dropdown with instant filtering
- **Comparison Bar** — Visual city-vs-OC-average for any metric
- **Mobile First** — Bottom sheet panel, horizontal scroll metric pills, 100dvh height
- **Hover Tooltips** — Actual metric values on map hover
- **i18n** — English / Spanish toggle with dynamic `<html lang>`
- **Sharable URLs** — `#metric=population&city=Irvine` deep links
- **$0 Ops** — OCI Always Free tier covers all compute, storage, and networking

## Quick Start

### Prerequisites

- Node.js 20+

### Development

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

### Production Build & Deploy

```bash
# Build static frontend
cd frontend && npm run build    # outputs to frontend/out/

# Deploy to VM
VM_IP=<your-vm-ip> ./scripts/deploy-static.sh
```

## Data

All data is sourced from the U.S. Census Bureau ACS 2019–2023 5-Year estimates and packaged as a static GeoJSON file (`frontend/public/oc-cities.json`, 26 KB).

Data sources:
- **U.S. Census Bureau ACS 5-Year** — Demographics, income, housing
- **OC Cities GeoJSON** — Static boundary data

## Cost Optimization (July 2026)

After pivoting from chatbot to static infographic map, unnecessary services were removed:

| Removed | Reason | Savings |
|---|---|---|
| Ollama + Open WebUI | Chatbot discontinued | ~4 GB RAM, CPU freed |
| FastAPI backend | Frontend uses static JSON | ~200 MB RAM |
| ATP Database | Data now in static JSON | 1 ECPU, 20 GB |
| Load Balancer | Single VM, Cloudflare DNS | 10 Mbps LB |
| A1 resize: 2→1 OCPU | Static serving needs minimal CPU | Safe margin (744h of 1,500h) |

**Result: $0/month, 100% Always Free, 50% OCPU headroom.**

Cleanup scripts:
- `scripts/oci-cleanup.sh` — Remove LB and ATP (dry-run by default)
- `scripts/deploy-static.sh` — Deploy frontend static files
- `scripts/a1-resize.sh` — Guide for reducing OCPU count

## License

MIT — see [LICENSE](LICENSE) for details.

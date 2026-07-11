# Orange County Public Service Platform — Build Proposal on OCI Always Free

> **Note**: This is the original proposal document (July 2026). The project has since pivoted from an AI chatbot platform to a static infographic dashboard. See [README.md](README.md) for current architecture.

## Project Overview

### 1.1 Background & Purpose

This project aims to build a social enterprise platform that provides **intelligent public data services** for Orange County, California residents by maximizing **Oracle Cloud Infrastructure (OCI) Always Free resources** and **open-source AI/automation tools**.

Orange County provides various public data through APIs — U.S. Census American Community Survey (ACS) data, road information, population and housing characteristics, economic indicators, and more. This platform collects and analyzes such public data, repackaging it into **information services residents can easily use in daily life**.

### 1.2 Vision & Mission

- **Vision**: Foster an inclusive digital environment where all Orange County residents can easily access and utilize public information, without anyone being left behind by technology.
- **Mission**: Build a sustainable public service platform using only OCI Always Free and open-source technologies, delivering value to the community **at zero cost**.

### 1.3 Core Service Areas

| Service Area | Description | Data Used |
| :--- | :--- | :--- |
| **Local Info Chatbot** | Natural language Q&A system based on open-source LLM (Ollama) | Demographics, housing, economic indicators (ACS data) |
| **Community Infrastructure Info** | Real-time info on road conditions, public facilities, welfare agency locations | OC road data, WIC agency locations |
| **Custom Public Alerts** | n8n workflow-based periodic data collection & anomaly detection alerts | Various public API data |
| **Data Visualization Dashboard** | Web dashboard visualizing regional statistics and trends | Population, housing, economic data |

#### Real User Scenarios

Concrete value of each service illustrated through questions OC residents might actually ask.

**🗣 Local Info Chatbot**
| Resident Question (User Scenario) | Provided Information | Confidence |
| :--- | :--- | :--- |
| "Which has higher median household income — Anaheim or Santa Ana?" | ACS 2025 comparison + source link | 🟢 Certain |
| "What is the median home price in my ZIP code 92701?" | Census Tract-level housing data | 🟢 Certain |
| "Which city in OC grew the most in population over the last 5 years?" | Year-over-year ACS trend comparison chart | 🟢 Certain |
| "How has the work-from-home rate changed since COVID?" | ACS commute mode change analysis | 🟡 Estimate |

**📍 Community Infrastructure Info**
| Resident Question | Provided Information |
| :--- | :--- |
| "Where is the nearest WIC office from my home?" | Distance-sorted + hours + phone number |
| "Are there any road construction projects in my neighborhood this week?" | OC Public Works construction schedule mapping |
| "Where can I find free meal programs for my children?" | Summer Meals / School Lunch site locations |

**🔔 Custom Public Alerts**
| User Scenario | Alert Content |
| :--- | :--- |
| "Text me when new road construction starts in my ZIP code" | New construction permit detection → SMS/email |
| "I don't want to miss OC policy changes like minimum wage increases" | Policy change detection → weekly summary alert |
| "Alert me if COVID cases surge in our county" | Anomaly detection → immediate alert |

#### Information Confidence System

The core of public service is **providing accurate information**. The following confidence system applies to all chatbot responses:

| Confidence | Meaning | Criteria |
| :--- | :--- | :--- |
| 🟢 **Certain** | Official data-based, source verified | RAG search score ≥ 0.8, includes source link |
| 🟡 **Estimate** | Data-based but involves interpretation/calculation | RAG score 0.5–0.8, marked "estimate" |
| 🔴 **Needs Verification** | Insufficient data, LLM-augmented response | RAG score < 0.5, directs to official agencies like OCHCA |
| ⛔ **Cannot Answer** | No reliable information available | "Sorry, we couldn't find reliable information for this question. We recommend contacting XXX agency directly." |

> ⚠️ **RAG Failure Handling Principle**: If the relevance score of retrieved documents falls below the threshold, **never generate an answer**. Saying "I don't know" is far more responsible as a public service than providing incorrect information.

All responses include source attribution in the format: `[Source: dataset name, reference year, last updated]`.

---

## Technical Architecture

### 2.1 Architecture Diagram

```mermaid
flowchart TB
    subgraph Users[👥 Service Users]
        U1[Orange County<br>General Residents]
        U2[Local Community<br>Organizations]
    end

    subgraph Cloudflare[☁️ Cloudflare - DNS & Security]
        CF_DNS[DNS Management<br>techcloudup.com]
        CF_WAF[WAF & DDoS<br>Protection]
        CF_CDN[CDN Caching]
    end

    subgraph OCI[☁️ Oracle Cloud Infrastructure - Always Free]
        direction TB
        
        subgraph Network[🌐 Network Layer]
            LB[OCI Load Balancer<br>10 Mbps - Always Free]
            VCN[Virtual Cloud Network<br>Public/Private Subnet]
        end

        subgraph Compute[🖥️ Compute Layer]
            direction LR
            VM1[VM #1 - Ampere A1<br>2 OCPU / 12GB<br>Main Service]
            VM2[VM #2 - AMD Micro<br>1/8 OCPU / 1GB<br>Failover]
        end

        subgraph VM1_Services[VM #1 Services - Docker Compose]
            Nginx[Web Server<br>Nginx + Reverse Proxy]
            API[API Server<br>FastAPI / Express]
            Ollama[Ollama + Open WebUI<br>Open-source LLM]
            Redis[Redis<br>Response Caching]
        end

        subgraph VM2_Services[VM #2 Services - Failover]
            Fallback[Nginx Static Page<br>'Under Maintenance' Notice]
        end

        subgraph Data[💾 Data Layer]
            DB[(Autonomous AI DB<br>20GB - Always Free)]
            BlockStorage[Block Storage<br>200GB - Always Free]
            ObjStorage[Object Storage<br>20GB - Always Free]
        end
    end

    subgraph External[🌍 External Services]
        N8N[n8n<br>n8n.techcloudup.com<br>Workflow Automation<br>⛅ Already Operating]
        OC_API[Orange County<br>Public Data Portal API]
        Census_API[U.S. Census Bureau<br>ACS Data API]
    end

    Users --> Cloudflare
    Cloudflare --> LB
    LB --> VM1
    LB -.->|fallback| VM2
    VM1 --> Nginx --> API
    VM1 --> Ollama
    API --> DB
    API --> BlockStorage
    API --> Redis
    Ollama --> DB
    N8N -.->|periodic collection| OC_API
    N8N -.->|periodic collection| Census_API
    N8N --> DB
```

### 2.2 Resource Allocation Plan (reflecting June 2026 policy)

As of June 15, 2026, OCI Always Free Ampere A1 Compute limits were **reduced from 4 OCPU/24GB to 2 OCPU/12GB**. Since n8n is already operating at `n8n.techcloudup.com` (excluded from OCI resources), the entire A1 allocation is dedicated to the main service VM.

| Resource | Always Free Limit | This Project Allocation | Notes |
| :--- | :--- | :--- | :--- |
| **Ampere A1.Flex** | **2 OCPU, 12GB total** | VM #1: 2 OCPU / 12GB | Main service (Ollama + API + Web) |
| **AMD Micro** | 2 instances | VM #2: 1/8 OCPU / 1GB | Health Check + static failover page |
| **Autonomous AI DB** | 2 instances, 20GB each | 1 instance (20GB) | Vector search & RAG |
| **Block Storage** | 200GB total | VM #1 OS 50GB + data 100GB<br>VM #2 OS 50GB | |
| **Object Storage** | 20GB | Logs, static assets, backups | |
| **Load Balancer** | 1 (10Mbps) | Traffic distribution & HA | |
| **Outbound Traffic** | 10 TB/month | Reduced via Cloudflare CDN | |

#### VM #1 Resource Allocation (A1 2 OCPU / 12GB)

| Component | Est. Memory | Notes |
| :--- | :--- | :--- |
| OS (Oracle Linux 9) | ~1 GB | |
| Nginx (+ SSL termination) | ~200 MB | Reverse proxy + static file serving |
| FastAPI / Express API Server | ~500 MB | Includes RAG pipeline |
| Ollama + Phi-3-mini (3.8B, Q4) | ~2.5 GB | Full 2 OCPU utilization, target 5–8s response |
| Open WebUI | ~300 MB | Chatbot frontend |
| Redis (optional) | ~300 MB | API response caching. Can be replaced by Autonomous DB Result Cache + Nginx FastCGI Cache |
| **Free Memory** | **~7 GB** | Peak headroom & future expansion |

> ⚠️ **Important**:
> - **Autonomous AI Database** in Always Free version is limited to **max 30 concurrent sessions**. Restrict DB connection pool to 10 and adjust n8n worker count to stay within session limits.
> - **Use lightweight models (Phi-3-mini 3.8B or Qwen2 4B) instead of 7B+ models**. On 2 OCPU, 7B models suffer severe response latency — unsuitable for chatbot UX.

#### VM #2 Failover Strategy (AMD Micro)

When VM #1 fails, the Load Balancer automatically redirects traffic to VM #2. VM #2 hosts only Nginx + static HTML page with the following notice:

> **Under Maintenance**
> The service is temporarily unavailable due to server maintenance.
> We will restore normal operation as quickly as possible.
> Emergency contact: [email/contact]

This approach is fully operable even on 1/8 OCPU, 1GB RAM AMD Micro, and provides a far better user experience than showing "nothing at all" — essential for a public service. Since only Nginx static pages are served with no DB queries, DB session limits are not consumed.

---

## Technology Stack

### 3.1 Infrastructure & Operations

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Cloud** | OCI Always Free | Permanent free resources, ARM-based Ampere A1 instance support |
| **DNS/Security** | Cloudflare | Integrated free DNS, CDN, WAF, DDoS protection |
| **OS** | Oracle Linux 9 / Ubuntu 22.04 LTS | ARM64 architecture optimization support |
| **Container** | Docker + Podman | Lightweight container operations in OCI ARM environment |
| **Orchestration** | Docker Compose | Simple multi-container configuration management |

### 3.2 Backend & API

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Web Server** | Nginx | Lightweight, high-performance, reverse proxy & SSL termination |
| **API Server** | Node.js (Express) / Python (FastAPI) | Rich open-source ecosystem, ARM native support |
| **Database** | Oracle Autonomous AI Database | Always Free, built-in vector search, APEX support |
| **Caching** | Redis (in-memory) | Performance improvement via API response caching |

### 3.3 Open-Source AI Tools

| Tool | Purpose | Notes |
| :--- | :--- | :--- |
| **Ollama** | Run open-source LLMs (Phi-3-mini, Qwen2 4B, etc.) | Docker-based deployment on VM #1 A1 2 OCPU/12GB |
| **Open WebUI** | Web-based chatbot interface for Ollama | HTTPS via Docker + Nginx reverse proxy |
| **LangChain** | Build RAG (Retrieval-Augmented Generation) pipeline | Open-source LLM app development framework |
| **Autonomous DB Vector Search** | Vector embedding search (no separate Vector DB needed) | Oracle 23ai built-in feature |

### 3.4 External Services (already operating)

| Service | Purpose | Endpoint |
| :--- | :--- | :--- |
| **n8n** | Workflow automation (periodic public API collection, data processing, alerts) | `n8n.techcloudup.com` ⛅ |
| **Cloudflare** | DNS, CDN, WAF, DDoS protection | Manages `techcloudup.com` |

### 3.5 Frontend

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Next.js / React | Rich component ecosystem, SSR/SSG support |
| **Styling** | Tailwind CSS | Rapid responsive design implementation |
| **State Management** | Zustand / React Query | Lightweight, easy server state sync |
| **Data Visualization** | D3.js / Chart.js | Open-source charting libraries |

---

## Quality-Focused Implementation Strategy

### 4.1 Quality of Service Guarantees

#### 4.1.1 High Availability

| Item | Implementation | Expected Effect |
| :--- | :--- | :--- |
| **Traffic Distribution** | OCI Load Balancer with VM #1 (main) + VM #2 (fallback) | Auto-failover to VM #2 with static notice page on VM #1 failure |
| **Auto-Recovery** | OCI instance monitoring + Health Check detects VM #1 recovery | Failover within 5 min of detection, auto-rollback on recovery |
| **Data Redundancy** | Autonomous AI DB auto-backup & HA configuration | Zero data loss risk |

#### 4.1.2 Performance

| Item | Implementation | Expected Effect |
| :--- | :--- | :--- |
| **API Response Caching** | Redis in-memory cache for public API call results | 80% reduction in repeated call response time |
| **CDN Caching** | Cloudflare CDN caches static assets & API responses | Improved global perceived speed |
| **LLM Optimization** | Quantized lightweight models (Phi-3-mini 3.8B, Qwen2 4B) | 5–8s response achievable even on ARM 2 OCPU |
| **DB Indexing** | Optimized indexes on frequently queried columns | 50% reduction in query response time |

#### 4.1.3 Security

| Item | Implementation | Expected Effect |
| :--- | :--- | :--- |
| **WAF Protection** | Cloudflare WAF blocks SQL Injection, XSS, etc. | 99% web attack prevention |
| **DDoS Defense** | Cloudflare DDoS protection layer activated | Large-scale traffic attack defense |
| **End-to-End HTTPS** | TLS across all segments: Cloudflare → OCI LB → VM | Data-in-transit encryption |
| **Access Control** | OCI security lists (firewall rules) + IAM policies | Principle of least privilege |
| **Secrets Management** | OCI Vault or encrypted environment variables | Sensitive data leak prevention |

#### 4.1.4 Scalability

| Item | Implementation | Expected Effect |
| :--- | :--- | :--- |
| **Vertical Scaling** | Adjust OCPU/memory as needed (within Always Free limits) | Temporary response to traffic spikes |
| **Horizontal Scaling** | Consider adding VMs & DB sharding if moving to paid tier | Long-term growth readiness |
| **Microservices** | Separate Ollama, API server, WebUI as Docker containers | Independent per-module scaling/updates |

### 4.2 Data Quality Management

| Item | Implementation |
| :--- | :--- |
| **Data Validation** | Include data schema validation step in n8n workflows |
| **Anomaly Detection** | Auto-detect and alert on statistical anomalies in collected data |
| **Data Integrity** | Periodic data integrity checks and deduplication |
| **Metadata Management** | Version and source metadata tagging on all collected datasets |
| **Backup Policy** | Daily automatic backup to Object Storage, 30-day retention |

### 4.3 User Experience (UX) Quality

| Item | Implementation |
| :--- | :--- |
| **Responsive Design** | Optimized for mobile/tablet/desktop — all devices |
| **Accessibility** | WCAG 2.1 AA compliance (support for visually impaired) |
| **Multilingual Support** | English + Spanish (OC's primary languages) |
| **Loading Optimization** | Lazy image loading, code splitting, prefetching |
| **User Feedback** | In-service feedback channel + periodic user surveys |

### 4.4 Operational Quality

| Item | Implementation |
| :--- | :--- |
| **Monitoring** | Real-time VM CPU/memory/network tracking via OCI Monitoring |
| **Logging** | Application logs tiered (INFO/WARN/ERROR) to Object Storage |
| **Alerting** | Email/SMS alerts on threshold breaches (via n8n workflows) |
| **Zero-Downtime Deploy** | Docker Compose rolling updates (new container on VM #1 → traffic switch → old container stop) |
| **Disaster Recovery (DR)** | Daily Object Storage auto-backup + n8n-based recovery automation (RPO 24h, RTO 4h target) |

### 4.5 Information Reliability — Core of Public Service Quality

In public service, **incorrect information directly destroys trust**. A 4-layer defense system is applied to prevent LLM hallucinations and guarantee information accuracy.

#### 4.5.1 RAG-Based Source Verification Pipeline

```
User Question
  ↓
Stage 1: RAG Search → Autonomous DB Vector Search retrieves relevant documents
  ↓
Stage 2: Relevance Scoring → If below threshold (0.5), trigger "Cannot Answer"
  ↓
Stage 3: Source Mapping → Tag retrieved docs with dataset name, collection date, update frequency
  ↓
Stage 4: LLM Response Generation → Prompt constraint: "Answer using only the provided documents"
  ↓
Response + [Source: ACS 2025 Table B19013, Updated: 2026-06-15] + Confidence Badge
```

#### 4.5.2 4-Tier Response Confidence System

| Confidence | RAG Score | Example Response | Guideline |
| :--- | :--- | :--- | :--- |
| 🟢 **Certain** | ≥ 0.8 | "As of 2025, Santa Ana's median household income is $78,450 [Source: ACS 2025]" | Direct official data translation |
| 🟡 **Estimate** | 0.5–0.8 | "Aggregating multiple data sources suggests approximately a 15% increase [Source: ACS 2023-2025]" | Trend analysis or calculation included |
| 🔴 **Needs Verification** | < 0.5 | "Insufficient recent data on this topic. We recommend checking directly with OC Health Care Agency (www.ochealthinfo.com)." | Data shortage, agency referral |
| ⛔ **Cannot Answer** | N/A | "Sorry, we currently have no reliable information to answer this question." | Zero RAG results — never guess |

> ⚠️ **Core Principle**: Completely block the LLM from "making up" answers. Respond only based on retrieved documents. If RAG returns no results, **never answer**.

#### 4.5.3 Data Provenance Management

| Item | Implementation |
| :--- | :--- |
| **Source Metadata** | Mandatory tagging on all collected data: `source`, `collection_date`, `update_frequency`, `contact_org` |
| **Data Freshness** | n8n workflows track update cycles per source; alert operator on update delays |
| **Version Control** | Dataset snapshots versioned in Object Storage, comparable against previous data |
| **Source Transparency** | `/data-sources` page publicly discloses all data sources, update dates, and usage terms |
| **Corrigenda** | Record error corrections with history on a corrigenda page to maintain institutional trust |

#### 4.5.4 User Feedback → Data Improvement Loop

```
User rates response: "Was this helpful? 👍 / 👎"
  ↓ 👎
"What was inaccurate?" (free text)
  ↓
n8n workflow → operator Slack/email alert + feedback DB storage
  ↓
Operator review → verify data source → manual correction if needed
  ↓
Correction logged to corrigenda → reflected in next data update cycle
```

> Public data, even when provided by official agencies, may contain errors or delays. **Resident feedback serves as the first line of detection for data quality improvement.**

### 4.6 Operational Governance

Technology alone cannot maintain public service quality. A **minimal human-involved operational framework** is defined.

#### 4.6.1 Role Definitions

| Role | Responsibilities | Est. Time |
| :--- | :--- | :--- |
| **Service Operator** | Server health monitoring, incident response, deployment management | 2–3 hrs/week |
| **Data Curator** | Data source discovery, quality review, metadata management, user feedback response | 2–4 hrs/week |
| **Community Manager** | User inquiry response, social media, local organization partnerships | 1–2 hrs/week |

> Initially, 1–2 people cover all roles, investing 5–8 hrs/week of operational effort to maintain service quality.

#### 4.6.2 Regular Operational Activities

| Frequency | Activity |
| :--- | :--- |
| **Daily** | n8n workflow success verification (automated), DB session usage check |
| **Weekly** | New data source research, user feedback review & response, chatbot incorrect answer log analysis |
| **Monthly** | Service usage report, data freshness audit, Always Free policy change monitoring |
| **Quarterly** | LLM prompt tuning (based on error patterns), RAG search quality evaluation, security vulnerability scan |

#### 4.6.3 Data Collection Governance

| Principle | Description |
| :--- | :--- |
| **Public Data First** | Use only officially provided government/public agency data; third-party data requires verified sources |
| **Collection Transparency** | Disclose all data sources, collection cycles, and terms of use on the `/data-sources` page |
| **No PII Collection** | Never collect or store resident Personally Identifiable Information. All data at aggregated level |
| **Data Retention Policy** | Raw snapshots 30 days, processed data 1 year, analysis results indefinitely (reflected in Object Storage policy) |

---

## Domain & Network Configuration

### 5.1 DNS Delegation Structure

`techcloudup.com` remains on Cloudflare, while only the `oc.techcloudup.com` subdomain is managed via OCI using **DNS Delegation**.

```
techcloudup.com (Cloudflare-managed)
    └── oc.techcloudup.com (delegated to OCI DNS)
            ├── A Record → OCI Load Balancer public IP
            └── (additional subdomains as needed)
```

**Implementation Steps**:
1. Create `oc.techcloudup.com` in OCI DNS Zone → verify OCI nameservers (NS)
2. Add NS record in Cloudflare DNS (`Name: oc`, `Nameserver: OCI NS addresses`)
3. Create A record in OCI DNS → point to OCI Load Balancer IP

### 5.2 Network Security Configuration

| Component | Configuration |
| :--- | :--- |
| **VCN** | 10.0.0.0/16 (Public Subnet: 10.0.1.0/24, Private Subnet: 10.0.2.0/24) |
| **Ingress Rules** | HTTPS (443) only, from Cloudflare IP ranges |
| **Egress Rules** | HTTPS (443) for public API calls |
| **Load Balancer** | Placed in public subnet, HTTPS listener configured |

---

## Project Timeline (8 Weeks)

n8n is already operating at `n8n.techcloudup.com`, requiring no separate build phase. Sufficient buffer is allocated for OCI resource provisioning and LLM tuning.

| Phase | Duration | Key Activities | Deliverables |
| :--- | :--- | :--- | :--- |
| **Week 1** | 1 week | OCI VCN setup, security list configuration, Load Balancer creation | Network foundation complete |
| **Week 2** | 1 week | Provision 2 VMs (A1 + AMD Micro), Oracle Linux install, Docker/Compose setup | Compute environment ready |
| **Week 3** | 1 week | Autonomous AI DB creation, schema design, n8n workflow data pipeline integration | Data collection infrastructure |
| **Weeks 4–5** | 2 weeks | Deploy Ollama + Open WebUI, install lightweight LLM, prompt tuning | AI chatbot MVP |
| **Weeks 6–7** | 2 weeks | FastAPI/Express API server development, RAG pipeline, web frontend development | Application complete |
| **Week 8** | 1 week | Cloudflare DNS delegation, end-to-end testing, monitoring/logging, load testing, documentation | Service launch |

---

## Estimated Costs (Monthly)

| Item | Cost | Notes |
| :--- | :--- | :--- |
| OCI Always Free Resources | **$0** | Free within limits |
| Cloudflare (Free Plan) | **$0** | DNS, CDN, WAF included |
| Domain (techcloudup.com) | Already owned | Previously secured |
| **Total Monthly Operating Cost** | **$0** | |

---

## Expected Impact & Social Value

### 6.1 Quantitative Metrics

| Metric | Target (Year 1) |
| :--- | :--- |
| Monthly Active Users (MAU) | 500 |
| Public Data API Utilization | 10,000+ calls/month |
| Chatbot Q&A Sessions | 1,000+ sessions/month |
| Service Availability | 99.5% (≤ 3.6 hrs downtime/month) |

### 6.2 Qualitative Metrics

| Metric | Measurement | Target (Year 1) |
| :--- | :--- | :--- |
| Chatbot Answer Satisfaction | "Was this helpful? 👍/👎" | 👍 rate ≥ 80% |
| User Return Rate | Users visiting ≥ 2x/month | ≥ 30% |
| Perceived Information Trust | Quarterly survey: "Do you trust this service's information?" | ≥ 4.0 / 5.0 |
| RAG Response Success Rate | % of questions answered at 🟢/🟡 confidence | ≥ 85% |
| ⛔ Cannot Answer Rate | % of "information not found" responses | < 10% (higher = data shortage) |
| Feedback Response Time | User 👎 report → operator review complete | ≤ 48 hours |
| Data Freshness Compliance | % of data sources refreshed within collection cycle | ≥ 95% |

### 6.3 Social Impact

- **Improved Information Access**: Anyone can access public information without technical barriers.
- **Community Engagement**: Formation of communities using public data for local problem-solving.
- **Bridging the Digital Divide**: Free service provides digital benefits without economic burden.
- **Sustainable Social Enterprise Model**: Proves feasibility of creating social value at $0 operating cost.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Always Free Policy Change** | Further resource limit reduction | • Regular policy monitoring<br>• Prepare paid transition options for excess |
| **Instance Reclamation** | Auto-termination of idle VMs | • Maintain minimal Health Check traffic<br>• Periodic cron jobs to sustain CPU utilization |
| **LLM Performance Degradation** | Poor user experience | • Select & quantize lightweight models<br>• Caching to reduce repeated query response time |
| **Public API Change/Discontinuation** | Service functionality paralysis | • Secure multiple data sources<br>• API change detection & auto-alert system |
| **Security Breach** | Personal data exposure | • Cloudflare WAF + OCI security list dual defense<br>• Regular security audits & vulnerability scans |

---

This proposal presents the optimal approach to implementing a **sustainable public service platform using only OCI Always Free resources and open-source technologies**. With zero reliance on trial services, the platform can continue operating at **$0/month** even after the free trial period expires, realizing an inclusive and sustainable digital public service aligned with the mission of a social enterprise.

For detailed implementation guides or additional questions at any phase, please reach out.

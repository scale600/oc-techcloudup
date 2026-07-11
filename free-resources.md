# OCI Always Free Resources

> **Tenant**: `richneogo` | **Home Region**: `us-phoenix-1` | **Account**: `richneo.go@gmail.com`  
> Always Free resources are **free indefinitely** — available as long as the account is active.  
> Provisioning is only available in the **Home Region**.

---

## 🖥 Compute

| Resource | Spec | Free Limit |
|---|---|---|
| **AMD Micro (VM.Standard.E2.1.Micro)** | 1/8 OCPU, 1 GB RAM | Up to **2 instances** |
| **Ampere A1 Flex (VM.Standard.A1.Flex)** | Arm-based, adjustable OCPU/memory | **3,000 OCPU hrs/mo** + **18,000 GB hrs/mo** |
| | Always Free cap: 2 OCPU + 12 GB combination (2026.06 policy) | e.g., 2 OCPU×12GB ×1 or 1 OCPU×6GB ×2 |

> 💡 Ampere A1 is a Flex Shape — adjust OCPU/memory sliders when creating instances.

---

## 💾 Storage

| Resource | Spec | Free Limit |
|---|---|---|
| **Block Volume** | NVMe SSD-based | **200 GB** total (Boot + Block combined) |
| **Block Volume Backup** | Auto/manual backups | **5 backups** |
| **Object Storage - Standard** | S3-compatible API | **20 GB** |
| **Archive Storage** | Low-cost long-term retention | **10 GB** |
| **Outbound Data Transfer** | Monthly outbound traffic | **10 TB/month** |

> ⚠️ Boot volumes: minimum 47 GB (A1) / 50 GB (AMD) per instance by default.  
> Counts toward the 200 GB Block Volume limit — account for headroom when sizing instances.

---

## 🗄 Database

| Resource | Spec | Free Limit |
|---|---|---|
| **Autonomous Database** | 23ai, all workloads (ATP, ADW, AJD, APEX) | **2 instances** total |
| | 1 ECPU, 20 GB Storage | Transactional, DW, JSON, APEX — all supported |
| **NoSQL Database** | | **133M reads/mo** + **133M writes/mo** |
| | | **3 tables**, **25 GB** per table |
| **MySQL HeatWave** | Standalone, 1 Node | **50 GB** storage + **50 GB** backup |
| **Oracle APEX Service** | Low-code app development | **2 ECPU**, **20 GB** (within 2 DB limit) |

> 💡 Autonomous DB supports SQL, REST, MongoDB API, JSON (SODA), Graph, ML, APEX — multi-model.  
> 💡 NoSQL is **Phoenix region only** → usable since the tenant's Home Region is Phoenix.

---

## 🌐 Networking

| Resource | Spec | Free Limit |
|---|---|---|
| **Virtual Cloud Network (VCN)** | Software-defined network | **Unlimited** (subnets, routing, security lists included) |
| **Flexible Load Balancer** | L7, HTTP/HTTPS | **1 instance**, 10 Mbps |
| **Flexible Network Load Balancer** | L4, TCP/UDP | **1 instance**, 10 Mbps |
| **Site-to-Site VPN** | IPSec VPN tunnels | **Unlimited** (by tunnel count) |
| **NAT Gateway** | Outbound only | **1** (free) |
| **Service Gateway** | OCI service access | **1** (free) |

---

## 🔐 Security

| Resource | Spec | Free Limit |
|---|---|---|
| **Vault** | Key Management | **20 key versions** |
| **Bastions** | Session-based SSH access | **5 bastions**, **5 sessions** |
| **Security Advisor** | Vulnerability assessment | **Free** |
| **Cloud Guard** | Threat detection | **Free** (basic features) |

---

## 📊 Observability & Management

| Resource | Spec | Free Limit |
|---|---|---|
| **Monitoring** | Metrics, Alarms | **500M time-series data points** |
| **Notifications** | Email, Slack, PagerDuty, etc. | **1M/month** |
| **Logging** | Centralized log collection | **10 GB/month** ingestion |
| **Application Performance Monitoring** | APM Tracing, Synthetic | **1M trace events/month** |
| **Service Connector Hub** | Event-driven service integration | **2 connectors** |

---

## 🛠 Developer Services

| Resource | Spec | Free Limit |
|---|---|---|
| **Resource Manager** | Terraform-based IaC | **Free** |
| **Email Delivery** | SMTP email delivery | **100/month** (3,000/day limit) |
| **Content Management** | Headless CMS (Starter) | **1 instance**, 5,000 assets |

---

## 🤖 AI / ML

| Resource | Spec | Free Limit |
|---|---|---|
| **OCI Language** | Text analysis (sentiment, keywords, etc.) | **5,000/month** |
| **OCI Speech** | Speech-to-text | **5,000/month** |
| **OCI Vision** | Image analysis, OCR | **1,000/month** |
| **OCI Document Understanding** | Document parsing | **1,000/month** |
| **Generative AI (Playground)** | LLM inference | **Free** (limited tokens) |

---

## 💡 Example Configurations (Always Free only)

### Web App Hosting (Zero Cost)

```
VCN (free)
├── Public Subnet
│   ├── Ampere A1 (2 OCPU, 12 GB) → 1 instance, app server + Ollama
│   ├── Flexible LB (10 Mbps) → traffic distribution
│   └── Bastion → SSH access
├── Private Subnet
│   └── Autonomous DB (ATP) → 1 instance
└── Object Storage (20 GB) → static assets
```

**Monthly cost: $0**

### Personal Dev Environment

```
VCN (free)
├── AMD Micro (1 GB) → dev/test servers ×2
├── Autonomous DB (APEX) → low-code apps
└── NoSQL DB → 3 tables, 25 GB/table
```

**Monthly cost: $0**

---

## ⚠️ Important Notes

1. **Always Free is Home Region only** — creating resources in other regions incurs charges.
2. **After Trial ($300) ends** — Always Free excess resources are automatically stopped → deleted after 30 days.
3. **Ampere A1**: exceeding 3,000 OCPU hours/month is billable (2 OCPU × 744 hrs = 1,488 — consider 1 OCPU or burstable config for safety margin).
4. **Autonomous DB**: automatically stops after 7 days of inactivity (idle shutdown), restarts on next connection.
5. **Credit card required** — for identity verification only. No charges within Always Free limits.

---

## 🔗 Reference Links

- [OCI Always Free Official Docs](https://docs.oracle.com/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
- [OCI Free Tier FAQ](https://www.oracle.com/cloud/free/faq/)

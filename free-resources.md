# OCI Always Free Resources

> **Tenant**: `richneogo` | **Home Region**: `us-phoenix-1` | **계정**: `richneo.go@gmail.com`  
> Always Free 리소스는 **무기한 무료**, 계정이 살아있는 한 계속 사용 가능.  
> 단, **Home Region에서만** 프로비저닝 가능.

---

## 🖥 Compute

| 리소스 | 사양 | 무료 한도 |
|---|---|---|
| **AMD Micro (VM.Standard.E2.1.Micro)** | 1/8 OCPU, 1 GB RAM | 최대 **2대** |
| **Ampere A1 Flex (VM.Standard.A1.Flex)** | Arm 기반, OCPU·메모리 조절 가능 | **월 1,500 OCPU 시간** + **9,000 GB 시간** |
| | Always Free 기준: 2 OCPU + 12 GB 조합까지 가능 (2026.6 정책) | 예: 2 OCPU×12GB 1대 or 1 OCPU×6GB 2대 |

> 💡 Ampere A1은 Flex Shape라서 인스턴스 생성 시 OCPU/메모리 슬라이더로 조절.

---

## 💾 Storage

| 리소스 | 사양 | 무료 한도 |
|---|---|---|
| **Block Volume** | NVMe SSD 기반 | 총 **200 GB** (Boot + Block 합산) |
| **Block Volume Backup** | 자동/수동 백업 | **5개** 백업 |
| **Object Storage - Standard** | S3 호환 API | **20 GB** |
| **Archive Storage** | 저비용 장기 보관 | **10 GB** |
| **Outbound Data Transfer** | 월간 아웃바운드 트래픽 | **10 TB/월** |

> ⚠️ Boot Volume은 인스턴스당 최소 47 GB (A1) / 50 GB (AMD) 기본 할당.  
> Block Volume 200 GB 한도에 포함되므로 인스턴스 크기 조절 시 여유 계산 필요.

---

## 🗄 Database

| 리소스 | 사양 | 무료 한도 |
|---|---|---|
| **Autonomous Database** | 23ai, 모든 워크로드 (ATP, ADW, AJD, APEX) | 총 **2개** 인스턴스 |
| | ECPU 1, Storage 20 GB | 트랜잭션, DW, JSON, APEX 모두 가능 |
| **NoSQL Database** | | 월 **1.33억 읽기** + **1.33억 쓰기** |
| | | **테이블 3개**, 테이블당 **25 GB** |
| **MySQL HeatWave** | Standalone, 1 Node | **50 GB** 스토리지 + **50 GB** 백업 |
| **Oracle APEX Service** | Low-code App 개발 | **2 ECPU**, **20 GB** (Autonomous DB 2개 한도 내) |

> 💡 Autonomous DB는 SQL, REST, MongoDB API, JSON(SODA), Graph, ML, APEX 등 다중 모델 지원.  
> 💡 NoSQL은 **Phoenix 리전 전용** → 현재 테넌트의 Home Region이므로 사용 가능.

---

## 🌐 Networking

| 리소스 | 사양 | 무료 한도 |
|---|---|---|
| **Virtual Cloud Network (VCN)** | 소프트웨어 정의 네트워크 | **무제한** (서브넷, 라우팅, 보안 리스트 포함) |
| **Flexible Load Balancer** | L7, HTTP/HTTPS | **1대**, 10 Mbps |
| **Flexible Network Load Balancer** | L4, TCP/UDP | **1대**, 10 Mbps |
| **Site-to-Site VPN** | IPSec VPN 터널 | **무제한** (터널 수 기준) |
| **NAT Gateway** | Outbound 전용 | **1개** (무료) |
| **Service Gateway** | OCI 서비스 접근 | **1개** (무료) |

---

## 🔐 Security

| 리소스 | 사양 | 무료 한도 |
|---|---|---|
| **Vault** | Key Management | **20개** 키 버전 |
| **Bastions** | 세션 기반 SSH 접근 | **5개** Bastion, **5개** 세션 |
| **Security Advisor** | 보안 취약점 점검 | **무료** |
| **Cloud Guard** | 위협 탐지 | **무료** (기본 기능) |

---

## 📊 Observability & Management

| 리소스 | 사양 | 무료 한도 |
|---|---|---|
| **Monitoring** | Metrics, Alarms | **5억 시계열 데이터 포인트** |
| **Notifications** | Email, Slack, PagerDuty 등 | **월 100만 건** |
| **Logging** | 중앙 로그 수집 | **월 10 GB** 수집 |
| **Application Performance Monitoring** | APM Tracing, Synthetic | **월 100만 Trace 이벤트** |
| **Service Connector Hub** | 이벤트 기반 서비스 연동 | **2개** 커넥터 |

---

## 🛠 Developer Services

| 리소스 | 사양 | 무료 한도 |
|---|---|---|
| **Resource Manager** | Terraform 기반 IaC | **무료** |
| **Email Delivery** | SMTP 이메일 발송 | **월 100건** (일 3,000건 제한) |
| **Content Management** | Headless CMS (Starter) | **1개** 인스턴스, 5,000개 자산 |

---

## 🤖 AI / ML

| 리소스 | 사양 | 무료 한도 |
|---|---|---|
| **OCI Language** | 텍스트 분석 (감정, 키워드 등) | **월 5,000건** |
| **OCI Speech** | 음성→텍스트 변환 | **월 5,000건** |
| **OCI Vision** | 이미지 분석, OCR | **월 1,000건** |
| **OCI Document Understanding** | 문서 파싱 | **월 1,000건** |
| **Generative AI (Playground)** | LLM 추론 | **무료** (제한된 토큰) |

---

## 💡 실전 구성 예시 (Always Free만으로)

### 웹 앱 호스팅 (Zero Cost)

```
VCN (무료)
├── Public Subnet
│   ├── Ampere A1 (2 OCPU, 12 GB) → 1대, 앱 서버 + Ollama
│   ├── Flexible LB (10 Mbps) → 트래픽 분산
│   └── Bastion → SSH 접근
├── Private Subnet
│   └── Autonomous DB (ATP) → 1대
└── Object Storage (20 GB) → 정적 파일
```

**월 비용: $0**

### 개인 개발 환경

```
VCN (무료)
├── AMD Micro (1 GB) → 개발/테스트 서버 2대
├── Autonomous DB (APEX) → Low-code 앱
└── NoSQL DB → 3테이블, 25GB/테이블
```

**월 비용: $0**

---

## ⚠️ 주의사항

1. **Always Free는 Home Region 전용** — 다른 리전에 리소스 만들면 과금됨
2. **Trial($300) 종료 후** Always Free 초과분은 자동 정지 → 30일 후 삭제
3. **Ampere A1**: 월 1,500 OCPU 시간 초과 시 과금 (2 OCPU × 744시간 = 1,488, 간당간당 → 1 OCPU 또는 burstable 구성 권장)
4. **Autonomous DB**: 7일간 미사용 시 자동 중지 (idle shutdown), 접속 시 자동 재시작
5. **신용카드 등록 필수** (본인 확인용, Always Free 내에선 과금 없음)

---

## 🔗 참고 링크

- [OCI Always Free 공식 문서](https://docs.oracle.com/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
- [OCI Free Tier FAQ](https://www.oracle.com/cloud/free/faq/)

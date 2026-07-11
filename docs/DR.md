# Disaster Recovery Plan — OC TechCloudUp

> Last updated: 2026-07-11
> Scope: Production (oc-a1) + Monitoring (oc-monitor) on OCI Always Free

---

## Current State Assessment

### What's Protected

| Asset | Location | Backup | Risk |
|-------|----------|--------|------|
| Site source code | GitHub (`oc-techcloudup`) | Git history ✅ | Low |
| Static data (oc-cities.json) | GitHub | Git ✅ | Low |
| Infrastructure as Code (Terraform) | Local + GitHub (pending commit) | ⚠️ Local only | **High** |
| Configuration (Ansible) | Local + GitHub (pending commit) | ⚠️ Local only | **High** |
| Terraform state | Local (`terraform/terraform.tfstate`) | ❌ None | **Critical** |
| SSL certificates | oc-a1 (Let's Encrypt auto-renew) | ❌ None | Low (auto-renew) |
| Uptime Kuma data | oc-monitor Docker volume | ❌ None | **High** |
| Nginx config | oc-a1 (`/etc/nginx/conf.d/`) | Terraform + Ansible ✅ | Low |

### Current Gaps

1. **Terraform state is local only** — laptop failure = lost state. Must re-import 12 resources.
2. **IaC not committed to git** — Terraform + Ansible + Docker files are untracked.
3. **Uptime Kuma has no backup** — Docker volume data (monitors, alerts, settings) will be lost if oc-monitor dies.
4. **No cross-region/cross-cloud fallback** — OCI Always Free is Phoenix-only.

---

## Risk Matrix

| Scenario | Likelihood | Impact | RTO (target) | RPO (target) |
|----------|-----------|--------|-------------|-------------|
| S1: Single instance failure | Medium | Medium | < 30 min | < 1 hour |
| S2: VCN/subnet misconfig | Low | High | < 1 hour | < 1 hour |
| S3: OCI Phoenix region outage | Very Low | Critical | < 4 hours | < 24 hours |
| S4: OCI account/tenancy loss | Very Low | Critical | < 8 hours | < 24 hours |
| S5: DNS/SSL expiry | Low | Medium | < 15 min | 0 |
| S6: Terraform state corruption | Low | Medium | < 1 hour | 0 (re-import) |
| S7: Laptop / local machine loss | Low | Medium | < 2 hours | < 24 hours |

---

## Recovery Scenarios

### S1: Single Instance Failure

**Symptoms**: SSH timeout, health check fails, instance status = STOPPED/TERMINATED in OCI console.

#### oc-a1 (Production Nginx) Down

| Step | Action | Time |
|------|--------|------|
| 1 | Verify in OCI console: instance state, boot volume status | 1 min |
| 2 | If STOPPED: `oci compute instance action --instance-id <id> --action START` | 2 min |
| 3 | If TERMINATED: recreate via Terraform | — |
| 3a | `cd terraform && terraform plan -target=oci_core_instance.oc_a1` | 1 min |
| 3b | `terraform apply -target=oci_core_instance.oc_a1 -auto-approve` | 3 min |
| 4 | Provision with Ansible: `cd ansible && ansible-playbook web.yml` | 5 min |
| 5 | Deploy site: push to GitHub `main` (CI/CD auto-deploys) | 1 min |
| 6 | Update Cloudflare DNS if IP changed (likely) → A record to new IP | 1 min |
| 7 | Verify: `curl -s -o /dev/null -w "%{http_code}" https://oc.techcloudup.com` | 1 min |
| 8 | Run SSL certbot: `ssh opc@<new-ip> "sudo certbot --nginx -d oc.techcloudup.com"` | 2 min |

**Total: ~16 min** (STOPPED), **~16 min** (TERMINATED)

#### oc-monitor (Uptime Kuma) Down

| Step | Action | Time |
|------|--------|------|
| 1 | Verify instance state in OCI console | 1 min |
| 2 | If TERMINATED: `terraform apply -target=oci_core_instance.oc_monitor` | 3 min |
| 3 | `ansible-playbook monitoring.yml` (installs Docker + Uptime Kuma) | 5 min |
| 4 | **Manual**: Reconfigure Uptime Kuma monitors via web UI | 10 min |
| 5 | Verify: `curl http://<new-ip>:3001` | 1 min |

**Total: ~20 min** (monitor reconfiguration is manual)

---

### S2: VCN/Subnet Misconfiguration

**Symptoms**: Instance unreachable even though RUNNING, security list accidentally locked down.

| Step | Action | Time |
|------|--------|------|
| 1 | Identify the bad change: `git log --oneline -5` | 1 min |
| 2 | If Terraform change: `terraform plan` → review diff | 1 min |
| 3 | Fix the Terraform config or revert commit | 5 min |
| 4 | `terraform apply` | 2 min |
| 5 | Verify connectivity | 1 min |

**Total: ~10 min** (if caused by recent Terraform change)

---

### S3: OCI Phoenix Region Outage

**Symptoms**: All OCI resources unreachable, OCI console inaccessible.

This is a full-region outage. OCI Always Free is Phoenix-only, so we need a cross-cloud fallback.

#### Option A: GitHub Pages (fastest, free)

| Step | Action | Time |
|------|--------|------|
| 1 | Add GitHub Actions workflow for Pages deploy | Pre-configured |
| 2 | Trigger manual deploy: `gh workflow run deploy-pages.yml` | 1 min |
| 3 | Update Cloudflare DNS: `oc.techcloudup.com` CNAME → `<user>.github.io` | 1 min |
| 4 | Verify | 1 min |

**Total: ~3 min** (if pre-configured)

#### Option B: Cloudflare Pages

| Step | Action | Time |
|------|--------|------|
| 1 | Connect GitHub repo to Cloudflare Pages | Pre-configured |
| 2 | Cloudflare auto-builds and deploys on push | Automatic |
| 3 | DNS already on Cloudflare — instant switch | 0 min |

**Total: ~2 min** (if pre-configured)

> **Recommendation**: Set up Cloudflare Pages as a warm standby. It's free, auto-deploys on git push, and DNS is already on Cloudflare. Perfect fit for a static Next.js export site.

---

### S4: Complete OCI Account/Tenancy Loss

**Symptoms**: Cannot log into OCI, all resources gone.

| Step | Action | Time |
|------|--------|------|
| 1 | Create new OCI Always Free account | 30 min |
| 2 | Re-run Terraform from scratch: `terraform init && terraform apply` | 10 min |
| 3 | Re-provision with Ansible: `ansible-playbook site.yml` | 10 min |
| 4 | Deploy site (GitHub Actions) | 1 min |
| 5 | Update DNS, SSL | 5 min |
| 6 | Reconfigure Uptime Kuma manually | 15 min |

**Total: ~70 min** (dominated by new OCI account creation)

> **Prerequisite**: Terraform state must be recoverable (remote backend or backup).

---

### S5: DNS / SSL Failure

**Symptoms**: SSL cert expired, DNS resolution fails, Cloudflare issues.

#### SSL Certificate Expiry

| Step | Action | Time |
|------|--------|------|
| 1 | SSH into oc-a1: `ssh opc@129.146.121.250` | 1 min |
| 2 | `sudo certbot renew --dry-run` (test) | 1 min |
| 3 | `sudo certbot renew` (force renew) | 2 min |
| 4 | `sudo systemctl reload nginx` | 1 min |

**Note**: certbot auto-renew timer should handle this. Check: `systemctl status certbot.timer`

#### DNS Failure

| Step | Action | Time |
|------|--------|------|
| 1 | Verify Cloudflare DNS: A record → `129.146.121.250` | 1 min |
| 2 | Check Cloudflare proxy status (orange cloud = on) | 1 min |
| 3 | If IP changed: update A record + wait for propagation (60s TTL) | 2 min |

---

### S6: Terraform State Corruption

**Symptoms**: `terraform plan` shows unexpected destroy/create, state file corrupted.

| Step | Action | Time |
|------|--------|------|
| 1 | Restore state from backup (remote backend or versioned file) | 1 min |
| 2 | `terraform plan` → verify no unexpected changes | 1 min |
| 3 | If no backup: re-import all 12 resources (see `terraform/IMPORT.md`) | 15 min |

**Prevention**: Use OCI Object Storage as remote backend (free tier: 10 GB).

---

### S7: Local Machine Loss

**Symptoms**: Laptop dead/stolen, no access to local files.

| Step | Action | Time |
|------|--------|------|
| 1 | Clone repo: `git clone git@github.com:richneo/oc-techcloudup.git` | 1 min |
| 2 | Install prerequisites: Terraform, Ansible, OCI CLI, Node.js | 15 min |
| 3 | Set up OCI credentials: `~/.oci/config` + API key | 5 min |
| 4 | Recover Terraform state from remote backend | 1 min |
| 5 | `terraform plan` → verify state matches | 1 min |
| 6 | Continue normal operations | — |

**Prerequisite**: Everything must be in git + remote state backend.

---

## Immediate Actions (Before Any Incident)

### 🔴 Critical — Do Now

1. **Commit all IaC to git**
   ```bash
   git add ansible/ terraform/ frontend/Dockerfile frontend/docker-compose.yml frontend/.dockerignore frontend/docker/
   git commit -m "feat: add Terraform, Ansible, and Docker configs"
   git push
   ```

2. **Set up Terraform remote state** (OCI Object Storage)
   ```hcl
   # Add to terraform/main.tf
   backend "s3" {
     bucket                      = "oc-techcloudup-tfstate"
     key                         = "terraform.tfstate"
     region                      = "us-phoenix-1"
     endpoint                    = "https://<namespace>.compat.objectstorage.us-phoenix-1.oraclecloud.com"
     skip_region_validation      = true
     skip_credentials_validation = true
     skip_metadata_api_check     = true
     force_path_style            = true
   }
   ```

### 🟡 Important — This Week

3. **Backup Uptime Kuma data** (cron on oc-monitor)
   ```bash
   # Add to crontab on oc-monitor (daily at 3am)
   0 3 * * * docker cp uptime-kuma:/app/data /var/backups/uptime-kuma-$(date +\%Y\%m\%d) && tar -czf /var/backups/uptime-kuma-$(date +\%Y\%m\%d).tar.gz -C /var/backups uptime-kuma-$(date +\%Y\%m\%d) && rm -rf /var/backups/uptime-kuma-$(date +\%Y\%m\%d)
   ```

4. **Set up Cloudflare Pages as warm standby**
   - Connect GitHub repo to Cloudflare Pages
   - Build command: `cd frontend && npm ci && npm run build`
   - Output directory: `frontend/out`
   - Custom domain: `oc.techcloudup.com` (ready to switch)

5. **Verify certbot auto-renew**
   ```bash
   ssh opc@129.146.121.250 "sudo systemctl status certbot.timer"
   ```

### 🟢 Nice to Have

6. **GitHub Actions: scheduled health check**
   ```yaml
   # .github/workflows/health-check.yml
   on:
     schedule:
       - cron: '*/15 * * * *'   # every 15 min
   ```

7. **Uptime Kuma: add monitors for all endpoints**
   - `https://oc.techcloudup.com` (HTTP 200)
   - `https://oc.techcloudup.com/health` (health check)
   - SSL certificate expiry (< 30 days warning)

8. **Document OCI credentials recovery path**
   - Where is the API key? `~/.oci/richneo.go@gmail.com-*.pem`
   - Where is the SSH key? `~/.ssh/id_rsa`
   - Recovery email for OCI account

---

## Recovery Checklist (Print / Save Offline)

### Quick Recovery — Instance Down

- [ ] OCI Console → check instance state
- [ ] Start if STOPPED, or `terraform apply` if TERMINATED
- [ ] `ansible-playbook web.yml` (or `monitoring.yml`)
- [ ] Push to GitHub `main` to trigger deploy
- [ ] Update Cloudflare DNS if IP changed
- [ ] `curl https://oc.techcloudup.com/health` → 200

### Full Rebuild — Everything Gone

- [ ] Create new OCI Always Free account
- [ ] Install: OCI CLI, Terraform, Ansible, Node.js
- [ ] Configure `~/.oci/config` + API key
- [ ] `git clone` + `cd terraform && terraform init && terraform apply`
- [ ] `cd ansible && ansible-playbook site.yml`
- [ ] `git push` → GitHub Actions deploys
- [ ] Update Cloudflare DNS A records
- [ ] SSH into oc-a1: `sudo certbot --nginx -d oc.techcloudup.com`
- [ ] Reconfigure Uptime Kuma via web UI

---

## RTO/RPO Summary

| Approach | RTO | RPO | Cost |
|----------|-----|-----|------|
| **Current (no DR)** | Hours–days | Days (manual rebuild) | $0 |
| **Terraform + Ansible rebuild** | ~30 min | ~1 hour (git is source of truth) | $0 |
| **+ Cloudflare Pages standby** | ~3 min | ~5 min (git push latency) | $0 |
| **+ Remote state + Kuma backup** | ~20 min | ~1 hour (state), ~24hr (Kuma) | $0 |
| **Multi-region (not possible)** | N/A | N/A | OCI Always Free is single-region |

> **Bottom line**: All recommended DR improvements are free. The biggest ROI items are (1) remote Terraform state, (2) Cloudflare Pages standby, and (3) committing IaC to git.

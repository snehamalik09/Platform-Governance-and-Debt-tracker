# Platform Governance & Health Copilot — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a ServiceNow scoped application that performs on-demand platform health scans across five domains, calculates weighted scores, generates AI recommendations via Claude API, and delivers results through a dashboard, post-scan email, and admin report.

**Architecture:** On-demand scan via Progress Worker (async, non-blocking); scoring and AI processing triggered on scan completion; dashboard renders from latest scan data; all config via System Properties.

**Tech Stack:** ServiceNow SDK (Fluent API), ServiceNow Script Includes, ServiceNow Progress Worker API, RESTMessageV2 (Claude API), Service Portal (AngularJS widget + Chart.js for dashboard), ServiceNow UI Page (Jelly for Admin Report), ServiceNow Notification framework, System Properties.

---

## Confirmed Decisions (2026-06-08)

| # | Question | Decision |
|---|----------|----------|
| Q1 | Scope prefix | `x_gov_copilot` per PRD. Desktop `CLAUDE.md` `x_ori` is for a different project (ORI) — irrelevant here. |
| Q2 | Dashboard UI technology | **Service Portal widget** (AngularJS + Chart.js) |
| Q3 | Progress Worker execution | **Sequential** — 5 modules in one Progress Worker; `modules_completed` increments after each |
| Q4 | Cost Optimisation Panel | **Dashboard load-time** real-time queries (not stored as scan findings) |
| Q5 | Run Scan Now button | **Both** — Service Portal dashboard widget AND UI Action on `x_gov_copilot_scan_run` table list |

---

## PRD Understanding Summary

| Area | Detail |
|------|--------|
| Application | Platform Governance & Health Copilot |
| Scope prefix | `x_gov_copilot` (PRD-defined) |
| Phase | Phase 1 (MVP) — manual on-demand scanning only |
| Scan domains | Performance, Security, Integration, Catalog, CMDB |
| Total finding types | 44 (10 Performance, 8 Security, 6 Integration, 7 Catalog, 7 CMDB, 6 Cost Opt) |
| Tables | 4 custom tables |
| System Properties | 17 properties |
| AI integration | Claude API (Haiku default); 10 findings/batch; fallback on failure |
| Notifications | 1 post-scan email to configurable recipients |
| Reports | 1 Admin Report (UI Page) |
| ACLs / Roles | None in Phase 1 (sysadmin access only) |
| Scheduled Jobs | None in Phase 1 (manual trigger only) |

---

## Architecture Review

### Strengths
1. Clean 4-layer separation: Scan → Score → AI → Present
2. Progress Worker for async non-blocking scans (satisfies AC-N08, AC-F01)
3. All config via System Properties (no custom config table, satisfies AC-F18)
4. RESTMessageV2 for Claude API (native ServiceNow, no MID Server needed)
5. password2-type System Property for API key (satisfies AC-N05, AC-N07)

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Script static analysis (BR findings) is regex-based and brittle | Document limitations; regex patterns must be conservative to avoid false positives |
| Claude API rate limits with many findings | Batch to 10/call; implement 3-retry with exponential backoff; fallback text on failure |
| Dashboard load time with 4-table joins | Use indexed fields (scan_run reference, domain choice); limit dashboard to latest scan data |
| Concurrent GlideRecord writes to finding table | Each domain module uses its own write loop; no shared state except scan_run counters updated sequentially |
| Progress Worker timeout on large instances | GlideRecord pagination enforced via `batch_size` system property (default 1000); modules must paginate |
| Cost Optimisation queries on platform tables at dashboard load | Queries scoped to last 90 days; setLimit applied; cache result in scan_run or accept slight load delay |

---

## Artifact Map (PRD → ServiceNow Artifacts)

### Tables

| Table | PRD Section | Purpose |
|-------|-------------|---------|
| `x_gov_copilot_scan_run` | §8.2 | One record per scan execution |
| `x_gov_copilot_finding` | §8.3 | One record per detected issue per scan |
| `x_gov_copilot_domain_score` | §8.4 | One row per domain per scan |
| `x_gov_copilot_recommendation` | §8.5 | One AI recommendation per finding |

### System Properties (17 total)

| Property | Default | PRD Section |
|----------|---------|-------------|
| `x_gov_copilot.scoring.weight.security` | 25 | §2.2, §4.3 |
| `x_gov_copilot.scoring.weight.performance` | 25 | §2.2, §4.3 |
| `x_gov_copilot.scoring.weight.cmdb` | 20 | §2.2, §4.3 |
| `x_gov_copilot.scoring.weight.integration` | 15 | §2.2, §4.3 |
| `x_gov_copilot.scoring.weight.catalog` | 15 | §2.2, §4.3 |
| `x_gov_copilot.scoring.deduction.critical` | 15 | §2.2, §4.1 |
| `x_gov_copilot.scoring.deduction.high` | 8 | §2.2, §4.1 |
| `x_gov_copilot.scoring.deduction.medium` | 4 | §2.2, §4.1 |
| `x_gov_copilot.scoring.deduction.low` | 1 | §2.2, §4.1 |
| `x_gov_copilot.scoring.threshold.healthy` | 80 | §2.2, §4.4 |
| `x_gov_copilot.scoring.threshold.attention` | 60 | §2.2, §4.4 |
| `x_gov_copilot.scoring.threshold.risk` | 40 | §2.2, §4.4 |
| `x_gov_copilot.ai.model` | claude-haiku-4-5 | §2.2, §5.1 |
| `x_gov_copilot.ai.api_key` | (encrypted) | §2.2, §5.1 |
| `x_gov_copilot.notification.recipients` | (empty) | §2.2, §7.1 |
| `x_gov_copilot.scan.batch_size` | 1000 | §2.2 |

### Script Includes (10)

| Script Include | PRD Section | Responsibility |
|----------------|-------------|----------------|
| `GovCopilotScanOrchestrator` | §2.3, §3.1 | Validate weights, create scan_run, launch Progress Worker, track completion |
| `GovCopilotProgressWorker` | §3.1 | Progress Worker body; runs 5 modules sequentially; triggers scoring+AI on completion |
| `GovCopilotPerformanceModule` | §3.2 | 10 finding types: BR and Scheduled Job analysis |
| `GovCopilotSecurityModule` | §3.3 | 8 finding types: ACL, user account, script, integration auth |
| `GovCopilotIntegrationModule` | §3.4 | 6 finding types: MID Server, REST Message, integration users |
| `GovCopilotCatalogModule` | §3.5 | 7 finding types: catalog items, variables |
| `GovCopilotCMDBModule` | §3.6 | 7 finding types: CI quality, ownership, relationships |
| `GovCopilotScoringEngine` | §4 | Domain score calculation; overall weighted score; score_delta |
| `GovCopilotAIEngine` | §5 | Batch findings; call Claude API; store recommendations; fallback |
| `GovCopilotNotificationService` | §7.1 | Post-scan email composition and dispatch |

### Outbound REST Message (1)

| Name | PRD Section | Endpoint |
|------|-------------|----------|
| `GovCopilotClaudeAPI` | §5.1 | `https://api.anthropic.com/v1/messages` |

### UI Components (2)

| Component | Type | PRD Section |
|-----------|------|-------------|
| Executive Dashboard | UI Page | §6 |
| Admin Report | UI Page (Jelly) | §7.2 |

### Notification Template (1)

| Name | PRD Section | Trigger |
|------|-------------|---------|
| Post-Scan Email | §7.1 | After scan completes or partially fails |

---

## Implementation Tasks

> ⚠️ Code generation blocked until clarification questions Q1–Q5 are answered and this plan is approved.

---

### Task 1: Application Scaffolding
**PRD Reference:** §2, §8

**Files:**
- Create: `src/x_gov_copilot/now.config.json`

- [ ] Initialize ServiceNow SDK project with scope `x_gov_copilot`
- [ ] Configure application metadata (name, scope, version)
- [ ] Commit: `chore: scaffold x_gov_copilot application`

---

### Task 2: Data Model — Tables and Fields
**PRD Reference:** §8.1–§8.5

**Files:**
- Create: `src/x_gov_copilot/src/tables/x_gov_copilot_scan_run.js`
- Create: `src/x_gov_copilot/src/tables/x_gov_copilot_finding.js`
- Create: `src/x_gov_copilot/src/tables/x_gov_copilot_domain_score.js`
- Create: `src/x_gov_copilot/src/tables/x_gov_copilot_recommendation.js`

**x_gov_copilot_scan_run fields (from §8.2):**
- `name` — String, auto-label `Scan-YYYY-MM-DD-NNN`
- `status` — Choice: `pending / running / completed / partial / failed`
- `triggered_by` — Choice: `manual`
- `scan_type` — Choice: `on_demand`
- `started_at` — DateTime
- `completed_at` — DateTime (nullable)
- `duration_seconds` — Integer
- `modules_completed` — Integer
- `modules_failed` — Integer
- `total_findings` — Integer
- `critical_count` — Integer
- `high_count` — Integer
- `medium_count` — Integer
- `low_count` — Integer
- `overall_health_score` — Integer (nullable; null when partial)

**x_gov_copilot_finding fields (from §8.3):**
- `scan_run` — Reference → `x_gov_copilot_scan_run`
- `domain` — Choice: `performance / security / integration / catalog / cmdb`
- `finding_type` — String (coded ID e.g. `br_always_run`)
- `title` — String
- `description` — String (long)
- `severity` — Choice: `critical / high / medium / low`
- `affected_table` — String
- `affected_record_sys_id` — String
- `affected_record_name` — String
- `remediation_status` — Choice: `open / in_progress / resolved / accepted_risk`
- `ai_recommendation` — Reference → `x_gov_copilot_recommendation` (nullable)

**x_gov_copilot_domain_score fields (from §8.4):**
- `scan_run` — Reference → `x_gov_copilot_scan_run`
- `domain` — Choice: `performance / security / integration / catalog / cmdb`
- `score` — Integer (0–100)
- `previous_score` — Integer
- `score_delta` — Integer
- `finding_count` — Integer

**x_gov_copilot_recommendation fields (from §8.5):**
- `finding` — Reference → `x_gov_copilot_finding`
- `severity_confirmed` — Choice: `critical / high / medium / low`
- `business_impact` — String (long)
- `technical_impact` — String (long)
- `remediation_steps` — String (long)
- `estimated_effort` — Choice: `hours / days / weeks`
- `expected_benefit` — String (long)
- `ai_model_used` — String
- `generated_at` — DateTime
- `ai_status` — Choice: `generated / pending / failed / unavailable`

- [ ] Create all 4 table definitions in SDK
- [ ] Verify field types match PRD exactly
- [ ] Commit: `feat: add data model tables x_gov_copilot`

---

### Task 3: System Properties
**PRD Reference:** §2.2, §4.1, §4.3, §4.4, §5.1, §7.1

**Files:**
- Create: `src/x_gov_copilot/src/sys_properties/` (16 property files)

- [ ] Create all 16 System Properties listed in §2.2
- [ ] Set `x_gov_copilot.ai.api_key` property type to `password2` (encrypted)
- [ ] Verify defaults match PRD table exactly
- [ ] Commit: `feat: add system properties x_gov_copilot`

---

### Task 4: Outbound REST Message — Claude API
**PRD Reference:** §5.1

**Files:**
- Create: `src/x_gov_copilot/src/sys_rest_messages/GovCopilotClaudeAPI.js`

Configuration:
- Endpoint: `https://api.anthropic.com/v1/messages`
- Method: POST
- Authentication: Header (`x-api-key`, value from `x_gov_copilot.ai.api_key`)
- Header: `anthropic-version: 2023-06-01`
- Header: `content-type: application/json`

- [ ] Create outbound REST message definition
- [ ] Add HTTP request method `sendFindings` with JSON body template
- [ ] Commit: `feat: add Claude API outbound REST message`

---

### Task 5: Script Include — GovCopilotScoringEngine
**PRD Reference:** §4.1, §4.2, §4.3, §4.4

**Files:**
- Create: `src/x_gov_copilot/src/script_includes/GovCopilotScoringEngine.js`

Methods:
- `calculateDomainScore(domain, scanRunSysId)` → reads findings by domain; deducts per severity; floor 0; writes `x_gov_copilot_domain_score`; returns score (Integer)
- `getPreviousScore(domain, currentScanRunSysId)` → queries last completed scan's domain score record; returns score or null
- `calculateOverallHealthScore(scanRunSysId)` → reads all 5 domain score records; applies weights from System Properties; writes `overall_health_score` to scan_run; returns score
- `getHealthStatus(score)` → maps score to status string (`Healthy/Needs Attention/At Risk/Critical`) using threshold System Properties
- `updateScanRunCounts(scanRunSysId)` → aggregates finding counts by severity across all findings for this scan; writes to scan_run counters

- [ ] Implement `GovCopilotScoringEngine` Script Include
- [ ] Unit test: domain score = 100 − (critical×15 + high×8 + medium×4 + low×1), floor 0
- [ ] Unit test: overall score = weighted average of 5 domain scores
- [ ] Unit test: partial scan → overall_health_score = null
- [ ] Commit: `feat: add GovCopilotScoringEngine`

---

### Task 6: Script Include — GovCopilotAIEngine
**PRD Reference:** §5.1, §5.2, AC-F09, AC-F10

**Files:**
- Create: `src/x_gov_copilot/src/script_includes/GovCopilotAIEngine.js`

Methods:
- `generateRecommendations(scanRunSysId)` → queries all findings for this scan; batches 10 at a time; calls `_callClaudeAPI(batch)`; stores results; applies fallback on failure
- `_buildRequestPayload(batch)` → constructs Claude API JSON per §5.2 contract; includes domain, finding_type, severity, affected_table, affected_record, affected_count, platform_version; instructs Claude to respond in JSON matching §8.5 output schema; sends ONLY metadata (no PII, no field values per AC-N06)
- `_callClaudeAPI(payload)` → uses `RESTMessageV2`; reads API key and model from System Properties; retries up to 3 times on failure (AC-F10); returns parsed JSON or throws
- `_storeRecommendation(findingSysId, apiResponse)` → creates `x_gov_copilot_recommendation` record; links to finding; sets `ai_status = generated`
- `_applyFallback(findingSysId, reason)` → creates `x_gov_copilot_recommendation` with fallback text; sets `ai_status = unavailable`

Fallback text template:
```
business_impact: "AI recommendation currently unavailable. Manual review required."
technical_impact: "Unable to assess technical impact automatically at this time."
remediation_steps: "1. Review this finding manually.\n2. Consult ServiceNow documentation.\n3. Engage platform team."
estimated_effort: "days"
expected_benefit: "Improved platform health upon remediation."
```

- [ ] Implement `GovCopilotAIEngine` Script Include
- [ ] Test batch splitting: 25 findings → 3 calls (10+10+5)
- [ ] Test fallback: API unavailable → all findings get `ai_status = unavailable`
- [ ] Commit: `feat: add GovCopilotAIEngine`

---

### Task 7: Script Include — GovCopilotPerformanceModule
**PRD Reference:** §3.2, AC-F04, AC-N01, AC-N04, AC-N09

**Files:**
- Create: `src/x_gov_copilot/src/script_includes/GovCopilotPerformanceModule.js`

**Finding type → coded ID mapping:**

| PRD Finding Type | Coded ID | Severity | Query Target | Detection Rule |
|------------------|----------|----------|--------------|----------------|
| BR: Always Run | `br_always_run` | High | `sys_script` | `when_to_run=always AND active=true` |
| BR: Should Be Async | `br_should_be_async` | Medium | `sys_script` | Synchronous BR, est. execution > 200ms (heuristic: script length > 500 chars as proxy) |
| BR: Recursive Pattern | `br_recursive_pattern` | High | `sys_script` | Script queries same table as BR's table (regex on script field) |
| BR: GlideRecord in Loop | `br_gliderecord_in_loop` | High | `sys_script` | `new GlideRecord` inside `while`/`for` loop (regex on script field) |
| BR: Excessive Dot-Walking | `br_excessive_dot_walking` | Medium | `sys_script` | Reference chain depth > 3 (regex: `\w+\.\w+\.\w+\.\w+` in script field) |
| Job: Long-Running | `job_long_running` | High | `sysauto_script` | Avg duration > 300,000 ms |
| Job: Frequently Failing | `job_frequently_failing` | High | `sysauto_script` | failure_count / run_count > 0.20 (last 30 days) |
| Job: Orphaned | `job_orphaned` | Medium | `sysauto_script` | `active=true AND last_run_time IS NULL` |
| Job: Duplicate | `job_duplicate` | Medium | `sysauto_script` | Multiple active records with identical name |
| Job: Not Run Recently | `job_not_run_recently` | Low | `sysauto_script` | `active=true AND last_run_time > 60 days ago` |

Methods:
- `execute(scanRunSysId)` → runs all 10 detectors; calls `_writeFinding()` for each; returns finding count
- `_writeFinding(scanRunSysId, type, severity, table, recordSysId, recordName, title, description)` → creates `x_gov_copilot_finding` record
- Individual detection methods: `_findBRAlwaysRun`, `_findBRShouldBeAsync`, `_findBRRecursivePattern`, `_findBRGlideRecordInLoop`, `_findBRExcessiveDotWalking`, `_findJobLongRunning`, `_findJobFrequentlyFailing`, `_findJobOrphaned`, `_findJobDuplicate`, `_findJobNotRunRecently`
- All GlideRecord queries MUST use `setLimit(batchSize)` and paginate (AC-N04, AC-N09)

- [ ] Implement `GovCopilotPerformanceModule` Script Include
- [ ] Verify all 10 finding types implemented with correct severities
- [ ] Verify pagination enforced on all queries
- [ ] Commit: `feat: add GovCopilotPerformanceModule`

---

### Task 8: Script Include — GovCopilotSecurityModule
**PRD Reference:** §3.3, AC-F04, AC-N06

**Files:**
- Create: `src/x_gov_copilot/src/script_includes/GovCopilotSecurityModule.js`

**Finding type → coded ID mapping:**

| PRD Finding Type | Coded ID | Severity | Query Target | Detection Rule |
|------------------|----------|----------|--------------|----------------|
| ACL: No Read Control | `acl_no_read_control` | Critical | `sys_security_acl` | Table has no ACL with `operation=read` |
| ACL: Overly Permissive | `acl_overly_permissive` | High | `sys_security_acl` | No roles AND no condition expression |
| Account: Dormant Admin | `account_dormant_admin` | Critical | `sys_user` | Has admin role, active, last_login > 60 days |
| Account: Inactive Service Acct | `account_inactive_service` | High | `sys_user` | Name contains "svc"/"service", last_login > 90 days |
| Account: Basic Auth | `account_basic_auth` | High | `sys_user` | `auth_method=basic AND active=true` |
| Script: Hardcoded Credential | `script_hardcoded_credential` | Critical | `sys_script, sys_script_include` | Regex: string literals matching credential patterns |
| Integration: Deprecated Auth | `integration_deprecated_auth` | Medium | `sys_rest_message` | Authentication type = `basic` on active message |
| Integration: Unencrypted | `integration_unencrypted` | High | `sys_rest_message` | Endpoint URL does not start with `https://` |

Hardcoded credential regex patterns (conservative, metadata-only — no PII transmitted to Claude, AC-N06):
- `password\s*=\s*['"][^'"]{4,}['"]`
- `api_key\s*=\s*['"][^'"]{8,}['"]`
- `secret\s*=\s*['"][^'"]{4,}['"]`
- `token\s*=\s*['"][^'"]{8,}['"]`

Methods:
- `execute(scanRunSysId)` → runs all 8 detectors
- `_writeFinding(...)` → shared with pattern from PerformanceModule
- Individual detection methods for each finding type

- [ ] Implement `GovCopilotSecurityModule` Script Include
- [ ] Verify hardcoded credential detection sends only record metadata to findings (not the credential value itself) (AC-N06)
- [ ] Commit: `feat: add GovCopilotSecurityModule`

---

### Task 9: Script Include — GovCopilotIntegrationModule
**PRD Reference:** §3.4, AC-F04

**Files:**
- Create: `src/x_gov_copilot/src/script_includes/GovCopilotIntegrationModule.js`

**Finding type → coded ID mapping:**

| PRD Finding Type | Coded ID | Severity | Query Target | Detection Rule |
|------------------|----------|----------|--------------|----------------|
| MID: Offline | `mid_offline` | Critical | `ecc_agent` | `status != Up` |
| MID: Stale | `mid_stale` | High | `ecc_agent` | `last_ping_time > 7 days ago` |
| MID: Version Mismatch | `mid_version_mismatch` | High | `ecc_agent` | MID version != instance version |
| REST: Unused | `rest_unused` | Medium | `sys_rest_message` | No outbound calls in last 90 days |
| REST: Deprecated Endpoint | `rest_deprecated_endpoint` | High | `sys_rest_message` | URL matches deprecated API patterns |
| User: Unused Integration User | `user_unused_integration` | Medium | `sys_user` | Integration role, last_login > 90 days, active |

Deprecated API URL patterns:
- URLs containing `/api/now/v1/` (v1 deprecated in favour of v2)
- URLs containing legacy SOAP endpoints (`/soap.do`, `_processor.do` on older APIs)

- [ ] Implement `GovCopilotIntegrationModule` Script Include
- [ ] Commit: `feat: add GovCopilotIntegrationModule`

---

### Task 10: Script Include — GovCopilotCatalogModule
**PRD Reference:** §3.5, AC-F04

**Files:**
- Create: `src/x_gov_copilot/src/script_includes/GovCopilotCatalogModule.js`

**Finding type → coded ID mapping:**

| PRD Finding Type | Coded ID | Severity | Query Target | Detection Rule |
|------------------|----------|----------|--------------|----------------|
| Item: Never Requested | `catalog_never_requested` | Medium | `sc_cat_item` | No linked `sc_request` records; active |
| Item: Missing Approval | `catalog_missing_approval` | High | `sc_cat_item` | No approval in linked workflow or flow |
| Item: Broken Workflow | `catalog_broken_workflow` | High | `sc_cat_item` | Linked workflow `active=false` |
| Item: Broken Flow | `catalog_broken_flow` | High | `sc_cat_item` | Linked Flow Designer flow `active=false` |
| Item: Duplicate | `catalog_duplicate_item` | Medium | `sc_cat_item` | Two+ active items with same name |
| Variable: Duplicate | `catalog_duplicate_variable` | Low | `item_option_new` | Same name on same item, multiple active records |
| Variable: Never Populated | `catalog_never_populated` | Low | `item_option_new` | Never populated in recent request data |

- [ ] Implement `GovCopilotCatalogModule` Script Include
- [ ] Commit: `feat: add GovCopilotCatalogModule`

---

### Task 11: Script Include — GovCopilotCMDBModule
**PRD Reference:** §3.6, AC-F04

**Files:**
- Create: `src/x_gov_copilot/src/script_includes/GovCopilotCMDBModule.js`

**Finding type → coded ID mapping:**

| PRD Finding Type | Coded ID | Severity | Query Target | Detection Rule |
|------------------|----------|----------|--------------|----------------|
| CI: Duplicate | `cmdb_duplicate_ci` | High | `cmdb_ci` | Same `serial_number` or MAC on multiple active CIs |
| CI: No Owner | `cmdb_no_owner` | High | `cmdb_ci` | `assigned_to` empty AND class = server or network device |
| CI: No Support Group | `cmdb_no_support_group` | High | `cmdb_ci` | `support_group` empty AND `operational_status=operational` |
| CI: No Relationships | `cmdb_no_relationships` | Medium | `cmdb_ci` | No records in `cmdb_rel_ci` reference this CI |
| CI: Stale | `cmdb_stale` | High | `cmdb_ci` | `last_discovered > 90 days AND discovery_source != manual` |
| CI: Critical No Owner | `cmdb_critical_no_owner` | Critical | `cmdb_ci` | `used_for=Production AND assigned_to` empty |
| CI: Critical No Support | `cmdb_critical_no_support` | Critical | `cmdb_ci` | Critical CI with no `support_group` and no `assigned_to` |

- [ ] Implement `GovCopilotCMDBModule` Script Include
- [ ] Commit: `feat: add GovCopilotCMDBModule`

---

### Task 12: Script Include — GovCopilotProgressWorker + GovCopilotScanOrchestrator
**PRD Reference:** §2.3, §3.1, AC-F01, AC-F02, AC-F03, AC-F05, AC-N08

**Files:**
- Create: `src/x_gov_copilot/src/script_includes/GovCopilotScanOrchestrator.js`
- Create: `src/x_gov_copilot/src/script_includes/GovCopilotProgressWorker.js`

**GovCopilotScanOrchestrator methods:**
- `runScan()` → entry point (called from UI button); validates weights; checks concurrency; creates scan_run; launches Progress Worker; returns scan_run sys_id
- `_validateWeights()` → reads all 5 weight properties; verifies sum = 100; throws with message if not (AC-F03)
- `_isAlreadyRunning()` → queries scan_run where `status=running`; returns boolean (AC-F02)
- `_createScanRun()` → inserts `x_gov_copilot_scan_run` with `status=running`, `triggered_by=manual`, `scan_type=on_demand`, `started_at=now()`; returns sys_id
- `_launchProgressWorker(scanRunSysId)` → instantiates `GlideScriptedProcessor` or `GlideProgressWorker`; passes scan_run sys_id; starts async execution (AC-N08)

**GovCopilotProgressWorker methods (runs async via Progress Worker):**
- `process(scanRunSysId)` → runs 5 modules sequentially; updates `modules_completed`/`modules_failed` after each; calls ScoringEngine, AIEngine, NotificationService on completion; handles partial scan (AC-F05)
- `_runModule(moduleClass, domain, scanRunSysId)` → try/catch wrapper; increments `modules_completed` on success; increments `modules_failed` on failure; logs error
- `_onAllComplete(scanRunSysId, anyFailed)` → if `anyFailed`: set `status=partial`, `overall_health_score=null`; else: call ScoringEngine.calculateOverallHealthScore; set `status=completed`; set `completed_at`, `duration_seconds`; trigger NotificationService

- [ ] Implement `GovCopilotScanOrchestrator` Script Include
- [ ] Implement `GovCopilotProgressWorker` Script Include
- [ ] Test: second scan request while running → rejected with message (AC-F02)
- [ ] Test: weights not summing to 100 → halted with error (AC-F03)
- [ ] Commit: `feat: add GovCopilotScanOrchestrator and GovCopilotProgressWorker`

---

### Task 13: Script Include — GovCopilotNotificationService
**PRD Reference:** §7.1, AC-F16

**Files:**
- Create: `src/x_gov_copilot/src/script_includes/GovCopilotNotificationService.js`

Email content per §7.1:
- **Subject:** `Platform Health Scan Complete — Score: [X] — [Status]`
- **Health Score:** overall score + status label + colour indicator (HTML badge)
- **Score Delta:** change from previous scan (↑ or ↓)
- **Severity Summary:** `Critical: N | High: N | Medium: N | Low: N`
- **Top 5 Risks:** table with finding title, severity, domain
- **Top 3 Actions:** top AI-recommended `remediation_steps` from highest-severity findings
- **Links:** dashboard URL + admin report URL
- **Partial Scan Notice:** warning banner if `status=partial` with list of failed modules

Methods:
- `sendPostScanEmail(scanRunSysId)` → assembles all data; builds HTML; reads recipients from System Property; sends via `GlideEmailOutbound`
- `_getTop5Risks(scanRunSysId)` → queries findings ordered by severity (critical first), limited to 5
- `_getTop3Actions(scanRunSysId)` → queries recommendations linked to highest-severity findings; returns first remediation step from each
- `_buildHtmlBody(data)` → constructs full HTML email body (table-based for email client compatibility)

- [ ] Implement `GovCopilotNotificationService` Script Include
- [ ] Test partial scan: email includes warning banner and failed module list
- [ ] Commit: `feat: add GovCopilotNotificationService`

---

### Task 14: UI Action — Run Scan Now
**PRD Reference:** §6 (Run Scan Now button, sysadmin), AC-F01, AC-F19

**Files:**
- Create: `src/x_gov_copilot/src/ui_actions/RunScanNow.js`

- [ ] Create UI Action on the Executive Dashboard (or on `x_gov_copilot_scan_run` list)
- [ ] Restrict to `sysadmin` role (AC-F19)
- [ ] Call `GovCopilotScanOrchestrator.runScan()`
- [ ] Display success message with scan run number or error message
- [ ] Commit: `feat: add Run Scan Now UI action`

---

### Task 15: Executive Dashboard — Service Portal Widget
**PRD Reference:** §6, AC-F11–AC-F15, AC-N03

**Files:**
- Create: `src/x_gov_copilot/src/sp_widgets/GovCopilotDashboard/widget.js` (AngularJS controller)
- Create: `src/x_gov_copilot/src/sp_widgets/GovCopilotDashboard/template.html` (HTML template)
- Create: `src/x_gov_copilot/src/sp_widgets/GovCopilotDashboard/server_script.js` (server-side data)
- Create: `src/x_gov_copilot/src/sp_widgets/GovCopilotDashboard/css.scss` (styles)
- Create: `src/x_gov_copilot/src/sp_pages/GovCopilotDashboardPage.json` (Service Portal page)

Dashboard components (all rendered from latest completed scan_run):

**Health Score Gauge (AC-F11):**
- Chart.js Doughnut chart showing `overall_health_score` (0–100)
- Colour by threshold: ≥80 green (#28a745), ≥60 amber (#ffc107), ≥40 orange (#fd7e14), <40 red (#dc3545)
- Trend arrow: ↑/↓ comparing to previous scan's `overall_health_score`; score delta (e.g. "+5")
- Last scan timestamp + duration displayed below gauge
- "Run Scan Now" button — calls `GovCopilotScanOrchestrator.runScan()` via server script; sysadmin only (role check in server script)

**Domain Scorecards (AC-F12):**
- 5 Bootstrap cards: Security, Performance, CMDB, Integration, Catalog
- Each card: domain name, score (colour-coded badge), Critical/High/Medium/Low severity counts, trend arrow vs prior scan
- Click-through: `ng-click` opens findings table filtered to that domain via `$location` or modal

**Findings Panel (AC-F13):**
- Severity count tiles (4 total tiles: Critical/High/Medium/Low) at top of panel
- AI Recommendations badge showing count of `ai_status=generated` records
- AngularJS-filtered findings table: `ng-repeat` with filter inputs for domain, severity, remediation_status
- Inline status update: `<select>` bound to `remediation_status`; saves via `spUtil.update()`
- Click row → modal showing finding detail + full AI recommendation text

**Trend Chart (AC-F14):**
- Chart.js Line chart: `overall_health_score` across last 10 scans (x-axis: scan date, y-axis: 0–100)
- Chart.js Stacked Bar: Critical/High/Medium/Low counts per scan (last 10)

**Cost Optimisation Panel (AC-F15):**
- Server script queries at widget load (real-time, not scan-stored)
- Unused integrations: `sys_rest_message` — no ECC queue entries in last 90 days
- Zero-request catalog items: `sc_cat_item` active, no `sc_request` in 90 days
- Flows never triggered: `sys_hub_flow` with no `sys_flow_context` records
- Jobs never run: `sysauto_script` active AND `last_run_time IS NULL`
- All queries use `setLimit(100)` to cap cost

**Partial scan warning:** Angular `ng-if` banner at top if latest scan `status=partial`

- [ ] Implement Service Portal widget (server script + AngularJS controller + HTML template + CSS)
- [ ] Create Service Portal page to host the widget
- [ ] Test: dashboard loads in ≤ 3 seconds on PDI (AC-N03)
- [ ] Test: all 5 components render correctly from scan data
- [ ] Test: partial scan shows warning banner (AC-F05)
- [ ] Commit: `feat: add Executive Dashboard Service Portal widget`

---

### Task 16: Admin Report UI Page
**PRD Reference:** §7.2, AC-F17

**Files:**
- Create: `src/x_gov_copilot/src/ui_pages/GovCopilotAdminReport.xml`
- Create: `src/x_gov_copilot/src/ui_pages/GovCopilotAdminReportProcessor.js`

Report content (from §7.2):
1. **Scan summary:** date, duration, status, overall score, domain score breakdown (table)
2. **Findings list:** all fields + AI recommendation text + remediation_status; grouped by domain; sorted by severity (Critical first); printable HTML (print button)
3. "View Admin Report" button linked from dashboard

Format: HTML (Jelly template); printable from browser; no PDF/Excel (Phase 2)

- [ ] Implement Admin Report UI Page
- [ ] Verify correct JOIN across all 4 tables
- [ ] Test: report renders all sections; print view works
- [ ] Commit: `feat: add Admin Report UI Page`

---

### Task 17: Integration Test & Gap Analysis
**PRD Reference:** §9 (all acceptance criteria)

- [ ] Run end-to-end scan on a PDI
- [ ] Verify all 44 finding types execute without error
- [ ] Verify AC-F01–AC-F19 (functional) criteria
- [ ] Verify AC-N01–AC-N10 (non-functional) criteria
- [ ] Perform gap analysis: list any PRD requirement without a corresponding artifact
- [ ] Document any deviations
- [ ] Commit: `chore: integration test results and gap analysis`

---

## Gap Analysis Checklist (to run after implementation)

Reference each PRD section and verify coverage:

| PRD Section | Artifact | Status |
|-------------|---------|--------|
| §3.1 Scan Orchestrator | `GovCopilotScanOrchestrator` | Planned |
| §3.2 Performance Module (10 types) | `GovCopilotPerformanceModule` | Planned |
| §3.3 Security Module (8 types) | `GovCopilotSecurityModule` | Planned |
| §3.4 Integration Module (6 types) | `GovCopilotIntegrationModule` | Planned |
| §3.5 Catalog Module (7 types) | `GovCopilotCatalogModule` | Planned |
| §3.6 CMDB Module (7 types) | `GovCopilotCMDBModule` | Planned |
| §4 Scoring Engine | `GovCopilotScoringEngine` | Planned |
| §5 AI Engine | `GovCopilotAIEngine` | Planned |
| §6 Executive Dashboard | UI Page | Planned |
| §7.1 Post-Scan Email | `GovCopilotNotificationService` | Planned |
| §7.2 Admin Report | UI Page (Jelly) | Planned |
| §8 Data Model (4 tables) | Table definitions | Planned |
| §2.2 System Properties (17) | sys_properties | Planned |
| AC-F01–AC-F19 | Distributed across artifacts | Pending verification |
| AC-N01–AC-N10 | Enforced by implementation patterns | Pending verification |

---

## Known Assumptions (to confirm)

1. **Sequential domain module execution** within one Progress Worker (Q3 above)
2. **Cost Optimisation Panel** queries run at dashboard load time, not during scan (Q4 above)
3. **Scope prefix** is `x_gov_copilot` per PRD, overriding `x_ori` in CLAUDE.md (Q1 above)
4. **Dashboard technology** is UI Page with embedded Chart.js for charting (Q2 above)
5. **`x_gov_copilot` scope** is the ServiceNow application scope; the `now.config.json` will use this as the application identifier
6. **ServiceNow version** is Yokohama (AC-N10)
7. **No ACLs or custom roles** in Phase 1 — sysadmin access implied (AC-F19)

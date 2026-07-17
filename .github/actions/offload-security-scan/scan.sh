#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# Offload Security Scan — GitHub Action entry-point
#
# Triggers an App Scan via the Offload Security platform API, polls
# until completion, extracts results, optionally posts a PR comment,
# and fails the workflow when the severity threshold is breached.
# ──────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Helpers ───────────────────────────────────────────────────────────

log()  { echo "::group::$1"; }
elog() { echo "::endgroup::"; }
info() { echo "  ℹ️  $*"; }
warn() { echo "::warning::$*"; }
fail() { echo "::error::$*"; exit 1; }

api() {
    # $1 = method, $2 = path, $3 = body (optional)
    local method="$1" path="$2" body="${3:-}"
    local url="${INPUT_API_URL%/}/api${path}"
    local args=(-s -S -w "\n%{http_code}" -X "$method"
                -H "X-API-Key: ${INPUT_API_KEY}"
                -H "Content-Type: application/json"
                -H "Accept: application/json")
    [[ -n "$body" ]] && args+=(-d "$body")
    curl "${args[@]}" "$url"
}

parse_response() {
    # Splits the curl output (body + HTTP status on last line)
    local raw="$1"
    HTTP_STATUS="${raw##*$'\n'}"
    HTTP_BODY="${raw%$'\n'*}"
}

jq_safe() {
    # Extract a JSON field; returns empty string on failure
    echo "$1" | jq -r "$2" 2>/dev/null || echo ""
}

# ── Validate inputs ──────────────────────────────────────────────────

[[ -z "${INPUT_API_URL:-}" ]] && fail "api_url is required"
[[ -z "${INPUT_API_KEY:-}" ]] && fail "api_key is required"

# Determine scan mode: ``code_repo`` => SBOM + license release-gate path;
# ``container_image`` => container scan path; otherwise the original
# web-scan flow.  One of the three inputs must be supplied.
SCAN_MODE="web"
if [[ -n "${INPUT_CODE_REPO:-}" ]]; then
    SCAN_MODE="code"
    info "Mode: code (repository ${INPUT_CODE_REPO})"
elif [[ -n "${INPUT_CONTAINER_IMAGE:-}" ]]; then
    SCAN_MODE="container"
    info "Mode: container (target ${INPUT_CONTAINER_IMAGE})"
fi
if [[ "$SCAN_MODE" == "web" && -z "${INPUT_TARGET_URL:-}" ]]; then
    fail "code_repo, container_image or target_url is required"
fi

SEVERITY_LEVELS=("critical" "high" "medium" "low" "info" "none")
FAIL_ON="${INPUT_FAIL_ON:-critical}"
TIMEOUT="${INPUT_TIMEOUT:-1800}"
POLL_INTERVAL="${INPUT_POLL_INTERVAL:-15}"

# Outside GitHub Actions (standalone smoke tests, other CI) these files
# don't exist; default them so `set -u` doesn't kill the run mid-scan.
: "${GITHUB_OUTPUT:=/dev/null}"
: "${GITHUB_STEP_SUMMARY:=/dev/null}"

# Map severity to numeric rank for threshold comparison
sev_rank() {
    case "$1" in
        critical) echo 5 ;; high) echo 4 ;; medium) echo 3 ;;
        low)      echo 2 ;; info) echo 1 ;; none)   echo 0 ;;
        *)        echo 0 ;;
    esac
}

# ── Step 1: Validate auth (optional, web mode only) ──────────────────
# The probe targets INPUT_TARGET_URL; in code/container mode it is
# meaningless and must not run (a leftover auth_config from a migrated
# web-scan workflow would otherwise abort the run before it starts).

if [[ "$SCAN_MODE" == "web" && -n "${INPUT_AUTH_CONFIG:-}" && "${INPUT_AUTH_CONFIG}" != "{}" ]]; then
    log "Validating authentication configuration"
    PROBE_BODY=$(jq -n \
        --arg url "$INPUT_TARGET_URL" \
        --argjson auth "$INPUT_AUTH_CONFIG" \
        '{target_url: $url, auth_config: $auth}')

    PROBE_RAW=$(api POST "/app-scan/validate-auth" "$PROBE_BODY") || {
        warn "Auth validation request failed (network error) — proceeding with scan anyway"
        elog
        PROBE_RAW=""
    }
    if [[ -n "$PROBE_RAW" ]]; then
        parse_response "$PROBE_RAW"

        if [[ "$HTTP_STATUS" != "200" ]]; then
            warn "Auth validation request failed (HTTP $HTTP_STATUS) — proceeding with scan anyway"
        else
            PROBE_OK=$(jq_safe "$HTTP_BODY" '.data.ok')
            if [[ "$PROBE_OK" == "false" ]]; then
                PROBE_REASON=$(jq_safe "$HTTP_BODY" '.data.reason')
                fail "Authentication probe failed: ${PROBE_REASON}. Fix credentials before scanning."
            fi
            info "Authentication validated successfully"
        fi
        elog
    fi
fi

# ── Step 2: Trigger the scan ─────────────────────────────────────────

# ── Code scan branch (SBOM + license release gate) ───────────────────
# When ``code_repo`` is set the platform generates an SBOM (Syft),
# evaluates dependency CVEs + license policy, and computes the versioned
# release gate. The verdict is posted as an "offload/release-gate"
# commit status so branch protection can require it.
if [[ "$SCAN_MODE" == "code" ]]; then
    # Commit-status helper. Uses the PR *head* SHA when available —
    # GITHUB_SHA is the synthetic merge commit on pull_request events and
    # a status there never shows on the PR.
    STATUS_TARGET_URL="${INPUT_API_URL%/}/dashboard?section=code-command-center"
    post_commit_status() {
        local state="$1" description="$2"
        [[ "${INPUT_SET_COMMIT_STATUS:-true}" != "true" ]] && return 0
        if [[ -z "${GITHUB_TOKEN:-}" || -z "${GITHUB_REPOSITORY:-}" ]]; then
            info "No GITHUB_TOKEN / repository context — skipping commit status"
            return 0
        fi
        local sha=""
        if [[ -n "${GITHUB_EVENT_PATH:-}" && -f "${GITHUB_EVENT_PATH}" ]]; then
            sha=$(jq -r '.pull_request.head.sha // ""' "$GITHUB_EVENT_PATH" 2>/dev/null || echo "")
        fi
        sha="${sha:-${GITHUB_SHA:-}}"
        if [[ -z "$sha" ]]; then
            warn "No commit SHA available — skipping commit status"
            return 0
        fi
        local payload
        payload=$(jq -n --arg state "$state" --arg desc "$description" --arg url "$STATUS_TARGET_URL" \
            '{state: $state, description: ($desc | .[0:140]), context: "offload/release-gate", target_url: $url}')
        # --fail: without it a 403 (missing `statuses: write`) exits 0 and
        # the one diagnostic written for that case would never fire.
        curl -s -S --fail -o /dev/null -X POST \
            -H "Authorization: Bearer ${GITHUB_TOKEN}" \
            -H "Accept: application/vnd.github+json" \
            "${GITHUB_API_URL:-https://api.github.com}/repos/${GITHUB_REPOSITORY}/statuses/${sha}" \
            -d "$payload" \
            && info "Commit status posted: offload/release-gate=${state} (${sha:0:12})" \
            || warn "Failed to post commit status — check the workflow has 'permissions: statuses: write'"
    }

    # Reject bad fail_on_gate values up front — falling through to the
    # weakest mode on a typo ("reviews") would silently un-enforce the gate.
    FAIL_ON_GATE="${INPUT_FAIL_ON_GATE:-fail}"
    case "$FAIL_ON_GATE" in
        none|review|fail) ;;
        *) fail "Invalid fail_on_gate '${FAIL_ON_GATE}' — use fail, review or none" ;;
    esac

    log "Starting SBOM + license release-gate scan"

    # Fork PRs: the platform clones ``code_repo`` with its own connection;
    # a branch that only exists on the contributor's fork can't be scanned.
    # Fail loudly (with an error status) instead of scanning the wrong tree.
    if [[ -n "${GITHUB_EVENT_PATH:-}" && -f "${GITHUB_EVENT_PATH}" ]]; then
        PR_HEAD_REPO=$(jq -r '.pull_request.head.repo.full_name // ""' "$GITHUB_EVENT_PATH" 2>/dev/null || echo "")
        if [[ -n "$PR_HEAD_REPO" && "$PR_HEAD_REPO" != "$INPUT_CODE_REPO" ]]; then
            post_commit_status "error" "Fork PRs are not supported: the platform scans ${INPUT_CODE_REPO}, not ${PR_HEAD_REPO}"
            fail "Release-gate scans of fork PRs are not supported (head repo ${PR_HEAD_REPO} != code_repo ${INPUT_CODE_REPO})"
        fi
    fi

    # Branch: explicit input → PR head branch → pushed branch.
    # ``code_branch: default`` forces the repo's default branch (inside
    # Actions GITHUB_REF_NAME is always set, so empty alone can't).
    # Tag pushes have no branch — fall back to the default branch.
    CODE_BRANCH="${INPUT_CODE_BRANCH:-${GITHUB_HEAD_REF:-${GITHUB_REF_NAME:-}}}"
    if [[ "$CODE_BRANCH" == "default" ]]; then
        CODE_BRANCH=""
    elif [[ "${GITHUB_REF_TYPE:-branch}" == "tag" && -z "${INPUT_CODE_BRANCH:-}" && -z "${GITHUB_HEAD_REF:-}" ]]; then
        warn "Tag ref '${GITHUB_REF_NAME:-}' is not a branch — scanning the default branch"
        CODE_BRANCH=""
    fi
    GIT_PROVIDER="${INPUT_GIT_PROVIDER:-github}"
    info "Repository: ${INPUT_CODE_REPO} (branch: ${CODE_BRANCH:-<default>}) via ${GIT_PROVIDER}"

    SBOM_BODY=$(jq -n --arg repo "$INPUT_CODE_REPO" --arg branch "$CODE_BRANCH" --arg provider "$GIT_PROVIDER" \
        '{repo: $repo, branch: $branch, provider: $provider}')
    RAW=$(api POST "/code/sbom" "$SBOM_BODY") || {
        post_commit_status "error" "Could not start the SBOM scan (network error)"
        fail "Failed to reach the platform API"
    }
    parse_response "$RAW"
    if [[ "$HTTP_STATUS" != "200" ]]; then
        post_commit_status "error" "Could not start the SBOM scan (HTTP ${HTTP_STATUS})"
        fail "Failed to start SBOM scan (HTTP ${HTTP_STATUS}): ${HTTP_BODY}"
    fi
    SBOM_SCAN_ID=$(jq_safe "$HTTP_BODY" '.data.scan_id // empty')
    if [[ -z "$SBOM_SCAN_ID" ]]; then
        # Backend refusals can arrive as resolved bodies without a scan_id
        # (e.g. "No github connection") — surface the real message.
        API_MSG=$(jq_safe "$HTTP_BODY" '.data.error // .detail.error.message // .message // empty')
        post_commit_status "error" "SBOM scan refused: ${API_MSG:-no scan_id returned}"
        fail "SBOM scan was not started: ${API_MSG:-${HTTP_BODY}}"
    fi
    info "Scan started: ${SBOM_SCAN_ID}"
    echo "sbom_scan_id=${SBOM_SCAN_ID}" >> "$GITHUB_OUTPUT"
    elog

    log "Waiting for scan completion (timeout ${TIMEOUT}s)"
    ELAPSED=0
    SBOM_STATUS="running"
    REPORT=""
    while (( ELAPSED < TIMEOUT )); do
        sleep "$POLL_INTERVAL"
        ELAPSED=$((ELAPSED + POLL_INTERVAL))
        RAW=$(api GET "/code/sbom/${SBOM_SCAN_ID}") || {
            warn "Poll failed (network error) — retrying..."
            continue
        }
        parse_response "$RAW"
        if [[ "$HTTP_STATUS" != "200" ]]; then
            warn "Poll failed (HTTP ${HTTP_STATUS}) — retrying..."
            continue
        fi
        # API refusals arrive as resolved bodies with a status_code and no
        # data (returned-HTTPException envelope) — fail fast, don't spin.
        API_ERR_CODE=$(jq_safe "$HTTP_BODY" 'if .data == null then (.status_code // .detail.status_code // empty) else empty end')
        if [[ -n "$API_ERR_CODE" ]]; then
            API_MSG=$(jq_safe "$HTTP_BODY" '.detail.error.message // .detail // "unknown API error"')
            post_commit_status "error" "Scan lookup refused (HTTP-level ${API_ERR_CODE}): ${API_MSG}"
            fail "Scan lookup refused (${API_ERR_CODE}): ${API_MSG}"
        fi
        SBOM_STATUS=$(jq_safe "$HTTP_BODY" '.data.status // "running"')
        info "status=${SBOM_STATUS} (${ELAPSED}s elapsed)"
        # completed_with_errors = partial tool failure with a report (and
        # gate) still produced — terminal, not a reason to spin to timeout.
        case "$SBOM_STATUS" in
            completed|completed_with_errors|failed)
                REPORT="$HTTP_BODY"
                break
                ;;
        esac
    done
    echo "status=${SBOM_STATUS}" >> "$GITHUB_OUTPUT"

    if [[ "$SBOM_STATUS" != "completed" && "$SBOM_STATUS" != "completed_with_errors" ]]; then
        if [[ "$SBOM_STATUS" == "failed" ]]; then
            ERR=$(jq_safe "$REPORT" '.data.error // "unknown error"')
            post_commit_status "error" "SBOM scan failed: ${ERR}"
            fail "SBOM scan failed: ${ERR}"
        fi
        post_commit_status "error" "SBOM scan timed out after ${TIMEOUT}s"
        fail "SBOM scan did not complete within ${TIMEOUT}s"
    fi
    [[ "$SBOM_STATUS" == "completed_with_errors" ]] \
        && warn "Scan completed with partial tool failures — the gate verdict below may be based on incomplete data"
    elog

    log "Evaluating release gate"
    # Effective gate = rulebook verdict with governed exceptions
    # (risk-accepted / false-positive findings) already applied. Resolved
    # ONCE so the verdict, policy version and blocking rules can never come
    # from different gate objects.
    GATE_OBJ=$(jq_safe "$REPORT" '.data.release_gate_effective // .data.release_gate // {}')
    GATE=$(jq_safe "$GATE_OBJ" '.gate // empty')
    POLICY_VERSION=$(jq_safe "$GATE_OBJ" '.policy_version // "unknown"')
    BLOCKING_RULES=$(jq_safe "$GATE_OBJ" '.blocking_rule_ids // [] | join(", ")')
    COMPONENTS=$(jq_safe "$REPORT" '.data.sbom_summary.total_components // "?"')
    LICENSE_VERDICT=$(jq_safe "$REPORT" '.data.compliance.verdict // "?"')

    # Scan-integrity gates — a verdict computed over nothing must never turn
    # a required check green:
    # * The backend marks a scan "completed" even when the clone yielded no
    #   files (e.g. private repo without a platform Git connection silently
    #   degrades to an unauthenticated clone) — the diagnostic lands in
    #   .data.error and the gate happily passes over an empty SBOM.
    # * A platform-side Grype/Trivy failure is non-blocking there too: the
    #   gate is computed over zero vulnerabilities with the failure recorded
    #   only in security.scan_status.
    SCAN_DIAG=$(jq_safe "$REPORT" '.data.error // empty')
    if [[ -n "$SCAN_DIAG" ]]; then
        post_commit_status "error" "Scan unusable: ${SCAN_DIAG}"
        fail "Scan produced no usable results: ${SCAN_DIAG}"
    fi
    if [[ "$COMPONENTS" == "0" ]]; then
        post_commit_status "error" "SBOM contains 0 components — nothing was evaluated"
        fail "SBOM contains 0 components — check the platform's Git connection (owned by the API key's team) and the branch name"
    fi
    CVE_SCAN_STATUS=$(jq_safe "$REPORT" '.data.security.scan_status // "completed"')
    if [[ "$CVE_SCAN_STATUS" == "failed" ]]; then
        CVE_ERR=$(jq_safe "$REPORT" '.data.security.scan_error // "unknown"')
        post_commit_status "error" "Dependency CVE scan failed platform-side: ${CVE_ERR}"
        fail "Dependency CVE scan failed platform-side (${CVE_ERR}) — the gate verdict would be unreliable"
    fi

    if [[ -z "$GATE" ]]; then
        # A completed report without a gate is a platform contract break —
        # treat as error rather than silently passing.
        post_commit_status "error" "Completed scan carried no release-gate verdict"
        fail "No release-gate verdict in the completed report (scan ${SBOM_SCAN_ID})"
    fi

    {
        echo "release_gate=${GATE}"
        echo "release_gate_policy_version=${POLICY_VERSION}"
        # Dashboard deep link — the API report endpoint requires an
        # X-API-Key header, so a raw API URL is not clickable from a browser.
        echo "report_url=${STATUS_TARGET_URL}"
    } >> "$GITHUB_OUTPUT"

    SUMMARY_MD=$(cat <<EOF
### Release Gate — \`${INPUT_CODE_REPO}\`

| | |
|---|---|
| **Gate verdict** | ${GATE} |
| Policy version | ${POLICY_VERSION} |
| Blocking rules | ${BLOCKING_RULES:-none} |
| SBOM components | ${COMPONENTS} |
| License verdict | ${LICENSE_VERDICT} |
| Scan | ${SBOM_SCAN_ID} |
EOF
)
    echo "$SUMMARY_MD" >> "$GITHUB_STEP_SUMMARY" 2>/dev/null || true
    info "Gate: ${GATE} (policy ${POLICY_VERSION})${BLOCKING_RULES:+ — blocking: ${BLOCKING_RULES}}"

    case "$GATE" in
        pass)
            post_commit_status "success" "Release gate passed (policy ${POLICY_VERSION})"
            ;;
        review)
            # "failure" (not "pending") so a required check is actionable:
            # triage the findings on the platform, then re-run the workflow.
            post_commit_status "failure" "Manual review required${BLOCKING_RULES:+ — ${BLOCKING_RULES}} (triage on the platform, then re-run)"
            ;;
        fail)
            post_commit_status "failure" "Release gate failed${BLOCKING_RULES:+ — ${BLOCKING_RULES}}"
            ;;
        *)
            post_commit_status "error" "Unknown release-gate verdict: ${GATE}"
            fail "Unknown release-gate verdict: ${GATE}"
            ;;
    esac
    elog

    case "$FAIL_ON_GATE" in
        none) ;;
        review)
            [[ "$GATE" == "review" || "$GATE" == "fail" ]] \
                && fail "Release gate verdict '${GATE}' (fail_on_gate=review). Scan: ${SBOM_SCAN_ID}"
            ;;
        *)
            [[ "$GATE" == "fail" ]] \
                && fail "Release gate failed${BLOCKING_RULES:+ — blocking rules: ${BLOCKING_RULES}}. Scan: ${SBOM_SCAN_ID}"
            ;;
    esac

    echo ""
    echo "========================================="
    echo "  Release gate: ${GATE}"
    echo "  Policy: ${POLICY_VERSION}"
    echo "  Scan ID: ${SBOM_SCAN_ID}"
    echo "========================================="
    exit 0
fi

# ── Container scan branch ────────────────────────────────────────────
# When ``container_image`` is set we use the synchronous /api/scans
# endpoint (one call per scan_type), aggregate the results, and skip
# the App-Scan poll loop entirely. This is the Phase 1.5 path.
if [[ "$SCAN_MODE" == "container" ]]; then
    log "Running container scans"
    info "Image: ${INPUT_CONTAINER_IMAGE}"

    # Default container scan types if user didn't pick a subset
    CONTAINER_TYPES="${INPUT_SCAN_TYPES:-vulnerability,sbom,secrets,signature}"
    info "Scan types: ${CONTAINER_TYPES}"

    AGG_CRITICAL=0; AGG_HIGH=0; AGG_MEDIUM=0; AGG_LOW=0
    AGG_KEV=0; AGG_SECRETS=0; AGG_VERIFIED_SECRETS=0
    SIGNATURE_VERIFIED="unknown"; SIGNATURE_DETAIL=""
    SBOM_COMPONENTS=0
    FAILED_TYPES=()

    IFS=',' read -ra TYPES_ARR <<< "$CONTAINER_TYPES"
    for stype in "${TYPES_ARR[@]}"; do
        stype="${stype// /}"
        [[ -z "$stype" ]] && continue
        info "  → scan_type=${stype}"

        # Build per-type request body. options.cloud_account_id /
        # only_verified / identity / oidc_issuer are forwarded so the
        # backend dispatcher in server.py picks up the right config.
        BODY=$(jq -n \
            --arg img "$INPUT_CONTAINER_IMAGE" \
            --arg stype "$stype" \
            --arg cloud_acct "${INPUT_CLOUD_ACCOUNT_ID:-}" \
            --arg identity "${INPUT_SIGNATURE_IDENTITY:-}" \
            --arg issuer "${INPUT_SIGNATURE_OIDC_ISSUER:-}" \
            --argjson only_verified "$([ "${INPUT_SECRETS_ONLY_VERIFIED:-true}" = "true" ] && echo true || echo false)" \
            '{target: $img, scan_type: $stype, options: ({
                cloud_account_id: (if $cloud_acct == "" then null else $cloud_acct end),
                only_verified: $only_verified,
                identity: (if $identity == "" then null else $identity end),
                oidc_issuer: (if $issuer == "" then null else $issuer end),
              } | with_entries(select(.value != null)))}')

        RESP=$(api POST "/scans" "$BODY")
        parse_response "$RESP"

        if [[ "$HTTP_STATUS" != "200" && "$HTTP_STATUS" != "201" ]]; then
            warn "Container scan ${stype} failed (HTTP ${HTTP_STATUS}): ${HTTP_BODY}"
            FAILED_TYPES+=("$stype")
            continue
        fi

        RESULT=$(jq_safe "$HTTP_BODY" '.data.result // .result // .')
        # Severity counts (Grype / Trivy)
        c=$(echo "$RESULT" | jq -r '.summary.critical // 0' 2>/dev/null || echo 0)
        h=$(echo "$RESULT" | jq -r '.summary.high // 0' 2>/dev/null || echo 0)
        m=$(echo "$RESULT" | jq -r '.summary.medium // 0' 2>/dev/null || echo 0)
        l=$(echo "$RESULT" | jq -r '.summary.low // 0' 2>/dev/null || echo 0)
        AGG_CRITICAL=$((AGG_CRITICAL + c))
        AGG_HIGH=$((AGG_HIGH + h))
        AGG_MEDIUM=$((AGG_MEDIUM + m))
        AGG_LOW=$((AGG_LOW + l))
        # KEV count (Phase 1.1)
        kev=$(echo "$RESULT" | jq -r '.summary.actively_exploited // 0' 2>/dev/null || echo 0)
        AGG_KEV=$((AGG_KEV + kev))

        case "$stype" in
            secrets|trufflehog)
                AGG_SECRETS=$(echo "$RESULT" | jq -r '.summary.total // 0' 2>/dev/null || echo 0)
                AGG_VERIFIED_SECRETS=$(echo "$RESULT" | jq -r '.summary.verified // 0' 2>/dev/null || echo 0)
                ;;
            signature|cosign)
                verified=$(echo "$RESULT" | jq -r '.verified // false' 2>/dev/null || echo false)
                SIGNATURE_VERIFIED="$verified"
                SIGNATURE_DETAIL=$(echo "$RESULT" | jq -r '.identity // .warning // ""' 2>/dev/null || echo "")
                ;;
            sbom|syft)
                SBOM_COMPONENTS=$(echo "$RESULT" | jq -r '.summary.total_components // 0' 2>/dev/null || echo 0)
                ;;
        esac
    done
    elog

    # Surface aggregate metrics + apply the fail_on threshold.
    echo "scan_id=container-$(date +%s)" >> "$GITHUB_OUTPUT"
    echo "status=completed" >> "$GITHUB_OUTPUT"
    echo "critical_count=${AGG_CRITICAL}" >> "$GITHUB_OUTPUT"
    echo "high_count=${AGG_HIGH}" >> "$GITHUB_OUTPUT"
    echo "medium_count=${AGG_MEDIUM}" >> "$GITHUB_OUTPUT"
    echo "low_count=${AGG_LOW}" >> "$GITHUB_OUTPUT"
    echo "info_count=0" >> "$GITHUB_OUTPUT"
    echo "total_findings=$((AGG_CRITICAL + AGG_HIGH + AGG_MEDIUM + AGG_LOW + AGG_SECRETS))" >> "$GITHUB_OUTPUT"
    echo "kev_count=${AGG_KEV}" >> "$GITHUB_OUTPUT"
    echo "secrets_verified=${AGG_VERIFIED_SECRETS}" >> "$GITHUB_OUTPUT"
    echo "signature_verified=${SIGNATURE_VERIFIED}" >> "$GITHUB_OUTPUT"
    echo "sbom_components=${SBOM_COMPONENTS}" >> "$GITHUB_OUTPUT"

    SUMMARY_MD=$(cat <<EOF
### Container Security Scan — \`${INPUT_CONTAINER_IMAGE}\`

| Check | Result |
|---|---|
| Critical CVEs | ${AGG_CRITICAL} |
| High CVEs | ${AGG_HIGH} |
| Medium CVEs | ${AGG_MEDIUM} |
| Low CVEs | ${AGG_LOW} |
| Actively exploited (CISA KEV) | ${AGG_KEV} |
| Layer secrets (verified) | ${AGG_VERIFIED_SECRETS} / ${AGG_SECRETS} |
| Cosign signature | ${SIGNATURE_VERIFIED}${SIGNATURE_DETAIL:+ — ${SIGNATURE_DETAIL}} |
| SBOM components | ${SBOM_COMPONENTS} |
| Scans that errored | ${FAILED_TYPES[*]:-none} |
EOF
)
    echo "$SUMMARY_MD" >> "$GITHUB_STEP_SUMMARY" 2>/dev/null || true
    info "$SUMMARY_MD"

    # Fail-on threshold (reuses the web-scan rank mapping above).
    THRESHOLD_RANK=$(sev_rank "${INPUT_FAIL_ON:-critical}")
    if [[ "$THRESHOLD_RANK" -gt 0 ]]; then
        if [[ "$AGG_CRITICAL" -gt 0 && "$THRESHOLD_RANK" -le 5 ]] \
           || [[ "$AGG_HIGH"   -gt 0 && "$THRESHOLD_RANK" -le 4 ]] \
           || [[ "$AGG_MEDIUM" -gt 0 && "$THRESHOLD_RANK" -le 3 ]] \
           || [[ "$AGG_LOW"    -gt 0 && "$THRESHOLD_RANK" -le 2 ]]; then
            fail "Container scan exceeded severity threshold (${INPUT_FAIL_ON})"
        fi
        # KEV is *always* fail-worthy regardless of severity threshold
        # because it's already proven to be exploited in the wild.
        if [[ "$AGG_KEV" -gt 0 ]]; then
            fail "Image contains ${AGG_KEV} CVE(s) on the CISA KEV catalog (actively exploited)"
        fi
        # Verified secrets are likewise blocking.
        if [[ "$AGG_VERIFIED_SECRETS" -gt 0 ]]; then
            fail "Image contains ${AGG_VERIFIED_SECRETS} validated secret(s) -- rotate immediately"
        fi
    fi
    exit 0
fi

# ── Web scan branch (original flow) ───────────────────────────────────

log "Triggering security scan"
info "Target: ${INPUT_TARGET_URL}"

# Build the request body
SCAN_BODY=$(jq -n --arg url "$INPUT_TARGET_URL" '{target_url: $url}')

# Add scan_types if specified
if [[ -n "${INPUT_SCAN_TYPES:-}" ]]; then
    TYPES_JSON=$(echo "$INPUT_SCAN_TYPES" | tr ',' '\n' | sed 's/^ *//;s/ *$//' | jq -R . | jq -s .)
    SCAN_BODY=$(echo "$SCAN_BODY" | jq --argjson types "$TYPES_JSON" '. + {scan_types: $types}')
    info "Scan types: ${INPUT_SCAN_TYPES}"
fi

# Add standards
if [[ -n "${INPUT_STANDARDS:-}" ]]; then
    STD_JSON=$(echo "$INPUT_STANDARDS" | tr ',' '\n' | sed 's/^ *//;s/ *$//' | jq -R . | jq -s .)
    SCAN_BODY=$(echo "$SCAN_BODY" | jq --argjson std "$STD_JSON" '. + {standards: $std}')
fi

# Add scan options
if [[ -n "${INPUT_SCAN_OPTIONS:-}" && "${INPUT_SCAN_OPTIONS}" != "{}" ]]; then
    SCAN_BODY=$(echo "$SCAN_BODY" | jq --argjson opts "$INPUT_SCAN_OPTIONS" '. + {options: $opts}')
fi

# Add auth config
if [[ -n "${INPUT_AUTH_CONFIG:-}" && "${INPUT_AUTH_CONFIG}" != "" ]]; then
    SCAN_BODY=$(echo "$SCAN_BODY" | jq --argjson auth "$INPUT_AUTH_CONFIG" '. + {auth_config: $auth}')
fi

TRIGGER_RAW=$(api POST "/app-scan" "$SCAN_BODY")
parse_response "$TRIGGER_RAW"

if [[ "$HTTP_STATUS" != "200" ]]; then
    fail "Failed to trigger scan (HTTP $HTTP_STATUS): $(jq_safe "$HTTP_BODY" '.detail // .message // "Unknown error"')"
fi

SCAN_ID=$(jq_safe "$HTTP_BODY" '.data.app_scan_id')
if [[ -z "$SCAN_ID" || "$SCAN_ID" == "null" ]]; then
    fail "Scan triggered but no scan ID returned. Response: ${HTTP_BODY}"
fi

info "Scan started: ${SCAN_ID}"
echo "scan_id=${SCAN_ID}" >> "$GITHUB_OUTPUT"
elog

# ── Step 3: Poll for completion ──────────────────────────────────────

log "Waiting for scan to complete (timeout: ${TIMEOUT}s)"
ELAPSED=0
FINAL_STATUS="timeout"

while [[ $ELAPSED -lt $TIMEOUT ]]; do
    sleep "$POLL_INTERVAL"
    ELAPSED=$((ELAPSED + POLL_INTERVAL))

    STATUS_RAW=$(api GET "/app-scan/${SCAN_ID}") || { warn "Poll request failed (network error) — retrying..."; continue; }
    parse_response "$STATUS_RAW"

    if [[ "$HTTP_STATUS" != "200" ]]; then
        warn "Poll failed (HTTP $HTTP_STATUS) — retrying..."
        continue
    fi

    SCAN_STATUS=$(jq_safe "$HTTP_BODY" '.data.status')
    PROGRESS=$(jq_safe "$HTTP_BODY" '.data.progress // "?"')

    echo "  ⏳ [${ELAPSED}s] Status: ${SCAN_STATUS} | Progress: ${PROGRESS}"

    case "$SCAN_STATUS" in
        completed)
            FINAL_STATUS="completed"
            info "Scan completed successfully"
            break
            ;;
        failed|error)
            FINAL_STATUS="failed"
            ERROR_MSG=$(jq_safe "$HTTP_BODY" '.data.error_message // "Unknown error"')
            warn "Scan failed: ${ERROR_MSG}"
            break
            ;;
    esac
done

echo "status=${FINAL_STATUS}" >> "$GITHUB_OUTPUT"
elog

if [[ "$FINAL_STATUS" == "timeout" ]]; then
    fail "Scan timed out after ${TIMEOUT}s. Scan ID: ${SCAN_ID}. Check the platform for results."
fi

if [[ "$FINAL_STATUS" == "failed" ]]; then
    fail "Scan failed. Scan ID: ${SCAN_ID}. Check the platform for details."
fi

# ── Step 4: Extract results ──────────────────────────────────────────

log "Extracting scan results"

# Re-fetch final results
RESULT_RAW=$(api GET "/app-scan/${SCAN_ID}") || fail "Failed to fetch scan results (network error). Scan ID: ${SCAN_ID}. Check the platform."
parse_response "$RESULT_RAW"

if [[ "$HTTP_STATUS" != "200" ]]; then
    fail "Failed to fetch scan results (HTTP $HTTP_STATUS). Scan ID: ${SCAN_ID}. Check the platform for results."
fi

RESULT_DATA="$HTTP_BODY"

# Extract severity counts
CRITICAL=$(jq_safe "$RESULT_DATA" '.data.findings_by_severity.critical // 0')
HIGH=$(jq_safe "$RESULT_DATA" '.data.findings_by_severity.high // 0')
MEDIUM=$(jq_safe "$RESULT_DATA" '.data.findings_by_severity.medium // 0')
LOW=$(jq_safe "$RESULT_DATA" '.data.findings_by_severity.low // 0')
INFO_COUNT=$(jq_safe "$RESULT_DATA" '.data.findings_by_severity.info // 0')
TOTAL=$((CRITICAL + HIGH + MEDIUM + LOW + INFO_COUNT))

# Extract rating
RATING=$(jq_safe "$RESULT_DATA" '.data.security_rating // "N/A"')
SCORE=$(jq_safe "$RESULT_DATA" '.data.security_score // "N/A"')

# Report URL
REPORT_URL="${INPUT_API_URL%/}/api/app-scan/${SCAN_ID}/report?format=html"

info "Total findings: ${TOTAL}"
info "Critical: ${CRITICAL} | High: ${HIGH} | Medium: ${MEDIUM} | Low: ${LOW} | Info: ${INFO_COUNT}"
info "Security Rating: ${RATING} (${SCORE}/100)"

# Set outputs
{
    echo "total_findings=${TOTAL}"
    echo "critical_count=${CRITICAL}"
    echo "high_count=${HIGH}"
    echo "medium_count=${MEDIUM}"
    echo "low_count=${LOW}"
    echo "info_count=${INFO_COUNT}"
    echo "security_rating=${RATING}"
    echo "security_score=${SCORE}"
    echo "report_url=${REPORT_URL}"
} >> "$GITHUB_OUTPUT"

elog

# ── Step 5: Extract top findings for PR comment ──────────────────────

TOP_FINDINGS=""
if [[ "$TOTAL" -gt 0 ]]; then
    # Get the top 10 findings (critical + high first)
    TOP_FINDINGS=$(echo "$RESULT_DATA" | jq -r '
        [.data.findings // [] | sort_by(
            if .severity == "critical" then 0
            elif .severity == "high" then 1
            elif .severity == "medium" then 2
            elif .severity == "low" then 3
            else 4 end
        ) | .[:10] | .[] |
        "| " + (.severity // "info" | ascii_upcase) +
        " | " + (.title // .name // "Unnamed") +
        " | " + (.validation_status // "Potential") +
        " | " + (.owasp_2021 // .owasp_category // "—") + " |"
        ] | join("\n")
    ' 2>/dev/null || echo "")
fi

# ── Step 6: Post PR comment ──────────────────────────────────────────

if [[ "${INPUT_COMMENT_ON_PR}" == "true" && -n "${GITHUB_EVENT_NAME:-}" ]]; then
    log "Posting PR comment"

    # Determine if we're in a PR context
    PR_NUMBER=""
    if [[ "${GITHUB_EVENT_NAME}" == "pull_request" || "${GITHUB_EVENT_NAME}" == "pull_request_target" ]]; then
        PR_NUMBER=$(jq -r '.pull_request.number // ""' "$GITHUB_EVENT_PATH" 2>/dev/null || echo "")
    fi

    if [[ -n "$PR_NUMBER" && -n "${GITHUB_TOKEN:-}" ]]; then
        # Build severity badge
        if [[ "$CRITICAL" -gt 0 ]]; then
            BADGE="🔴 Critical"
            BADGE_COLOR="critical"
        elif [[ "$HIGH" -gt 0 ]]; then
            BADGE="🟠 High"
            BADGE_COLOR="high"
        elif [[ "$MEDIUM" -gt 0 ]]; then
            BADGE="🟡 Medium"
            BADGE_COLOR="medium"
        elif [[ "$LOW" -gt 0 ]]; then
            BADGE="🔵 Low"
            BADGE_COLOR="low"
        else
            BADGE="🟢 Clean"
            BADGE_COLOR="clean"
        fi

        # Build the comment body
        COMMENT_BODY="## 🛡️ Security Scan Results

**Target:** \`${INPUT_TARGET_URL}\`
**Rating:** ${RATING} (${SCORE}/100) | **Status:** ${BADGE}

### Findings Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | ${CRITICAL} |
| 🟠 High | ${HIGH} |
| 🟡 Medium | ${MEDIUM} |
| 🔵 Low | ${LOW} |
| ⚪ Info | ${INFO_COUNT} |
| **Total** | **${TOTAL}** |"

        # Add top findings table if any exist
        if [[ -n "$TOP_FINDINGS" ]]; then
            COMMENT_BODY="${COMMENT_BODY}

### Top Findings

| Severity | Finding | Validation | OWASP |
|----------|---------|------------|-------|
${TOP_FINDINGS}"
        fi

        # Add threshold info
        if [[ "$FAIL_ON" != "none" ]]; then
            FAIL_RANK=$(sev_rank "$FAIL_ON")
            BREACHED="false"
            for sev in critical high medium low info; do
                COUNT_VAR="${sev^^}"
                [[ "$sev" == "info" ]] && COUNT_VAR="INFO_COUNT"
                COUNT="${!COUNT_VAR:-0}"
                if [[ "$COUNT" -gt 0 && $(sev_rank "$sev") -ge $FAIL_RANK ]]; then
                    BREACHED="true"
                    break
                fi
            done

            if [[ "$BREACHED" == "true" ]]; then
                COMMENT_BODY="${COMMENT_BODY}

> ⛔ **Pipeline will fail** — findings at or above **${FAIL_ON}** severity detected. Threshold: \`fail_on: ${FAIL_ON}\`"
            else
                COMMENT_BODY="${COMMENT_BODY}

> ✅ **Pipeline passes** — no findings at or above **${FAIL_ON}** severity. Threshold: \`fail_on: ${FAIL_ON}\`"
            fi
        fi

        COMMENT_BODY="${COMMENT_BODY}

<details>
<summary>📄 Full Report</summary>

Download the full security assessment report from the platform:
- [HTML Report](${REPORT_URL})
- Scan ID: \`${SCAN_ID}\`
</details>

---
*Powered by [Offload Security](${INPUT_API_URL}) — Automated Security Assessment*"

        # Post or update the comment
        # First, check if a previous scan comment exists (to update it)
        REPO="${GITHUB_REPOSITORY}"
        EXISTING_COMMENT_ID=$(curl -s \
            -H "Authorization: Bearer ${GITHUB_TOKEN}" \
            -H "Accept: application/vnd.github.v3+json" \
            "https://api.github.com/repos/${REPO}/issues/${PR_NUMBER}/comments?per_page=100" \
            | jq -r '[.[] | select(.body | contains("🛡️ Security Scan Results"))] | last | .id // empty' 2>/dev/null || echo "")

        COMMENT_JSON=$(jq -n --arg body "$COMMENT_BODY" '{body: $body}')

        if [[ -n "$EXISTING_COMMENT_ID" ]]; then
            # Update existing comment
            curl -s -X PATCH \
                -H "Authorization: Bearer ${GITHUB_TOKEN}" \
                -H "Accept: application/vnd.github.v3+json" \
                "https://api.github.com/repos/${REPO}/issues/comments/${EXISTING_COMMENT_ID}" \
                -d "$COMMENT_JSON" > /dev/null
            info "Updated existing PR comment #${EXISTING_COMMENT_ID}"
        else
            # Create new comment
            curl -s -X POST \
                -H "Authorization: Bearer ${GITHUB_TOKEN}" \
                -H "Accept: application/vnd.github.v3+json" \
                "https://api.github.com/repos/${REPO}/issues/${PR_NUMBER}/comments" \
                -d "$COMMENT_JSON" > /dev/null
            info "Posted new PR comment"
        fi
    else
        info "Not in a PR context or no GITHUB_TOKEN — skipping comment"
    fi
    elog
fi

# ── Step 7: Apply failure threshold ──────────────────────────────────

if [[ "$FAIL_ON" != "none" ]]; then
    log "Checking severity threshold"
    FAIL_RANK=$(sev_rank "$FAIL_ON")

    for sev in critical high medium low info; do
        SEV_RANK=$(sev_rank "$sev")
        if [[ $SEV_RANK -ge $FAIL_RANK ]]; then
            case "$sev" in
                critical) COUNT=$CRITICAL ;;
                high)     COUNT=$HIGH ;;
                medium)   COUNT=$MEDIUM ;;
                low)      COUNT=$LOW ;;
                info)     COUNT=$INFO_COUNT ;;
            esac
            if [[ "$COUNT" -gt 0 ]]; then
                elog
                fail "Found ${COUNT} ${sev} finding(s). Threshold: fail_on=${FAIL_ON}. Scan: ${SCAN_ID}"
            fi
        fi
    done

    info "No findings at or above '${FAIL_ON}' severity — pipeline passes"
    elog
fi

echo ""
echo "========================================="
echo "  Security scan complete"
echo "  Rating: ${RATING} (${SCORE}/100)"
echo "  Findings: ${TOTAL} total"
echo "  Scan ID: ${SCAN_ID}"
echo "========================================="

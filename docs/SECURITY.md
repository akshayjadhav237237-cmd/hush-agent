# Hush Security Policy and Operational Hygiene

**Document Version:** 1.0.0  
**Repository:** `jolly-hawking` / `hush-landing-v2`  
**Classification:** Public Security Specification  
**Last Updated:** 2026-11-15  

---

## 1. Executive Summary & Security Philosophy

Hush is designed around the principles of **least privilege**, **defense-in-depth**, and **fail-closed operational safety**. Because autonomous agents interact directly with language models, local shell commands, desktop environments, and external web resources, robust security cannot rely on model self-restraint alone. Security boundaries must be enforced deterministically through code, environment isolation, tamper-evident logging, and human-in-the-loop escalation gates.

---

## 2. Credential & Secret Management

### 2.1 Environment Variables Only
- **Zero Secrets in Code or Logs:** API keys, access tokens, service credentials, and OIDC tokens must never be hardcoded in application source code, configuration files, prompt templates, unit tests, or documentation.
- **Runtime Injection:** All credentials (including `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `NTFY_TOPIC`, `VERCEL_OIDC_TOKEN`, etc.) are passed exclusively through process environment variables at runtime.
- **Memory-Only Processing:** Model clients and network drivers load keys into memory on startup and do not persist them into workspace files, checkpoints, or serialized output artifacts.

### 2.2 Working Tree and Disk Hygiene
- **Strict Exclusion via Git and Deployment Ignore Rules:**
  Local configuration files containing secrets (`.env`, `.env.*`, `.env.local`) are strictly excluded from version control and deployment uploads via `.gitignore` and `.vercelignore` across all repositories (`jolly-hawking` and `hush-landing-v2`).
- **No Disk Storage of Ephemeral Tokens:**
  Active deployment tokens or temporary CI/CD credentials must never be written to plaintext files on local disk. If generated during automated workflows, they must be stored in secure operating system credential stores or ephemeral in-memory environment variables.

---

## 3. Tamper-Evident Audit Logging & Secret Redaction

### 3.1 What the Audit Log Holds
Every orchestrator session generates an append-only audit trail at `agent/runs/<run_id>/audit.jsonl`. This log captures all operational events required to reconstruct the execution lifecycle:

- `run_start`: Initial session configuration, run ID, and timestamp.
- `model_text`: Model reasoning and generated action plans (redacted).
- `tool_call`: Dispatched tool invocations, names, and parameters.
- `tool_result`: Output returned by local tools, command executions, and drivers.
- `screenshot`: Perceptual verification captures and perceptual hash records.
- `gate`: Human verification gate interventions and prompt-response records.
- `limit`: Rate-limiting and token quota cooldown events.
- `switch`: Multi-account browser profile switching events.
- `checkpoint`: Periodic state persistence for execution resume.
- `retry`: Automated retry attempts on transient model failures.
- `kill` / `failsafe_abort`: Operator emergency interrupt events.
- `resumed`: Session resume from saved checkpoint.
- `finish`: Successful task completion assertion.
- `max_steps`: Guardrail termination when exceeding configured step budget.

### 3.2 Cryptographic Hash Chaining
To guarantee tamper detection, audit logs employ cryptographic SHA-256 hash chaining:
- Every record entry includes a `prev` field containing the SHA-256 hexadecimal digest of the preceding line.
- The initial entry begins with a 64-character seed string of zeros (`0` * 64).
- Any alteration, deletion, insertion, or reordering of records invalidates subsequent hashes in the chain, detectable instantly via `agent.core.audit.verify_chain(path)`.

### 3.3 Automated Secret Redaction and Suppression
Before writing any event to disk, the audit subsystem passes all fields through recursive redaction (`agent.core.audit.redact`):
- **Pattern-Based Masking:** Strings are scanned against `SECRET_PATTERNS` regular expressions:
  - Google API Keys (`AIza[0-9A-Za-z-_]{35}`)
  - OpenAI / Anthropic Keys (`sk-[a-zA-Z0-9]{20,}`)
  - GitHub Personal Access Tokens (`ghp_[a-zA-Z0-9]{20,}`, `github_pat_[a-zA-Z0-9_]{20,}`)
  - HTTP Authorization Headers (`Bearer\s+[a-zA-Z0-9_\-\.]+`)
  Matched patterns are replaced with `[REDACTED]` and truncated to `DEFAULT_REDACT_LIMIT` characters.
- **Sensitive Tool Suppression:** Tools handling user input or clipboard state (`paste_text`, `read_clipboard`, `paste_artifact`) have their payloads masked when `log_text=False`. Instead of plaintext, the audit log records the character length and SHA-256 digest prefix (`_mask_value`), ensuring sensitive credentials copied to the system clipboard never leak into log files.

---

## 4. Incident Response: Leaked Credential Remediation & Rotation

If an API key, deployment token, or credential is suspected of being exposed or committed:

### Step 1: Immediate Provider Revocation
Revoke the credential immediately at the source identity provider:
- **Vercel OIDC / Deployment Tokens:** Revoke via Vercel Dashboard -> Project Settings -> Security / Access Tokens.
- **Google Cloud / AI Studio:** Delete the compromised key in Google Cloud Console Credentials or Google AI Studio API Key Manager.
- **Anthropic / OpenAI:** Revoke the affected key in Anthropic Console / OpenAI Platform API Keys.
- **GitHub Tokens:** Revoke under GitHub Settings -> Developer Settings -> Personal Access Tokens.

### Step 2: Verification of Invalidation
Test the revoked token using a command-line request (e.g. `curl -I -H "Authorization: Bearer <TOKEN>" ...`) to confirm the provider returns `401 Unauthorized` or `403 Forbidden`.

### Step 3: Local Disk Clean-up
Delete any untracked credential files on disk (e.g., `hush-landing-v2/.env.local` or `.env` files). Never leave inactive or compromised keys on filesystem storage.

### Step 4: Repository and Git Assessment
Inspect git status and local history. If the token was never committed to git (e.g. uncommitted file on disk), deleting the file and verifying `.gitignore` prevents future exposure. If a credential was ever committed into public or shared git history:
- Consider the credential permanently compromised.
- Do not rely on git revert or squash alone; proceed with immediate token revocation.

### Step 5: Secure Rotation & Re-provisioning
1. Generate a new secret key with the narrowest scope and shortest expiration necessary.
2. Inject the new key via the hosting provider's secure secret manager (e.g., Vercel Project Environment Variables, GitHub Actions Secrets) or developer terminal session environment.
3. Ensure no developer writes the new key into tracked repository files.

### Step 6: Post-Mortem and Preventative Audit
1. Audit `.gitignore` and `.vercelignore` to ensure patterns like `.env*` and `.env.local` are present.
2. Confirm pre-commit hooks or automated secret scanning tools detect sensitive patterns before commit.
3. Document incident timelines, affected systems, and verification evidence.

---

## 5. Security Boundaries & Operational Limitations

### 5.1 Command Allowlist vs. OS Sandbox
The orchestrator incorporates a command inspection boundary (`agent/core/command_safety.py`):
- **Permitted Command Binaries:** Only commands in `ALLOWED_COMMANDS` (`git`, `npm`, `node`, `python`, `pip`, `dir`, `type`, `echo`, `mkdir`, `cd`) may be invoked.
- **Blocked Substrings & Operators:** Chaining operators (`&&`, `||`, `;`, `|`), redirection (`>`, `<`), dangerous flags (`git -c`, `git push`, `pip install`), and destructive commands (`rm -rf`, `format`, `reg delete`) are blocked.
- **Sensitive Path Protection:** Access to restricted file patterns (`.env`, `.ssh`, `id_rsa`, `credentials`, `secrets`) is rejected.

> [!WARNING]
> **Operational Sanity Boundary vs. Sandboxing:**  
> The command allowlist is an *operational sanity boundary*, not an operating system virtualization sandbox. Commands executed via `python script.py` or `node script.js` run under the privileges of the executing host user. For multi-tenant or untrusted script execution, the agent must run inside an isolated Docker container, Windows Sandbox, or AppContainer with strict network egress filtering and filesystem virtualization.

### 5.2 Human Escalation Protocol (`notify_human`)
Certain operations exceed autonomous authority and mandate human approval:
- **Authentication & CAPTCHAs:** The agent must never attempt to bypass MFA or CAPTCHA challenges; it must pause and invoke `notify_human`.
- **Destructive File or Database Operations:** Dropping databases, deleting directories, or executing irreversible commands requires explicit operator consent.
- **Policy Violations & Unrecoverable Tool Failures:** When external conditions or non-retryable errors arise, execution halts and alerts the human operator via interactive console prompt or ntfy notification channel.

### 5.3 Emergency Failsafe & Kill Switch
Operators maintain continuous physical control over agent execution:
- **Mouse Corner Failsafe:** Moving the mouse pointer to `(0, 0)` immediately triggers `pyautogui.FailSafeException`, terminating execution with `EXIT_FAILSAFE` (2).
- **Global Hotkey Interrupt:** Pressing `Ctrl+Alt+K` sets the kill switch flag across all threads, terminating execution with `EXIT_KILL` (3).

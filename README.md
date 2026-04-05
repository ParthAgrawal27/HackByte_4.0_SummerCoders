# TriageOps: AI-Powered Incident Triage System

## 🚀 Hackathon Phase 1 MVP Details

This application automatically ingests mock system alerts, analyzes them via Google Gemini (with deterministic fallbacks for reliable hackathon demos), and presents them on a dynamic real-time React dashboard with severity, auto-triage, and smart mitigation steps.

### Tech Stack
- **Frontend**: React, Vite, Tailwind CSS v4, Lucide React
- **Backend**: Node.js, Express
- **Database**: SQLite3
- **AI**: `@google/generative-ai`

---

## 💻 How to Run the Demo locally

You need three terminal windows to run this MVP comprehensively:

### 1. Start the Backend API
```bash
cd backend
npm install
npm run dev
```

### 2. Start the Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```

### 3. Start the Alert Simulator 
This simulates realistic noisy system alerts from Datadog, PagerDuty, etc.
```bash
cd backend
node scripts/generate_data.js
```

---

## 🎨 Demo Script
1. Open the **Frontend URL** (`http://localhost:5173`).
2. Show the clean, empty dashboard. Explain how on-call engineers are swamped manually checking logs for simple things like disk-space warnings.
3. Start the **Alert Simulator** in another terminal.
4. Watch as new alerts animate onto the UI, briefly flash **"AI PROCESSING"**, and then snap into neatly categorized cards with a Red/Orange/Yellow priority.
5. Click on an alert to expand it. Show the AI's **Recommended Action**, **Confidence Score**, and **Raw Message**. 
6. Click **Mark Resolved** and watch the metrics bar update showing "Manual Time Saved".

## 🚧 Next Steps (Phase 2)
The database structure is built. Phase 2 simply involves adding an `/api/slack` webhook endpoint in Express that calls `Jira API`, instead of relying heavily on the UI dashboard!

## 🧠 How It Works — End-to-End Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Alert    │────▶│  Gemini  │────▶│  Patch   │────▶│  GitHub  │────▶│  Human   │
│  Received │     │  Analyze │     │  Generate│     │  PR Open │     │  Review  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
```
### Step-by-step:

1. **Alert Received** — An incident comes in via Slack `/triage` command or the `/simulate` endpoint.
2. **Incident Created** — A new row is inserted into SQLite with status `Pending`.
3. **AI Analysis** — Gemini analyzes the alert text, logs, and runbook hints. It returns structured JSON: `{cause, severity, fix, confidence}`.
4. **Patch Generation** — Gemini generates the corrected file content for `demo_service.py`.
5. **GitHub Branch + Commit** — A new branch `auto-fix-{id}` is created, the patched file is committed.
6. **Pull Request Opened** — A PR is opened against `main` with an AI-generated title and description.
7. **Slack Notification** — A Block Kit message is posted with "Approve & Merge" and "Reject & Close" buttons.
8. **Human Decision** — The DevOps engineer clicks a button (in Slack or the Web UI). The PR is merged or closed accordingly.
9. **Status Updated** — The incident record in SQLite is updated to `Merged` or `Rejected`.

> ⚠️ **The agent never auto-merges.** A human must explicitly approve every change.

---

## 🔌 API Endpoints

### Slack Integration

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/slack/triage` | Receives Slack slash command payload. Verifies HMAC signature, creates an incident, and kicks off background AI triage. Responds immediately with an acknowledgement. |
| `POST` | `/slack/actions` | Handles interactive button callbacks from Slack Block Kit ("Approve PR" / "Reject PR"). Merges or closes the GitHub PR and updates the database. |

### Simulation & Frontend

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/simulate` | Dev/demo endpoint. Submit a fake alert with custom `alert_text`, `logs`, and `runbook` fields. Triggers the full AI pipeline in the background. |
| `GET`  | `/api/incidents` | Returns all incidents ordered by most recent. Used by the frontend dashboard for the incident list view. |
| `GET`  | `/api/incidents/{id}` | Returns a single incident with full detail (root cause, patch diff, PR link, status). Used by the frontend detail view. |

### Example: Simulate an Incident

```bash
curl -X POST http://localhost:8000/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "alert_text": "auth-service connection timeout",
    "logs": "2026-04-01 ERR: Connection timeout in service.py at line 42",
    "runbook": "If timeout occurs, increase max_retries from 3 to 5"
  }'
```

**Response:**
```json
{ "status": "started", "incident_id": 1 }
```

---

## 📦 Module Breakdown

### `main.py` — FastAPI Application

The central hub that wires everything together.

- **Lifespan handler**: Initializes the SQLite database on startup.
- **CORS middleware**: Allows the React frontend (running on a different port) to communicate.
- **`process_incident()`**: The core synchronous function that orchestrates the entire triage pipeline (Gemini → GitHub → DB update). Runs inside FastAPI's `BackgroundTasks` thread pool so the HTTP response returns immediately.
- **Error resilience**: GitHub API calls are wrapped in try/except blocks. If the GitHub repo is unreachable, a mock PR is assigned so the dashboard still works.

### `agent.py` — Gemini AI Integration

Uses the official `google-genai` SDK with `gemini-2.5-flash`.

| Function | Purpose | Output |
|----------|---------|--------|
| `analyze_incident(alert, logs, runbook)` | Chain-of-thought root cause analysis | `{cause, severity, fix, confidence}` JSON |
| `generate_patch(fix_instruction, file_path, context)` | Generates the corrected file content | Raw source code string |
| `generate_pr_info(fix_instruction)` | Writes PR title and body | `{title, body}` JSON |

**Key design choices:**
- `response_mime_type="application/json"` forces Gemini to output valid JSON (no markdown wrapping).
- Low temperature (0.1–0.2) ensures deterministic, reliable outputs.
- `get_client()` re-reads the `.env` file on every call (`load_dotenv(override=True)`) so you can hot-swap your API key without restarting the server.

### `github_service.py` — GitHub REST API Wrapper

Performs all GitHub operations using a Personal Access Token (PAT).

| Function | GitHub API Endpoint | Purpose |
|----------|--------------------|---------|
| `get_base_sha(branch)` | `GET /repos/{owner}/{repo}/branches/{branch}` | Gets the latest commit SHA on `main` |
| `create_branch(name)` | `POST /repos/{owner}/{repo}/git/refs` | Creates a new branch from `main` |
| `update_file(path, content, msg, branch)` | `PUT /repos/{owner}/{repo}/contents/{path}` | Commits a file (base64-encoded) to the branch |
| `create_pull_request(title, body, head)` | `POST /repos/{owner}/{repo}/pulls` | Opens a PR against `main` |
| `merge_pull_request(pr_number)` | `PUT /repos/{owner}/{repo}/pulls/{n}/merge` | Merges the PR (human-triggered only) |
| `close_pull_request(pr_number)` | `PATCH /repos/{owner}/{repo}/pulls/{n}` | Closes the PR without merging |

**Graceful degradation:** If the GitHub token is missing or the repo doesn't exist, all functions return mock data instead of crashing.

### `slack_service.py` — Slack Integration

| Function | Purpose |
|----------|---------|
| `verify_slack_signature()` | HMAC-SHA256 verification of incoming Slack payloads. Bypassed if no signing secret is configured. |
| `send_approval_message()` | Posts a Block Kit message with incident details and interactive "Approve" / "Reject" buttons. |
| `update_message_on_action()` | Replaces the original Slack message with a status update after human action. |

### `db.py` — SQLite Database Layer

A lightweight persistence layer using raw `sqlite3` with Pydantic models for type safety.

**Incidents table schema:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER (PK) | Auto-incrementing incident ID |
| `severity` | TEXT | `High`, `Medium`, or `Low` |
| `status` | TEXT | `Pending` → `Analyzing` → `PR Opened` → `Merged` / `Rejected` |
| `service` | TEXT | Name of the affected service |
| `alert_text` | TEXT | The original alert message |
| `logs` | TEXT | Associated log lines |
| `runbook` | TEXT | Runbook hints for the AI |
| `root_cause` | TEXT | AI-generated root cause explanation |
| `fix_diff` | TEXT | The generated patched code |
| `pr_url` | TEXT | GitHub PR URL |
| `pr_number` | INTEGER | GitHub PR number |
| `created_at` | TEXT | ISO timestamp |
| `updated_at` | TEXT | ISO timestamp |

### `demo_service.py` — Mock Target File

A simple Python file that the AI agent patches during demonstrations:

```python
def timeout_handler():
    max_retries = 3
    for i in range(max_retries):
        try:
            pass  # network call
        except Exception:
            pass
```

The agent reads this as context and generates the fixed version (e.g., changing `max_retries` from 3 to 5).

---

## ⚙️ Setup & Running

### 1. Install Dependencies

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy the example and fill in your tokens:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Google AI Studio API key for Gemini |
| `GITHUB_TOKEN` | ✅ Yes | GitHub PAT with `repo` scope |
| `GITHUB_REPO_OWNER` | ✅ Yes | Your GitHub username |
| `GITHUB_REPO_NAME` | ✅ Yes | Target repository name (must exist with a `main` branch) |
| `SLACK_SIGNING_SECRET` | Optional | Slack app signing secret (bypassed if empty) |
| `SLACK_BOT_TOKEN` | Optional | Slack bot token for posting messages |

### 3. Start the Server

```bash
uvicorn main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`.

### 4. Expose to Slack (Optional)

```bash
ngrok http 8000
```

Use the ngrok HTTPS URL as your Slack app's slash command and interactivity endpoint.

---

## 🔐 Security Notes

- **Slack signature verification**: All incoming Slack payloads are verified using HMAC-SHA256.
- **No auto-merge**: The agent creates PRs but never merges them. A human must explicitly approve.
- **Token isolation**: All secrets are stored in `.env` and never hardcoded.
- **Least privilege**: GitHub PAT should only have `repo` scope on the target repository.

---

## 🧪 Testing Checklist

- [ ] Start backend → `uvicorn main:app --reload`
- [ ] Hit `/simulate` with a sample alert
- [ ] Check `/api/incidents` returns the new incident
- [ ] Check `/api/incidents/{id}` shows root cause and patch
- [ ] Verify GitHub PR was created (if real token configured)
- [ ] Click "Merge to Main" or "Reject Patch" on the frontend
- [ ] Confirm status updates to `Merged` or `Rejected`

---

## 📊 Tech Stack Summary

| Component | Technology |
|-----------|-----------|
| Framework | FastAPI (Python 3.10+) |
| AI Model | Google Gemini 2.5 Flash via `google-genai` SDK |
| Database | SQLite (zero-config, file-based) |
| GitHub | REST API v3 with Personal Access Token |
| Slack | Slash Commands + Block Kit + Web API |
| Tunneling | ngrok (for local Slack integration) |

---

*Built for HackByte 2026 🚀*

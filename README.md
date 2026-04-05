# 🛡️ Incident Triage AI — Autonomous DevOps Copilot

**An Intelligent DevOps & SRE Workspace that detects errors, evaluates logs, generates code patches, pushes them to GitHub, and communicates natively via Slack.**

---

## 🎯 The Problem Statement

In modern high-scale engineering environments, **Site Reliability Engineers (SREs)** and DevOps teams are overwhelmed by "alert fatigue". When a production system fails:
1. Hundreds of cryptic logs and fragmented alerts fire simultaneously across various dashboards.
2. A human engineer must manually trace logs sequentially, map the root cause, figure out what code broke the system, write a patch locally, and finally open a Pull Request.
3. Teams lose critical **Mean Time to Resolution (MTTR)** switching contexts between alerting systems, IDEs, GitHub, and Slack to manage incident communication.

## 💡 The Solution

**Incident Triage AI** radically transforms how outages are handled by acting as an **Autonomous First Responder**. Instead of an engineer digging through data, the AI ingests the alert the millisecond it fires, analyzes it, and resolves it autonomously.

1. **Intakes the Anomaly**: Ingests incoming webhooks containing the system Alert and Raw Logs.
2. **Diagnoses the Root Cause**: Analyzes the traceback using advanced context models.
3. **Writes the Patch & Opens a PR**: Directly searches the codebase, authors the architectural fix, commits it to a new branch, and pushes a Pull Request to your actual GitHub Repository.
4. **Requests Human Sign-Off via Slack**: Dispatches an interactive Slack message so an engineer can click **"Merge PR"** or **"Reject PR"** directly from their phone/channel.

---

## 🌊 System Architecture & Workflow Flow

Let's walk through exactly how data flows through the application pipeline end-to-end:

### 1. Alert Ingestion (The Trigger)
A system (or the user manually via the Copilot UI) triggers the `POST /simulate` endpoint. This payloads the `alert_text`, native `logs`, and optional `runbook` instructions to the FastAPI backend backend. An Incident is drafted into SQLite as `Pending`.

### 2. Autonomous Analysis Engine (`agent.py`)
The FastApi BackgroundWorker triggers the Gemini Large Language Model (LLM) using `google-genai`. It feeds the LLM the logs and asks it to determine the **Root Cause**, **Severity**, and formulate a **Technical Fix Instruction**. 
*(System Resilience: If Gemini API is rate-limited or fails, a highly specific deterministic fallback logic kicks in natively, allowing the pipeline to succeed regardless).*

### 3. Automated GitOps Developer (`github_service.py`)
Using the Fix Instruction from the previous step, the system dynamically generates functioning Python code. It connects to the configured GitHub repository via Personal Access Token (`GITHUB_TOKEN`), creates a new `<auto-fix...>` remote branch, writes the patch over the broken files, and officially opens a `Pull Request`.

### 4. Interactive Team Communication (`slack_service.py`)
The system drafts a Slack Block-Kit message displaying the severity and root cause, complete with a hyperlink to the GitHub PR. Most importantly, it includes interactive **Merge PR** and **Reject PR** buttons. SREs can resolve the incident directly inside their Slack channel.

### 5. Copilot Interface Layer (React/Vite)
Meanwhile, the front-end dashboard continually updates. Engineers logging into the portal won't see a confusing matrix of metrics; instead, they see a highly-intuitive **Conversational Feed** detailing the event sequence block-by-block. 

---

## 🚀 Development Journey (What we did so far)

This repository went through several major architectural shifts to find the absolute best, most modern balance between speed and reliability:

1. **Infrastructure Pivot (Node.js -> Python)**
   - **Initial State**: Built on Express.js and Node.js.
   - **Final Pivot**: Completely migrated the core logic to Python/FastAPI. Python offers much native synergy with AI libraries, incredibly fast startup times via Uvicorn, and clean native asynchronous background queues for handling prolonged agent thinking.
2. **Database Pivot (MongoDB -> SQLite)**
   - **Initial State**: Stored data in a remote MongoDB Atlas cluster.
   - **Final Pivot**: Refactored to drop Mongo in favor of embedded SQLite natively bundled inside the repo. This achieved zero-configuration for demo setups, bypassing complex IP whitelisting issues and saving bandwidth.
3. **Frontend Copilot Pivot (SRE Dashboard -> Conversational UI)**
   - **Initial State**: The UI was originally a dense "SRE Matrix". It was flooded with massive statistic blocks, extreme glassmorphism, and complex visual grids. 
   - **Final Pivot**: Completely gutted the interface to match modern **"Copilot Dialogues"**. Ripped out `App.css`, `MetricsPanel.jsx`, and `StatsBar.jsx`. Implemented a gorgeous, flat 2-pane UI (Incident List pane on the left side, Chat Timeline pane on the right). Changed colors to be human-readable, scalable to Light & Dark, and heavily utilized Semantic Tailwind features.
4. **API Stability (Rate Limits)**
   - **Initial State**: A 429 quota exhaustion string from Gemini would crash the triage.
   - **Final Pivot**: Built a graceful degradation try/except layer allowing the system to instantly intercept quota failures and proceed with deterministic fallbacks to finish triggering the GitHub/Slack pipelines.

---

## 📂 File Structure Breakdown

### ☁️ Backend Architecture (`/backend`)
| File | Responsibility |
| :--- | :--- |
| **`main.py`** | FastAPI entry point; initializes REST routes and background triage workers. |
| **`agent.py`** | Integrates Gemini LLM API to analyze logs & formulate code patches. Contains rate-limit fallbacks. |
| **`db.py`** | SQLite logic to initialize schemas and perform read/write logic for Incident histories. |
| **`demo_service.py`** | The dummy target python file that the AI patches automatically. |
| **`github_service.py`** | Performs repository operations (branches, commits, pulls) via GitHub REST API. |
| **`slack_service.py`** | Dispatches Slack webhook alerts and handles signature verification for interactive buttons. |

### 🎨 Frontend Architecture (`/frontend/src/`)
| File | Responsibility |
| :--- | :--- |
| **`App.jsx`** | Master layout rendering the 2-pane chat timeline container and pulling data intervals. |
| **`Dashboard.jsx`** | Central feed that formats the incident history as sequential "messages" from the Copilot. |
| **`SimulateModal.jsx`** | Interactive modal component for dispatching explicit outages or custom logs. |
| **`StatusActions.jsx`** | The context action layer containing functional UI triggers for Merging or Rejecting GitHub PRs iteratively. |
| **`index.css`** | The modern style system establishing custom generic variables mapping correctly across Light and Dark themes. |

---

## ⚡ Getting Started (How to Run)

Use these instructions to launch both application endpoints simultaneously on your local machine!

### Step 1: Setup the Backend (FastAPI on Port 8000)
1. **Navigate** into the folder: `cd backend`
2. **Virtual Environment**: 
   - Windows: `python -m venv venv` and then run `.\venv\Scripts\activate`
   - Mac/Linux: `python3 -m venv venv` and run `source venv/bin/activate`
3. **Install Dependencies**: `pip install -r requirements.txt`
4. **Environment (`.env`)**: Ensure variables like `GEMINI_API_KEY`, `GITHUB_TOKEN`, and `SLACK_WEBHOOK_URL` are present in your backend directory.
5. **Start Server**: `uvicorn main:app --reload --port 8000`

### Step 2: Setup the Frontend (Vite on Port 5173)
1. **Navigate** in a *new* terminal window: `cd frontend`
2. **Install Node Packages**: `npm install`
3. **Start the Interface**: `npm run dev`
4. Open a browser to `http://localhost:5173`. 
   
*Click **"Test Data"** in the UI to instantly seed multiple test outages into the system and watch the copilot react organically!*

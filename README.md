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

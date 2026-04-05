import os
from fastapi import FastAPI, Request, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uuid
import json

# Internal imports
import db
import agent
import github_service as github
import slack_service as slack

app = FastAPI()

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database on Startup
@app.on_event("startup")
def startup_event():
    db.init_db()

# --- Models ---
class SimulateRequest(BaseModel):
    alert_text: Optional[str] = "Database connection pool exhausted"
    logs: Optional[str] = "ERROR: Connection timeout at UserDAO.java:45"
    runbook: Optional[str] = ""

# --- Background Worker ---
async def process_incident(incident_id: str, alert: str, logs: str, runbook: str):
    """
    The core autonomous triage pipeline:
    1. AI Analysis
    2. Patch Generation
    3. GitHub Branch/Commit/PR
    4. Slack Notification
    """
    try:
        # Update status
        db.update_incident_status(incident_id, "Analyzing")
        
        # 1. AI Analysis
        analysis = agent.analyze_incident(alert, logs, runbook)
        analysis_json = json.dumps(analysis)
        
        # 2. Patch Generation (targeting demo_service.py for the demo)
        file_path = "backend/demo_service.py"
        try:
            with open(file_path, "r") as f:
                context = f.read()
        except FileNotFoundError:
            context = "def handler(): pass"
            
        fix_instruction = analysis.get("fix", analysis.get("required_fix", "Improve stability"))
        patch_code = agent.generate_patch(fix_instruction, file_path, context)
        
        # 3. GitHub Orchestration
        pr_url = ""
        pr_number = None
        
        if github.is_configured():
            try:
                base_sha = github.get_base_sha()
                branch_name = f"auto-fix-{incident_id}"
                github.create_branch(branch_name, base_sha)
                
                github.update_file(
                    path="backend/demo_service.py",
                    content=patch_code,
                    message=f"fix: AI generated patch for {incident_id}",
                    branch=branch_name
                )
                
                pr_info = agent.generate_pr_info(fix_instruction)
                pr_data = github.create_pull_request(
                    title=pr_info["title"],
                    body=pr_info["body"],
                    head_branch=branch_name
                )
                pr_url = pr_data["html_url"]
                pr_number = pr_data["number"]
            except Exception as ge:
                print(f"[GitHub] Error: {ge}")
                pr_url = "https://github.com/mock/pr/err"
        else:
            pr_url = "https://github.com/mock/pr/demo"
            pr_number = 123
            
        # 4. Update Database
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE incidents SET root_cause = ?, severity = ?, analysis_json = ?, pr_url = ?, pr_number = ?, fix_diff = ?, status = ?, updated_at = ? WHERE id = ?",
            (
                analysis.get("root_cause", "N/A"),
                analysis.get("severity", "High"),
                analysis_json,
                pr_url,
                pr_number,
                patch_code,
                "PR Opened",
                db.datetime.utcnow().isoformat() + "Z",
                incident_id
            )
        )
        conn.commit()
        conn.close()
        
        # 5. Notify Slack
        slack.send_approval_message(incident_id, alert, "backend-service", pr_url)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[Worker] Incident {incident_id} failed: {e}")
        db.update_incident_status(incident_id, "Failed")

# --- API Endpoints ---

@app.post("/simulate")
async def simulate_incident(background_tasks: BackgroundTasks, req: Optional[SimulateRequest] = None):
    if req is None:
        req = SimulateRequest()
    
    incident_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
    
    # Initial save
    db.create_incident(
        incident_id=incident_id,
        severity="Medium",
        status="Pending",
        service="backend-service",
        alert_text=req.alert_text,
        logs=req.logs,
        runbook=req.runbook,
        category="Backend"
    )
    
    # Start background triage
    background_tasks.add_task(process_incident, incident_id, req.alert_text, req.logs, req.runbook)
    
    # Return the newly created (pending) incident so frontend can show it immediately
    new_inc = db.get_incident(incident_id)
    return new_inc

@app.get("/api/incidents")
async def list_incidents():
    return db.get_all_incidents()

@app.post("/seed")
async def seed_demo_data(background_tasks: BackgroundTasks):
    """Seeds the database with demo incidents for presentation/testing."""
    demo_alerts = [
        {
            "alert_text": "Database connection pool exhausted on production-db-writer",
            "logs": "ERROR 2026-04-05 02:15:00 - ConnectionPoolError: All 50 connections in use. Queue depth: 127. Timeout after 30s at DBPool.java:89",
            "runbook": "If connection pool exhausted, check for connection leaks and increase pool size from 50 to 100",
        },
        {
            "alert_text": "Memory leak detected in auth-service pod",
            "logs": "WARN 2026-04-05 01:45:00 - HeapUsage at 94%. GC unable to reclaim memory. OOMKill imminent. auth-service-pod-7x9k2",
            "runbook": "Restart pod and check for unclosed streams in AuthHandler.java",
        },
        {
            "alert_text": "API Gateway 5xx spike - 15% error rate",
            "logs": "ERROR 2026-04-05 02:00:00 - UpstreamTimeout: payment-service did not respond within 5000ms. Circuit breaker OPEN. 3421 requests affected.",
            "runbook": "Check payment-service health. If circuit breaker open, wait for half-open retry or restart.",
        },
        {
            "alert_text": "Disk usage critical on log-aggregator node",
            "logs": "CRITICAL 2026-04-05 01:30:00 - /var/log partition at 97%. Estimated time to full: 2 hours. Log rotation failed: Permission denied.",
            "runbook": "Run emergency log cleanup script. Check logrotate config permissions.",
        },
        {
            "alert_text": "SSL certificate expiring in 48 hours for api.example.com",
            "logs": "WARN 2026-04-05 00:00:00 - Certificate for api.example.com expires 2026-04-07. Auto-renewal failed: ACME challenge verification timeout.",
            "runbook": "Manually trigger cert-manager renewal. Check DNS propagation for ACME challenge.",
        },
    ]

    created = []
    for demo in demo_alerts:
        incident_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
        db.create_incident(
            incident_id=incident_id,
            severity="High",
            status="Pending",
            service="demo-service",
            alert_text=demo["alert_text"],
            logs=demo["logs"],
            runbook=demo["runbook"],
            category="Backend",
        )
        new_inc = db.get_incident(incident_id)
        created.append(new_inc)
        # Kick off background AI triage for each
        background_tasks.add_task(
            process_incident, incident_id, demo["alert_text"], demo["logs"], demo["runbook"]
        )

    return {"success": True, "data": created}

@app.delete("/incidents/reset")
async def reset_incidents():
    """Clears all incidents from the database."""
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM incidents")
    conn.commit()
    conn.close()
    return {"success": True, "message": "All incidents cleared"}

@app.get("/api/incidents/stats")
async def get_stats():
    incidents = db.get_all_incidents()
    # Mocking stats format for frontend
    critical = len([i for i in incidents if i['severity'] == 'Critical'])
    high = len([i for i in incidents if i['severity'] == 'High'])
    open_inc = len([i for i in incidents if i['status'] != 'Merged' and i['status'] != 'Rejected'])
    
    return {
        "total": len(incidents),
        "open": open_inc,
        "critical": critical,
        "high": high,
        "resolved": len(incidents) - open_inc
    }

@app.get("/api/incidents/{incident_id}")
async def get_incident_detail(incident_id: str):
    incident = db.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@app.post("/api/incidents/{incident_id}/status")
async def update_status(incident_id: str, payload: dict):
    new_status = payload.get("status")
    db.update_incident_status(incident_id, new_status)
    updated = db.get_incident(incident_id)
    return updated

@app.post("/api/incidents/{incident_id}/merge")
async def merge_fix(incident_id: str):
    incident = db.get_incident(incident_id)
    if not incident or not incident["pr_number"]:
         raise HTTPException(status_code=400, detail="No PR associated with this incident")
    
    try:
        github.merge_pull_request(incident["pr_number"])
        db.update_incident_status(incident_id, "Merged")
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/incidents/{incident_id}/reject")
async def reject_fix(incident_id: str):
    incident = db.get_incident(incident_id)
    if not incident or not incident["pr_number"]:
         raise HTTPException(status_code=400, detail="No PR associated with this incident")
    
    try:
        github.close_pull_request(incident["pr_number"])
        db.update_incident_status(incident_id, "Rejected")
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Slack Endpoints ---

@app.post("/slack/triage")
async def slack_triage(request: Request, background_tasks: BackgroundTasks):
    body = await request.body()
    body_decoded = body.decode("utf-8")
    
    # Verifying signature
    if not slack.verify_slack_signature(dict(request.headers), body_decoded):
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    # Slack sends data as form-encoded
    from urllib.parse import parse_qs
    payload = parse_qs(body_decoded)
    
    text = payload.get("text", [""])[0]
    user_id = payload.get("user_id", [""])[0]
    
    incident_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
    db.create_incident(
        incident_id=incident_id,
        severity="High",
        status="Pending",
        service="slack-command",
        alert_text=f"Slack Triage: {text}",
        logs="Triggered by user " + user_id,
        runbook="",
        category="Manual"
    )
    
    background_tasks.add_task(process_incident, incident_id, text, "Slack triggered", "")
    
    return {
        "response_type": "ephemeral",
        "text": f"✅ Triage started for `{incident_id}`. Gemini is analyzing and writing a patch..."
    }

@app.post("/slack/actions")
async def slack_actions(request: Request):
    body = await request.body()
    body_decoded = body.decode("utf-8")
    
    # payload is inside "payload" key
    from urllib.parse import parse_qs
    form_data = parse_qs(body_decoded)
    payload_json = json.loads(form_data.get("payload", ["{}"])[0])
    
    actions = payload_json.get("actions", [])
    if not actions:
        return {"ok": True}
        
    action = actions[0]
    action_id = action.get("action_id")
    incident_id = action.get("value")
    response_url = payload_json.get("response_url")
    
    incident = db.get_incident(incident_id)
    if not incident:
        return {"text": "Incident not found."}

    if action_id == "approve_pr":
        github.merge_pull_request(incident["pr_number"])
        db.update_incident_status(incident_id, "Merged")
    elif action_id == "reject_pr":
        github.close_pull_request(incident["pr_number"])
        db.update_incident_status(incident_id, "Rejected")
        
    slack.update_message_on_action(response_url, incident_id, action_id)
    
    return {"ok": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

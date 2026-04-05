import hmac
import hashlib
import time
import os
import requests
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path, override=True)

SLACK_SIGNING_SECRET = os.getenv("SLACK_SIGNING_SECRET", "")
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL", "")

def verify_slack_signature(headers: dict, body: str) -> bool:
    """Verifies incoming Slack API requests using HMAC-SHA256."""
    if not SLACK_SIGNING_SECRET:
        # Bypass if no secret configured
        return True

    timestamp = headers.get("X-Slack-Request-Timestamp")
    signature = headers.get("X-Slack-Signature")

    if not timestamp or not signature:
        return False

    # Prevent replay attacks
    if abs(time.time() - int(timestamp)) > 60 * 5:
        return False

    sig_basestring = f"v0:{timestamp}:{body}"
    my_signature = "v0=" + hmac.new(
        SLACK_SIGNING_SECRET.encode("utf-8"),
        sig_basestring.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(my_signature, signature)

def send_approval_message(incident_id: str, alert_text: str, service: str, pr_url: str):
    """Sends a Slack Block Kit message with interactive buttons for PR approval."""
    if not SLACK_WEBHOOK_URL:
        print("[Slack] SLACK_WEBHOOK_URL not set, skipping message.")
        return False

    fallback_text = f"🚨 Incident {incident_id}: PR generated for {service}."

    blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"🚨 *Critical Incident Addressed:*\n*ID:* `{incident_id}`\n*Alert:* {alert_text}\n*Service:* `{service}`"
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"🤖 *Agent Status:* The AI Triage Copilot has analyzed the root cause, written a patch, and opened a Pull Request on GitHub.\n\n👉 <{pr_url}|Review Pull Request on GitHub>"
            }
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Approve & Merge"
                    },
                    "style": "primary",
                    "value": incident_id,
                    "action_id": "approve_pr"
                },
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Reject PR"
                    },
                    "style": "danger",
                    "value": incident_id,
                    "action_id": "reject_pr"
                }
            ]
        }
    ]

    try:
        response = requests.post(SLACK_WEBHOOK_URL, json={"text": fallback_text, "blocks": blocks})
        response.raise_for_status()
        return True
    except Exception as e:
        print(f"[Slack] Error sending approval message: {e}")
        return False

def update_message_on_action(response_url: str, incident_id: str, action_type: str):
    """Replaces the interactive message payload with a static confirmation text."""
    if not response_url:
        return
        
    status_text = "✅ *Approved and Merged*" if action_type == "approve_pr" else "❌ *Rejected and Closed*"
    
    blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"Incident `{incident_id}` was processed: {status_text} by an engineer."
            }
        }
    ]
    
    try:
        requests.post(response_url, json={"replace_original": "true", "blocks": blocks, "text": f"Incident {incident_id} processed."})
    except Exception as e:
        print(f"[Slack] Error updating message: {e}")

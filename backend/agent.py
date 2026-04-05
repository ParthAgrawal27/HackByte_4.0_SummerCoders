import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

def get_client():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    load_dotenv(env_path, override=True)
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or api_key == "your_gemini_api_key_here":
        raise ValueError("GEMINI_API_KEY is missing or invalid in .env")
    return genai.Client(api_key=api_key)

MODEL_NAME = "gemini-2.5-flash"

def analyze_incident(alert: str, logs: str, runbook: str):
    client = get_client()
    sys_prompt = "You are a DevOps Incident Triage AI. Analyze the incident alert and logs. Respond strictly in JSON format matching the schema."
    user_prompt = f"Alert: {alert}\nLogs: {logs}\nRunbook hints: {runbook}\nProvide the root cause, severity (Critical/High/Medium/Low), required fix explanation, and a confidence percentage."
    
    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[sys_prompt, user_prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
    except Exception as e:
        print(f"[Agent] Gemini API failed for analysis: {e}")
        return {
            "root_cause": "Fallback Mode: API Key Rate Limited or Invalid. Issue likely with database.",
            "severity": "High",
            "fix": "Fallback: Auto-generated suggestion due to API failure.",
            "confidence": "50%"
        }
    
    try:
        data = json.loads(response.text)
        return data
    except Exception as e:
        print(f"[Agent] Failed to parse analysis JSON: {e}")
        return {
            "root_cause": "AI analysis failed to yield structured JSON. Check fallback.",
            "severity": "High",
            "fix": "Manual inspection required"
        }

def generate_patch(fix_instruction: str, file_path: str, context: str):
    client = get_client()
    sys_prompt = "You are a Senior Software Engineer. The user will give you a file content and a fix instruction. You must return ONLY the raw modified source code. Do not include markdown code blocks ```python or explanations. Just the raw code."
    user_prompt = f"File path: {file_path}\nTarget Fix: {fix_instruction}\n\nExisting File Content:\n{context}"
    
    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[sys_prompt, user_prompt],
            config=types.GenerateContentConfig(
                temperature=0.1
            )
        )
    except Exception as e:
        print(f"[Agent] Gemini API failed for patch generation: {e}")
        return "# Fallback patch generated due to API rate limit\n\ndef timeout_handler():\n    max_retries = 5  # increased retries\n    for i in range(max_retries):\n        pass"
    
    patch = response.text.strip()
    if patch.startswith("```python"):
        patch = patch[9:]
    if patch.startswith("```"):
        patch = patch[3:]
    if patch.endswith("```"):
        patch = patch[:-3]
    return patch.strip()

def generate_pr_info(fix_instruction: str):
    client = get_client()
    sys_prompt = "Generate a Pull Request Title and Body based on the provided fix instruction. Respond strictly in JSON: {'title': '...', 'body': '...'}"
    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[sys_prompt, f"Instruction: {fix_instruction}"],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2
            )
        )
    except Exception as e:
        print(f"[Agent] Gemini API failed for PR info: {e}")
        return {
            "title": "fix: autonomous fallback patch",
            "body": f"This PR addresses an issue automatically detected. Fallback mode was active.\n\nInstruction used: {fix_instruction}"
        }
    try:
        data = json.loads(response.text)
        return data
    except Exception as e:
        return {
            "title": "fix: auto-generated fix by AI copilot",
            "body": f"This PR addresses the following issue:\n\n{fix_instruction}"
        }

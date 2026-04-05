import os
import requests
import base64
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path, override=True)

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_REPO_OWNER = os.getenv("GITHUB_REPO_OWNER", "")
GITHUB_REPO_NAME = os.getenv("GITHUB_REPO_NAME", "")

# Fallback checking .env in case user used old keys from Node
if not GITHUB_REPO_OWNER and os.getenv("GITHUB_REPO"):
    parts = os.getenv("GITHUB_REPO").split("/")
    if len(parts) == 2:
        GITHUB_REPO_OWNER, GITHUB_REPO_NAME = parts

HEADERS = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

def is_configured():
    return bool(GITHUB_TOKEN and GITHUB_REPO_OWNER and GITHUB_REPO_NAME)

def get_base_sha(branch="main"):
    """Gets the latest commit SHA on a branch."""
    if not is_configured(): return "mock_base_sha"
    url = f"https://api.github.com/repos/{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}/git/refs/heads/{branch}"
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()
    return response.json()["object"]["sha"]

def create_branch(new_branch: str, base_sha: str):
    """Creates a new branch from a base SHA."""
    if not is_configured(): return True
    url = f"https://api.github.com/repos/{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}/git/refs"
    payload = {
        "ref": f"refs/heads/{new_branch}",
        "sha": base_sha
    }
    response = requests.post(url, headers=HEADERS, json=payload)
    if response.status_code == 422: # branch exists
        return True
    response.raise_for_status()
    return True

def get_file_sha(path: str, branch: str):
    if not is_configured(): return None
    url = f"https://api.github.com/repos/{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}/contents/{path}?ref={branch}"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json()["sha"]
    return None

def update_file(path: str, content: str, message: str, branch: str):
    """Commits a file to the specified branch."""
    if not is_configured(): return True
    url = f"https://api.github.com/repos/{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}/contents/{path}"
    
    file_sha = get_file_sha(path, branch)
    
    encoded_content = base64.b64encode(content.encode("utf-8")).decode("utf-8")
    
    payload = {
        "message": message,
        "content": encoded_content,
        "branch": branch
    }
    if file_sha:
        payload["sha"] = file_sha
        
    response = requests.put(url, headers=HEADERS, json=payload)
    response.raise_for_status()
    return True

def create_pull_request(title: str, body: str, head_branch: str, base_branch="main"):
    """Opens a PR against the base branch."""
    if not is_configured(): return {"html_url": "https://github.com/mock/pr", "number": 999}
    url = f"https://api.github.com/repos/{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}/pulls"
    payload = {
        "title": title,
        "body": body,
        "head": head_branch,
        "base": base_branch
    }
    response = requests.post(url, headers=HEADERS, json=payload)
    response.raise_for_status()
    data = response.json()
    return {"html_url": data["html_url"], "number": data["number"]}

def merge_pull_request(pr_number: int):
    """Merges the PR."""
    if not is_configured(): return True
    url = f"https://api.github.com/repos/{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}/pulls/{pr_number}/merge"
    response = requests.put(url, headers=HEADERS)
    response.raise_for_status()
    return True

def close_pull_request(pr_number: int):
    """Closes the PR without merging."""
    if not is_configured(): return True
    url = f"https://api.github.com/repos/{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}/pulls/{pr_number}"
    payload = {"state": "closed"}
    response = requests.patch(url, headers=HEADERS, json=payload)
    response.raise_for_status()
    return True

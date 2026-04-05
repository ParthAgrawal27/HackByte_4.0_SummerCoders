import sqlite3
import json
from datetime import datetime
from pathlib import Path

DB_FILE = Path(__file__).parent / "incidents.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # incidents table maps exactly to what frontend expects, flattened out.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS incidents (
            id TEXT PRIMARY KEY,
            severity TEXT,
            status TEXT,
            service TEXT,
            alert_text TEXT,
            logs TEXT,
            runbook TEXT,
            category TEXT,
            root_cause TEXT,
            analysis_json TEXT,
            fix_diff TEXT,
            pr_url TEXT,
            pr_number INTEGER,
            created_at TEXT,
            updated_at TEXT
        )
    """)
    conn.commit()
    conn.close()

def _dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = _dict_factory
    return conn

def create_incident(incident_id, severity, status, service, alert_text, logs, runbook, category, root_cause="", analysis_json="{}", fix_diff="", pr_url="", pr_number=None):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"
    
    cursor.execute("""
        INSERT INTO incidents (id, severity, status, service, alert_text, logs, runbook, category, root_cause, analysis_json, fix_diff, pr_url, pr_number, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (incident_id, severity, status, service, alert_text, logs, runbook, category, root_cause, analysis_json, fix_diff, pr_url, pr_number, now, now))
    
    conn.commit()
    conn.close()

def update_incident_status(incident_id: str, new_status: str):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"
    
    cursor.execute("""
        UPDATE incidents Set status = ?, updated_at = ? WHERE id = ?
    """, (new_status, now, incident_id))
    
    conn.commit()
    conn.close()

def update_incident_pr(incident_id: str, pr_url: str, pr_number: int, fix_diff: str):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"
    
    cursor.execute("""
        UPDATE incidents Set pr_url = ?, pr_number = ?, fix_diff = ?, updated_at = ? WHERE id = ?
    """, (pr_url, pr_number, fix_diff, now, incident_id))
    
    conn.commit()
    conn.close()

def get_incident(incident_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,))
    row = cursor.fetchone()
    conn.close()
    return row

def get_all_incidents():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM incidents ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return rows

def get_incident_count() -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM incidents")
    row = cursor.fetchone()
    conn.close()
    return row['count']

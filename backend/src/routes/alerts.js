import express from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import { analyzeIncidentComprehensively } from '../services/ai.service.js';

const router = express.Router();

// Retrieve all alerts
router.get('/', (req, res) => {
  try {
    const alerts = db.prepare('SELECT * FROM alerts ORDER BY timestamp DESC').all();
    // Parse json for frontend if necessary, right now it's mostly text
    res.status(200).json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Database read failed' });
  }
});

// Retrieve specific alert
router.get('/:id', (req, res) => {
  try {
    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
    if (!alert) return res.status(404).json({ success: false, error: 'Not found' });
    res.status(200).json({ success: true, data: alert });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Database read failed' });
  }
});

// Ingest a new alert (Data Generator calls this)
router.post('/', async (req, res) => {
  try {
    const { source, raw_message } = req.body;
    if (!source || !raw_message) {
      return res.status(400).json({ success: false, error: 'Missing source or raw_message' });
    }

    const id = uuidv4();
    const timestamp = new Date().toISOString();

    // 1. Save pending alert to DB immediately
    const insertStmt = db.prepare(`
      INSERT INTO alerts (id, timestamp, source, raw_message, status)
      VALUES (?, ?, ?, ?, 'pending')
    `);
    insertStmt.run(id, timestamp, source, raw_message);

    // 2. Perform AI analysis asynchronously
    // In a real app we'd use a background queue, for a hackathon we just await it or don't block
    const analysis = await analyzeIncidentComprehensively(raw_message, source);

    // 3. Update the DB with analysis results
    const updateStmt = db.prepare(`
      UPDATE alerts
      ACT ai_severity = ?, ai_category = ?, ai_suggested_action = ?, ai_confidence_score = ?, status = 'analyzed'
      WHERE id = ?
    `.replace('ACT', 'SET'));

    const severityLevel = analysis.analysis.severity || 'SEV-3';
    const categoryName = analysis.analysis.category || 'Unknown';
    const actionStr = analysis.analysis.recommended_actions ? analysis.analysis.recommended_actions[0] : 'Triage needed';
    const conf = parseFloat(analysis.analysis.confidence || '80');

    updateStmt.run(severityLevel, categoryName, actionStr, conf, id);

    res.status(201).json({ success: true, data: { id, timestamp, status: 'analyzed' } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to process alert' });
  }
});

// Mark as resolved
router.post('/:id/resolve', (req, res) => {
  try {
    const info = db.prepare('UPDATE alerts SET status = ? WHERE id = ?').run('resolved', req.params.id);
    if (info.changes === 0) return res.status(404).json({ success: false, error: 'Alert not found' });
    res.status(200).json({ success: true, message: 'Alert resolved' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to resolve' });
  }
});

export default router;

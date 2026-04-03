import express from 'express';
import { analyzeRequestSchema } from '../validations/incident.js';
import { analyzeIncidentComprehensively } from '../services/ai.service.js';

const router = express.Router();

router.post('/analyze', async (req, res) => {
  try {
    // Step 1: Validate input
    const validatedData = analyzeRequestSchema.parse(req.body);
    const { alert, logs, runbook } = validatedData;

    // Step 2: Combined AI Analysis to circumvent API rate limits
    const fullAnalysis = await analyzeIncidentComprehensively(alert, logs, runbook);

    // Step 3: Return payload to frontend
    return res.status(200).json({
      success: true,
      data: fullAnalysis
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
    }
    
    console.error('API Error details:', error.message || error);
    return res.status(500).json({ success: false, error: 'Internal server error processing the incident.' });
  }
});

export default router;

import db from '../db.js';

/**
 * Query SQLite for similar historical incidents to provide "Agentic Memory".
 * Non-LLM programmatic agent.
 */
export const executeHistoryAgent = (source) => {
  try {
    // Find up to 3 most recent resolved incidents from the same source
    const history = db.prepare(`
      SELECT raw_message, ai_suggested_action, ai_severity 
      FROM alerts 
      WHERE source = ? AND status = 'resolved'
      ORDER BY timestamp DESC
      LIMIT 2
    `).all(source);

    if (!history || history.length === 0) {
      return "No historical context found for this source.";
    }

    return JSON.stringify(history, null, 2);
  } catch (err) {
    console.warn("History Agent failed to fetch database context", err);
    return "Historical context unavailable.";
  }
};

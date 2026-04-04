import { executeHistoryAgent } from '../agents/history.agent.js';
import { executeIngestionAgent } from '../agents/ingestion.agent.js';
import { executeClassificationAgent } from '../agents/classification.agent.js';
import { executeRootCauseAgent } from '../agents/root_cause.agent.js';
import { executeResolutionAgent } from '../agents/resolution.agent.js';
import { executeSummarizationAgent } from '../agents/summarization.agent.js';

export const analyzeIncidentComprehensively = async (alertRawText, sourceSystem) => {
  console.log(`[Pipeline] Starting Agentic Analysis for source: ${sourceSystem}`);

  // 1. History Agent (Context Retrieval)
  const historyContext = executeHistoryAgent(sourceSystem);
  console.log(`[Pipeline] History Context Retrieved`);

  // 2. Ingestion Agent (Cleanup)
  const cleanedSymptomText = await executeIngestionAgent(alertRawText);
  console.log(`[Pipeline] Ingestion Complete`);

  // 3. Classification Agent
  const classificationObj = await executeClassificationAgent(cleanedSymptomText, historyContext);
  console.log(`[Pipeline] Classification Complete: ${classificationObj.severity}`);

  // 4. Root Cause Agent
  const rootCauseAnalysis = await executeRootCauseAgent(cleanedSymptomText, classificationObj, historyContext);
  console.log(`[Pipeline] Root Cause Analysis Complete`);

  // 5. Resolution Agent
  const resolutionPlan = await executeResolutionAgent(rootCauseAnalysis, historyContext);
  console.log(`[Pipeline] Resolution Plan Complete`);

  // 6. Summarization Agent (Final Output Mapping)
  const pipelineState = {
    symptoms: cleanedSymptomText,
    classification: classificationObj,
    root_cause: rootCauseAnalysis,
    resolution: resolutionPlan
  };

  const finalSummaryObj = await executeSummarizationAgent(pipelineState);
  console.log(`[Pipeline] Summarization Complete`);

  // Construct the final expected payload schema for the DB and UI
  // Note: we dynamically pull strictly from the agents! Not hardcoding.
  return {
    analysis: {
      severity: classificationObj.severity || "SEV-3",
      category: classificationObj.category || "Unknown",
      affected_service: sourceSystem || "Unknown Service",
      confidence: finalSummaryObj.confidence ? `${Math.round(finalSummaryObj.confidence * 100)}` : "80", // Keep it string percentage format for UI compatibility based on previous spec, or keep it numeric depending on DB schema. Using number here because front-end multiplied by 1 earlier.
      root_cause: rootCauseAnalysis,
      recommended_actions: resolutionPlan.steps || [],
      summary: finalSummaryObj.summary || "Summary generation failure."
    }
  };
};

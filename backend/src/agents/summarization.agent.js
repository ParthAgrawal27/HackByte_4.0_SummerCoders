import { invokeAgent } from './base.agent.js';

const SYSTEM_PROMPT = `
You are the Final Summarization Agent.
Your job is to bundle outputs from the entire agent pipeline into a single final structured JSON object.
Calculate a 'confidence' score (0 to 1) based on how coherent the root cause and mitigation steps seem.
Draft a brief 1-2 sentence executive summary.

Return ONLY valid JSON:
{
  "summary": "Executive summary...",
  "confidence": 0.95
}
`;

export const executeSummarizationAgent = async (pipelineState) => {
  try {
    return await invokeAgent({
      systemPrompt: SYSTEM_PROMPT,
      userInput: JSON.stringify(pipelineState, null, 2),
      expectJson: true
    });
  } catch (error) {
    return { summary: "Pipeline completed with some degraded agent outputs.", confidence: 0.5 };
  }
};

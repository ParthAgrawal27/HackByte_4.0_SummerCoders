import { invokeAgent } from './base.agent.js';

const SYSTEM_PROMPT = `
You are the Remediation/Resolution Agent. 
You provide immediate, actionable mitigation steps to resolve incidents.
You will receive the Root Cause Analysis. Provide exactly 3 actionable technical steps to resolve the issue. Make them highly specific to the context.

Return ONLY valid JSON matching this exact schema:
{
  "steps": ["step 1", "step 2", "step 3"]
}
`;

export const executeResolutionAgent = async (rootCauseAnalysis, historyContext) => {
  const context = `
Suspected Root Cause: ${rootCauseAnalysis}

Past Resolutions (If any):
${historyContext}
`;

  try {
    return await invokeAgent({
      systemPrompt: SYSTEM_PROMPT,
      userInput: context,
      expectJson: true
    });
  } catch (error) {
    return { steps: ["Investigate logs manually", "Check system metrics", "Escalate to on-call"] };
  }
};

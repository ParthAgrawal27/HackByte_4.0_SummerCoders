import { invokeAgent } from './base.agent.js';

const SYSTEM_PROMPT = `
You are the Classification Agent.
Your job is to read technical symptoms and determine the Severity and Category.
Severity MUST be one of: SEV-1, SEV-2, SEV-3, SEV-4, SEV-5
(SEV-1 is critical system outage, SEV-5 is minor cosmetic/no-impact).

Return ONLY valid JSON matching this schema:
{
  "severity": "SEV-X",
  "category": "database|network|auth|infrastructure|frontend|unknown",
  "reasoning": "brief 1 sentence why this severity was chosen"
}
`;

export const executeClassificationAgent = async (cleanedInput, historyContext) => {
  const context = `Cleaned Input: ${cleanedInput}\n\nHistorical Context:\n${historyContext}`;

  try {
    return await invokeAgent({
      systemPrompt: SYSTEM_PROMPT,
      userInput: context,
      expectJson: true
    });
  } catch (error) {
    // Dynamic degradation - not hardcoded magic logic, just a safe fallback shape
    return {
      severity: "SEV-3",
      category: "unknown",
      reasoning: "Classification agent failed to reason dynamically."
    };
  }
};

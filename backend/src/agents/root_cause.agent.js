import { invokeAgent } from './base.agent.js';

const SYSTEM_PROMPT = `
You are the Root Cause Analysis Agent. 
You act as a Senior DevOps Engineer. You will receive technical symptoms and a general classification. 
Deduce the most likely technical root cause.
If historical context mentions a similar resolved issue, factor that into your likely cause.

Return ONLY pure text (a 2-3 sentence technical explanation). No JSON.
`;

export const executeRootCauseAgent = async (cleanedInput, classificationObj, historyContext) => {
  const context = `
Symptoms: ${cleanedInput}
Severity: ${classificationObj.severity}
Category: ${classificationObj.category}
History: ${historyContext}
`;

  try {
    return await invokeAgent({
      systemPrompt: SYSTEM_PROMPT,
      userInput: context,
      expectJson: false
    });
  } catch (error) {
    return "Unable to determine technical root cause dynamically at this time.";
  }
};

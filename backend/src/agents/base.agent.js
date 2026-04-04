import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_API_KEY');
// Using gemini-2.0-flash as the lightweight but powerful agent model
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

/**
 * Base invoker for all autonomous AI agents.
 * @param {string} systemPrompt The behavior/persona definition
 * @param {string} userInput The context or prior agent outputs
 * @param {boolean} expectJson Whether to parse the output as JSON
 */
export const invokeAgent = async ({ systemPrompt, userInput, expectJson = true }) => {
  const prompt = `System Instructions:\n${systemPrompt}\n\nInput Context:\n${userInput}`;

  try {
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    if (expectJson) {
      // Robust JSON extraction
      const cleaned = rawText.replace(/^```[a-z]*\s*\n/i, '').replace(/```\s*$/i, '').trim();
      try {
        return JSON.parse(cleaned);
      } catch (e) {
        console.error('Agent failed to return valid JSON:', rawText);
        throw new Error('Agent Output parsing error');
      }
    }

    return rawText;
  } catch (error) {
    console.warn(`[Agent Invocation Defaulted] Reason: ${error.message}`);
    throw error; // Let the pipeline orchestrator handle the graceful degradation
  }
};

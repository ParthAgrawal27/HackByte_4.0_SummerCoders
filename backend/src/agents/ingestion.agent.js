import { invokeAgent } from './base.agent.js';

const SYSTEM_PROMPT = `
You are the Ingestion & Normalization Agent.
Your job is to read raw, unstructured machine alerts or user tickets and extract ONLY the absolute technical facts.
Ignore boilerplate templates, timestamps if irrelevant, and greetings.
Output a clean, concise markdown list of technical symptoms.

Return format: pure text (NO Markdown JSON block).
`;

export const executeIngestionAgent = async (rawInput) => {
  try {
    return await invokeAgent({
      systemPrompt: SYSTEM_PROMPT,
      userInput: rawInput,
      expectJson: false
    });
  } catch (error) {
    return "[Ingestion Failed] Using raw payload: " + rawInput;
  }
};

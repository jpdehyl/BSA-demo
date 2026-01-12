/**
 * AI Response parsing and processing helpers
 * Shared utilities for working with Gemini AI responses
 */

import pRetry, { type Options as PRetryOptions } from "p-retry";

/**
 * Gender-specific language guidance for coaching messages
 */
export const GENDER_LANGUAGE_GUIDANCE: Record<string, string> = {
  male: `Use casual masculine language like "dude", "man", "bro" naturally in your message.`,
  female: `Use supportive language but AVOID masculine terms like "dude", "man", "bro". Instead use phrases like "you crushed it", "that's what I'm talking about", "keep pushing".`,
  neutral: `Use gender-neutral encouraging language. Avoid "dude", "man", "bro". Use phrases like "you crushed it", "that's what I'm talking about", "keep pushing".`,
};

/**
 * Get language guidance based on gender
 */
export function getGenderLanguageGuidance(gender?: string): string {
  if (gender === "male") return GENDER_LANGUAGE_GUIDANCE.male;
  if (gender === "female") return GENDER_LANGUAGE_GUIDANCE.female;
  return GENDER_LANGUAGE_GUIDANCE.neutral;
}

/**
 * Gemini API response structure
 */
interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

/**
 * Extract text content from a Gemini API response
 * Handles the nested candidate/content/parts structure
 */
export function extractTextFromGeminiResponse(response: GeminiResponse): string {
  let text = "";

  if (response.candidates && response.candidates.length > 0) {
    const candidate = response.candidates[0];
    if (candidate.content && candidate.content.parts) {
      for (const part of candidate.content.parts) {
        if (part.text) {
          text += part.text;
        }
      }
    }
  }

  return text;
}

/**
 * Extract JSON object from a text response
 * Finds the first JSON object in the text using regex
 */
export function extractJsonFromText<T = unknown>(text: string): T {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON from response");
  }
  return JSON.parse(jsonMatch[0]) as T;
}

/**
 * Validate that a parsed object has all required fields
 */
export function validateRequiredFields(
  obj: Record<string, unknown>,
  fields: string[],
  context: string = "response"
): void {
  const missing = fields.filter((field) => !(field in obj) || obj[field] === undefined);
  if (missing.length > 0) {
    throw new Error(`${context} missing required fields: ${missing.join(", ")}`);
  }
}

/**
 * Ensure a value is an array (wrap single values)
 */
export function ensureArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

/**
 * Default retry options for AI operations
 */
export const DEFAULT_AI_RETRY_OPTIONS: PRetryOptions = {
  retries: 3,
  minTimeout: 1000,
  maxTimeout: 10000,
};

/**
 * Create a retry wrapper with logging
 */
export function createRetryWrapper(operationName: string): PRetryOptions {
  return {
    ...DEFAULT_AI_RETRY_OPTIONS,
    onFailedAttempt: (error) => {
      console.log(
        `${operationName} attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
      );
    },
  };
}

/**
 * Execute an AI operation with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  return pRetry(operation, createRetryWrapper(operationName));
}

/**
 * Parse and validate a Gemini response as JSON
 * Combines text extraction, JSON parsing, and field validation
 */
export function parseGeminiJsonResponse<T extends Record<string, unknown>>(
  response: GeminiResponse,
  requiredFields: string[],
  context: string = "AI response"
): T {
  const text = extractTextFromGeminiResponse(response);

  if (!text) {
    throw new Error(`Empty ${context} received from Gemini`);
  }

  const parsed = extractJsonFromText<T>(text);
  validateRequiredFields(parsed, requiredFields, context);

  return parsed;
}

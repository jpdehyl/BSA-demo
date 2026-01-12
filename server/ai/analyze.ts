import { GoogleGenAI } from "@google/genai";
import { getPersonaContent, getKnowledgebaseContent, getDailySummaryCriteria } from "../google/driveClient";
import {
  getGenderLanguageGuidance,
  extractTextFromGeminiResponse,
  extractJsonFromText,
  ensureArray,
  withRetry,
} from "./helpers/aiResponseHelpers";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export interface AnalysisResult {
  managerSummary: string[];
  coachingMessage: string;
  strength: string;
  improvement: string;
}

interface TranscriptAnalysisResponse {
  managerSummary: string | string[];
  coachingMessage: string;
}

/**
 * Build the transcript analysis prompt
 */
function buildTranscriptAnalysisPrompt(
  transcript: string,
  personaContent: string,
  knowledgeBase: string,
  sdrFirstName: string,
  sdrGender?: string
): string {
  const languageGuidance = getGenderLanguageGuidance(sdrGender);

  return `${personaContent}

## GENDER-SPECIFIC LANGUAGE GUIDANCE:
${languageGuidance}

## Knowledge Base (Company Sales Guidelines & Evaluation Criteria):
${knowledgeBase}

## Sales Call Transcript:
${transcript}

## Task:
Analyze this call and provide TWO things:

1. **Manager Summary** (3-5 bullet points for internal tracking - NOT sent to SDR):
   - Key observations tied to knowledge base criteria
   - Specific metrics noted (talk ratio, objection handling, etc.)
   - Areas for manager follow-up

2. **Coaching Message for ${sdrFirstName}** (sent directly to the SDR):
   - Start with "Hey ${sdrFirstName},"
   - First: Find a KEY MOMENT from the call where they did something great. Quote it. Celebrate it.
   - Second: Give ONE improvement area with a specific script example they can use next time
   - End with encouragement that connects to their hustle and success
   - Sign off with "— Your Lead Intel Coach"

## Response Format (JSON only - NO HTML TAGS):
{
  "managerSummary": ["bullet 1", "bullet 2", "bullet 3"],
  "coachingMessage": "Hey ${sdrFirstName},\\n\\n[Celebrate a specific moment - quote from the call]\\n\\n[One improvement with script example]\\n\\n[Encouraging close about their hustle]\\n\\n— Your Lead Intel Coach"
}

CRITICAL RULES:
- Output ONLY plain text in the coachingMessage - NO HTML tags
- Use \\n for line breaks
- Be SPECIFIC - reference actual quotes and moments from the transcript
- Sound warm, real, encouraging, connected`;
}

export async function analyzeTranscript(
  transcript: string,
  sdrFirstName?: string,
  sdrGender?: string,
): Promise<AnalysisResult> {
  const [personaContent, knowledgeBase] = await Promise.all([
    getPersonaContent(),
    getKnowledgebaseContent(),
  ]);

  console.log(`[Analyze] Fetched persona (${personaContent.length} chars) and knowledge base (${knowledgeBase.length} chars)`);

  const nameToUse = sdrFirstName || "there";

  const analyze = async (): Promise<AnalysisResult> => {
    const prompt = buildTranscriptAnalysisPrompt(
      transcript,
      personaContent,
      knowledgeBase,
      nameToUse,
      sdrGender
    );

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = extractTextFromGeminiResponse(response);
    if (!text) {
      throw new Error("Empty analysis received from Gemini");
    }

    const parsed = extractJsonFromText<TranscriptAnalysisResponse>(text);

    if (!parsed.managerSummary || !parsed.coachingMessage) {
      throw new Error("Analysis missing required fields");
    }

    const managerSummary = ensureArray(parsed.managerSummary);

    return {
      managerSummary,
      coachingMessage: parsed.coachingMessage,
      strength: JSON.stringify(managerSummary),
      improvement: parsed.coachingMessage,
    };
  };

  return withRetry(analyze, "Analysis");
}

export interface DailySummaryAnalysis {
  keyMoments: string[];
  keyInsights: string[];
  overallPerformance: string;
}

interface DailySummaryResponse {
  keyMoments: string | string[];
  keyInsights: string | string[];
  overallPerformance: string;
}

/**
 * Build the daily summary analysis prompt
 */
function buildDailySummaryPrompt(
  transcript: string,
  sdrName: string,
  callAction: string,
  evaluationCriteria: string
): string {
  return `You are analyzing a sales call for a manager's daily summary. Use the evaluation criteria provided to assess the call.

## Evaluation Criteria (from company guidelines):
${evaluationCriteria}

## Sales Call Information:
- SDR Name: ${sdrName}
- Call Type: ${callAction}

## Transcript:
${transcript}

## Task:
Analyze this call based on the evaluation criteria and provide a summary for the manager. Focus on:
1. **Key Moments**: 2-3 specific moments from the call that stand out (positive or concerning)
2. **Key Insights**: 2-3 actionable insights based on the evaluation criteria
3. **Overall Performance**: One sentence summary of the SDR's performance on this call

## Response Format (JSON only):
{
  "keyMoments": [
    "Moment 1 - brief description of what happened and why it matters",
    "Moment 2 - brief description"
  ],
  "keyInsights": [
    "Insight 1 - actionable observation",
    "Insight 2 - actionable observation"
  ],
  "overallPerformance": "One sentence assessment of this call"
}

CRITICAL RULES:
- Be specific - reference actual quotes or behaviors from the transcript
- Tie observations to the evaluation criteria
- Keep it concise - managers need quick summaries
- Be objective - note both strengths and areas needing attention`;
}

export async function analyzeForDailySummary(
  transcript: string,
  sdrName: string,
  callAction: string,
): Promise<DailySummaryAnalysis> {
  const evaluationCriteria = await getDailySummaryCriteria();
  console.log(`[DailySummary] Fetched evaluation criteria (${evaluationCriteria.length} chars)`);

  const analyze = async (): Promise<DailySummaryAnalysis> => {
    const prompt = buildDailySummaryPrompt(transcript, sdrName, callAction, evaluationCriteria);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = extractTextFromGeminiResponse(response);
    if (!text) {
      throw new Error("Empty daily summary analysis received from Gemini");
    }

    const parsed = extractJsonFromText<DailySummaryResponse>(text);

    if (!parsed.keyMoments || !parsed.keyInsights || !parsed.overallPerformance) {
      throw new Error("Daily summary analysis missing required fields");
    }

    return {
      keyMoments: ensureArray(parsed.keyMoments),
      keyInsights: ensureArray(parsed.keyInsights),
      overallPerformance: parsed.overallPerformance,
    };
  };

  return withRetry(analyze, "Daily summary analysis");
}

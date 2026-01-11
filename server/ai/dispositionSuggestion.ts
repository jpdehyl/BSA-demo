import { GoogleGenAI } from "@google/genai";
import type { CallSession } from '@shared/schema';

/**
 * Get configured AI client (Gemini)
 */
function getAiClient() {
  const directKey = process.env.GEMINI_API_KEY;
  if (directKey) {
    return new GoogleGenAI({ apiKey: directKey });
  }

  const replitKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  const replitBase = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  if (replitKey && replitBase) {
    return new GoogleGenAI({
      apiKey: replitKey,
      httpOptions: { baseUrl: replitBase }
    });
  }

  throw new Error("No Gemini API key configured");
}

/**
 * Analyzes call metrics and transcript to suggest appropriate disposition
 * Combines rule-based logic with AI analysis for accurate suggestions
 */
export async function suggestCallDisposition(
  callSession: Pick<CallSession, 'duration' | 'transcriptText' | 'status'>
): Promise<{
  suggestedDisposition: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}> {
  const duration = callSession.duration || 0;
  const transcript = callSession.transcriptText || '';
  const status = callSession.status;

  // Rule-based suggestions for clear-cut cases (high confidence)

  // Very short calls are almost always no-answer
  if (duration < 10) {
    return {
      suggestedDisposition: 'no-answer',
      confidence: 'high',
      reason: 'Call duration under 10 seconds indicates no answer',
    };
  }

  // Short calls 10-30 seconds are likely voicemail or no-answer
  if (duration >= 10 && duration < 30) {
    return {
      suggestedDisposition: 'voicemail',
      confidence: 'medium',
      reason: 'Short call duration (10-30s) typically indicates voicemail',
    };
  }

  // If we have a transcript, use AI to analyze
  if (transcript && transcript.trim().length > 50) {
    try {
      const ai = getAiClient();

      const prompt = `You are analyzing a sales call transcript to determine the call outcome.

Call Duration: ${duration} seconds
Transcript:
${transcript}

Based on the transcript, determine the most appropriate call disposition from these options:
- "connected": Had a conversation with the prospect
- "voicemail": Left a voicemail message
- "no-answer": No one answered
- "busy": Line was busy
- "callback-scheduled": Prospect agreed to specific callback time
- "not-interested": Prospect explicitly declined interest
- "qualified": Prospect showed interest and meets qualification criteria
- "meeting-booked": Successfully scheduled a meeting/demo

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "disposition": "one of the values above",
  "confidence": "high" or "medium" or "low",
  "reason": "brief explanation in one sentence"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });

      const candidate = response.candidates?.[0];
      const textPart = candidate?.content?.parts?.find(
        (part: { text?: string }) => part.text
      );
      const responseText = textPart?.text?.trim() || '';

      // Remove markdown code blocks if present
      const cleanedText = responseText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      const aiSuggestion = JSON.parse(cleanedText);

      return {
        suggestedDisposition: aiSuggestion.disposition,
        confidence: aiSuggestion.confidence,
        reason: aiSuggestion.reason,
      };
    } catch (error) {
      console.error('[DispositionAI] Failed to get AI suggestion:', error);
      // Fallback to rule-based for longer calls with transcript
      return {
        suggestedDisposition: 'connected',
        confidence: 'medium',
        reason: `Call lasted ${duration}s with conversation (AI analysis unavailable)`,
      };
    }
  }

  // Longer calls without transcript - assume connected
  if (duration >= 30) {
    return {
      suggestedDisposition: 'connected',
      confidence: 'medium',
      reason: `Call duration ${duration}s suggests conversation occurred`,
    };
  }

  // Default fallback
  return {
    suggestedDisposition: 'no-answer',
    confidence: 'low',
    reason: 'Unable to determine disposition from available data',
  };
}

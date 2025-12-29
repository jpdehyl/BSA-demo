import { GoogleGenAI } from "@google/genai";
import { getKnowledgebaseContent, getEvaluationCriteria } from "../google/driveClient";
import { storage } from "../storage";
import type { CallSession, Sdr } from "@shared/schema";

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

export interface ManagerAnalysisScores {
  opening: number;
  discovery: number;
  activeListening: number;
  objectionHandling: number;
  valueProposition: number;
  closing: number;
  compliance: number;
}

export interface KeyObservation {
  type: "strength" | "concern" | "neutral";
  observation: string;
  quote?: string;
}

export interface Recommendation {
  focus: string;
  action: string;
  priority: "high" | "medium" | "low";
}

export interface ManagerNotesData {
  useAsTrainingExample: boolean;
  trainingExampleType: "positive" | "negative" | null;
  followUpRequired: boolean;
  followUpAction: string | null;
  escalationRequired: boolean;
  escalationReason: string | null;
}

export interface ManagerAnalysisResult {
  overallScore: number;
  scores: ManagerAnalysisScores;
  keyObservations: KeyObservation[];
  criteriaComparison: {
    met: string[];
    exceeded: string[];
    missed: string[];
  };
  recommendations: Recommendation[];
  managerNotes: ManagerNotesData;
  summary: string;
}

export async function analyzeCallForManager(
  callSession: CallSession,
  sdr: Sdr
): Promise<ManagerAnalysisResult> {
  const ai = getAiClient();
  
  const evaluationCriteria = await getEvaluationCriteria();
  
  const callDate = callSession.startedAt ? new Date(callSession.startedAt).toLocaleDateString() : "Unknown";
  const duration = callSession.duration ? `${Math.floor(callSession.duration / 60)}:${(callSession.duration % 60).toString().padStart(2, '0')}` : "Not specified";
  const callType = callSession.direction === "outbound" ? "Outbound Cold Call" : "Inbound Call";
  
  const prompt = `You are a sales performance analyst evaluating a recorded sales call for management review.

## Evaluation Criteria (Company Standards):
${evaluationCriteria}

## Call Information:
- SDR Name: ${sdr.name}
- SDR ID: ${sdr.id}
- Call Date: ${callDate}
- Call Type: ${callType}
- Duration: ${duration}

## Call Transcript:
${callSession.transcriptText || "No transcript available"}

## Task:
Provide a comprehensive analysis for management review. This analysis will be stored for performance tracking and trend analysis.

### 1. Performance Scorecard (0-100 scale for each):
Rate each category based on the evaluation criteria document:
- **Opening/Introduction**: Did they follow the approved opening script?
- **Discovery Questions**: Quality and depth of questions asked
- **Active Listening**: Evidence of hearing and responding to prospect
- **Objection Handling**: How well did they address concerns?
- **Value Proposition**: Did they connect solutions to prospect needs?
- **Closing/Next Steps**: Did they secure a commitment or clear next step?
- **Compliance**: Adherence to required disclosures and protocols

### 2. Key Observations:
- 3-5 specific moments from the call (with quotes where possible)
- What worked well
- What needs improvement
- Any red flags or concerns

### 3. Comparison to Standards:
- How does this call measure against the evaluation criteria?
- Which criteria were met/exceeded/missed?

### 4. Actionable Recommendations:
- 2-3 specific things this SDR should work on
- Suggested training or coaching focus areas
- Scripts or techniques to practice

### 5. Manager Notes:
- Should this call be used as a training example (positive or negative)?
- Follow-up actions needed?
- Escalation required?

## Response Format (JSON only):
{
  "overallScore": 78,
  "scores": {
    "opening": 85,
    "discovery": 72,
    "activeListening": 80,
    "objectionHandling": 65,
    "valueProposition": 75,
    "closing": 70,
    "compliance": 95
  },
  "keyObservations": [
    {"type": "strength", "observation": "Strong rapport building", "quote": "actual quote from transcript"},
    {"type": "concern", "observation": "Missed opportunity to probe deeper on budget", "quote": "prospect said X, SDR moved on"},
    {"type": "neutral", "observation": "Average pacing, could slow down during value prop"}
  ],
  "criteriaComparison": {
    "met": ["Opening script followed", "Compliance disclosures complete"],
    "exceeded": ["Rapport building exceptional"],
    "missed": ["Did not ask all required discovery questions", "No trial close attempted"]
  },
  "recommendations": [
    {"focus": "Discovery depth", "action": "Practice the 'tell me more' technique", "priority": "high"},
    {"focus": "Objection handling", "action": "Review the 'feel, felt, found' framework", "priority": "medium"}
  ],
  "managerNotes": {
    "useAsTrainingExample": false,
    "trainingExampleType": null,
    "followUpRequired": true,
    "followUpAction": "1:1 coaching on discovery questions",
    "escalationRequired": false,
    "escalationReason": null
  },
  "summary": "One paragraph executive summary of this call's performance"
}

CRITICAL RULES:
- Be objective and fair - cite specific evidence from the transcript
- Scores should reflect the evaluation criteria, not general impressions
- Recommendations must be actionable and specific
- Flag any compliance issues immediately
- Output ONLY valid JSON`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }]
  });
  
  const candidate = response.candidates?.[0];
  const textPart = candidate?.content?.parts?.find(
    (part: { text?: string }) => part.text
  );
  const text = textPart?.text?.trim() || "";
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("[ManagerAnalysis] Failed to parse JSON response:", text);
    throw new Error("Failed to parse analysis response");
  }
  
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      overallScore: parsed.overallScore || 0,
      scores: {
        opening: parsed.scores?.opening || 0,
        discovery: parsed.scores?.discovery || 0,
        activeListening: parsed.scores?.activeListening || 0,
        objectionHandling: parsed.scores?.objectionHandling || 0,
        valueProposition: parsed.scores?.valueProposition || 0,
        closing: parsed.scores?.closing || 0,
        compliance: parsed.scores?.compliance || 0
      },
      keyObservations: parsed.keyObservations || [],
      criteriaComparison: parsed.criteriaComparison || { met: [], exceeded: [], missed: [] },
      recommendations: parsed.recommendations || [],
      managerNotes: parsed.managerNotes || {
        useAsTrainingExample: false,
        trainingExampleType: null,
        followUpRequired: false,
        followUpAction: null,
        escalationRequired: false,
        escalationReason: null
      },
      summary: parsed.summary || ""
    };
  } catch (error) {
    console.error("[ManagerAnalysis] JSON parse error:", error);
    throw new Error("Failed to parse analysis JSON");
  }
}

export async function saveManagerAnalysis(
  callSession: CallSession,
  sdr: Sdr,
  analysis: ManagerAnalysisResult
): Promise<void> {
  await storage.createManagerCallAnalysis({
    callSessionId: callSession.id,
    sdrId: sdr.id,
    sdrName: sdr.name,
    callDate: callSession.startedAt || new Date(),
    callType: callSession.direction === "outbound" ? "Outbound Cold Call" : "Inbound Call",
    durationSeconds: callSession.duration || null,
    overallScore: analysis.overallScore,
    openingScore: analysis.scores.opening,
    discoveryScore: analysis.scores.discovery,
    listeningScore: analysis.scores.activeListening,
    objectionScore: analysis.scores.objectionHandling,
    valuePropositionScore: analysis.scores.valueProposition,
    closingScore: analysis.scores.closing,
    complianceScore: analysis.scores.compliance,
    keyObservations: JSON.stringify(analysis.keyObservations),
    criteriaComparison: JSON.stringify(analysis.criteriaComparison),
    recommendations: JSON.stringify(analysis.recommendations),
    managerNotes: JSON.stringify(analysis.managerNotes),
    summary: analysis.summary,
    fullAnalysis: JSON.stringify(analysis),
    transcript: callSession.transcriptText || null,
    analyzedBy: "system"
  });
}

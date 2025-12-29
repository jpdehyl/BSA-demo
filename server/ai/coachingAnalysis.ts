import { GoogleGenAI } from "@google/genai";
import { getPersonaContent, getKnowledgebaseContent } from "../google/driveClient";
import { sendFeedbackEmail, formatCallDate } from "../google/gmailClient";
import { storage } from "../storage";
import type { CallSession, Sdr, User } from "@shared/schema";

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

interface CoachingAnalysisResult {
  managerSummary: string[];
  coachingMessage: string;
}

function getGenderGuidance(gender: string): string {
  if (gender === "male") {
    return `Use casual masculine language like "dude", "man", "bro" naturally in your message.`;
  } else if (gender === "female") {
    return `Use supportive language but AVOID masculine terms like "dude", "man", "bro". Instead use phrases like "you crushed it", "that's what I'm talking about", "keep pushing".`;
  }
  return `Use gender-neutral encouraging language. Avoid "dude", "man", "bro". Use phrases like "you crushed it", "that's what I'm talking about", "keep pushing".`;
}

export async function analyzeCallForCoaching(
  transcript: string,
  sdrFirstName: string,
  sdrGender: string = "neutral"
): Promise<CoachingAnalysisResult> {
  const ai = getAiClient();
  
  const [personaContent, knowledgeBase] = await Promise.all([
    getPersonaContent(),
    getKnowledgebaseContent()
  ]);
  
  const languageGuidance = getGenderGuidance(sdrGender);
  
  const prompt = `${personaContent}

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
   - First: Find a KEY MOMENT from the call where they did something great. Quote it. Celebrate it like Marc would.
   - Second: Give ONE improvement area with a specific script example they can use next time
   - End with encouragement that connects to their hustle and success
   - Sign off with "— Your GameTime.ai Coach"

## Response Format (JSON only - NO HTML TAGS):
{
  "managerSummary": ["bullet 1", "bullet 2", "bullet 3"],
  "coachingMessage": "Hey ${sdrFirstName},\\n\\n[Celebrate a specific moment - quote from the call]\\n\\n[One improvement with script example]\\n\\n[Encouraging close about their hustle]\\n\\n— Your GameTime.ai Coach"
}

CRITICAL RULES:
- Output ONLY plain text in the coachingMessage - NO HTML tags, NO <p>, NO <div>, NO style attributes
- Use \\n for line breaks, NOT HTML tags
- Do NOT include any formatting like "margin:", "padding:", or any CSS
- Be SPECIFIC - reference actual quotes and moments
- Sound like Marc - warm, real, encouraging, connected`;

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
    console.error("[Coaching] Failed to parse JSON response:", text);
    return {
      managerSummary: ["Analysis could not be completed"],
      coachingMessage: `Hey ${sdrFirstName},\n\nGreat effort on that call! Keep pushing and stay focused on connecting with your prospects.\n\n— Your GameTime.ai Coach`
    };
  }
  
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      managerSummary: parsed.managerSummary || [],
      coachingMessage: parsed.coachingMessage || ""
    };
  } catch (error) {
    console.error("[Coaching] JSON parse error:", error);
    return {
      managerSummary: ["Analysis could not be completed"],
      coachingMessage: `Hey ${sdrFirstName},\n\nGreat effort on that call! Keep pushing and stay focused on connecting with your prospects.\n\n— Your GameTime.ai Coach`
    };
  }
}

function formatCoachingEmailHtml(coachingMessage: string, sdrName: string, callDate: Date): string {
  const dateStr = formatCallDate(callDate, "full");
  
  const formattedMessage = coachingMessage
    .replace(/\\n/g, '\n')
    .replace(/\n/g, '<br>');

  return `
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 20px; }
          .container { max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .header { background-color: #1f2937; color: #ffffff; padding: 24px 32px; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
          .header .meta { color: #9ca3af; font-size: 14px; margin-top: 8px; }
          .content { padding: 32px; }
          .coaching-message { color: #374151; font-size: 15px; line-height: 1.7; white-space: pre-wrap; }
          .footer { padding: 20px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
          .footer p { margin: 0; font-size: 12px; color: #9ca3af; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Call Coaching - ${dateStr}</h1>
            <div class="meta">${sdrName}</div>
          </div>
          
          <div class="content">
            <div class="coaching-message">
              ${formattedMessage}
            </div>
          </div>
          
          <div class="footer">
            <p>Powered by Lead Intel</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function processPostCallCoaching(callSession: CallSession): Promise<void> {
  console.log(`[Coaching] Processing post-call coaching for call ${callSession.id}`);
  
  if (!callSession.transcriptText || callSession.transcriptText.trim().length < 50) {
    console.log("[Coaching] Skipping - transcript too short or missing");
    return;
  }
  
  if (!callSession.userId) {
    console.log("[Coaching] Skipping - no user associated with call");
    return;
  }
  
  const user = await storage.getUser(callSession.userId);
  if (!user) {
    console.log("[Coaching] Skipping - user not found");
    return;
  }
  
  let sdr: Sdr | undefined = undefined;
  if (user.sdrId) {
    sdr = await storage.getSdr(user.sdrId);
  }
  
  const sdrFirstName = (sdr?.name || user.name || "there").split(" ")[0];
  const sdrGender = sdr?.gender || "neutral";
  const sdrEmail = sdr?.email || user.email;
  const managerEmail = sdr?.managerEmail;
  
  console.log(`[Coaching] Analyzing call for ${sdrFirstName} (${sdrGender})`);
  
  try {
    const analysis = await analyzeCallForCoaching(
      callSession.transcriptText,
      sdrFirstName,
      sdrGender
    );
    
    await storage.updateCallSessionByCallSid(callSession.callSid!, {
      managerSummary: JSON.stringify(analysis.managerSummary),
      coachingNotes: analysis.coachingMessage
    });
    
    console.log(`[Coaching] Saved analysis. Manager bullets: ${analysis.managerSummary.length}`);
    
    const callDate = callSession.startedAt ? new Date(callSession.startedAt) : new Date();
    const emailHtml = formatCoachingEmailHtml(
      analysis.coachingMessage,
      sdr?.name || user.name || "Team Member",
      callDate
    );
    
    const shortDate = formatCallDate(callDate, "short");
    
    await sendFeedbackEmail({
      to: sdrEmail,
      cc: managerEmail || undefined,
      subject: `Call Coaching - ${shortDate}`,
      body: emailHtml
    });
    
    console.log(`[Coaching] Email sent to ${sdrEmail}${managerEmail ? ` (cc: ${managerEmail})` : ""}`);
    
  } catch (error) {
    console.error("[Coaching] Failed to process post-call coaching:", error);
  }
}

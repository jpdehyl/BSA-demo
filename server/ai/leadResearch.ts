import { GoogleGenAI } from "@google/genai";
import type { Lead, InsertResearchPacket } from "@shared/schema";
import { researchLeadOnX, formatXIntel } from "./xResearch";
import { researchContactLinkedIn, formatLinkedInIntel } from "./linkedInResearch";
import { gatherCompanyHardIntel, formatCompanyHardIntel } from "./companyHardIntel";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const HAWK_RIDGE_CONTEXT = `
Hawk Ridge Systems is a leading provider of 3D design, manufacturing, and product data management solutions.

PRIMARY OFFERINGS:
1. SOLIDWORKS - 3D CAD design software for mechanical engineering
2. CAMWorks - Computer-aided manufacturing for CNC machining
3. 3D Printing / Additive Manufacturing - Stratasys, Desktop Metal, Markforged
4. Data Management - SOLIDWORKS PDM, 3DEXPERIENCE
5. Simulation - SOLIDWORKS Simulation, Flow Analysis
6. Technical Support & Training

TARGET INDUSTRIES:
- Aerospace & Defense
- Medical Devices
- Industrial Machinery
- Consumer Products
- Automotive
- Electronics

IDEAL FIT SIGNALS:
- Uses legacy CAD (AutoCAD 2D, Pro/E, Inventor) - ready to upgrade
- Growing engineering team - need collaboration tools
- Manufacturing in-house or planning to - need CAM software
- Rapid prototyping needs - 3D printing opportunity
- Compliance requirements (FDA, AS9100) - need PDM
- Design bottlenecks - simulation and optimization
`;

export interface LeadDossier {
  personalBackground: string;
  commonGround: string;
  companyContext: string;
  painSignals: string;
  techStackIntel: string;
  buyingTriggers: string;
  hawkRidgeFit: string;
  fitScore: number;
  fitScoreBreakdown: string;
  priority: "hot" | "warm" | "cool" | "cold";
  talkTrack: string;
  openingLine: string;
  discoveryQuestions: string[];
  objectionHandles: Array<{ objection: string; response: string }>;
  theAsk: string;
  sources: string;
  linkedInUrl?: string;
  phoneNumber?: string;
  jobTitle?: string;
  companyWebsite?: string;
}

export async function generateLeadDossier(lead: Lead): Promise<LeadDossier> {
  const prompt = `You are an expert B2B sales intelligence analyst preparing a comprehensive dossier for a sales call.

${HAWK_RIDGE_CONTEXT}

LEAD INFORMATION:
- Contact Name: ${lead.contactName}
- Job Title: ${lead.contactTitle || "Unknown"}
- Company: ${lead.companyName}
- Industry: ${lead.companyIndustry || "Unknown"}
- Company Size: ${lead.companySize || "Unknown"}
- Website: ${lead.companyWebsite || "Unknown"}
- LinkedIn: ${lead.contactLinkedIn || "Not provided"}
- Email Domain: ${lead.contactEmail.split("@")[1]}

Research this lead and company thoroughly. Generate a comprehensive sales intelligence dossier.

Return a JSON object with these exact keys:

{
  "personalBackground": "Career history, education, professional achievements. What drives this person? Decision-making style?",
  
  "commonGround": "3-4 specific conversation starters. Shared interests, connections, or experiences. Be creative but professional.",
  
  "companyContext": "What does this company do? Recent news, funding, growth. What stage are they at? What pressures is leadership under?",
  
  "painSignals": "Specific challenges they likely face that Hawk Ridge can solve. Design bottlenecks, manufacturing inefficiencies, legacy software, collaboration issues.",
  
  "techStackIntel": "Current tools they likely use (CAD, PLM, manufacturing tech). Job postings, LinkedIn skills, website clues.",
  
  "buyingTriggers": "Why would they buy NOW? New product launches, expansion, funding, new executives, competitive pressure, fiscal year timing.",
  
  "hawkRidgeFit": "Which 1-3 specific Hawk Ridge solutions match their needs? Clear reasoning and ROI points.",
  
  "fitScore": 0-100 integer score based on: industry fit (25pts), company size (20pts), pain signals (25pts), tech readiness (15pts), buying triggers (15pts),
  
  "fitScoreBreakdown": "Brief explanation of how each factor contributed to the score.",
  
  "priority": "hot (80-100), warm (60-79), cool (40-59), or cold (0-39) based on fitScore",
  
  "openingLine": "A personalized 1-2 sentence opener that references something specific about them or their company. Conversational, not salesy.",
  
  "talkTrack": "3 key value propositions tailored to this lead, each 1-2 sentences.",
  
  "discoveryQuestions": ["5-7 strategic questions to uncover needs, budget, timeline, decision process. Start broad, get specific."],
  
  "objectionHandles": [{"objection": "Likely objection", "response": "Specific response strategy"}] - include 3-4 objection/response pairs for price, timing, competition, change resistance,
  
  "theAsk": "The specific next step to propose (demo, assessment, trial) based on their likely readiness.",
  
  "linkedInUrl": "The contact's LinkedIn profile URL if found. Return null if not found.",
  "phoneNumber": "The contact's phone number if found. Return null if not found.",
  "jobTitle": "The contact's current job title if discovered. Return null if not found.",
  "companyWebsite": "The company's website URL if found. Return null if not found."
}

Be thorough but concise. Focus on actionable intelligence.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 4000,
      },
    });

    let text = "";
    if (response.text) {
      text = response.text;
    } else if (response.candidates?.[0]?.content?.parts) {
      const textPart = response.candidates[0].content.parts.find(
        (part: { text?: string }) => part.text
      );
      text = textPart?.text || "";
    }
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const raw = JSON.parse(jsonMatch[0]);
    
    const dossier: LeadDossier = {
      personalBackground: raw.personalBackground || "",
      commonGround: raw.commonGround || "",
      companyContext: raw.companyContext || "",
      painSignals: raw.painSignals || "",
      techStackIntel: raw.techStackIntel || "",
      buyingTriggers: raw.buyingTriggers || "",
      hawkRidgeFit: raw.hawkRidgeFit || "",
      fitScore: typeof raw.fitScore === "number" ? raw.fitScore : 50,
      fitScoreBreakdown: raw.fitScoreBreakdown || "",
      priority: ["hot", "warm", "cool", "cold"].includes(raw.priority) ? raw.priority : "cool",
      talkTrack: raw.talkTrack || "",
      openingLine: raw.openingLine || "",
      discoveryQuestions: Array.isArray(raw.discoveryQuestions) ? raw.discoveryQuestions : [],
      objectionHandles: Array.isArray(raw.objectionHandles) ? raw.objectionHandles : [],
      theAsk: raw.theAsk || "",
      sources: "Gemini AI with web grounding",
      linkedInUrl: raw.linkedInUrl,
      phoneNumber: raw.phoneNumber,
      jobTitle: raw.jobTitle,
      companyWebsite: raw.companyWebsite
    };
    
    return dossier;
  } catch (error) {
    console.error("[LeadResearch] Error generating dossier:", error);
    
    return {
      personalBackground: "Research pending - unable to generate at this time",
      commonGround: "Research pending",
      companyContext: `${lead.companyName} - ${lead.companyIndustry || "Industry unknown"}`,
      painSignals: "Manual research recommended",
      techStackIntel: "Check company website and job postings",
      buyingTriggers: "Needs discovery call to identify",
      hawkRidgeFit: "Recommend SOLIDWORKS suite based on industry",
      fitScore: 50,
      fitScoreBreakdown: "Default score - research unavailable",
      priority: "cool",
      openingLine: `Hi ${lead.contactName.split(" ")[0]}, I'm reaching out because we help companies like ${lead.companyName} streamline their design and manufacturing processes.`,
      talkTrack: "Focus on design efficiency, manufacturing integration, and data management.",
      discoveryQuestions: [
        "What CAD tools are you currently using?",
        "What's your biggest challenge in product development?",
        "Are you looking to bring any manufacturing in-house?",
        "How do you currently manage design data and revisions?",
        "What's your timeline for making improvements to your design process?"
      ],
      objectionHandles: [
        { objection: "We're happy with our current tools", response: "Understood. Many of our customers felt the same before seeing a 30% improvement in design time. Would a quick comparison be valuable?" },
        { objection: "Budget is tight", response: "We offer flexible licensing and financing. Plus, customers typically see ROI within 6 months through efficiency gains." },
        { objection: "Too busy to switch", response: "We provide full migration support and training. Most teams are fully productive within 2 weeks." }
      ],
      theAsk: "I'd love to show you a quick demo tailored to your workflow. Do you have 20 minutes this week?",
      sources: "Fallback template - AI research unavailable",
    };
  }
}

export interface ResearchResult {
  packet: InsertResearchPacket;
  discoveredInfo: {
    linkedInUrl?: string;
    phoneNumber?: string;
    jobTitle?: string;
    companyWebsite?: string;
  };
}

export async function researchLead(lead: Lead): Promise<ResearchResult> {
  console.log(`[LeadResearch] Starting parallel research for ${lead.contactName} at ${lead.companyName}`);
  
  const [dossier, xIntel, linkedInProfile, companyHardIntel] = await Promise.all([
    generateLeadDossier(lead),
    researchLeadOnX(lead),
    researchContactLinkedIn(lead),
    gatherCompanyHardIntel(lead)
  ]);
  
  console.log(`[LeadResearch] All parallel research completed for ${lead.contactName}`);
  
  const discoveryQuestionsStr = dossier.discoveryQuestions
    .map((q, i) => `${i + 1}. ${q}`)
    .join("\n");
  
  const objectionHandlesStr = dossier.objectionHandles
    .map((o, i) => `${i + 1}. "${o.objection}"\n   Response: ${o.response}`)
    .join("\n\n");
  
  const packet: InsertResearchPacket = {
    leadId: lead.id,
    companyIntel: dossier.companyContext,
    contactIntel: `${dossier.personalBackground}\n\nCommon Ground:\n${dossier.commonGround}`,
    painSignals: dossier.painSignals,
    competitorPresence: dossier.techStackIntel,
    fitAnalysis: `${dossier.hawkRidgeFit}\n\nBuying Triggers:\n${dossier.buyingTriggers}`,
    fitScore: dossier.fitScore,
    priority: dossier.priority,
    talkTrack: `Opening Line:\n${dossier.openingLine}\n\nKey Value Props:\n${dossier.talkTrack}\n\nThe Ask:\n${dossier.theAsk}`,
    discoveryQuestions: discoveryQuestionsStr,
    objectionHandles: objectionHandlesStr,
    companyHardIntel: formatCompanyHardIntel(companyHardIntel),
    xIntel: formatXIntel(xIntel),
    linkedInIntel: formatLinkedInIntel(linkedInProfile),
    sources: `${dossier.sources} | X.com via xAI | LinkedIn via SerpAPI | Company intel via Gemini`,
    verificationStatus: "ai_generated",
  };
  
  const discoveredLinkedIn = linkedInProfile.profileUrl || 
    (dossier.linkedInUrl && dossier.linkedInUrl !== "null" ? dossier.linkedInUrl : undefined);
  
  return {
    packet,
    discoveredInfo: {
      linkedInUrl: discoveredLinkedIn,
      phoneNumber: dossier.phoneNumber && dossier.phoneNumber !== "null" ? dossier.phoneNumber : undefined,
      jobTitle: dossier.jobTitle && dossier.jobTitle !== "null" ? dossier.jobTitle : undefined,
      companyWebsite: dossier.companyWebsite && dossier.companyWebsite !== "null" ? dossier.companyWebsite : undefined,
    }
  };
}

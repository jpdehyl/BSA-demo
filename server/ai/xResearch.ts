import type { Lead } from "@shared/schema";

interface XIntelResult {
  posts: string[];
  engagementStyle: string;
  interests: string[];
  professionalTone: string;
  recentActivity: string;
  xHandle?: string;
  error?: string;
}

export async function researchLeadOnX(lead: Lead): Promise<XIntelResult> {
  const xaiApiKey = process.env.XAI_API;
  
  if (!xaiApiKey) {
    console.log("[XResearch] XAI_API not configured, skipping X.com research");
    return {
      posts: [],
      engagementStyle: "Unknown - X.com research not configured",
      interests: [],
      professionalTone: "Unknown",
      recentActivity: "No data available",
      error: "XAI_API not configured"
    };
  }

  try {
    console.log(`[XResearch] Researching ${lead.contactName} on X.com...`);
    
    const prompt = `Search X.com (Twitter) for information about this person:
Name: ${lead.contactName}
Title: ${lead.contactTitle || "Unknown"}
Company: ${lead.companyName}
Industry: ${lead.companyIndustry || "Unknown"}

Find their X/Twitter profile if possible and analyze:
1. Recent posts and topics they discuss
2. Their engagement style (thought leader, casual, technical, etc.)
3. Professional interests based on what they share/retweet
4. Overall tone (formal, conversational, humorous, etc.)
5. Any recent activity or announcements

Return a JSON object with these exact keys:
{
  "xHandle": "their @handle if found, null if not found",
  "posts": ["array of 3-5 notable recent posts or topics they discuss"],
  "engagementStyle": "description of how they engage on the platform",
  "interests": ["array of 3-5 professional interests based on their activity"],
  "professionalTone": "brief description of their communication style",
  "recentActivity": "summary of their recent X.com activity or any announcements"
}

If you cannot find their profile, return reasonable inferences based on their role and industry.`;

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${xaiApiKey}`
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [
          {
            role: "system",
            content: "You are an expert at researching professionals on X.com (Twitter). Provide accurate intelligence about their social media presence and engagement patterns."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[XResearch] xAI API error:", errorText);
      throw new Error(`xAI API error: ${response.status}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    const content = data.choices?.[0]?.message?.content || "";
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in xAI response");
    }

    const result = JSON.parse(jsonMatch[0]) as XIntelResult;
    console.log(`[XResearch] Completed X.com research for ${lead.contactName}`);
    
    return result;
  } catch (error) {
    console.error("[XResearch] Error:", error);
    return {
      posts: [],
      engagementStyle: "Research unavailable",
      interests: [],
      professionalTone: "Unknown",
      recentActivity: "Unable to research at this time",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export function formatXIntel(intel: XIntelResult): string {
  if (intel.error && intel.posts.length === 0) {
    return `X.com Research: ${intel.error}`;
  }

  const sections = [];
  
  if (intel.xHandle) {
    sections.push(`X Handle: @${intel.xHandle.replace("@", "")}`);
  }
  
  sections.push(`Engagement Style: ${intel.engagementStyle}`);
  sections.push(`Professional Tone: ${intel.professionalTone}`);
  sections.push(`Recent Activity: ${intel.recentActivity}`);
  
  if (intel.interests.length > 0) {
    sections.push(`Interests: ${intel.interests.join(", ")}`);
  }
  
  if (intel.posts.length > 0) {
    sections.push(`Notable Posts/Topics:\n${intel.posts.map((p, i) => `  ${i + 1}. ${p}`).join("\n")}`);
  }
  
  return sections.join("\n\n");
}

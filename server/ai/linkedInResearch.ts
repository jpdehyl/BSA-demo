import type { Lead } from "@shared/schema";

interface LinkedInProfile {
  profileUrl?: string;
  headline?: string;
  summary?: string;
  currentPosition?: string;
  tenure?: string;
  location?: string;
  connections?: string;
  skills: string[];
  experience: string[];
  education: string[];
  error?: string;
}

export async function researchContactLinkedIn(lead: Lead): Promise<LinkedInProfile> {
  const serpApiKey = process.env.SERP_API;
  
  if (!serpApiKey) {
    console.log("[LinkedInResearch] SERP_API not configured, skipping LinkedIn research");
    return {
      skills: [],
      experience: [],
      education: [],
      error: "SERP_API not configured"
    };
  }

  try {
    console.log(`[LinkedInResearch] Searching LinkedIn for ${lead.contactName}...`);
    
    const searchQuery = `${lead.contactName} ${lead.companyName} site:linkedin.com/in`;
    const encodedQuery = encodeURIComponent(searchQuery);
    
    const response = await fetch(
      `https://serpapi.com/search.json?q=${encodedQuery}&api_key=${serpApiKey}&engine=google&num=5`
    );

    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status}`);
    }

    const data = await response.json() as {
      organic_results?: Array<{
        link?: string;
        title?: string;
        snippet?: string;
      }>;
    };
    
    const linkedInResult = data.organic_results?.find(
      (result) => result.link?.includes("linkedin.com/in/")
    );

    if (!linkedInResult) {
      console.log(`[LinkedInResearch] No LinkedIn profile found for ${lead.contactName}`);
      return {
        skills: [],
        experience: [],
        education: [],
        error: "No LinkedIn profile found in search results"
      };
    }

    const profile: LinkedInProfile = {
      profileUrl: linkedInResult.link,
      headline: linkedInResult.title?.replace(" | LinkedIn", "").replace(" - LinkedIn", "") || undefined,
      summary: linkedInResult.snippet || undefined,
      skills: [],
      experience: [],
      education: []
    };

    if (linkedInResult.snippet) {
      const snippet = linkedInResult.snippet;
      
      if (snippet.includes(" at ")) {
        const positionMatch = snippet.match(/([A-Za-z\s]+)\s+at\s+([A-Za-z0-9\s&]+)/);
        if (positionMatch) {
          profile.currentPosition = positionMatch[1].trim();
        }
      }
      
      const locationMatch = snippet.match(/(?:Based in|Located in|·)\s*([A-Za-z\s,]+)(?:Area|Metro)?/i);
      if (locationMatch) {
        profile.location = locationMatch[1].trim();
      }
      
      const connectionsMatch = snippet.match(/(\d+\+?)\s*connections/i);
      if (connectionsMatch) {
        profile.connections = connectionsMatch[1];
      }
    }

    console.log(`[LinkedInResearch] Found LinkedIn profile: ${profile.profileUrl}`);
    
    return profile;
  } catch (error) {
    console.error("[LinkedInResearch] Error:", error);
    return {
      skills: [],
      experience: [],
      education: [],
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export function formatLinkedInIntel(profile: LinkedInProfile): string {
  if (profile.error && !profile.profileUrl) {
    return `LinkedIn Research: ${profile.error}`;
  }

  const sections = [];
  
  if (profile.profileUrl) {
    sections.push(`Profile: ${profile.profileUrl}`);
  }
  
  if (profile.headline) {
    sections.push(`Headline: ${profile.headline}`);
  }
  
  if (profile.currentPosition) {
    sections.push(`Current Role: ${profile.currentPosition}`);
  }
  
  if (profile.location) {
    sections.push(`Location: ${profile.location}`);
  }
  
  if (profile.connections) {
    sections.push(`Network: ${profile.connections} connections`);
  }
  
  if (profile.summary) {
    sections.push(`About: ${profile.summary}`);
  }
  
  if (profile.skills.length > 0) {
    sections.push(`Key Skills: ${profile.skills.join(", ")}`);
  }
  
  if (profile.experience.length > 0) {
    sections.push(`Experience:\n${profile.experience.map(e => `  - ${e}`).join("\n")}`);
  }
  
  if (profile.education.length > 0) {
    sections.push(`Education:\n${profile.education.map(e => `  - ${e}`).join("\n")}`);
  }
  
  return sections.join("\n\n");
}

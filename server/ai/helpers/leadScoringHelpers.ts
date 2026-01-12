/**
 * Lead scoring and priority helpers
 * Extracted from leadResearch.ts for clarity and testability
 */

import type { Lead } from "@shared/schema";
import type { ScrapedIntel, ContactLinkedInData } from "../websiteScraper";

/**
 * Generic email domains that indicate a personal (non-business) email
 */
const GENERIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "hotmail.com",
  "live.com",
  "outlook.com",
  "yahoo.com",
  "aol.com",
  "icloud.com",
  "mail.com",
  "protonmail.com",
  "zoho.com",
]);

/**
 * Check if an email domain is a generic personal email provider
 */
export function isGenericEmailDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() || "";
  return GENERIC_EMAIL_DOMAINS.has(domain);
}

/**
 * Penalty breakdown item
 */
export interface PenaltyItem {
  points: number;
  reason: string;
}

/**
 * Calculate fit score penalties based on lead data quality
 */
export function calculateFitScorePenalties(
  lead: Lead,
  scrapedIntel: ScrapedIntel,
  contactLinkedIn: ContactLinkedInData | null
): PenaltyItem[] {
  const penalties: PenaltyItem[] = [];

  // Penalty: Generic email domain
  if (isGenericEmailDomain(lead.contactEmail)) {
    penalties.push({ points: 30, reason: "Gmail/personal email domain" });
  }

  // Penalty: No company website
  if (!lead.companyWebsite && !scrapedIntel.website) {
    penalties.push({ points: 15, reason: "No company website found" });
  }

  // Penalty: Unknown contact title
  if (!lead.contactTitle && !contactLinkedIn?.currentTitle) {
    penalties.push({ points: 10, reason: "Contact title unknown" });
  }

  // Penalty: No industry information
  if (!lead.companyIndustry) {
    penalties.push({ points: 10, reason: "No industry information" });
  }

  // Penalty: Company name looks like a person's name
  if (companyNameLooksLikePersonName(lead.companyName, lead.contactName)) {
    penalties.push({ points: 25, reason: "Company name appears to be a person's name" });
  }

  return penalties;
}

/**
 * Check if company name appears to be a person's name
 */
export function companyNameLooksLikePersonName(
  companyName: string,
  contactName: string
): boolean {
  const companyNameLower = companyName.toLowerCase();
  const contactNameParts = contactName.toLowerCase().split(" ");

  return contactNameParts.some(
    (part) => companyNameLower.includes(part) && part.length > 2
  );
}

/**
 * Apply penalties to an AI-generated score
 */
export function applyScorePenalties(
  aiScore: number,
  penalties: PenaltyItem[]
): number {
  const totalPenalty = penalties.reduce((sum, p) => sum + p.points, 0);
  return Math.max(0, Math.min(100, aiScore - totalPenalty));
}

/**
 * Format penalty breakdown for display
 */
export function formatPenaltyBreakdown(
  aiScore: number,
  penalties: PenaltyItem[],
  finalScore: number,
  originalBreakdown: string
): string {
  if (penalties.length === 0) {
    return originalBreakdown;
  }

  const penaltyLines = penalties.map((p) => `-${p.points}: ${p.reason}`);
  return [
    `AI Score: ${aiScore}`,
    "Penalties Applied:",
    ...penaltyLines,
    `Final Score: ${finalScore}`,
    "",
    originalBreakdown,
  ].join("\n");
}

/**
 * Priority level based on fit score
 */
export type PriorityLevel = "hot" | "warm" | "cool" | "cold";

/**
 * Determine priority level from fit score
 */
export function determinePriority(fitScore: number): PriorityLevel {
  if (fitScore >= 80) return "hot";
  if (fitScore >= 60) return "warm";
  if (fitScore >= 40) return "cool";
  return "cold";
}

/**
 * Confidence level type
 */
export type ConfidenceLevel = "high" | "medium" | "low";

/**
 * Validate and normalize a confidence level value
 */
export function normalizeConfidenceLevel(value: unknown): ConfidenceLevel {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return "medium";
}

/**
 * Confidence assessment structure
 */
export interface NormalizedConfidenceAssessment {
  overall: ConfidenceLevel;
  companyInfoConfidence: ConfidenceLevel;
  contactInfoConfidence: ConfidenceLevel;
  reasoning: string;
  warnings: string[];
}

/**
 * Normalize AI-generated confidence assessment
 */
export function normalizeConfidenceAssessment(
  raw: Record<string, unknown> | undefined
): NormalizedConfidenceAssessment {
  const confidence = raw || {};

  return {
    overall: normalizeConfidenceLevel(confidence.overall),
    companyInfoConfidence: normalizeConfidenceLevel(confidence.companyInfoConfidence),
    contactInfoConfidence: normalizeConfidenceLevel(confidence.contactInfoConfidence),
    reasoning: (confidence.reasoning as string) || "Confidence assessment not provided by AI",
    warnings: Array.isArray(confidence.warnings)
      ? (confidence.warnings as string[]).filter(
          (w: string) => w && !w.startsWith("Examples:")
        )
      : [],
  };
}

/**
 * Safely extract string from unknown value
 */
export function extractString(value: unknown, defaultValue = ""): string {
  return typeof value === "string" ? value : defaultValue;
}

/**
 * Safely extract array from unknown value
 */
export function extractArray<T>(value: unknown, defaultValue: T[] = []): T[] {
  return Array.isArray(value) ? (value as T[]) : defaultValue;
}

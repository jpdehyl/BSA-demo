/**
 * Lead research processing helpers
 * Extracted from leads-routes.ts for clarity and testability
 */

import type { Lead } from "@shared/schema";

/**
 * Discovered contact information from research
 */
export interface DiscoveredInfo {
  linkedInUrl?: string;
  phoneNumber?: string;
  jobTitle?: string;
  companyWebsite?: string;
}

/**
 * Build update data from discovered info, only including fields that are new
 */
export function buildDiscoveredInfoUpdates(
  lead: Lead,
  discoveredInfo: DiscoveredInfo
): Record<string, string> {
  const updates: Record<string, string> = {};

  if (discoveredInfo.linkedInUrl && !lead.contactLinkedIn) {
    updates.contactLinkedIn = discoveredInfo.linkedInUrl;
  }
  if (discoveredInfo.phoneNumber && !lead.contactPhone) {
    updates.contactPhone = discoveredInfo.phoneNumber;
  }
  if (discoveredInfo.jobTitle && !lead.contactTitle) {
    updates.contactTitle = discoveredInfo.jobTitle;
  }
  if (discoveredInfo.companyWebsite && !lead.companyWebsite) {
    updates.companyWebsite = discoveredInfo.companyWebsite;
  }

  return updates;
}

/**
 * Check if a research packet was generated from fallback template
 */
export function isFallbackResearch(packet: { sources?: string } | null | undefined): boolean {
  return packet?.sources?.includes("Fallback template") ?? false;
}

/**
 * Check if a lead has enough company info to research
 */
export function hasResearchableCompanyInfo(lead: Lead): boolean {
  return Boolean(lead.companyName || lead.companyWebsite);
}

/**
 * Build research score updates from a research packet
 */
export function buildScoreUpdates(
  researchPacket: { fitScore?: number | null; priority?: string | null } | null
): Record<string, number | string> {
  const updates: Record<string, number | string> = {};

  if (researchPacket?.fitScore !== null && researchPacket?.fitScore !== undefined) {
    updates.fitScore = researchPacket.fitScore;
  }
  if (researchPacket?.priority) {
    updates.priority = researchPacket.priority;
  }

  return updates;
}

/**
 * Merge discovered info and score updates into a single update object
 */
export function mergeLeadUpdates(
  discoveredUpdates: Record<string, string>,
  scoreUpdates: Record<string, number | string>
): Record<string, string | number> {
  return { ...discoveredUpdates, ...scoreUpdates };
}

/**
 * Coaching email helpers
 * Extracted from coach-routes.ts for clarity and reusability
 */

import { sendFeedbackEmail, formatFeedbackEmail, formatCallDate } from "../google/gmailClient";

/**
 * User info for email resolution
 */
interface UserInfo {
  email?: string;
  name?: string;
}

/**
 * SDR info for email resolution
 */
interface SdrInfo {
  email?: string;
  name?: string;
  managerEmail?: string;
}

/**
 * Result of resolving email recipient
 */
export interface EmailRecipientResult {
  email: string;
  name: string;
  managerEmail?: string;
  source: "sdr" | "user";
}

/**
 * Resolve the best email recipient for coaching feedback
 * Prefers SDR email, falls back to user email
 */
export function resolveEmailRecipient(
  sdr: SdrInfo | null | undefined,
  user: UserInfo | null | undefined,
  fallbackName?: string
): EmailRecipientResult | null {
  if (sdr?.email) {
    return {
      email: sdr.email,
      name: sdr.name || fallbackName || "Team Member",
      managerEmail: sdr.managerEmail,
      source: "sdr",
    };
  }

  if (user?.email) {
    return {
      email: user.email,
      name: user.name || fallbackName || "Team Member",
      source: "user",
    };
  }

  return null;
}

/**
 * Options for sending coaching feedback email
 */
export interface SendCoachingFeedbackOptions {
  recipient: EmailRecipientResult;
  callDate: Date;
  callType?: string;
  managerSummary: string[];
  coachingMessage: string;
}

/**
 * Send a coaching feedback email
 */
export async function sendCoachingFeedbackEmail(
  options: SendCoachingFeedbackOptions
): Promise<void> {
  const { recipient, callDate, callType = "Call", managerSummary, coachingMessage } = options;

  const emailBody = formatFeedbackEmail(
    recipient.name,
    callDate,
    callType,
    managerSummary,
    coachingMessage
  );

  const dateStr = formatCallDate(callDate, "short");

  await sendFeedbackEmail({
    to: recipient.email,
    cc: recipient.managerEmail,
    subject: `Call Coaching Feedback - ${dateStr}`,
    body: emailBody,
  });
}

/**
 * Get call date from session, with fallback to current time
 */
export function getCallDate(startedAt: Date | string | null | undefined): Date {
  if (!startedAt) return new Date();
  return typeof startedAt === "string" ? new Date(startedAt) : startedAt;
}

/**
 * Safely parse manager summary from JSON string
 */
export function parseManagerSummary(summaryJson: string | null | undefined): string[] {
  if (!summaryJson) return [];

  try {
    const parsed = JSON.parse(summaryJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

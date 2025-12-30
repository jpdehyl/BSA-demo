import { storage } from "./storage";
import { broadcastToUser } from "./transcription";
import type { InsertNotification, NotificationType } from "@shared/schema";

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}

export async function createNotification(payload: NotificationPayload) {
  const notification = await storage.createNotification({
    userId: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    entityType: payload.entityType || null,
    entityId: payload.entityId || null,
  });

  broadcastToUser(payload.userId, {
    type: "notification",
    notification,
  });

  return notification;
}

export async function notifyLeadStatusChange(
  userId: string,
  leadId: string,
  leadName: string,
  oldStatus: string,
  newStatus: string
) {
  return createNotification({
    userId,
    type: "lead_status_change",
    title: "Lead Status Updated",
    message: `${leadName} status changed from ${oldStatus} to ${newStatus}`,
    entityType: "lead",
    entityId: leadId,
  });
}

export async function notifyLeadQualified(
  userId: string,
  leadId: string,
  leadName: string,
  companyName: string
) {
  return createNotification({
    userId,
    type: "lead_qualified",
    title: "Lead Qualified",
    message: `${leadName} at ${companyName} has been qualified`,
    entityType: "lead",
    entityId: leadId,
  });
}

export async function notifyCallCompleted(
  userId: string,
  callSessionId: string,
  leadName: string,
  duration: number
) {
  const minutes = Math.round(duration / 60);
  return createNotification({
    userId,
    type: "call_completed",
    title: "Call Completed",
    message: `Call with ${leadName} ended (${minutes} min)`,
    entityType: "call_session",
    entityId: callSessionId,
  });
}

export async function notifyCallAnalyzed(
  userId: string,
  callSessionId: string,
  leadName: string,
  overallScore: number
) {
  return createNotification({
    userId,
    type: "call_analyzed",
    title: "Call Analysis Ready",
    message: `Analysis for ${leadName} call completed - Score: ${overallScore}/100`,
    entityType: "call_session",
    entityId: callSessionId,
  });
}

export async function notifyResearchReady(
  userId: string,
  leadId: string,
  leadName: string,
  companyName: string
) {
  return createNotification({
    userId,
    type: "research_ready",
    title: "Research Ready",
    message: `Research packet for ${leadName} at ${companyName} is ready`,
    entityType: "lead",
    entityId: leadId,
  });
}

export async function notifyMeetingBooked(
  userId: string,
  leadId: string,
  leadName: string,
  meetingDate?: string
) {
  return createNotification({
    userId,
    type: "meeting_booked",
    title: "Meeting Booked",
    message: meetingDate 
      ? `Meeting with ${leadName} scheduled for ${meetingDate}`
      : `Meeting booked with ${leadName}`,
    entityType: "lead",
    entityId: leadId,
  });
}

export async function notifyAEHandoff(
  userId: string,
  leadId: string,
  leadName: string,
  aeName: string
) {
  return createNotification({
    userId,
    type: "ae_handoff",
    title: "Lead Handed Off",
    message: `${leadName} has been handed off to AE ${aeName}`,
    entityType: "lead",
    entityId: leadId,
  });
}

export async function notifyCoachingAvailable(
  userId: string,
  callSessionId: string,
  tipCount: number
) {
  return createNotification({
    userId,
    type: "coaching_available",
    title: "Coaching Tips Available",
    message: `${tipCount} new coaching tips from your recent call`,
    entityType: "call_session",
    entityId: callSessionId,
  });
}

export async function notifyManagersOfQualifiedLead(
  leadId: string,
  leadName: string,
  companyName: string,
  sdrName: string
) {
  const allUsers = await storage.getAllUsers();
  const managers = allUsers.filter(u => u.role === "admin" || u.role === "manager");
  
  for (const manager of managers) {
    await createNotification({
      userId: manager.id,
      type: "lead_qualified",
      title: "Lead Qualified",
      message: `${sdrName} qualified ${leadName} at ${companyName}`,
      entityType: "lead",
      entityId: leadId,
    });
  }
}

/**
 * Helper functions for manager profile aggregation
 * Extracted from routes.ts for clarity and testability
 */

// Types for the manager profile response
export interface SdrPerformance {
  weekCalls: number;
  weekQualified: number;
  weekMeetings: number;
  connectRate: number;
  trend: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  performance: SdrPerformance;
}

export interface TeamMetrics {
  totalSdrs: number;
  totalCalls: number;
  totalQualified: number;
  totalMeetings: number;
  avgConnectRate: number;
  avgCoachingScore: number;
  coachingSessionsGiven: number;
  weekCalls: number;
  weekQualified: number;
  weekMeetings: number;
  lastWeekCalls: number;
  lastWeekQualified: number;
  lastWeekMeetings: number;
}

export interface WeeklyActivityDay {
  date: string;
  calls: number;
  qualified: number;
  meetings: number;
}

export interface DateRanges {
  now: Date;
  startOfWeek: Date;
  startOfLastWeek: Date;
  endOfLastWeek: Date;
}

export interface Achievement {
  title: string;
  description: string;
  icon: string;
}

/**
 * Calculate date ranges for current and last week
 */
export function getDateRanges(): DateRanges {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const endOfLastWeek = new Date(startOfWeek);

  return { now, startOfWeek, startOfLastWeek, endOfLastWeek };
}

/**
 * Initialize weekly activity array for last 7 days
 */
export function initializeWeeklyActivity(): WeeklyActivityDay[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const activity: WeeklyActivityDay[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    activity.push({ date: days[d.getDay()], calls: 0, qualified: 0, meetings: 0 });
  }

  return activity;
}

/**
 * Calculate percentage trend between two periods
 */
export function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Check if a call disposition counts as "connected"
 */
const CONNECTED_DISPOSITIONS = new Set([
  'connected',
  'qualified',
  'meeting-booked',
  'callback-scheduled',
  'not-interested',
]);

export function isConnectedCall(disposition: string | null | undefined): boolean {
  return CONNECTED_DISPOSITIONS.has(disposition || '');
}

/**
 * Determine the weekly activity index for a call date
 * Returns -1 if the call is outside the 7-day window
 */
export function getWeeklyActivityIndex(callDate: Date, now: Date): number {
  const daysAgo = Math.floor((now.getTime() - callDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysAgo < 0 || daysAgo >= 7) return -1;
  return 6 - daysAgo;
}

/**
 * Filter calls by date range
 */
export function filterCallsByDateRange(
  calls: any[],
  startDate: Date,
  endDate?: Date
): any[] {
  return calls.filter((c: any) => {
    const callDate = new Date(c.startedAt);
    if (endDate) {
      return callDate >= startDate && callDate < endDate;
    }
    return callDate >= startDate;
  });
}

/**
 * Process calls for an SDR and compute their metrics
 */
export function processSdrCalls(
  calls: any[],
  dateRanges: DateRanges,
  weeklyActivity: WeeklyActivityDay[]
): {
  weekCalls: number;
  lastWeekCalls: number;
  weekQualified: number;
  weekMeetings: number;
  lastWeekQualified: number;
  lastWeekMeetings: number;
  connected: number;
} {
  const thisWeekCalls = filterCallsByDateRange(calls, dateRanges.startOfWeek);
  const lastWeekCalls = filterCallsByDateRange(
    calls,
    dateRanges.startOfLastWeek,
    dateRanges.endOfLastWeek
  );

  let weekQualified = 0;
  let weekMeetings = 0;
  let connected = 0;

  // Process this week's calls
  for (const call of thisWeekCalls) {
    if (isConnectedCall(call.disposition)) connected++;
    if (call.disposition === 'qualified') weekQualified++;
    if (call.disposition === 'meeting-booked') weekMeetings++;

    // Update weekly activity chart
    const idx = getWeeklyActivityIndex(new Date(call.startedAt), dateRanges.now);
    if (idx >= 0 && idx < weeklyActivity.length) {
      weeklyActivity[idx].calls++;
      if (call.disposition === 'qualified') weeklyActivity[idx].qualified++;
      if (call.disposition === 'meeting-booked') weeklyActivity[idx].meetings++;
    }
  }

  // Process last week's calls for trend comparison
  let lastWeekQualified = 0;
  let lastWeekMeetings = 0;
  for (const call of lastWeekCalls) {
    if (call.disposition === 'qualified') lastWeekQualified++;
    if (call.disposition === 'meeting-booked') lastWeekMeetings++;
  }

  return {
    weekCalls: thisWeekCalls.length,
    lastWeekCalls: lastWeekCalls.length,
    weekQualified,
    weekMeetings,
    lastWeekQualified,
    lastWeekMeetings,
    connected,
  };
}

/**
 * Calculate connect rate percentage
 */
export function calculateConnectRate(connected: number, totalCalls: number): number {
  if (totalCalls === 0) return 0;
  return Math.round((connected / totalCalls) * 100);
}

/**
 * Get top performers sorted by qualified leads
 */
export function getTopPerformers(
  team: TeamMember[],
  limit: number = 5
): { name: string; metric: string; value: number }[] {
  return [...team]
    .sort((a, b) => b.performance.weekQualified - a.performance.weekQualified)
    .slice(0, limit)
    .map((s) => ({
      name: s.name,
      metric: 'qualified',
      value: s.performance.weekQualified,
    }));
}

/**
 * Format coaching session for response
 */
export function formatCoachingSession(analysis: any): {
  id: number;
  sdrName: string;
  date: Date;
  score: number;
  summary: string;
} {
  return {
    id: analysis.id,
    sdrName: analysis.sdrName || 'Unknown',
    date: analysis.analyzedAt,
    score: analysis.overallScore || 0,
    summary: analysis.summary || 'No summary available',
  };
}

/**
 * Calculate coaching metrics from team analyses
 */
export function calculateCoachingMetrics(teamAnalyses: any[]): {
  sessionsGiven: number;
  avgScore: number;
} {
  const sessionsGiven = teamAnalyses.length;
  let avgScore = 0;

  if (sessionsGiven > 0) {
    const totalScore = teamAnalyses.reduce(
      (sum: number, a: any) => sum + (a.overallScore || 0),
      0
    );
    avgScore = Math.round(totalScore / sessionsGiven);
  }

  return { sessionsGiven, avgScore };
}

/**
 * Generate manager achievements based on metrics
 */
export function generateAchievements(
  sdrCount: number,
  coachingSessions: number,
  avgCoachingScore: number,
  weekMeetings: number
): Achievement[] {
  const achievements: Achievement[] = [
    {
      title: 'Team Builder',
      description: `Managing ${sdrCount} SDRs`,
      icon: 'users',
    },
    {
      title: 'Coach Excellence',
      description: `${coachingSessions} coaching sessions given`,
      icon: 'graduation',
    },
  ];

  if (avgCoachingScore >= 80) {
    achievements.push({
      title: 'High Performance Team',
      description: 'Team average score above 80',
      icon: 'star',
    });
  }

  if (weekMeetings >= 5) {
    achievements.push({
      title: 'Meeting Machine',
      description: `${weekMeetings} meetings booked this week`,
      icon: 'target',
    });
  }

  return achievements;
}

/**
 * Create initial empty team metrics
 */
export function createEmptyTeamMetrics(sdrCount: number): TeamMetrics {
  return {
    totalSdrs: sdrCount,
    totalCalls: 0,
    totalQualified: 0,
    totalMeetings: 0,
    avgConnectRate: 0,
    avgCoachingScore: 0,
    coachingSessionsGiven: 0,
    weekCalls: 0,
    weekQualified: 0,
    weekMeetings: 0,
    lastWeekCalls: 0,
    lastWeekQualified: 0,
    lastWeekMeetings: 0,
  };
}

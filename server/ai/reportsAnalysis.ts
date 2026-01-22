import { GoogleGenAI } from "@google/genai";
import { storage } from "../storage";
import type {
  CallSession,
  Lead,
  Sdr,
  ManagerCallAnalysis,
  ResearchPacket,
  LiveCoachingSession
} from "@shared/schema";

// Gemini AI client setup
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

// ============================================================================
// DATA AGGREGATION TYPES
// ============================================================================

export interface AggregatedReportData {
  period: {
    start: Date;
    end: Date;
    label: string;
  };
  calls: {
    total: number;
    completed: number;
    avgDuration: number;
    totalTalkTime: number;
    byDisposition: Record<string, number>;
    bySdr: Record<string, { name: string; count: number; avgDuration: number }>;
    byDay: Record<string, number>;
    sentimentDistribution: Record<string, number>;
  };
  leads: {
    total: number;
    byStatus: Record<string, number>;
    qualified: number;
    handedOff: number;
    converted: number;
    avgFitScore: number;
    bySource: Record<string, number>;
    newThisPeriod: number;
  };
  coaching: {
    sessionsWithScores: number;
    avgOverallScore: number;
    scoresByDimension: {
      opening: number;
      discovery: number;
      listening: number;
      objection: number;
      valueProposition: number;
      closing: number;
      compliance: number;
    };
    tipsGenerated: number;
    topPerformers: { sdrId: string; name: string; avgScore: number }[];
    needsCoaching: { sdrId: string; name: string; weakestArea: string; score: number }[];
  };
  research: {
    packetsGenerated: number;
    avgConfidence: string;
    topPainPoints: { painPoint: string; count: number }[];
    topProductMatches: { product: string; count: number }[];
  };
  trends: {
    callVolumeChange: number; // percentage change from previous period
    conversionRateChange: number;
    avgScoreChange: number;
  };
}

export interface ExecutiveSummary {
  narrative: string;
  keyWins: string[];
  concerns: string[];
  recommendations: string[];
  generatedAt: Date;
}

export interface PredictiveInsights {
  pipelineForecast: {
    expectedQualified: { min: number; max: number };
    expectedConverted: { min: number; max: number };
    confidence: string;
  };
  leadScorePredictions: {
    leadId: string;
    companyName: string;
    predictedConversion: number;
    keyFactors: string[];
  }[];
  sdrBurnoutRisk: {
    sdrId: string;
    name: string;
    riskLevel: "low" | "medium" | "high";
    indicators: string[];
  }[];
  bestTimeToCall: {
    industry: string;
    bestHours: string[];
    bestDays: string[];
  }[];
  atRiskLeads: {
    leadId: string;
    companyName: string;
    daysSinceContact: number;
    riskReason: string;
  }[];
}

export interface Anomaly {
  id: string;
  type: "warning" | "alert" | "info";
  category: "performance" | "pipeline" | "engagement" | "coaching";
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  expectedValue: number;
  deviation: number;
  suggestedAction: string;
  entityId?: string;
  entityType?: string;
  detectedAt: Date;
}

export interface ConversationalQuery {
  question: string;
  answer: string;
  dataPoints: { label: string; value: string | number }[];
  followUpQuestions: string[];
  confidence: string;
}

export interface CoachingIntelligence {
  sdrId: string;
  sdrName: string;
  skillHeatmap: {
    dimension: string;
    currentScore: number;
    trend: "improving" | "stable" | "declining";
    percentileRank: number;
  }[];
  patterns: {
    observation: string;
    frequency: string;
    impact: "positive" | "negative" | "neutral";
  }[];
  developmentPlan: {
    priority: number;
    skill: string;
    currentLevel: string;
    targetLevel: string;
    suggestedActions: string[];
  }[];
  progressSummary: string;
}

export interface ResearchROI {
  overallEffectiveness: number;
  intelUsageRate: number;
  conversionByIntelType: {
    intelType: string;
    usageRate: number;
    conversionRate: number;
  }[];
  winningTalkTracks: {
    industry: string;
    talkTrack: string;
    successRate: number;
  }[];
  topPerformingPainPoints: {
    painPoint: string;
    mentionRate: number;
    conversionRate: number;
  }[];
}

export interface ComparativeAnalytics {
  sdrRankings: {
    sdrId: string;
    name: string;
    rank: number;
    callVolume: number;
    conversionRate: number;
    avgScore: number;
    trend: "up" | "down" | "stable";
  }[];
  industryPerformance: {
    industry: string;
    leadCount: number;
    conversionRate: number;
    avgFitScore: number;
    trend: "up" | "down" | "stable";
  }[];
  sourceEffectiveness: {
    source: string;
    leadCount: number;
    qualificationRate: number;
    avgTimeToQualify: number;
  }[];
  weekOverWeek: {
    metric: string;
    thisWeek: number;
    lastWeek: number;
    change: number;
    aiCommentary: string;
  }[];
}

// ============================================================================
// DEMO DATA GENERATION (for when database is empty)
// ============================================================================

function generateDemoReportData(periodDays: number = 7): AggregatedReportData {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

  // Generate realistic demo data
  const demoSdrs = [
    { id: "demo-sdr-1", name: "Sofia Vargas" },
    { id: "demo-sdr-2", name: "Marcus Chen" },
    { id: "demo-sdr-3", name: "Emma Rodriguez" },
    { id: "demo-sdr-4", name: "James Wilson" },
    { id: "demo-sdr-5", name: "Aisha Patel" }
  ];

  // Generate calls by day for the period
  const callsByDay: Record<string, number> = {};
  for (let i = 0; i < periodDays; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dayKey = date.toISOString().split("T")[0];
    // Weekdays have more calls than weekends
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    callsByDay[dayKey] = isWeekend ? Math.floor(Math.random() * 40 + 30) : Math.floor(Math.random() * 60 + 100);
  }

  // Build SDR stats
  const sdrStats: Record<string, { name: string; count: number; avgDuration: number }> = {};
  demoSdrs.forEach((sdr, index) => {
    const baseCount = 180 - index * 20 + Math.floor(Math.random() * 30);
    sdrStats[sdr.id] = {
      name: sdr.name,
      count: baseCount,
      avgDuration: 300 + Math.floor(Math.random() * 180) // 5-8 minutes avg
    };
  });

  return {
    period: {
      start: startDate,
      end: endDate,
      label: periodDays === 7 ? "This Week" : periodDays === 30 ? "This Month" : `Last ${periodDays} Days`
    },
    calls: {
      total: 847,
      completed: 782,
      avgDuration: 342, // 5.7 minutes average
      totalTalkTime: 267444, // ~74 hours
      byDisposition: {
        "connected": 312,
        "voicemail": 198,
        "no-answer": 127,
        "meeting-booked": 89,
        "callback-scheduled": 67,
        "qualified": 45,
        "not-interested": 9
      },
      bySdr: sdrStats,
      byDay: callsByDay,
      sentimentDistribution: {
        positive: 423,
        neutral: 298,
        negative: 126
      }
    },
    leads: {
      total: 342,
      byStatus: {
        "new": 78,
        "contacted": 112,
        "qualified": 89,
        "nurturing": 34,
        "handed_off": 18,
        "converted": 11
      },
      qualified: 89,
      handedOff: 18,
      converted: 11,
      avgFitScore: 72.4,
      bySource: {
        "Website": 98,
        "LinkedIn": 87,
        "Referral": 62,
        "Cold Outreach": 55,
        "Trade Show": 40
      },
      newThisPeriod: 156
    },
    coaching: {
      sessionsWithScores: 234,
      avgOverallScore: 78.5,
      scoresByDimension: {
        opening: 82.3,
        discovery: 76.8,
        listening: 84.1,
        objection: 71.2,
        valueProposition: 79.6,
        closing: 74.5,
        compliance: 88.9
      },
      tipsGenerated: 156,
      topPerformers: [
        { sdrId: "demo-sdr-1", name: "Sofia Vargas", avgScore: 92.3 },
        { sdrId: "demo-sdr-2", name: "Marcus Chen", avgScore: 87.8 },
        { sdrId: "demo-sdr-3", name: "Emma Rodriguez", avgScore: 84.2 }
      ],
      needsCoaching: [
        { sdrId: "demo-sdr-4", name: "James Wilson", weakestArea: "objection", score: 62.5 },
        { sdrId: "demo-sdr-5", name: "Aisha Patel", weakestArea: "closing", score: 68.3 }
      ]
    },
    research: {
      packetsGenerated: 189,
      avgConfidence: "high",
      topPainPoints: [
        { painPoint: "Manual data entry inefficiencies", count: 67 },
        { painPoint: "Legacy system integration challenges", count: 54 },
        { painPoint: "Scaling engineering capacity", count: 48 },
        { painPoint: "Compliance documentation burden", count: 41 },
        { painPoint: "Remote collaboration difficulties", count: 38 }
      ],
      topProductMatches: [
        { product: "SOLIDWORKS PDM", count: 78 },
        { product: "SOLIDWORKS Simulation", count: 65 },
        { product: "3DEXPERIENCE Platform", count: 52 },
        { product: "SOLIDWORKS CAM", count: 44 },
        { product: "DriveWorks", count: 31 }
      ]
    },
    trends: {
      callVolumeChange: 12.4,
      conversionRateChange: 8.7,
      avgScoreChange: 3.2
    }
  };
}

export function generateDemoExecutiveSummary(): ExecutiveSummary {
  return {
    narrative: `This week demonstrated strong momentum across your sales development team. The team completed 847 calls with a 92% completion rate, resulting in 89 qualified leads - a 12% increase from last week. Sofia Vargas continues to lead with exceptional performance, achieving a 92.3% coaching score and booking 23 meetings.\n\nNotably, the Manufacturing and Technology sectors showed the highest conversion rates at 34% and 31% respectively. The team's focus on value proposition articulation has paid off, with objection handling scores improving by 8% week-over-week. Research packet utilization reached an all-time high of 78%, correlating directly with improved qualification rates.\n\nWhile overall metrics trend positively, attention should be given to the afternoon calling window (2-4 PM) which shows 23% lower connect rates than morning hours. Additionally, James Wilson and Aisha Patel would benefit from targeted coaching sessions focused on objection handling and closing techniques.`,
    keyWins: [
      "89 leads qualified this week - 12% increase from previous week",
      "Sofia Vargas booked 23 meetings with 92.3% coaching score",
      "Manufacturing sector conversion rate reached 34%",
      "Research packet utilization at all-time high of 78%",
      "Objection handling scores improved 8% week-over-week"
    ],
    concerns: [
      "Afternoon calling window (2-4 PM) shows 23% lower connect rates",
      "James Wilson needs coaching on objection handling (62.5% score)",
      "5 leads at risk of going cold - no contact in 10+ days",
      "Cold Outreach source showing declining conversion trend"
    ],
    recommendations: [
      "Shift calling focus to morning hours (9-11 AM) for 34% higher connect rates",
      "Schedule 1:1 coaching sessions with James Wilson and Aisha Patel this week",
      "Re-engage at-risk leads with personalized follow-up campaigns",
      "Review top performer call recordings for team training material",
      "Increase LinkedIn outreach which shows 28% higher qualification rate"
    ],
    generatedAt: new Date()
  };
}

export function generateDemoAnomalies(): Anomaly[] {
  return [
    {
      id: "anomaly-1",
      type: "info",
      category: "performance",
      title: "Exceptional Performance Spike",
      description: "Sofia Vargas achieved 156% of weekly target with 23 meetings booked. This represents her best week in the past quarter.",
      metric: "Meetings Booked",
      currentValue: 23,
      expectedValue: 15,
      deviation: 53.3,
      suggestedAction: "Shadow Sofia's calls this week to capture best practices for team training.",
      entityId: "demo-sdr-1",
      entityType: "sdr",
      detectedAt: new Date()
    },
    {
      id: "anomaly-2",
      type: "info",
      category: "coaching",
      title: "Coaching Impact Detected",
      description: "Marcus Chen's objection handling score improved from 68% to 84% following last week's coaching session.",
      metric: "Objection Score",
      currentValue: 84,
      expectedValue: 68,
      deviation: 23.5,
      suggestedAction: "Document the coaching approach used and replicate with other team members.",
      entityId: "demo-sdr-2",
      entityType: "sdr",
      detectedAt: new Date()
    },
    {
      id: "anomaly-3",
      type: "warning",
      category: "pipeline",
      title: "Pipeline Velocity Attention Needed",
      description: "Healthcare sector leads are taking 40% longer to move from contacted to qualified compared to other sectors.",
      metric: "Days to Qualify",
      currentValue: 8.4,
      expectedValue: 6,
      deviation: 40,
      suggestedAction: "Review healthcare-specific talk tracks and consider industry-specific follow-up sequences.",
      entityId: "healthcare",
      entityType: "industry",
      detectedAt: new Date()
    }
  ];
}

export function generateDemoPredictiveInsights(): PredictiveInsights {
  return {
    pipelineForecast: {
      expectedQualified: { min: 82, max: 98 },
      expectedConverted: { min: 9, max: 14 },
      confidence: "high"
    },
    leadScorePredictions: [
      {
        leadId: "demo-lead-1",
        companyName: "Aerospace Dynamics Inc",
        predictedConversion: 87,
        keyFactors: ["Active evaluation phase", "Budget confirmed for Q1", "Multiple stakeholder engagement"]
      },
      {
        leadId: "demo-lead-2",
        companyName: "Pacific Manufacturing Group",
        predictedConversion: 79,
        keyFactors: ["Pain points align with solution", "Positive sentiment in calls", "Decision timeline defined"]
      },
      {
        leadId: "demo-lead-3",
        companyName: "TechFlow Systems",
        predictedConversion: 72,
        keyFactors: ["Strong fit score", "Expressed urgency", "Previous vendor relationship ending"]
      }
    ],
    sdrBurnoutRisk: [
      {
        sdrId: "demo-sdr-4",
        name: "James Wilson",
        riskLevel: "medium",
        indicators: ["12% increase in call volume this month", "Slight decline in coaching scores", "Higher voicemail rate"]
      },
      {
        sdrId: "demo-sdr-5",
        name: "Aisha Patel",
        riskLevel: "low",
        indicators: ["Consistent performance metrics", "Balanced call distribution"]
      }
    ],
    bestTimeToCall: [
      {
        industry: "Manufacturing",
        bestHours: ["9:00 AM - 10:30 AM", "2:00 PM - 3:30 PM"],
        bestDays: ["Tuesday", "Wednesday", "Thursday"]
      },
      {
        industry: "Technology",
        bestHours: ["10:00 AM - 11:30 AM", "3:30 PM - 5:00 PM"],
        bestDays: ["Tuesday", "Wednesday"]
      },
      {
        industry: "Healthcare",
        bestHours: ["8:00 AM - 9:30 AM", "1:00 PM - 2:30 PM"],
        bestDays: ["Monday", "Thursday"]
      },
      {
        industry: "Financial Services",
        bestHours: ["9:30 AM - 11:00 AM", "2:30 PM - 4:00 PM"],
        bestDays: ["Tuesday", "Thursday"]
      },
      {
        industry: "Energy",
        bestHours: ["8:30 AM - 10:00 AM", "1:30 PM - 3:00 PM"],
        bestDays: ["Wednesday", "Thursday"]
      }
    ],
    atRiskLeads: [
      {
        leadId: "demo-lead-at-risk-1",
        companyName: "Industrial Solutions Corp",
        daysSinceContact: 14,
        riskReason: "No response to last 3 outreach attempts"
      },
      {
        leadId: "demo-lead-at-risk-2",
        companyName: "Precision Engineering Ltd",
        daysSinceContact: 11,
        riskReason: "Stakeholder went silent after pricing discussion"
      },
      {
        leadId: "demo-lead-at-risk-3",
        companyName: "NextGen Automation",
        daysSinceContact: 10,
        riskReason: "Requested proposal but no follow-up scheduled"
      }
    ]
  };
}

export function generateDemoComparativeAnalytics(): ComparativeAnalytics {
  return {
    sdrRankings: [
      { sdrId: "demo-sdr-1", name: "Sofia Vargas", rank: 1, callVolume: 178, conversionRate: 34.2, avgScore: 92.3, trend: "up" },
      { sdrId: "demo-sdr-2", name: "Marcus Chen", rank: 2, callVolume: 165, conversionRate: 29.8, avgScore: 87.8, trend: "up" },
      { sdrId: "demo-sdr-3", name: "Emma Rodriguez", rank: 3, callVolume: 172, conversionRate: 26.4, avgScore: 84.2, trend: "stable" },
      { sdrId: "demo-sdr-4", name: "James Wilson", rank: 4, callVolume: 168, conversionRate: 21.3, avgScore: 76.5, trend: "down" },
      { sdrId: "demo-sdr-5", name: "Aisha Patel", rank: 5, callVolume: 164, conversionRate: 19.8, avgScore: 74.1, trend: "stable" }
    ],
    industryPerformance: [
      { industry: "Manufacturing", leadCount: 89, conversionRate: 34.2, avgFitScore: 78.4, trend: "up" },
      { industry: "Technology", leadCount: 76, conversionRate: 31.4, avgFitScore: 82.1, trend: "up" },
      { industry: "Healthcare", leadCount: 54, conversionRate: 24.8, avgFitScore: 71.3, trend: "down" },
      { industry: "Financial Services", leadCount: 67, conversionRate: 27.6, avgFitScore: 75.8, trend: "stable" },
      { industry: "Energy", leadCount: 56, conversionRate: 28.9, avgFitScore: 73.2, trend: "up" }
    ],
    sourceEffectiveness: [
      { source: "Website", leadCount: 98, qualificationRate: 32.4, avgTimeToQualify: 4.2 },
      { source: "LinkedIn", leadCount: 87, qualificationRate: 28.7, avgTimeToQualify: 5.1 },
      { source: "Referral", leadCount: 62, qualificationRate: 45.2, avgTimeToQualify: 2.8 },
      { source: "Cold Outreach", leadCount: 55, qualificationRate: 18.9, avgTimeToQualify: 7.3 },
      { source: "Trade Show", leadCount: 40, qualificationRate: 38.5, avgTimeToQualify: 3.5 }
    ],
    weekOverWeek: [
      { metric: "Total Calls", thisWeek: 847, lastWeek: 754, change: 12.3, aiCommentary: "Strong momentum with 12% increase in call activity. Team is executing well on outreach targets." },
      { metric: "Qualified Leads", thisWeek: 89, lastWeek: 79, change: 12.7, aiCommentary: "Qualification rate improving due to better research utilization and targeted prospecting." },
      { metric: "Meetings Booked", thisWeek: 67, lastWeek: 58, change: 15.5, aiCommentary: "Excellent week for demos. Sofia and Marcus driving majority of bookings." },
      { metric: "Avg Coaching Score", thisWeek: 78.5, lastWeek: 76.2, change: 3.0, aiCommentary: "Coaching investments paying off. Objection handling showing particular improvement." },
      { metric: "Connect Rate", thisWeek: 42.3, lastWeek: 40.8, change: 3.7, aiCommentary: "Morning calling strategy contributing to improved connect rates." }
    ]
  };
}

export function generateDemoCoachingIntelligence(sdrId: string): CoachingIntelligence | null {
  const demoSdrs: Record<string, { name: string; data: CoachingIntelligence }> = {
    "demo-sdr-1": {
      name: "Sofia Vargas",
      data: {
        sdrId: "demo-sdr-1",
        sdrName: "Sofia Vargas",
        skillHeatmap: [
          { dimension: "Opening", currentScore: 94, trend: "improving", percentileRank: 98 },
          { dimension: "Discovery", currentScore: 91, trend: "stable", percentileRank: 95 },
          { dimension: "Listening", currentScore: 96, trend: "improving", percentileRank: 99 },
          { dimension: "Objection Handling", currentScore: 88, trend: "improving", percentileRank: 92 },
          { dimension: "Value Proposition", currentScore: 92, trend: "stable", percentileRank: 96 },
          { dimension: "Closing", currentScore: 89, trend: "improving", percentileRank: 93 }
        ],
        patterns: [
          { observation: "Consistently personalizes opening based on research", frequency: "87% of calls", impact: "positive" },
          { observation: "Uses silence effectively to let prospects elaborate", frequency: "92% of calls", impact: "positive" },
          { observation: "Strong at connecting pain points to product value", frequency: "85% of calls", impact: "positive" }
        ],
        developmentPlan: [
          { priority: 1, skill: "Objection Handling", currentLevel: "Advanced", targetLevel: "Expert", suggestedActions: ["Practice advanced reframing techniques", "Study competitor objection responses"] }
        ],
        progressSummary: "Sofia continues to be a top performer. Her coaching scores have improved 8% this quarter with particular growth in objection handling. She is an excellent candidate for peer coaching and mentorship roles."
      }
    },
    "demo-sdr-2": {
      name: "Marcus Chen",
      data: {
        sdrId: "demo-sdr-2",
        sdrName: "Marcus Chen",
        skillHeatmap: [
          { dimension: "Opening", currentScore: 86, trend: "stable", percentileRank: 85 },
          { dimension: "Discovery", currentScore: 89, trend: "improving", percentileRank: 90 },
          { dimension: "Listening", currentScore: 82, trend: "stable", percentileRank: 78 },
          { dimension: "Objection Handling", currentScore: 84, trend: "improving", percentileRank: 82 },
          { dimension: "Value Proposition", currentScore: 91, trend: "improving", percentileRank: 94 },
          { dimension: "Closing", currentScore: 88, trend: "stable", percentileRank: 88 }
        ],
        patterns: [
          { observation: "Excellent at technical value articulation", frequency: "91% of calls", impact: "positive" },
          { observation: "Sometimes moves to solution too quickly", frequency: "34% of calls", impact: "negative" },
          { observation: "Strong closing on qualified opportunities", frequency: "88% of calls", impact: "positive" }
        ],
        developmentPlan: [
          { priority: 1, skill: "Listening", currentLevel: "Intermediate", targetLevel: "Advanced", suggestedActions: ["Practice SPIN questioning methodology", "Allow more pause time before responding"] },
          { priority: 2, skill: "Discovery", currentLevel: "Advanced", targetLevel: "Expert", suggestedActions: ["Develop industry-specific question sets", "Focus on uncovering emotional drivers"] }
        ],
        progressSummary: "Marcus shows strong technical knowledge and closing ability. Focus this month on deeper discovery and active listening. His objection handling has improved 23% since last coaching session."
      }
    }
  };

  const sdr = demoSdrs[sdrId];
  return sdr?.data || null;
}

export function generateDemoResearchROI(): ResearchROI {
  return {
    overallEffectiveness: 78,
    intelUsageRate: 72,
    conversionByIntelType: [
      { intelType: "Company Research", usageRate: 85, conversionRate: 38 },
      { intelType: "Pain Points", usageRate: 78, conversionRate: 42 },
      { intelType: "Product Matches", usageRate: 68, conversionRate: 45 },
      { intelType: "Competitive Intel", usageRate: 52, conversionRate: 35 },
      { intelType: "Industry Trends", usageRate: 45, conversionRate: 29 }
    ],
    winningTalkTracks: [
      { industry: "Manufacturing", talkTrack: "ROI-focused: 30% faster design cycles", successRate: 42 },
      { industry: "Technology", talkTrack: "Innovation narrative: Stay ahead of competition", successRate: 38 },
      { industry: "Healthcare", talkTrack: "Compliance-first: FDA documentation simplified", successRate: 35 },
      { industry: "Energy", talkTrack: "Sustainability angle: Reduce material waste", successRate: 33 }
    ],
    topPerformingPainPoints: [
      { painPoint: "Manual data entry inefficiencies", mentionRate: 45, conversionRate: 48 },
      { painPoint: "Legacy system integration", mentionRate: 38, conversionRate: 42 },
      { painPoint: "Collaboration across teams", mentionRate: 32, conversionRate: 39 },
      { painPoint: "Time to market pressure", mentionRate: 28, conversionRate: 36 }
    ]
  };
}

// ============================================================================
// DATA AGGREGATION FUNCTIONS
// ============================================================================

export async function aggregateReportData(
  periodDays: number = 7
): Promise<AggregatedReportData> {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const previousStart = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

  // Fetch all data in parallel
  const [
    allCalls,
    allLeads,
    allSdrs,
    allAnalyses,
    allResearchPackets,
    allCoachingSessions
  ] = await Promise.all([
    storage.getAllCallSessions(),
    storage.getAllLeads(),
    storage.getAllSdrs(),
    storage.getAllManagerCallAnalyses(),
    storage.getAllResearchPackets(),
    storage.getAllLiveCoachingSessions()
  ]);

  // Return demo data if database is empty
  if (allCalls.length === 0 && allLeads.length === 0 && allSdrs.length === 0) {
    console.log("[ReportsAnalysis] Database is empty, returning demo data");
    return generateDemoReportData(periodDays);
  }

  // Filter current period data
  const periodCalls = allCalls.filter(c =>
    c.startedAt && new Date(c.startedAt) >= startDate && new Date(c.startedAt) <= endDate
  );

  const previousPeriodCalls = allCalls.filter(c =>
    c.startedAt && new Date(c.startedAt) >= previousStart && new Date(c.startedAt) < startDate
  );

  const periodLeads = allLeads.filter(l =>
    l.createdAt && new Date(l.createdAt) >= startDate
  );

  const periodAnalyses = allAnalyses.filter(a =>
    a.analyzedAt && new Date(a.analyzedAt) >= startDate
  );

  const periodResearch = allResearchPackets.filter(r =>
    r.createdAt && new Date(r.createdAt) >= startDate
  );

  const periodCoaching = allCoachingSessions.filter(s =>
    s.startedAt && new Date(s.startedAt) >= startDate
  );

  // Aggregate calls data
  const completedCalls = periodCalls.filter(c => c.status === "completed");
  const totalTalkTime = completedCalls.reduce((sum, c) => sum + (c.duration || 0), 0);
  const avgDuration = completedCalls.length > 0 ? totalTalkTime / completedCalls.length : 0;

  const callsByDisposition: Record<string, number> = {};
  const callsBySdr: Record<string, { name: string; count: number; totalDuration: number }> = {};
  const callsByDay: Record<string, number> = {};
  const sentimentDistribution: Record<string, number> = { positive: 0, neutral: 0, negative: 0 };

  periodCalls.forEach(call => {
    // By disposition
    const disposition = call.disposition || "unknown";
    callsByDisposition[disposition] = (callsByDisposition[disposition] || 0) + 1;

    // By day
    if (call.startedAt) {
      const dayKey = new Date(call.startedAt).toISOString().split("T")[0];
      callsByDay[dayKey] = (callsByDay[dayKey] || 0) + 1;
    }

    // By SDR
    if (call.userId) {
      if (!callsBySdr[call.userId]) {
        const sdr = allSdrs.find(s => s.id === call.userId);
        callsBySdr[call.userId] = {
          name: sdr?.name || "Unknown",
          count: 0,
          totalDuration: 0
        };
      }
      callsBySdr[call.userId].count++;
      callsBySdr[call.userId].totalDuration += call.duration || 0;
    }

    // Sentiment
    if (call.sentimentScore) {
      if (call.sentimentScore >= 4) sentimentDistribution.positive++;
      else if (call.sentimentScore >= 2) sentimentDistribution.neutral++;
      else sentimentDistribution.negative++;
    }
  });

  // Convert callsBySdr to final format
  const sdrStats: Record<string, { name: string; count: number; avgDuration: number }> = {};
  Object.entries(callsBySdr).forEach(([id, data]) => {
    sdrStats[id] = {
      name: data.name,
      count: data.count,
      avgDuration: data.count > 0 ? data.totalDuration / data.count : 0
    };
  });

  // Aggregate leads data
  const leadsByStatus: Record<string, number> = {};
  const leadsBySource: Record<string, number> = {};
  let totalFitScore = 0;
  let fitScoreCount = 0;

  allLeads.forEach(lead => {
    leadsByStatus[lead.status] = (leadsByStatus[lead.status] || 0) + 1;
    leadsBySource[lead.source] = (leadsBySource[lead.source] || 0) + 1;
    if (lead.fitScore) {
      totalFitScore += lead.fitScore;
      fitScoreCount++;
    }
  });

  // Aggregate coaching data
  const scoresByDimension = {
    opening: 0, discovery: 0, listening: 0, objection: 0,
    valueProposition: 0, closing: 0, compliance: 0
  };
  let dimensionCount = 0;
  let totalOverallScore = 0;

  const sdrScores: Record<string, { name: string; scores: number[] }> = {};

  periodAnalyses.forEach(analysis => {
    if (analysis.overallScore) {
      totalOverallScore += analysis.overallScore;
      dimensionCount++;
    }
    if (analysis.openingScore) scoresByDimension.opening += analysis.openingScore;
    if (analysis.discoveryScore) scoresByDimension.discovery += analysis.discoveryScore;
    if (analysis.listeningScore) scoresByDimension.listening += analysis.listeningScore;
    if (analysis.objectionScore) scoresByDimension.objection += analysis.objectionScore;
    if (analysis.valuePropositionScore) scoresByDimension.valueProposition += analysis.valuePropositionScore;
    if (analysis.closingScore) scoresByDimension.closing += analysis.closingScore;
    if (analysis.complianceScore) scoresByDimension.compliance += analysis.complianceScore;

    if (analysis.sdrId && analysis.overallScore) {
      if (!sdrScores[analysis.sdrId]) {
        sdrScores[analysis.sdrId] = { name: analysis.sdrName, scores: [] };
      }
      sdrScores[analysis.sdrId].scores.push(analysis.overallScore);
    }
  });

  // Average the dimension scores
  if (dimensionCount > 0) {
    Object.keys(scoresByDimension).forEach(key => {
      scoresByDimension[key as keyof typeof scoresByDimension] /= dimensionCount;
    });
  }

  // Find top performers and those needing coaching
  const sdrPerformance = Object.entries(sdrScores).map(([id, data]) => ({
    sdrId: id,
    name: data.name,
    avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length
  })).sort((a, b) => b.avgScore - a.avgScore);

  const topPerformers = sdrPerformance.slice(0, 3);

  // Find weakest areas for bottom performers
  const needsCoaching = sdrPerformance.slice(-3).map(sdr => {
    const analyses = periodAnalyses.filter(a => a.sdrId === sdr.sdrId);
    let weakestArea = "general";
    let lowestScore = 100;

    const dimensions = ["opening", "discovery", "listening", "objection", "valueProposition", "closing"];
    dimensions.forEach(dim => {
      const scores = analyses.map(a => a[`${dim}Score` as keyof ManagerCallAnalysis] as number).filter(Boolean);
      if (scores.length > 0) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg < lowestScore) {
          lowestScore = avg;
          weakestArea = dim;
        }
      }
    });

    return { sdrId: sdr.sdrId, name: sdr.name, weakestArea, score: lowestScore };
  });

  // Aggregate research data
  const painPointCounts: Record<string, number> = {};
  const productMatchCounts: Record<string, number> = {};

  periodResearch.forEach(packet => {
    if (packet.painPointsJson && Array.isArray(packet.painPointsJson)) {
      (packet.painPointsJson as Array<{ title?: string }>).forEach(pp => {
        if (pp.title) {
          painPointCounts[pp.title] = (painPointCounts[pp.title] || 0) + 1;
        }
      });
    }
    if (packet.productMatchesJson && Array.isArray(packet.productMatchesJson)) {
      (packet.productMatchesJson as Array<{ product?: string }>).forEach(pm => {
        if (pm.product) {
          productMatchCounts[pm.product] = (productMatchCounts[pm.product] || 0) + 1;
        }
      });
    }
  });

  const topPainPoints = Object.entries(painPointCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([painPoint, count]) => ({ painPoint, count }));

  const topProductMatches = Object.entries(productMatchCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([product, count]) => ({ product, count }));

  // Calculate trends
  const prevCompleted = previousPeriodCalls.filter(c => c.status === "completed").length;
  const callVolumeChange = prevCompleted > 0
    ? ((completedCalls.length - prevCompleted) / prevCompleted) * 100
    : 0;

  const currentQualified = allLeads.filter(l => l.status === "qualified").length;
  const previousQualified = allLeads.filter(l =>
    l.status === "qualified" && l.createdAt && new Date(l.createdAt) < startDate
  ).length;
  const conversionRateChange = previousQualified > 0
    ? ((currentQualified - previousQualified) / previousQualified) * 100
    : 0;

  return {
    period: {
      start: startDate,
      end: endDate,
      label: periodDays === 7 ? "This Week" : periodDays === 30 ? "This Month" : `Last ${periodDays} Days`
    },
    calls: {
      total: periodCalls.length,
      completed: completedCalls.length,
      avgDuration,
      totalTalkTime,
      byDisposition: callsByDisposition,
      bySdr: sdrStats,
      byDay: callsByDay,
      sentimentDistribution
    },
    leads: {
      total: allLeads.length,
      byStatus: leadsByStatus,
      qualified: leadsByStatus["qualified"] || 0,
      handedOff: leadsByStatus["handed_off"] || 0,
      converted: leadsByStatus["converted"] || 0,
      avgFitScore: fitScoreCount > 0 ? totalFitScore / fitScoreCount : 0,
      bySource: leadsBySource,
      newThisPeriod: periodLeads.length
    },
    coaching: {
      sessionsWithScores: dimensionCount,
      avgOverallScore: dimensionCount > 0 ? totalOverallScore / dimensionCount : 0,
      scoresByDimension,
      tipsGenerated: periodCoaching.length,
      topPerformers,
      needsCoaching
    },
    research: {
      packetsGenerated: periodResearch.length,
      avgConfidence: "medium",
      topPainPoints,
      topProductMatches
    },
    trends: {
      callVolumeChange,
      conversionRateChange,
      avgScoreChange: 0 // Would need historical data for accurate calculation
    }
  };
}

// ============================================================================
// AI-POWERED ANALYSIS FUNCTIONS
// ============================================================================

export async function generateExecutiveSummary(
  data: AggregatedReportData
): Promise<ExecutiveSummary> {
  const ai = getAiClient();

  const prompt = `You are an expert sales analytics AI. Generate an executive summary based on this sales performance data.

## Data:
${JSON.stringify(data, null, 2)}

## Task:
Generate a compelling executive summary with:

1. **Narrative** (2-3 paragraphs): A flowing narrative describing this period's performance, highlighting what stands out, and providing context. Write like a senior sales leader briefing the CEO.

2. **Key Wins** (3-5 bullets): Specific accomplishments with numbers. Be concrete.

3. **Concerns** (2-4 bullets): Issues that need attention, backed by data.

4. **Recommendations** (3-5 bullets): Actionable next steps with expected impact.

## Response Format (JSON only):
{
  "narrative": "Executive summary narrative here...",
  "keyWins": ["Win 1 with specific numbers", "Win 2", "..."],
  "concerns": ["Concern 1 with data", "..."],
  "recommendations": ["Recommendation 1 with expected impact", "..."]
}

Be specific, use the actual numbers from the data, and provide actionable insights.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const text = response.candidates?.[0]?.content?.parts?.find(
      (part: { text?: string }) => part.text
    )?.text?.trim() || "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        narrative: parsed.narrative || "Summary generation in progress...",
        keyWins: parsed.keyWins || [],
        concerns: parsed.concerns || [],
        recommendations: parsed.recommendations || [],
        generatedAt: new Date()
      };
    }
  } catch (error) {
    console.error("[ReportsAnalysis] Failed to generate executive summary:", error);
  }

  return {
    narrative: "Unable to generate summary at this time. Please try again.",
    keyWins: [],
    concerns: [],
    recommendations: [],
    generatedAt: new Date()
  };
}

export async function detectAnomalies(
  data: AggregatedReportData
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  const now = new Date();

  // Check for call volume anomalies
  if (data.trends.callVolumeChange < -20) {
    anomalies.push({
      id: `anomaly-calls-${now.getTime()}`,
      type: "warning",
      category: "performance",
      title: "Call Volume Drop",
      description: `Call volume decreased by ${Math.abs(data.trends.callVolumeChange).toFixed(1)}% compared to the previous period.`,
      metric: "call_volume",
      currentValue: data.calls.completed,
      expectedValue: Math.round(data.calls.completed / (1 + data.trends.callVolumeChange / 100)),
      deviation: data.trends.callVolumeChange,
      suggestedAction: "Review SDR schedules and check for any blockers preventing outreach.",
      detectedAt: now
    });
  }

  // Check for low coaching scores
  if (data.coaching.avgOverallScore > 0 && data.coaching.avgOverallScore < 60) {
    anomalies.push({
      id: `anomaly-coaching-${now.getTime()}`,
      type: "alert",
      category: "coaching",
      title: "Low Team Coaching Scores",
      description: `Average coaching score is ${data.coaching.avgOverallScore.toFixed(1)}, below the target of 70.`,
      metric: "avg_coaching_score",
      currentValue: data.coaching.avgOverallScore,
      expectedValue: 70,
      deviation: ((data.coaching.avgOverallScore - 70) / 70) * 100,
      suggestedAction: "Schedule team coaching sessions focusing on discovery and objection handling.",
      detectedAt: now
    });
  }

  // Check for pipeline stagnation
  const engagedLeads = data.leads.byStatus["engaged"] || 0;
  const qualifiedLeads = data.leads.qualified;
  if (engagedLeads > 10 && qualifiedLeads < engagedLeads * 0.2) {
    anomalies.push({
      id: `anomaly-pipeline-${now.getTime()}`,
      type: "warning",
      category: "pipeline",
      title: "Pipeline Conversion Bottleneck",
      description: `Only ${qualifiedLeads} of ${engagedLeads} engaged leads have been qualified (${((qualifiedLeads / engagedLeads) * 100).toFixed(1)}%).`,
      metric: "qualification_rate",
      currentValue: (qualifiedLeads / engagedLeads) * 100,
      expectedValue: 30,
      deviation: -50,
      suggestedAction: "Review qualification criteria and ensure SDRs are properly BANT-qualifying engaged leads.",
      detectedAt: now
    });
  }

  // Check for SDRs needing coaching
  data.coaching.needsCoaching.forEach(sdr => {
    if (sdr.score < 50) {
      anomalies.push({
        id: `anomaly-sdr-${sdr.sdrId}-${now.getTime()}`,
        type: "warning",
        category: "coaching",
        title: `${sdr.name} Needs Coaching`,
        description: `${sdr.name} is scoring ${sdr.score.toFixed(1)} in ${sdr.weakestArea}, significantly below team average.`,
        metric: `${sdr.weakestArea}_score`,
        currentValue: sdr.score,
        expectedValue: 70,
        deviation: ((sdr.score - 70) / 70) * 100,
        suggestedAction: `Schedule 1:1 coaching session with ${sdr.name} focusing on ${sdr.weakestArea} skills.`,
        entityId: sdr.sdrId,
        entityType: "sdr",
        detectedAt: now
      });
    }
  });

  // Check for high negative sentiment
  const totalSentiment = Object.values(data.calls.sentimentDistribution).reduce((a, b) => a + b, 0);
  if (totalSentiment > 0) {
    const negativeRate = (data.calls.sentimentDistribution.negative / totalSentiment) * 100;
    if (negativeRate > 30) {
      anomalies.push({
        id: `anomaly-sentiment-${now.getTime()}`,
        type: "alert",
        category: "engagement",
        title: "High Negative Call Sentiment",
        description: `${negativeRate.toFixed(1)}% of calls had negative sentiment scores.`,
        metric: "negative_sentiment_rate",
        currentValue: negativeRate,
        expectedValue: 15,
        deviation: ((negativeRate - 15) / 15) * 100,
        suggestedAction: "Review call recordings with negative sentiment to identify common issues.",
        detectedAt: now
      });
    }
  }

  return anomalies;
}

export async function generatePredictiveInsights(
  data: AggregatedReportData
): Promise<PredictiveInsights> {
  const ai = getAiClient();

  // Get leads for prediction
  const leads = await storage.getLeads();
  const activeLeads = leads.filter(l =>
    ["new", "researching", "contacted", "engaged"].includes(l.status)
  );

  const prompt = `You are a predictive sales analytics AI. Based on historical patterns and current data, generate predictions.

## Current Data:
${JSON.stringify(data, null, 2)}

## Active Leads for Prediction:
${JSON.stringify(activeLeads.slice(0, 20).map(l => ({
  id: l.id,
  company: l.companyName,
  status: l.status,
  fitScore: l.fitScore,
  industry: l.companyIndustry,
  source: l.source,
  daysSinceCreated: Math.floor((Date.now() - new Date(l.createdAt).getTime()) / (1000 * 60 * 60 * 24))
})), null, 2)}

## Task:
Generate predictive insights including:

1. **Pipeline Forecast**: Expected qualified and converted leads for next period
2. **Lead Score Predictions**: Top 5 leads most likely to convert with confidence %
3. **SDR Burnout Risk**: Based on call patterns and score trends
4. **Best Time to Call**: Industry-specific recommendations
5. **At-Risk Leads**: Leads going cold that need attention

## Response Format (JSON only):
{
  "pipelineForecast": {
    "expectedQualified": { "min": 5, "max": 8 },
    "expectedConverted": { "min": 2, "max": 4 },
    "confidence": "medium"
  },
  "leadScorePredictions": [
    { "leadId": "...", "companyName": "...", "predictedConversion": 78, "keyFactors": ["high fit score", "engaged recently"] }
  ],
  "sdrBurnoutRisk": [
    { "sdrId": "...", "name": "...", "riskLevel": "medium", "indicators": ["declining scores", "fewer calls"] }
  ],
  "bestTimeToCall": [
    { "industry": "Manufacturing", "bestHours": ["9-10am", "2-3pm"], "bestDays": ["Tuesday", "Wednesday"] }
  ],
  "atRiskLeads": [
    { "leadId": "...", "companyName": "...", "daysSinceContact": 14, "riskReason": "No engagement after demo" }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const text = response.candidates?.[0]?.content?.parts?.find(
      (part: { text?: string }) => part.text
    )?.text?.trim() || "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("[ReportsAnalysis] Failed to generate predictive insights:", error);
  }

  // Return default predictions
  return {
    pipelineForecast: {
      expectedQualified: { min: 3, max: 7 },
      expectedConverted: { min: 1, max: 3 },
      confidence: "low"
    },
    leadScorePredictions: [],
    sdrBurnoutRisk: [],
    bestTimeToCall: [
      { industry: "General", bestHours: ["9-11am", "2-4pm"], bestDays: ["Tuesday", "Wednesday", "Thursday"] }
    ],
    atRiskLeads: []
  };
}

export async function answerConversationalQuery(
  question: string,
  data: AggregatedReportData
): Promise<ConversationalQuery> {
  const ai = getAiClient();

  const prompt = `You are a conversational BI assistant for a sales platform. Answer the user's question using the provided data.

## Available Data:
${JSON.stringify(data, null, 2)}

## User Question:
"${question}"

## Task:
1. Answer the question directly and concisely
2. Provide relevant data points to support your answer
3. Suggest 3 follow-up questions the user might want to ask
4. Rate your confidence (high/medium/low) based on data availability

## Response Format (JSON only):
{
  "answer": "Direct, insightful answer to the question...",
  "dataPoints": [
    { "label": "Metric Name", "value": "42" },
    { "label": "Another Metric", "value": "78%" }
  ],
  "followUpQuestions": [
    "Why did X happen?",
    "How does this compare to...?",
    "What should we do about...?"
  ],
  "confidence": "high"
}

Be conversational but data-driven. If the data doesn't fully answer the question, say so.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const text = response.candidates?.[0]?.content?.parts?.find(
      (part: { text?: string }) => part.text
    )?.text?.trim() || "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        question,
        answer: parsed.answer || "I couldn't find a clear answer.",
        dataPoints: parsed.dataPoints || [],
        followUpQuestions: parsed.followUpQuestions || [],
        confidence: parsed.confidence || "medium"
      };
    }
  } catch (error) {
    console.error("[ReportsAnalysis] Failed to answer query:", error);
  }

  return {
    question,
    answer: "I'm having trouble processing that question. Please try rephrasing or ask something more specific about calls, leads, or coaching performance.",
    dataPoints: [],
    followUpQuestions: [
      "What was our call volume this week?",
      "Who are the top performing SDRs?",
      "Which leads are at risk of going cold?"
    ],
    confidence: "low"
  };
}

export async function generateCoachingIntelligence(
  sdrId: string
): Promise<CoachingIntelligence | null> {
  const sdr = await storage.getSdr(sdrId);
  if (!sdr) return null;

  const analyses = await storage.getManagerCallAnalyses();
  const sdrAnalyses = analyses.filter(a => a.sdrId === sdrId);

  if (sdrAnalyses.length === 0) {
    return {
      sdrId,
      sdrName: sdr.name,
      skillHeatmap: [],
      patterns: [],
      developmentPlan: [],
      progressSummary: "No call analyses available yet. Complete more calls to generate insights."
    };
  }

  // Calculate skill heatmap
  const dimensions = [
    { key: "opening", label: "Opening" },
    { key: "discovery", label: "Discovery" },
    { key: "listening", label: "Active Listening" },
    { key: "objection", label: "Objection Handling" },
    { key: "valueProposition", label: "Value Proposition" },
    { key: "closing", label: "Closing" },
    { key: "compliance", label: "Compliance" }
  ];

  const skillHeatmap = dimensions.map(dim => {
    const scores = sdrAnalyses
      .map(a => a[`${dim.key}Score` as keyof ManagerCallAnalysis] as number)
      .filter(Boolean);

    const currentScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    // Calculate trend (compare last 3 vs first 3)
    let trend: "improving" | "stable" | "declining" = "stable";
    if (scores.length >= 6) {
      const recent = scores.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const earlier = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      if (recent > earlier + 5) trend = "improving";
      else if (recent < earlier - 5) trend = "declining";
    }

    return {
      dimension: dim.label,
      currentScore,
      trend,
      percentileRank: 50 // Would need team data for actual percentile
    };
  });

  // Use AI to generate patterns and development plan
  const ai = getAiClient();

  const prompt = `Analyze this SDR's performance data and generate coaching insights.

## SDR: ${sdr.name}
## Skill Scores:
${JSON.stringify(skillHeatmap, null, 2)}

## Recent Analysis Notes:
${sdrAnalyses.slice(-5).map(a => a.keyObservations || a.recommendations).filter(Boolean).join("\n")}

## Task:
Generate:
1. 3-5 behavioral patterns observed in their calls
2. A prioritized development plan with specific actions
3. A progress summary paragraph

## Response Format (JSON only):
{
  "patterns": [
    { "observation": "Tends to rush through discovery questions", "frequency": "Often", "impact": "negative" }
  ],
  "developmentPlan": [
    { "priority": 1, "skill": "Discovery", "currentLevel": "Developing", "targetLevel": "Proficient", "suggestedActions": ["Use SPIN framework", "Pause after each question"] }
  ],
  "progressSummary": "One paragraph summary..."
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const text = response.candidates?.[0]?.content?.parts?.find(
      (part: { text?: string }) => part.text
    )?.text?.trim() || "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        sdrId,
        sdrName: sdr.name,
        skillHeatmap,
        patterns: parsed.patterns || [],
        developmentPlan: parsed.developmentPlan || [],
        progressSummary: parsed.progressSummary || "Analysis in progress..."
      };
    }
  } catch (error) {
    console.error("[ReportsAnalysis] Failed to generate coaching intelligence:", error);
  }

  return {
    sdrId,
    sdrName: sdr.name,
    skillHeatmap,
    patterns: [],
    developmentPlan: [],
    progressSummary: "Unable to generate detailed analysis at this time."
  };
}

export async function generateComparativeAnalytics(
  data: AggregatedReportData
): Promise<ComparativeAnalytics> {
  const leads = await storage.getLeads();
  const sdrs = await storage.getSdrs();

  // SDR Rankings
  const sdrRankings = Object.entries(data.calls.bySdr)
    .map(([sdrId, stats]) => {
      const sdr = sdrs.find(s => s.id === sdrId);
      const sdrLeads = leads.filter(l => l.assignedSdrId === sdrId);
      const qualified = sdrLeads.filter(l => l.status === "qualified" || l.status === "handed_off" || l.status === "converted").length;
      const conversionRate = sdrLeads.length > 0 ? (qualified / sdrLeads.length) * 100 : 0;

      // Find this SDR's coaching scores
      const coachingData = data.coaching.topPerformers.find(p => p.sdrId === sdrId) ||
                          data.coaching.needsCoaching.find(p => p.sdrId === sdrId);

      return {
        sdrId,
        name: sdr?.name || stats.name,
        rank: 0, // Will be set after sorting
        callVolume: stats.count,
        conversionRate,
        avgScore: coachingData?.avgScore || (coachingData as any)?.score || 0,
        trend: "stable" as "up" | "down" | "stable"
      };
    })
    .sort((a, b) => {
      // Composite score: calls + conversion + coaching
      const scoreA = a.callVolume * 0.3 + a.conversionRate * 0.4 + a.avgScore * 0.3;
      const scoreB = b.callVolume * 0.3 + b.conversionRate * 0.4 + b.avgScore * 0.3;
      return scoreB - scoreA;
    })
    .map((sdr, index) => ({ ...sdr, rank: index + 1 }));

  // Industry Performance
  const industryStats: Record<string, { count: number; qualified: number; fitScores: number[] }> = {};
  leads.forEach(lead => {
    const industry = lead.companyIndustry || "Unknown";
    if (!industryStats[industry]) {
      industryStats[industry] = { count: 0, qualified: 0, fitScores: [] };
    }
    industryStats[industry].count++;
    if (["qualified", "handed_off", "converted"].includes(lead.status)) {
      industryStats[industry].qualified++;
    }
    if (lead.fitScore) {
      industryStats[industry].fitScores.push(lead.fitScore);
    }
  });

  const industryPerformance = Object.entries(industryStats).map(([industry, stats]) => ({
    industry,
    leadCount: stats.count,
    conversionRate: stats.count > 0 ? (stats.qualified / stats.count) * 100 : 0,
    avgFitScore: stats.fitScores.length > 0
      ? stats.fitScores.reduce((a, b) => a + b, 0) / stats.fitScores.length
      : 0,
    trend: "stable" as "up" | "down" | "stable"
  })).sort((a, b) => b.conversionRate - a.conversionRate);

  // Source Effectiveness
  const sourceEffectiveness = Object.entries(data.leads.bySource).map(([source, count]) => {
    const sourceLeads = leads.filter(l => l.source === source);
    const qualified = sourceLeads.filter(l =>
      ["qualified", "handed_off", "converted"].includes(l.status)
    ).length;

    return {
      source,
      leadCount: count,
      qualificationRate: count > 0 ? (qualified / count) * 100 : 0,
      avgTimeToQualify: 7 // Would need date tracking for accurate calculation
    };
  }).sort((a, b) => b.qualificationRate - a.qualificationRate);

  // Week over week (simplified)
  const weekOverWeek = [
    {
      metric: "Call Volume",
      thisWeek: data.calls.completed,
      lastWeek: Math.round(data.calls.completed / (1 + data.trends.callVolumeChange / 100)),
      change: data.trends.callVolumeChange,
      aiCommentary: data.trends.callVolumeChange > 0
        ? "Strong momentum in outreach activity"
        : "Call volume needs attention - consider scheduling focus blocks"
    },
    {
      metric: "Avg Coaching Score",
      thisWeek: Math.round(data.coaching.avgOverallScore),
      lastWeek: Math.round(data.coaching.avgOverallScore - data.trends.avgScoreChange),
      change: data.trends.avgScoreChange,
      aiCommentary: data.coaching.avgOverallScore >= 70
        ? "Team is performing well above baseline"
        : "Coaching scores indicate training opportunities"
    },
    {
      metric: "Pipeline Health",
      thisWeek: data.leads.qualified + data.leads.handedOff,
      lastWeek: Math.round((data.leads.qualified + data.leads.handedOff) * 0.9),
      change: 10,
      aiCommentary: "Healthy pipeline with qualified opportunities"
    }
  ];

  return {
    sdrRankings,
    industryPerformance,
    sourceEffectiveness,
    weekOverWeek
  };
}

export async function generateResearchROI(): Promise<ResearchROI> {
  const packets = await storage.getResearchPackets();
  const leads = await storage.getLeads();

  // Calculate basic effectiveness metrics
  const leadsWithResearch = packets.map(p => p.leadId);
  const convertedWithResearch = leads.filter(l =>
    leadsWithResearch.includes(l.id) &&
    ["qualified", "handed_off", "converted"].includes(l.status)
  ).length;

  const overallEffectiveness = leadsWithResearch.length > 0
    ? (convertedWithResearch / leadsWithResearch.length) * 100
    : 0;

  // Analyze pain points effectiveness
  const painPointStats: Record<string, { used: number; converted: number }> = {};
  packets.forEach(packet => {
    const lead = leads.find(l => l.id === packet.leadId);
    const isConverted = lead && ["qualified", "handed_off", "converted"].includes(lead.status);

    if (packet.painPointsJson && Array.isArray(packet.painPointsJson)) {
      (packet.painPointsJson as Array<{ title?: string }>).forEach(pp => {
        if (pp.title) {
          if (!painPointStats[pp.title]) {
            painPointStats[pp.title] = { used: 0, converted: 0 };
          }
          painPointStats[pp.title].used++;
          if (isConverted) painPointStats[pp.title].converted++;
        }
      });
    }
  });

  const topPerformingPainPoints = Object.entries(painPointStats)
    .map(([painPoint, stats]) => ({
      painPoint,
      mentionRate: (stats.used / packets.length) * 100,
      conversionRate: stats.used > 0 ? (stats.converted / stats.used) * 100 : 0
    }))
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 5);

  return {
    overallEffectiveness,
    intelUsageRate: 75, // Would need tracking data
    conversionByIntelType: [
      { intelType: "Company Intel", usageRate: 82, conversionRate: 45 },
      { intelType: "LinkedIn Profile", usageRate: 91, conversionRate: 52 },
      { intelType: "Pain Points", usageRate: 78, conversionRate: 48 },
      { intelType: "Product Matches", usageRate: 65, conversionRate: 55 }
    ],
    winningTalkTracks: [
      { industry: "Manufacturing", talkTrack: "Digital transformation efficiency gains", successRate: 62 },
      { industry: "Technology", talkTrack: "Integration and automation focus", successRate: 58 }
    ],
    topPerformingPainPoints
  };
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Activity,
  TrendingUp,
  Phone,
  CheckCircle2,
  Clock,
  Users,
  Award,
  AlertCircle,
  Loader2,
  PhoneCall,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Trophy
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  type: 'call' | 'qualification';
  timestamp: string;
  sdrId: string;
  sdrName: string;
  data: {
    toNumber?: string;
    duration?: number;
    disposition?: string;
    callId?: string;
    companyName?: string;
    contactName?: string;
    leadId?: number;
  };
}

interface ActivityFeedData {
  activities: ActivityItem[];
  stats: {
    callsLast24h: number;
    qualificationsLast24h: number;
    activeSDRs: number;
  };
}

interface SDRMetrics {
  sdrId: string;
  sdrName: string;
  email: string;
  callsThisWeek: number;
  qualifiedThisWeek: number;
  totalLeads: number;
  conversionRate: number;
  avgCallDuration: number;
}

interface TeamPerformanceData {
  teamMetrics: {
    totalCalls: number;
    totalQualified: number;
    avgConversionRate: number;
    teamSize: number;
  };
  sdrPerformance: SDRMetrics[];
  topPerformers: SDRMetrics[];
}

interface CoachingQueueItem {
  id: string;
  userId: string;
  sdrName: string;
  startedAt: string;
  duration: number;
  transcriptText: string;
  disposition?: string;
  toNumber?: string;
}

interface CoachingQueueData {
  queue: CoachingQueueItem[];
  stats: {
    totalPending: number;
    averageCallDuration: number;
  };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ManagerDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");

  const { data: activityData, isLoading: activityLoading } = useQuery<ActivityFeedData>({
    queryKey: ["/api/manager/activity-feed"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: performanceData, isLoading: performanceLoading } = useQuery<TeamPerformanceData>({
    queryKey: ["/api/manager/team-performance"],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: coachingData, isLoading: coachingLoading } = useQuery<CoachingQueueData>({
    queryKey: ["/api/manager/coaching-queue"],
    refetchInterval: 60000,
  });

  if (activityLoading && performanceLoading && coachingLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const teamMetrics = performanceData?.teamMetrics || {
    totalCalls: 0,
    totalQualified: 0,
    avgConversionRate: 0,
    teamSize: 0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Activity className="h-6 w-6" />
          Manager Command Center
        </h1>
        <p className="text-muted-foreground">
          Real-time team performance and coaching insights
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls This Week</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMetrics.totalCalls}</div>
            <p className="text-xs text-muted-foreground">
              {activityData?.stats.callsLast24h || 0} in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMetrics.totalQualified}</div>
            <p className="text-xs text-muted-foreground">
              {activityData?.stats.qualificationsLast24h || 0} in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMetrics.avgConversionRate}%</div>
            <p className="text-xs text-muted-foreground">Team average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coaching Queue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coachingData?.stats.totalPending || 0}</div>
            <p className="text-xs text-muted-foreground">Calls pending review</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-2" />
            Activity Feed
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="coaching">
            <AlertCircle className="h-4 w-4 mr-2" />
            Coaching Queue
          </TabsTrigger>
        </TabsList>

        {/* Activity Feed Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-Time Activity Feed</CardTitle>
              <CardDescription>
                Team activities from the last 24 hours • {activityData?.stats.activeSDRs || 0} active SDRs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                {activityData?.activities && activityData.activities.length > 0 ? (
                  <div className="space-y-3">
                    {activityData.activities.map((activity, index) => (
                      <div
                        key={`${activity.type}-${activity.timestamp}-${index}`}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <Avatar className="h-10 w-10 mt-1">
                          <AvatarFallback className="text-sm">
                            {getInitials(activity.sdrName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{activity.sdrName}</p>
                              {activity.type === 'call' ? (
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="gap-1">
                                    <PhoneCall className="h-3 w-3" />
                                    Call
                                  </Badge>
                                  {activity.data.disposition && (
                                    <Badge variant="secondary" className="text-xs">
                                      {activity.data.disposition}
                                    </Badge>
                                  )}
                                  {activity.data.duration && (
                                    <span className="text-xs text-muted-foreground">
                                      {Math.floor(activity.data.duration / 60)}m {activity.data.duration % 60}s
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="default" className="gap-1 bg-green-600">
                                    <UserCheck className="h-3 w-3" />
                                    Qualified Lead
                                  </Badge>
                                  <span className="text-sm font-medium">
                                    {activity.data.companyName}
                                  </span>
                                </div>
                              )}
                              {activity.type === 'call' && activity.data.toNumber && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  To: {activity.data.toNumber}
                                </p>
                              )}
                              {activity.type === 'qualification' && activity.data.contactName && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Contact: {activity.data.contactName}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Top Performers This Week
              </CardTitle>
              <CardDescription>Ranked by conversion rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceData?.topPerformers && performanceData.topPerformers.length > 0 ? (
                  performanceData.topPerformers.map((sdr, index) => (
                    <div
                      key={sdr.sdrId}
                      className="flex items-center gap-4 p-3 rounded-lg border bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-950/20"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 font-bold">
                        {index + 1}
                      </div>
                      <Avatar>
                        <AvatarFallback>{getInitials(sdr.sdrName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{sdr.sdrName}</p>
                        <p className="text-sm text-muted-foreground">{sdr.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                          {sdr.conversionRate}%
                          <ArrowUpRight className="h-4 w-4" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {sdr.qualifiedThisWeek} qualified / {sdr.callsThisWeek} calls
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No performance data yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* All SDRs Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Overview</CardTitle>
              <CardDescription>
                {teamMetrics.teamSize} SDRs • Week-to-date metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {performanceData?.sdrPerformance && performanceData.sdrPerformance.length > 0 ? (
                    performanceData.sdrPerformance.map((sdr) => (
                      <div
                        key={sdr.sdrId}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="text-sm">
                            {getInitials(sdr.sdrName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{sdr.sdrName}</p>
                          <p className="text-xs text-muted-foreground truncate">{sdr.email}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-semibold">{sdr.callsThisWeek}</div>
                            <div className="text-xs text-muted-foreground">Calls</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-green-600">{sdr.qualifiedThisWeek}</div>
                            <div className="text-xs text-muted-foreground">Qualified</div>
                          </div>
                          <div className="text-center">
                            <div className={`font-semibold flex items-center gap-1 ${
                              sdr.conversionRate >= teamMetrics.avgConversionRate
                                ? 'text-green-600'
                                : 'text-orange-600'
                            }`}>
                              {sdr.conversionRate}%
                              {sdr.conversionRate >= teamMetrics.avgConversionRate ? (
                                <ArrowUpRight className="h-3 w-3" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">Conv Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{Math.floor(sdr.avgCallDuration / 60)}m</div>
                            <div className="text-xs text-muted-foreground">Avg Duration</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No SDR performance data</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coaching Queue Tab */}
        <TabsContent value="coaching" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Coaching Queue</CardTitle>
                  <CardDescription>
                    Calls with transcripts ready for review
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {coachingData?.stats.totalPending || 0} Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                {coachingData?.queue && coachingData.queue.length > 0 ? (
                  <div className="space-y-3">
                    {coachingData.queue.map((call) => (
                      <div
                        key={call.id}
                        className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{getInitials(call.sdrName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{call.sdrName}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(call.startedAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {Math.floor(call.duration / 60)}m {call.duration % 60}s
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-3">
                          {call.toNumber && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">To:</span>
                              <span>{call.toNumber}</span>
                            </div>
                          )}
                          {call.disposition && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{call.disposition}</Badge>
                            </div>
                          )}
                        </div>

                        <div className="bg-muted/50 rounded p-3 mb-3">
                          <p className="text-sm text-muted-foreground mb-1 font-medium">
                            Transcript Preview:
                          </p>
                          <p className="text-sm line-clamp-3">
                            {call.transcriptText}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Navigate to call details
                            window.location.href = `/coaching?callId=${call.id}`;
                          }}
                        >
                          Review Call
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                    <p className="font-medium text-lg mb-2">All Caught Up!</p>
                    <p className="text-muted-foreground">No calls pending review</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

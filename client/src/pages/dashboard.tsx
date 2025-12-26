import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Users, 
  Phone, 
  FileSearch, 
  TrendingUp, 
  Clock, 
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Loader2,
  Building2
} from "lucide-react";
import type { Lead, CallSession } from "@shared/schema";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

function MetricCard({ title, value, description, icon, trend, loading }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <>
            <div className="text-3xl font-semibold" data-testid={`metric-${title.toLowerCase().replace(/\s/g, '-')}`}>
              {value}
            </div>
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                {trend.isPositive ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-500'}`}>
                  {trend.value}%
                </span>
                <span className="text-sm text-muted-foreground">vs last week</span>
              </div>
            )}
            {description && !trend && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case "call":
      return <Phone className="h-4 w-4" />;
    case "research":
      return <FileSearch className="h-4 w-4" />;
    case "lead":
      return <Users className="h-4 w-4" />;
    default:
      return <Zap className="h-4 w-4" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    completed: { label: "Completed", variant: "default" },
    "in-progress": { label: "In Progress", variant: "secondary" },
    initiated: { label: "Initiated", variant: "outline" },
    ringing: { label: "Ringing", variant: "outline" },
    failed: { label: "Failed", variant: "outline" },
  };
  
  const { label, variant } = variants[status] || { label: status, variant: "outline" as const };
  
  return <Badge variant={variant} className="text-xs">{label}</Badge>;
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: leads = [], isLoading: leadsLoading } = useQuery<(Lead & { hasResearch?: boolean })[]>({
    queryKey: ["/api/leads"],
  });

  const { data: callSessions = [], isLoading: callsLoading } = useQuery<CallSession[]>({
    queryKey: ["/api/call-sessions"],
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const callsToday = callSessions.filter(s => {
    const callDate = new Date(s.startedAt);
    callDate.setHours(0, 0, 0, 0);
    return callDate.getTime() === today.getTime();
  });

  const completedCalls = callSessions.filter(s => s.status === "completed");
  const researchedLeads = leads.filter(l => l.hasResearch);
  
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  
  const callsThisWeek = callSessions.filter(s => new Date(s.startedAt) >= weekAgo).length;
  const callsLastWeek = callSessions.filter(s => {
    const d = new Date(s.startedAt);
    return d >= twoWeeksAgo && d < weekAgo;
  }).length;
  
  const callTrend = callsLastWeek > 0 
    ? Math.round(((callsThisWeek - callsLastWeek) / callsLastWeek) * 100) 
    : callsThisWeek > 0 ? 100 : 0;

  const recentCalls = callSessions.slice(0, 5);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold" data-testid="text-greeting">
          {getGreeting()}, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your sales pipeline today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Leads"
          value={leads.length}
          icon={<Users className="h-5 w-5" />}
          loading={leadsLoading}
          description={`${researchedLeads.length} researched`}
        />
        <MetricCard
          title="Calls Today"
          value={callsToday.length}
          icon={<Phone className="h-5 w-5" />}
          loading={callsLoading}
          trend={callTrend !== 0 ? { value: Math.abs(callTrend), isPositive: callTrend > 0 } : undefined}
        />
        <MetricCard
          title="Research Completed"
          value={researchedLeads.length}
          icon={<FileSearch className="h-5 w-5" />}
          loading={leadsLoading}
          description={leads.length > 0 ? `${Math.round((researchedLeads.length / leads.length) * 100)}% of leads` : "No leads yet"}
        />
        <MetricCard
          title="Total Calls"
          value={completedCalls.length}
          icon={<TrendingUp className="h-5 w-5" />}
          loading={callsLoading}
          description={`${callsThisWeek} this week`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Recent Calls</CardTitle>
              <CardDescription>Your latest call activity</CardDescription>
            </div>
            <Link href="/coaching">
              <Button variant="outline" size="sm" data-testid="button-view-all">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {callsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : recentCalls.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Phone className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No calls yet</p>
                <p className="text-sm mt-1">Start making calls to see your activity here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentCalls.map((call) => (
                  <div 
                    key={call.id} 
                    className="flex items-start gap-4 p-3 rounded-md hover-elevate"
                    data-testid={`activity-item-${call.id}`}
                  >
                    <div className="p-2 rounded-md bg-muted">
                      <ActivityIcon type="call" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">
                          {call.direction === "outbound" ? "Outbound call" : "Inbound call"} to {call.toNumber}
                        </p>
                        <StatusBadge status={call.status} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : "No duration recorded"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(call.startedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/softphone">
              <Button className="w-full justify-start gap-2" variant="outline" data-testid="button-new-call">
                <Phone className="h-4 w-4" />
                Start New Call
              </Button>
            </Link>
            <Link href="/leads">
              <Button className="w-full justify-start gap-2" variant="outline" data-testid="button-add-lead">
                <Users className="h-4 w-4" />
                View Leads
              </Button>
            </Link>
            <Link href="/coaching">
              <Button className="w-full justify-start gap-2" variant="outline" data-testid="button-research">
                <FileSearch className="h-4 w-4" />
                Call Coaching
              </Button>
            </Link>
            <Link href="/leads">
              <Button className="w-full justify-start gap-2 bg-[#2C88C9] hover:bg-[#2C88C9]/90" data-testid="button-import">
                <Zap className="h-4 w-4" />
                Import Leads
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Recent Leads</CardTitle>
            <CardDescription>Latest leads added to your pipeline</CardDescription>
          </div>
          <Link href="/leads">
            <Button variant="outline" size="sm" data-testid="button-view-leads">
              View all leads
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {leadsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No leads yet</p>
              <p className="text-sm mt-1">Import leads from Google Sheets to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Company</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Industry</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Research</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.slice(0, 5).map((lead) => (
                    <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <span className="font-medium">{lead.companyName}</span>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{lead.contactName}</td>
                      <td className="py-3 px-2 text-muted-foreground">{lead.companyIndustry || "-"}</td>
                      <td className="py-3 px-2">
                        <Badge variant={lead.hasResearch ? "default" : "outline"}>
                          {lead.hasResearch ? "Researched" : "Pending"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline">{lead.status}</Badge>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Link href="/softphone">
                          <Button size="sm" variant="ghost">
                            <Phone className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

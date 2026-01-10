import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Building2, Target, Clock, Zap, Flame, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import type { Lead } from "@shared/schema";

interface QueueLead extends Lead {
  fitScore: number | null;
  hasResearch: boolean;
  priority: string | null;
  bestTimeToCall?: string;
  nextFollowUpAt: Date | null;
}

interface CallQueueProps {
  leads: QueueLead[];
  onCall: (lead: QueueLead) => void;
}

export function CallQueue({ leads, onCall }: CallQueueProps) {
  const [, navigate] = useLocation();

  // Auto-prioritize leads
  const prioritizedLeads = [...leads]
    .filter(lead => lead.contactPhone) // Only show leads with phone numbers
    .sort((a, b) => {
      // Priority 1: Hot leads
      if (a.priority === 'hot' && b.priority !== 'hot') return -1;
      if (b.priority === 'hot' && a.priority !== 'hot') return 1;

      // Priority 2: High fit score
      const aFit = a.fitScore || 0;
      const bFit = b.fitScore || 0;
      if (aFit !== bFit) return bFit - aFit;

      // Priority 3: Has research
      if (a.hasResearch && !b.hasResearch) return -1;
      if (b.hasResearch && !a.hasResearch) return 1;

      // Priority 4: Follow-up date is today
      const now = new Date();
      const aIsToday = a.nextFollowUpAt &&
        new Date(a.nextFollowUpAt).toDateString() === now.toDateString();
      const bIsToday = b.nextFollowUpAt &&
        new Date(b.nextFollowUpAt).toDateString() === now.toDateString();
      if (aIsToday && !bIsToday) return -1;
      if (bIsToday && !aIsToday) return 1;

      return 0;
    })
    .slice(0, 10); // Show top 10

  const getPriorityIcon = (priority: string | null) => {
    switch (priority) {
      case "hot": return <Flame className="h-4 w-4 text-red-500" />;
      case "warm": return <Zap className="h-4 w-4 text-orange-500" />;
      default: return <TrendingUp className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    const config = {
      hot: { label: "HOT", className: "bg-red-100 text-red-700 dark:bg-red-900/40" },
      warm: { label: "WARM", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/40" },
      cool: { label: "COOL", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40" },
    };
    const badge = config[priority as keyof typeof config];
    if (!badge) return null;

    return (
      <Badge variant="secondary" className={`${badge.className} text-xs font-bold`}>
        {badge.label}
      </Badge>
    );
  };

  if (prioritizedLeads.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No leads ready to call</p>
            <p className="text-sm mt-1">Import leads or add phone numbers</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Your Call Queue
          </CardTitle>
          <Badge variant="secondary" className="font-mono">
            {prioritizedLeads.length} ready
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Auto-prioritized by fit score, urgency, and research status
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {prioritizedLeads.map((lead, index) => (
            <div
              key={lead.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-all duration-200"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                {index + 1}
              </div>

              {/* Lead Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm truncate">{lead.contactName}</p>
                  {getPriorityBadge(lead.priority)}
                  {!lead.hasResearch && (
                    <Badge variant="outline" className="text-xs">
                      No intel
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{lead.companyName}</span>
                </div>
              </div>

              {/* Fit Score */}
              {lead.fitScore !== null && lead.fitScore !== undefined && (
                <div className="flex flex-col items-center shrink-0">
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-muted-foreground" />
                    <span className={`text-lg font-bold font-mono ${
                      lead.fitScore >= 70 ? "text-green-600" :
                      lead.fitScore >= 40 ? "text-yellow-600" :
                      "text-red-600"
                    }`}>
                      {lead.fitScore}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">fit</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 shrink-0">
                {lead.hasResearch && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/call-prep/${lead.id}`)}
                    className="h-9"
                  >
                    Prep
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => onCall(lead)}
                  className="h-9 bg-[#2C88C9] hover:bg-[#2477AD] text-white gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Call Now
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

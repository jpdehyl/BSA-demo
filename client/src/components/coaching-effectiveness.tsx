import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { 
  Lightbulb, 
  Star,
  TrendingUp,
  MessageSquare,
  CheckCircle,
  Loader2
} from "lucide-react";

interface TipByType {
  tipType: string;
  count: number;
}

interface RecentTip {
  sessionId: string;
  tipType: string;
  content: string;
  createdAt: string;
}

interface QualityTrendPoint {
  date: string;
  score: number;
}

interface CoachingEffectivenessData {
  tipsByType: TipByType[];
  totalTipsGenerated: number;
  recentTips: RecentTip[];
  callsReviewed: number;
  averageSentiment: number;
  qualityTrend: QualityTrendPoint[];
}

function formatTipType(tipType: string): string {
  const map: Record<string, string> = {
    "discovery": "Discovery Questions",
    "objection_handling": "Objection Handling",
    "rapport": "Building Rapport",
    "closing": "Closing Techniques",
    "value_prop": "Value Proposition",
    "next_steps": "Next Steps",
    "pain_point": "Pain Points",
    "qualification": "Qualification",
  };
  return map[tipType] || tipType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

function getTipTypeColor(tipType: string): string {
  const colors: Record<string, string> = {
    "discovery": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    "objection_handling": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    "rapport": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    "closing": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    "value_prop": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
    "next_steps": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    "pain_point": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    "qualification": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  };
  return colors[tipType] || "bg-muted text-muted-foreground";
}

export function CoachingEffectiveness() {
  const { data: effectiveness, isLoading } = useQuery<CoachingEffectivenessData>({
    queryKey: ["/api/manager/coaching-effectiveness"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const maxTipCount = effectiveness?.tipsByType?.length 
    ? Math.max(...effectiveness.tipsByType.map(t => t.count)) 
    : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold" data-testid="text-coaching-title">Coaching Effectiveness</h2>
          <p className="text-sm text-muted-foreground">
            AI coaching tips and call quality metrics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tips Generated</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="metric-tips-generated">
              {effectiveness?.totalTipsGenerated || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">AI coaching suggestions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Calls Reviewed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="metric-calls-reviewed">
              {effectiveness?.callsReviewed || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Manager reviewed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Quality Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold flex items-center gap-2" data-testid="metric-avg-quality">
              {effectiveness?.averageSentiment || 0}
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((score) => (
                  <Star
                    key={score}
                    className={`h-3 w-3 ${
                      score <= Math.round(effectiveness?.averageSentiment || 0)
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Out of 5</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tip Categories</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="metric-tip-categories">
              {effectiveness?.tipsByType?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active tip types</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Tips by Category
            </CardTitle>
            <CardDescription>Breakdown of AI coaching suggestions</CardDescription>
          </CardHeader>
          <CardContent>
            {effectiveness?.tipsByType && effectiveness.tipsByType.length > 0 ? (
              <div className="space-y-3">
                {effectiveness.tipsByType.map((tip) => {
                  const percentage = maxTipCount > 0 ? Math.round((tip.count / maxTipCount) * 100) : 0;
                  return (
                    <div key={tip.tipType} className="space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <Badge className={getTipTypeColor(tip.tipType)}>
                          {formatTipType(tip.tipType)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{tip.count}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No coaching tips generated yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quality Trend
            </CardTitle>
            <CardDescription>Recent call quality scores</CardDescription>
          </CardHeader>
          <CardContent>
            {effectiveness?.qualityTrend && effectiveness.qualityTrend.length > 0 ? (
              <div className="space-y-2">
                {effectiveness.qualityTrend.slice(0, 10).map((point, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 p-2 bg-muted/50 rounded-md">
                    <span className="text-sm text-muted-foreground">
                      {new Date(point.date).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <Star
                          key={score}
                          className={`h-3 w-3 ${
                            score <= point.score
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No quality scores recorded yet</p>
                <p className="text-xs mt-1">Review calls to add quality scores</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recent Coaching Tips
          </CardTitle>
          <CardDescription>Latest AI-generated coaching suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {effectiveness?.recentTips && effectiveness.recentTips.length > 0 ? (
              <div className="space-y-3">
                {effectiveness.recentTips.map((tip, idx) => (
                  <div 
                    key={idx}
                    className="p-3 bg-muted/50 rounded-md space-y-2"
                    data-testid={`tip-${idx}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <Badge className={getTipTypeColor(tip.tipType)}>
                        {formatTipType(tip.tipType)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(tip.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{tip.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No coaching tips generated yet</p>
                <p className="text-xs mt-1">Tips appear as SDRs make calls</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

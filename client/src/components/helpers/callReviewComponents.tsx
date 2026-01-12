/**
 * Reusable sub-components for call-review-dialog
 * Extracted for clarity and testability
 */

import { type LucideIcon, CheckCircle, AlertCircle, MessageSquare, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Claude analysis structure
 */
export interface ClaudeAnalysis {
  overallScore: number;
  callSummary: string;
  strengths: string[];
  areasForImprovement: string[];
  keyMoments: Array<{ description: string; type: string }>;
  recommendedActions: string[];
  talkRatio: { rep: number; prospect: number };
  questionQuality: { score: number; openEnded: number; closedEnded: number; notes: string };
  objectionHandling: { score: number; objections: string[]; responses: string[]; notes: string };
  nextSteps: string[];
}

/**
 * Parse coaching notes to extract Claude analysis
 */
export function parseClaudeAnalysis(coachingNotes: string | null): ClaudeAnalysis | null {
  if (!coachingNotes) return null;
  try {
    const parsed = JSON.parse(coachingNotes);
    if (parsed.overallScore !== undefined) {
      return parsed as ClaudeAnalysis;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Info item with icon - used for call details
 */
interface InfoItemProps {
  icon: LucideIcon;
  children: React.ReactNode;
}

export function InfoItem({ icon: Icon, children }: InfoItemProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      {children}
    </div>
  );
}

/**
 * Talk ratio bar component
 */
interface TalkRatioBarProps {
  label: string;
  percentage: number;
  colorClass: string;
  displayText: string;
}

export function TalkRatioBar({ label, percentage, colorClass, displayText }: TalkRatioBarProps) {
  return (
    <div className="p-3 bg-muted/50 rounded-md">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 mt-1">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className={`h-full ${colorClass}`} style={{ width: `${percentage}%` }} />
        </div>
        <span className="text-xs font-medium">{displayText}</span>
      </div>
    </div>
  );
}

/**
 * Feedback box for strengths or areas for improvement
 */
interface FeedbackBoxProps {
  type: "success" | "warning";
  title: string;
  items: string[];
}

export function FeedbackBox({ type, title, items }: FeedbackBoxProps) {
  const isSuccess = type === "success";
  const Icon = isSuccess ? CheckCircle : AlertCircle;
  const bgColor = isSuccess
    ? "bg-green-50 dark:bg-green-950/30"
    : "bg-amber-50 dark:bg-amber-950/30";
  const borderColor = isSuccess
    ? "border-green-200 dark:border-green-800"
    : "border-amber-200 dark:border-amber-800";
  const iconColor = isSuccess ? "text-green-600" : "text-amber-600";
  const titleColor = isSuccess
    ? "text-green-700 dark:text-green-400"
    : "text-amber-700 dark:text-amber-400";
  const textColor = isSuccess
    ? "text-green-800 dark:text-green-300"
    : "text-amber-800 dark:text-amber-300";

  return (
    <div className={`p-3 ${bgColor} rounded-md border ${borderColor}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <span className={`text-xs font-semibold ${titleColor}`}>{title}</span>
      </div>
      <ul className="space-y-1">
        {items.slice(0, 3).map((item, i) => (
          <li key={i} className={`text-xs ${textColor}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Score display with label
 */
interface ScoreDisplayProps {
  label: string;
  score: number;
  maxScore: number;
}

export function ScoreDisplay({ label, score, maxScore }: ScoreDisplayProps) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-lg font-bold">{score}/{maxScore}</p>
    </div>
  );
}

/**
 * Full Claude analysis card component
 */
interface ClaudeAnalysisCardProps {
  analysis: ClaudeAnalysis;
}

export function ClaudeAnalysisCard({ analysis }: ClaudeAnalysisCardProps) {
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          AI Coaching Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Overall Score</span>
              <span className="text-2xl font-bold text-primary">{analysis.overallScore}/100</span>
            </div>
            <Progress value={analysis.overallScore} className="h-2" />
          </div>
        </div>

        {/* Call Summary */}
        {analysis.callSummary && (
          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-sm">{analysis.callSummary}</p>
          </div>
        )}

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="objections">Objections</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 mt-3">
            {/* Strengths and Areas for Improvement */}
            <div className="grid grid-cols-2 gap-3">
              <FeedbackBox type="success" title="Strengths" items={analysis.strengths} />
              <FeedbackBox type="warning" title="Improve" items={analysis.areasForImprovement} />
            </div>

            {/* Talk Ratios */}
            <div className="grid grid-cols-2 gap-3">
              <TalkRatioBar
                label="Talk Ratio"
                percentage={analysis.talkRatio.rep}
                colorClass="bg-primary"
                displayText={`${analysis.talkRatio.rep}% Rep`}
              />
              <TalkRatioBar
                label="Prospect Speaking"
                percentage={analysis.talkRatio.prospect}
                colorClass="bg-green-500"
                displayText={`${analysis.talkRatio.prospect}%`}
              />
            </div>
          </TabsContent>

          <TabsContent value="questions" className="space-y-3 mt-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <ScoreDisplay label="Question Quality Score" score={analysis.questionQuality.score} maxScore={10} />
              <div className="text-right">
                <div className="flex gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Open-ended</span>
                    <p className="text-sm font-medium text-green-600">{analysis.questionQuality.openEnded}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Closed</span>
                    <p className="text-sm font-medium text-amber-600">{analysis.questionQuality.closedEnded}</p>
                  </div>
                </div>
              </div>
            </div>
            {analysis.questionQuality.notes && (
              <p className="text-xs text-muted-foreground">{analysis.questionQuality.notes}</p>
            )}
          </TabsContent>

          <TabsContent value="objections" className="space-y-3 mt-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <span className="text-xs text-muted-foreground">Objection Handling Score</span>
              <p className="text-lg font-bold">{analysis.objectionHandling.score}/10</p>
            </div>
            {analysis.objectionHandling.objections.length > 0 && (
              <div>
                <span className="text-xs font-semibold">Objections Raised:</span>
                <ul className="mt-1 space-y-1">
                  {analysis.objectionHandling.objections.map((obj, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.objectionHandling.notes && (
              <p className="text-xs text-muted-foreground mt-2">{analysis.objectionHandling.notes}</p>
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-3 mt-3">
            {analysis.recommendedActions.length > 0 && (
              <div>
                <span className="text-xs font-semibold">Recommended Actions:</span>
                <ul className="mt-2 space-y-2">
                  {analysis.recommendedActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 p-2 bg-muted/50 rounded text-xs">
                      <Target className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.nextSteps.length > 0 && (
              <div className="mt-3">
                <span className="text-xs font-semibold">Next Steps:</span>
                <ul className="mt-1 space-y-1">
                  {analysis.nextSteps.map((step, i) => (
                    <li key={i} className="text-xs text-muted-foreground">
                      {"\u2022"} {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

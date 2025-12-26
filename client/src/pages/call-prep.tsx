import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone,
  Mail,
  Building2,
  User,
  Target,
  MessageSquare,
  HelpCircle,
  Shield,
  ArrowLeft,
  Flame,
  Zap,
  TrendingUp,
  Snowflake,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Briefcase,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { SiLinkedin } from "react-icons/si";
import type { Lead, ResearchPacket } from "@shared/schema";
import { useState } from "react";

export default function CallPrepPage() {
  const params = useParams<{ leadId: string }>();
  const [, navigate] = useLocation();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: leadDetail, isLoading } = useQuery<{ lead: Lead; researchPacket: ResearchPacket | null }>({
    queryKey: ["/api/leads", params.leadId],
    enabled: !!params.leadId,
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!leadDetail) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="font-medium">Lead not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/leads")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  const { lead, researchPacket } = leadDetail;

  const getPriorityDisplay = (priority: string | null) => {
    const config: Record<string, { icon: JSX.Element; color: string; label: string }> = {
      hot: { icon: <Flame className="h-4 w-4" />, color: "text-red-600 bg-red-100 dark:bg-red-900/30", label: "HOT" },
      warm: { icon: <Zap className="h-4 w-4" />, color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30", label: "WARM" },
      cool: { icon: <TrendingUp className="h-4 w-4" />, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30", label: "COOL" },
      cold: { icon: <Snowflake className="h-4 w-4" />, color: "text-slate-500 bg-slate-100 dark:bg-slate-800/50", label: "COLD" },
    };
    if (!priority || !config[priority]) return null;
    const { icon, color, label } = config[priority];
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${color}`}>
        {icon}
        {label}
      </div>
    );
  };

  const getFitScoreDisplay = (score: number | null) => {
    if (!score) return null;
    const color = score >= 70 ? "text-green-600" : score >= 40 ? "text-yellow-600" : "text-red-600";
    const bg = score >= 70 ? "bg-green-100 dark:bg-green-900/30" : 
               score >= 40 ? "bg-yellow-100 dark:bg-yellow-900/30" : 
               "bg-red-100 dark:bg-red-900/30";
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${bg}`}>
        <Target className={`h-4 w-4 ${color}`} />
        <span className={`font-mono font-bold ${color}`}>{score}</span>
      </div>
    );
  };

  const extractOpeningLine = (talkTrack: string | null) => {
    if (!talkTrack) return null;
    const lines = talkTrack.split('\n');
    const openingIndex = lines.findIndex(l => l.toLowerCase().includes('opening'));
    if (openingIndex >= 0 && openingIndex < lines.length - 1) {
      return lines[openingIndex + 1]?.trim();
    }
    return lines[0]?.replace(/^Opening Line:\s*/i, '').trim();
  };

  const extractTheAsk = (talkTrack: string | null) => {
    if (!talkTrack) return null;
    const lines = talkTrack.split('\n');
    const askIndex = lines.findIndex(l => l.toLowerCase().includes('the ask'));
    if (askIndex >= 0 && askIndex < lines.length - 1) {
      return lines[askIndex + 1]?.trim();
    }
    return null;
  };

  const formatQuestions = (questions: string | null) => {
    if (!questions) return [];
    return questions.split('\n').filter(q => q.trim()).map(q => 
      q.replace(/^\d+\.\s*/, '').trim()
    );
  };

  const openingLine = extractOpeningLine(researchPacket?.talkTrack || null);
  const theAsk = extractTheAsk(researchPacket?.talkTrack || null);
  const questions = formatQuestions(researchPacket?.discoveryQuestions || null);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b bg-muted/30 px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/leads")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm text-muted-foreground font-medium">CALL PREP</span>
        </div>

        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">{lead.contactName}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                {lead.companyName}
              </span>
              {lead.contactTitle && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  {lead.contactTitle}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getFitScoreDisplay(researchPacket?.fitScore || lead.fitScore)}
            {getPriorityDisplay(researchPacket?.priority || lead.priority)}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          {lead.contactPhone && (
            <Button size="sm" className="gap-2" onClick={() => navigate(`/coaching?phone=${encodeURIComponent(lead.contactPhone || "")}&leadId=${lead.id}`)}>
              <Phone className="h-4 w-4" />
              {lead.contactPhone}
            </Button>
          )}
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-2"
            onClick={() => copyToClipboard(lead.contactEmail, 'email')}
          >
            <Mail className="h-4 w-4" />
            {lead.contactEmail}
            {copiedField === 'email' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </Button>
          {lead.contactLinkedIn && (
            <Button size="sm" variant="outline" className="gap-2" asChild>
              <a href={lead.contactLinkedIn} target="_blank" rel="noopener noreferrer">
                <SiLinkedin className="h-4 w-4" />
                LinkedIn
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          {!researchPacket ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium mb-1">No Intel Available</p>
                <p className="text-sm text-muted-foreground">
                  Generate a dossier from the Leads page before your call
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {openingLine && (
                <PrepCard 
                  icon={MessageSquare} 
                  title="Opening Line" 
                  variant="highlight"
                  highlightColor="blue"
                >
                  <p className="text-lg leading-relaxed">{openingLine}</p>
                </PrepCard>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <PrepCard icon={Building2} title="Company Intel">
                  <CompactText content={researchPacket.companyIntel} />
                </PrepCard>

                <PrepCard icon={User} title="Contact Intel">
                  <CompactText content={researchPacket.contactIntel} />
                </PrepCard>
              </div>

              {researchPacket.painSignals && (
                <PrepCard 
                  icon={AlertTriangle} 
                  title="Pain Signals" 
                  variant="highlight"
                  highlightColor="red"
                >
                  <CompactText content={researchPacket.painSignals} />
                </PrepCard>
              )}

              {questions.length > 0 && (
                <PrepCard icon={HelpCircle} title="Discovery Questions">
                  <div className="space-y-2">
                    {questions.slice(0, 5).map((q, i) => (
                      <div key={i} className="flex items-start gap-3 p-2 rounded-md bg-muted/50">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <p className="text-sm pt-0.5">{q}</p>
                      </div>
                    ))}
                  </div>
                </PrepCard>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <PrepCard icon={Target} title="Portfolio Fit">
                  <CompactText content={researchPacket.fitAnalysis} />
                </PrepCard>

                <PrepCard icon={Shield} title="Objection Handles">
                  <CompactText content={researchPacket.objectionHandles} lines={8} />
                </PrepCard>
              </div>

              {theAsk && (
                <PrepCard 
                  icon={Target} 
                  title="The Ask" 
                  variant="highlight"
                  highlightColor="green"
                >
                  <p className="text-lg font-medium">{theAsk}</p>
                </PrepCard>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function PrepCard({
  icon: Icon,
  title,
  children,
  variant = "default",
  highlightColor
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  variant?: "default" | "highlight";
  highlightColor?: "red" | "green" | "blue" | "yellow";
}) {
  const highlightStyles: Record<string, string> = {
    red: "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20",
    green: "border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20",
    blue: "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20",
    yellow: "border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20",
  };

  const cardClass = variant === "highlight" && highlightColor
    ? `rounded-lg p-4 ${highlightStyles[highlightColor]}`
    : "rounded-lg p-4 bg-muted/30 border";

  return (
    <div className={cardClass}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function CompactText({ content, lines = 6 }: { content: string | null; lines?: number }) {
  if (!content) return null;

  const textLines = content.split('\n').filter(l => l.trim());
  const displayLines = textLines.slice(0, lines);
  
  return (
    <div className="space-y-1 text-sm">
      {displayLines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\./.test(trimmed)) {
          const cleanText = trimmed.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
          return (
            <div key={i} className="flex items-start gap-2">
              <ChevronRight className="h-3 w-3 mt-1 text-muted-foreground shrink-0" />
              <span className="text-foreground/90">{cleanText}</span>
            </div>
          );
        }
        if (trimmed.endsWith(':') && trimmed.length < 50) {
          return <p key={i} className="font-medium mt-2 text-foreground">{trimmed}</p>;
        }
        return <p key={i} className="text-foreground/90">{trimmed}</p>;
      })}
      {textLines.length > lines && (
        <p className="text-muted-foreground text-xs mt-2">
          +{textLines.length - lines} more lines...
        </p>
      )}
    </div>
  );
}

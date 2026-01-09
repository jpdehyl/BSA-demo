import { useState } from "react";
import { motion, Reorder } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  User,
  Phone,
  Mail,
  ExternalLink,
  Target,
  TrendingUp,
  Loader2,
  Flame,
  Zap,
  Snowflake
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";

interface LeadWithResearch extends Lead {
  hasResearch: boolean;
  researchStatus: string | null;
}

interface KanbanStage {
  id: string;
  label: string;
  color: string;
}

const stages: KanbanStage[] = [
  { id: "new", label: "New Lead", color: "bg-slate-100 dark:bg-slate-800" },
  { id: "researching", label: "Researching", color: "bg-blue-50 dark:bg-blue-950" },
  { id: "researched", label: "Researched", color: "bg-purple-50 dark:bg-purple-950" },
  { id: "contacted", label: "Contacted", color: "bg-cyan-50 dark:bg-cyan-950" },
  { id: "engaged", label: "Engaged", color: "bg-amber-50 dark:bg-amber-950" },
  { id: "qualified", label: "Qualified", color: "bg-green-50 dark:bg-green-950" },
  { id: "handed_off", label: "Handed Off", color: "bg-teal-50 dark:bg-teal-950" },
  { id: "won", label: "Won", color: "bg-emerald-50 dark:bg-emerald-950" },
  { id: "lost", label: "Lost", color: "bg-red-50 dark:bg-red-950" },
];

interface KanbanBoardProps {
  leads: LeadWithResearch[];
  onLeadClick: (lead: LeadWithResearch) => void;
}

export function KanbanBoard({ leads, onLeadClick }: KanbanBoardProps) {
  const { toast } = useToast();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/leads/${leadId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Could not update lead status",
        variant: "destructive"
      });
    }
  });

  const groupedLeads = stages.reduce((acc, stage) => {
    acc[stage.id] = leads.filter(lead => lead.status === stage.id);
    return acc;
  }, {} as Record<string, LeadWithResearch[]>);

  const handleDragEnd = (leadId: string, newStatus: string) => {
    updateStatusMutation.mutate({ leadId, status: newStatus });
  };

  return (
    <div className="flex gap-3 h-full overflow-x-auto pb-4">
      {stages.map(stage => (
        <KanbanColumn
          key={stage.id}
          stage={stage}
          leads={groupedLeads[stage.id] || []}
          onLeadClick={onLeadClick}
          onDragEnd={(leadId) => handleDragEnd(leadId, stage.id)}
        />
      ))}
    </div>
  );
}

interface KanbanColumnProps {
  stage: KanbanStage;
  leads: LeadWithResearch[];
  onLeadClick: (lead: LeadWithResearch) => void;
  onDragEnd: (leadId: string) => void;
}

function KanbanColumn({ stage, leads, onLeadClick, onDragEnd }: KanbanColumnProps) {
  return (
    <div className="flex-shrink-0 w-80">
      <div className="mb-3 sticky top-0 z-10 bg-background/95 backdrop-blur pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight">{stage.label}</h3>
          <Badge variant="secondary" className="font-mono text-xs">
            {leads.length}
          </Badge>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-240px)]">
        <div className="space-y-2 pr-2">
          {leads.length === 0 ? (
            <div className={`${stage.color} rounded-lg p-6 text-center border-2 border-dashed border-border/50`}>
              <p className="text-xs text-muted-foreground">No leads</p>
            </div>
          ) : (
            leads.map(lead => (
              <KanbanCard
                key={lead.id}
                lead={lead}
                onClick={() => onLeadClick(lead)}
                onDragEnd={() => onDragEnd(lead.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface KanbanCardProps {
  lead: LeadWithResearch;
  onClick: () => void;
  onDragEnd: () => void;
}

function KanbanCard({ lead, onClick, onDragEnd }: KanbanCardProps) {
  const getPriorityIcon = (priority: string | null) => {
    switch (priority) {
      case "hot": return <Flame className="h-3 w-3 text-red-500" />;
      case "warm": return <Zap className="h-3 w-3 text-orange-500" />;
      case "cool": return <TrendingUp className="h-3 w-3 text-blue-500" />;
      case "cold": return <Snowflake className="h-3 w-3 text-slate-400" />;
      default: return null;
    }
  };

  const getFitScoreColor = (score: number | null) => {
    if (score === null || score === undefined) return "text-muted-foreground";
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <motion.div
      layout
      drag
      dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
      dragElastic={0.1}
      dragSnapToOrigin={true}
      onDragEnd={onDragEnd}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      className="cursor-move"
    >
      <Card
        onClick={onClick}
        className="p-4 border-0 shadow-sm bg-card hover:shadow-md transition-all duration-200"
        data-testid={`kanban-card-${lead.id}`}
      >
        <div className="space-y-3">
          {/* Header with name and priority */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <h4 className="font-semibold text-sm truncate">{lead.contactName}</h4>
                {getPriorityIcon(lead.priority)}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" />
                <span className="truncate">{lead.companyName}</span>
              </div>
            </div>

            {/* Fit Score */}
            {lead.fitScore !== null && lead.fitScore !== undefined && (
              <div className="flex flex-col items-end shrink-0">
                <div className={`text-2xl font-bold font-mono ${getFitScoreColor(lead.fitScore)}`}>
                  {lead.fitScore}
                </div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">fit</span>
              </div>
            )}
          </div>

          {/* Contact Info */}
          {(lead.contactEmail || lead.contactPhone) && (
            <div className="space-y-1">
              {lead.contactEmail && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{lead.contactEmail}</span>
                </div>
              )}
              {lead.contactPhone && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span className="truncate">{lead.contactPhone}</span>
                </div>
              )}
            </div>
          )}

          {/* Research Badge */}
          {lead.hasResearch && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  Intel Available
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

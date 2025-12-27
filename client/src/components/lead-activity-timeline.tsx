import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  FileText,
  Play,
  ChevronDown,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Target
} from "lucide-react";
import type { CallSession } from "@shared/schema";
import { useState } from "react";

interface LeadActivityTimelineProps {
  callHistory: CallSession[];
  isLoading?: boolean;
  onPlayRecording?: (recordingUrl: string) => void;
  onViewTranscript?: (callSession: CallSession) => void;
}

export function LeadActivityTimeline({ 
  callHistory, 
  isLoading = false,
  onPlayRecording,
  onViewTranscript
}: LeadActivityTimelineProps) {
  const [expandedCalls, setExpandedCalls] = useState<Set<string>>(new Set());

  const toggleExpanded = (callId: string) => {
    const newExpanded = new Set(expandedCalls);
    if (newExpanded.has(callId)) {
      newExpanded.delete(callId);
    } else {
      newExpanded.add(callId);
    }
    setExpandedCalls(newExpanded);
  };

  const getDispositionDisplay = (disposition: string | null) => {
    const config: Record<string, { icon: JSX.Element; color: string; label: string }> = {
      'connected': { icon: <CheckCircle className="h-3 w-3" />, color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300", label: "Connected" },
      'voicemail': { icon: <MessageSquare className="h-3 w-3" />, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300", label: "Voicemail" },
      'no-answer': { icon: <XCircle className="h-3 w-3" />, color: "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300", label: "No Answer" },
      'busy': { icon: <AlertCircle className="h-3 w-3" />, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", label: "Busy" },
      'callback-scheduled': { icon: <Calendar className="h-3 w-3" />, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", label: "Callback Scheduled" },
      'not-interested': { icon: <XCircle className="h-3 w-3" />, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", label: "Not Interested" },
      'qualified': { icon: <Target className="h-3 w-3" />, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300", label: "Qualified" },
      'meeting-booked': { icon: <CheckCircle className="h-3 w-3" />, color: "bg-green-200 text-green-800 dark:bg-green-800/40 dark:text-green-200", label: "Meeting Booked" },
    };
    if (!disposition || !config[disposition]) return null;
    return config[disposition];
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (callHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[150px] text-muted-foreground">
            <Phone className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No calls recorded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Activity Timeline ({callHistory.length} calls)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3 pr-2">
            {callHistory.map((call) => {
              const dispositionDisplay = getDispositionDisplay(call.disposition);
              const isExpanded = expandedCalls.has(call.id);
              
              return (
                <div key={call.id} className="relative pl-6 border-l-2 border-muted">
                  <div className="absolute left-[-9px] top-0 bg-background p-1">
                    {call.direction === 'inbound' ? (
                      <PhoneIncoming className="h-4 w-4 text-blue-500" />
                    ) : (
                      <PhoneOutgoing className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  
                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(call.id)}>
                    <div className="p-3 rounded-md bg-muted/30 hover-elevate">
                      <CollapsibleTrigger className="w-full text-left">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {call.direction === 'inbound' ? 'Inbound' : 'Outbound'} Call
                            </span>
                            {dispositionDisplay && (
                              <Badge variant="outline" className={`text-xs ${dispositionDisplay.color}`}>
                                {dispositionDisplay.icon}
                                <span className="ml-1">{dispositionDisplay.label}</span>
                              </Badge>
                            )}
                          </div>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(call.startedAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(call.duration)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {call.status}
                          </Badge>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="mt-3 pt-3 border-t border-border/50">
                        <div className="space-y-3">
                          {call.keyTakeaways && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Key Takeaways</p>
                              <p className="text-sm">{call.keyTakeaways}</p>
                            </div>
                          )}
                          
                          {call.nextSteps && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Next Steps</p>
                              <p className="text-sm">{call.nextSteps}</p>
                            </div>
                          )}
                          
                          {call.sdrNotes && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                              <p className="text-sm">{call.sdrNotes}</p>
                            </div>
                          )}
                          
                          {call.callbackDate && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              <span>Callback: {formatDate(call.callbackDate)}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 pt-2">
                            {call.recordingUrl && onPlayRecording && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => onPlayRecording(call.recordingUrl!)}
                                data-testid={`button-play-recording-${call.id}`}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Play Recording
                              </Button>
                            )}
                            {call.transcriptText && onViewTranscript && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => onViewTranscript(call)}
                                data-testid={`button-view-transcript-${call.id}`}
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                View Transcript
                              </Button>
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

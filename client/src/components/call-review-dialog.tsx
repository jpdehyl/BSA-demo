import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  User, 
  Clock, 
  Calendar,
  FileText,
  Play,
  Pause,
  Save,
  Loader2,
  Star,
  Building2,
  Mail
} from "lucide-react";
import type { CallSession, Lead } from "@shared/schema";

interface CallReviewData {
  callSession: CallSession;
  lead: Lead | null;
  caller: { id: string; name: string; email: string; role: string } | null;
}

interface CallReviewDialogProps {
  callId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDisposition(disposition: string): string {
  const map: Record<string, string> = {
    "connected": "Connected",
    "voicemail": "Voicemail",
    "no-answer": "No Answer",
    "busy": "Busy",
    "callback-scheduled": "Callback Scheduled",
    "not-interested": "Not Interested",
    "qualified": "Qualified",
    "meeting-booked": "Meeting Booked",
  };
  return map[disposition] || disposition;
}

function getDispositionColor(disposition: string): string {
  const colors: Record<string, string> = {
    "connected": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    "qualified": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    "meeting-booked": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    "voicemail": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    "callback-scheduled": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    "not-interested": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    "no-answer": "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400",
    "busy": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  };
  return colors[disposition] || "bg-muted text-muted-foreground";
}

export function CallReviewDialog({ callId, open, onOpenChange }: CallReviewDialogProps) {
  const { toast } = useToast();
  const [managerSummary, setManagerSummary] = useState("");
  const [coachingNotes, setCoachingNotes] = useState("");
  const [sentimentScore, setSentimentScore] = useState<number[]>([3]);
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: reviewData, isLoading } = useQuery<CallReviewData>({
    queryKey: ["/api/manager/call-review", callId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/call-review/${callId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch call review data");
      return res.json();
    },
    enabled: !!callId && open,
  });

  const saveNotesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/manager/call-review/${callId}/notes`, {
        managerSummary,
        coachingNotes,
        sentimentScore: sentimentScore[0],
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Notes Saved", description: "Your review notes have been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/manager/oversight"] });
      queryClient.invalidateQueries({ queryKey: ["/api/manager/call-review", callId] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save notes.", variant: "destructive" });
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setManagerSummary("");
      setCoachingNotes("");
      setSentimentScore([3]);
      setIsPlaying(false);
    } else if (reviewData?.callSession) {
      setManagerSummary(reviewData.callSession.managerSummary || "");
      setCoachingNotes(reviewData.callSession.coachingNotes || "");
      setSentimentScore([reviewData.callSession.sentimentScore || 3]);
    }
    onOpenChange(newOpen);
  };

  if (!callId) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Review
          </DialogTitle>
          <DialogDescription>
            Review call recording, transcript, and add coaching notes
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : reviewData ? (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Call Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{reviewData.callSession.toNumber || reviewData.callSession.fromNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {reviewData.callSession.startedAt 
                          ? new Date(reviewData.callSession.startedAt).toLocaleString() 
                          : "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {reviewData.callSession.duration 
                          ? `${Math.floor(reviewData.callSession.duration / 60)}m ${reviewData.callSession.duration % 60}s`
                          : "Unknown duration"}
                      </span>
                    </div>
                    {reviewData.callSession.disposition && (
                      <div className="flex items-center gap-2">
                        <Badge className={getDispositionColor(reviewData.callSession.disposition)}>
                          {formatDisposition(reviewData.callSession.disposition)}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Caller & Lead</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {reviewData.caller && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{reviewData.caller.name}</span>
                        <Badge variant="outline" className="text-xs">{reviewData.caller.role}</Badge>
                      </div>
                    )}
                    {reviewData.lead && (
                      <>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{reviewData.lead.contactName}</span>
                        </div>
                        {reviewData.lead.companyName && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{reviewData.lead.companyName}</span>
                          </div>
                        )}
                        {reviewData.lead.contactEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{reviewData.lead.contactEmail}</span>
                          </div>
                        )}
                      </>
                    )}
                    {!reviewData.lead && (
                      <p className="text-muted-foreground">No lead associated</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {reviewData.callSession.recordingUrl && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Recording
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <audio 
                      controls 
                      className="w-full"
                      src={reviewData.callSession.recordingUrl}
                      data-testid="audio-recording"
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </CardContent>
                </Card>
              )}

              {reviewData.callSession.transcriptText && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Transcript
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px] rounded-md border p-3 bg-muted/30">
                      <pre className="whitespace-pre-wrap text-sm font-mono">
                        {reviewData.callSession.transcriptText}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {reviewData.callSession.sdrNotes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">SDR Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{reviewData.callSession.sdrNotes}</p>
                    {reviewData.callSession.keyTakeaways && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">Key Takeaways:</p>
                        <p className="text-sm">{reviewData.callSession.keyTakeaways}</p>
                      </div>
                    )}
                    {reviewData.callSession.nextSteps && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">Next Steps:</p>
                        <p className="text-sm">{reviewData.callSession.nextSteps}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Manager Review</h3>

                <div className="space-y-2">
                  <Label htmlFor="sentiment">Call Quality Score</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="sentiment"
                      value={sentimentScore}
                      onValueChange={setSentimentScore}
                      min={1}
                      max={5}
                      step={1}
                      className="flex-1"
                      data-testid="slider-sentiment"
                    />
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <Star
                          key={score}
                          className={`h-4 w-4 ${
                            score <= sentimentScore[0]
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="managerSummary">Manager Summary</Label>
                  <Textarea
                    id="managerSummary"
                    placeholder="Overall assessment of the call..."
                    value={managerSummary}
                    onChange={(e) => setManagerSummary(e.target.value)}
                    className="min-h-[80px]"
                    data-testid="input-manager-summary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coachingNotes">Coaching Notes</Label>
                  <Textarea
                    id="coachingNotes"
                    placeholder="Specific feedback and areas for improvement..."
                    value={coachingNotes}
                    onChange={(e) => setCoachingNotes(e.target.value)}
                    className="min-h-[80px]"
                    data-testid="input-coaching-notes"
                  />
                </div>

                <Button 
                  onClick={() => saveNotesMutation.mutate()}
                  disabled={saveNotesMutation.isPending}
                  className="w-full"
                  data-testid="button-save-review"
                >
                  {saveNotesMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Review
                </Button>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Call not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

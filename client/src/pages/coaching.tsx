import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Softphone } from "@/components/softphone";
import { Phone, MessageSquare, Clock, Activity } from "lucide-react";

export default function CoachingPage() {
  const [currentCall, setCurrentCall] = useState<string | null>(null);

  const handleCallStart = (phoneNumber: string) => {
    setCurrentCall(phoneNumber);
  };

  const handleCallEnd = () => {
    setCurrentCall(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Live Coaching</h1>
        <p className="text-muted-foreground">
          Make calls and receive real-time AI coaching tips during your conversations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Softphone onCallStart={handleCallStart} onCallEnd={handleCallEnd} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Live Transcript
                </CardTitle>
                <CardDescription>
                  Real-time transcription of your call
                </CardDescription>
              </div>
              {currentCall && (
                <Badge variant="secondary" data-testid="badge-active-call">
                  <Phone className="h-3 w-3 mr-1" />
                  {currentCall}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {currentCall ? (
                <div className="min-h-[200px] bg-muted/30 rounded-md p-4 font-mono text-sm">
                  <p className="text-muted-foreground italic">
                    Transcription will appear here when the call starts...
                  </p>
                </div>
              ) : (
                <div className="min-h-[200px] flex items-center justify-center text-muted-foreground">
                  <p>Start a call to see the live transcript</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                AI Coaching Tips
              </CardTitle>
              <CardDescription>
                Real-time suggestions to improve your conversation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentCall ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-900">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Listening for coaching opportunities...
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      AI tips will appear here as you speak with your prospect.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="min-h-[100px] flex items-center justify-center text-muted-foreground">
                  <p>Coaching tips will appear during active calls</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold" data-testid="text-calls-today">0</p>
                    <p className="text-sm text-muted-foreground">Calls Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                    <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold" data-testid="text-talk-time">0:00</p>
                    <p className="text-sm text-muted-foreground">Talk Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                    <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold" data-testid="text-tips-received">0</p>
                    <p className="text-sm text-muted-foreground">Tips Received</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

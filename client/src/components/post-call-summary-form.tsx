import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Phone,
  CheckCircle,
  MessageSquare,
  XCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  Target,
  Save,
  Loader2,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PostCallSummaryFormProps {
  callSessionId: string;
  onSubmit: (data: CallOutcomeData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export interface CallOutcomeData {
  disposition: string;
  keyTakeaways: string;
  nextSteps: string;
  sdrNotes: string;
  callbackDate?: Date;
}

const DISPOSITIONS = [
  { value: 'connected', label: 'Connected', icon: CheckCircle, color: 'text-green-600' },
  { value: 'voicemail', label: 'Left Voicemail', icon: MessageSquare, color: 'text-yellow-600' },
  { value: 'no-answer', label: 'No Answer', icon: XCircle, color: 'text-gray-600' },
  { value: 'busy', label: 'Busy', icon: AlertCircle, color: 'text-orange-600' },
  { value: 'callback-scheduled', label: 'Callback Scheduled', icon: CalendarIcon, color: 'text-blue-600' },
  { value: 'not-interested', label: 'Not Interested', icon: XCircle, color: 'text-red-600' },
  { value: 'qualified', label: 'Qualified Lead', icon: Target, color: 'text-purple-600' },
  { value: 'meeting-booked', label: 'Meeting Booked', icon: CheckCircle, color: 'text-green-700' },
];

export function PostCallSummaryForm({
  callSessionId,
  onSubmit,
  onCancel,
  isSubmitting = false
}: PostCallSummaryFormProps) {
  const [disposition, setDisposition] = useState<string>('');
  const [keyTakeaways, setKeyTakeaways] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [sdrNotes, setSdrNotes] = useState('');
  const [callbackDate, setCallbackDate] = useState<Date | undefined>();
  const [suggestion, setSuggestion] = useState<{
    suggestedDisposition: string;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
  } | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(true);
  const [isSuggestionUsed, setIsSuggestionUsed] = useState(false);

  // Fetch AI suggestion when form loads
  useEffect(() => {
    const fetchSuggestion = async () => {
      try {
        const res = await fetch(`/api/call-sessions/${callSessionId}/suggested-disposition`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestion(data);
          // Auto-select the suggested disposition
          setDisposition(data.suggestedDisposition);
          setIsSuggestionUsed(true);
        }
      } catch (error) {
        console.error('Failed to fetch disposition suggestion:', error);
      } finally {
        setLoadingSuggestion(false);
      }
    };

    fetchSuggestion();
  }, [callSessionId]);

  const showCallbackPicker = disposition === 'callback-scheduled';

  // Track if user manually changes the disposition
  const handleDispositionChange = (value: string) => {
    setDisposition(value);
    if (value !== suggestion?.suggestedDisposition) {
      setIsSuggestionUsed(false);
    } else {
      setIsSuggestionUsed(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      disposition,
      keyTakeaways,
      nextSteps,
      sdrNotes,
      callbackDate
    });
  };

  const isFormValid = disposition && (keyTakeaways.trim() || nextSteps.trim() || sdrNotes.trim() || disposition === 'no-answer');

  return (
    <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Call Summary
        </CardTitle>
        <CardDescription>
          Log the outcome and key details from this call
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="disposition">Call Outcome</Label>
              {loadingSuggestion && (
                <Badge variant="outline" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analyzing...
                </Badge>
              )}
              {!loadingSuggestion && suggestion && isSuggestionUsed && (
                <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <Sparkles className="h-3 w-3" />
                  AI Suggested
                </Badge>
              )}
            </div>
            <Select value={disposition} onValueChange={handleDispositionChange}>
              <SelectTrigger id="disposition" data-testid="select-disposition">
                <SelectValue placeholder="Select outcome..." />
              </SelectTrigger>
              <SelectContent>
                {DISPOSITIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    <div className="flex items-center gap-2">
                      <d.icon className={`h-4 w-4 ${d.color}`} />
                      {d.label}
                      {suggestion?.suggestedDisposition === d.value && !loadingSuggestion && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Recommended
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {suggestion && !loadingSuggestion && (
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="capitalize">{suggestion.confidence}</strong> confidence: {suggestion.reason}
                </span>
              </p>
            )}
          </div>

          {showCallbackPicker && (
            <div className="space-y-2">
              <Label>Callback Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !callbackDate && "text-muted-foreground"
                    )}
                    data-testid="button-callback-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {callbackDate ? format(callbackDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={callbackDate}
                    onSelect={setCallbackDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="keyTakeaways">Key Takeaways</Label>
            <Textarea
              id="keyTakeaways"
              placeholder="What were the main points discussed? Any pain points uncovered?"
              value={keyTakeaways}
              onChange={(e) => setKeyTakeaways(e.target.value)}
              className="min-h-[80px] resize-none"
              data-testid="textarea-key-takeaways"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextSteps">Next Steps</Label>
            <Textarea
              id="nextSteps"
              placeholder="What are the agreed next steps? Any follow-up actions?"
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              className="min-h-[60px] resize-none"
              data-testid="textarea-next-steps"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sdrNotes">Additional Notes</Label>
            <Textarea
              id="sdrNotes"
              placeholder="Any other observations or notes for the AE..."
              value={sdrNotes}
              onChange={(e) => setSdrNotes(e.target.value)}
              className="min-h-[60px] resize-none"
              data-testid="textarea-sdr-notes"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button 
              type="submit" 
              disabled={!isFormValid || isSubmitting}
              className="flex-1"
              data-testid="button-save-summary"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Summary
                </>
              )}
            </Button>
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                data-testid="button-cancel-summary"
              >
                Skip
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

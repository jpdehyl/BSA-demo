import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Phone, 
  Mail, 
  Building2, 
  User, 
  Loader2,
  ExternalLink,
  Target,
  MessageSquare,
  Clock,
  Flame,
  CheckCircle2,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  FileText,
  Sparkles,
  ArrowRight,
  Briefcase,
  Globe,
  AlertCircle
} from "lucide-react";
import { SiLinkedin } from "react-icons/si";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead, ResearchPacket, CallSession } from "@shared/schema";

interface QualifiedLead extends Lead {
  hasResearch: boolean;
  researchStatus: string | null;
}

export default function AEPipelinePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<QualifiedLead | null>(null);
  const { toast } = useToast();

  const { data: leads = [], isLoading } = useQuery<QualifiedLead[]>({
    queryKey: ["/api/leads"],
  });

  const qualifiedLeads = leads.filter(l => 
    l.status === "qualified" || l.status === "handed_off"
  ).sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));

  const handedOffLeads = qualifiedLeads.filter(l => l.status === "handed_off");
  const readyForHandoff = qualifiedLeads.filter(l => l.status === "qualified");

  const { data: leadDetail, isLoading: detailLoading } = useQuery<{ 
    lead: Lead; 
    researchPacket: ResearchPacket | null;
    callHistory?: CallSession[];
  }>({
    queryKey: ["/api/leads", selectedLead?.id],
    enabled: !!selectedLead,
  });

  const filteredLeads = qualifiedLeads.filter(lead => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.companyName.toLowerCase().includes(query) ||
      lead.contactName.toLowerCase().includes(query) ||
      lead.contactEmail.toLowerCase().includes(query)
    );
  });

  const getPriorityIcon = (priority: string | null) => {
    switch (priority) {
      case "hot": return <Flame className="h-4 w-4 text-red-500" />;
      case "warm": return <TrendingUp className="h-4 w-4 text-orange-500" />;
      default: return <Target className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "handed_off":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Handed Off</Badge>;
      case "qualified":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Qualified</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-80 border-r flex flex-col bg-sidebar">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg mb-1">AE Pipeline</h2>
          <p className="text-sm text-muted-foreground">Qualified leads ready for closing</p>
          
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-md text-center">
              <p className="text-xl font-bold text-green-700 dark:text-green-400">{handedOffLeads.length}</p>
              <p className="text-xs text-green-600 dark:text-green-500">Handed Off</p>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md text-center">
              <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{readyForHandoff.length}</p>
              <p className="text-xs text-blue-600 dark:text-blue-500">Ready</p>
            </div>
          </div>
        </div>

        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-ae-leads"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No qualified leads yet</p>
              <p className="text-sm mt-1">SDRs will hand off qualified leads here</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredLeads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`w-full text-left p-3 rounded-md transition-colors ${
                    selectedLead?.id === lead.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover-elevate"
                  }`}
                  data-testid={`lead-card-${lead.id}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{lead.companyName}</span>
                    {getPriorityIcon(lead.priority)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="truncate">{lead.contactName}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {getStatusBadge(lead.status)}
                    {lead.fitScore !== null && (
                      <span className={`text-xs font-medium ${
                        lead.fitScore >= 80 ? "text-green-600" :
                        lead.fitScore >= 60 ? "text-orange-600" : "text-muted-foreground"
                      }`}>
                        {lead.fitScore}%
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex-1 overflow-hidden">
        {selectedLead ? (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl font-bold">{selectedLead.companyName}</h1>
                    {getStatusBadge(selectedLead.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {selectedLead.contactName}
                    </span>
                    {selectedLead.contactTitle && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {selectedLead.contactTitle}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedLead.fitScore !== null && (
                    <div className={`px-3 py-1.5 rounded-md ${
                      selectedLead.fitScore >= 80 ? "bg-green-100 dark:bg-green-900/30" :
                      selectedLead.fitScore >= 60 ? "bg-orange-100 dark:bg-orange-900/30" :
                      "bg-muted"
                    }`}>
                      <span className={`text-lg font-bold ${
                        selectedLead.fitScore >= 80 ? "text-green-700 dark:text-green-400" :
                        selectedLead.fitScore >= 60 ? "text-orange-700 dark:text-orange-400" :
                        "text-muted-foreground"
                      }`}>
                        {selectedLead.fitScore}%
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">fit</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        TOFU Summary
                      </CardTitle>
                      <CardDescription>Top of Funnel qualification from SDR</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {detailLoading ? (
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : leadDetail?.researchPacket ? (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              Company Intel
                            </h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {leadDetail.researchPacket.companyIntel}
                            </p>
                          </div>
                          <Separator />
                          <div>
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Contact Intel
                            </h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {leadDetail.researchPacket.contactIntel}
                            </p>
                          </div>
                          <Separator />
                          <div>
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              Pain Signals
                            </h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {leadDetail.researchPacket.painSignals}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-8 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No research available for this lead</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Qualification
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4" /> Budget
                          </span>
                          <span className="text-sm font-medium">
                            {selectedLead.budget || "TBD"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> Timeline
                          </span>
                          <span className="text-sm font-medium">
                            {selectedLead.timeline || "TBD"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4" /> Decision Makers
                          </span>
                          <span className="text-sm font-medium">
                            {selectedLead.decisionMakers || "TBD"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                          Buy Signals
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedLead.buySignals ? (
                          <p className="text-sm text-muted-foreground">{selectedLead.buySignals}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No buy signals recorded</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Contact Info
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${selectedLead.contactEmail}`} className="text-primary hover:underline">
                            {selectedLead.contactEmail}
                          </a>
                        </div>
                        {selectedLead.contactPhone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${selectedLead.contactPhone}`} className="text-primary hover:underline">
                              {selectedLead.contactPhone}
                            </a>
                          </div>
                        )}
                        {selectedLead.contactLinkedIn && (
                          <div className="flex items-center gap-2 text-sm">
                            <SiLinkedin className="h-4 w-4 text-[#0077b5]" />
                            <a href={selectedLead.contactLinkedIn} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              LinkedIn Profile
                            </a>
                          </div>
                        )}
                        {selectedLead.companyWebsite && (
                          <div className="flex items-center gap-2 text-sm">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a href={selectedLead.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              {selectedLead.companyWebsite}
                            </a>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {leadDetail?.researchPacket && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Sales Strategy
                      </CardTitle>
                      <CardDescription>AI-generated talk track and approach</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="talktrack">
                        <TabsList className="mb-4">
                          <TabsTrigger value="talktrack">Talk Track</TabsTrigger>
                          <TabsTrigger value="discovery">Discovery</TabsTrigger>
                          <TabsTrigger value="objections">Objections</TabsTrigger>
                          <TabsTrigger value="fit">Fit Analysis</TabsTrigger>
                        </TabsList>
                        <TabsContent value="talktrack">
                          <div className="p-4 bg-muted/30 rounded-md">
                            <p className="text-sm whitespace-pre-wrap">{leadDetail.researchPacket.talkTrack}</p>
                          </div>
                        </TabsContent>
                        <TabsContent value="discovery">
                          <div className="p-4 bg-muted/30 rounded-md">
                            <p className="text-sm whitespace-pre-wrap">{leadDetail.researchPacket.discoveryQuestions}</p>
                          </div>
                        </TabsContent>
                        <TabsContent value="objections">
                          <div className="p-4 bg-muted/30 rounded-md">
                            <p className="text-sm whitespace-pre-wrap">{leadDetail.researchPacket.objectionHandles}</p>
                          </div>
                        </TabsContent>
                        <TabsContent value="fit">
                          <div className="p-4 bg-muted/30 rounded-md">
                            <p className="text-sm whitespace-pre-wrap">{leadDetail.researchPacket.fitAnalysis}</p>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                )}

                {selectedLead.qualificationNotes && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        SDR Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{selectedLead.qualificationNotes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Target className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium mb-2">Select a Lead</h3>
              <p className="text-sm">Choose a qualified lead to view their complete dossier</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Building2, 
  User, 
  FileSearch, 
  Loader2,
  ExternalLink,
  Briefcase,
  Target,
  MessageSquare,
  HelpCircle,
  Shield,
  Lightbulb,
  Upload
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Lead, ResearchPacket } from "@shared/schema";

interface LeadWithResearch extends Lead {
  hasResearch: boolean;
  researchStatus: string | null;
}

export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadWithResearch | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: leads = [], isLoading } = useQuery<LeadWithResearch[]>({
    queryKey: ["/api/leads"],
  });

  const { data: leadDetail, isLoading: detailLoading } = useQuery<{ lead: Lead; researchPacket: ResearchPacket | null }>({
    queryKey: ["/api/leads", selectedLead?.id],
    enabled: !!selectedLead,
  });

  const researchMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const res = await apiRequest("POST", `/api/leads/${leadId}/research`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads", selectedLead?.id] });
      toast({ title: "Research complete", description: "Lead dossier has been generated" });
    },
    onError: () => {
      toast({ title: "Research failed", description: "Could not generate research for this lead", variant: "destructive" });
    },
  });

  const filteredLeads = leads.filter(lead => 
    lead.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.contactEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "contacted": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "qualified": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "lost": return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      default: return "bg-muted";
    }
  };

  const handleCallLead = (lead: LeadWithResearch) => {
    navigate(`/coaching?phone=${encodeURIComponent(lead.contactPhone || "")}&leadId=${lead.id}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="heading-leads">Contact Directory</h1>
          <p className="text-muted-foreground">
            Manage leads and access AI-powered research dossiers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowImportModal(true)} data-testid="button-import-leads">
            <Upload className="h-4 w-4 mr-2" />
            Import from Sheets
          </Button>
          <Button data-testid="button-add-lead">
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads by name, company, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-leads"
          />
        </div>
        <Badge variant="secondary" data-testid="text-lead-count">
          {filteredLeads.length} leads
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Leads</CardTitle>
              <CardDescription>Click a lead to view details</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredLeads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No leads found</p>
                    <p className="text-sm mt-1">Import leads from Google Sheets to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2 pr-2">
                    {filteredLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className={`p-3 rounded-md cursor-pointer hover-elevate ${
                          selectedLead?.id === lead.id ? "bg-accent" : "bg-muted/50"
                        }`}
                        data-testid={`lead-card-${lead.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{lead.contactName}</p>
                            <p className="text-sm text-muted-foreground truncate">{lead.companyName}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline" className={`text-xs ${getStatusColor(lead.status)}`}>
                              {lead.status}
                            </Badge>
                            {lead.hasResearch && (
                              <Badge variant="secondary" className="text-xs">
                                <FileSearch className="h-3 w-3 mr-1" />
                                Intel
                              </Badge>
                            )}
                          </div>
                        </div>
                        {lead.contactTitle && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{lead.contactTitle}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedLead ? (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {selectedLead.contactName}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Building2 className="h-4 w-4" />
                    {selectedLead.companyName}
                    {selectedLead.contactTitle && (
                      <span className="text-muted-foreground">- {selectedLead.contactTitle}</span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {selectedLead.contactPhone && (
                    <Button size="sm" onClick={() => handleCallLead(selectedLead)} data-testid="button-call-lead">
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                  )}
                  {selectedLead.contactEmail && (
                    <Button size="sm" variant="outline" asChild data-testid="button-email-lead">
                      <a href={`mailto:${selectedLead.contactEmail}`}>
                        <Mail className="h-4 w-4 mr-1" />
                        Email
                      </a>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <Badge className={getStatusColor(selectedLead.status)}>{selectedLead.status}</Badge>
                  {selectedLead.companyIndustry && (
                    <Badge variant="outline">{selectedLead.companyIndustry}</Badge>
                  )}
                  {selectedLead.companySize && (
                    <Badge variant="outline">{selectedLead.companySize} employees</Badge>
                  )}
                  {selectedLead.contactLinkedIn && (
                    <Button size="sm" variant="ghost" asChild>
                      <a href={selectedLead.contactLinkedIn} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                </div>

                <div className="mb-4 p-3 bg-muted/50 rounded-md">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{selectedLead.contactEmail}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-medium">{selectedLead.contactPhone || "Not provided"}</p>
                    </div>
                    {selectedLead.companyWebsite && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Website:</span>
                        <a 
                          href={selectedLead.companyWebsite.startsWith("http") ? selectedLead.companyWebsite : `https://${selectedLead.companyWebsite}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline ml-2"
                        >
                          {selectedLead.companyWebsite}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {!selectedLead.hasResearch ? (
                  <div className="text-center py-8 border rounded-md border-dashed">
                    <FileSearch className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="font-medium mb-1">No Research Dossier</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate AI-powered insights to prepare for your call
                    </p>
                    <Button 
                      onClick={() => researchMutation.mutate(selectedLead.id)}
                      disabled={researchMutation.isPending}
                      data-testid="button-generate-research"
                    >
                      {researchMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Researching...
                        </>
                      ) : (
                        <>
                          <FileSearch className="h-4 w-4 mr-2" />
                          Generate Dossier
                        </>
                      )}
                    </Button>
                  </div>
                ) : detailLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : leadDetail?.researchPacket ? (
                  <Tabs defaultValue="talk-track" className="w-full">
                    <TabsList className="grid grid-cols-4 w-full">
                      <TabsTrigger value="talk-track">Talk Track</TabsTrigger>
                      <TabsTrigger value="intel">Intel</TabsTrigger>
                      <TabsTrigger value="discovery">Discovery</TabsTrigger>
                      <TabsTrigger value="objections">Objections</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="talk-track" className="mt-4">
                      <div className="space-y-4">
                        <DossierSection 
                          icon={MessageSquare} 
                          title="Talk Track" 
                          content={leadDetail.researchPacket.talkTrack} 
                        />
                        <DossierSection 
                          icon={Target} 
                          title="Hawk Ridge Fit" 
                          content={leadDetail.researchPacket.fitAnalysis} 
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="intel" className="mt-4">
                      <div className="space-y-4">
                        <DossierSection 
                          icon={User} 
                          title="Contact Intel" 
                          content={leadDetail.researchPacket.contactIntel} 
                        />
                        <DossierSection 
                          icon={Building2} 
                          title="Company Intel" 
                          content={leadDetail.researchPacket.companyIntel} 
                        />
                        <DossierSection 
                          icon={Lightbulb} 
                          title="Pain Signals" 
                          content={leadDetail.researchPacket.painSignals} 
                        />
                        <DossierSection 
                          icon={Briefcase} 
                          title="Common Ground & Buying Triggers" 
                          content={leadDetail.researchPacket.companyHardIntel} 
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="discovery" className="mt-4">
                      <DossierSection 
                        icon={HelpCircle} 
                        title="Discovery Questions" 
                        content={leadDetail.researchPacket.discoveryQuestions} 
                      />
                    </TabsContent>
                    
                    <TabsContent value="objections" className="mt-4">
                      <div className="space-y-4">
                        <DossierSection 
                          icon={Shield} 
                          title="Objection Handles" 
                          content={leadDetail.researchPacket.objectionHandles} 
                        />
                        <DossierSection 
                          icon={Briefcase} 
                          title="Tech Stack / Competition" 
                          content={leadDetail.researchPacket.competitorPresence} 
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Loading research data...</p>
                  </div>
                )}

                {selectedLead.hasResearch && (
                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => researchMutation.mutate(selectedLead.id)}
                      disabled={researchMutation.isPending}
                      data-testid="button-refresh-research"
                    >
                      {researchMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <FileSearch className="h-4 w-4 mr-1" />
                      )}
                      Refresh Research
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <div className="text-center text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">Select a lead to view details</p>
                  <p className="text-sm mt-1">Click on any lead in the list to see their profile and research dossier</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ImportModal open={showImportModal} onOpenChange={setShowImportModal} />
    </div>
  );
}

function DossierSection({ 
  icon: Icon, 
  title, 
  content 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  title: string; 
  content: string | null;
}) {
  if (!content) return null;
  
  return (
    <div className="p-4 bg-muted/30 rounded-md">
      <h4 className="font-medium flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h4>
      <div className="text-sm whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    </div>
  );
}

const DEFAULT_LEADS_SPREADSHEET_ID = "1dEbs4B7oucHJmA8U0-VehfzQN3Yt54RRs6VQlWNxX2I";

function ImportModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [spreadsheetId, setSpreadsheetId] = useState(DEFAULT_LEADS_SPREADSHEET_ID);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const previewQuery = useQuery<{
    headers: string[];
    previewRows: string[][];
    totalRows: number;
    columnMapping: Record<string, number>;
  }>({
    queryKey: ["/api/leads/import/preview", spreadsheetId],
    enabled: false,
  });

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const res = await apiRequest("POST", "/api/leads/import", { spreadsheetId });
      const response = await res.json();
      
      toast({
        title: "Import complete",
        description: `Imported ${response.imported} leads. ${response.duplicates} duplicates skipped.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Could not import leads from the spreadsheet",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Leads from Google Sheets
          </DialogTitle>
          <DialogDescription>
            Connect to a Google Spreadsheet to import lead data
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Spreadsheet ID</label>
            <Input
              placeholder="Enter Google Spreadsheet ID"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              className="mt-1"
              data-testid="input-spreadsheet-id"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Find this in the spreadsheet URL: docs.google.com/spreadsheets/d/<strong>[ID]</strong>/edit
            </p>
          </div>

          <div className="p-3 bg-muted/50 rounded-md text-sm">
            <p className="font-medium mb-2">Required columns:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Company Name</li>
              <li>Contact Name</li>
              <li>Email</li>
            </ul>
            <p className="mt-2 text-muted-foreground">
              Optional: Title, Phone, LinkedIn, Website, Industry, Size
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!spreadsheetId || isImporting} data-testid="button-confirm-import">
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Leads
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

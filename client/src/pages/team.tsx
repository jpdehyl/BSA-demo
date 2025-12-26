import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { 
  Users, 
  User, 
  ChevronDown,
  Mail,
  Building2,
  Loader2
} from "lucide-react";
import type { Manager, Sdr } from "@shared/schema";

interface TeamData {
  teamByManager: { manager: Manager; sdrs: Sdr[] }[];
  unassignedSdrs: Sdr[];
  totalManagers: number;
  totalSdrs: number;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function TeamPage() {
  const { user } = useAuth();

  const { data: teamData, isLoading } = useQuery<TeamData>({
    queryKey: ["/api/team"],
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Team Directory</h1>
          <p className="text-muted-foreground">
            View all managers and sales development representatives
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {teamData?.totalManagers || 0} Managers
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {teamData?.totalSdrs || 0} SDRs
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {teamData?.teamByManager.map(({ manager, sdrs }) => (
          <Card key={manager.id}>
            <Collapsible defaultOpen>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(manager.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{manager.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          Sales Manager
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{sdrs.length} SDRs</Badge>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  {manager.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Mail className="h-4 w-4" />
                      {manager.email}
                    </div>
                  )}
                  {sdrs.length > 0 ? (
                    <div className="space-y-3">
                      {sdrs.map((sdr) => (
                        <div 
                          key={sdr.id}
                          className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-md"
                          data-testid={`sdr-card-${sdr.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(sdr.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{sdr.name}</p>
                              {sdr.email && (
                                <p className="text-xs text-muted-foreground">{sdr.email}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {sdr.email && (
                              <Button variant="ghost" size="icon" asChild>
                                <a href={`mailto:${sdr.email}`}>
                                  <Mail className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No SDRs assigned to this manager
                    </p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}

        {teamData?.unassignedSdrs && teamData.unassignedSdrs.length > 0 && (
          <Card>
            <Collapsible defaultOpen>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-muted">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">Unassigned SDRs</CardTitle>
                        <CardDescription>SDRs without a manager</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{teamData.unassignedSdrs.length} SDRs</Badge>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {teamData.unassignedSdrs.map((sdr) => (
                      <div 
                        key={sdr.id}
                        className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-md"
                        data-testid={`sdr-card-${sdr.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(sdr.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{sdr.name}</p>
                            {sdr.email && (
                              <p className="text-xs text-muted-foreground">{sdr.email}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {sdr.email && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={`mailto:${sdr.email}`}>
                                <Mail className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}
      </div>

      {(!teamData?.teamByManager || teamData.teamByManager.length === 0) && 
       (!teamData?.unassignedSdrs || teamData.unassignedSdrs.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No Team Members Yet</h3>
            <p className="text-muted-foreground">
              Team members will appear here once they're added to the system.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

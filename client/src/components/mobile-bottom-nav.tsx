import { useLocation, Link } from "wouter";
import { LayoutDashboard, FileSearch, Phone, Users, BarChart3 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: string[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    allowedRoles: ["admin", "manager", "sdr", "account_specialist"],
  },
  {
    title: "Leads",
    url: "/leads",
    icon: FileSearch,
    allowedRoles: ["admin", "manager", "sdr", "account_specialist"],
  },
  {
    title: "Calls",
    url: "/coaching",
    icon: Phone,
    allowedRoles: ["admin", "manager", "sdr", "account_specialist"],
  },
  {
    title: "Team",
    url: "/team",
    icon: Users,
    allowedRoles: ["admin", "manager"],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    allowedRoles: ["admin", "manager"],
  },
];

export function MobileBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  if (!isMobile || !user) return null;

  const filteredNavItems = navItems.filter((item) =>
    item.allowedRoles.includes(user.role)
  ).slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {filteredNavItems.map((item) => {
          const isActive = location === item.url || location.startsWith(item.url + "/");
          const Icon = item.icon;
          
          return (
            <Link key={item.url} href={item.url}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] min-h-[48px]",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive && "text-primary"
                )}>
                  {item.title}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

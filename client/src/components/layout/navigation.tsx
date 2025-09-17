import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Layers, BarChart3, Bolt, Search, Lightbulb, Brain, Menu, LogOut, User, Github, Workflow, BookOpen, TrendingUp, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const navGroups = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BarChart3,
    path: "/",
    testId: "nav-dashboard",
    single: true,
  },
  {
    id: "stack",
    label: "Stack",
    icon: Bolt,
    testId: "nav-stack-group",
    items: [
      {
        path: "/stack",
        icon: Bolt,
        label: "My Stack",
        testId: "nav-stack",
      },
      {
        path: "/intelligence",
        icon: Brain,
        label: "Stack Intelligence",
        testId: "nav-intelligence",
      },
    ],
  },
  {
    id: "discover",
    label: "Discover",
    icon: Search,
    testId: "nav-discover-group",
    items: [
      {
        path: "/discover",
        icon: Search,
        label: "Discover Bolt",
        testId: "nav-discover",
      },
      {
        path: "/discovery-hub",
        icon: TrendingUp,
        label: "Discovery Hub",
        testId: "nav-discovery-hub",
      },
    ],
  },
  {
    id: "build",
    label: "Build",
    icon: Workflow,
    testId: "nav-build-group",
    items: [
      {
        path: "/projects",
        icon: Workflow,
        label: "Projects",
        testId: "nav-projects",
      },
      {
        path: "/ideas",
        icon: Lightbulb,
        label: "Idea Lab",
        testId: "nav-ideas",
      },
      {
        path: "/import-repository",
        icon: Github,
        label: "Import Repository",
        testId: "nav-import-repository",
      },
    ],
  },
  {
    id: "docs",
    label: "Documentation",
    icon: BookOpen,
    path: "/docs",
    testId: "nav-documentation",
    single: true,
  },
];

export default function Navigation() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Helper function to check if any item in a group is active
  const isGroupActive = (group: any) => {
    if (group.single) {
      return location === group.path || (group.path !== '/' && location.startsWith(group.path));
    }
    return group.items?.some((item: any) => location === item.path || location.startsWith(item.path));
  };

  return (
    <nav className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Layers className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">StackWise</h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navGroups.map((group) => {
            const IconComponent = group.icon;
            const isActive = isGroupActive(group);
            
            // Single item groups render as buttons
            if (group.single && group.path) {
              return (
                <Link key={group.id} href={group.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="flex items-center space-x-2"
                    data-testid={group.testId}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{group.label}</span>
                  </Button>
                </Link>
              );
            }
            
            // Multi-item groups render as dropdown menus
            return (
              <DropdownMenu key={group.id}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="flex items-center space-x-2"
                    data-testid={group.testId}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{group.label}</span>
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {group.items?.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <DropdownMenuItem key={item.path} asChild>
                        <Link href={item.path} className="flex items-center space-x-2 w-full" data-testid={item.testId}>
                          <ItemIcon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex flex-col space-y-6 mt-8">
                {navGroups.map((group) => {
                  const IconComponent = group.icon;
                  
                  // Single item groups render as buttons
                  if (group.single && group.path) {
                    const isActive = location === group.path || (group.path !== '/' && location.startsWith(group.path));
                    return (
                      <Link key={group.id} href={group.path}>
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          className="w-full justify-start space-x-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                          data-testid={`mobile-${group.testId}`}
                        >
                          <IconComponent className="h-4 w-4" />
                          <span>{group.label}</span>
                        </Button>
                      </Link>
                    );
                  }
                  
                  // Multi-item groups render as grouped sections
                  return (
                    <div key={group.id} className="space-y-2">
                      <div className="flex items-center space-x-2 px-2 py-1">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          {group.label}
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {group.items?.map((item) => {
                          const ItemIcon = item.icon;
                          const isActive = location === item.path || location.startsWith(item.path);
                          
                          return (
                            <Link key={item.path} href={item.path}>
                              <Button
                                variant={isActive ? "default" : "ghost"}
                                className="w-full justify-start space-x-2 h-9"
                                onClick={() => setIsMobileMenuOpen(false)}
                                data-testid={`mobile-${item.testId}`}
                              >
                                <ItemIcon className="h-4 w-4" />
                                <span>{item.label}</span>
                              </Button>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>

          {/* User Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3" data-testid="button-user-menu">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-foreground">{user?.username}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import MyStack from "@/pages/my-stack";
import DiscoverTools from "@/pages/discover-tools";
import IdeaLab from "@/pages/idea-lab";
import StackIntelligence from "@/pages/stack-intelligence";
import ProjectTasksPage from "@/pages/project-tasks";
import ProjectDashboard from "@/pages/project-dashboard";
import { RepositoryImportPage } from "@/pages/repository-import";
import DocumentationHub from "@/pages/documentation-hub";
import DiscoveryHub from "@/pages/discovery-hub";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/stack" component={MyStack} />
      <ProtectedRoute path="/discover" component={DiscoverTools} />
      <ProtectedRoute path="/ideas" component={IdeaLab} />
      <ProtectedRoute path="/projects" component={() => <ProjectTasksPage />} />
      <ProtectedRoute path="/project-dashboard" component={ProjectDashboard} />
      <ProtectedRoute path="/intelligence" component={StackIntelligence} />
      <ProtectedRoute path="/import-repository" component={RepositoryImportPage} />
      <ProtectedRoute path="/docs" component={DocumentationHub} />
      <ProtectedRoute path="/docs/:slug" component={DocumentationHub} />
      <ProtectedRoute path="/docs/category/:slug" component={DocumentationHub} />
      <ProtectedRoute path="/docs/search" component={DocumentationHub} />
      <ProtectedRoute path="/discovery-hub" component={DiscoveryHub} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

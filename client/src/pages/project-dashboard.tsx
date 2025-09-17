import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  FolderOpen, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Target,
  BarChart3,
  Settings,
  FileText,
  Zap,
  Brain,
  Filter,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/layout/navigation";
import { Link } from "wouter";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'completed' | 'on_hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectType: string;
  startDate?: string;
  targetEndDate?: string;
  completionPercentage: number;
  totalBudget?: string;
  spentBudget?: string;
  teamSize: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
}

interface PortfolioAnalytics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBudget: number;
  spentBudget: number;
  averageCompletion: number;
  projectsByStatus: { status: string; count: number; percentage: number }[];
  projectsByType: { type: string; count: number }[];
  upcomingMilestones: number;
  overdueTasks: number;
  teamUtilization: number;
  budgetVariance: number;
}

interface PortfolioOverview {
  recentActivity: Array<{
    id: string;
    projectName: string;
    action: string;
    timestamp: string;
    actor: string;
  }>;
  criticalAlerts: Array<{
    id: string;
    type: 'budget' | 'timeline' | 'resource' | 'risk';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    projectId: string;
    projectName: string;
  }>;
  upcomingDeadlines: Array<{
    id: string;
    name: string;
    projectName: string;
    dueDate: string;
    type: 'milestone' | 'deliverable' | 'phase';
    status: string;
  }>;
}

export default function ProjectDashboard() {
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("updatedAt");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectType, setNewProjectType] = useState("");
  const { toast } = useToast();

  // Fetch user projects with filters
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", { 
      status: filterStatus, 
      projectType: filterType, 
      sortBy, 
      sortOrder,
      limit: 50 
    }],
  });

  // Fetch portfolio analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<PortfolioAnalytics>({
    queryKey: ["/api/projects/analytics/portfolio"],
  });

  // Fetch portfolio overview
  const { data: overview, isLoading: overviewLoading } = useQuery<PortfolioOverview>({
    queryKey: ["/api/projects/analytics/overview"],
  });

  // Create new project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: { name: string; projectType: string }) => {
      const response = await apiRequest("POST", "/api/projects", {
        ...projectData,
        description: `New ${projectData.projectType} project`,
        status: 'planning',
        priority: 'medium',
        completionPercentage: 0,
        teamSize: 1
      });
      return await response.json();
    },
    onSuccess: (newProject: Project) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/analytics/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/analytics/overview"] });
      setShowNewProjectDialog(false);
      setNewProjectName("");
      setNewProjectType("");
      toast({
        title: "Project created",
        description: `${newProject.name} has been created successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Filter projects based on search and filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchQuery || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || project.status === filterStatus;
    const matchesType = !filterType || project.projectType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 text-red-700 bg-red-50';
      case 'high': return 'border-orange-500 text-orange-700 bg-orange-50';
      case 'medium': return 'border-yellow-500 text-yellow-700 bg-yellow-50';
      case 'low': return 'border-green-500 text-green-700 bg-green-50';
      default: return 'border-gray-500 text-gray-700 bg-gray-50';
    }
  };

  // Get alert severity color
  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  // Handle new project creation
  const handleCreateProject = () => {
    if (!newProjectName.trim() || !newProjectType) {
      toast({
        title: "Validation Error",
        description: "Please provide both project name and type.",
        variant: "destructive",
      });
      return;
    }
    
    createProjectMutation.mutate({
      name: newProjectName.trim(),
      projectType: newProjectType
    });
  };

  // Calculate trend indicators
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (projectsLoading || analyticsLoading || overviewLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8" data-testid="dashboard-header">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Project Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your project portfolio and track progress across all initiatives
            </p>
          </div>
          
          <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-project" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Start a new project with comprehensive planning and tracking capabilities.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Project Name</label>
                  <Input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name"
                    data-testid="input-project-name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Project Type</label>
                  <Select value={newProjectType} onValueChange={setNewProjectType}>
                    <SelectTrigger data-testid="select-project-type">
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web_app">Web Application</SelectItem>
                      <SelectItem value="mobile_app">Mobile Application</SelectItem>
                      <SelectItem value="api">API Service</SelectItem>
                      <SelectItem value="saas">SaaS Platform</SelectItem>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="ai_ml">AI/ML Project</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewProjectDialog(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateProject}
                    disabled={createProjectMutation.isPending}
                    data-testid="button-create-project"
                  >
                    {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Portfolio Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card data-testid="card-total-projects">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-projects">
                  {analytics.totalProjects}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>{analytics.activeProjects} active, {analytics.completedProjects} completed</span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-portfolio-progress">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Portfolio Progress</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-portfolio-progress">
                  {analytics.averageCompletion.toFixed(1)}%
                </div>
                <Progress value={analytics.averageCompletion} className="mt-2" />
              </CardContent>
            </Card>

            <Card data-testid="card-total-budget">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-budget">
                  {formatCurrency(analytics.totalBudget)}
                </div>
                <div className="flex items-center text-xs">
                  <span className="text-muted-foreground">
                    Spent: {formatCurrency(analytics.spentBudget)}
                  </span>
                  {analytics.budgetVariance !== 0 && (
                    <span className={`ml-2 flex items-center ${
                      analytics.budgetVariance > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {analytics.budgetVariance > 0 ? (
                        <ArrowUp className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(analytics.budgetVariance).toFixed(1)}%
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-team-utilization">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Utilization</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-team-utilization">
                  {analytics.teamUtilization.toFixed(1)}%
                </div>
                <Progress value={analytics.teamUtilization} className="mt-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {analytics.upcomingMilestones} upcoming milestones
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Critical Alerts */}
          <Card data-testid="card-critical-alerts">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview?.criticalAlerts && overview.criticalAlerts.length > 0 ? (
                overview.criticalAlerts.slice(0, 3).map((alert) => (
                  <Alert key={alert.id} className={getAlertSeverityColor(alert.severity)}>
                    <AlertDescription>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{alert.projectName}</p>
                          <p className="text-sm">{alert.message}</p>
                        </div>
                        <Badge variant="outline" className={getPriorityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No critical alerts at the moment
                </p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card data-testid="card-upcoming-deadlines">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview?.upcomingDeadlines && overview.upcomingDeadlines.length > 0 ? (
                overview.upcomingDeadlines.slice(0, 3).map((deadline) => (
                  <div key={deadline.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div>
                      <p className="font-medium text-sm">{deadline.name}</p>
                      <p className="text-xs text-muted-foreground">{deadline.projectName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatDate(deadline.dueDate)}</p>
                      <Badge variant="outline" className="text-xs">
                        {deadline.type}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming deadlines
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card data-testid="card-recent-activity">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview?.recentActivity && overview.recentActivity.length > 0 ? (
                overview.recentActivity.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div>
                      <p className="font-medium text-sm">{activity.projectName}</p>
                      <p className="text-xs text-muted-foreground">{activity.action}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Project Portfolio</CardTitle>
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                    data-testid="input-search-projects"
                  />
                </div>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32" data-testid="select-filter-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32" data-testid="select-filter-type">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="web_app">Web App</SelectItem>
                    <SelectItem value="mobile_app">Mobile App</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="ai_ml">AI/ML</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow" data-testid={`card-project-${project.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                          {project.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`}></div>
                          <Badge variant="outline" className={getPriorityColor(project.priority)}>
                            {project.priority}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Progress */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-sm text-muted-foreground">
                              {project.completionPercentage}%
                            </span>
                          </div>
                          <Progress value={project.completionPercentage} className="h-2" />
                        </div>

                        {/* Project Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Type</span>
                            <p className="font-medium capitalize">
                              {project.projectType.replace('_', ' ')}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Team Size</span>
                            <p className="font-medium">{project.teamSize} members</p>
                          </div>
                          {project.totalBudget && (
                            <div>
                              <span className="text-muted-foreground">Budget</span>
                              <p className="font-medium">
                                {formatCurrency(parseFloat(project.totalBudget))}
                              </p>
                            </div>
                          )}
                          {project.targetEndDate && (
                            <div>
                              <span className="text-muted-foreground">Due Date</span>
                              <p className="font-medium">{formatDate(project.targetEndDate)}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center pt-2 border-t">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/projects/${project.id}`} data-testid={`link-project-${project.id}`}>
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Open
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Updated {formatDate(project.updatedAt)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No projects found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterStatus || filterType 
                    ? "Try adjusting your filters or search query."
                    : "Get started by creating your first project."
                  }
                </p>
                {!searchQuery && !filterStatus && !filterType && (
                  <Button onClick={() => setShowNewProjectDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Project
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
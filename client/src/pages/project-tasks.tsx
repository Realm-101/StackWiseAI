import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Workflow, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  List,
  Grid,
  Eye,
  Settings,
  TrendingUp
} from "lucide-react";
import Navigation from "@/components/layout/navigation";
import { 
  TaskList, 
  TaskTimeline, 
  TaskGenerationModal 
} from "@/components/tasks";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { 
  TaskGeneration, 
  ProjectTask, 
  SavedIdea, 
  TaskMetrics,
  GeneratedTasksResponse 
} from "@shared/schema";

interface ProjectTasksPageProps {}

interface ProjectData {
  generation: TaskGeneration;
  tasks: ProjectTask[];
  metrics: TaskMetrics;
  idea?: SavedIdea;
}

export default function ProjectTasksPage({}: ProjectTasksPageProps) {
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<"projects" | "project-detail">("projects");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [taskGenerationModal, setTaskGenerationModal] = useState<{ isOpen: boolean; idea: SavedIdea | null }>({
    isOpen: false,
    idea: null
  });

  // Fetch all user task generations (projects)
  const { data: projects = [], isLoading: projectsLoading } = useQuery<TaskGeneration[]>({
    queryKey: ["/api/task-generations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/task-generations");
      return await response.json();
    }
  });

  // Fetch saved ideas for new project generation
  const { data: savedIdeas = [] } = useQuery<SavedIdea[]>({
    queryKey: ["/api/saved-ideas"],
  });

  // Fetch specific project data when viewing details
  const { data: projectData, isLoading: projectLoading } = useQuery<ProjectData>({
    queryKey: ["/api/tasks/project", selectedProject],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tasks/project/${selectedProject}`);
      return await response.json();
    },
    enabled: !!selectedProject && currentView === "project-detail"
  });

  // Fetch overall task metrics
  const { data: overallMetrics } = useQuery({
    queryKey: ["/api/tasks/metrics"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/tasks/metrics");
      return await response.json();
    }
  });

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    setCurrentView("project-detail");
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setCurrentView("projects");
  };

  const handleTasksGenerated = (data: GeneratedTasksResponse) => {
    toast({
      title: "Tasks Generated Successfully!",
      description: `Generated ${data.tasks.length} tasks for your new project`,
    });
    setTaskGenerationModal({ isOpen: false, idea: null });
    // Navigate to the new project
    handleProjectSelect(data.generation.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "planning": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "on_hold": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (currentView === "project-detail" && selectedProject) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={handleBackToProjects}
              className="mb-4"
              data-testid="button-back-to-projects"
            >
              ← Back to Projects
            </Button>
            
            {projectData && (
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {projectData.generation.title}
                  </h1>
                  <p className="text-muted-foreground">
                    {projectData.generation.description}
                  </p>
                </div>
                <Badge className={getStatusColor(projectData.generation.status)}>
                  {projectData.generation.status}
                </Badge>
              </div>
            )}
          </div>

          {projectLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : projectData ? (
            <Tabs defaultValue="tasks" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tasks" data-testid="tab-tasks">
                  <List className="w-4 h-4 mr-2" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger value="timeline" data-testid="tab-timeline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="analytics" data-testid="tab-analytics">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tasks">
                <TaskList
                  generationId={selectedProject}
                  showFilters={true}
                  viewMode="list"
                  onTaskSelect={(task) => {
                    // Handle task selection if needed
                    console.log("Selected task:", task);
                  }}
                  onTaskUpdate={(task) => {
                    // Handle task updates
                    console.log("Updated task:", task);
                  }}
                />
              </TabsContent>

              <TabsContent value="timeline">
                <TaskTimeline
                  tasks={projectData.tasks}
                  generation={projectData.generation}
                  viewMode="timeline"
                />
              </TabsContent>

              <TabsContent value="analytics">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{projectData.metrics.totalTasks}</div>
                      <p className="text-xs text-muted-foreground">Project tasks</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Math.round(projectData.metrics.projectCompletionPercentage)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {projectData.metrics.completedTasks} of {projectData.metrics.totalTasks} done
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Time Estimate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{projectData.metrics.totalEstimatedHours}h</div>
                      <p className="text-xs text-muted-foreground">Estimated total</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Remaining</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{projectData.metrics.estimatedRemainingTime}</div>
                      <p className="text-xs text-muted-foreground">Time left</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Task Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Completed</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ 
                                  width: `${(projectData.metrics.completedTasks / projectData.metrics.totalTasks) * 100}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {projectData.metrics.completedTasks}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm">In Progress</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ 
                                  width: `${(projectData.metrics.inProgressTasks / projectData.metrics.totalTasks) * 100}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {projectData.metrics.inProgressTasks}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm">Blocked</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-orange-500 h-2 rounded-full" 
                                style={{ 
                                  width: `${(projectData.metrics.blockedTasks / projectData.metrics.totalTasks) * 100}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {projectData.metrics.blockedTasks}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Project Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">Average Complexity</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {projectData.metrics.averageTaskComplexity}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Clock className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">Time Tracking</div>
                            <div className="text-sm text-muted-foreground">
                              {projectData.metrics.totalActualHours}h logged of {projectData.metrics.totalEstimatedHours}h estimated
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          ) : null}
        </div>
      </div>
    );
  }

  // Main projects overview
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Project Tasks</h1>
              <p className="text-muted-foreground">
                Manage your AI-generated project tasks and track progress
              </p>
            </div>
            
            <Button 
              onClick={() => setTaskGenerationModal({ isOpen: true, idea: null })}
              data-testid="button-new-project"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>

          {/* Overall metrics */}
          {overallMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projects.length}</div>
                  <p className="text-xs text-muted-foreground">Active projects</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overallMetrics.completedTasks || 0}</div>
                  <p className="text-xs text-muted-foreground">Across all projects</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overallMetrics.inProgressTasks || 0}</div>
                  <p className="text-xs text-muted-foreground">Active tasks</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overallMetrics.totalEstimatedHours || 0}h</div>
                  <p className="text-xs text-muted-foreground">Estimated work</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters and search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-projects"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Projects list */}
        {projectsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-5 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-muted rounded w-16"></div>
                      <div className="h-6 bg-muted rounded w-20"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium text-foreground mb-2">
                {projects.length === 0 ? "No projects yet" : "No matching projects"}
              </h4>
              <p className="text-muted-foreground mb-6">
                {projects.length === 0 
                  ? "Generate your first project from a business idea to get started"
                  : "Try adjusting your search criteria"
                }
              </p>
              {projects.length === 0 && (
                <Button 
                  onClick={() => setTaskGenerationModal({ isOpen: true, idea: null })}
                  data-testid="button-create-first-project"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card 
                key={project.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleProjectSelect(project.id)}
                data-testid={`card-project-${project.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-foreground line-clamp-2">
                      {project.title}
                    </h3>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {project.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Generated</div>
                      <div className="text-muted-foreground">
                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Tasks</div>
                      <div className="text-muted-foreground">
                        {project.totalTasks || 0} tasks
                      </div>
                    </div>
                  </div>
                  
                  {(() => {
                    if (
                      project.generationParameters && 
                      typeof project.generationParameters === 'object' && 
                      'targetTimeframe' in project.generationParameters && 
                      typeof (project.generationParameters as any).targetTimeframe === 'string'
                    ) {
                      return (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {(project.generationParameters as any).targetTimeframe}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Task Generation Modal */}
        {(taskGenerationModal.idea || savedIdeas.length > 0) && (
          <TaskGenerationModal
            isOpen={taskGenerationModal.isOpen}
            onClose={() => setTaskGenerationModal({ isOpen: false, idea: null })}
            idea={taskGenerationModal.idea || savedIdeas[0]}
            onTasksGenerated={handleTasksGenerated}
          />
        )}
      </div>
    </div>
  );
}
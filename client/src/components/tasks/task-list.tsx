import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Filter, 
  Grid, 
  List, 
  SortAsc, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Pause,
  X,
  MoreHorizontal,
  Calendar,
  Users,
  DollarSign
} from "lucide-react";
import { TaskCard } from "./task-card";
import { TaskFiltering } from "./task-filtering";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProjectTask, TaskGeneration, TaskMetrics } from "@shared/schema";

interface TaskListProps {
  generationId?: string;
  showFilters?: boolean;
  viewMode?: "list" | "grid";
  onTaskSelect?: (task: ProjectTask) => void;
  onTaskUpdate?: (task: ProjectTask) => void;
}

const statusIcons = {
  pending: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle,
  blocked: Pause,
  cancelled: X
};

const statusColors = {
  pending: "text-gray-500",
  in_progress: "text-blue-500",
  completed: "text-green-500",
  blocked: "text-orange-500",
  cancelled: "text-red-500"
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

const complexityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

export function TaskList({ 
  generationId, 
  showFilters = true, 
  viewMode = "list",
  onTaskSelect,
  onTaskUpdate 
}: TaskListProps) {
  const { toast } = useToast();
  const [currentViewMode, setCurrentViewMode] = useState<"list" | "grid">(viewMode);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    priority: "",
    complexity: ""
  });

  // Fetch tasks data
  const { data: tasksData, isLoading } = useQuery({
    queryKey: generationId ? ["/api/tasks/project", generationId] : ["/api/tasks"],
    queryFn: async () => {
      const endpoint = generationId 
        ? `/api/tasks/project/${generationId}` 
        : "/api/tasks";
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    }
  });

  const tasks: ProjectTask[] = generationId ? tasksData?.tasks || [] : tasksData || [];
  const generation: TaskGeneration | undefined = generationId ? tasksData?.generation : undefined;
  const metrics: TaskMetrics | undefined = generationId ? tasksData?.metrics : undefined;

  // Update task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/tasks/${taskId}/status`, { status });
      return await response.json();
    },
    onSuccess: (updatedTask) => {
      toast({
        title: "Task Updated",
        description: `Task status changed to ${updatedTask.status}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/project"] });
      onTaskUpdate?.(updatedTask);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update task status",
        variant: "destructive",
      });
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ taskIds, updates }: { taskIds: string[]; updates: any }) => {
      const response = await apiRequest("PUT", "/api/tasks/bulk", { taskIds, updates });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tasks Updated",
        description: `Updated ${selectedTasks.length} tasks`,
      });
      setSelectedTasks([]);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/project"] });
    },
    onError: () => {
      toast({
        title: "Bulk Update Failed",
        description: "Failed to update selected tasks",
        variant: "destructive",
      });
    },
  });

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filters.status && task.status !== filters.status) return false;
    if (filters.category && task.category !== filters.category) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.complexity && task.complexity !== filters.complexity) return false;
    return true;
  });

  const handleTaskSelect = (taskId: string, selected: boolean) => {
    if (selected) {
      setSelectedTasks(prev => [...prev, taskId]);
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map(task => task.id));
    }
  };

  const handleBulkStatusUpdate = (status: string) => {
    if (selectedTasks.length === 0) return;
    
    bulkUpdateMutation.mutate({
      taskIds: selectedTasks,
      updates: { status }
    });
  };

  const getTasksByCategory = () => {
    const categories = [...new Set(filteredTasks.map(task => task.category))];
    return categories.map(category => ({
      category,
      tasks: filteredTasks.filter(task => task.category === category)
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No tasks found. {generationId ? "Generate tasks from a business idea to get started." : "Create a project or generate tasks from your ideas."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project overview (if viewing specific generation) */}
      {generation && metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{generation.title}</span>
              <Badge variant="outline">{generation.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.totalTasks}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.completedTasks}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{metrics.inProgressTasks}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(metrics.projectCompletionPercentage)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Complete</div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>Est. Time: {metrics.totalEstimatedHours}h</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Remaining: {metrics.estimatedRemainingTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={complexityColors[metrics.averageTaskComplexity]}>
                  {metrics.averageTaskComplexity} complexity
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showFilters && (
            <TaskFiltering 
              filters={filters}
              onFiltersChange={setFilters}
              tasks={tasks}
            />
          )}
          
          {/* View mode toggle */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={currentViewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentViewMode("list")}
              data-testid="button-view-list"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={currentViewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentViewMode("grid")}
              data-testid="button-view-grid"
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Bulk actions */}
        {selectedTasks.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {selectedTasks.length} selected
            </span>
            <Select onValueChange={handleBulkStatusUpdate}>
              <SelectTrigger className="w-40" data-testid="select-bulk-status">
                <SelectValue placeholder="Update status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Select all checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
          onCheckedChange={handleSelectAll}
          data-testid="checkbox-select-all"
        />
        <span className="text-sm text-gray-600 dark:text-gray-300">
          Select all tasks
        </span>
      </div>

      {/* Task display */}
      {currentViewMode === "list" ? (
        // List view - organized by category
        <div className="space-y-6">
          {getTasksByCategory().map(({ category, tasks: categoryTasks }) => (
            <div key={category} className="space-y-3">
              <h3 className="text-lg font-medium capitalize flex items-center gap-2">
                {category.replace('_', ' ')}
                <Badge variant="outline">{categoryTasks.length}</Badge>
              </h3>
              
              <div className="space-y-2">
                {categoryTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    viewMode="list"
                    isSelected={selectedTasks.includes(task.id)}
                    onSelect={(selected) => handleTaskSelect(task.id, selected)}
                    onStatusChange={(status) => updateTaskStatusMutation.mutate({ taskId: task.id, status })}
                    onClick={() => onTaskSelect?.(task)}
                    data-testid={`task-card-${task.id}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Grid view
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              viewMode="grid"
              isSelected={selectedTasks.includes(task.id)}
              onSelect={(selected) => handleTaskSelect(task.id, selected)}
              onStatusChange={(status) => updateTaskStatusMutation.mutate({ taskId: task.id, status })}
              onClick={() => onTaskSelect?.(task)}
              data-testid={`task-card-${task.id}`}
            />
          ))}
        </div>
      )}

      {filteredTasks.length === 0 && tasks.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tasks match the current filters. Try adjusting your filter criteria.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
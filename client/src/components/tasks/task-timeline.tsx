import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, CheckCircle, AlertCircle, Flag } from "lucide-react";
import type { ProjectTask, TaskGeneration } from "@shared/schema";

interface TaskTimelineProps {
  tasks: ProjectTask[];
  generation?: TaskGeneration;
  viewMode?: "timeline" | "gantt" | "milestones";
}

interface TimelinePhase {
  name: string;
  startDate: Date;
  endDate: Date;
  tasks: ProjectTask[];
  progress: number;
  category: string;
}

interface Milestone {
  name: string;
  date: Date;
  tasks: ProjectTask[];
  completed: boolean;
}

const categoryOrder = [
  "setup",
  "database", 
  "backend",
  "frontend",
  "auth",
  "integration",
  "testing",
  "docs",
  "devops"
];

const categoryColors = {
  setup: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  frontend: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  backend: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  database: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  auth: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  testing: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  docs: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  devops: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  integration: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
};

export function TaskTimeline({ 
  tasks, 
  generation, 
  viewMode = "timeline" 
}: TaskTimelineProps) {
  
  const timelineData = useMemo(() => {
    // Group tasks by category and create phases
    const tasksByCategory = categoryOrder.reduce((acc, category) => {
      acc[category] = tasks.filter(task => task.category === category);
      return acc;
    }, {} as Record<string, ProjectTask[]>);

    // Create phases with estimated timing
    let currentDate = new Date();
    const phases: TimelinePhase[] = [];
    
    Object.entries(tasksByCategory).forEach(([category, categoryTasks]) => {
      if (categoryTasks.length === 0) return;
      
      const totalDays = categoryTasks.reduce((sum, task) => {
        return sum + parseFloat(task.estimatedDays || "1");
      }, 0);
      
      const completedTasks = categoryTasks.filter(task => task.status === "completed").length;
      const progress = categoryTasks.length > 0 ? (completedTasks / categoryTasks.length) * 100 : 0;
      
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + Math.ceil(totalDays));
      
      phases.push({
        name: category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' '),
        startDate,
        endDate,
        tasks: categoryTasks,
        progress,
        category
      });
      
      // Set next phase start date with some overlap for parallel work
      currentDate.setDate(currentDate.getDate() + Math.ceil(totalDays * 0.7));
    });

    return phases;
  }, [tasks]);

  const milestones = useMemo(() => {
    const milestones: Milestone[] = [];
    
    // Create milestones based on major phase completions
    let cumulativeDays = 0;
    
    timelineData.forEach((phase, index) => {
      if (phase.tasks.length === 0) return;
      
      const phaseDays = phase.tasks.reduce((sum, task) => {
        return sum + parseFloat(task.estimatedDays || "1");
      }, 0);
      
      cumulativeDays += phaseDays;
      
      const milestoneDate = new Date();
      milestoneDate.setDate(milestoneDate.getDate() + cumulativeDays);
      
      const completedTasks = phase.tasks.filter(task => task.status === "completed");
      const isCompleted = completedTasks.length === phase.tasks.length;
      
      milestones.push({
        name: `${phase.name} Complete`,
        date: milestoneDate,
        tasks: phase.tasks,
        completed: isCompleted
      });
    });
    
    return milestones;
  }, [timelineData]);

  const projectStats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === "completed").length;
    const inProgressTasks = tasks.filter(task => task.status === "in_progress").length;
    const totalEstimatedDays = tasks.reduce((sum, task) => sum + parseFloat(task.estimatedDays || "1"), 0);
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      completionPercentage: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      totalEstimatedDays: Math.ceil(totalEstimatedDays),
      estimatedCompletionDate: new Date(Date.now() + totalEstimatedDays * 24 * 60 * 60 * 1000)
    };
  }, [tasks]);

  if (viewMode === "milestones") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5" />
              Project Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className={`w-4 h-4 rounded-full flex-shrink-0 ${
                    milestone.completed ? "bg-green-500" : "bg-gray-300"
                  }`} />
                  
                  <div className="flex-1">
                    <h4 className="font-medium">{milestone.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {milestone.date.toLocaleDateString()} • {milestone.tasks.length} tasks
                    </p>
                  </div>
                  
                  <Badge variant={milestone.completed ? "default" : "outline"}>
                    {milestone.completed ? "Complete" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Project Timeline Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{projectStats.totalTasks}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{projectStats.completedTasks}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{projectStats.inProgressTasks}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{projectStats.totalEstimatedDays}d</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Estimated Duration</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Project Progress</span>
              <span>{Math.round(projectStats.completionPercentage)}% Complete</span>
            </div>
            <Progress value={projectStats.completionPercentage} className="h-3" />
          </div>
          
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            <p>Estimated completion: {projectStats.estimatedCompletionDate.toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Phase timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Development Phases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timelineData.map((phase, index) => (
              <div key={phase.category} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      phase.progress === 100 ? "bg-green-500" : 
                      phase.progress > 0 ? "bg-blue-500" : "bg-gray-300"
                    }`} />
                    <h4 className="font-medium">{phase.name}</h4>
                    <Badge className={categoryColors[phase.category as keyof typeof categoryColors] || "bg-gray-100"}>
                      {phase.tasks.length} tasks
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {phase.startDate.toLocaleDateString()} - {phase.endDate.toLocaleDateString()}
                  </div>
                </div>
                
                <div className="ml-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Phase Progress</span>
                    <span>{Math.round(phase.progress)}% Complete</span>
                  </div>
                  <Progress value={phase.progress} className="h-2" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                    {phase.tasks.slice(0, 6).map((task) => (
                      <div 
                        key={task.id} 
                        className="flex items-center gap-2 text-sm p-2 border rounded"
                      >
                        {task.status === "completed" ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : task.status === "in_progress" ? (
                          <AlertCircle className="w-3 h-3 text-blue-500" />
                        ) : (
                          <Clock className="w-3 h-3 text-gray-400" />
                        )}
                        <span className="truncate">{task.title}</span>
                      </div>
                    ))}
                    {phase.tasks.length > 6 && (
                      <div className="text-sm text-gray-500 p-2">
                        +{phase.tasks.length - 6} more tasks
                      </div>
                    )}
                  </div>
                </div>
                
                {index < timelineData.length - 1 && (
                  <div className="ml-6 border-l-2 border-dashed border-gray-200 dark:border-gray-700 h-6" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Critical path and dependencies */}
      {generation?.criticalPath && generation.criticalPath.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Critical Path
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              These tasks are on the critical path and may impact the project timeline if delayed.
            </p>
            <div className="space-y-2">
              {generation.criticalPath.map((taskTitle, index) => {
                const task = tasks.find(t => t.title === taskTitle);
                if (!task) return null;
                
                return (
                  <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="w-6 h-6 bg-orange-100 text-orange-800 rounded-full flex items-center justify-center text-xs">
                        {index + 1}
                      </span>
                      {task.title}
                    </div>
                    <Badge className={categoryColors[task.category as keyof typeof categoryColors] || "bg-gray-100"}>
                      {task.category}
                    </Badge>
                    <div className="ml-auto text-sm text-gray-500">
                      {task.estimatedDays}d
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
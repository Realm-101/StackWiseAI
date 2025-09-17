/**
 * Timeline Engine - Advanced project scheduling and critical path analysis
 * Implements sophisticated algorithms for project timeline optimization
 */

import { Project, ProjectTimeline, ProjectPhase, ProjectMilestone, TaskDependency, ProjectTask } from '@shared/schema';

export interface TimelineCalculationResult {
  startDate: Date;
  endDate: Date;
  totalDuration: number;
  criticalPath: string[];
  scheduleVariance: number;
  completionProbability: number;
  bufferTime: number;
  optimization: {
    originalDuration: number;
    optimizedDuration: number;
    possibleSavings: number;
    recommendations: string[];
  };
}

export interface TaskNode {
  id: string;
  name: string;
  duration: number;
  startDate: Date;
  endDate: Date;
  dependencies: string[];
  resourceIds: string[];
  isCritical: boolean;
  slack: number;
  earlyStart: Date;
  earlyFinish: Date;
  lateStart: Date;
  lateFinish: Date;
  progress: number;
}

export interface ResourceConflict {
  resourceId: string;
  conflictPeriod: { start: Date; end: Date };
  conflictingTasks: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion: string;
}

/**
 * Advanced Timeline Calculation Engine
 */
export class TimelineEngine {
  
  /**
   * Calculate project timeline with critical path analysis
   */
  async calculateProjectTimeline(
    projectId: string,
    tasks: ProjectTask[],
    dependencies: TaskDependency[],
    phases: ProjectPhase[],
    milestones: ProjectMilestone[]
  ): Promise<TimelineCalculationResult> {
    
    // Build task network
    const taskNodes = this.buildTaskNetwork(tasks, dependencies);
    
    // Forward pass - calculate early start and early finish
    this.forwardPass(taskNodes);
    
    // Backward pass - calculate late start and late finish
    this.backwardPass(taskNodes);
    
    // Calculate slack and identify critical path
    const criticalPath = this.identifyCriticalPath(taskNodes);
    
    // Calculate project dates
    const startDates = taskNodes.map(t => t.earlyStart);
    const endDates = taskNodes.map(t => t.earlyFinish);
    const projectStart = new Date(Math.min(...startDates.map(d => d.getTime())));
    const projectEnd = new Date(Math.max(...endDates.map(d => d.getTime())));
    const totalDuration = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate schedule performance metrics
    const scheduleVariance = this.calculateScheduleVariance(taskNodes);
    const completionProbability = this.calculateCompletionProbability(taskNodes, criticalPath);
    const bufferTime = this.calculateBufferTime(taskNodes, criticalPath);
    
    // Generate optimization recommendations
    const optimization = await this.generateOptimizationRecommendations(taskNodes, criticalPath, phases);
    
    return {
      startDate: projectStart,
      endDate: projectEnd,
      totalDuration,
      criticalPath: criticalPath.map(cp => cp.id),
      scheduleVariance,
      completionProbability,
      bufferTime,
      optimization
    };
  }

  /**
   * Build task network with dependencies
   */
  private buildTaskNetwork(tasks: ProjectTask[], dependencies: TaskDependency[]): TaskNode[] {
    const taskMap = new Map<string, TaskNode>();
    
    // Create task nodes
    tasks.forEach(task => {
      const estimatedDuration = this.calculateTaskDuration(task);
      const startDate = task.startDate || new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + estimatedDuration);
      
      taskMap.set(task.id, {
        id: task.id,
        name: task.title,
        duration: estimatedDuration,
        startDate,
        endDate,
        dependencies: [],
        resourceIds: task.assigneeId ? [task.assigneeId] : [],
        isCritical: false,
        slack: 0,
        earlyStart: startDate,
        earlyFinish: endDate,
        lateStart: startDate,
        lateFinish: endDate,
        progress: this.getTaskProgress(task.status)
      });
    });

    // Add dependencies
    dependencies.forEach(dep => {
      const dependentTask = taskMap.get(dep.taskId);
      if (dependentTask) {
        dependentTask.dependencies.push(dep.dependsOnTaskId);
      }
    });

    return Array.from(taskMap.values());
  }

  /**
   * Forward pass calculation (Early Start/Early Finish)
   */
  private forwardPass(taskNodes: TaskNode[]): void {
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (node: TaskNode) => {
      if (visiting.has(node.id)) {
        throw new Error(`Circular dependency detected involving task ${node.id}`);
      }
      if (visited.has(node.id)) return;

      visiting.add(node.id);

      // Calculate early start based on dependencies
      let maxEarlyFinish = new Date(0);
      node.dependencies.forEach(depId => {
        const depNode = taskNodes.find(n => n.id === depId);
        if (depNode) {
          visit(depNode);
          if (depNode.earlyFinish > maxEarlyFinish) {
            maxEarlyFinish = depNode.earlyFinish;
          }
        }
      });

      // Set early start and early finish
      if (node.dependencies.length === 0) {
        node.earlyStart = node.startDate;
      } else {
        node.earlyStart = new Date(maxEarlyFinish);
      }

      node.earlyFinish = new Date(node.earlyStart);
      node.earlyFinish.setDate(node.earlyFinish.getDate() + node.duration);

      visiting.delete(node.id);
      visited.add(node.id);
    };

    taskNodes.forEach(node => visit(node));
  }

  /**
   * Backward pass calculation (Late Start/Late Finish)
   */
  private backwardPass(taskNodes: TaskNode[]): void {
    // Find project end date
    const projectEnd = new Date(Math.max(...taskNodes.map(t => t.earlyFinish.getTime())));
    
    // Initialize late finish for end nodes
    taskNodes.forEach(node => {
      const hasSuccessors = taskNodes.some(n => n.dependencies.includes(node.id));
      if (!hasSuccessors) {
        node.lateFinish = new Date(Math.max(node.earlyFinish.getTime(), projectEnd.getTime()));
        node.lateStart = new Date(node.lateFinish);
        node.lateStart.setDate(node.lateStart.getDate() - node.duration);
      }
    });

    // Backward pass for remaining nodes
    const processed = new Set<string>();
    
    const processNode = (node: TaskNode) => {
      if (processed.has(node.id)) return;
      
      // Ensure all successors are processed first
      const successors = taskNodes.filter(n => n.dependencies.includes(node.id));
      const allSuccessorsProcessed = successors.every(s => processed.has(s.id));
      
      if (!allSuccessorsProcessed) return;

      // Calculate late finish based on successors
      let minLateStart = new Date(node.lateFinish);
      successors.forEach(successor => {
        if (successor.lateStart < minLateStart) {
          minLateStart = successor.lateStart;
        }
      });

      if (successors.length > 0) {
        node.lateFinish = minLateStart;
      }
      
      node.lateStart = new Date(node.lateFinish);
      node.lateStart.setDate(node.lateStart.getDate() - node.duration);
      
      // Calculate slack
      node.slack = Math.ceil((node.lateStart.getTime() - node.earlyStart.getTime()) / (1000 * 60 * 60 * 24));
      
      processed.add(node.id);
    };

    // Process nodes multiple times until all are processed
    let previousCount = 0;
    while (processed.size < taskNodes.length && processed.size !== previousCount) {
      previousCount = processed.size;
      taskNodes.forEach(processNode);
    }
  }

  /**
   * Identify critical path (tasks with zero slack)
   */
  private identifyCriticalPath(taskNodes: TaskNode[]): TaskNode[] {
    const criticalTasks = taskNodes.filter(node => node.slack === 0);
    
    // Mark critical tasks
    criticalTasks.forEach(task => {
      task.isCritical = true;
    });

    // Sort by early start to get path sequence
    return criticalTasks.sort((a, b) => a.earlyStart.getTime() - b.earlyStart.getTime());
  }

  /**
   * Calculate schedule variance based on current progress
   */
  private calculateScheduleVariance(taskNodes: TaskNode[]): number {
    const today = new Date();
    let plannedProgress = 0;
    let actualProgress = 0;

    taskNodes.forEach(task => {
      if (task.earlyStart <= today) {
        const daysSinceStart = Math.ceil((today.getTime() - task.earlyStart.getTime()) / (1000 * 60 * 60 * 24));
        const plannedProgressForTask = Math.min(100, (daysSinceStart / task.duration) * 100);
        plannedProgress += plannedProgressForTask;
        actualProgress += task.progress;
      }
    });

    return taskNodes.length > 0 ? (actualProgress - plannedProgress) / taskNodes.length : 0;
  }

  /**
   * Calculate completion probability using Monte Carlo-style analysis
   */
  private calculateCompletionProbability(taskNodes: TaskNode[], criticalPath: TaskNode[]): number {
    // Simple heuristic based on current progress and risk factors
    let baseProbability = 0.8;
    
    // Reduce probability for each delayed critical task
    criticalPath.forEach(task => {
      const expectedProgress = this.calculateExpectedProgress(task);
      if (task.progress < expectedProgress) {
        baseProbability *= 0.9; // 10% penalty for each delayed critical task
      }
    });

    // Consider resource conflicts
    const resourceConflicts = this.detectResourceConflicts(taskNodes);
    baseProbability *= Math.max(0.5, 1 - (resourceConflicts.length * 0.05));

    // Consider task complexity and dependencies
    const avgDependencies = taskNodes.reduce((sum, t) => sum + t.dependencies.length, 0) / taskNodes.length;
    if (avgDependencies > 3) {
      baseProbability *= 0.95; // High interdependency reduces probability
    }

    return Math.max(0.1, Math.min(1.0, baseProbability));
  }

  /**
   * Calculate buffer time recommendations
   */
  private calculateBufferTime(taskNodes: TaskNode[], criticalPath: TaskNode[]): number {
    const totalProjectDuration = Math.max(...taskNodes.map(t => 
      Math.ceil((t.earlyFinish.getTime() - t.earlyStart.getTime()) / (1000 * 60 * 60 * 24))
    ));
    
    // Base buffer: 10-20% of project duration
    let bufferPercentage = 0.15;
    
    // Increase buffer for high-risk projects
    if (criticalPath.length > taskNodes.length * 0.4) {
      bufferPercentage += 0.05; // Many critical tasks = higher risk
    }
    
    const resourceConflicts = this.detectResourceConflicts(taskNodes);
    bufferPercentage += resourceConflicts.length * 0.02;

    return Math.ceil(totalProjectDuration * bufferPercentage);
  }

  /**
   * Generate optimization recommendations
   */
  private async generateOptimizationRecommendations(
    taskNodes: TaskNode[],
    criticalPath: TaskNode[],
    phases: ProjectPhase[]
  ): Promise<{
    originalDuration: number;
    optimizedDuration: number;
    possibleSavings: number;
    recommendations: string[];
  }> {
    const originalDuration = Math.max(...taskNodes.map(t => 
      Math.ceil((t.earlyFinish.getTime() - t.earlyStart.getTime()) / (1000 * 60 * 60 * 24))
    ));
    
    let possibleSavings = 0;
    const recommendations: string[] = [];

    // Identify parallelization opportunities
    const sequentialTasks = taskNodes.filter(t => !t.isCritical && t.dependencies.length <= 1);
    if (sequentialTasks.length > 2) {
      possibleSavings += Math.floor(originalDuration * 0.1);
      recommendations.push('Parallelize non-critical tasks to reduce timeline by up to 10%');
    }

    // Resource optimization opportunities
    const resourceConflicts = this.detectResourceConflicts(taskNodes);
    if (resourceConflicts.length > 0) {
      possibleSavings += resourceConflicts.length * 2; // 2 days per conflict
      recommendations.push(`Resolve ${resourceConflicts.length} resource conflicts to save ${resourceConflicts.length * 2} days`);
    }

    // Critical path optimization
    const longCriticalTasks = criticalPath.filter(t => t.duration > 5);
    if (longCriticalTasks.length > 0) {
      possibleSavings += longCriticalTasks.length * 1;
      recommendations.push(`Break down ${longCriticalTasks.length} long critical tasks for faster execution`);
    }

    // Phase optimization
    const overlappingPhases = this.identifyPhaseOverlaps(phases);
    if (overlappingPhases.length > 0) {
      possibleSavings += overlappingPhases.length * 3;
      recommendations.push('Optimize phase transitions and overlaps');
    }

    const optimizedDuration = Math.max(originalDuration * 0.7, originalDuration - possibleSavings);

    return {
      originalDuration,
      optimizedDuration,
      possibleSavings,
      recommendations
    };
  }

  /**
   * Calculate task duration based on complexity and effort
   */
  private calculateTaskDuration(task: ProjectTask): number {
    // Base duration derived from estimates or complexity
    let baseDuration = 1; // Default 1 day

    if (task.estimatedHours) {
      baseDuration = Math.ceil(parseFloat(task.estimatedHours) / 8);
    } else if (task.estimatedDays) {
      baseDuration = Math.ceil(parseFloat(task.estimatedDays));
    } else if (task.complexity) {
      switch (task.complexity) {
        case 'trivial':
        case 'low':
          baseDuration = 1;
          break;
        case 'easy':
          baseDuration = 2;
          break;
        case 'medium':
          baseDuration = 5;
          break;
        case 'high':
        case 'hard':
          baseDuration = 10;
          break;
        case 'expert':
          baseDuration = 15;
          break;
        default:
          baseDuration = 5;
      }
    }

    const category = task.category?.toLowerCase();
    if (category === 'research') baseDuration *= 1.5;
    if (category === 'testing') baseDuration *= 1.2;
    if (category === 'deployment') baseDuration *= 0.8;

    return Math.max(1, Math.ceil(baseDuration));
  }

  /**
   * Get task progress percentage from status
   */
  private getTaskProgress(status: string): number {
    switch (status) {
      case 'todo': return 0;
      case 'in_progress': return 50;
      case 'completed': return 100;
      case 'blocked': return 25;
      default: return 0;
    }
  }

  /**
   * Calculate expected progress for a task
   */
  private calculateExpectedProgress(task: TaskNode): number {
    const today = new Date();
    if (today < task.earlyStart) return 0;
    if (today >= task.earlyFinish) return 100;

    const daysSinceStart = Math.ceil((today.getTime() - task.earlyStart.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(100, (daysSinceStart / task.duration) * 100);
  }

  /**
   * Detect resource conflicts in task assignments
   */
  private detectResourceConflicts(taskNodes: TaskNode[]): ResourceConflict[] {
    const conflicts: ResourceConflict[] = [];
    const resourceSchedule = new Map<string, TaskNode[]>();

    // Group tasks by resource
    taskNodes.forEach(task => {
      task.resourceIds.forEach(resourceId => {
        if (!resourceSchedule.has(resourceId)) {
          resourceSchedule.set(resourceId, []);
        }
        resourceSchedule.get(resourceId)!.push(task);
      });
    });

    // Check for overlapping assignments
    resourceSchedule.forEach((tasks, resourceId) => {
      for (let i = 0; i < tasks.length; i++) {
        for (let j = i + 1; j < tasks.length; j++) {
          const task1 = tasks[i];
          const task2 = tasks[j];

          // Check for temporal overlap
          if (this.tasksOverlap(task1, task2)) {
            const overlapStart = new Date(Math.max(task1.earlyStart.getTime(), task2.earlyStart.getTime()));
            const overlapEnd = new Date(Math.min(task1.earlyFinish.getTime(), task2.earlyFinish.getTime()));

            conflicts.push({
              resourceId,
              conflictPeriod: { start: overlapStart, end: overlapEnd },
              conflictingTasks: [task1.id, task2.id],
              severity: this.assessConflictSeverity(task1, task2),
              suggestion: this.generateConflictSuggestion(task1, task2)
            });
          }
        }
      }
    });

    return conflicts;
  }

  /**
   * Check if two tasks overlap in time
   */
  private tasksOverlap(task1: TaskNode, task2: TaskNode): boolean {
    return task1.earlyStart < task2.earlyFinish && task2.earlyStart < task1.earlyFinish;
  }

  /**
   * Assess the severity of a resource conflict
   */
  private assessConflictSeverity(task1: TaskNode, task2: TaskNode): 'low' | 'medium' | 'high' | 'critical' {
    if (task1.isCritical && task2.isCritical) return 'critical';
    if (task1.isCritical || task2.isCritical) return 'high';
    if (task1.slack < 2 || task2.slack < 2) return 'medium';
    return 'low';
  }

  /**
   * Generate suggestion for resolving resource conflict
   */
  private generateConflictSuggestion(task1: TaskNode, task2: TaskNode): string {
    if (task1.isCritical && !task2.isCritical) {
      return `Reschedule ${task2.name} to avoid conflict with critical task ${task1.name}`;
    } else if (task2.isCritical && !task1.isCritical) {
      return `Reschedule ${task1.name} to avoid conflict with critical task ${task2.name}`;
    } else if (task1.slack > task2.slack) {
      return `Shift ${task1.name} as it has more slack time available`;
    } else {
      return `Consider assigning additional resources or splitting the work`;
    }
  }

  /**
   * Identify opportunities for phase overlaps
   */
  private identifyPhaseOverlaps(phases: ProjectPhase[]): ProjectPhase[] {
    // Simple heuristic: phases that could potentially overlap
    return phases.filter((phase, index) => {
      const nextPhase = phases[index + 1];
      if (!nextPhase) return false;
      
      // Check if phases could overlap based on their nature
      const canOverlap = this.phasesCanOverlap(phase.name, nextPhase.name);
      return canOverlap && phase.endDate && nextPhase.startDate && 
             phase.endDate.getTime() === nextPhase.startDate.getTime();
    });
  }

  /**
   * Determine if two phases can overlap
   */
  private phasesCanOverlap(phase1Name: string, phase2Name: string): boolean {
    const overlapPairs = [
      ['design', 'development'],
      ['development', 'testing'],
      ['testing', 'deployment'],
      ['research', 'design']
    ];

    return overlapPairs.some(([p1, p2]) => 
      (phase1Name.toLowerCase().includes(p1) && phase2Name.toLowerCase().includes(p2)) ||
      (phase1Name.toLowerCase().includes(p2) && phase2Name.toLowerCase().includes(p1))
    );
  }
}

export const timelineEngine = new TimelineEngine();
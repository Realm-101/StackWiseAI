/**
 * Resource Optimizer - Advanced resource allocation and optimization algorithms
 * Handles team allocation, workload balancing, and capacity planning
 */

import { ProjectResource, ProjectTask, Project, User } from '@shared/schema';

export interface ResourceAllocation {
  resourceId: string;
  resourceName: string;
  resourceType: 'human' | 'equipment' | 'software' | 'space';
  totalCapacity: number;
  allocatedCapacity: number;
  availableCapacity: number;
  utilizationRate: number;
  skills: string[];
  costPerHour: number;
  assignments: ResourceAssignment[];
}

export interface ResourceAssignment {
  taskId: string;
  taskName: string;
  projectId: string;
  projectName: string;
  startDate: Date;
  endDate: Date;
  hoursAllocated: number;
  allocationPercentage: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiredSkills: string[];
}

export interface ResourceConflictResolution {
  conflictId: string;
  conflictType: 'overallocation' | 'skill_mismatch' | 'availability' | 'cost_constraint';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedResources: string[];
  affectedTasks: string[];
  resolutionOptions: ResolutionOption[];
  recommendedSolution: ResolutionOption;
  impact: {
    timelineDelay: number;
    costIncrease: number;
    qualityRisk: number;
  };
}

export interface ResolutionOption {
  id: string;
  description: string;
  type: 'reschedule' | 'reallocate' | 'hire' | 'outsource' | 'reduce_scope';
  effort: number; // Implementation effort 1-10
  cost: number;
  timeToImplement: number; // days
  effectiveness: number; // 1-10
  sideEffects: string[];
}

export interface ResourceOptimizationResult {
  originalUtilization: number;
  optimizedUtilization: number;
  improvementPercentage: number;
  reallocations: ResourceReallocation[];
  conflicts: ResourceConflictResolution[];
  recommendations: string[];
  costSavings: number;
  timelineSavings: number;
}

export interface ResourceReallocation {
  resourceId: string;
  fromTask: string;
  toTask: string;
  hours: number;
  reason: string;
  impact: string;
}

export interface SkillMatch {
  taskId: string;
  requiredSkills: string[];
  resourceId: string;
  resourceSkills: string[];
  matchScore: number; // 0-1
  missingSkills: string[];
  overqualifiedSkills: string[];
}

/**
 * Advanced Resource Optimization Engine
 */
export class ResourceOptimizer {

  /**
   * Optimize resource allocation across all projects
   */
  async optimizeResourceAllocation(
    resources: ProjectResource[],
    tasks: ProjectTask[],
    projects: Project[]
  ): Promise<ResourceOptimizationResult> {
    
    // Build current resource allocation state
    const resourceAllocations = await this.buildResourceAllocations(resources, tasks, projects);
    
    // Calculate baseline metrics
    const originalUtilization = this.calculateAverageUtilization(resourceAllocations);
    
    // Detect resource conflicts
    const conflicts = await this.detectResourceConflicts(resourceAllocations, tasks);
    
    // Generate optimization recommendations
    const optimizationResults = await this.generateOptimizations(resourceAllocations, conflicts, tasks);
    
    // Calculate optimized metrics
    const optimizedUtilization = this.calculateOptimizedUtilization(resourceAllocations, optimizationResults.reallocations);
    
    return {
      originalUtilization,
      optimizedUtilization,
      improvementPercentage: ((optimizedUtilization - originalUtilization) / originalUtilization) * 100,
      reallocations: optimizationResults.reallocations,
      conflicts,
      recommendations: optimizationResults.recommendations,
      costSavings: optimizationResults.costSavings,
      timelineSavings: optimizationResults.timelineSavings
    };
  }

  /**
   * Find optimal resource assignments for tasks
   */
  async findOptimalAssignments(
    tasks: ProjectTask[],
    resources: ProjectResource[],
    constraints?: {
      maxUtilization?: number;
      skillRequirements?: Map<string, string[]>;
      costConstraints?: number;
      timeConstraints?: Date;
    }
  ): Promise<Map<string, string[]>> {
    
    const assignments = new Map<string, string[]>();
    const resourceCapacity = new Map<string, number>();
    
    // Initialize resource capacities
    resources.forEach(resource => {
      resourceCapacity.set(resource.id, parseFloat(resource.totalHoursAllocated || '40'));
    });

    // Sort tasks by priority and complexity
    const sortedTasks = this.prioritizeTasks(tasks);
    
    for (const task of sortedTasks) {
      const bestResources = await this.findBestResourcesForTask(
        task,
        resources,
        resourceCapacity,
        constraints
      );
      
      if (bestResources.length > 0) {
        assignments.set(task.id, bestResources.map(r => r.resourceId));
        
        // Update resource capacities
        bestResources.forEach(resource => {
          const currentCapacity = resourceCapacity.get(resource.resourceId) || 0;
          resourceCapacity.set(resource.resourceId, currentCapacity - resource.hoursNeeded);
        });
      }
    }

    return assignments;
  }

  /**
   * Analyze resource utilization and identify bottlenecks
   */
  async analyzeResourceUtilization(
    resources: ProjectResource[],
    dateRange: { start: Date; end: Date }
  ): Promise<{
    utilizationByResource: Map<string, number>;
    bottlenecks: ResourceBottleneck[];
    underutilized: ResourceUnderutilization[];
    recommendations: string[];
  }> {
    
    const utilizationByResource = new Map<string, number>();
    const bottlenecks: ResourceBottleneck[] = [];
    const underutilized: ResourceUnderutilization[] = [];
    
    // Calculate utilization for each resource
    for (const resource of resources) {
      const utilization = this.calculateResourceUtilization(resource, dateRange);
      utilizationByResource.set(resource.id, utilization);
      
      if (utilization > 95) {
        bottlenecks.push({
          resourceId: resource.id,
          resourceName: resource.resourceName,
          utilization,
          impact: 'critical',
          suggestions: this.generateBottleneckSuggestions(resource, utilization)
        });
      } else if (utilization < 60) {
        underutilized.push({
          resourceId: resource.id,
          resourceName: resource.resourceName,
          utilization,
          potentialCapacity: (100 - utilization) / 100,
          suggestions: this.generateUtilizationSuggestions(resource, utilization)
        });
      }
    }

    const recommendations = this.generateUtilizationRecommendations(bottlenecks, underutilized);

    return {
      utilizationByResource,
      bottlenecks,
      underutilized,
      recommendations
    };
  }

  /**
   * Perform skill-based resource matching
   */
  async performSkillMatching(
    tasks: ProjectTask[],
    resources: ProjectResource[],
    skillDatabase: Map<string, string[]>
  ): Promise<SkillMatch[]> {
    
    const skillMatches: SkillMatch[] = [];
    
    for (const task of tasks) {
      const requiredSkills = this.extractRequiredSkills(task);
      
      for (const resource of resources) {
        const resourceKey = resource.resourceId ?? resource.id;
        const resourceSkills = skillDatabase.get(resourceKey) ?? (resource.skillsProvided ?? []);
        const matchScore = this.calculateSkillMatch(requiredSkills, resourceSkills);
        const missingSkills = requiredSkills.filter(skill => !resourceSkills.includes(skill));
        const overqualifiedSkills = resourceSkills.filter(skill => !requiredSkills.includes(skill));
        
        skillMatches.push({
          taskId: task.id,
          requiredSkills,
          resourceId: resourceKey,
          resourceSkills,
          matchScore,
          missingSkills,
          overqualifiedSkills
        });
      }
    }

    // Sort by match score descending
    return skillMatches.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Calculate resource workload balancing
   */
  async balanceWorkload(
    resources: ProjectResource[],
    targetUtilization: number = 85
  ): Promise<{
    balancingPlan: WorkloadBalancingPlan[];
    projectedUtilization: Map<string, number>;
    improvementMetrics: {
      varianceReduction: number;
      utilizationImprovement: number;
      workloadDistribution: number;
    };
  }> {
    
    const balancingPlan: WorkloadBalancingPlan[] = [];
    const currentUtilizations = new Map<string, number>();
    
    // Calculate current utilizations
    resources.forEach(resource => {
      const utilization = parseFloat(resource.allocationPercentage || '0');
      currentUtilizations.set(resource.id, utilization);
    });

    // Identify over-allocated and under-allocated resources
    const overAllocated = Array.from(currentUtilizations.entries())
      .filter(([_, util]) => util > targetUtilization)
      .map(([id, util]) => ({ resourceId: id, utilization: util, excess: util - targetUtilization }));

    const underAllocated = Array.from(currentUtilizations.entries())
      .filter(([_, util]) => util < targetUtilization)
      .map(([id, util]) => ({ resourceId: id, utilization: util, capacity: targetUtilization - util }));

    // Generate workload transfer recommendations
    for (const overRes of overAllocated) {
      for (const underRes of underAllocated) {
        if (overRes.excess > 5 && underRes.capacity > 5) {
          const transferAmount = Math.min(overRes.excess, underRes.capacity) * 0.5;
          
          balancingPlan.push({
            fromResourceId: overRes.resourceId,
            toResourceId: underRes.resourceId,
            workloadPercentage: transferAmount,
            estimatedTasks: Math.ceil(transferAmount / 10),
            rationale: `Balance workload: ${overRes.utilization.toFixed(1)}% → ${(overRes.utilization - transferAmount).toFixed(1)}%`,
            impact: this.assessBalancingImpact(transferAmount)
          });

          // Update for next iteration
          overRes.excess -= transferAmount;
          underRes.capacity -= transferAmount;
        }
      }
    }

    // Calculate projected utilizations
    const projectedUtilization = new Map<string, number>();
    resources.forEach(resource => {
      let adjustedUtilization = currentUtilizations.get(resource.id) || 0;
      
      balancingPlan.forEach(plan => {
        if (plan.fromResourceId === resource.id) {
          adjustedUtilization -= plan.workloadPercentage;
        } else if (plan.toResourceId === resource.id) {
          adjustedUtilization += plan.workloadPercentage;
        }
      });
      
      projectedUtilization.set(resource.id, adjustedUtilization);
    });

    // Calculate improvement metrics
    const improvementMetrics = this.calculateImprovementMetrics(currentUtilizations, projectedUtilization);

    return {
      balancingPlan,
      projectedUtilization,
      improvementMetrics
    };
  }

  /**
   * Build comprehensive resource allocation view
   */
  private async buildResourceAllocations(
    resources: ProjectResource[],
    tasks: ProjectTask[],
    projects: Project[]
  ): Promise<ResourceAllocation[]> {
    
    const projectMap = new Map(projects.map(p => [p.id, p]));
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const allocations: ResourceAllocation[] = [];

    // Group resources by resourceId
    const resourceGroups = new Map<string, ProjectResource[]>();
    resources.forEach(resource => {
      const key = resource.resourceId || resource.resourceName;
      if (!resourceGroups.has(key)) {
        resourceGroups.set(key, []);
      }
      resourceGroups.get(key)!.push(resource);
    });

    for (const [resourceKey, resourceList] of resourceGroups) {
      const firstResource = resourceList[0];
      const assignments: ResourceAssignment[] = [];

      // Build assignments from all resource entries
      resourceList.forEach(resource => {
        const project = projectMap.get(resource.projectId);
        if (project) {
          assignments.push({
            taskId: resource.id, // Simplified - would need actual task linking
            taskName: project.name + ' - Resource Assignment',
            projectId: project.id,
            projectName: project.name,
            startDate: resource.availableFrom || new Date(),
            endDate: resource.availableUntil || new Date(),
            hoursAllocated: parseFloat(resource.totalHoursAllocated || '0'),
            allocationPercentage: parseFloat(resource.allocationPercentage || '0'),
            priority: 'medium', // Would need actual priority mapping
            requiredSkills: resource.skillsProvided ?? []
          });
        }
      });

      const totalAllocated = assignments.reduce((sum, a) => sum + a.allocationPercentage, 0);
      const totalCapacity = 100; // Assuming 100% capacity
      
      allocations.push({
        resourceId: resourceKey,
        resourceName: firstResource.resourceName,
        resourceType: firstResource.resourceType as any || 'human',
        totalCapacity,
        allocatedCapacity: totalAllocated,
        availableCapacity: Math.max(0, totalCapacity - totalAllocated),
        utilizationRate: totalAllocated / totalCapacity,
        skills: firstResource.skillsProvided ?? [],
        costPerHour: parseFloat(firstResource.hourlyRate || '50'),
        assignments
      });
    }

    return allocations;
  }

  /**
   * Calculate average resource utilization
   */
  private calculateAverageUtilization(allocations: ResourceAllocation[]): number {
    if (allocations.length === 0) return 0;
    const totalUtilization = allocations.reduce((sum, alloc) => sum + alloc.utilizationRate, 0);
    return (totalUtilization / allocations.length) * 100;
  }

  /**
   * Detect various types of resource conflicts
   */
  private async detectResourceConflicts(
    allocations: ResourceAllocation[],
    tasks: ProjectTask[]
  ): Promise<ResourceConflictResolution[]> {
    
    const conflicts: ResourceConflictResolution[] = [];

    for (const allocation of allocations) {
      // Over-allocation conflict
      if (allocation.utilizationRate > 1.0) {
        conflicts.push({
          conflictId: `overalloc_${allocation.resourceId}`,
          conflictType: 'overallocation',
          severity: allocation.utilizationRate > 1.5 ? 'critical' : 'high',
          affectedResources: [allocation.resourceId],
          affectedTasks: allocation.assignments.map(a => a.taskId),
          resolutionOptions: this.generateOverallocationSolutions(allocation),
          recommendedSolution: this.selectBestResolution(this.generateOverallocationSolutions(allocation)),
          impact: {
            timelineDelay: Math.ceil((allocation.utilizationRate - 1.0) * 5), // days
            costIncrease: (allocation.utilizationRate - 1.0) * allocation.costPerHour * 160, // monthly
            qualityRisk: Math.min(10, (allocation.utilizationRate - 1.0) * 3)
          }
        });
      }

      // Skill mismatch conflicts
      for (const assignment of allocation.assignments) {
        const skillMatch = this.calculateSkillMatch(assignment.requiredSkills, allocation.skills);
        if (skillMatch < 0.7) {
          conflicts.push({
            conflictId: `skill_${allocation.resourceId}_${assignment.taskId}`,
            conflictType: 'skill_mismatch',
            severity: skillMatch < 0.3 ? 'high' : 'medium',
            affectedResources: [allocation.resourceId],
            affectedTasks: [assignment.taskId],
            resolutionOptions: this.generateSkillMismatchSolutions(allocation, assignment),
            recommendedSolution: this.selectBestResolution(this.generateSkillMismatchSolutions(allocation, assignment)),
            impact: {
              timelineDelay: Math.ceil((0.7 - skillMatch) * 10),
              costIncrease: (0.7 - skillMatch) * 2000,
              qualityRisk: Math.ceil((0.7 - skillMatch) * 8)
            }
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Generate comprehensive optimization recommendations
   */
  private async generateOptimizations(
    allocations: ResourceAllocation[],
    conflicts: ResourceConflictResolution[],
    tasks: ProjectTask[]
  ): Promise<{
    reallocations: ResourceReallocation[];
    recommendations: string[];
    costSavings: number;
    timelineSavings: number;
  }> {
    
    const reallocations: ResourceReallocation[] = [];
    const recommendations: string[] = [];
    let costSavings = 0;
    let timelineSavings = 0;

    // Handle over-allocations
    const overAllocated = allocations.filter(a => a.utilizationRate > 1.0);
    const underAllocated = allocations.filter(a => a.utilizationRate < 0.7);

    for (const overAlloc of overAllocated) {
      for (const underAlloc of underAllocated) {
        if (this.resourcesAreCompatible(overAlloc, underAlloc)) {
          const transferHours = Math.min(
            (overAlloc.utilizationRate - 0.85) * overAlloc.totalCapacity,
            (0.85 - underAlloc.utilizationRate) * underAlloc.totalCapacity
          );

          if (transferHours > 4) { // Only transfer if significant
            const sourceAssignment = overAlloc.assignments
              .sort((a, b) => this.getTransferPriority(a) - this.getTransferPriority(b))[0];

            reallocations.push({
              resourceId: underAlloc.resourceId,
              fromTask: sourceAssignment.taskId,
              toTask: underAlloc.resourceId, // Simplified
              hours: transferHours,
              reason: `Balance workload: ${(overAlloc.utilizationRate * 100).toFixed(1)}% → ${((overAlloc.utilizationRate * overAlloc.totalCapacity - transferHours) / overAlloc.totalCapacity * 100).toFixed(1)}%`,
              impact: `Reduces overallocation and improves utilization balance`
            });

            costSavings += transferHours * (overAlloc.costPerHour - underAlloc.costPerHour) * 0.1;
            timelineSavings += transferHours * 0.125; // 1 day per 8 hours
          }
        }
      }
    }

    // Generate general recommendations
    recommendations.push(...this.generateGeneralRecommendations(allocations, conflicts));

    return {
      reallocations,
      recommendations,
      costSavings: Math.max(0, costSavings),
      timelineSavings: Math.max(0, timelineSavings)
    };
  }

  /**
   * Helper methods for resource optimization
   */
  private prioritizeTasks(tasks: ProjectTask[]): ProjectTask[] {
    return tasks.sort((a, b) => {
      // Priority order: complexity, due date, dependencies
      const complexityWeight = { 'expert': 5, 'hard': 4, 'medium': 3, 'easy': 2, 'trivial': 1 };
      const aComplexity = complexityWeight[a.complexity as keyof typeof complexityWeight] || 3;
      const bComplexity = complexityWeight[b.complexity as keyof typeof complexityWeight] || 3;
      
      if (aComplexity !== bComplexity) return bComplexity - aComplexity;
      
      const aDue = a.dueDate ? a.dueDate.getTime() : Date.now() + 30 * 24 * 60 * 60 * 1000;
      const bDue = b.dueDate ? b.dueDate.getTime() : Date.now() + 30 * 24 * 60 * 60 * 1000;
      
      return aDue - bDue;
    });
  }

  private async findBestResourcesForTask(
    task: ProjectTask,
    resources: ProjectResource[],
    resourceCapacity: Map<string, number>,
    constraints?: any
  ): Promise<Array<{ resourceId: string; hoursNeeded: number }>> {
    const requiredSkills = this.extractRequiredSkills(task);
    const estimatedHours = this.estimateTaskHours(task);
    
    const candidates = resources
      .filter(r => (resourceCapacity.get(r.id) || 0) >= estimatedHours)
      .map(r => ({
        resource: r,
        skillMatch: this.calculateSkillMatch(requiredSkills, r.skillsProvided ?? []),
        availability: resourceCapacity.get(r.id) || 0,
        cost: parseFloat(r.hourlyRate || '50')
      }))
      .filter(c => c.skillMatch >= 0.5)
      .sort((a, b) => {
        // Multi-criteria scoring: skill match (40%) + availability (30%) + cost (30%)
        const aScore = a.skillMatch * 0.4 + (a.availability / 40) * 0.3 + (1 / a.cost) * 1000 * 0.3;
        const bScore = b.skillMatch * 0.4 + (b.availability / 40) * 0.3 + (1 / b.cost) * 1000 * 0.3;
        return bScore - aScore;
      });

    // Return top candidate(s)
    if (candidates.length > 0) {
      return [{ resourceId: candidates[0].resource.id, hoursNeeded: estimatedHours }];
    }
    
    return [];
  }

  private extractRequiredSkills(task: ProjectTask): string[] {
    // Derive skill hints from stored task metadata
    const skills = new Set<string>();

    if (task.category) {
      skills.add(task.category);
    }

    if (task.technicalRequirements) {
      task.technicalRequirements.forEach(requirement => {
        if (typeof requirement === 'string' && requirement.trim().length > 0) {
          skills.add(requirement);
        }
      });
    }

    const resourceRequirements = task.resourceRequirements as { skills?: unknown } | null;
    if (resourceRequirements && typeof resourceRequirements === 'object') {
      const requirementsSkills = (resourceRequirements as { skills?: unknown }).skills;
      if (Array.isArray(requirementsSkills)) {
        requirementsSkills.forEach(skill => {
          if (typeof skill === 'string' && skill.trim().length > 0) {
            skills.add(skill);
          }
        });
      }
    }

    const complexity = task.complexity?.toLowerCase();
    if (complexity === 'expert') {
      skills.add('architecture');
      skills.add('senior_level');
    } else if (complexity === 'hard' || complexity === 'high') {
      skills.add('senior_level');
    }

    return Array.from(skills);
  }

  private calculateSkillMatch(requiredSkills: string[], resourceSkills: string[]): number {
    if (requiredSkills.length === 0) return 1;
    
    const matches = requiredSkills.filter(skill => 
      resourceSkills.some(rSkill => 
        rSkill.toLowerCase().includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(rSkill.toLowerCase())
      )
    ).length;
    
    return matches / requiredSkills.length;
  }

  private estimateTaskHours(task: ProjectTask): number {
    if (task.estimatedHours) {
      return parseFloat(task.estimatedHours);
    }
    if (task.estimatedDays) {
      return parseFloat(task.estimatedDays) * 8;
    }
    if (task.actualHours) {
      return parseFloat(task.actualHours);
    }

    const complexity = task.complexity?.toLowerCase();
    const complexityHours: Record<string, number> = {
      trivial: 4,
      easy: 8,
      low: 12,
      medium: 20,
      high: 40,
      hard: 40,
      expert: 80
    };

    return complexity ? (complexityHours[complexity] ?? 20) : 20;
  }

  private calculateResourceUtilization(resource: ProjectResource, dateRange: { start: Date; end: Date }): number {
    // Simplified calculation based on allocation percentage
    return parseFloat(resource.allocationPercentage || '0');
  }

  private generateBottleneckSuggestions(resource: ProjectResource, utilization: number): string[] {
    return [
      'Consider hiring additional team members with similar skills',
      'Redistribute some tasks to less utilized team members',
      'Evaluate if some tasks can be automated or simplified',
      'Implement time management and productivity tools',
      `Current utilization at ${utilization.toFixed(1)}% - reduce to below 90%`
    ];
  }

  private generateUtilizationSuggestions(resource: ProjectResource, utilization: number): string[] {
    return [
      'Assign additional tasks from other team members',
      'Consider training for additional skills to increase versatility',
      'Evaluate opportunities for process improvement initiatives',
      `Current utilization at ${utilization.toFixed(1)}% - could handle ${(100 - utilization).toFixed(1)}% more work`
    ];
  }

  private generateUtilizationRecommendations(
    bottlenecks: ResourceBottleneck[],
    underutilized: ResourceUnderutilization[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (bottlenecks.length > 0) {
      recommendations.push(`Address ${bottlenecks.length} resource bottlenecks to prevent project delays`);
    }
    
    if (underutilized.length > 0) {
      recommendations.push(`Optimize ${underutilized.length} underutilized resources for better efficiency`);
    }
    
    if (bottlenecks.length > 0 && underutilized.length > 0) {
      recommendations.push('Balance workload by redistributing tasks from overloaded to underutilized resources');
    }
    
    return recommendations;
  }

  private calculateOptimizedUtilization(
    allocations: ResourceAllocation[],
    reallocations: ResourceReallocation[]
  ): number {
    // Simulate the impact of reallocations on utilization
    const adjustedAllocations = allocations.map(alloc => ({ ...alloc }));
    
    reallocations.forEach(realloc => {
      const resource = adjustedAllocations.find(a => a.resourceId === realloc.resourceId);
      if (resource) {
        resource.allocatedCapacity += realloc.hours;
        resource.utilizationRate = resource.allocatedCapacity / resource.totalCapacity;
      }
    });
    
    return this.calculateAverageUtilization(adjustedAllocations);
  }

  private generateOverallocationSolutions(allocation: ResourceAllocation): ResolutionOption[] {
    return [
      {
        id: 'hire_additional',
        description: `Hire additional ${allocation.resourceType} with similar skills`,
        type: 'hire',
        effort: 8,
        cost: allocation.costPerHour * 160 * 3, // 3 months hiring cost
        timeToImplement: 30,
        effectiveness: 9,
        sideEffects: ['Increased team size', 'Training overhead', 'Higher long-term costs']
      },
      {
        id: 'redistribute_tasks',
        description: 'Redistribute tasks to other team members',
        type: 'reallocate',
        effort: 4,
        cost: allocation.costPerHour * 8, // Coordination cost
        timeToImplement: 3,
        effectiveness: 7,
        sideEffects: ['May reduce specialization', 'Requires coordination']
      },
      {
        id: 'reduce_scope',
        description: 'Reduce project scope to match available capacity',
        type: 'reduce_scope',
        effort: 6,
        cost: 0,
        timeToImplement: 5,
        effectiveness: 8,
        sideEffects: ['Reduced project deliverables', 'Stakeholder negotiations required']
      }
    ];
  }

  private generateSkillMismatchSolutions(allocation: ResourceAllocation, assignment: ResourceAssignment): ResolutionOption[] {
    return [
      {
        id: 'provide_training',
        description: `Provide training for missing skills: ${assignment.requiredSkills.filter(s => !allocation.skills.includes(s)).join(', ')}`,
        type: 'reallocate',
        effort: 6,
        cost: 2000,
        timeToImplement: 14,
        effectiveness: 8,
        sideEffects: ['Temporary reduced productivity', 'Training time investment']
      },
      {
        id: 'hire_specialist',
        description: `Hire specialist with required skills`,
        type: 'hire',
        effort: 8,
        cost: allocation.costPerHour * 160 * 2,
        timeToImplement: 21,
        effectiveness: 9,
        sideEffects: ['Higher costs', 'Team integration time']
      },
      {
        id: 'outsource_task',
        description: 'Outsource this specific task to external specialists',
        type: 'outsource',
        effort: 5,
        cost: assignment.hoursAllocated * 80, // Higher hourly rate for outsourcing
        timeToImplement: 7,
        effectiveness: 7,
        sideEffects: ['Less control over quality', 'Communication overhead']
      }
    ];
  }

  private selectBestResolution(options: ResolutionOption[]): ResolutionOption {
    // Score based on effectiveness, low cost, and quick implementation
    return options.sort((a, b) => {
      const aScore = a.effectiveness * 0.4 + (10 - a.effort) * 0.3 + (30 - a.timeToImplement) / 30 * 0.3;
      const bScore = b.effectiveness * 0.4 + (10 - b.effort) * 0.3 + (30 - b.timeToImplement) / 30 * 0.3;
      return bScore - aScore;
    })[0];
  }

  private resourcesAreCompatible(resource1: ResourceAllocation, resource2: ResourceAllocation): boolean {
    // Check skill overlap
    const skillOverlap = resource1.skills.filter(skill => resource2.skills.includes(skill)).length;
    return skillOverlap >= 1 || resource1.resourceType === resource2.resourceType;
  }

  private getTransferPriority(assignment: ResourceAssignment): number {
    // Lower priority tasks are preferred for transfer
    const priorityScores = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    return priorityScores[assignment.priority];
  }

  private generateGeneralRecommendations(
    allocations: ResourceAllocation[],
    conflicts: ResourceConflictResolution[]
  ): string[] {
    const recommendations: string[] = [];
    
    const avgUtilization = this.calculateAverageUtilization(allocations);
    
    if (avgUtilization > 90) {
      recommendations.push('Consider expanding team capacity as overall utilization is very high');
    } else if (avgUtilization < 60) {
      recommendations.push('Evaluate if team size can be optimized as utilization is low');
    }
    
    if (conflicts.length > 0) {
      recommendations.push(`Address ${conflicts.length} resource conflicts to improve project success probability`);
    }
    
    const skillGaps = this.identifySkillGaps(allocations);
    if (skillGaps.length > 0) {
      recommendations.push(`Consider training or hiring for skills: ${skillGaps.slice(0, 3).join(', ')}`);
    }
    
    return recommendations;
  }

  private identifySkillGaps(allocations: ResourceAllocation[]): string[] {
    const allRequiredSkills = new Set<string>();
    const allAvailableSkills = new Set<string>();
    
    allocations.forEach(alloc => {
      alloc.assignments.forEach(assignment => {
        assignment.requiredSkills.forEach(skill => allRequiredSkills.add(skill));
      });
      alloc.skills.forEach(skill => allAvailableSkills.add(skill));
    });
    
    return Array.from(allRequiredSkills).filter(skill => !allAvailableSkills.has(skill));
  }

  private assessBalancingImpact(transferAmount: number): string {
    if (transferAmount > 20) return 'High impact - significant workload change';
    if (transferAmount > 10) return 'Medium impact - moderate workload adjustment';
    return 'Low impact - minor workload rebalancing';
  }

  private calculateImprovementMetrics(
    current: Map<string, number>,
    projected: Map<string, number>
  ): { varianceReduction: number; utilizationImprovement: number; workloadDistribution: number } {
    
    const currentValues = Array.from(current.values());
    const projectedValues = Array.from(projected.values());
    
    const currentVariance = this.calculateVariance(currentValues);
    const projectedVariance = this.calculateVariance(projectedValues);
    
    const currentAvg = currentValues.reduce((a, b) => a + b, 0) / currentValues.length;
    const projectedAvg = projectedValues.reduce((a, b) => a + b, 0) / projectedValues.length;
    
    return {
      varianceReduction: ((currentVariance - projectedVariance) / currentVariance) * 100,
      utilizationImprovement: ((projectedAvg - currentAvg) / currentAvg) * 100,
      workloadDistribution: (1 - projectedVariance / Math.max(projectedVariance, currentVariance)) * 100
    };
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    return variance;
  }
}

// Supporting interfaces
interface ResourceBottleneck {
  resourceId: string;
  resourceName: string;
  utilization: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  suggestions: string[];
}

interface ResourceUnderutilization {
  resourceId: string;
  resourceName: string;
  utilization: number;
  potentialCapacity: number;
  suggestions: string[];
}

interface WorkloadBalancingPlan {
  fromResourceId: string;
  toResourceId: string;
  workloadPercentage: number;
  estimatedTasks: number;
  rationale: string;
  impact: string;
}

export const resourceOptimizer = new ResourceOptimizer();
/**
 * Budget Calculator - Advanced cost estimation, tracking, and forecasting
 * Handles budget planning, variance analysis, and financial optimization
 */

import { ProjectBudget, Project, ProjectResource, ProjectTask } from '@shared/schema';

export interface BudgetEstimation {
  projectId: string;
  totalEstimatedCost: number;
  costBreakdown: CostBreakdown;
  contingencyBudget: number;
  confidenceInterval: {
    optimistic: number;
    mostLikely: number;
    pessimistic: number;
  };
  assumptions: string[];
  riskFactors: BudgetRiskFactor[];
}

export interface CostBreakdown {
  categories: CostCategory[];
  phases: PhaseCost[];
  resources: ResourceCost[];
  timeDistribution: MonthlyCost[];
}

export interface CostCategory {
  name: string;
  description: string;
  estimatedCost: number;
  actualCost: number;
  variance: number;
  variancePercentage: number;
  subcategories: SubCategory[];
}

export interface SubCategory {
  name: string;
  budgeted: number;
  spent: number;
  committed: number;
  remaining: number;
}

export interface PhaseCost {
  phaseId: string;
  phaseName: string;
  budgeted: number;
  spent: number;
  forecasted: number;
  completion: number; // percentage
  burnRate: number; // cost per day
  projectedCompletion: Date;
}

export interface ResourceCost {
  resourceId: string;
  resourceName: string;
  resourceType: 'human' | 'equipment' | 'software' | 'space' | 'external';
  hourlyRate: number;
  hoursAllocated: number;
  hoursUsed: number;
  totalBudgeted: number;
  totalSpent: number;
  efficiency: number; // actual output / planned output
}

export interface MonthlyCost {
  period: Date;
  planned: number;
  actual: number;
  forecast: number;
  variance: number;
  cumulativePlanned: number;
  cumulativeActual: number;
}

export interface BudgetRiskFactor {
  category: string;
  risk: string;
  probability: number; // 0-1
  impact: number; // cost impact
  mitigation: string;
  contingencyAmount: number;
}

export interface BudgetForecast {
  projectedTotalCost: number;
  completionDate: Date;
  costVariance: number;
  scheduleVariance: number;
  earnedValueMetrics: {
    plannedValue: number;
    earnedValue: number;
    actualCost: number;
    costPerformanceIndex: number;
    schedulePerformanceIndex: number;
    estimateAtCompletion: number;
    estimateToComplete: number;
    budgetAtCompletion: number;
    varianceAtCompletion: number;
  };
  cashFlowForecast: CashFlowProjection[];
  recommendations: string[];
}

export interface CashFlowProjection {
  period: Date;
  inflow: number;
  outflow: number;
  netFlow: number;
  cumulativeFlow: number;
  funding: number;
}

export interface BudgetOptimization {
  originalBudget: number;
  optimizedBudget: number;
  savingsAmount: number;
  savingsPercentage: number;
  optimizations: BudgetOptimizationItem[];
  tradeoffs: string[];
  riskAssessment: {
    qualityImpact: number;
    timelineImpact: number;
    scopeImpact: number;
  };
}

export interface BudgetOptimizationItem {
  category: string;
  description: string;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  implementation: string;
  risk: 'low' | 'medium' | 'high';
}

/**
 * Advanced Budget Calculation Engine
 */
export class BudgetCalculator {

  /**
   * Generate comprehensive budget estimation for a project
   */
  async estimateProjectBudget(
    project: Project,
    tasks: ProjectTask[],
    resources: ProjectResource[],
    marketRates?: Map<string, number>
  ): Promise<BudgetEstimation> {
    
    // Calculate base cost estimation
    const costBreakdown = await this.calculateCostBreakdown(project, tasks, resources, marketRates);
    
    // Calculate total estimated cost
    const totalEstimatedCost = costBreakdown.categories.reduce((sum, cat) => sum + cat.estimatedCost, 0);
    
    // Generate confidence intervals using three-point estimation
    const confidenceInterval = this.calculateConfidenceInterval(totalEstimatedCost, project.complexity ?? undefined);
    
    // Calculate contingency budget based on risk assessment
    const riskFactors = this.assessBudgetRisks(project, tasks, resources);
    const contingencyBudget = this.calculateContingencyBudget(totalEstimatedCost, riskFactors);
    
    // Generate assumptions and documentation
    const assumptions = this.generateBudgetAssumptions(project, resources, marketRates);

    return {
      projectId: project.id,
      totalEstimatedCost,
      costBreakdown,
      contingencyBudget,
      confidenceInterval,
      assumptions,
      riskFactors
    };
  }

  /**
   * Track budget performance and generate variance analysis
   */
  async trackBudgetPerformance(
    projectId: string,
    budgets: ProjectBudget[],
    actualExpenses: Array<{
      category: string;
      amount: number;
      date: Date;
      description: string;
    }>
  ): Promise<{
    totalBudget: number;
    totalSpent: number;
    totalCommitted: number;
    totalRemaining: number;
    overallVariance: number;
    categoryAnalysis: CostCategory[];
    trendAnalysis: {
      burnRate: number;
      projectedCompletion: Date;
      budgetHealth: 'good' | 'warning' | 'critical';
      alerts: string[];
    };
  }> {
    
    const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.allocatedAmount || '0'), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + parseFloat(b.spentAmount || '0'), 0);
    const totalCommitted = budgets.reduce((sum, b) => sum + parseFloat(b.reservedAmount || '0'), 0);
    const totalRemaining = totalBudget - totalSpent - totalCommitted;
    const overallVariance = totalSpent - totalBudget;

    // Create category analysis
    const categoryAnalysis = this.createCategoryAnalysis(budgets, actualExpenses);
    
    // Generate trend analysis
    const trendAnalysis = this.analyzeBudgetTrends(budgets, actualExpenses, totalBudget);

    return {
      totalBudget,
      totalSpent,
      totalCommitted,
      totalRemaining,
      overallVariance,
      categoryAnalysis,
      trendAnalysis
    };
  }

  /**
   * Generate detailed budget forecast using earned value management
   */
  async generateBudgetForecast(
    projectId: string,
    budgets: ProjectBudget[],
    projectProgress: number, // 0-100
    timeline: { start: Date; plannedEnd: Date; currentDate: Date }
  ): Promise<BudgetForecast> {
    
    const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.allocatedAmount || '0'), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + parseFloat(b.spentAmount || '0'), 0);
    
    // Calculate earned value metrics
    const earnedValueMetrics = this.calculateEarnedValueMetrics(
      totalBudget,
      totalSpent,
      projectProgress,
      timeline
    );

    // Project future costs and completion date
    const projectedTotalCost = earnedValueMetrics.estimateAtCompletion;
    const completionDate = this.projectCompletionDate(timeline, earnedValueMetrics.schedulePerformanceIndex);
    
    // Calculate variances
    const costVariance = earnedValueMetrics.earnedValue - earnedValueMetrics.actualCost;
    const scheduleVariance = earnedValueMetrics.earnedValue - earnedValueMetrics.plannedValue;

    // Generate cash flow forecast
    const cashFlowForecast = this.generateCashFlowForecast(budgets, timeline, earnedValueMetrics);
    
    // Generate recommendations
    const recommendations = this.generateForecastRecommendations(earnedValueMetrics, costVariance, scheduleVariance);

    return {
      projectedTotalCost,
      completionDate,
      costVariance,
      scheduleVariance,
      earnedValueMetrics,
      cashFlowForecast,
      recommendations
    };
  }

  /**
   * Optimize budget allocation and identify cost savings
   */
  async optimizeBudget(
    project: Project,
    currentBudget: BudgetEstimation,
    constraints: {
      maxBudgetReduction: number; // percentage
      qualityThreshold: number; // minimum acceptable quality score
      timelineFlexibility: number; // days
    }
  ): Promise<BudgetOptimization> {
    
    const originalBudget = currentBudget.totalEstimatedCost;
    const optimizations: BudgetOptimizationItem[] = [];

    // Identify optimization opportunities
    const resourceOptimizations = this.identifyResourceOptimizations(currentBudget.costBreakdown.resources);
    const toolOptimizations = this.identifyToolOptimizations(currentBudget.costBreakdown.categories);
    const processOptimizations = this.identifyProcessOptimizations(project, currentBudget);

    optimizations.push(...resourceOptimizations, ...toolOptimizations, ...processOptimizations);

    // Calculate total potential savings
    const totalSavings = optimizations.reduce((sum, opt) => sum + opt.savings, 0);
    const constrainedSavings = Math.min(totalSavings, originalBudget * constraints.maxBudgetReduction / 100);
    
    // Select optimizations within constraints
    const selectedOptimizations = this.selectOptimizations(optimizations, constrainedSavings, constraints);
    const actualSavings = selectedOptimizations.reduce((sum, opt) => sum + opt.savings, 0);
    
    const optimizedBudget = originalBudget - actualSavings;
    const savingsPercentage = (actualSavings / originalBudget) * 100;

    // Assess impact and tradeoffs
    const riskAssessment = this.assessOptimizationRisk(selectedOptimizations, project);
    const tradeoffs = this.identifyOptimizationTradeoffs(selectedOptimizations);

    return {
      originalBudget,
      optimizedBudget,
      savingsAmount: actualSavings,
      savingsPercentage,
      optimizations: selectedOptimizations,
      tradeoffs,
      riskAssessment
    };
  }

  /**
   * Calculate detailed cost breakdown
   */
  private async calculateCostBreakdown(
    project: Project,
    tasks: ProjectTask[],
    resources: ProjectResource[],
    marketRates?: Map<string, number>
  ): Promise<CostBreakdown> {
    
    // Calculate resource costs
    const resourceCosts = this.calculateResourceCosts(resources, marketRates);
    
    // Calculate category costs
    const categories = this.calculateCategoryCosts(project, tasks, resourceCosts);
    
    // Calculate phase costs (simplified)
    const phases = this.calculatePhaseCosts(project, tasks, resourceCosts);
    
    // Calculate time distribution
    const timeDistribution = this.calculateTimeDistribution(project, resourceCosts);

    return {
      categories,
      phases,
      resources: resourceCosts,
      timeDistribution
    };
  }

  /**
   * Calculate resource costs with market rate adjustments
   */
  private calculateResourceCosts(
    resources: ProjectResource[],
    marketRates?: Map<string, number>
  ): ResourceCost[] {
    
    return resources.map(resource => {
      const baseRate = parseFloat(resource.hourlyRate || '50');
      const marketRate = marketRates?.get(resource.resourceType || 'general') || baseRate;
      const adjustedRate = Math.max(baseRate, marketRate * 0.8); // Don't go below 80% of market rate

      const hoursAllocated = parseFloat(resource.totalHoursAllocated || '0');
      const hoursUsed = parseFloat(resource.hoursUsed || '0');
      const totalBudgeted = adjustedRate * hoursAllocated;
      const totalSpent = adjustedRate * hoursUsed;
      const efficiency = hoursAllocated > 0 ? hoursUsed / hoursAllocated : 0;

      return {
        resourceId: resource.resourceId ?? resource.id,
        resourceName: resource.resourceName,
        resourceType: resource.resourceType as any || 'human',
        hourlyRate: adjustedRate,
        hoursAllocated,
        hoursUsed,
        totalBudgeted,
        totalSpent,
        efficiency
      };
    });
  }

  /**
   * Calculate costs by category
   */
  private calculateCategoryCosts(
    project: Project,
    tasks: ProjectTask[],
    resourceCosts: ResourceCost[]
  ): CostCategory[] {
    
    const categories: CostCategory[] = [
      {
        name: 'Personnel',
        description: 'Team member salaries and contractors',
        estimatedCost: resourceCosts.filter(r => r.resourceType === 'human').reduce((sum, r) => sum + r.totalBudgeted, 0),
        actualCost: resourceCosts.filter(r => r.resourceType === 'human').reduce((sum, r) => sum + r.totalSpent, 0),
        variance: 0,
        variancePercentage: 0,
        subcategories: [
          { name: 'Full-time staff', budgeted: 0, spent: 0, committed: 0, remaining: 0 },
          { name: 'Contractors', budgeted: 0, spent: 0, committed: 0, remaining: 0 },
          { name: 'Consultants', budgeted: 0, spent: 0, committed: 0, remaining: 0 }
        ]
      },
      {
        name: 'Technology',
        description: 'Software, tools, and infrastructure',
        estimatedCost: this.estimateTechnologyCosts(project, tasks),
        actualCost: 0,
        variance: 0,
        variancePercentage: 0,
        subcategories: [
          { name: 'Software licenses', budgeted: 0, spent: 0, committed: 0, remaining: 0 },
          { name: 'Cloud services', budgeted: 0, spent: 0, committed: 0, remaining: 0 },
          { name: 'Development tools', budgeted: 0, spent: 0, committed: 0, remaining: 0 }
        ]
      },
      {
        name: 'Infrastructure',
        description: 'Hosting, servers, and deployment costs',
        estimatedCost: this.estimateInfrastructureCosts(project),
        actualCost: 0,
        variance: 0,
        variancePercentage: 0,
        subcategories: [
          { name: 'Cloud hosting', budgeted: 0, spent: 0, committed: 0, remaining: 0 },
          { name: 'CDN and storage', budgeted: 0, spent: 0, committed: 0, remaining: 0 },
          { name: 'Monitoring tools', budgeted: 0, spent: 0, committed: 0, remaining: 0 }
        ]
      },
      {
        name: 'Operations',
        description: 'Project management and operational expenses',
        estimatedCost: this.estimateOperationalCosts(project, resourceCosts),
        actualCost: 0,
        variance: 0,
        variancePercentage: 0,
        subcategories: [
          { name: 'Project management', budgeted: 0, spent: 0, committed: 0, remaining: 0 },
          { name: 'Quality assurance', budgeted: 0, spent: 0, committed: 0, remaining: 0 },
          { name: 'Documentation', budgeted: 0, spent: 0, committed: 0, remaining: 0 }
        ]
      }
    ];

    // Calculate variances for each category
    categories.forEach(category => {
      category.variance = category.actualCost - category.estimatedCost;
      category.variancePercentage = category.estimatedCost > 0 
        ? (category.variance / category.estimatedCost) * 100 
        : 0;
    });

    return categories;
  }

  /**
   * Calculate phase-based costs
   */
  private calculatePhaseCosts(
    project: Project,
    tasks: ProjectTask[],
    resourceCosts: ResourceCost[]
  ): PhaseCost[] {
    
    // Simplified phase cost calculation
    const totalResourceCost = resourceCosts.reduce((sum, r) => sum + r.totalBudgeted, 0);
    
    const phases: PhaseCost[] = [
      {
        phaseId: '1',
        phaseName: 'Planning & Design',
        budgeted: totalResourceCost * 0.2,
        spent: 0,
        forecasted: totalResourceCost * 0.2,
        completion: 0,
        burnRate: totalResourceCost * 0.2 / 30, // 30 days
        projectedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        phaseId: '2',
        phaseName: 'Development',
        budgeted: totalResourceCost * 0.6,
        spent: 0,
        forecasted: totalResourceCost * 0.6,
        completion: 0,
        burnRate: totalResourceCost * 0.6 / 90, // 90 days
        projectedCompletion: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)
      },
      {
        phaseId: '3',
        phaseName: 'Testing & Deployment',
        budgeted: totalResourceCost * 0.2,
        spent: 0,
        forecasted: totalResourceCost * 0.2,
        completion: 0,
        burnRate: totalResourceCost * 0.2 / 20, // 20 days
        projectedCompletion: new Date(Date.now() + 140 * 24 * 60 * 60 * 1000)
      }
    ];

    return phases;
  }

  /**
   * Calculate time distribution of costs
   */
  private calculateTimeDistribution(
    project: Project,
    resourceCosts: ResourceCost[]
  ): MonthlyCost[] {
    
    const totalBudget = resourceCosts.reduce((sum, r) => sum + r.totalBudgeted, 0);
    const startDate = project.startDate || new Date();
    const months: MonthlyCost[] = [];

    // Distribute costs over estimated project duration (simplified to 6 months)
    for (let i = 0; i < 6; i++) {
      const period = new Date(startDate);
      period.setMonth(period.getMonth() + i);
      
      const planned = totalBudget * this.getCostDistributionWeight(i, 6);
      
      months.push({
        period,
        planned,
        actual: 0,
        forecast: planned,
        variance: 0,
        cumulativePlanned: months.reduce((sum, m) => sum + m.planned, 0) + planned,
        cumulativeActual: 0
      });
    }

    return months;
  }

  /**
   * Helper methods for cost calculations
   */
  private estimateTechnologyCosts(project: Project, tasks: ProjectTask[]): number {
    // Base technology costs based on project type and complexity
    let baseCost = 5000; // Default base cost
    
    if (project.projectType === 'web_app') baseCost = 8000;
    if (project.projectType === 'mobile_app') baseCost = 12000;
    if (project.projectType === 'ai_ml') baseCost = 15000;
    
    // Adjust for complexity
    const complexityMultiplier = {
      'trivial': 0.5,
      'easy': 0.7,
      'medium': 1.0,
      'hard': 1.5,
      'expert': 2.0
    };
    
    const multiplier = complexityMultiplier[project.complexity as keyof typeof complexityMultiplier] || 1.0;
    
    return baseCost * multiplier;
  }

  private estimateInfrastructureCosts(project: Project): number {
    // Infrastructure costs based on project type and scale
    let monthlyCost = 200; // Base monthly cost
    
    if (project.projectType === 'web_app') monthlyCost = 500;
    if (project.projectType === 'mobile_app') monthlyCost = 800;
    if (project.projectType === 'enterprise') monthlyCost = 1500;
    
    // Estimate for 12 months
    return monthlyCost * 12;
  }

  private estimateOperationalCosts(project: Project, resourceCosts: ResourceCost[]): number {
    const totalResourceCost = resourceCosts.reduce((sum, r) => sum + r.totalBudgeted, 0);
    
    // Operational costs as percentage of resource costs
    return totalResourceCost * 0.15; // 15% of resource costs
  }

  private getCostDistributionWeight(month: number, totalMonths: number): number {
    // S-curve distribution for project costs
    const progress = month / totalMonths;
    return 0.1 + 0.8 * Math.sin(progress * Math.PI);
  }

  private calculateConfidenceInterval(baseEstimate: number, complexity?: string): {
    optimistic: number;
    mostLikely: number;
    pessimistic: number;
  } {
    // Three-point estimation with complexity adjustments
    const complexityFactors = {
      'trivial': { optimistic: 0.8, pessimistic: 1.2 },
      'easy': { optimistic: 0.85, pessimistic: 1.3 },
      'medium': { optimistic: 0.9, pessimistic: 1.4 },
      'hard': { optimistic: 0.85, pessimistic: 1.6 },
      'expert': { optimistic: 0.8, pessimistic: 1.8 }
    };
    
    const factors = complexityFactors[complexity as keyof typeof complexityFactors] || { optimistic: 0.9, pessimistic: 1.4 };
    
    return {
      optimistic: baseEstimate * factors.optimistic,
      mostLikely: baseEstimate,
      pessimistic: baseEstimate * factors.pessimistic
    };
  }

  private assessBudgetRisks(
    project: Project,
    tasks: ProjectTask[],
    resources: ProjectResource[]
  ): BudgetRiskFactor[] {
    
    const risks: BudgetRiskFactor[] = [];
    
    // Scope creep risk
    if (project.complexity === 'hard' || project.complexity === 'expert') {
      risks.push({
        category: 'Scope',
        risk: 'Scope creep due to high complexity',
        probability: 0.6,
        impact: parseFloat(project.totalBudget || '0') * 0.15,
        mitigation: 'Implement strict change control process',
        contingencyAmount: parseFloat(project.totalBudget || '0') * 0.05
      });
    }
    
    // Resource availability risk
    const criticalResources = resources.filter(r => parseFloat(r.allocationPercentage || '0') > 90);
    if (criticalResources.length > 0) {
      risks.push({
        category: 'Resources',
        risk: 'Key resource unavailability',
        probability: 0.3,
        impact: parseFloat(project.totalBudget || '0') * 0.1,
        mitigation: 'Cross-train team members and maintain resource buffer',
        contingencyAmount: parseFloat(project.totalBudget || '0') * 0.03
      });
    }
    
    // Technology risk
    if (project.techStack?.some(tech => tech.includes('experimental') || tech.includes('beta'))) {
      risks.push({
        category: 'Technology',
        risk: 'Technology immaturity or compatibility issues',
        probability: 0.4,
        impact: parseFloat(project.totalBudget || '0') * 0.12,
        mitigation: 'Prototype key technologies early and have fallback options',
        contingencyAmount: parseFloat(project.totalBudget || '0') * 0.04
      });
    }
    
    return risks;
  }

  private calculateContingencyBudget(baseEstimate: number, risks: BudgetRiskFactor[]): number {
    // Calculate risk-based contingency
    const riskBasedContingency = risks.reduce((sum, risk) => 
      sum + (risk.probability * risk.impact), 0);
    
    // Add base contingency (5-15% depending on project uncertainty)
    const baseContingency = baseEstimate * 0.1;
    
    return Math.max(baseContingency, riskBasedContingency);
  }

  private generateBudgetAssumptions(
    project: Project,
    resources: ProjectResource[],
    marketRates?: Map<string, number>
  ): string[] {
    
    return [
      `Budget calculated based on ${resources.length} allocated resources`,
      'Hourly rates based on current market analysis',
      'Infrastructure costs estimated for 12-month period',
      'Contingency budget includes identified risk factors',
      `Project complexity level: ${project.complexity || 'medium'}`,
      'Technology costs include necessary tools and licenses',
      'Operational overhead calculated at 15% of resource costs'
    ];
  }

  // Additional helper methods for budget tracking and forecasting would continue here...
  private createCategoryAnalysis(budgets: ProjectBudget[], expenses: any[]): CostCategory[] {
    // Implementation for category analysis
    return [];
  }

  private analyzeBudgetTrends(budgets: ProjectBudget[], expenses: any[], totalBudget: number): any {
    // Implementation for trend analysis
    return {
      burnRate: 0,
      projectedCompletion: new Date(),
      budgetHealth: 'good' as const,
      alerts: []
    };
  }

  private calculateEarnedValueMetrics(
    totalBudget: number,
    totalSpent: number,
    projectProgress: number,
    timeline: any
  ): any {
    const plannedValue = totalBudget * (projectProgress / 100);
    const earnedValue = totalBudget * (projectProgress / 100);
    const actualCost = totalSpent;
    
    return {
      plannedValue,
      earnedValue,
      actualCost,
      costPerformanceIndex: earnedValue / actualCost,
      schedulePerformanceIndex: earnedValue / plannedValue,
      estimateAtCompletion: totalBudget * (actualCost / earnedValue),
      estimateToComplete: totalBudget - earnedValue,
      budgetAtCompletion: totalBudget,
      varianceAtCompletion: totalBudget - (totalBudget * (actualCost / earnedValue))
    };
  }

  private projectCompletionDate(timeline: any, spi: number): Date {
    // Simple projection based on schedule performance index
    const remainingDays = Math.ceil((timeline.plannedEnd.getTime() - timeline.currentDate.getTime()) / (1000 * 60 * 60 * 24));
    const adjustedDays = remainingDays / spi;
    
    const completionDate = new Date(timeline.currentDate);
    completionDate.setDate(completionDate.getDate() + adjustedDays);
    
    return completionDate;
  }

  private generateCashFlowForecast(budgets: any[], timeline: any, metrics: any): CashFlowProjection[] {
    // Implementation for cash flow forecasting
    return [];
  }

  private generateForecastRecommendations(metrics: any, costVariance: number, scheduleVariance: number): string[] {
    const recommendations: string[] = [];
    
    if (metrics.costPerformanceIndex < 0.9) {
      recommendations.push('Cost performance is below target - review expenses and optimize spending');
    }
    
    if (metrics.schedulePerformanceIndex < 0.9) {
      recommendations.push('Schedule performance is behind - consider resource reallocation');
    }
    
    if (costVariance > 0) {
      recommendations.push('Implement cost control measures to prevent budget overrun');
    }
    
    return recommendations;
  }

  private identifyResourceOptimizations(resources: ResourceCost[]): BudgetOptimizationItem[] {
    return resources
      .filter(r => r.efficiency < 0.8) // Low efficiency resources
      .map(r => ({
        category: 'Resources',
        description: `Optimize ${r.resourceName} utilization`,
        currentCost: r.totalBudgeted,
        optimizedCost: r.totalBudgeted * 0.85,
        savings: r.totalBudgeted * 0.15,
        implementation: 'Improve task allocation and provide efficiency training',
        risk: 'medium' as const
      }));
  }

  private identifyToolOptimizations(categories: CostCategory[]): BudgetOptimizationItem[] {
    // Implementation for tool optimization identification
    return [];
  }

  private identifyProcessOptimizations(project: Project, budget: BudgetEstimation): BudgetOptimizationItem[] {
    // Implementation for process optimization identification
    return [];
  }

  private selectOptimizations(
    optimizations: BudgetOptimizationItem[],
    maxSavings: number,
    constraints: any
  ): BudgetOptimizationItem[] {
    // Sort by savings/risk ratio and select within constraints
    return optimizations
      .sort((a, b) => (b.savings / this.getRiskWeight(b.risk)) - (a.savings / this.getRiskWeight(a.risk)))
      .reduce((selected, opt) => {
        const currentSavings = selected.reduce((sum, s) => sum + s.savings, 0);
        if (currentSavings + opt.savings <= maxSavings) {
          selected.push(opt);
        }
        return selected;
      }, [] as BudgetOptimizationItem[]);
  }

  private getRiskWeight(risk: string): number {
    const weights = { 'low': 1, 'medium': 1.5, 'high': 2 };
    return weights[risk as keyof typeof weights] || 1.5;
  }

  private assessOptimizationRisk(optimizations: BudgetOptimizationItem[], project: Project): any {
    // Implementation for risk assessment
    return {
      qualityImpact: 0,
      timelineImpact: 0,
      scopeImpact: 0
    };
  }

  private identifyOptimizationTradeoffs(optimizations: BudgetOptimizationItem[]): string[] {
    // Implementation for tradeoff identification
    return ['May require additional coordination', 'Could impact timeline flexibility'];
  }
}

export const budgetCalculator = new BudgetCalculator();

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Filter, X, SlidersHorizontal } from "lucide-react";
import type { ProjectTask } from "@shared/schema";

interface FilterOptions {
  status: string;
  category: string;
  priority: string;
  complexity: string;
  assignee?: string;
  tags?: string[];
}

interface TaskFilteringProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  tasks: ProjectTask[];
  showAdvanced?: boolean;
}

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "blocked", label: "Blocked" },
  { value: "cancelled", label: "Cancelled" }
];

const categoryOptions = [
  { value: "", label: "All Categories" },
  { value: "setup", label: "Setup & Infrastructure" },
  { value: "frontend", label: "Frontend Development" },
  { value: "backend", label: "Backend Development" },
  { value: "database", label: "Database Design" },
  { value: "auth", label: "Authentication" },
  { value: "testing", label: "Testing & QA" },
  { value: "docs", label: "Documentation" },
  { value: "devops", label: "DevOps & Deployment" },
  { value: "integration", label: "Integrations" }
];

const priorityOptions = [
  { value: "", label: "All Priorities" },
  { value: "low", label: "Low Priority" },
  { value: "medium", label: "Medium Priority" },
  { value: "high", label: "High Priority" },
  { value: "urgent", label: "Urgent" }
];

const complexityOptions = [
  { value: "", label: "All Complexities" },
  { value: "low", label: "Low Complexity" },
  { value: "medium", label: "Medium Complexity" },
  { value: "high", label: "High Complexity" }
];

export function TaskFiltering({ 
  filters, 
  onFiltersChange, 
  tasks, 
  showAdvanced = true 
}: TaskFilteringProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getUniqueValues = (field: keyof ProjectTask) => {
    const values = tasks.map(task => task[field]).filter(Boolean);
    return [...new Set(values)] as string[];
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => 
      value && (Array.isArray(value) ? value.length > 0 : true)
    ).length;
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: "",
      category: "",
      priority: "",
      complexity: "",
      assignee: "",
      tags: []
    });
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string | string[]) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const getFilterSummary = () => {
    const activeFilters = [];
    
    if (filters.status) {
      const statusLabel = statusOptions.find(opt => opt.value === filters.status)?.label;
      activeFilters.push(statusLabel);
    }
    
    if (filters.category) {
      const categoryLabel = categoryOptions.find(opt => opt.value === filters.category)?.label;
      activeFilters.push(categoryLabel);
    }
    
    if (filters.priority) {
      const priorityLabel = priorityOptions.find(opt => opt.value === filters.priority)?.label;
      activeFilters.push(priorityLabel);
    }
    
    if (filters.complexity) {
      const complexityLabel = complexityOptions.find(opt => opt.value === filters.complexity)?.label;
      activeFilters.push(complexityLabel);
    }

    return activeFilters;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Quick filters */}
      <div className="flex items-center gap-2">
        <Select 
          value={filters.status} 
          onValueChange={(value) => handleFilterChange("status", value)}
        >
          <SelectTrigger className="w-36" data-testid="select-filter-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.category} 
          onValueChange={(value) => handleFilterChange("category", value)}
        >
          <SelectTrigger className="w-36" data-testid="select-filter-category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.priority} 
          onValueChange={(value) => handleFilterChange("priority", value)}
        >
          <SelectTrigger className="w-36" data-testid="select-filter-priority">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="relative"
              data-testid="button-advanced-filters"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {getActiveFilterCount() > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Advanced Filters</h4>
                {getActiveFilterCount() > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearAllFilters}
                    data-testid="button-clear-filters"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Complexity</Label>
                  <Select 
                    value={filters.complexity} 
                    onValueChange={(value) => handleFilterChange("complexity", value)}
                  >
                    <SelectTrigger className="w-full" data-testid="select-filter-complexity">
                      <SelectValue placeholder="Select complexity" />
                    </SelectTrigger>
                    <SelectContent>
                      {complexityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Task assignees (if available) */}
                {getUniqueValues("assigneeId").length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Assignee</Label>
                    <Select 
                      value={filters.assignee || ""} 
                      onValueChange={(value) => handleFilterChange("assignee", value)}
                    >
                      <SelectTrigger className="w-full" data-testid="select-filter-assignee">
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Assignees</SelectItem>
                        {getUniqueValues("assigneeId").map((assigneeId) => (
                          <SelectItem key={assigneeId} value={assigneeId}>
                            {assigneeId} {/* TODO: Replace with actual user name */}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Quick status filters */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Quick Status Filters</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={filters.status === "pending" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange("status", filters.status === "pending" ? "" : "pending")}
                      data-testid="button-filter-pending"
                    >
                      Pending
                    </Button>
                    <Button
                      variant={filters.status === "in_progress" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange("status", filters.status === "in_progress" ? "" : "in_progress")}
                      data-testid="button-filter-in-progress"
                    >
                      In Progress
                    </Button>
                    <Button
                      variant={filters.status === "completed" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange("status", filters.status === "completed" ? "" : "completed")}
                      data-testid="button-filter-completed"
                    >
                      Completed
                    </Button>
                  </div>
                </div>

                {/* Priority filters */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Priority Filters</Label>
                  <div className="space-y-2">
                    {priorityOptions.slice(1).map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`priority-${option.value}`}
                          checked={filters.priority === option.value}
                          onCheckedChange={(checked) => 
                            handleFilterChange("priority", checked ? option.value : "")
                          }
                          data-testid={`checkbox-priority-${option.value}`}
                        />
                        <Label 
                          htmlFor={`priority-${option.value}`} 
                          className="text-sm cursor-pointer"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Active filter tags */}
      {getActiveFilterCount() > 0 && (
        <div className="flex items-center gap-1 ml-2">
          {getFilterSummary().map((filter, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="text-xs"
              data-testid={`badge-active-filter-${index}`}
            >
              {filter}
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 w-6 p-0"
            data-testid="button-clear-all-filters"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
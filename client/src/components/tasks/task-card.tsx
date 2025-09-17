import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Pause,
  X,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  User,
  Tag,
  Link,
  Target,
  Settings
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProjectTask } from "@shared/schema";

interface TaskCardProps {
  task: ProjectTask;
  viewMode: "list" | "grid";
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onStatusChange?: (status: string) => void;
  onClick?: () => void;
  className?: string;
  "data-testid"?: string;
}

const statusIcons = {
  pending: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle,
  blocked: Pause,
  cancelled: X
};

const statusColors = {
  pending: "text-gray-500 bg-gray-100 dark:bg-gray-800",
  in_progress: "text-blue-500 bg-blue-100 dark:bg-blue-900",
  completed: "text-green-500 bg-green-100 dark:bg-green-900",
  blocked: "text-orange-500 bg-orange-100 dark:bg-orange-900",
  cancelled: "text-red-500 bg-red-100 dark:bg-red-900"
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

export function TaskCard({ 
  task, 
  viewMode, 
  isSelected = false, 
  onSelect, 
  onStatusChange,
  onClick,
  className = "",
  "data-testid": testId
}: TaskCardProps) {
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority,
    complexity: task.complexity,
    estimatedHours: task.estimatedHours || "",
    estimatedDays: task.estimatedDays || "",
    notes: task.notes || ""
  });

  const StatusIcon = statusIcons[task.status as keyof typeof statusIcons] || Clock;

  const updateTaskMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest("PUT", `/api/tasks/${task.id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Task Updated",
        description: "Task has been updated successfully",
      });
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/project"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/tasks/${task.id}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Task Deleted",
        description: "Task has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/project"] });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  const handleSaveEdit = () => {
    updateTaskMutation.mutate(editForm);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate();
    }
  };

  const formatDuration = () => {
    const hours = parseFloat(task.estimatedHours || "0");
    const days = parseFloat(task.estimatedDays || "0");
    
    if (days > 0) {
      return `${days}d`;
    } else if (hours > 0) {
      return `${hours}h`;
    }
    return "N/A";
  };

  if (viewMode === "list") {
    return (
      <Card 
        className={`transition-all hover:shadow-md ${isSelected ? "ring-2 ring-blue-500" : ""} ${className}`}
        data-testid={testId}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {onSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
                className="mt-1"
                data-testid={`checkbox-select-${task.id}`}
              />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 
                    className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 truncate"
                    onClick={onClick}
                    data-testid={`text-task-title-${task.id}`}
                  >
                    {task.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                    {task.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={categoryColors[task.category as keyof typeof categoryColors] || "bg-gray-100"}>
                    {task.category}
                  </Badge>
                  
                  <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                    {task.priority}
                  </Badge>
                  
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusColors[task.status as keyof typeof statusColors]}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span className="capitalize">{task.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration()}</span>
                </div>
                
                <Badge variant="outline" className={complexityColors[task.complexity as keyof typeof complexityColors]}>
                  {task.complexity}
                </Badge>
                
                {task.costEstimate && parseFloat(task.costEstimate) > 0 && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    <span>${task.costEstimate}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {onStatusChange && (
                <Select value={task.status} onValueChange={onStatusChange}>
                  <SelectTrigger className="w-32" data-testid={`select-status-${task.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid={`button-edit-${task.id}`}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                  </DialogHeader>
                  <EditTaskForm 
                    task={task} 
                    form={editForm} 
                    setForm={setEditForm} 
                    onSave={handleSaveEdit}
                    isLoading={updateTaskMutation.isLoading}
                  />
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDelete}
                disabled={deleteTaskMutation.isLoading}
                data-testid={`button-delete-${task.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card 
      className={`transition-all hover:shadow-md cursor-pointer ${isSelected ? "ring-2 ring-blue-500" : ""} ${className}`}
      onClick={onClick}
      data-testid={testId}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {onSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(e) => {
                  e.stopPropagation();
                  onSelect?.(!!e);
                }}
                data-testid={`checkbox-select-${task.id}`}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <Badge className={categoryColors[task.category as keyof typeof categoryColors] || "bg-gray-100"}>
              {task.category}
            </Badge>
          </div>
          
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusColors[task.status as keyof typeof statusColors]}`}>
            <StatusIcon className="w-3 h-3" />
            <span className="capitalize">{task.status.replace('_', ' ')}</span>
          </div>
        </div>
        
        <CardTitle className="text-base leading-tight" data-testid={`text-task-title-${task.id}`}>
          {task.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
          {task.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
              {task.priority}
            </Badge>
            <Badge variant="outline" className={complexityColors[task.complexity as keyof typeof complexityColors]}>
              {task.complexity}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{formatDuration()}</span>
          </div>
        </div>
        
        {task.costEstimate && parseFloat(task.costEstimate) > 0 && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <DollarSign className="w-3 h-3" />
            <span>Est. cost: ${task.costEstimate}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2">
          {onStatusChange && (
            <Select 
              value={task.status} 
              onValueChange={(value) => {
                onStatusChange(value);
              }}
            >
              <SelectTrigger className="w-28" data-testid={`select-status-${task.id}`} onClick={(e) => e.stopPropagation()}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          <div className="flex items-center gap-1">
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()} data-testid={`button-edit-${task.id}`}>
                  <Edit className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Task</DialogTitle>
                </DialogHeader>
                <EditTaskForm 
                  task={task} 
                  form={editForm} 
                  setForm={setEditForm} 
                  onSave={handleSaveEdit}
                  isLoading={updateTaskMutation.isLoading}
                />
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              disabled={deleteTaskMutation.isLoading}
              data-testid={`button-delete-${task.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Edit task form component
function EditTaskForm({ 
  task, 
  form, 
  setForm, 
  onSave, 
  isLoading 
}: {
  task: ProjectTask;
  form: any;
  setForm: (form: any) => void;
  onSave: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          data-testid="input-edit-title"
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
          data-testid="textarea-edit-description"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value })}>
            <SelectTrigger data-testid="select-edit-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="complexity">Complexity</Label>
          <Select value={form.complexity} onValueChange={(value) => setForm({ ...form, complexity: value })}>
            <SelectTrigger data-testid="select-edit-complexity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="estimatedHours">Estimated Hours</Label>
          <Input
            id="estimatedHours"
            type="number"
            value={form.estimatedHours}
            onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
            data-testid="input-edit-hours"
          />
        </div>
        
        <div>
          <Label htmlFor="estimatedDays">Estimated Days</Label>
          <Input
            id="estimatedDays"
            type="number"
            step="0.1"
            value={form.estimatedDays}
            onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })}
            data-testid="input-edit-days"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          data-testid="textarea-edit-notes"
        />
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button 
          onClick={onSave} 
          disabled={isLoading}
          data-testid="button-save-edit"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
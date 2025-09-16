import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Code, Database, Palette, Server, CreditCard, Wrench } from "lucide-react";
import Navigation from "@/components/layout/navigation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";

interface UserToolWithTool {
  user_tools: {
    id: string;
    userId: string;
    toolId: string;
    monthlyCost: string;
    quantity: number;
    addedAt: string;
  };
  tool: {
    id: string;
    name: string;
    description: string;
    category: string;
    popularityScore: string;
    maturityScore: string;
    pricing: string;
  };
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "AI Coding Tools":
    case "IDE/Development":
      return Code;
    case "Frontend/Design":
      return Palette;
    case "Backend/Database":
      return Database;
    case "DevOps/Deployment":
      return Server;
    case "Payment Platforms":
      return CreditCard;
    default:
      return Wrench;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "AI Coding Tools":
    case "IDE/Development":
      return "text-primary bg-primary/10";
    case "Frontend/Design":
      return "text-secondary bg-secondary/10";
    case "Backend/Database":
      return "text-accent bg-accent/10";
    case "DevOps/Deployment":
      return "text-blue-600 bg-blue-100";
    case "Payment Platforms":
      return "text-orange-600 bg-orange-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
};

export default function MyStack() {
  const { toast } = useToast();
  const [editingTool, setEditingTool] = useState<UserToolWithTool | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: userTools = [], isLoading } = useQuery<UserToolWithTool[]>({
    queryKey: ["/api/user-tools"],
  });

  const editForm = useForm({
    defaultValues: {
      monthlyCost: "",
      quantity: 1,
    },
  });

  const updateToolMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      await apiRequest("PUT", `/api/user-tools/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-tools"] });
      setIsEditDialogOpen(false);
      setEditingTool(null);
      toast({
        title: "Tool updated",
        description: "Your tool has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeToolMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/user-tools/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-tools"] });
      toast({
        title: "Tool removed",
        description: "Tool has been removed from your stack.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditTool = (tool: UserToolWithTool) => {
    setEditingTool(tool);
    editForm.reset({
      monthlyCost: tool.user_tools.monthlyCost || "",
      quantity: tool.user_tools.quantity || 1,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTool = (data: any) => {
    if (editingTool) {
      updateToolMutation.mutate({
        id: editingTool.user_tools.id,
        updates: {
          monthlyCost: data.monthlyCost || "0",
          quantity: parseInt(data.quantity) || 1,
        },
      });
    }
  };

  const handleRemoveTool = (id: string) => {
    if (confirm("Are you sure you want to remove this tool from your stack?")) {
      removeToolMutation.mutate(id);
    }
  };

  // Calculate total cost
  const totalCost = userTools.reduce((sum, item) => {
    const cost = parseFloat(item.user_tools.monthlyCost || "0");
    return sum + cost;
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">My Tech Stack</h2>
              <p className="text-muted-foreground">
                Manage your current tools and subscriptions • Total: ${totalCost.toFixed(2)}/month
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-muted rounded-lg"></div>
                        <div>
                          <div className="h-5 bg-muted rounded w-24 mb-2"></div>
                          <div className="h-4 bg-muted rounded w-32"></div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : userTools.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No tools in your stack</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your tech stack by discovering and adding tools
                </p>
                <Button data-testid="button-discover-tools" asChild>
                  <a href="/discover">
                    <Plus className="h-4 w-4 mr-2" />
                    Discover Tools
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stack Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {userTools.map((item) => {
                  const IconComponent = getCategoryIcon(item.tool.category);
                  const iconColorClass = getCategoryColor(item.tool.category);
                  
                  return (
                    <Card key={item.user_tools.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColorClass}`}>
                              <IconComponent className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground" data-testid={`text-tool-name-${item.tool.id}`}>
                                {item.tool.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {item.tool.category}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTool(item)}
                              data-testid={`button-edit-${item.tool.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveTool(item.user_tools.id)}
                              data-testid={`button-remove-${item.tool.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Monthly Cost</span>
                            <span className="text-sm font-medium text-foreground" data-testid={`text-cost-${item.tool.id}`}>
                              {item.user_tools.monthlyCost ? `$${item.user_tools.monthlyCost}` : "Free"}
                            </span>
                          </div>
                          {item.tool.popularityScore && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Popularity</span>
                              <div className="flex items-center">
                                <div className="w-16 bg-muted rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-secondary h-2 rounded-full"
                                    style={{ width: `${(parseFloat(item.tool.popularityScore) / 10) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {item.tool.popularityScore}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Stack Summary Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Stack Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tool</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Cost</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Popularity</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {userTools.map((item) => {
                          const IconComponent = getCategoryIcon(item.tool.category);
                          const iconColorClass = getCategoryColor(item.tool.category);
                          
                          return (
                            <tr key={item.user_tools.id}>
                              <td className="py-4 px-4">
                                <div className="flex items-center">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${iconColorClass}`}>
                                    <IconComponent className="h-4 w-4" />
                                  </div>
                                  <span className="font-medium text-foreground">{item.tool.name}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-sm text-muted-foreground">
                                {item.tool.category}
                              </td>
                              <td className="py-4 px-4 text-sm text-foreground">
                                {item.user_tools.monthlyCost ? `$${item.user_tools.monthlyCost}/month` : "Free"}
                              </td>
                              <td className="py-4 px-4">
                                {item.tool.popularityScore ? (
                                  <Badge variant="secondary">
                                    {parseFloat(item.tool.popularityScore) >= 9 ? "High" : 
                                     parseFloat(item.tool.popularityScore) >= 7 ? "Medium" : "Growing"} 
                                    ({item.tool.popularityScore})
                                  </Badge>
                                ) : (
                                  <span className="text-sm text-muted-foreground">N/A</span>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditTool(item)}
                                    data-testid={`button-table-edit-${item.tool.id}`}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveTool(item.user_tools.id)}
                                    data-testid={`button-table-remove-${item.tool.id}`}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Edit Tool Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent data-testid="dialog-edit-tool">
              <DialogHeader>
                <DialogTitle>Edit Tool</DialogTitle>
              </DialogHeader>
              {editingTool && (
                <form onSubmit={editForm.handleSubmit(handleUpdateTool)} className="space-y-4">
                  <div>
                    <Label htmlFor="edit-tool-name">Tool Name</Label>
                    <Input
                      id="edit-tool-name"
                      value={editingTool.tool.name}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-monthly-cost">Monthly Cost ($)</Label>
                    <Input
                      id="edit-monthly-cost"
                      data-testid="input-edit-monthly-cost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...editForm.register("monthlyCost")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-quantity">Quantity</Label>
                    <Input
                      id="edit-quantity"
                      data-testid="input-edit-quantity"
                      type="number"
                      min="1"
                      {...editForm.register("quantity")}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      data-testid="button-save-edit"
                      disabled={updateToolMutation.isPending}
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

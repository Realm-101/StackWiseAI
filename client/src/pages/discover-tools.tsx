import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Code, Database, Palette, Server, CreditCard, Wrench } from "lucide-react";
import Navigation from "@/components/layout/navigation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Tool } from "@shared/schema";

const categories = [
  { value: "all", label: "All" },
  { value: "AI Coding Tools", label: "AI Tools" },
  { value: "Frontend/Design", label: "Frontend" },
  { value: "Backend/Database", label: "Backend" },
  { value: "DevOps/Deployment", label: "DevOps" },
  { value: "Payment Platforms", label: "Payments" },
  { value: "IDE/Development", label: "IDE" },
];

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

export default function DiscoverTools() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: tools = [], isLoading } = useQuery<Tool[]>({
    queryKey: ["/api/tools"],
  });

  const { data: userTools = [] } = useQuery({
    queryKey: ["/api/user-tools"],
  });

  const addToolMutation = useMutation({
    mutationFn: async (toolId: string) => {
      await apiRequest("POST", "/api/user-tools", {
        toolId,
        monthlyCost: "0",
        quantity: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cost-trends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/analysis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/redundancies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/missing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stack/compatibility"] });
      toast({
        title: "Tool added",
        description: "Tool has been added to your stack.",
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

  // Get user tool IDs for checking if tool is already added
  const userToolIds = new Set(Array.isArray(userTools) ? userTools.map((ut: any) => ut.tool?.id || ut.toolId) : []);

  // Filter tools based on search and category
  const filteredTools = tools.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleAddTool = (toolId: string) => {
    addToolMutation.mutate(toolId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Discover Tools</h2>
            <p className="text-muted-foreground">Browse and add new tools to your tech stack</p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search tools..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-tools"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category.value}
                      variant={selectedCategory === category.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.value)}
                      data-testid={`button-filter-${category.value}`}
                    >
                      {category.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tools Grid */}
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
          ) : filteredTools.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No tools found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or filters
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map((tool) => {
                const IconComponent = getCategoryIcon(tool.category);
                const iconColorClass = getCategoryColor(tool.category);
                const isAdded = userToolIds.has(tool.id);
                const frameworks = tool.frameworks ? tool.frameworks.split(";").slice(0, 3) : [];
                
                return (
                  <Card key={tool.id} className="hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColorClass}`}>
                            <IconComponent className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground" data-testid={`text-tool-name-${tool.id}`}>
                              {tool.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {tool.category}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          disabled={isAdded || addToolMutation.isPending}
                          onClick={() => handleAddTool(tool.id)}
                          data-testid={`button-add-tool-${tool.id}`}
                        >
                          {isAdded ? (
                            "Added"
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {tool.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {tool.description}
                        </p>
                      )}
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Pricing</span>
                          <span className="font-medium text-foreground" data-testid={`text-pricing-${tool.id}`}>
                            {tool.pricing || "Contact for pricing"}
                          </span>
                        </div>
                        {tool.popularityScore && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Popularity</span>
                            <div className="flex items-center">
                              <div className="w-16 bg-muted rounded-full h-2 mr-2">
                                <div 
                                  className="bg-secondary h-2 rounded-full"
                                  style={{ width: `${(parseFloat(tool.popularityScore) / 10) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {tool.popularityScore}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {frameworks.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {frameworks.map((framework, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {framework.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Bolt, Layers, Lightbulb, Plus, Edit, Trash2 } from "lucide-react";
import Navigation from "@/components/layout/navigation";
import { CategoryChart } from "@/components/charts/category-chart";
import { PopularityChart } from "@/components/charts/popularity-chart";

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
    category: string;
    popularityScore: string;
  };
}

export default function Dashboard() {
  const { data: userTools = [], isLoading: userToolsLoading } = useQuery<UserToolWithTool[]>({
    queryKey: ["/api/user-tools"],
  });

  const { data: savedIdeas = [] } = useQuery({
    queryKey: ["/api/saved-ideas"],
  });

  // Calculate metrics
  const totalCost = userTools.reduce((sum, item) => {
    const cost = parseFloat(item.user_tools.monthlyCost || "0");
    return sum + cost;
  }, 0);

  const activeTools = userTools.length;

  const categories = Array.from(new Set(userTools.map(item => item.tool.category)));
  const categoriesCount = categories.length;

  const savedIdeasCount = Array.isArray(savedIdeas) ? savedIdeas.length : 0;

  // Recent activity (last 5 added tools)
  const recentActivity = userTools
    .sort((a, b) => new Date(b.user_tools.addedAt).getTime() - new Date(a.user_tools.addedAt).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h2>
            <p className="text-muted-foreground">Monitor your tech stack value and composition</p>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Monthly Cost</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-cost">
                      ${totalCost.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Bolt</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-active-tools">
                      {activeTools}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Bolt className="h-6 w-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Categories</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-categories">
                      {categoriesCount}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Layers className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Saved Ideas</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-saved-ideas">
                      {savedIdeasCount}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                    <Lightbulb className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Cost by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryChart userTools={userTools} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bolt by Popularity</CardTitle>
              </CardHeader>
              <CardContent>
                <PopularityChart userTools={userTools} />
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {userToolsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
                        <div className="w-10 h-10 bg-muted-foreground/20 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted-foreground/20 rounded w-1/3 mb-2"></div>
                          <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((item) => (
                    <div key={item.user_tools.id} className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <Plus className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          Added {item.tool.name} to {item.tool.category}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.user_tools.addedAt).toLocaleDateString()} • 
                          ${item.user_tools.monthlyCost || "Free"}
                          {item.user_tools.monthlyCost && "/month"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bolt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No activity yet</h3>
                  <p className="text-muted-foreground">Start by adding tools to your stack to see activity here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

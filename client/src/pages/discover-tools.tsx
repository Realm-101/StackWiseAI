import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Code, Database, Palette, Server, CreditCard, Wrench, Shield, Brain } from "lucide-react";
import Navigation from "@/components/layout/navigation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DiscoveryCategory, DiscoveryToolSummary, TrendingToolsResponse } from "@shared/schema";

const getToolPopularityScore = (tool: any): number => {
  const raw = tool?.metrics?.popularity ?? tool?.popularityScore ?? tool?.popularity?.score ?? null;
  const numeric = typeof raw === 'number' ? raw : raw !== null && raw !== undefined ? parseFloat(raw) : NaN;
  return Number.isFinite(numeric) ? numeric : 0;
};

const getToolPopularityLabel = (tool: any): string => {
  const score = getToolPopularityScore(tool);
  return score > 0 ? score.toFixed(1) : 'N/A';
};

const formatLabel = (value: string) => value.replace(/[-_]/g, ' ').replace(/\w/g, char => char.toUpperCase());

const formatSourceType = (sourceType: string) => formatLabel(sourceType);
const formatPricingModel = (pricing: string) => formatLabel(pricing);

const DEFAULT_CATEGORY_FILTERS = [
  { value: 'all', label: 'All Tools' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'database', label: 'Database' },
  { value: 'devops', label: 'DevOps' },
  { value: 'testing', label: 'Testing' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'security', label: 'Security' },
  { value: 'machine-learning', label: 'AI/ML' },
];

const SourceStatusBanner = ({ statuses }: { statuses: { source: string; status: string; message?: string | null }[] }) => {
  if (!statuses || statuses.length === 0) {
    return null;
  }

  const badgeClass = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-emerald-100 text-emerald-800';
      case 'degraded':
        return 'bg-amber-100 text-amber-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const impacted = statuses.filter(status => status.status !== 'ok');
  const bannerClass = impacted.length > 0
    ? 'border border-destructive/40 bg-destructive/10 text-destructive-foreground rounded-lg p-4 space-y-2'
    : 'border border-muted bg-muted text-muted-foreground rounded-lg p-4 space-y-2';

  return (
    <div className={bannerClass}>
      <div className="font-medium">
        {impacted.length > 0
          ? 'Some discovery sources are degraded'
          : 'All discovery sources are operating normally'}
      </div>
      <div className="flex flex-wrap gap-2">
        {statuses.map(status => (
          <Badge key={status.source} variant="secondary" className={badgeClass(status.status)}>
            {status.source}: {status.status}
          </Badge>
        ))}
      </div>
      {impacted.map(status => (
        <p key={`${status.source}-message`} className="text-sm">
          {status.message ?? `${status.source}: temporarily unavailable, retrying soon.`}
        </p>
      ))}
    </div>
  );
};

const categories = [
  { value: "all", label: "All" },
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "database", label: "Database" },
  { value: "devops", label: "DevOps" },
  { value: "testing", label: "Testing" },
  { value: "monitoring", label: "Monitoring" },
  { value: "security", label: "Security" },
  { value: "machine-learning", label: "AI/ML" },
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "frontend":
      return Palette;
    case "backend":
      return Server;
    case "database":
      return Database;
    case "devops":
      return Wrench;
    case "testing":
      return Search;
    case "monitoring":
      return CreditCard;
    case "security":
      return Shield;
    case "machine-learning":
      return Brain;
    default:
      return Code;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "frontend":
      return "text-secondary bg-secondary/10";
    case "backend":
      return "text-accent bg-accent/10";
    case "database":
      return "text-blue-600 bg-blue-100";
    case "devops":
      return "text-orange-600 bg-orange-100";
    case "testing":
      return "text-purple-600 bg-purple-100";
    case "monitoring":
      return "text-green-600 bg-green-100";
    case "security":
      return "text-red-600 bg-red-100";
    case "machine-learning":
      return "text-amber-600 bg-amber-100";
    default:
      return "text-primary bg-primary/10";
  }
};

export default function DiscoverTools() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSourceType, setSelectedSourceType] = useState("all");
  const [selectedPricingModel, setSelectedPricingModel] = useState("all");

  const { data: trendingData, isLoading } = useQuery<TrendingToolsResponse>({
    queryKey: ["/api/discovery/trending", { timeframe: 'week', limit: 60 }],
  });

  const { data: discoveryCategories = [] } = useQuery<DiscoveryCategory[]>({
    queryKey: ["/api/discovery/categories"],
  });

  const tools = trendingData?.items ?? [];

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    trendingData?.categories?.forEach(({ category, count }) => {
      counts.set(category, count);
    });
    return counts;
  }, [trendingData]);

  const categoryFilters = useMemo(() => {
    if (!discoveryCategories || discoveryCategories.length === 0) {
      return DEFAULT_CATEGORY_FILTERS;
    }

    const seen = new Set<string>();
    const unique: { value: string; label: string }[] = [];

    discoveryCategories.forEach((cat: any) => {
      const rawValue = (cat.id ?? cat.slug ?? cat.name ?? '').toString();
      const value = rawValue.toLowerCase();
      if (!value || seen.has(value)) {
        return;
      }
      seen.add(value);
      unique.push({ value, label: cat.name ?? formatLabel(value) });
    });

    return [{ value: 'all', label: 'All Tools' }, ...unique];
  }, [discoveryCategories]);

  useEffect(() => {
    if (selectedCategory !== 'all' && !categoryFilters.some(filter => filter.value === selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [categoryFilters, selectedCategory]);

  const availableSourceTypes = useMemo(() => {
    const set = new Set<string>();
    tools.forEach(tool => {
      if (tool.provenance.sourceType) {
        set.add(tool.provenance.sourceType);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tools]);

  const availablePricingModels = useMemo(() => {
    const set = new Set<string>();
    tools.forEach(tool => {
      const pricing = tool.badges.pricing;
      if (pricing && pricing !== 'unknown') {
        set.add(pricing);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tools]);

  const { data: userTools = [] } = useQuery({
    queryKey: ["/api/user-tools"],
  });

  const addToolMutation = useMutation({
    mutationFn: async (tool: DiscoveryToolSummary) => {
      await apiRequest("POST", `/api/discovery/tools/${encodeURIComponent(tool.id)}/add`, {
        summary: tool,
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
  const userToolNames = new Set(
    Array.isArray(userTools)
      ? userTools
          .map((ut: any) => (ut.tool?.name || ut.toolName || '').toLowerCase())
          .filter((name: string) => name.length > 0)
      : []
  );

  // Filter tools based on search and category
  const filteredTools = tools.filter((tool) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      tool.name.toLowerCase().includes(query) ||
      (tool.description ?? '').toLowerCase().includes(query) ||
      tool.category.toLowerCase().includes(query) ||
      tool.tech.tags.some(tag => tag.toLowerCase().includes(query));

    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSourceType = selectedSourceType === 'all' || tool.provenance.sourceType === selectedSourceType;
    const matchesPricingModel = selectedPricingModel === 'all' || tool.badges.pricing === selectedPricingModel;

    return matchesSearch && matchesCategory && matchesSourceType && matchesPricingModel;
  });

  const handleAddTool = (tool: DiscoveryToolSummary) => {
    addToolMutation.mutate(tool);
  };

  const sourceStatuses = trendingData?.sourceStatuses ?? [];

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
          <Card className="mb-4">
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
                  {categoryFilters.map((category) => {
                    const count = category.value === 'all' ? tools.length : categoryCounts.get(category.value) ?? 0;
                    return (
                      <Button
                        key={category.value}
                        variant={selectedCategory === category.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.value)}
                        data-testid={`button-filter-${category.value}`}
                      >
                        {category.label}
                        {count > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">{count}</span>
                        )}
                      </Button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-4">
                  {availableSourceTypes.length > 0 && (
                    <Select value={selectedSourceType} onValueChange={setSelectedSourceType}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All sources" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All sources</SelectItem>
                        {availableSourceTypes.map((source) => (
                          <SelectItem key={source} value={source}>
                            {formatSourceType(source)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {availablePricingModels.length > 0 && (
                    <Select value={selectedPricingModel} onValueChange={setSelectedPricingModel}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All pricing" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All pricing</SelectItem>
                        {availablePricingModels.map((model) => (
                          <SelectItem key={model} value={model}>
                            {formatPricingModel(model)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mb-8">
            <SourceStatusBanner statuses={sourceStatuses} />
          </div>

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
                const popularityScore = getToolPopularityScore(tool);
                const popularityLabel = getToolPopularityLabel(tool);
                const iconColorClass = getCategoryColor(tool.category);
                const isAdded = userToolNames.has(tool.name.toLowerCase());
                const frameworks = tool.tech.frameworks?.slice(0, 3) ?? [];
                
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
                          onClick={() => handleAddTool(tool)}
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
                            {tool.badges.pricing}
                          </span>
                        </div>
                        {popularityScore > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Popularity</span>
                            <div className="flex items-center">
                              <div className="w-16 bg-muted rounded-full h-2 mr-2">
                                <div
                                  className="bg-secondary h-2 rounded-full"
                                  style={{ width: `${Math.min(popularityScore, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {popularityLabel}
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


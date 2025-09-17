import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Search, 
  TrendingUp, 
  Filter, 
  Star, 
  Download, 
  Calendar,
  ExternalLink,
  Heart,
  Eye,
  GitBranch,
  Package,
  Zap,
  Settings,
  Database,
  Code,
  Globe,
  Shield,
  Layers
} from "lucide-react";
import Navigation from "@/components/layout/navigation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { 
  DiscoveryToolSummary, 
  DiscoverySourceStatus, 
  DiscoverySearchRequest, 
  DiscoveryTrendingRequest,
  TrendingToolsResponse,
  DiscoverySearchResponse 
} from "@shared/schema";

const discoveryCategories = [
  { id: "all", name: "All Tools", icon: Layers, description: "Browse all discovered tools" },
  { id: "frontend", name: "Frontend", icon: Globe, description: "UI frameworks and libraries" },
  { id: "backend", name: "Backend", icon: Database, description: "Server-side frameworks and APIs" },
  { id: "database", name: "Database", icon: Database, description: "Data storage solutions" },
  { id: "devops", name: "DevOps", icon: Settings, description: "Deployment and operations" },
  { id: "testing", name: "Testing", icon: Shield, description: "Testing frameworks and tools" },
  { id: "monitoring", name: "Monitoring", icon: Eye, description: "Observability and monitoring" },
  { id: "security", name: "Security", icon: Shield, description: "Security tools and services" },
  { id: "machine-learning", name: "AI/ML", icon: Zap, description: "Machine learning frameworks" },
];

const sourceTypeLabels = {
  npm: "npm",
  github: "GitHub",
  pypi: "PyPI",
  docker: "Docker Hub",
  packagist: "Packagist",
  cargo: "Cargo",
  maven: "Maven",
};

const difficultyColors = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  expert: "bg-red-100 text-red-800",
};

const pricingColors = {
  free: "bg-blue-100 text-blue-800",
  freemium: "bg-purple-100 text-purple-800",
  paid: "bg-orange-100 text-orange-800",
  enterprise: "bg-gray-100 text-gray-800",
  unknown: "bg-gray-100 text-gray-800",
};

function SourceStatusBanner({ statuses }: { statuses: DiscoverySourceStatus[] }) {
  if (!statuses || statuses.length === 0) {
    return null;
  }

  const badgeClass = (status: DiscoverySourceStatus['status']) => {
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
  const variant = impacted.length > 0 ? 'destructive' : 'default';

  return (
    <Alert variant={variant} className="space-y-3">
      <AlertTitle>
        {impacted.length > 0
          ? 'Some discovery sources are degraded'
          : 'All discovery sources are operating normally'}
      </AlertTitle>
      <AlertDescription className="flex flex-wrap gap-2">
        {statuses.map(status => (
          <Badge
            key={status.source}
            variant="secondary"
            className={badgeClass(status.status)}
          >
            {status.source}: {status.status}
          </Badge>
        ))}
      </AlertDescription>
      {impacted.map(status => (
        <AlertDescription
          key={`${status.source}-message`}
          className="text-sm text-muted-foreground"
        >
          {status.message
            ? `${status.source}: ${status.message}`
            : `${status.source}: temporarily unavailable, retrying soon.`}
        </AlertDescription>
      ))}
    </Alert>
  );
}

interface ToolDiscoveryCardProps {
  tool: DiscoveryToolSummary;
  onAddTool: (toolId: string) => void;
  onEvaluate: (toolId: string) => void;
  isAdding: boolean;
}

function ToolDiscoveryCard({ tool, onAddTool, onEvaluate, isAdding }: ToolDiscoveryCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (value: string | Date | null | undefined) => {
    if (!value) return "";
    const date = typeof value === "string" ? new Date(value) : value;
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleDateString();
  };

  const starsCount = Number(tool.metrics.githubStars ?? 0);
  const downloadsCount = Number(tool.metrics.weeklyDownloads ?? tool.metrics.packageDownloads ?? tool.metrics.dockerPulls ?? 0);
  const forksCount = Number(tool.metrics.githubForks ?? 0);
  const lastUpdatedLabel = formatDate(tool.timestamps.lastUpdated);
  const difficultyLevel = tool.badges.difficulty ?? undefined;
  const difficultyClass = difficultyLevel ? difficultyColors[difficultyLevel as keyof typeof difficultyColors] : undefined;
  const rawPricingModel = tool.badges.pricing ?? undefined;
  const pricingModel = rawPricingModel && rawPricingModel !== 'unknown' ? rawPricingModel : undefined;
  const pricingClass = pricingModel ? (pricingColors[pricingModel as keyof typeof pricingColors] ?? "bg-gray-100 text-gray-800") : undefined;
  const popularityScore = Number(tool.metrics.popularity ?? 0);
  const languages = tool.tech.languages;
  const tags = tool.tech.tags;
  const primaryLink = tool.provenance.repoUrl || tool.provenance.sourceUrl || tool.provenance.homepageUrl;
  const description = tool.tagline ?? tool.description ?? "";

  return (
    <Card className="hover:shadow-lg transition-all duration-200 h-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg" data-testid={`text-tool-name-${tool.id}`}>
                {tool.name}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {sourceTypeLabels[tool.provenance.sourceType as keyof typeof sourceTypeLabels] || tool.provenance.sourceType}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {tool.category}
                </Badge>
              </div>
            </div>
          </div>
          {primaryLink && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              data-testid={`button-external-link-${tool.id}`}
            >
              <a href={primaryLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-description-${tool.id}`}>
          {description}
        </p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {starsCount > 0 && (
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>{formatNumber(starsCount)}</span>
            </div>
          )}
          {downloadsCount > 0 && (
            <div className="flex items-center space-x-1">
              <Download className="h-4 w-4 text-blue-500" />
              <span>{formatNumber(downloadsCount)}</span>
            </div>
          )}
          {forksCount > 0 && (
            <div className="flex items-center space-x-1">
              <GitBranch className="h-4 w-4 text-green-500" />
              <span>{formatNumber(forksCount)}</span>
            </div>
          )}
          {lastUpdatedLabel && (
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>{lastUpdatedLabel}</span>
            </div>
          )}
        </div>

        {popularityScore > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Popularity Score</span>
              <span className="font-medium">{popularityScore.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                style={{ width: `${Math.min(popularityScore, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {difficultyLevel && (
            <Badge
              variant="secondary"
              className={`text-xs ${difficultyClass ?? 'bg-gray-100 text-gray-800'}`} 
            >
              {difficultyLevel}
            </Badge>
          )}
          {pricingModel && (
            <Badge
              variant="secondary"
              className={`text-xs ${pricingClass ?? 'bg-gray-100 text-gray-800'}`} 
            >
              {pricingModel}
            </Badge>
          )}
        </div>

        {languages.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {languages.slice(0, 3).map((lang, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {lang}
              </Badge>
            ))}
            {languages.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{languages.length - 3}
              </Badge>
            )}
          </div>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 4).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEvaluate(tool.id)}
            className="flex-1"
            data-testid={`button-evaluate-${tool.id}`}
          >
            <Heart className="h-4 w-4 mr-1" />
            Evaluate
          </Button>
          <Button
            size="sm"
            onClick={() => onAddTool(tool.id)}
            disabled={isAdding}
            className="flex-1"
            data-testid={`button-add-to-stack-${tool.id}`}
          >
            <Zap className="h-4 w-4 mr-1" />
            {isAdding ? "Adding..." : "Add to Stack"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ToolSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start space-x-3">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <div className="flex space-x-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-2 w-full" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DiscoveryHub() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSourceType, setSelectedSourceType] = useState<string | undefined>();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedPricingModel, setSelectedPricingModel] = useState<DiscoverySearchRequest["pricingModel"]>();
  const [activeTab, setActiveTab] = useState("trending");

  // Fetch trending tools
  const { data: trendingData, isLoading: isTrendingLoading } = useQuery<TrendingToolsResponse>({
    queryKey: ["/api/discovery/trending", { 
      category: selectedCategory === "all" ? undefined : selectedCategory,
      timeframe: "week",
      limit: 12 
    }],
    enabled: activeTab === "trending",
  });

  // Fetch search results
  const searchParams: DiscoverySearchRequest = {
    query: searchQuery || undefined,
    category: selectedCategory === "all" ? undefined : selectedCategory,
    sourceType: selectedSourceType,
    languages: selectedLanguages.length > 0 ? selectedLanguages : undefined,
    pricingModel: selectedPricingModel,
    sortBy: "popularity",
    limit: 20,
    offset: 0,
  };

  const { data: searchData, isLoading: isSearchLoading } = useQuery<DiscoverySearchResponse>({
    queryKey: ["/api/discovery/search", searchParams],
    enabled: activeTab === "search" && (Boolean(searchQuery) || selectedCategory !== "all"),
  });

  // Fetch discovery categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/discovery/categories"],
  });

  // Add tool to stack mutation
  const addToStackMutation = useMutation({
    mutationFn: async (toolId: string) => {
      await apiRequest("POST", `/api/discovery/tools/${toolId}/add`, {
        monthlyCost: "0", // Will be estimated from tool data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-tools"] });
      toast({
        title: "Tool added to stack",
        description: "The tool has been successfully added to your tech stack.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding tool",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Evaluate tool mutation
  const evaluateToolMutation = useMutation({
    mutationFn: async (toolId: string) => {
      await apiRequest("POST", `/api/discovery/tools/${toolId}/evaluate`, {
        rating: 4, // Default rating
        notes: "Tool evaluation pending",
        willAdopt: null,
        adoptionTimeframe: null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Tool evaluation saved",
        description: "Your tool evaluation has been saved for future reference.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving evaluation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddTool = (toolId: string) => {
    addToStackMutation.mutate(toolId);
  };

  const handleEvaluateTool = (toolId: string) => {
    evaluateToolMutation.mutate(toolId);
  };

  const currentTools = activeTab === "trending" ? trendingData?.items || [] : searchData?.items || [];
  const isLoading = activeTab === "trending" ? isTrendingLoading : isSearchLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
              <TrendingUp className="h-8 w-8 mr-3 text-primary" />
              Discovery Hub
            </h1>
            <p className="text-muted-foreground text-lg">
              Discover trending tools and technologies across the development ecosystem
            </p>
          </div>

          {/* Discovery Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-96">
              <TabsTrigger value="trending" data-testid="tab-trending">
                <TrendingUp className="h-4 w-4 mr-2" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="search" data-testid="tab-search">
                <Search className="h-4 w-4 mr-2" />
                Search & Filter
              </TabsTrigger>
            </TabsList>

            {/* Trending Tools Tab */}
            <TabsContent value="trending" className="space-y-6">
              <SourceStatusBanner statuses={trendingData?.sourceStatuses ?? []} />
              {/* Category Quick Filters */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Filter className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-medium">Browse by Category</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {discoveryCategories.map((category) => {
                      const IconComponent = category.icon;
                      return (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(category.id)}
                          className="flex flex-col h-auto p-3 space-y-1"
                          data-testid={`button-category-${category.id}`}
                        >
                          <IconComponent className="h-5 w-5" />
                          <span className="text-xs">{category.name}</span>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Trending Tools Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {selectedCategory === "all" ? "Trending Tools" : `Trending ${discoveryCategories.find(c => c.id === selectedCategory)?.name} Tools`}
                  </h2>
                  {trendingData && (
                    <p className="text-sm text-muted-foreground">
                      {trendingData.totalCount} tools • Updated {new Date(trendingData.lastUpdated).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <ToolSkeleton key={i} />
                    ))}
                  </div>
                ) : (!currentTools || currentTools.length === 0) ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No trending tools found</h3>
                      <p className="text-muted-foreground">
                        Try selecting a different category or check back later for updates.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {currentTools.map((tool) => (
                      <ToolDiscoveryCard
                        key={tool.id}
                        tool={tool}
                        onAddTool={handleAddTool}
                        onEvaluate={handleEvaluateTool}
                        isAdding={addToStackMutation.isPending}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Search & Filter Tab */}
            <TabsContent value="search" className="space-y-6">
              <SourceStatusBanner statuses={searchData?.sourceStatuses ?? []} />
              {/* Advanced Search and Filters */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search tools..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-discovery"
                      />
                    </div>

                    {/* Category Filter */}
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {discoveryCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Source Type Filter */}
                    <Select value={selectedSourceType || ""} onValueChange={(value) => setSelectedSourceType(value || undefined)}>
                      <SelectTrigger data-testid="select-source-type">
                        <SelectValue placeholder="Source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Sources</SelectItem>
                        {Object.entries(sourceTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Pricing Model Filter */}
                    <Select value={selectedPricingModel ?? ""} onValueChange={(value) => setSelectedPricingModel(value ? (value as DiscoverySearchRequest["pricingModel"]) : undefined)}>
                      <SelectTrigger data-testid="select-pricing">
                        <SelectValue placeholder="Pricing" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Pricing</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="freemium">Freemium</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Search Results */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Search Results</h2>
                  {searchData && (
                    <p className="text-sm text-muted-foreground">
                      {searchData.totalCount} tools found
                    </p>
                  )}
                </div>

                {!searchQuery && selectedCategory === "all" ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">Start searching</h3>
                      <p className="text-muted-foreground">
                        Enter a search term or select filters to discover tools.
                      </p>
                    </CardContent>
                  </Card>
                ) : isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <ToolSkeleton key={i} />
                    ))}
                  </div>
                ) : (!currentTools || currentTools.length === 0) ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No tools found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search terms or filters.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {currentTools.map((tool) => (
                      <ToolDiscoveryCard
                        key={tool.id}
                        tool={tool}
                        onAddTool={handleAddTool}
                        onEvaluate={handleEvaluateTool}
                        isAdding={addToStackMutation.isPending}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}





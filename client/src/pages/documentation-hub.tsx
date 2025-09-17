import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  BookOpen, 
  Search, 
  Star, 
  Clock, 
  TrendingUp, 
  Filter, 
  Grid3X3, 
  List,
  Bookmark,
  ChevronRight,
  Code,
  Zap,
  Users,
  Award,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface DocCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  articleCount: number;
  children?: DocCategory[];
}

interface DocumentationArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentType: string;
  difficulty: string;
  estimatedReadTime: number;
  viewCount: number;
  isFeatured: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface DocTag {
  id: string;
  name: string;
  slug: string;
  color: string;
  usageCount: number;
}

export default function DocumentationHub() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const { toast } = useToast();

  // Read query parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('q');
    if (searchParam) {
      setSearchQuery(searchParam);
      setIsSearchMode(true);
    }
  }, [location]);

  // Fetch documentation categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<DocCategory[]>({
    queryKey: ['/api/docs/categories'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch featured documentation
  const { data: featuredDocs = [], isLoading: featuredLoading } = useQuery<DocumentationArticle[]>({
    queryKey: ['/api/docs/featured'],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch popular documentation
  const { data: popularDocs = [], isLoading: popularLoading } = useQuery<DocumentationArticle[]>({
    queryKey: ['/api/docs/popular'],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch recent documentation
  const { data: recentDocs = [], isLoading: recentLoading } = useQuery<DocumentationArticle[]>({
    queryKey: ['/api/docs/recent'],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch popular tags
  const { data: popularTags = [], isLoading: tagsLoading } = useQuery<DocTag[]>({
    queryKey: ['/api/docs/tags'],
    queryFn: async () => {
      const response = await fetch('/api/docs/tags?limit=20');
      if (!response.ok) throw new Error('Failed to fetch tags');
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  // Fetch search results or filtered documentation
  const { data: searchResults = [], isLoading: searchLoading } = useQuery<DocumentationArticle[]>({
    queryKey: ['/api/docs/search', searchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/docs/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Failed to search documentation');
      return response.json();
    },
    enabled: isSearchMode && !!searchQuery.trim(),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch filtered documentation based on selection
  const { data: filteredDocs = [], isLoading: docsLoading } = useQuery<DocumentationArticle[]>({
    queryKey: ['/api/docs', selectedCategory, selectedDifficulty],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      params.append('limit', '12');
      
      const response = await fetch(`/api/docs?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch filtered documentation');
      return response.json();
    },
    enabled: !isSearchMode && !!(selectedCategory || selectedDifficulty),
    staleTime: 2 * 60 * 1000,
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsSearchMode(true);
      setLocation(`/docs?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      setIsSearchMode(false);
      setLocation('/docs');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getIconForCategory = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      'BookOpen': BookOpen,
      'Code': Code,
      'Zap': Zap,
      'Users': Users,
      'Award': Award,
      'Search': Search,
    };
    const IconComponent = iconMap[iconName] || BookOpen;
    return <IconComponent className="h-6 w-6" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <BookOpen className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4" data-testid="text-hub-title">
              Documentation Hub
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto" data-testid="text-hub-description">
              Discover comprehensive guides, tutorials, and best practices for your tech stack. 
              Find everything you need to build amazing applications.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search documentation, guides, and tutorials..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 h-12 text-lg"
                    data-testid="input-search"
                  />
                </div>
                <Button onClick={handleSearch} size="lg" data-testid="button-search">
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-articles">
                    {categories.reduce((acc, cat) => acc + cat.articleCount, 0)}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">Total Guides</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Grid3X3 className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-categories">
                    {categories.length}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-featured-count">
                    {featuredDocs.length}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">Featured</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-popular-count">
                    {popularTags.length}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">Popular Tags</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results Section */}
        {isSearchMode ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-search-results-title">
                  Search Results for "{searchQuery}"
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {searchLoading ? 'Searching...' : `${searchResults.length} results found`}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsSearchMode(false);
                  setSearchQuery('');
                  setLocation('/docs');
                }}
                data-testid="button-clear-search"
              >
                Clear Search
              </Button>
            </div>

            {searchLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded"></div>
                        <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Try adjusting your search terms or browse our categories below.
                </p>
                <Button 
                  onClick={() => {
                    setIsSearchMode(false);
                    setSearchQuery('');
                    setLocation('/docs');
                  }}
                  data-testid="button-browse-categories"
                >
                  Browse Categories
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((article) => (
                  <Card 
                    key={article.id} 
                    className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                    onClick={() => setLocation(`/docs/${article.slug}`)}
                    data-testid={`card-search-result-${article.slug}`}
                  >
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                            {article.title}
                          </h3>
                          {article.isFeatured && (
                            <Star className="h-4 w-4 text-yellow-500 flex-shrink-0 ml-2" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge className={getDifficultyColor(article.difficulty)}>
                            {article.difficulty}
                          </Badge>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {article.estimatedReadTime} min
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{article.category.name}</span>
                          <div className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {article.viewCount}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Tabs defaultValue="browse" className="w-full">
            <TabsList className="grid grid-cols-4 w-full max-w-md mb-8" data-testid="tabs-documentation">
              <TabsTrigger value="browse" data-testid="tab-browse">Browse</TabsTrigger>
              <TabsTrigger value="featured" data-testid="tab-featured">Featured</TabsTrigger>
              <TabsTrigger value="popular" data-testid="tab-popular">Popular</TabsTrigger>
              <TabsTrigger value="recent" data-testid="tab-recent">Recent</TabsTrigger>
            </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-8">
            {/* Categories Grid */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-categories-title">
                  Browse by Category
                </h2>
                <Button variant="outline" asChild data-testid="link-all-categories">
                  <Link href="/docs/categories">
                    View All <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {categoriesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                            <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.filter(cat => !cat.children || cat.children.length === 0).map((category) => (
                    <Card 
                      key={category.id} 
                      className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
                      onClick={() => setLocation(`/docs/category/${category.slug}`)}
                      data-testid={`card-category-${category.slug}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform"
                            style={{ backgroundColor: category.color }}
                          >
                            {getIconForCategory(category.icon)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {category.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              {category.description}
                            </p>
                            <div className="flex items-center text-sm text-gray-500">
                              <BookOpen className="h-4 w-4 mr-1" />
                              {category.articleCount} guides
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Popular Tags */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6" data-testid="text-tags-title">
                Popular Tags
              </h2>
              
              {tagsLoading ? (
                <div className="flex flex-wrap gap-2">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <Badge 
                      key={tag.id}
                      variant="secondary" 
                      className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => setLocation(`/docs/search?tags=${encodeURIComponent(tag.slug)}`)}
                      data-testid={`badge-tag-${tag.slug}`}
                    >
                      {tag.name} ({tag.usageCount})
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Featured Tab */}
          <TabsContent value="featured" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-featured-title">
                Featured Documentation
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  data-testid="button-grid-view"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  data-testid="button-list-view"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {featuredLoading ? (
              <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded"></div>
                        <div className="flex gap-2">
                          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <DocumentationGrid articles={featuredDocs} viewMode={viewMode} />
            )}
          </TabsContent>

          {/* Popular Tab */}
          <TabsContent value="popular" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-popular-title">
                Popular Documentation
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  data-testid="button-grid-view-popular"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  data-testid="button-list-view-popular"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {popularLoading ? (
              <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded"></div>
                        <div className="flex gap-2">
                          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <DocumentationGrid articles={popularDocs} viewMode={viewMode} />
            )}
          </TabsContent>

          {/* Recent Tab */}
          <TabsContent value="recent" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-recent-title">
                Recently Updated
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  data-testid="button-grid-view-recent"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  data-testid="button-list-view-recent"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {recentLoading ? (
              <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded"></div>
                        <div className="flex gap-2">
                          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <DocumentationGrid articles={recentDocs} viewMode={viewMode} />
            )}
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
  );
}

// Documentation Grid Component
function DocumentationGrid({ 
  articles, 
  viewMode 
}: { 
  articles: DocumentationArticle[], 
  viewMode: "grid" | "list" 
}) {
  const [, setLocation] = useLocation();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-300" data-testid="text-no-articles">
          No documentation found.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
      {articles.map((article) => (
        <Card 
          key={article.id}
          className={`hover:shadow-lg transition-all duration-200 cursor-pointer group ${
            viewMode === "list" ? "flex flex-row" : ""
          }`}
          onClick={() => setLocation(`/docs/${article.slug}`)}
          data-testid={`card-article-${article.slug}`}
        >
          <CardHeader className={viewMode === "list" ? "flex-1" : ""}>
            <div className="flex items-start justify-between mb-2">
              <Badge className={getDifficultyColor(article.difficulty)} data-testid={`badge-difficulty-${article.difficulty}`}>
                {article.difficulty}
              </Badge>
              {article.isFeatured && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>
            <CardTitle className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" data-testid={`text-article-title-${article.slug}`}>
              {article.title}
            </CardTitle>
            <CardDescription data-testid={`text-article-excerpt-${article.slug}`}>
              {article.excerpt}
            </CardDescription>
          </CardHeader>
          <CardContent className={`space-y-4 ${viewMode === "list" ? "flex flex-col justify-between" : ""}`}>
            <div className="flex flex-wrap gap-1">
              {(article.tags || []).slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs" data-testid={`badge-tag-${tag}`}>
                  {tag}
                </Badge>
              ))}
              {(article.tags || []).length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{(article.tags || []).length - 3}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {article.estimatedReadTime}m read
                </div>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {article.viewCount} views
                </div>
              </div>
              <span data-testid={`text-article-date-${article.slug}`}>
                {formatDate(article.updatedAt)}
              </span>
            </div>

            <div className="text-sm text-gray-500">
              <span className="font-medium text-gray-700 dark:text-gray-200" data-testid={`text-article-category-${article.slug}`}>
                {article.category.name}
              </span>
              <span> • {article.contentType}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
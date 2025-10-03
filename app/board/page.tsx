"use client";
import { useState, useEffect } from "react";

type BriefItem = {
  title: string;
  source: string;
  link: string;
  theme: string;
  priority: "High" | "Medium" | "Low";
  why_it_matters: string;
  region: string;
  category: string;
  publishedAt?: string;
};

type FilterState = {
  categories: string[];
  regions: string[];
  priorities: string[];
  themes: string[];
  dateRange: string;
  searchTerm: string;
};

export default function BoardPage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<BriefItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    regions: [],
    priorities: [],
    themes: [],
    dateRange: "all",
    searchTerm: ""
  });

  useEffect(() => {
    setMounted(true);
    // Load saved articles from localStorage or API
    loadSavedArticles();
    
    // Listen for storage changes (when articles are sent from main page)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'boardArticles' && e.newValue) {
        try {
          const articles = JSON.parse(e.newValue);
          if (articles && articles.length > 0) {
            setItems(articles);
            // Clear localStorage after loading
            localStorage.removeItem('boardArticles');
          }
        } catch (error) {
          console.error('Error loading articles from storage:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadSavedArticles = () => {
    // Always start with empty dashboard
    setItems([]);
    
    // Check if there are articles in localStorage (in case of direct navigation)
    const saved = localStorage.getItem('boardArticles');
    if (saved) {
      try {
        const articles = JSON.parse(saved);
        if (articles && articles.length > 0) {
          setItems(articles);
          // Clear localStorage after loading
          localStorage.removeItem('boardArticles');
        }
      } catch (error) {
        console.error('Error loading articles:', error);
      }
    }
  };

  const andrianiCategories = [
    { id: "packaging", name: "Packaging & Sustainability", icon: "♻️", color: "from-green-500 to-emerald-600" },
    { id: "supply-chain", name: "Supply Chain & Logistics", icon: "🚛", color: "from-blue-500 to-cyan-600" },
    { id: "regulations", name: "Regulations & Compliance", icon: "📋", color: "from-purple-500 to-violet-600" },
    { id: "competitors", name: "Competitors & Market", icon: "🏢", color: "from-gray-500 to-slate-600" },
    { id: "innovation", name: "Innovation & Technology", icon: "🔬", color: "from-indigo-500 to-blue-600" },
    { id: "sustainability", name: "Sustainability & ESG", icon: "🌱", color: "from-emerald-500 to-green-600" }
  ];

  const worldRegions = [
    { id: "italy", name: "Italy", flag: "🇮🇹", color: "from-green-600 to-emerald-700" },
    { id: "eu", name: "European Union", flag: "🇪🇺", color: "from-blue-600 to-indigo-700" },
    { id: "usa", name: "United States", flag: "🇺🇸", color: "from-red-600 to-rose-700" },
    { id: "canada", name: "Canada", flag: "🇨🇦", color: "from-red-500 to-red-700" }
  ];

  const themes = [
    "Agri & Commodity",
    "Policy & Trade", 
    "ESG/Energy/Packaging",
    "Competitors/Finance/Governance",
    "Geopolitics & Risks",
    "Tech/Data/Automation",
    "Food Safety/Public Health",
    "Territory/Brand Italy",
    "Communication/Attention Economy"
  ];

  const priorities = [
    { id: "High", name: "High Priority", color: "from-emerald-500 to-green-600" },
    { id: "Medium", name: "Medium Priority", color: "from-amber-500 to-orange-600" },
    { id: "Low", name: "Low Priority", color: "from-rose-500 to-pink-600" }
  ];

  const toggleFilter = (type: keyof Omit<FilterState, 'searchTerm' | 'dateRange'>, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value) 
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      categories: [],
      regions: [],
      priorities: [],
      themes: [],
      dateRange: "all",
      searchTerm: ""
    });
  };

  // Ensure each article is in exactly one category
  const ensureUniqueCategories = (items: BriefItem[]) => {
    return items.map(item => ({
      ...item,
      category: item.category || 'general' // Ensure every item has a category
    }));
  };

  const uniqueItems = ensureUniqueCategories(items);
  const filteredItems = uniqueItems.filter(item => {
    // Category filter
    if (filters.categories.length > 0 && !filters.categories.includes(item.category)) {
      return false;
    }
    
    // Region filter
    if (filters.regions.length > 0 && !filters.regions.includes(item.region)) {
      return false;
    }
    
    // Priority filter
    if (filters.priorities.length > 0 && !filters.priorities.includes(item.priority)) {
      return false;
    }
    
    // Theme filter
    if (filters.themes.length > 0 && !filters.themes.includes(item.theme)) {
      return false;
    }
    
    // Search term filter
    if (filters.searchTerm && !item.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) && 
        !item.source.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
        !item.why_it_matters.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }
    
    // Date range filter
    if (filters.dateRange !== "all" && item.publishedAt) {
      const itemDate = new Date(item.publishedAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (filters.dateRange === "today" && daysDiff > 0) return false;
      if (filters.dateRange === "week" && daysDiff > 7) return false;
      if (filters.dateRange === "month" && daysDiff > 30) return false;
    }
    
    return true;
  });

  // Group filtered items by category for display
  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = item.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, BriefItem[]>);

  const getThemeIcon = (theme: string) => {
    const icons: { [key: string]: string } = {
      "Agri & Commodity": "🌾",
      "Policy & Trade": "🏛️",
      "ESG/Energy/Packaging": "♻️",
      "Competitors/Finance/Governance": "💼",
      "Geopolitics & Risks": "🌍",
      "Tech/Data/Automation": "🤖",
      "Food Safety/Public Health": "🛡️",
      "Territory/Brand Italy": "🇮🇹",
      "Communication/Attention Economy": "📱"
    };
    return icons[theme] || "📰";
  };

  const getPriorityBadge = (priority: string) => {
    const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    if (priority === "High") return <span className={`${base} bg-emerald-100 text-emerald-800`}>High</span>;
    if (priority === "Medium") return <span className={`${base} bg-amber-100 text-amber-800`}>Medium</span>;
    return <span className={`${base} bg-rose-100 text-rose-800`}>Low</span>;
  };



  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <a 
            href="/"
            className="inline-block w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl mx-auto mb-4 overflow-hidden hover:scale-105 transition-transform duration-200"
          >
            <img 
              src="/LogoAndriani.png" 
              alt="Andriani Logo" 
              className="w-16 h-16 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling!.style.display = 'block';
              }}
            />
            <span className="text-3xl hidden">🍝</span>
          </a>
          <h1 className="text-2xl font-bold text-white mb-2">Andriani Board Intelligence</h1>
          <p className="text-slate-300">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex justify-between items-center mb-6">
            {/* Logo in alto a sinistra - cliccabile per tornare alla home */}
            <a 
              href="/"
              className="w-40 h-40 flex items-center justify-center -mt-4 -ml-4 hover:scale-105 transition-transform duration-200 cursor-pointer"
            >
              <img 
                src="/LogoAndriani.png" 
                alt="Andriani Logo" 
                className="w-40 h-40 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling!.style.display = 'block';
                }}
              />
              <div className="text-white font-bold text-2xl text-center leading-tight hidden">
                ANDRIANI
              </div>
            </a>
            
            {/* Titolo al centro grande */}
            <div className="text-center">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-amber-100 to-orange-200 bg-clip-text text-transparent leading-tight">
            Board Dashboard
          </h1>
          <p className="text-slate-300 text-xl mt-2 font-medium">Strategic Analysis Center</p>
            </div>
            
            {/* Back to Search and Clear Dashboard in alto a destra */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setItems([]);
                  localStorage.removeItem('boardArticles');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span className="text-sm">🗑️</span>
                <span className="text-sm font-medium">Clear Dashboard</span>
              </button>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span className="text-sm">←</span>
                <span className="text-sm font-medium">Back to Search</span>
              </a>
            </div>
          </div>
          <p className="text-slate-300 text-lg max-w-3xl mx-auto leading-relaxed text-center">
            Strategic intelligence dashboard for Andriani board members. 
            Monitor key developments across all business categories and regions.
          </p>
        </header>

        {/* Filters Section */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 shadow-2xl mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                <span className="text-sm">🔍</span>
              </div>
              <h2 className="text-xl font-semibold">Intelligence Filters</h2>
            </div>
            <button
              onClick={clearAllFilters}
              className="text-slate-400 hover:text-white text-sm transition-colors duration-200"
            >
              Clear all filters
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search across all intelligence reports..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full rounded-2xl bg-white/5 border border-white/10 p-4 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-slate-100 placeholder-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Categories */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Categories</h3>
              <div className="space-y-2">
                {andrianiCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => toggleFilter('categories', category.id)}
                    className={`w-full p-2 rounded-lg border transition-all duration-200 text-left ${
                      filters.categories.includes(category.id)
                        ? `bg-gradient-to-r ${category.color} text-white border-transparent shadow-lg`
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{category.icon}</span>
                      <span className="text-xs font-medium">{category.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Regions */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Regions</h3>
              <div className="space-y-2">
                {worldRegions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => toggleFilter('regions', region.id)}
                    className={`w-full p-2 rounded-lg border transition-all duration-200 text-left ${
                      filters.regions.includes(region.id)
                        ? `bg-gradient-to-r ${region.color} text-white border-transparent shadow-lg`
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{region.flag}</span>
                      <span className="text-xs font-medium">{region.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Priorities */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Priority</h3>
              <div className="space-y-2">
                {priorities.map((priority) => (
                  <button
                    key={priority.id}
                    onClick={() => toggleFilter('priorities', priority.id)}
                    className={`w-full p-2 rounded-lg border transition-all duration-200 text-left ${
                      filters.priorities.includes(priority.id)
                        ? `bg-gradient-to-r ${priority.color} text-white border-transparent shadow-lg`
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xs font-medium">{priority.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Time Range</h3>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 shadow-2xl mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-sm">📊</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold">Intelligence Summary</h2>
                <p className="text-slate-300 text-sm">
                  {filteredItems.length} reports across {Object.keys(groupedItems).length} categories
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span>{filteredItems.filter(item => item.priority === 'High').length} High Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span>{filteredItems.filter(item => item.priority === 'Medium').length} Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                <span>{filteredItems.filter(item => item.priority === 'Low').length} Low</span>
              </div>
            </div>
          </div>
        </div>

        {/* Articles by Category */}
        <div className="space-y-8">
          {Object.keys(groupedItems).length === 0 ? (
            <div className="text-center py-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl">
              <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📰</span>
              </div>
              <p className="text-slate-300 text-sm">No intelligence reports available. Run searches from the main page to populate this dashboard.</p>
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, categoryItems]) => {
              const categoryInfo = andrianiCategories.find(cat => cat.id === category);
              return (
                <div key={category} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 bg-gradient-to-r ${categoryInfo?.color || 'from-gray-500 to-slate-600'} rounded-xl flex items-center justify-center`}>
                      <span className="text-lg">{categoryInfo?.icon || '📰'}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{categoryInfo?.name || category}</h3>
                      <p className="text-slate-300 text-sm">{categoryItems.length} reports</p>
                    </div>
                  </div>
                  
                  <div className="grid gap-4">
                    {categoryItems.map((item, index) => (
                      <article 
                        key={index} 
                        className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:border-white/20"
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <a 
                            className="text-lg font-semibold hover:text-blue-300 transition-colors duration-200 flex-1 leading-relaxed" 
                            href={item.link} 
                            target="_blank" 
                            rel="noreferrer"
                          >
                            {item.title}
                          </a>
                          <div className="flex-shrink-0 flex items-center gap-2">
                            {getPriorityBadge(item.priority)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-4 text-slate-300 text-sm">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                            {item.source}
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="flex items-center gap-2">
                            <span>{getThemeIcon(item.theme)}</span>
                            {item.theme}
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="flex items-center gap-1">
                            <span className="text-xs">🌍</span>
                            {item.region}
                          </span>
                          {item.publishedAt && (
                            <>
                              <span className="text-slate-500">•</span>
                              <span className="flex items-center gap-1">
                                <span className="text-xs">📅</span>
                                {new Date(item.publishedAt).toLocaleDateString('en-US')}
                              </span>
                            </>
                          )}
                        </div>
                        
                        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                          <p className="text-slate-100 leading-relaxed">{item.why_it_matters}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center">
          <div className="inline-flex items-center gap-6 text-slate-400 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
              Board Intelligence
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
              Strategic Monitoring
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
              Executive Dashboard
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}

"use client";
import { useState, useEffect } from "react";
import Notification from "./components/Notification";

type BriefItem = {
  title: string;
  source: string;
  link: string;
  theme: string;
  priority: "High" | "Medium" | "Low";
  why_it_matters: string;
  region: string;
  category: string;
};

type FilterState = {
  categories: string[];
  regions: string[];
  priorities: string[];
  searchTerm: string;
};

export default function Home() {
  // Remove the raw variable that is no longer needed
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [items, setItems] = useState<BriefItem[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    regions: [],
    priorities: [],
    searchTerm: ""
  });

  useEffect(() => {
    setMounted(true);
  }, []);

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


  // Remove the parseInput function that is no longer needed

  const toggleFilter = (type: keyof Omit<FilterState, 'searchTerm'>, value: string) => {
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
      searchTerm: ""
    });
  };

  // Filters are now handled by the API, so we show the received items directly
  const filteredItems = items;

  const onSearchNews = async () => {
    setSearching(true);
    setError(null);
    setArticles([]);
    setItems([]);
    
    try {
      // First search for news
      const searchRes = await fetch("/api/search-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          filters: {
            categories: filters.categories,
            regions: filters.regions,
            searchTerm: filters.searchTerm
          }
        }),
      });
      
      const searchData = await searchRes.json();
      if (!searchRes.ok) throw new Error(searchData?.error || "Search failed");
      
      setArticles(searchData.articles || []);
      
      // Then analyze the found news
      if (searchData.articles?.length > 0) {
        await onAnalyzeNews(searchData.articles);
      }
      
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  };

  const onAnalyzeNews = async (newsArticles: any[]) => {
    setLoading(true);
    setError(null);
    
    try {
      // Convert articles to the format required by the brief API
      const items = newsArticles.map(article => ({
        title: article.title,
        source: article.source,
        link: article.url,
        date: article.publishedAt
      }));

      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items: items,
          filters: {
            categories: filters.categories,
            regions: filters.regions,
            searchTerm: filters.searchTerm
          }
        }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        console.warn('API analysis failed, creating basic executive summaries');
        // Create basic items from articles when API fails
        const basicItems = newsArticles.map(article => ({
          title: article.title,
          source: article.source,
          link: article.url,
          theme: "General News",
          priority: "Medium" as const,
          why_it_matters: "Strategic analysis pending - requires board-level attention for market positioning",
          region: "Italy", // Default region
          category: "general",
          publishedAt: article.publishedAt
        }));
        setItems(basicItems);
        return;
      }
      
      const newItems = data.items || [];
      
      // If no items returned from analysis, create basic items from articles
      if (newItems.length === 0 && newsArticles.length > 0) {
        const basicItems = newsArticles.map(article => ({
          title: article.title,
          source: article.source,
          link: article.url,
          theme: "General News",
          priority: "Medium" as const,
          why_it_matters: "Strategic analysis pending - requires board-level attention for market positioning",
          region: "Italy", // Default region
          category: "general",
          publishedAt: article.publishedAt
        }));
        setItems(basicItems);
      } else {
        setItems(newItems);
      }
      
    } catch (e: any) {
      console.error('Analysis failed:', e);
      // If analysis fails, create basic items from articles
      if (newsArticles.length > 0) {
        const basicItems = newsArticles.map(article => ({
          title: article.title,
          source: article.source,
          link: article.url,
          theme: "General News",
          priority: "Medium" as const,
          why_it_matters: "Strategic analysis pending - requires board-level attention for market positioning",
          region: "Italy", // Default region
          category: "general",
          publishedAt: article.publishedAt
        }));
        setItems(basicItems);
        
        // Don't save to localStorage - board page starts empty
      }
      setError('Analysis failed, but articles were saved. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Remove the onGenerate function that is no longer needed

  const chip = (p: string) => {
    const base = "rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition-all duration-200";
    if (p === "High") return <span className={`${base} bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-500/25`}>High</span>;
    if (p === "Medium") return <span className={`${base} bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/25`}>Medium</span>;
    return <span className={`${base} bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-rose-500/25`}>Low</span>;
  };

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

  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl mx-auto mb-4 overflow-hidden">
            <img 
              src="/LogoAndriani.png" 
              alt="Andriani Logo" 
              className="w-12 h-12 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling!.style.display = 'block';
              }}
            />
            <span className="text-3xl hidden">🍝</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Andriani Intelligence</h1>
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
        <header className="mb-16">
          <div className="flex justify-between items-center mb-8">
        {/* Logo in alto a sinistra */}
        <div className="w-40 h-40 flex items-center justify-center -mt-4 -ml-4">
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
            </div>
            
            {/* Titolo al centro grande */}
            <div className="text-center">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-amber-100 to-orange-200 bg-clip-text text-transparent leading-tight">
                Andriani News Hub
              </h1>
              <p className="text-slate-300 text-xl mt-2 font-medium">Strategic News Analysis</p>
            </div>
            
        {/* Dashboard in alto a destra */}
        <a
          href="/board"
          className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-2xl hover:from-purple-700 hover:to-violet-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 transform -mt-4 -mr-4"
        >
              <span className="text-lg">📊</span>
              <span className="font-semibold">Board Dashboard</span>
            </a>
          </div>
              <p className="text-slate-300 text-lg max-w-3xl mx-auto leading-relaxed">
                Advanced intelligence system for monitoring strategic news 
                in the Italian food industry with geographic and categorical filters.
              </p>
        </header>

        {/* Filters Section */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-10 shadow-2xl mb-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-lg">🔍</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Search Filters</h2>
                <p className="text-slate-300 text-sm">Customize your intelligence search</p>
              </div>
            </div>
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white text-sm font-medium rounded-xl transition-all duration-200 border border-slate-600/50"
            >
              Clear all filters
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 text-lg">🔍</span>
              </div>
              <input
                type="text"
                placeholder="Search by title, source or theme..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 border border-white/20 text-slate-100 placeholder-slate-400 outline-none transition-all duration-300 focus:ring-4 focus:ring-purple-500/30 focus:border-purple-500/50 focus:bg-white/15"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
              Andriani Categories
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {andrianiCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleFilter('categories', category.id)}
                  className={`p-4 rounded-2xl border transition-all duration-300 text-left group hover:scale-105 transform ${
                    filters.categories.includes(category.id)
                      ? `bg-gradient-to-r ${category.color} text-white border-transparent shadow-xl scale-105`
                      : 'bg-white/10 border-white/20 text-slate-300 hover:bg-white/15 hover:border-white/30'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <span className="text-xs font-semibold text-center leading-tight">{category.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Regions */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              Geographic Regions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {worldRegions.map((region) => (
                <button
                  key={region.id}
                  onClick={() => toggleFilter('regions', region.id)}
                  className={`p-4 rounded-2xl border transition-all duration-300 text-left group hover:scale-105 transform ${
                    filters.regions.includes(region.id)
                      ? `bg-gradient-to-r ${region.color} text-white border-transparent shadow-xl scale-105`
                      : 'bg-white/10 border-white/20 text-slate-300 hover:bg-white/15 hover:border-white/30'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-2xl">{region.flag}</span>
                    <span className="text-sm font-semibold text-center">{region.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Main Content */}
        <section className="space-y-8">
          {/* Search Section */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-10 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-lg">🔍</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Intelligence Search</h2>
                <p className="text-slate-300 text-sm">AI-powered news analysis</p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-slate-300 mb-8 text-lg max-w-2xl mx-auto leading-relaxed">
                Select the filters above and click "Search News" to automatically find 
                today's articles relevant to Andriani
              </p>
              
              <button
                onClick={onSearchNews}
                disabled={searching || loading}
                className="inline-flex items-center justify-center gap-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-16 py-5 font-bold text-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-105"
              >
                {searching ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Searching articles...</span>
                  </>
                ) : loading ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Analyzing intelligence...</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">🔍</span>
                    <span>Search Today's News</span>
                  </>
                )}
              </button>
              
              {error && (
                <div className="mt-8 p-6 bg-red-500/20 border border-red-500/30 rounded-2xl backdrop-blur-sm">
                  <p className="text-red-300 text-sm flex items-center gap-3">
                    <span className="text-lg">⚠️</span>
                    <span className="font-medium">{error}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Articles Found Section */}
          {articles.length > 0 && (
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <span className="text-sm">📰</span>
                    </div>
                    <h2 className="text-xl font-semibold">Articles Found</h2>
                  </div>
                  <div className="text-sm text-slate-400">
                    {articles.length} articles today
                  </div>
                </div>
                
                <div className="grid gap-4">
                  {articles.map((article, index) => (
                    <a 
                      key={index} 
                      href={article.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="block bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer group"
                    >
                      <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors duration-200">{article.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>📰 {article.source}</span>
                        <span>🕒 {new Date(article.publishedAt).toLocaleDateString('en-US')}</span>
                      </div>
                      <div className="mt-2 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Click to read full article →
                      </div>
                    </a>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Results Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-sm">📋</span>
                </div>
                <h2 className="text-xl font-semibold">Executive Brief</h2>
                {(filters.categories.length > 0 || filters.regions.length > 0 || filters.searchTerm) && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                    Active Filters
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-400">
                {filteredItems.length} items
              </div>
            </div>
            
            <div className="space-y-4">
              {items.length === 0 && !loading && articles.length === 0 && (
                <div className="text-center py-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl">
                  <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📰</span>
                  </div>
                  <p className="text-slate-300 text-sm">No items yet. Search for news and click "Search Today's News".</p>
                </div>
              )}

              {items.length > 0 && filteredItems.length === 0 && (
                <div className="text-center py-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl">
                  <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <p className="text-slate-300 text-sm">No items match the selected filters.</p>
                  <button
                    onClick={clearAllFilters}
                    className="mt-3 text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200"
                  >
                    Clear all filters
                  </button>
                </div>
              )}

              {articles.length > 0 && items.length === 0 && !loading && (
                <div className="text-center py-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl">
                  <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <p className="text-slate-300 text-sm">Articles found but analysis in progress...</p>
                  <p className="text-slate-400 text-xs mt-2">Executive summaries will appear here once analysis is complete.</p>
                </div>
              )}

              {articles.length > 0 && items.length === 0 && loading && (
                <div className="text-center py-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl">
                  <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔄</span>
                  </div>
                  <p className="text-slate-300 text-sm">Analyzing articles and generating executive summaries...</p>
                  <p className="text-slate-400 text-xs mt-2">This may take a few moments.</p>
                </div>
              )}
              
              {filteredItems.map((it, i) => (
                <article 
                  key={i} 
                  className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/10 hover:border-white/20 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <a 
                      className="text-lg font-semibold hover:text-blue-300 transition-colors duration-200 flex-1 leading-relaxed" 
                      href={it.link} 
                      target="_blank" 
                      rel="noreferrer"
                    >
                      {it.title}
                    </a>
                    <div className="flex-shrink-0">
                      {chip(it.priority)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3 text-slate-300 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      {it.source}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="flex items-center gap-2">
                      <span>{getThemeIcon(it.theme)}</span>
                      {it.theme}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="flex items-center gap-1">
                      <span className="text-xs">🌍</span>
                      {it.region}
                    </span>
                  </div>
                  
                  <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-700/50">
                    <p className="text-slate-100 leading-relaxed">{it.why_it_matters}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Board Members Message */}
          {items.length > 0 && (
            <div className="bg-gradient-to-r from-purple-500/20 to-violet-500/20 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-8 shadow-2xl">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-xl">👥</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Board Members</h3>
                </div>
                <p className="text-slate-300 text-lg mb-6 max-w-2xl mx-auto leading-relaxed">
                  Access the complete executive dashboard with strategic summaries, 
                  categorized articles, and advanced filtering options.
                </p>
                <button
                  onClick={() => {
                    // Save executive summaries to localStorage for board dashboard
                    localStorage.setItem('boardArticles', JSON.stringify(items));
                    // Show elegant confirmation
                    setNotification({
                      message: `${items.length} executive summaries sent to Board Dashboard!`,
                      type: "success"
                    });
                    // Navigate to board dashboard after a short delay
                    setTimeout(() => {
                      window.location.href = '/board';
                    }, 1500);
                  }}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-2xl hover:from-purple-700 hover:to-violet-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 transform font-semibold text-lg"
                >
                  <span className="text-xl">📊</span>
                  <span>Send to Executive Dashboard</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-16 text-center">
          <div className="inline-flex items-center gap-6 text-slate-400 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
              Andriani Intelligence
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
              Geographic Filters
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
              Specialized Categories
            </span>
          </div>
        </footer>
      </div>
      
      {/* Elegant Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          duration={3000}
          onClose={() => setNotification(null)}
        />
      )}
    </main>
  );
}
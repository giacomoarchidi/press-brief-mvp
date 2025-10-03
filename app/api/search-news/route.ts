import axios from 'axios';

// Free news APIs
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'demo'; // Fallback for testing
const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY || 'demo';

export async function POST(req: Request) {
  try {
    const { filters } = await req.json();
    // filters: { categories: string[], regions: string[], searchTerm: string }

    // Build search queries based on filters
    const searchQueries = buildSearchQueries(filters);
    
    // Search news from multiple sources
    const newsResults = await Promise.allSettled([
      searchNewsAPI(searchQueries),
      searchGuardianAPI(searchQueries)
    ]);

    // Combine and deduplicate results
    const allArticles: any[] = [];
    newsResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        allArticles.push(...result.value);
      }
    });

    // Deduplicate by URL
    const uniqueArticles = deduplicateArticles(allArticles);

    // Filter for Andriani relevance
    const relevantArticles = filterForAndriani(uniqueArticles, filters);

    return Response.json({ 
      articles: relevantArticles,
      total: relevantArticles.length,
      sources: ['NewsAPI', 'Guardian']
    });

  } catch (error: any) {
    console.error('Search error:', error);
    return Response.json({ 
      error: error.message,
      articles: [],
      total: 0
    }, { status: 500 });
  }
}

function buildSearchQueries(filters: any) {
  const queries = [];
  
  // Base queries for Andriani
  const baseTerms = [
    'pasta', 'rice', 'packaging', 'sustainable packaging',
    'food industry', 'supply chain', 'agri-food', 'food regulations'
  ];

  // Add specific terms for categories
  if (filters.categories?.includes('packaging')) {
    queries.push('sustainable packaging EU regulations 2024');
    queries.push('biodegradable packaging food industry innovation');
    queries.push('circular economy packaging solutions');
  }
  
  if (filters.categories?.includes('supply-chain')) {
    queries.push('food supply chain disruption 2024');
    queries.push('logistics food industry digital transformation');
    queries.push('supply chain resilience food sector');
  }
  
  if (filters.categories?.includes('regulations')) {
    queries.push('EU food regulations 2024 compliance');
    queries.push('food safety regulations new requirements');
    queries.push('sustainability regulations food industry');
  }
  
  if (filters.categories?.includes('competitors')) {
    queries.push('Barilla De Cecco Garofalo pasta market share');
    queries.push('pasta industry competition analysis 2024');
    queries.push('Italian pasta brands international expansion');
  }
  
  if (filters.categories?.includes('innovation')) {
    queries.push('food technology innovation 2024');
    queries.push('agri-food tech startups investment');
    queries.push('artificial intelligence food industry');
  }
  
  if (filters.categories?.includes('sustainability')) {
    queries.push('sustainable food production ESG');
    queries.push('carbon footprint food industry reduction');
    queries.push('renewable energy food manufacturing');
  }

  // Add geographic terms
  if (filters.regions?.includes('italy')) {
    queries.push('Italy food industry 2024 trends');
    queries.push('Italian pasta rice export market');
    queries.push('Made in Italy food sustainability');
  }
  
  if (filters.regions?.includes('eu')) {
    queries.push('EU food regulations 2024 updates');
    queries.push('European food market digital transformation');
    queries.push('EU Green Deal food industry impact');
  }
  
  if (filters.regions?.includes('usa')) {
    queries.push('US food industry innovation trends');
    queries.push('American pasta market growth 2024');
    queries.push('US food safety regulations updates');
  }
  
  if (filters.regions?.includes('canada')) {
    queries.push('Canada food market sustainability');
    queries.push('Canadian food industry innovation');
    queries.push('Canada food regulations 2024');
  }

  // Add custom search term
  if (filters.searchTerm) {
    queries.push(filters.searchTerm);
  }

  // If no filters, use generic queries
  if (queries.length === 0) {
    queries.push(...baseTerms);
  }

  return queries;
}

async function searchNewsAPI(queries: string[]) {
  try {
    if (NEWS_API_KEY === 'demo') {
      // Dynamic sample data based on search queries
      const sampleArticles = [];
      
      // Generate different articles based on the search queries
      queries.forEach((query, index) => {
        const queryLower = query.toLowerCase();
        
        if (queryLower.includes('packaging') || queryLower.includes('sustainable')) {
          const packagingTitles = [
            "New EU sustainable packaging regulations take effect",
            "Biodegradable packaging revolution hits food industry",
            "Circular economy packaging solutions gain traction",
            "Food companies invest in eco-friendly packaging alternatives",
            "Sustainable packaging standards reshape European market"
          ];
          const packagingSources = ["European Food News", "Packaging World", "Food Navigator", "Sustainable Packaging News", "Food Industry Today"];
          
          sampleArticles.push({
            title: packagingTitles[Math.floor(Math.random() * packagingTitles.length)],
            source: packagingSources[Math.floor(Math.random() * packagingSources.length)],
            url: `https://example.com/packaging-ue-${index}`,
            publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            description: "New EU rules for sustainable packaging impact the Italian food industry"
          });
        }
        
        if (queryLower.includes('barilla') || queryLower.includes('pasta') || queryLower.includes('competitors')) {
          const competitorTitles = [
            "Barilla invests €50 million in recyclable packaging",
            "De Cecco expands international market presence",
            "Garofalo launches new organic pasta line",
            "Italian pasta industry sees 15% growth in exports",
            "Pasta market competition intensifies with new players"
          ];
          const competitorSources = ["Milano Finanza", "Il Sole 24 Ore", "Food Business", "Pasta Industry News", "Italian Food Journal"];
          
          sampleArticles.push({
            title: competitorTitles[Math.floor(Math.random() * competitorTitles.length)],
            source: competitorSources[Math.floor(Math.random() * competitorSources.length)],
            url: `https://example.com/competitors-${index}`,
            publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            description: "The pasta industry continues to evolve with new sustainability initiatives and market expansion"
          });
        }
        
        if (queryLower.includes('supply chain') || queryLower.includes('logistics')) {
          const supplyChainTitles = [
            "Global food supply chain faces new challenges",
            "Digital transformation reshapes food logistics",
            "Supply chain resilience becomes key priority",
            "Food companies invest in supply chain technology",
            "Logistics innovation drives food industry efficiency"
          ];
          const supplyChainSources = ["The Guardian", "Supply Chain World", "Logistics Today", "Food Logistics", "Supply Chain Management"];
          
          sampleArticles.push({
            title: supplyChainTitles[Math.floor(Math.random() * supplyChainTitles.length)],
            source: supplyChainSources[Math.floor(Math.random() * supplyChainSources.length)],
            url: `https://example.com/supply-chain-${index}`,
            publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            description: "International food supply chains adapt to new sustainability requirements and digital transformation"
          });
        }
        
        if (queryLower.includes('italy') || queryLower.includes('italian')) {
          const italyTitles = [
            "Italian food industry adapts to new sustainability standards",
            "Made in Italy food exports reach record levels",
            "Italian pasta companies lead sustainability initiatives",
            "Food innovation hubs emerge across Italy",
            "Italian food sector embraces digital transformation"
          ];
          const italySources = ["Corriere della Sera", "La Repubblica", "Il Sole 24 Ore", "Italian Food News", "Made in Italy Today"];
          
          sampleArticles.push({
            title: italyTitles[Math.floor(Math.random() * italyTitles.length)],
            source: italySources[Math.floor(Math.random() * italySources.length)],
            url: `https://example.com/italy-food-${index}`,
            publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            description: "Italian food companies implement new environmental regulations and innovation strategies"
          });
        }
        
        if (queryLower.includes('innovation') || queryLower.includes('technology')) {
          const innovationTitles = [
            "Food tech innovation drives sustainable packaging solutions",
            "AI revolutionizes food production processes",
            "Blockchain technology enhances food traceability",
            "Robotics transform food manufacturing efficiency",
            "IoT sensors optimize food supply chain monitoring"
          ];
          const innovationSources = ["Food Technology Magazine", "TechCrunch Food", "Innovation in Food", "Food Tech Weekly", "Agri-Food Tech News"];
          
          sampleArticles.push({
            title: innovationTitles[Math.floor(Math.random() * innovationTitles.length)],
            source: innovationSources[Math.floor(Math.random() * innovationSources.length)],
            url: `https://example.com/food-tech-${index}`,
            publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            description: "New technologies revolutionize food packaging, production, and sustainability across the industry"
          });
        }
        
        if (queryLower.includes('regulations') || queryLower.includes('compliance')) {
          const regulationTitles = [
            "New food safety regulations impact European manufacturers",
            "EU updates food labeling requirements for 2024",
            "Sustainability regulations reshape food industry compliance",
            "Food traceability standards become mandatory",
            "New allergen labeling rules affect food manufacturers"
          ];
          const regulationSources = ["Food Safety News", "EU Food Law", "Compliance Today", "Food Regulation Weekly", "European Food Safety Authority"];
          
          sampleArticles.push({
            title: regulationTitles[Math.floor(Math.random() * regulationTitles.length)],
            source: regulationSources[Math.floor(Math.random() * regulationSources.length)],
            url: `https://example.com/regulations-${index}`,
            publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            description: "Updated compliance requirements affect food industry operations and market strategies"
          });
        }
      });
      
      // If no specific matches, return generic articles
      if (sampleArticles.length === 0) {
        sampleArticles.push(
          {
            title: "Food industry trends: sustainability and innovation",
            source: "Food Industry Today",
            url: "https://example.com/trends-1",
            publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            description: "Latest trends in food industry sustainability and technological innovation"
          },
          {
            title: "European food market adapts to changing consumer demands",
            source: "European Food Journal",
            url: "https://example.com/market-1",
            publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            description: "Food companies respond to evolving consumer preferences and regulations"
          }
        );
      }
      
      // Return unique articles (deduplicate by title)
      const uniqueArticles = sampleArticles.filter((article, index, self) => 
        index === self.findIndex(a => a.title === article.title)
      );
      
      return uniqueArticles.slice(0, 5); // Limit to 5 articles
    }

    const results = [];
    for (const query of queries.slice(0, 3)) { // Limit to 3 queries to avoid rate limiting
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: query,
          language: 'it,en',
          sortBy: 'publishedAt',
          pageSize: 10,
          apiKey: NEWS_API_KEY
        }
      });
      
      if (response.data.articles) {
        results.push(...response.data.articles.map(article => ({
          title: article.title,
          source: article.source.name,
          url: article.url,
          publishedAt: article.publishedAt,
          description: article.description
        })));
      }
    }
    
    return results;
  } catch (error) {
    console.error('NewsAPI error:', error.message);
    return [];
  }
}

async function searchGuardianAPI(queries: string[]) {
  try {
    if (GUARDIAN_API_KEY === 'demo') {
      // Dynamic sample data for Guardian based on search queries
      const guardianArticles = [];
      
      queries.forEach((query, index) => {
        const queryLower = query.toLowerCase();
        
        if (queryLower.includes('supply chain') || queryLower.includes('logistics')) {
          guardianArticles.push({
            title: "Global food supply chain faces new challenges",
            source: "The Guardian",
            url: `https://example.com/guardian-supply-chain-${index}`,
            publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            description: "International food supply chains adapt to new sustainability requirements"
          });
        }
        
        if (queryLower.includes('sustainability') || queryLower.includes('esg')) {
          guardianArticles.push({
            title: "Food industry sustainability initiatives gain momentum",
            source: "The Guardian",
            url: `https://example.com/guardian-sustainability-${index}`,
            publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            description: "Major food companies announce new environmental commitments"
          });
        }
        
        if (queryLower.includes('regulations') || queryLower.includes('policy')) {
          guardianArticles.push({
            title: "New food regulations reshape European market",
            source: "The Guardian",
            url: `https://example.com/guardian-regulations-${index}`,
            publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            description: "Updated food safety and sustainability regulations impact industry"
          });
        }
      });
      
      // If no specific matches, return generic Guardian articles
      if (guardianArticles.length === 0) {
        guardianArticles.push({
          title: "Food industry adapts to changing global landscape",
          source: "The Guardian",
          url: "https://example.com/guardian-generic",
          publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          description: "Food companies navigate new challenges and opportunities"
        });
      }
      
      return guardianArticles.slice(0, 3); // Limit to 3 articles
    }

    const results = [];
    for (const query of queries.slice(0, 2)) { // Limit to 2 queries
      const response = await axios.get('https://content.guardianapis.com/search', {
        params: {
          q: query,
          'api-key': GUARDIAN_API_KEY,
          'show-fields': 'headline,trailText,shortUrl',
          'page-size': 10
        }
      });
      
      if (response.data.response?.results) {
        results.push(...response.data.response.results.map(article => ({
          title: article.webTitle,
          source: 'The Guardian',
          url: article.webUrl,
          publishedAt: article.webPublicationDate,
          description: article.fields?.trailText || ''
        })));
      }
    }
    
    return results;
  } catch (error) {
    console.error('Guardian API error:', error.message);
    return [];
  }
}

function deduplicateArticles(articles: any[]) {
  const seen = new Set();
  return articles.filter(article => {
    const key = article.url || article.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function filterForAndriani(articles: any[], filters: any) {
  // Filter articles relevant to Andriani
  const andrianiKeywords = [
    'pasta', 'rice', 'packaging', 'sustainable', 'food', 'supply chain',
    'regulations', 'EU', 'Italy', 'Barilla', 'De Cecco', 'Garofalo',
    'agri-food', 'food industry', 'sustainability', 'ESG'
  ];

  return articles.filter(article => {
    const text = `${article.title} ${article.description}`.toLowerCase();
    return andrianiKeywords.some(keyword => text.includes(keyword));
  }).slice(0, 20); // Limit to 20 articles
}

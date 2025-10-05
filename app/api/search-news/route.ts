import axios from 'axios';

// Free news APIs
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'demo'; // Fallback for testing
const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY || 'demo';
const NEWSDATA_API_KEY = process.env.NEWSDATA_API_KEY || 'demo';

export async function POST(req: Request) {
  try {
    const { filters } = await req.json();
    // filters: { categories: string[], regions: string[], searchTerm: string }

    // Build search queries based on filters
    const searchQueries = buildSearchQueries(filters);
    
    // Search news from multiple sources
    const newsResults = await Promise.allSettled([
      searchNewsAPI(searchQueries),
      searchGuardianAPI(searchQueries),
      searchNewsDataAPI(searchQueries)
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

    // Se non ci sono articoli, restituisci un messaggio di errore
    if (relevantArticles.length === 0) {
      return Response.json({ 
        error: 'Nessuna notizia trovata. Configura le chiavi API per ottenere notizie reali.',
        articles: [],
        total: 0,
        sources: [],
        message: 'Per ottenere notizie reali, configura le seguenti chiavi API nel file .env.local: NEWS_API_KEY, GUARDIAN_API_KEY, NEWSDATA_API_KEY'
      });
    }

    return Response.json({ 
      articles: relevantArticles,
      total: relevantArticles.length,
      sources: ['NewsAPI', 'Guardian', 'NewsData'].filter(source => {
        // Mostra solo le fonti che hanno effettivamente restituito articoli
        return newsResults.some(result => result.status === 'fulfilled' && result.value && result.value.length > 0);
      })
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
  
  // Se non ci sono filtri, usa query generiche più specifiche
  if (!filters || (!filters.categories?.length && !filters.regions?.length && !filters.searchTerm)) {
    return [
      'food industry', 'agriculture news', 'sustainable packaging', 
      'food manufacturing', 'agri-food business'
    ];
  }

  // Crea query specifiche basate sui filtri selezionati
  const categoryQueries: string[] = [];
  const regionQueries: string[] = [];
  
  // Query per categorie selezionate
  if (filters.categories?.length) {
    filters.categories.forEach((category: string) => {
      switch (category) {
        case 'packaging':
          categoryQueries.push('sustainable packaging regulations 2024');
          categoryQueries.push('biodegradable packaging food industry');
          categoryQueries.push('circular economy packaging solutions');
          break;
        case 'supply-chain':
          categoryQueries.push('food supply chain disruption 2024');
          categoryQueries.push('logistics food industry digital transformation');
          categoryQueries.push('supply chain resilience food sector');
          break;
        case 'regulations':
          categoryQueries.push('food regulations 2024 compliance');
          categoryQueries.push('food safety regulations new requirements');
          categoryQueries.push('sustainability regulations food industry');
          break;
        case 'competitors':
          categoryQueries.push('Barilla De Cecco Garofalo pasta market');
          categoryQueries.push('pasta industry competition analysis 2024');
          categoryQueries.push('Italian pasta brands international expansion');
          break;
        case 'innovation':
          categoryQueries.push('food technology innovation 2024');
          categoryQueries.push('agri-food tech startups investment');
          categoryQueries.push('artificial intelligence food industry');
          break;
        case 'sustainability':
          categoryQueries.push('sustainable food production ESG');
          categoryQueries.push('carbon footprint food industry reduction');
          categoryQueries.push('renewable energy food manufacturing');
          break;
      }
    });
  }
  
  // Query per regioni selezionate
  if (filters.regions?.length) {
    filters.regions.forEach((region: string) => {
      switch (region) {
        case 'italy':
          regionQueries.push('Italy food industry 2024');
          regionQueries.push('Italian pasta rice export market');
          regionQueries.push('Made in Italy food sustainability');
          break;
        case 'eu':
          regionQueries.push('EU food regulations 2024');
          regionQueries.push('European food market digital transformation');
          regionQueries.push('EU Green Deal food industry impact');
          break;
        case 'usa':
          regionQueries.push('US food industry innovation trends');
          regionQueries.push('American pasta market growth 2024');
          regionQueries.push('US food safety regulations updates');
          break;
        case 'canada':
          regionQueries.push('Canada food market sustainability');
          regionQueries.push('Canadian food industry innovation');
          regionQueries.push('Canada food regulations 2024');
          break;
      }
    });
  }
  
  // Combina query di categorie e regioni
  if (categoryQueries.length > 0 && regionQueries.length > 0) {
    // Se ci sono sia categorie che regioni, combina le query
    categoryQueries.forEach(catQuery => {
      regionQueries.forEach(regQuery => {
        queries.push(`${catQuery} ${regQuery}`);
      });
    });
  } else if (categoryQueries.length > 0) {
    // Solo categorie
    queries.push(...categoryQueries);
  } else if (regionQueries.length > 0) {
    // Solo regioni
    queries.push(...regionQueries);
  }

  // Aggiungi termine di ricerca personalizzato
  if (filters.searchTerm) {
    queries.push(filters.searchTerm);
  }

  // Se non ci sono query, usa termini generici
  if (queries.length === 0) {
    queries.push('pasta industry 2024', 'rice market 2024', 'sustainable packaging 2024');
  }

  return queries;
}

async function searchNewsAPI(queries: string[]) {
  try {
    if (NEWS_API_KEY === 'demo' || !NEWS_API_KEY) {
      console.log('NewsAPI: Chiave API non configurata, saltando...');
      return [];
    }

    const results = [];
    for (const query of queries.slice(0, 3)) { // Increased to 3 queries for better balance
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: query,
          language: 'en',
          sortBy: 'publishedAt',
          // Removed 'from' parameter due to NewsAPI free tier date limitations
          pageSize: 5,
          apiKey: NEWS_API_KEY
        }
      });
      
      if (response.data.articles) {
        results.push(...response.data.articles.map((article: any) => ({
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
    console.error('NewsAPI error:', error instanceof Error ? error.message : error);
    return [];
  }
}

async function searchGuardianAPI(queries: string[]) {
  try {
    if (GUARDIAN_API_KEY === 'demo' || !GUARDIAN_API_KEY) {
      console.log('Guardian API: Chiave API non configurata, saltando...');
      return [];
    }

    const results = [];
    for (const query of queries.slice(0, 2)) { // Keep Guardian at 2 queries to balance
      const response = await axios.get('https://content.guardianapis.com/search', {
        params: {
          q: query,
          'api-key': GUARDIAN_API_KEY,
          'show-fields': 'headline,trailText,shortUrl',
          // Removed 'from-date' to get more recent articles
          'page-size': 5
        }
      });
      
      if (response.data.response?.results) {
        results.push(...response.data.response.results.slice(0, 3).map((article: any) => ({
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
    console.error('Guardian API error:', error instanceof Error ? error.message : error);
    return [];
  }
}

async function searchNewsDataAPI(queries: string[]) {
  try {
    if (NEWSDATA_API_KEY === 'demo' || !NEWSDATA_API_KEY) {
      console.log('NewsData API: Chiave API non configurata, saltando...');
      return [];
    }

    const results = [];
    for (const query of queries.slice(0, 1)) { // Limit to 1 query to save quota
      const response = await axios.get('https://newsdata.io/api/1/news', {
        params: {
          apikey: NEWSDATA_API_KEY,
          q: query
          // Removed page_size parameter as it causes 422 error
        }
      });
      
      if (response.data.results) {
        results.push(...response.data.results.slice(0, 5).map((article: any) => ({
          title: article.title,
          source: article.source_name || 'NewsData',
          url: article.link,
          publishedAt: article.pubDate,
          description: article.description || ''
        })));
      }
    }
    
    return results;
  } catch (error) {
    console.error('NewsData API error:', error instanceof Error ? error.message : error);
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
  // Filtra articoli rilevanti per Andriani basato sui filtri selezionati
  let keywords = ['pasta', 'rice', 'food', 'agri-food', 'food industry'];
  
  // Aggiungi keyword specifiche basate sui filtri
  if (filters.categories?.includes('packaging')) {
    keywords.push('packaging', 'sustainable', 'biodegradable', 'circular economy');
  }
  if (filters.categories?.includes('supply-chain')) {
    keywords.push('supply chain', 'logistics', 'distribution');
  }
  if (filters.categories?.includes('regulations')) {
    keywords.push('regulations', 'compliance', 'safety', 'EU');
  }
  if (filters.categories?.includes('competitors')) {
    keywords.push('Barilla', 'De Cecco', 'Garofalo', 'competition', 'market share');
  }
  if (filters.categories?.includes('innovation')) {
    keywords.push('innovation', 'technology', 'digital', 'AI', 'startup');
  }
  if (filters.categories?.includes('sustainability')) {
    keywords.push('sustainability', 'ESG', 'carbon', 'renewable', 'green');
  }
  
  // Aggiungi keyword geografiche
  if (filters.regions?.includes('italy')) {
    keywords.push('Italy', 'Italian', 'Made in Italy');
  }
  if (filters.regions?.includes('eu')) {
    keywords.push('EU', 'European', 'Europe');
  }
  if (filters.regions?.includes('usa')) {
    keywords.push('US', 'America', 'American');
  }
  if (filters.regions?.includes('canada')) {
    keywords.push('Canada', 'Canadian');
  }

  return articles.filter(article => {
    const text = `${article.title} ${article.description}`.toLowerCase();
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  }).slice(0, 20); // Limit to 20 articles
}

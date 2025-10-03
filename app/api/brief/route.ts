import OpenAI from "openai";

const client = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export async function POST(req: Request) {
  try {
    const { items, filters } = await req.json();
    // items: [{ title, source, link, date? }, ...]
    // filters: { categories: string[], regions: string[], searchTerm: string }

    // Intelligent pre-filtering based on selected filters
    let filteredItems = items;
    
    // Filter by search term
    if (filters?.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filteredItems = filteredItems.filter((item: any) => 
        item.title?.toLowerCase().includes(searchTerm) ||
        item.source?.toLowerCase().includes(searchTerm)
      );
    }

    // Always analyze all items, but apply filters in the analysis
    // This ensures we don't lose articles due to pre-filtering
    filteredItems = items;

    // Build dynamic instructions based on filters
    let filterInstructions = "";
    if (filters?.categories?.length) {
      const categoryNames = filters.categories.map((cat: string) => {
        const categoryMap: { [key: string]: string } = {
          'packaging': 'Packaging & Sustainability',
          'supply-chain': 'Supply Chain & Logistics',
          'regulations': 'Regulations & Compliance',
          'competitors': 'Competitors & Market',
          'innovation': 'Innovation & Technology',
          'sustainability': 'Sustainability & ESG'
        };
        return categoryMap[cat] || cat;
      }).join(', ');
      filterInstructions += `\n- FOCUS CATEGORIES: Analyze only news related to: ${categoryNames}`;
    }

    if (filters?.regions?.length) {
      const regionNames = filters.regions.map((region: string) => {
        const regionMap: { [key: string]: string } = {
          'italy': 'Italy',
          'eu': 'European Union',
          'usa': 'United States',
          'canada': 'Canada'
        };
        return regionMap[region] || region;
      }).join(', ');
      filterInstructions += `\n- GEOGRAPHIC FOCUS: Analyze only news related to: ${regionNames}`;
    }

    const instructions = `
You are a senior strategic analyst creating executive briefings for Andriani's board of directors. Andriani is an Italian food company specializing in pasta, rice, and sustainable packaging.

EXECUTIVE BRIEFING FORMAT:
- Focus on strategic implications, not just news summaries
- Provide actionable insights for board-level decision making
- Highlight competitive advantages, risks, and opportunities
- Connect news to Andriani's business strategy and market position

REQUIRED FIELDS for each item:
- title: Concise executive summary title
- source: News source
- link: Original article URL
- theme: Strategic theme (Agri & Commodity; Policy & Trade; ESG/Energy/Packaging; Competitors/Finance/Governance; Geopolitics & Risks; Tech/Data/Automation; Food Safety/Public Health; Territory/Brand Italy; Communication/Attention Economy)
- priority: High/Medium/Low based on strategic impact
- why_it_matters: 2-line strategic analysis focusing on business implications for Andriani
- region: Italy, EU, USA, Canada
- category: packaging, supply-chain, regulations, competitors, innovation, sustainability

STRATEGIC ANALYSIS FOCUS:
- Market positioning implications
- Competitive landscape changes
- Regulatory impact on operations
- Supply chain vulnerabilities/opportunities
- Brand reputation considerations
- Financial performance indicators
- Innovation and technology trends
- Sustainability and ESG factors

CATEGORIZATION RULES:
- Each article must be assigned to EXACTLY ONE category
- Choose the most relevant category based on primary content focus
- Avoid duplicate categorization - each article belongs to only one category
- Categories: packaging, supply-chain, regulations, competitors, innovation, sustainability

${filterInstructions}

CRITICAL: You MUST analyze and return executive summaries for ALL ${filteredItems.length} provided news items. Do not skip any articles. Each input article must have a corresponding executive summary in the output.

Output strict JSON with key "items" containing exactly ${filteredItems.length} items (one for each input article).
`;

    // Use OpenAI GPT-3.5-turbo (excellent quality/price ratio)
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: instructions },
        { 
          role: "user", 
          content: `INPUT_ITEMS_JSON:\n${JSON.stringify(filteredItems, null, 2)}\nReturn ONLY JSON: {"items":[...]}.` 
        }
      ],
      temperature: 0.3,
      max_tokens: 6000, // Increased tokens to handle all articles
    });

    const text = response.choices[0]?.message?.content ?? "";
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      // Fallback: try to extract JSON block
      const match = text.match(/\{[\s\S]*\}$/);
      json = match ? JSON.parse(match[0]) : { items: [] };
    }

    // Ensure we have items array
    if (!json.items || !Array.isArray(json.items)) {
      console.warn('Invalid response format, creating fallback items');
      // Create fallback items from input
      json.items = filteredItems.map((item: any) => ({
        title: item.title,
        source: item.source,
        link: item.link,
        theme: "General News",
        priority: "Medium",
        why_it_matters: "Requires board attention for strategic positioning and competitive advantage",
        region: "Italy",
        category: "general",
        publishedAt: item.date || new Date().toISOString()
      }));
    }

    // Ensure we have the same number of items as input
    if (json.items.length < filteredItems.length) {
      console.warn(`API returned ${json.items.length} items but expected ${filteredItems.length}, creating missing items`);
      const existingTitles = new Set(json.items.map((item: any) => item.title));
      const missingItems = filteredItems.filter((item: any) => !existingTitles.has(item.title));
      
      const additionalItems = missingItems.map((item: any) => ({
        title: item.title,
        source: item.source,
        link: item.link,
        theme: "General News",
        priority: "Medium",
        why_it_matters: "Requires board attention for strategic positioning and competitive advantage",
        region: "Italy",
        category: "general",
        publishedAt: item.date || new Date().toISOString()
      }));
      
      json.items = [...json.items, ...additionalItems];
    }

    return Response.json(json, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return Response.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

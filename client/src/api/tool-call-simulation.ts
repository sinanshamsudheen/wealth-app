export interface SimulatedToolCall {
  toolName: string
  description: string
  parameters?: Record<string, unknown>
  result: string
}

interface ModuleMatch {
  toolName: string
  description: string
  keywords: string[]
  result: string
}

const MODULE_MATCHERS: ModuleMatch[] = [
  {
    toolName: 'query_risk_planning',
    description: 'Fetching from Risk & Planning...',
    keywords: ['risk', 'allocation', 'return', 'sharpe', 'drift', 'liquidity split', 'illiquid', 'asset class', 'moderate'],
    result: 'Found client risk profile, asset allocation details, and risk metrics (Sharpe ratio, expected returns)',
  },
  {
    toolName: 'query_crm',
    description: 'Querying CRM / Engage...',
    keywords: ['client', 'profile', 'kyc', 'family', 'crm', 'task', 'todo', 'affiliation', 'saqib', 'rashidi', 'contact', 'advisor', 'onboarding', 'jahez', 'over-exposed', 'overexposed', 'founding'],
    result: 'Found client profile, family affiliations, pending tasks, and advisor assignments',
  },
  {
    toolName: 'query_data_aggregation',
    description: 'Querying Data Aggregation & Reporting...',
    keywords: ['nav', 'distribution', 'capital call', 'deployment', 'performance', 'yield', 'currency', 'twrr', 'benchmark', 'returns', 'jahez', 'public equity', 'public portfolio', 'holding'],
    result: 'Found NAV evolution data, distributions ($0.275M), returns ($0.85M), and deployment breakdown',
  },
  {
    toolName: 'query_deals',
    description: 'Fetching from Deals module...',
    keywords: ['deal', 'greengrid', 'prescreening', 'irr', 'moic', 'investment opportunity', 'round size', 'valuation', 'renewable', 'energy', 'jahez', 'rationale', 'why did we', 'meeting minutes', 'institutional memory'],
    result: 'Found GreenGrid Energy pre-screening report and historical IC meeting minutes (Jahez hold decision, Oct 2022)',
  },
  {
    toolName: 'query_client_portal',
    description: 'Querying Client Portal...',
    keywords: ['net worth', 'account', 'bank', 'liabilities', 'liquid', 'illiquid', 'portfolio liquidity', 'geographic', 'twrr', 'cash flow', 'pipeline', 'commitment', 'onboarding', 'kyc document', 'custodian', 'managed by'],
    result: 'Found client portal data: $640M net worth, $875M assets, $235M liabilities, investment pipeline with 12 opportunities',
  },
  {
    toolName: 'query_insights',
    description: 'Querying Insights / Daily Brief...',
    keywords: ['meeting', 'alert', 'news', 'brief', 'daily', 'priority', 'today', 'action item', 'portfolio alert', 'personal touch', 'birthday', 'schedule', 'jahez'],
    result: 'Found 4 portfolio alerts, 4 action items, 2 news alerts, 5 meetings, 2 personal touch items',
  },
]

// Keywords that indicate the question goes beyond internal knowledge base
const WEB_SEARCH_KEYWORDS = [
  'market', 'latest', 'current', 'today\'s', 'recent news', 'what is happening',
  'fed rate', 'interest rate', 'stock', 'index', 'gdp', 'inflation', 'economic',
  'sector outlook', 'forecast', 'prediction', 'trend', 'regulation', 'policy',
  'compare with', 'industry', 'benchmark against', 'how does', 'what do experts',
  'opinion', 'analysis', 'report says', 'according to', 'bloomberg', 'reuters',
  'real estate market', 'oil price', 'gold', 'crypto', 'bitcoin',
  'gcc economy', 'saudi', 'uae', 'middle east', 'global',
  'renewable energy market', 'infrastructure spend', 'private equity market',
  'web', 'search', 'google', 'find online', 'look up',
]

export function needsWebSearch(message: string): boolean {
  const lower = message.toLowerCase()
  return WEB_SEARCH_KEYWORDS.some((kw) => lower.includes(kw))
}

export function getSimulatedToolCalls(message: string): SimulatedToolCall[] {
  const lower = message.toLowerCase()
  const matched: SimulatedToolCall[] = []

  for (const mod of MODULE_MATCHERS) {
    if (mod.keywords.some((kw) => lower.includes(kw))) {
      matched.push({
        toolName: mod.toolName,
        description: mod.description,
        parameters: { query: message.slice(0, 60) },
        result: mod.result,
      })
    }
  }

  // Default to insights if nothing matched and no web search needed
  if (matched.length === 0 && !needsWebSearch(message)) {
    const fallback = MODULE_MATCHERS.find((m) => m.toolName === 'query_insights')!
    matched.push({
      toolName: fallback.toolName,
      description: fallback.description,
      parameters: { query: message.slice(0, 60) },
      result: fallback.result,
    })
  }

  // Add web search tool call if needed
  if (needsWebSearch(message)) {
    matched.push({
      toolName: 'web_search',
      description: 'Searching the web...',
      parameters: { query: message.slice(0, 80) },
      result: '', // Will be filled with real Tavily results
    })
  }

  return matched
}

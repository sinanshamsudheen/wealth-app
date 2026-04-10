export interface TavilySearchResult {
  title: string
  url: string
  content: string
  score: number
}

interface TavilyApiResponse {
  results: TavilySearchResult[]
  query: string
}

export async function searchTavily(query: string, maxResults = 3): Promise<TavilySearchResult[]> {
  const apiKey = import.meta.env.VITE_TAVILY_API_KEY
  if (!apiKey) {
    throw new Error('VITE_TAVILY_API_KEY is not configured')
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: maxResults,
      search_depth: 'basic',
      include_answer: false,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error')
    throw new Error(`Tavily API error (${response.status}): ${errorBody}`)
  }

  const data: TavilyApiResponse = await response.json()
  return data.results || []
}

export function formatTavilyResults(results: TavilySearchResult[]): string {
  if (results.length === 0) return 'No web results found.'

  return results
    .map((r, i) => `### Web Result ${i + 1}: ${r.title}\nSource: ${r.url}\n\n${r.content}`)
    .join('\n\n---\n\n')
}

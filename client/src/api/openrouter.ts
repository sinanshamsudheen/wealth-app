export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterChoice {
  message: { role: string; content: string }
  finish_reason: string
}

interface OpenRouterResponse {
  choices: OpenRouterChoice[]
}

export async function callOpenRouter(
  messages: OpenRouterMessage[],
  systemPrompt: string,
  model: string,
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('VITE_OPENROUTER_API_KEY is not configured')
  }

  const allMessages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ]

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Invictus AI Copilot',
    },
    body: JSON.stringify({
      model,
      messages: allMessages,
      max_tokens: 2048,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error')
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.')
    }
    throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`)
  }

  const data: OpenRouterResponse = await response.json()
  const choice = data.choices?.[0]
  if (!choice?.message?.content) {
    throw new Error('No content in OpenRouter response')
  }

  return choice.message.content
}

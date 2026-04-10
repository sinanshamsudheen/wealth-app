export interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AnthropicResponseContent {
  type: 'text'
  text: string
}

interface AnthropicApiResponse {
  id: string
  type: 'message'
  role: 'assistant'
  content: AnthropicResponseContent[]
  model: string
  stop_reason: string
}

export async function callAnthropic(
  messages: AnthropicMessage[],
  systemPrompt: string,
  model = 'claude-haiku-4-5-20251001',
): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY is not configured')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error')
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.')
    }
    throw new Error(`Anthropic API error (${response.status}): ${errorBody}`)
  }

  const data: AnthropicApiResponse = await response.json()
  const textBlock = data.content.find((c) => c.type === 'text')
  if (!textBlock) {
    throw new Error('No text content in Anthropic response')
  }

  return textBlock.text
}

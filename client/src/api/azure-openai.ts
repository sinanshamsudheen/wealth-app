export interface AzureOpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AzureOpenAIChoice {
  message: { role: string; content: string }
  finish_reason: string
}

interface AzureOpenAIResponse {
  choices: AzureOpenAIChoice[]
}

export async function callAzureOpenAI(
  messages: AzureOpenAIMessage[],
  systemPrompt: string,
  deployment: string,
): Promise<string> {
  const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT
  const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY
  const apiVersion = import.meta.env.VITE_AZURE_OPENAI_API_VERSION || '2024-02-01'

  if (!endpoint || !apiKey) {
    throw new Error('Azure OpenAI credentials are not configured')
  }

  const url = `${endpoint}openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`

  const allMessages: AzureOpenAIMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ]

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
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
    throw new Error(`Azure OpenAI API error (${response.status}): ${errorBody}`)
  }

  const data: AzureOpenAIResponse = await response.json()
  const choice = data.choices?.[0]
  if (!choice?.message?.content) {
    throw new Error('No content in Azure OpenAI response')
  }

  return choice.message.content
}

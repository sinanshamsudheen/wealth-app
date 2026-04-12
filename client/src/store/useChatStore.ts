import { create } from 'zustand'
import type { ChatMessage, ChatContext, ToolCallStep } from '@/api/types'
import {
  DAILY_SUMMARY_SUGGESTIONS,
  MEETING_BRIEF_SUGGESTIONS,
  DEFAULT_SUGGESTIONS,
} from '@/api/mock/data/chat'
import { callAnthropic, type AnthropicMessage } from '@/api/anthropic'
import { callAzureOpenAI, type AzureOpenAIMessage } from '@/api/azure-openai'
import { callOpenRouter, type OpenRouterMessage } from '@/api/openrouter'
import { buildSystemPrompt } from '@/api/knowledge-base'
import { getSimulatedToolCalls, needsWebSearch } from '@/api/tool-call-simulation'
import { searchTavily, formatTavilyResults } from '@/api/tavily'

export interface ChatThread {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
}

interface ChatState {
  messages: ChatMessage[]
  activeThreadId: string | null
  history: ChatThread[]
  showHistory: boolean
  isOpen: boolean
  isLoading: boolean
  context: ChatContext
  contextData: { meetingId?: string } | null

  toggle: () => void
  open: () => void
  close: () => void
  newChat: () => void
  loadThread: (threadId: string) => void
  deleteThread: (threadId: string) => void
  toggleHistory: () => void
  sendMessage: (content: string, model?: string) => void
  setContext: (context: ChatContext, data?: { meetingId?: string }) => void
  getSuggestions: () => string[]
  clearTimers: () => void
}

// Store active timeouts so we can clean them up
const activeTimers: ReturnType<typeof setTimeout>[] = []

function clearAllTimers() {
  activeTimers.forEach(clearTimeout)
  activeTimers.length = 0
}

// Derive a thread title from the first user message
function deriveTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user')
  if (!firstUser) return 'New chat'
  const text = firstUser.content
  return text.length > 40 ? text.slice(0, 40) + '...' : text
}

// Build conversation history for the API
function buildHistory(messages: ChatMessage[]): AnthropicMessage[] {
  return messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content.length > 0)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
}

// Route LLM call based on model ID prefix
async function callLLM(
  history: AnthropicMessage[],
  systemPrompt: string,
  model?: string,
): Promise<string> {
  const selectedModel = model || 'claude-haiku-4-5-20251001'

  if (selectedModel.startsWith('azure:')) {
    const deployment = selectedModel.replace('azure:', '')
    const azureMessages: AzureOpenAIMessage[] = history.map((m) => ({
      role: m.role,
      content: m.content,
    }))
    return callAzureOpenAI(azureMessages, systemPrompt, deployment)
  }

  if (selectedModel.startsWith('openrouter:')) {
    const openRouterModel = selectedModel.replace('openrouter:', '')
    const openRouterMessages: OpenRouterMessage[] = history.map((m) => ({
      role: m.role,
      content: m.content,
    }))
    return callOpenRouter(openRouterMessages, systemPrompt, openRouterModel)
  }

  // Default: Anthropic
  return callAnthropic(history, systemPrompt, selectedModel)
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  activeThreadId: null,
  history: [],
  showHistory: false,
  isOpen: false,
  isLoading: false,
  context: 'default' as ChatContext,
  contextData: null,

  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),

  newChat: () => {
    clearAllTimers()
    const { messages, activeThreadId, history } = get()

    // Save current thread to history if it has messages
    let updatedHistory = history
    if (messages.length > 0) {
      if (activeThreadId) {
        // Update existing thread in history
        updatedHistory = history.map((t) =>
          t.id === activeThreadId
            ? { ...t, messages: [...messages], title: deriveTitle(messages) }
            : t
        )
      } else {
        // Save as new thread
        const thread: ChatThread = {
          id: `thread-${Date.now()}`,
          title: deriveTitle(messages),
          messages: [...messages],
          createdAt: new Date().toISOString(),
        }
        updatedHistory = [thread, ...history]
      }
    }

    set({
      messages: [],
      activeThreadId: null,
      history: updatedHistory,
      isLoading: false,
      showHistory: false,
    })
  },

  loadThread: (threadId: string) => {
    clearAllTimers()
    const { messages, activeThreadId, history } = get()

    // Save current thread before switching
    let updatedHistory = history
    if (messages.length > 0 && !activeThreadId) {
      const thread: ChatThread = {
        id: `thread-${Date.now()}`,
        title: deriveTitle(messages),
        messages: [...messages],
        createdAt: new Date().toISOString(),
      }
      updatedHistory = [thread, ...history]
    } else if (messages.length > 0 && activeThreadId) {
      updatedHistory = history.map((t) =>
        t.id === activeThreadId
          ? { ...t, messages: [...messages], title: deriveTitle(messages) }
          : t
      )
    }

    const target = updatedHistory.find((t) => t.id === threadId)
    if (!target) return

    set({
      messages: [...target.messages],
      activeThreadId: threadId,
      history: updatedHistory,
      isLoading: false,
      showHistory: false,
    })
  },

  deleteThread: (threadId: string) => {
    set((s) => ({
      history: s.history.filter((t) => t.id !== threadId),
      // If we deleted the active thread, clear messages
      ...(s.activeThreadId === threadId
        ? { messages: [], activeThreadId: null }
        : {}),
    }))
  },

  toggleHistory: () => set((s) => ({ showHistory: !s.showHistory })),

  setContext: (context: ChatContext, data?: { meetingId?: string }) => {
    set({ context, contextData: data ?? null })
  },

  getSuggestions: () => {
    const { context } = get()
    if (context === 'daily_summary') return DAILY_SUMMARY_SUGGESTIONS
    if (context === 'meeting_brief') return MEETING_BRIEF_SUGGESTIONS
    return DEFAULT_SUGGESTIONS
  },

  clearTimers: () => {
    clearAllTimers()
  },

  sendMessage: (content: string, model?: string) => {
    // Add user message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }
    set((s) => ({ messages: [...s.messages, userMsg], isLoading: true }))

    const assistantMsgId = `msg-${Date.now()}-resp`

    // Get simulated tool calls for this message
    const simulatedTools = getSimulatedToolCalls(content)

    // Phase 1: Show thinking (600ms after user message)
    const t1 = setTimeout(() => {
      const thinkingMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        thinking: { content: 'Let me check the relevant modules to answer your question...' },
        toolCalls: [],
      }
      set((s) => ({ messages: [...s.messages, thinkingMsg] }))

      // Phase 2: Show tool calls one by one
      let toolDelay = 400
      simulatedTools.forEach((tc, idx) => {
        // Start tool call (running)
        const t2 = setTimeout(() => {
          const toolCall: ToolCallStep = {
            id: `tc-${assistantMsgId}-${idx}`,
            toolName: tc.toolName,
            description: tc.description,
            parameters: tc.parameters,
            status: 'running',
          }
          set((s) => ({
            messages: s.messages.map((m) => {
              if (m.id !== assistantMsgId) return m
              return { ...m, toolCalls: [...(m.toolCalls || []), toolCall] }
            }),
          }))
        }, toolDelay)
        activeTimers.push(t2)

        // Complete tool call (600ms later)
        toolDelay += 600
        const t3 = setTimeout(() => {
          set((s) => ({
            messages: s.messages.map((m) => {
              if (m.id !== assistantMsgId) return m
              const updatedCalls = (m.toolCalls || []).map((call) =>
                call.id === `tc-${assistantMsgId}-${idx}`
                  ? { ...call, status: 'complete' as const, result: tc.result }
                  : call
              )
              return { ...m, toolCalls: updatedCalls }
            }),
          }))
        }, toolDelay)
        activeTimers.push(t3)

        toolDelay += 300
      })

      // Phase 3: Call Tavily (if needed) then Anthropic API after tool calls are done
      const apiCallTimer = setTimeout(async () => {
        try {
          // If web search is needed, call Tavily first
          let webContext = ''
          if (needsWebSearch(content)) {
            try {
              const tavilyResults = await searchTavily(content)
              webContext = formatTavilyResults(tavilyResults)

              // Update the web_search tool call with real results
              const resultSummary = tavilyResults.length > 0
                ? `Found ${tavilyResults.length} web results: ${tavilyResults.map((r) => r.title).join(', ')}`
                : 'No relevant web results found'
              set((s) => ({
                messages: s.messages.map((m) => {
                  if (m.id !== assistantMsgId) return m
                  const updatedCalls = (m.toolCalls || []).map((call) =>
                    call.toolName === 'web_search'
                      ? { ...call, status: 'complete' as const, result: resultSummary }
                      : call
                  )
                  return { ...m, toolCalls: updatedCalls }
                }),
              }))
            } catch (e) {
              console.warn('Tavily search failed, continuing without web results:', e)
            }
          }

          // Build conversation history from all previous messages
          const allMessages = get().messages
          const history = buildHistory(
            allMessages.filter((m) => m.id !== assistantMsgId)
          )

          // Append web results to system prompt if available
          let systemPrompt = buildSystemPrompt()
          if (webContext) {
            systemPrompt += `\n\n---\n\n# WEB SEARCH RESULTS\n\nThe following are real-time web search results relevant to the user's question. Use these to supplement the knowledge base. When citing web sources, use the actual URLs from the results.\n\n${webContext}`
          }

          const aiResponse = await callLLM(history, systemPrompt, model)

          // Update assistant message with real response and auto-save thread
          set((s) => {
            const updatedMessages = s.messages.map((m) =>
              m.id === assistantMsgId ? { ...m, content: aiResponse } : m
            )
            // Auto-save to history so sidebar stays current
            let updatedHistory = s.history
            if (s.activeThreadId) {
              updatedHistory = s.history.map((t) =>
                t.id === s.activeThreadId
                  ? { ...t, messages: [...updatedMessages], title: deriveTitle(updatedMessages) }
                  : t
              )
            } else {
              const newThreadId = `thread-${Date.now()}`
              const thread: ChatThread = {
                id: newThreadId,
                title: deriveTitle(updatedMessages),
                messages: [...updatedMessages],
                createdAt: new Date().toISOString(),
              }
              updatedHistory = [thread, ...s.history]
              return { messages: updatedMessages, isLoading: false, history: updatedHistory, activeThreadId: newThreadId }
            }
            return { messages: updatedMessages, isLoading: false, history: updatedHistory }
          })
        } catch (error) {
          console.error('Anthropic API error:', error)
          const errorMessage =
            error instanceof Error ? error.message : 'An unexpected error occurred'
          set((s) => {
            const updatedMessages = s.messages.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: `Sorry, I encountered an error: ${errorMessage}. Please try again.` }
                : m
            )
            return { messages: updatedMessages, isLoading: false }
          })
        }
      }, toolDelay + 200)
      activeTimers.push(apiCallTimer)
    }, 600)
    activeTimers.push(t1)
  },
}))

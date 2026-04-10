import type { RunStatus } from '@/api/types'

export const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  queued: { label: 'Queued', color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-800' },
  running: { label: 'Running', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  awaiting_review: { label: 'Awaiting Review', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  resuming: { label: 'Resuming', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  complete: { label: 'Complete', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  failed: { label: 'Failed', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  cancelled: { label: 'Cancelled', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800' },
}

export function isActiveStatus(status: RunStatus): boolean {
  return status === 'queued' || status === 'running' || status === 'resuming'
}

// ── Agent Modules ────────────────────────────────────────────────────
// Each module maps to a business line in the Invictus platform.

export interface AgentModule {
  key: string
  label: string
  shortLabel: string
  color: string        // text-* class
  bgColor: string      // bg-* class for badge
  icon: string         // lucide icon name
}

export const AGENT_MODULES: AgentModule[] = [
  { key: 'all',              label: 'All Modules',                  shortLabel: 'All',            color: 'text-foreground',                            bgColor: 'bg-muted',                              icon: 'LayoutGrid' },
  { key: 'engage',           label: 'Engage',                       shortLabel: 'Engage',         color: 'text-violet-700 dark:text-violet-400',       bgColor: 'bg-violet-100 dark:bg-violet-900/30',   icon: 'Handshake' },
  { key: 'risk_planning',    label: 'Risk & Planning',              shortLabel: 'Risk & Plan',    color: 'text-amber-700 dark:text-amber-400',         bgColor: 'bg-amber-100 dark:bg-amber-900/30',     icon: 'ShieldCheck' },
  { key: 'data_reporting',   label: 'Data Aggregation & Reporting', shortLabel: 'Data & Reports', color: 'text-cyan-700 dark:text-cyan-400',           bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',       icon: 'BarChart3' },
  { key: 'deals',            label: 'Deals',                        shortLabel: 'Deals',          color: 'text-emerald-700 dark:text-emerald-400',     bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', icon: 'TrendingUp' },
  { key: 'client_portal',    label: 'Client Portal',                shortLabel: 'Client Portal',  color: 'text-blue-700 dark:text-blue-400',           bgColor: 'bg-blue-100 dark:bg-blue-900/30',       icon: 'Users' },
]

export function getModule(key: string): AgentModule {
  return AGENT_MODULES.find(m => m.key === key) ?? AGENT_MODULES[0]
}

// ── LLM Providers & Models ───────────────────────────────────────────

export const LLM_PROVIDERS = [
  { value: 'azure_openai', label: 'Azure OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'aws_bedrock', label: 'AWS Bedrock' },
  { value: 'google_vertex', label: 'Google Vertex' },
]

export const LLM_MODELS: Record<string, { value: string; label: string }[]> = {
  azure_openai: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
  anthropic: [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
    { value: 'claude-haiku-4-20250514', label: 'Claude Haiku 4' },
  ],
  aws_bedrock: [
    { value: 'anthropic.claude-sonnet-4-20250514-v1:0', label: 'Claude Sonnet 4 (Bedrock)' },
    { value: 'amazon.nova-pro-v1:0', label: 'Amazon Nova Pro' },
  ],
  google_vertex: [
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  ],
}

export const INVICTUS_MODULES = [
  { name: 'Home', icon: 'Home', path: '/' },
  { name: 'Invictus Engage', icon: 'Handshake', path: '#' },
  { name: 'Invictus Plan', icon: 'ClipboardList', path: '#' },
  { name: 'Invictus Tools & Communication', icon: 'Flag', path: '#' },
  { name: 'Invictus Deals', icon: 'TrendingUp', path: '#' },
  { name: 'Invictus AI', icon: 'Lightbulb', path: '/', active: true },
  { name: 'Invictus Administration', icon: 'Users', path: '#' },
]

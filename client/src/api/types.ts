export const RunStatus = {
  QUEUED: 'queued',
  RUNNING: 'running',
  AWAITING_REVIEW: 'awaiting_review',
  RESUMING: 'resuming',
  COMPLETE: 'complete',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const

export type RunStatus = (typeof RunStatus)[keyof typeof RunStatus]

export interface RunStep {
  node: string
  status: 'complete' | 'running' | 'pending' | 'failed'
  started_at: string | null
  completed_at: string | null
  result_summary: string | null
  actions: string[]
}

export interface AgentRunResponse {
  id: string
  tenant_id: string
  user_id: string
  workflow: string
  status: RunStatus
  input: Record<string, unknown> | null
  output: Record<string, unknown> | null
  steps: RunStep[]
  llm_config: Record<string, unknown> | null
  error: string | null
  triggered_by: string | null
  created_at: string | null
  started_at: string | null
  completed_at: string | null
  duration_ms: number | null
}

export interface WorkflowDefinition {
  workflow: string
  name: string
  description: string
  module: string
  category: string
  icon: string
  supportsHitl: boolean
  inputFields: InputField[]
  steps: string[]
}

export interface InputField {
  key: string
  label: string
  type: 'text' | 'array' | 'number' | 'select'
  required: boolean
  options?: string[]
  placeholder?: string
}

export interface TriggerRequest {
  input: Record<string, unknown>
  llm_config?: {
    provider: string
    model: string
    parameters?: Record<string, unknown>
  }
}

export interface TriggerResponse {
  run_id: string
  status: RunStatus
}

export interface ResumeRequest {
  approved: boolean
  feedback: string
  edits?: Record<string, unknown>
}

// ── Chat ─────────────────────────────────────────────────────────────

export interface ToolCallStep {
  id: string
  toolName: string
  description: string
  parameters?: Record<string, unknown>
  result?: string
  status: 'pending' | 'running' | 'complete'
}

export interface ThinkingBlock {
  content: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  thinking?: ThinkingBlock
  toolCalls?: ToolCallStep[]
}

export const ChatContext = {
  DAILY_SUMMARY: 'daily_summary',
  MEETING_BRIEF: 'meeting_brief',
  DEFAULT: 'default',
} as const

export type ChatContext = (typeof ChatContext)[keyof typeof ChatContext]

// ── Daily Summary ────────────────────────────────────────────────────

export type ActionItemOwner = 'client' | 'internal'

export interface DailySummaryActionItem {
  id: string
  title: string
  client: string
  source: 'task_hub' | 'email' | 'compliance' | 'crm' | 'invest_admin'
  description: string
  owner: ActionItemOwner
}

export interface DailySummaryMeeting {
  id: string
  meetingId: string
  time: string
  date: string
  clientName: string
  topic: string
  attendees: string[]
  hasBrief: boolean
  briefLabel?: string
}

export interface DailySummaryInboxItem {
  id: string
  from: string
  subject: string
  preview: string
}

export interface DailySummaryNewsItem {
  id: string
  headline: string
  summary: string
  source: string
  sourceUrl?: string
}

export interface DailySummaryPersonalItem {
  id: string
  clientName: string
  clientEmail: string
  type: 'birthday' | 'anniversary' | 'follow_up'
  note: string
  emailSubject: string
  emailBody: string
  date?: string
}

// ── Relationship Pool ───────────────────────────────────────────────

export interface ClientSegmentSplit {
  segment: 'Affluents' | 'HNI' | 'UHNI'
  count: number
}

export interface DeployableGap {
  assetClass: string
  amount: string
  amountNumeric: number
}

export interface RelationshipPool {
  totalClients: number
  clientsTrend: number
  segmentSplit: ClientSegmentSplit[]
  totalNetworth: string
  networthTrend: number
  deployableGaps: DeployableGap[]
  insights: string[]
}

// ── Portfolio Alerts ────────────────────────────────────────────────

export type PortfolioAlertCategory = 'portfolio_drift' | 'margin_call'

export interface PortfolioAlert {
  id: string
  category: PortfolioAlertCategory
  clientName: string
  clientEmail: string
  clientHref: string
  description: string
  severity: 'warning' | 'critical'
}

// ── News Alerts ─────────────────────────────────────────────────────

export interface NewsAlert {
  id: string
  headline: string
  summary: string
  source: string
  sourceUrl: string
  affectedClients: { name: string; impact: string; email: string }[]
  clientEmailSubject: string
  clientEmailBody: string
  internalTaskTitle: string
  internalTaskDescription: string
}

// ── Action Modal ────────────────────────────────────────────────────

export type ActionModalType = 'schedule_meeting' | 'create_task' | 'send_email'

export interface ActionModalContext {
  type: ActionModalType | null
  clientName?: string
  prefillTo?: string
  prefillSubject?: string
  prefillDescription?: string
}

// ── Daily Summary (v2) ──────────────────────────────────────────────

export interface DailySummary {
  id: string
  date: string
  relationshipPool: RelationshipPool
  sections: {
    portfolioAlerts: PortfolioAlert[]
    newsAlerts: NewsAlert[]
    actionItems: DailySummaryActionItem[]
    meetings: DailySummaryMeeting[]
    personal: DailySummaryPersonalItem[]
  }
}

// ── Meeting Brief ────────────────────────────────────────────────────

export interface MeetingBriefAttendee {
  name: string
  role: string
}

export interface CapitalFlowNotice {
  fund: string
  type: 'capital_call' | 'distribution'
  amount: string
  status: 'overdue' | 'to_approve' | 'upcoming' | 'received'
}

export interface AssetAllocation {
  name: string
  percentage: number
}

export interface PipelineDeal {
  name: string
  category: string
  description: string
  icMemoUrl?: string
}

export interface NavMovement {
  fund: string
  navDate: string
  qoqChange: number
}

export interface MeetingBrief {
  id: string
  clientName: string
  date: string
  time: string
  attendees: MeetingBriefAttendee[]
  format: 'in-person' | 'video' | 'phone'
  duration: string
  summary: {
    goal: string
    mainTopics: string[]
    secondaryTopics: string[]
  }
  capitalFlows: {
    funded: string
    distributed: string
    notices: CapitalFlowNotice[]
  }
  deployment: {
    deployed: number
    target: number
    byAssetClass: AssetAllocation[]
  }
  pipeline: PipelineDeal[]
  performance: NavMovement[]
  keyNews: DailySummaryNewsItem[]
  pendingItems: { title: string; status?: string; href?: string }[]
  returnsExpectation?: {
    annualReturn: { actual: number; target: number }
    yield: { actual: number; target: number }
    standardDeviation: { actual: number; target: number }
    sharpeRatio: { actual: number; target: number }
  }
  navEvolution?: { year: number; nav: number; twr?: number }[]
  zoomLink?: string
  personalTouch?: DailySummaryPersonalItem[]
  quickLinks?: { label: string; href: string }[]
  meetingMinutes?: {
    subject: string
    date: string
    time: string
    format: string
    status: string
    attendees: { name: string; role: string }[]
    agenda: string[]
    keyDecisions: string[]
    actionItems: { item: string; owner: string; status: string }[]
    notes: string
  }
}

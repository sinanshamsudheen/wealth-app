import type { ChatMessage, ChatContext } from '@/api/types'

// ── Agentic Response Structure ───────────────────────────────────────

export interface AgenticToolCall {
  toolName: string
  description: string
  parameters?: Record<string, unknown>
  result: string
}

export interface AgenticResponse {
  thinking: string
  toolCalls: AgenticToolCall[]
  answer: string
}

// ── Daily Summary Suggestions ────────────────────────────────────────

export const DAILY_SUMMARY_SUGGESTIONS = [
  'What are my priorities today?',
  'Any overdue items?',
  'Summarize the compliance issues',
  'Brief me on today\'s meetings',
  'What emails need attention?',
  'Any client birthdays this week?',
]

// ── Meeting Brief Suggestions ────────────────────────────────────────

export const MEETING_BRIEF_SUGGESTIONS = [
  'What\'s the client\'s risk appetite?',
  'Recent portfolio changes?',
  'Key talking points for this meeting',
  'Capital commitment status?',
  'Any pending admin items?',
  'Recent news affecting this client?',
]

// ── Default Suggestions ──────────────────────────────────────────────

export const DEFAULT_SUGGESTIONS = [
  'What agents are available?',
  'Show me recent run status',
  'Tell me about Investment Memo',
  'Help',
]

// ── Daily Summary Agentic Responses ──────────────────────────────────

const DAILY_SUMMARY_RESPONSES: Record<string, AgenticResponse> = {
  priorities: {
    thinking: 'The user wants to know their priorities. Let me check their task hub for action items, review the calendar for upcoming meetings, and cross-reference with any overdue items that need immediate attention.',
    toolCalls: [
      {
        toolName: 'query_task_hub',
        description: 'Querying Task Hub for action items...',
        parameters: { status: 'open', sort: 'priority_desc', limit: 10 },
        result: 'Found 4 open action items: 2 high priority (KYC renewal, capital call), 2 medium priority (DocuSign, Q1 approval)',
      },
      {
        toolName: 'check_calendar',
        description: 'Checking calendar for today\'s meetings...',
        parameters: { date: 'today', include_prep: true },
        result: 'Found 3 meetings today: 9:30 Al-Rashidi (quarterly update), 11:00 Meridian (portfolio), 14:00 Hamdan (Apex deal)',
      },
    ],
    answer: 'Here are your priorities for today:\n\n**🔴 High Priority:**\n- **Al-Rashidi Family — KYC Renewal**: Missing documents need immediate follow-up before the 9:30 meeting\n- **GCC RE Fund III — Capital Call**: Overdue $3.2M capital call for Al-Rashidi — discuss payment timeline in the meeting\n\n**🟡 Medium Priority:**\n- **Hamdan Trust — DocuSign**: Subscription agreement signature still pending — can address in the 14:00 meeting\n- **Veritas — Q1 Approval**: Sign-off pending, not time-sensitive today\n\n**📅 Meetings:**\n1. **9:30** — Al-Rashidi quarterly update (KYC + capital flows)\n2. **11:00** — Meridian portfolio rebalancing\n3. **14:00** — Hamdan Trust Apex deal evaluation\n\nI\'d suggest starting with the Al-Rashidi KYC documents before your 9:30 call.',
  },
  overdue: {
    thinking: 'Let me check the task hub specifically for overdue items, and also check if there are any overdue capital calls or compliance deadlines that need attention.',
    toolCalls: [
      {
        toolName: 'query_task_hub',
        description: 'Querying Task Hub for overdue items...',
        parameters: { status: 'overdue', include_capital_calls: true },
        result: 'Found 2 overdue items: GCC RE Fund III capital call ($3.2M, 5 days overdue), Al-Rashidi KYC renewal (documents missing since last week)',
      },
      {
        toolName: 'query_compliance_db',
        description: 'Checking compliance deadlines...',
        parameters: { status: 'overdue_or_due_today' },
        result: 'KYC escalation flagged for Al-Rashidi Family — compliance team requesting immediate follow-up',
      },
    ],
    answer: 'You have **2 overdue items** that need immediate attention:\n\n1. **GCC RE Fund III — Capital Call ($3.2M)**\n   - 5 days overdue for Al-Rashidi Family\n   - Wire instructions were sent but no confirmation received\n   - ⚠️ Fund admin has flagged this — discuss in the 9:30 meeting\n\n2. **Al-Rashidi Family — KYC Renewal**\n   - Missing documents since last week\n   - Compliance has escalated — requires immediate follow-up\n   - This should be your first action item today\n\nBoth items are related to Al-Rashidi and can be addressed in your 9:30 meeting. Would you like me to prepare talking points?',
  },
  compliance: {
    thinking: 'The user wants a compliance summary. I need to check the compliance database for any flags, pending certifications, and KYC/AML items across all clients.',
    toolCalls: [
      {
        toolName: 'query_compliance_db',
        description: 'Querying compliance database...',
        parameters: { type: 'all_open', severity: 'all' },
        result: 'Found 3 compliance items: 1 KYC escalation (Al-Rashidi), 1 KYC renewal due (Al-Rashidi), 1 pending compliance email from compliance officer',
      },
      {
        toolName: 'search_documents',
        description: 'Searching for compliance-related documents...',
        parameters: { query: 'KYC FATCA compliance', last_days: 7 },
        result: 'Found: Al-Rashidi KYC file (incomplete — missing source of wealth docs), Compliance escalation email received today',
      },
    ],
    answer: 'Here\'s your compliance summary:\n\n**⚠️ Active Escalation:**\n- **Al-Rashidi Family — KYC Escalation**: Compliance team flagged missing source-of-wealth documentation. This requires immediate follow-up — the renewal deadline has passed.\n\n**📋 Pending Items:**\n- **Al-Rashidi — KYC Renewal**: The core issue — W-8BEN and source of wealth documents are missing. Need client to provide before the file can be closed.\n- **Compliance Email**: The compliance team sent an escalation email this morning requiring your acknowledgment.\n\n**✅ No Issues:**\n- All other clients are current on KYC/AML\n- No FATCA reporting flags\n- No suspicious activity reports pending\n\nI recommend addressing the Al-Rashidi KYC first — it\'s the most time-sensitive item.',
  },
  meetings: {
    thinking: 'Let me pull the meeting schedule for today, along with relevant client context and preparation materials from the CRM.',
    toolCalls: [
      {
        toolName: 'check_calendar',
        description: 'Checking today\'s calendar...',
        parameters: { date: 'today', include_prep: true },
        result: '3 meetings found: Al-Rashidi 9:30 (quarterly), Meridian 11:00 (portfolio), Hamdan 14:00 (Apex deal)',
      },
      {
        toolName: 'query_crm',
        description: 'Pulling client context from CRM...',
        parameters: { clients: ['Al-Rashidi', 'Meridian', 'Hamdan'], fields: ['last_interaction', 'open_items', 'sentiment'] },
        result: 'Al-Rashidi: last met 27 Mar, 2 open items, sentiment positive. Meridian: last met 2 weeks ago, drift alert active. Hamdan: last met 1 week ago, Apex decision pending.',
      },
    ],
    answer: 'Here\'s your meeting briefing for today:\n\n**9:30 — Al-Rashidi Family** (Video, 60 min)\n- Quarterly update + pending KYC discussion\n- Key topics: capital flows review ($5.97M distributed vs $7.1M funded), overdue GCC RE Fund III call, KYC renewal\n- ⚠️ Ahmed\'s birthday is tomorrow — good opportunity for personal touch\n- → [Meeting brief available]\n\n**11:00 — Meridian Capital** (Video, 45 min)\n- Portfolio allocation and rebalancing\n- Key topics: PE overweight by 3.2%, credit underweight. Need to agree on rebalancing execution\n- → [Meeting brief available]\n\n**14:00 — Hamdan Trust** (In-person, 60 min)\n- Apex Logistics deal evaluation\n- Key topics: co-invest opportunity ($2M), c.18% gross return target, IC questions on margins\n- Also: estate planning — succession deed ready for signing\n- → [Meeting brief available]\n\nWould you like me to dive deeper into any of these?',
  },
  emails: {
    thinking: 'Let me check the inbox for important emails that need attention, prioritizing by sender importance and action required.',
    toolCalls: [
      {
        toolName: 'search_inbox',
        description: 'Searching inbox for priority emails...',
        parameters: { unread: true, priority: 'high', last_hours: 24 },
        result: 'Found 3 priority emails: Sarah Chen (SWIFT confirmation), Apollo IR (capital call notice), Compliance (KYC escalation)',
      },
      {
        toolName: 'check_priority_rules',
        description: 'Applying priority rules to inbox...',
        parameters: { rules: ['client_communication', 'capital_calls', 'compliance'] },
        result: 'Highest priority: Compliance KYC escalation (action required). Second: Apollo IR capital call (client communication needed). Third: Sarah Chen SWIFT (filing).',
      },
    ],
    answer: 'You have **3 emails** that need attention:\n\n**🔴 Urgent:**\n- **Compliance** — KYC escalation requiring immediate follow-up for Al-Rashidi Family. Respond to acknowledge and confirm action plan.\n\n**🟡 Action Needed:**\n- **Apollo IR** — Capital call notice received. You need to review and communicate to affected clients (Al-Rashidi, Noor Holdings, Veritas). Total: ~$3.5M across 3 clients.\n\n**📋 Administrative:**\n- **Sarah Chen** — SWIFT confirmation received, needs reconciliation and filing. Can be handled by ops team.\n\nI\'d recommend responding to the compliance email first, then reviewing the Apollo capital call notice before your meetings.',
  },
  birthdays: {
    thinking: 'Let me check the CRM for any upcoming client birthdays, anniversaries, or relationship milestones this week.',
    toolCalls: [
      {
        toolName: 'query_crm',
        description: 'Querying CRM for personal milestones...',
        parameters: { type: 'personal_dates', range: 'this_week', include: ['birthday', 'anniversary', 'milestone'] },
        result: 'Found 2 items: Ahmed Al-Rashidi birthday tomorrow, Meridian Capital client anniversary this week',
      },
    ],
    answer: 'This week\'s personal milestones:\n\n**🎂 Birthday:**\n- **Ahmed Al-Rashidi** — Birthday is **tomorrow**! Great opportunity for personal outreach. He\'s a key decision-maker for the Al-Rashidi Family account.\n  - Suggestion: Send a personalized birthday message. Since you\'re meeting today at 9:30, you could mention it at the end of the call.\n\n**🎉 Anniversary:**\n- **Meridian Capital** — Client anniversary this week. They\'ve been with you for 3 years.\n  - Suggestion: A brief acknowledgment in your 11:00 meeting would reinforce the relationship.\n\nNo other client birthdays or milestones this week. Would you like me to draft a birthday message for Ahmed?',
  },
}

// ── Meeting Brief Agentic Responses ──────────────────────────────────

const MEETING_BRIEF_RESPONSES: Record<string, AgenticResponse> = {
  risk_appetite: {
    thinking: 'The user wants to understand the client\'s risk profile. Let me pull the risk assessment from the CRM and check any recent changes to their investment policy statement.',
    toolCalls: [
      {
        toolName: 'query_crm',
        description: 'Querying CRM for client risk profile...',
        parameters: { field: 'risk_profile', include_history: true },
        result: 'Risk profile: Moderate-Conservative. Last updated 6 months ago. Target return: 8-12% net. Max drawdown tolerance: 15%. Liquidity needs: 10% of AUM.',
      },
      {
        toolName: 'query_risk_profile',
        description: 'Pulling detailed risk assessment...',
        parameters: { include_ips_constraints: true },
        result: 'IPS constraints: max 40% PE, max 20% single fund, no crypto/digital assets. Preferred sectors: infrastructure, real estate. Avoid: early-stage VC, distressed debt.',
      },
    ],
    answer: 'Here\'s the client\'s risk profile:\n\n**Risk Rating:** Moderate-Conservative\n\n**Return Targets:**\n- Target: 8-12% net annual return\n- Max drawdown tolerance: 15%\n- Liquidity requirement: 10% of AUM accessible within 90 days\n\n**IPS Constraints:**\n- Max 40% in private equity\n- Max 20% in any single fund\n- No crypto/digital asset exposure\n- Preferred: Infrastructure, Real Estate\n- Avoid: Early-stage VC, Distressed Debt\n\n**Recent Behavior:**\n- Profile last reviewed 6 months ago — annual review coming up\n- Has been comfortable with current allocation\n- Expressed interest in increasing infrastructure exposure in last meeting\n\nThis is relevant for today\'s discussion — any new commitments should align with these constraints.',
  },
  portfolio_changes: {
    thinking: 'Let me check for recent portfolio changes, including any new commitments, distributions, or rebalancing activity.',
    toolCalls: [
      {
        toolName: 'query_portfolio_db',
        description: 'Querying portfolio database for recent activity...',
        parameters: { period: 'last_90_days', include_transactions: true },
        result: 'Last 90 days: 3 capital calls ($7.1M funded), 2 distributions ($5.97M received), 0 secondary trades, 0 new commitments.',
      },
      {
        toolName: 'check_transactions',
        description: 'Checking recent transaction details...',
        parameters: { type: 'all', period: 'last_90_days' },
        result: 'Capital calls: GCC RE III ($3.2M, overdue), Apollo IX ($1.8M, pending), KKR Infra ($2.1M, upcoming). Distributions: BREIT ($4.65M, received), Carlyle V ($1.32M, received).',
      },
    ],
    answer: 'Recent portfolio activity (last 90 days):\n\n**Capital Calls (Funded: $7.1M):**\n- GCC RE Fund III — $3.2M ⚠️ *Overdue*\n- Apollo Secondaries IX — $1.8M *Pending approval*\n- KKR Infrastructure II — $2.1M *Upcoming*\n\n**Distributions (Received: $5.97M):**\n- BREIT — $4.65M ✅ Received\n- Carlyle Europe V — $1.32M ✅ Received\n\n**Net Position:** -$1.13M (more funded than distributed)\n\n**Notable:**\n- No new commitments in 90 days\n- No secondary trades\n- GCC RE Fund III call is overdue — this should be addressed\n- BREIT distribution is significant — reinvestment decision needed\n\nThe portfolio is relatively active on the cash flow side but no structural changes have been made.',
  },
  talking_points: {
    thinking: 'I need to synthesize multiple data sources to build the key talking points — CRM notes, recent news, pending items, and the meeting agenda.',
    toolCalls: [
      {
        toolName: 'query_crm',
        description: 'Pulling client history and notes from CRM...',
        parameters: { include: ['last_meeting_notes', 'open_items', 'relationship_status'] },
        result: 'Last meeting: 27 Mar. Notes: discussed liquidity, documentation, deployment. Open items: KYC renewal, GCC RE capital call. Relationship: strong, long-term.',
      },
      {
        toolName: 'search_news',
        description: 'Searching for relevant market news...',
        parameters: { keywords: ['private equity', 'GCC', 'infrastructure', 'real estate'], days: 7 },
        result: 'Key stories: Apollo exit delay (Bloomberg), ECB rate cuts (Reuters), Red Sea disruption impact on logistics (FT)',
      },
      {
        toolName: 'check_pending_items',
        description: 'Checking pending action items for this client...',
        parameters: { status: 'open' },
        result: '4 pending items: KYC renewal (overdue), GCC RE capital call (overdue), subscription agreement (pending), birthday outreach (tomorrow)',
      },
    ],
    answer: 'Here are your key talking points for the meeting:\n\n**1. Open with Personal Touch**\n- Ahmed\'s birthday is tomorrow — acknowledge it warmly\n- Meridian anniversary this week — if mentioned, acknowledge\n\n**2. Capital Flows Review**\n- $5.97M distributed vs $7.1M funded in last 90 days\n- Address the overdue GCC RE Fund III call ($3.2M) — need timeline\n- BREIT distribution ($4.65M) — reinvestment decision needed\n\n**3. KYC Renewal** *(must address)*\n- Missing source-of-wealth documentation\n- Compliance has escalated — need documents ASAP\n\n**4. Pipeline Discussion**\n- GCC Data Centers Fund I — strong regional tailwinds\n- Apex Logistics — IC review pending, high return potential\n\n**5. Market Context**\n- ECB rate cuts supportive for European assets (Carlyle V +6.1%)\n- Apollo exit delay may affect distribution timeline\n\n**6. Close with Next Steps**\n- Confirm capital call wire timeline\n- Collect KYC documents\n- Schedule follow-up on pipeline decisions',
  },
  capital_status: {
    thinking: 'Let me pull the capital commitment and call schedule for this client to give a comprehensive view of their capital position.',
    toolCalls: [
      {
        toolName: 'query_capital_flows',
        description: 'Querying capital flows database...',
        parameters: { period: 'last_90_days', include_upcoming: true },
        result: 'Total funded: $7.1M. Total distributed: $5.97M. Unfunded commitments: $12.3M across 5 funds. Upcoming calls in next 60 days: $3.9M.',
      },
      {
        toolName: 'check_notices',
        description: 'Checking capital call notices...',
        parameters: { status: 'all_active' },
        result: '5 active notices: GCC RE III ($3.2M overdue), Apollo IX ($1.8M pending), KKR Infra ($2.1M upcoming), 2 distributions received.',
      },
    ],
    answer: 'Capital commitment overview:\n\n**Unfunded Commitments:** $12.3M across 5 funds\n\n**Active Notices:**\n| Fund | Type | Amount | Status |\n|------|------|--------|--------|\n| GCC RE Fund III | Capital Call | $3.2M | 🔴 Overdue |\n| Apollo IX | Capital Call | $1.8M | 🟡 Pending Approval |\n| KKR Infra II | Capital Call | $2.1M | 🔵 Upcoming |\n| BREIT | Distribution | $4.65M | ✅ Received |\n| Carlyle Europe V | Distribution | $1.32M | ✅ Received |\n\n**Next 60 Days:** ~$3.9M in expected calls\n\n**Liquidity Position:**\n- Recent distributions provide $5.97M in cash\n- Net of upcoming calls, client has ~$2.07M excess\n- Sufficient liquidity for current obligations\n\nThe overdue GCC RE call should be the priority discussion point.',
  },
  pending_admin: {
    thinking: 'Let me check the task hub and compliance system for any pending administrative items related to this client.',
    toolCalls: [
      {
        toolName: 'query_task_hub',
        description: 'Querying Task Hub for client admin items...',
        parameters: { status: 'open', type: 'administrative' },
        result: 'Found 4 items: KYC renewal (overdue), subscription agreement WDR (pending), annual risk review (due this quarter), DocuSign pending.',
      },
      {
        toolName: 'check_compliance',
        description: 'Checking compliance requirements...',
        parameters: { type: 'pending_actions' },
        result: 'KYC escalation active. Annual risk reassessment due. No AML flags.',
      },
    ],
    answer: 'Pending admin items for this client:\n\n**🔴 Urgent:**\n- **KYC Renewal** — Overdue. Missing source-of-wealth documents. Compliance has escalated.\n- **GCC RE Fund III Capital Call** — $3.2M overdue. Need wire confirmation.\n\n**🟡 Pending:**\n- **Subscription Agreement** — WDR pending review. Not blocking any active commitments yet.\n- **DocuSign** — Signature pending on subscription documents.\n\n**📋 Upcoming:**\n- **Annual Risk Reassessment** — Due this quarter. Should schedule with client.\n\n**✅ Clear:**\n- No AML flags\n- No FATCA reporting issues\n- All other compliance items current\n\nThe KYC renewal is the most critical admin item — it could affect future transactions if not resolved.',
  },
  news: {
    thinking: 'Let me search for recent market news that\'s relevant to this client\'s portfolio holdings and investment interests.',
    toolCalls: [
      {
        toolName: 'search_market_news',
        description: 'Searching market news for client-relevant stories...',
        parameters: { sectors: ['private_equity', 'real_estate', 'infrastructure', 'logistics'], region: 'GCC', days: 7 },
        result: 'Found 5 relevant stories: Apollo exit delay, ECB rate cuts, Red Sea disruption, GCC infra spending, BREIT redemption queue update.',
      },
      {
        toolName: 'query_portfolio_db',
        description: 'Cross-referencing with portfolio holdings...',
        parameters: { field: 'holdings_list' },
        result: 'Client holds: GCC RE Fund III, KKR Infra II, Carlyle Europe V, Apollo IX, BREIT. Direct relevance to 4 of 5 news stories.',
      },
    ],
    answer: 'Recent news affecting this client\'s portfolio:\n\n**📰 Directly Relevant:**\n\n1. **Apollo revises NovaBridge exit timeline to H2 2027** *(Bloomberg)*\n   - Impact: Apollo IX distributions may be delayed\n   - Action: Manage client expectations on timing\n   - Portfolio exposure: Apollo Secondaries IX (-3.2% QoQ)\n\n2. **ECB signals two rate cuts in H1 2026** *(Reuters)*\n   - Impact: Positive for European assets\n   - Context: Explains Carlyle Europe V strength (+6.1% QoQ)\n   - Action: Frame as tailwind in discussion\n\n3. **Red Sea disruptions continue into Q2** *(FT)*\n   - Impact: Logistics sector risk — relevant if discussing Apex co-invest\n   - Action: Address risk proactively if Apex comes up\n\n**📊 Market Context:**\n\n4. **BREIT redemption queue shrinks** *(Bloomberg)*\n   - Positive for BREIT NAV stability\n   - Relevant for distribution reinvestment discussion\n\n5. **GCC infrastructure spending accelerates** *(Gulf News)*\n   - Supports infrastructure allocation thesis\n   - Relevant for GCC Data Centers Fund I pipeline discussion',
  },
}

// ── Response Matching ────────────────────────────────────────────────

function matchResponse(
  message: string,
  responses: Record<string, AgenticResponse>
): AgenticResponse | null {
  const lower = message.toLowerCase()

  const keywordMap: Record<string, string[]> = {
    priorities: ['priority', 'priorities', 'important', 'focus', 'what should i'],
    overdue: ['overdue', 'late', 'missed', 'behind', 'outstanding'],
    compliance: ['compliance', 'kyc', 'aml', 'fatca', 'regulatory'],
    meetings: ['meeting', 'calendar', 'schedule', 'brief me', 'today\'s meetings'],
    emails: ['email', 'inbox', 'mail', 'messages', 'need attention'],
    birthdays: ['birthday', 'anniversary', 'personal', 'milestone', 'celebration'],
    risk_appetite: ['risk', 'appetite', 'tolerance', 'profile', 'conservative'],
    portfolio_changes: ['portfolio change', 'recent change', 'transaction', 'activity', 'what changed'],
    talking_points: ['talking point', 'talking points', 'key points', 'prepare', 'discussion'],
    capital_status: ['capital', 'commitment', 'funded', 'unfunded', 'call status'],
    pending_admin: ['pending', 'admin', 'administrative', 'outstanding items', 'to do'],
    news: ['news', 'market', 'headline', 'what\'s happening', 'affecting'],
  }

  for (const [key, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      if (responses[key]) return responses[key]
    }
  }

  return null
}

const DEFAULT_RESPONSE: AgenticResponse = {
  thinking: 'The user is asking a general question. Let me check what information I have available and provide a helpful response.',
  toolCalls: [
    {
      toolName: 'search_knowledge_base',
      description: 'Searching knowledge base...',
      parameters: { query: 'general' },
      result: 'Multiple data sources available: CRM, portfolio database, task hub, compliance system, market news.',
    },
  ],
  answer: 'I can help you with a variety of tasks. Here are some things you can ask me:\n\n**📋 Daily Planning:**\n- "What are my priorities today?"\n- "Any overdue items?"\n- "Brief me on today\'s meetings"\n\n**📊 Client & Portfolio:**\n- "What\'s the client\'s risk appetite?"\n- "Recent portfolio changes?"\n- "Capital commitment status?"\n\n**📰 Market & News:**\n- "Recent news affecting this client?"\n- "Summarize compliance issues"\n\n**🤖 Agents:**\n- "What agents are available?"\n- "Show me recent run status"\n\nWhat would you like to know?',
}

export function getAgenticResponse(
  message: string,
  context: ChatContext,
): AgenticResponse {
  // Try context-specific responses first
  if (context === 'daily_summary') {
    const match = matchResponse(message, DAILY_SUMMARY_RESPONSES)
    if (match) return match
  }

  if (context === 'meeting_brief') {
    const match = matchResponse(message, MEETING_BRIEF_RESPONSES)
    if (match) return match
  }

  // Try all responses as fallback
  const dailyMatch = matchResponse(message, DAILY_SUMMARY_RESPONSES)
  if (dailyMatch) return dailyMatch

  const meetingMatch = matchResponse(message, MEETING_BRIEF_RESPONSES)
  if (meetingMatch) return meetingMatch

  return DEFAULT_RESPONSE
}

// ── Initial Messages ─────────────────────────────────────────────────

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-system-1',
    role: 'assistant',
    content: "Welcome to Invictus AI! I'm your AI copilot. I can help you review your daily summary, prepare for meetings, check portfolio status, and more.\n\nYou have **1 run awaiting review** and **1 run in progress**. What would you like to do?",
    timestamp: new Date().toISOString(),
  },
]

// Legacy export for backward compatibility
export function getMockResponse(content: string): string {
  const response = getAgenticResponse(content, 'default')
  return response.answer
}

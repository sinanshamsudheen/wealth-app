import { RunStatus, type AgentRunResponse, type RunStep } from '@/api/types'

function makeStep(node: string, status: RunStep['status'], summary: string | null, actions: string[], durationSec = 0, offsetSec = 0): RunStep {
  const base = new Date('2026-04-04T10:00:00Z')
  const started = new Date(base.getTime() + offsetSec * 1000)
  const completed = status === 'complete' || status === 'failed'
    ? new Date(started.getTime() + durationSec * 1000)
    : null
  return {
    node,
    status,
    started_at: status !== 'pending' ? started.toISOString() : null,
    completed_at: completed?.toISOString() ?? null,
    result_summary: summary,
    actions,
  }
}

const investmentMemoComplete: AgentRunResponse = {
  id: 'run-inv-001',
  tenant_id: 'tenant-watar',
  user_id: 'user-raoof',
  workflow: 'investment_memo',
  status: RunStatus.COMPLETE,
  input: { deal_id: 'DEAL-2026-001', doc_ids: ['DOC-101', 'DOC-102', 'DOC-103'], deal_name: 'Acme Corp Series B' },
  output: {
    title: 'Investment Memo — Acme Corp Series B',
    executive_summary: 'Acme Corp is raising a $50M Series B at a $200M pre-money valuation. The company has demonstrated strong revenue growth (42% YoY) with improving unit economics. We recommend proceeding with a $5M allocation.',
    key_metrics: { irr: '18.5%', moic: '2.3x', revenue_ttm: '$14.2M', revenue_growth: '42%', burn_rate: '$1.2M/mo', runway: '18 months' },
    risk_factors: ['Market concentration risk — 60% revenue from top 3 clients', 'Key person dependency on CTO', 'Regulatory uncertainty in target market'],
    recommendation: 'PROCEED — Allocate $5M with board observer seat',
  },
  steps: [
    makeStep('fetch_documents', 'complete', 'Retrieved 3 documents (128 pages total) from RAG Gateway', ['Called RAG Gateway with doc_ids: DOC-101, DOC-102, DOC-103'], 8, 0),
    makeStep('extract_financials', 'complete', 'Extracted IRR (18.5%), MOIC (2.3x), revenue ($14.2M TTM), burn rate ($1.2M/mo)', ['Called RAG Gateway ExtractFields with 6 field definitions', 'Cross-referenced figures across all 3 documents'], 23, 8),
    makeStep('market_research', 'complete', 'Analyzed market size ($8.2B TAM), competitive landscape (4 direct competitors), regulatory environment', ['Web search: Acme Corp industry analysis 2026', 'Web search: Series B fintech valuations Q1 2026', 'Retrieved 12 relevant articles'], 15, 31),
    makeStep('draft_memo', 'complete', 'Generated 12-page investment memo with executive summary, financials, market analysis, and risk factors', ['Called LLM with extracted data and market research', 'Generated structured memo with 6 sections'], 18, 46),
    makeStep('human_review', 'complete', 'Approved by advisor with minor feedback on revenue projections', ['Paused for human review', 'Received approval with feedback: "Adjust revenue projection to be more conservative"'], 120, 64),
    makeStep('finalize', 'complete', 'Finalized memo incorporating advisor feedback, generated PDF', ['Applied advisor edits to revenue projections', 'Generated final PDF document'], 5, 184),
  ],
  llm_config: { provider: 'azure_openai', model: 'gpt-4o' },
  error: null,
  triggered_by: 'user-raoof',
  created_at: '2026-04-04T10:00:00Z',
  started_at: '2026-04-04T10:00:01Z',
  completed_at: '2026-04-04T10:03:09Z',
  duration_ms: 189000,
}

const client360Complete: AgentRunResponse = {
  id: 'run-c360-001',
  tenant_id: 'tenant-watar',
  user_id: 'user-raoof',
  workflow: 'client_360',
  status: RunStatus.COMPLETE,
  input: { client_id: 'CLT-00042' },
  output: {
    client_name: 'Abdullah Al-Rashid',
    relationship_since: '2019-03-15',
    aum: '$12.4M',
    risk_profile: 'Moderate-Aggressive',
    compliance_status: 'Green — All KYC current',
    recent_interactions: 3,
    key_insights: ['Portfolio overweight in tech sector (45% vs 30% target)', 'Upcoming passport renewal needed for KYC', 'Last meeting discussed real estate allocation'],
  },
  steps: [
    makeStep('fetch_crm_data', 'complete', 'Retrieved client profile and contact history from CRM', ['MCP call: crm.get_client(CLT-00042)'], 3, 0),
    makeStep('fetch_portfolio', 'complete', 'Retrieved 4 portfolios totaling $12.4M AUM', ['MCP call: portfolio.get_holdings(CLT-00042)'], 4, 3),
    makeStep('fetch_compliance', 'complete', 'All KYC documents current, no pending compliance items', ['MCP call: compliance.get_status(CLT-00042)'], 2, 7),
    makeStep('fetch_communications', 'complete', 'Retrieved 3 recent interactions (email, meeting, call)', ['MCP call: comms.get_recent(CLT-00042, limit=10)'], 3, 9),
    makeStep('aggregate_profile', 'complete', 'Merged data from 4 sources into unified profile', ['Aggregated CRM, portfolio, compliance, and communication data'], 2, 12),
    makeStep('generate_insights', 'complete', 'Generated 3 key insights and 2 action recommendations', ['Called LLM to analyze aggregated profile', 'Identified portfolio imbalance and upcoming KYC renewal'], 8, 14),
  ],
  llm_config: { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
  error: null,
  triggered_by: 'user-raoof',
  created_at: '2026-04-04T09:30:00Z',
  started_at: '2026-04-04T09:30:01Z',
  completed_at: '2026-04-04T09:30:23Z',
  duration_ms: 22000,
}

const kycAwaitingReview: AgentRunResponse = {
  id: 'run-kyc-001',
  tenant_id: 'tenant-watar',
  user_id: 'user-raoof',
  workflow: 'kyc_fatca',
  status: RunStatus.AWAITING_REVIEW,
  input: { client_id: 'CLT-00099', doc_ids: ['KYC-201', 'KYC-202'] },
  output: {
    form_type: 'W-8BEN',
    extracted_fields: {
      full_name: 'Maria Gonzalez',
      country_of_citizenship: 'Spain',
      date_of_birth: '1985-07-22',
      tax_id: 'ES-12345678X',
      permanent_address: 'Calle Mayor 15, Madrid, Spain',
      treaty_claim: 'Article 12 — Reduced rate (10%) on interest income',
    },
    confidence_scores: { full_name: 0.98, country_of_citizenship: 0.95, date_of_birth: 0.92, tax_id: 0.88, permanent_address: 0.91, treaty_claim: 0.85 },
    flags: ['Tax ID confidence below 90% — manual verification recommended', 'Treaty claim requires advisor confirmation'],
  },
  steps: [
    makeStep('fetch_documents', 'complete', 'Retrieved 2 KYC documents (24 pages)', ['Called RAG Gateway with doc_ids: KYC-201, KYC-202'], 5, 0),
    makeStep('extract_kyc_fields', 'complete', 'Extracted 6 fields with confidence scores ranging from 0.85 to 0.98', ['Called RAG Gateway ExtractFields with 6 KYC field definitions', 'Source chunks mapped to each extracted field'], 12, 5),
    makeStep('validate_fields', 'complete', 'Validation passed for 4/6 fields. 2 fields flagged for review', ['Cross-validated tax ID format against Spanish tax ID patterns', 'Flagged treaty claim for advisor confirmation'], 4, 17),
    makeStep('determine_form_type', 'complete', 'Determined W-8BEN based on non-US citizenship and individual status', ['Evaluated citizenship, entity type, and treaty eligibility'], 2, 21),
    makeStep('generate_forms', 'complete', 'Generated pre-filled W-8BEN form with extracted data', ['Populated W-8BEN template with extracted fields', 'Marked flagged fields for human review'], 6, 23),
    makeStep('human_review', 'running', 'Awaiting advisor review of flagged fields and treaty claim', ['Paused for human review — 2 flags require attention'], 0, 29),
    makeStep('finalize', 'pending', null, [], 0, 0),
  ],
  llm_config: { provider: 'azure_openai', model: 'gpt-4o' },
  error: null,
  triggered_by: 'user-raoof',
  created_at: '2026-04-04T11:00:00Z',
  started_at: '2026-04-04T11:00:01Z',
  completed_at: null,
  duration_ms: null,
}

const discrepancyRunning: AgentRunResponse = {
  id: 'run-disc-001',
  tenant_id: 'tenant-watar',
  user_id: 'user-raoof',
  workflow: 'discrepancy_detection',
  status: RunStatus.RUNNING,
  input: { portfolio_id: 'PF-00123', report_date: '2026-04-01' },
  output: null,
  steps: [
    makeStep('fetch_internal_records', 'complete', 'Retrieved 156 positions from internal portfolio system', ['MCP call: portfolio.get_positions(PF-00123, date=2026-04-01)'], 4, 0),
    makeStep('fetch_custodian_data', 'complete', 'Retrieved 158 positions from custodian report', ['Parsed custodian report for PF-00123'], 6, 4),
    makeStep('first_pass_comparison', 'running', null, ['Comparing 156 internal positions against 158 custodian positions'], 0, 10),
    makeStep('second_pass_analysis', 'pending', null, [], 0, 0),
    makeStep('classify_discrepancies', 'pending', null, [], 0, 0),
    makeStep('generate_report', 'pending', null, [], 0, 0),
  ],
  llm_config: { provider: 'azure_openai', model: 'gpt-4o-mini' },
  error: null,
  triggered_by: 'user-raoof',
  created_at: '2026-04-04T11:30:00Z',
  started_at: '2026-04-04T11:30:01Z',
  completed_at: null,
  duration_ms: null,
}

const dataIngestionFailed: AgentRunResponse = {
  id: 'run-di-001',
  tenant_id: 'tenant-watar',
  user_id: 'user-raoof',
  workflow: 'data_ingestion',
  status: RunStatus.FAILED,
  input: { doc_ids: ['STMT-301'], source_type: 'bank_statement' },
  output: null,
  steps: [
    makeStep('validate_documents', 'complete', 'Document validated: PDF, 12 pages, bank statement format detected', ['Validated document format and structure'], 3, 0),
    makeStep('extract_transactions', 'failed', 'Failed to extract transactions — unsupported bank format', ['Attempted OCR extraction', 'Pattern matching failed: unrecognized table format'], 8, 3),
  ],
  llm_config: { provider: 'azure_openai', model: 'gpt-4o' },
  error: 'ExtractionError: Unsupported bank statement format. The document from "First National Bank" uses a non-standard table layout that is not currently supported.',
  triggered_by: 'user-raoof',
  created_at: '2026-04-03T16:00:00Z',
  started_at: '2026-04-03T16:00:01Z',
  completed_at: '2026-04-03T16:00:12Z',
  duration_ms: 11000,
}

const portfolioRecommendationComplete: AgentRunResponse = {
  id: 'run-pr-001',
  tenant_id: 'tenant-watar',
  user_id: 'user-raoof',
  workflow: 'portfolio_recommendation',
  status: RunStatus.COMPLETE,
  input: { client_id: 'CLT-00042', investment_amount: 1000000 },
  output: {
    recommendations: [
      { portfolio: 'Growth Balanced', allocation: '40%', score: 92, rationale: 'Best match for moderate-aggressive risk profile with growth objective' },
      { portfolio: 'Global Equity', allocation: '35%', score: 87, rationale: 'Diversified equity exposure aligned with long-term horizon' },
      { portfolio: 'Fixed Income Plus', allocation: '25%', score: 78, rationale: 'Income component for portfolio stability' },
    ],
    total_expected_return: '8.2% annualized',
    risk_metrics: { sharpe_ratio: 1.24, max_drawdown: '-12.3%', volatility: '14.2%' },
  },
  steps: [
    makeStep('fetch_client_profile', 'complete', 'Retrieved risk profile: Moderate-Aggressive, horizon: 10+ years', ['MCP call: crm.get_client(CLT-00042)', 'MCP call: compliance.get_suitability(CLT-00042)'], 4, 0),
    makeStep('analyze_risk_tolerance', 'complete', 'Risk score: 72/100, suitable for growth-oriented portfolios', ['Analyzed risk questionnaire responses', 'Compared against regulatory suitability requirements'], 6, 4),
    makeStep('scan_market_conditions', 'complete', 'Market outlook: Neutral-Bullish, rates expected stable', ['Web search: market outlook Q2 2026', 'Retrieved latest economic indicators'], 10, 10),
    makeStep('generate_recommendations', 'complete', 'Generated 3 portfolio recommendations with scores and rationale', ['Scored 12 model portfolios against client profile', 'Selected top 3 with combined allocation'], 12, 20),
    makeStep('human_review', 'complete', 'Approved by advisor — no modifications', ['Paused for human review', 'Approved without changes'], 90, 32),
    makeStep('finalize_recommendation', 'complete', 'Generated client-ready recommendation report', ['Created recommendation document', 'Prepared compliance disclosure'], 4, 122),
  ],
  llm_config: { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
  error: null,
  triggered_by: 'user-raoof',
  created_at: '2026-04-03T14:00:00Z',
  started_at: '2026-04-03T14:00:01Z',
  completed_at: '2026-04-03T14:02:07Z',
  duration_ms: 126000,
}

const newsFeedComplete: AgentRunResponse = {
  id: 'run-nf-001',
  tenant_id: 'tenant-watar',
  user_id: 'user-raoof',
  workflow: 'news_feed_recommender',
  status: RunStatus.COMPLETE,
  input: { topics: ['fintech', 'regulation', 'gcc markets'], region: 'gcc' },
  output: {
    articles_scanned: 342,
    articles_selected: 12,
    top_stories: [
      { title: 'UAE Central Bank Issues New Digital Asset Regulations', relevance: 0.95 },
      { title: 'GCC Wealth Management Market to Reach $3.5T by 2028', relevance: 0.91 },
      { title: 'New FATCA Reporting Requirements for 2027', relevance: 0.88 },
    ],
  },
  steps: [
    makeStep('fetch_news_sources', 'complete', 'Fetched 342 articles from 18 news sources', ['Tavily API: queried 18 sources across 3 topics'], 6, 0),
    makeStep('filter_relevance', 'complete', 'Filtered to 48 relevant articles using keyword + semantic match', ['Applied keyword filters', 'Ran semantic similarity scoring'], 8, 6),
    makeStep('score_articles', 'complete', 'Scored and ranked 48 articles by relevance, recency, and impact', ['LLM scoring with financial domain context'], 10, 14),
    makeStep('personalize_feed', 'complete', 'Personalized top 12 articles for GCC focus', ['Applied regional preference weighting'], 4, 24),
    makeStep('publish_feed', 'complete', 'Published feed with 12 curated articles', ['Wrote to feed database', 'Notified subscribed users'], 2, 28),
  ],
  llm_config: { provider: 'azure_openai', model: 'gpt-4o-mini' },
  error: null,
  triggered_by: 'system',
  created_at: '2026-04-04T06:00:00Z',
  started_at: '2026-04-04T06:00:01Z',
  completed_at: '2026-04-04T06:00:31Z',
  duration_ms: 30000,
}

const meetingTranscriptComplete: AgentRunResponse = {
  id: 'run-ff-001',
  tenant_id: 'tenant-watar',
  user_id: 'user-raoof',
  workflow: 'fireflies',
  status: RunStatus.COMPLETE,
  input: { transcript_id: 'FF-2026-0404-001' },
  output: {
    meeting_title: 'Quarterly Portfolio Review — Al-Rashid Family Office',
    duration: '47 minutes',
    participants: ['Raoof Naushad', 'Abdullah Al-Rashid', 'Sarah Chen'],
    key_topics: ['Portfolio rebalancing', 'Real estate allocation increase', 'Tax-loss harvesting'],
    decisions: ['Increase real estate allocation from 15% to 20%', 'Defer tax-loss harvesting to Q3'],
    action_items: [
      { assignee: 'Raoof', action: 'Prepare updated IPS with new allocation targets', deadline: '2026-04-11' },
      { assignee: 'Sarah', action: 'Model tax impact of Q3 harvesting vs immediate', deadline: '2026-04-08' },
    ],
    sentiment: 'Positive — client expressed satisfaction with YTD performance',
  },
  steps: [
    makeStep('fetch_transcript', 'complete', 'Retrieved 47-minute transcript (12,400 words)', ['Fireflies API: fetched transcript FF-2026-0404-001'], 3, 0),
    makeStep('extract_topics', 'complete', 'Identified 3 key discussion topics', ['NLP topic extraction with financial domain model'], 5, 3),
    makeStep('analyze_sentiment', 'complete', 'Overall sentiment: Positive (confidence: 0.87)', ['Sentiment analysis across 23 speaking turns'], 4, 8),
    makeStep('identify_decisions', 'complete', 'Extracted 2 key decisions and 2 action items', ['LLM decision extraction', 'Cross-referenced with CRM context'], 6, 12),
    makeStep('generate_summary', 'complete', 'Generated structured meeting summary with action items', ['Created executive summary', 'Assigned action items with deadlines'], 5, 18),
  ],
  llm_config: { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
  error: null,
  triggered_by: 'user-raoof',
  created_at: '2026-04-04T08:30:00Z',
  started_at: '2026-04-04T08:30:01Z',
  completed_at: '2026-04-04T08:30:24Z',
  duration_ms: 23000,
}

export const MOCK_RUNS: AgentRunResponse[] = [
  investmentMemoComplete,
  client360Complete,
  kycAwaitingReview,
  discrepancyRunning,
  dataIngestionFailed,
  portfolioRecommendationComplete,
  newsFeedComplete,
  meetingTranscriptComplete,
]

export function getRunsForWorkflow(workflow: string): AgentRunResponse[] {
  return MOCK_RUNS.filter(r => r.workflow === workflow)
}

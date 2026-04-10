import type { WorkflowDefinition } from '@/api/types'

export const WORKFLOW_DEFINITIONS: WorkflowDefinition[] = [
  // ── Invictus Engage ────────────────────────────────────────────────
  {
    workflow: 'client_360',
    name: 'Client 360 View',
    description: 'Aggregates client data from CRM, portfolio, compliance, and communication modules into a unified 360-degree client profile with key insights.',
    module: 'engage',
    category: 'Engage',
    icon: 'User',
    supportsHitl: false,
    inputFields: [
      { key: 'client_id', label: 'Client ID', type: 'text', required: true, placeholder: 'e.g. CLT-00042' },
    ],
    steps: ['fetch_crm_data', 'fetch_portfolio', 'fetch_compliance', 'fetch_communications', 'aggregate_profile', 'generate_insights'],
  },
  {
    workflow: 'ai_updates',
    name: 'AI Updates & Action Items',
    description: 'Extracts key decisions, action items, and follow-ups from meeting notes and writes them back to CRM records for automatic task creation.',
    module: 'engage',
    category: 'Engage',
    icon: 'ListChecks',
    supportsHitl: false,
    inputFields: [
      { key: 'meeting_id', label: 'Meeting ID', type: 'text', required: true, placeholder: 'e.g. MTG-2026-0404' },
      { key: 'client_id', label: 'Client ID', type: 'text', required: false, placeholder: 'e.g. CLT-00042' },
    ],
    steps: ['fetch_meeting_notes', 'extract_action_items', 'categorize_actions', 'write_to_crm', 'notify_assignees'],
  },
  {
    workflow: 'fireflies',
    name: 'Meeting Transcript Analyzer',
    description: 'Parses meeting transcripts from Fireflies.ai, extracts key topics, sentiment, decisions, and participant contributions for relationship intelligence.',
    module: 'engage',
    category: 'Engage',
    icon: 'MessageSquare',
    supportsHitl: false,
    inputFields: [
      { key: 'transcript_id', label: 'Transcript ID', type: 'text', required: true, placeholder: 'e.g. FF-2026-0404-001' },
    ],
    steps: ['fetch_transcript', 'extract_topics', 'analyze_sentiment', 'identify_decisions', 'generate_summary'],
  },

  // ── Risk & Planning ─────────────────────────────────────────────────
  {
    workflow: 'kyc_fatca',
    name: 'KYC/FATCA Compliance',
    description: 'Extracts KYC fields from onboarding documents and auto-generates compliance forms (W-8BEN, W-9, CRS) with confidence scores and source tracing.',
    module: 'risk_planning',
    category: 'Risk & Plan',
    icon: 'Shield',
    supportsHitl: true,
    inputFields: [
      { key: 'client_id', label: 'Client ID', type: 'text', required: true, placeholder: 'e.g. CLT-00042' },
      { key: 'doc_ids', label: 'Document IDs (comma-separated)', type: 'text', required: true, placeholder: 'e.g. KYC-001, KYC-002' },
    ],
    steps: ['fetch_documents', 'extract_kyc_fields', 'validate_fields', 'determine_form_type', 'generate_forms', 'human_review', 'finalize'],
  },
  {
    workflow: 'discrepancy_detection',
    name: 'Discrepancy Detection',
    description: 'Two-pass comparison identifying portfolio mismatches between internal records and custodian reports with severity classification and resolution suggestions.',
    module: 'risk_planning',
    category: 'Risk & Plan',
    icon: 'AlertTriangle',
    supportsHitl: false,
    inputFields: [
      { key: 'portfolio_id', label: 'Portfolio ID', type: 'text', required: true, placeholder: 'e.g. PF-00123' },
      { key: 'report_date', label: 'Report Date', type: 'text', required: true, placeholder: 'e.g. 2026-04-01' },
    ],
    steps: ['fetch_internal_records', 'fetch_custodian_data', 'first_pass_comparison', 'second_pass_analysis', 'classify_discrepancies', 'generate_report'],
  },

  {
    workflow: 'portfolio_recommendation',
    name: 'Portfolio Recommendation',
    description: 'Scores and recommends investment portfolios based on client risk profile, investment objectives, market conditions, and compliance constraints.',
    module: 'risk_planning',
    category: 'Risk & Plan',
    icon: 'PieChart',
    supportsHitl: true,
    inputFields: [
      { key: 'client_id', label: 'Client ID', type: 'text', required: true, placeholder: 'e.g. CLT-00042' },
      { key: 'investment_amount', label: 'Investment Amount', type: 'number', required: true, placeholder: 'e.g. 1000000' },
    ],
    steps: ['fetch_client_profile', 'analyze_risk_tolerance', 'scan_market_conditions', 'generate_recommendations', 'human_review', 'finalize_recommendation'],
  },

  // ── Data Aggregation & Reporting ───────────────────────────────────
  {
    workflow: 'data_ingestion',
    name: 'Data Ingestion Pipeline',
    description: 'Validates and extracts transaction data from bank statements, custodian reports, and other financial documents with automated reconciliation.',
    module: 'data_reporting',
    category: 'Data & Reports',
    icon: 'Database',
    supportsHitl: false,
    inputFields: [
      { key: 'doc_ids', label: 'Document IDs (comma-separated)', type: 'text', required: true, placeholder: 'e.g. STMT-001, STMT-002' },
      { key: 'source_type', label: 'Source Type', type: 'select', required: true, options: ['bank_statement', 'custodian_report', 'trade_confirmation'] },
    ],
    steps: ['validate_documents', 'extract_transactions', 'normalize_data', 'detect_anomalies', 'write_to_database'],
  },
  {
    workflow: 'post_acquisition_report',
    name: 'Post-Acquisition Report',
    description: 'Generates weekly post-acquisition performance reports by aggregating portfolio returns, benchmark comparisons, and attribution analysis.',
    module: 'data_reporting',
    category: 'Data & Reports',
    icon: 'FileBarChart',
    supportsHitl: true,
    inputFields: [
      { key: 'portfolio_id', label: 'Portfolio ID', type: 'text', required: true, placeholder: 'e.g. PF-00123' },
      { key: 'period', label: 'Reporting Period', type: 'select', required: true, options: ['weekly', 'monthly', 'quarterly'] },
    ],
    steps: ['fetch_portfolio_data', 'calculate_returns', 'benchmark_comparison', 'attribution_analysis', 'draft_report', 'human_review', 'finalize_report'],
  },
  {
    workflow: 'news_feed_recommender',
    name: 'News Feed Recommender',
    description: 'Scans financial news sources daily and curates a personalized feed of market updates, regulatory changes, and client-relevant events.',
    module: 'data_reporting',
    category: 'Data & Reports',
    icon: 'Newspaper',
    supportsHitl: false,
    inputFields: [
      { key: 'topics', label: 'Topics (comma-separated)', type: 'text', required: false, placeholder: 'e.g. fintech, regulation, markets' },
      { key: 'region', label: 'Region', type: 'select', required: false, options: ['global', 'gcc', 'europe', 'americas', 'asia'] },
    ],
    steps: ['fetch_news_sources', 'filter_relevance', 'score_articles', 'personalize_feed', 'publish_feed'],
  },

  // ── Deals ───────────────────────────────────────────────────────────
  {
    workflow: 'investment_memo',
    name: 'Investment Memo Generator',
    description: 'Generates comprehensive investment memos by extracting financials from deal documents, conducting market research, and drafting executive summaries with key metrics.',
    module: 'deals',
    category: 'Deals',
    icon: 'FileText',
    supportsHitl: true,
    inputFields: [
      { key: 'deal_id', label: 'Deal ID', type: 'text', required: true, placeholder: 'e.g. DEAL-2026-001' },
      { key: 'doc_ids', label: 'Document IDs (comma-separated)', type: 'text', required: true, placeholder: 'e.g. DOC-001, DOC-002' },
      { key: 'deal_name', label: 'Deal Name', type: 'text', required: false, placeholder: 'e.g. Acme Corp Series B' },
    ],
    steps: ['fetch_documents', 'extract_financials', 'market_research', 'draft_memo', 'human_review', 'finalize'],
  },

  // ── Client Portal ──────────────────────────────────────────────────
  {
    workflow: 'client_onboarding',
    name: 'Client Onboarding Assistant',
    description: 'Guides new clients through the digital onboarding process — collects documents, validates identity, sets up accounts, and triggers compliance checks.',
    module: 'client_portal',
    category: 'Client Portal',
    icon: 'UserPlus',
    supportsHitl: true,
    inputFields: [
      { key: 'client_name', label: 'Client Name', type: 'text', required: true, placeholder: 'e.g. John Smith' },
      { key: 'client_email', label: 'Client Email', type: 'text', required: true, placeholder: 'e.g. john@example.com' },
      { key: 'account_type', label: 'Account Type', type: 'select', required: true, options: ['individual', 'joint', 'corporate', 'trust'] },
    ],
    steps: ['collect_documents', 'validate_identity', 'risk_assessment', 'setup_accounts', 'compliance_check', 'human_review', 'activate_account'],
  },
  {
    workflow: 'client_report_generator',
    name: 'Client Report Generator',
    description: 'Generates personalized portfolio performance reports for clients including returns, asset allocation, benchmark comparison, and market commentary.',
    module: 'client_portal',
    category: 'Client Portal',
    icon: 'FileSpreadsheet',
    supportsHitl: false,
    inputFields: [
      { key: 'client_id', label: 'Client ID', type: 'text', required: true, placeholder: 'e.g. CLT-00042' },
      { key: 'period', label: 'Report Period', type: 'select', required: true, options: ['monthly', 'quarterly', 'annual'] },
    ],
    steps: ['fetch_client_data', 'calculate_performance', 'generate_charts', 'add_commentary', 'format_report', 'deliver_to_portal'],
  },
]

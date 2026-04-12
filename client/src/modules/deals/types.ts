// ── Investment Types ──

export type SnapshotFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'select'
  | 'multi-select'
  | 'boolean'

export interface SnapshotField {
  name: string
  type: SnapshotFieldType
  required: boolean
  instruction: string
  options?: string[]
}

export interface SnapshotSection {
  name: string
  sortOrder: number
  fields: SnapshotField[]
}

export interface SnapshotConfig {
  sections: SnapshotSection[]
}

export interface InvestmentType {
  id: string
  name: string
  slug: string
  isSystem: boolean
  sortOrder: number
  snapshotConfig: SnapshotConfig
  createdAt: string
  updatedAt: string
}

// ── Document Templates ──

export interface DocumentTemplate {
  id: string
  investmentTypeId: string
  name: string
  slug: string
  promptTemplate: string
  isSystem: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// ── Mandates ──

export interface AssetAllocationItem {
  assetClass: string
  allocationPct: number
  targetReturn: string
}

export type MandateStatus = 'draft' | 'active' | 'closed'

export interface Mandate {
  id: string
  name: string
  status: MandateStatus
  targetAllocation: number | null
  expectedReturn: string
  timeHorizon: string
  investmentTypes: string[]
  assetAllocation: AssetAllocationItem[] | null
  targetSectors: string[]
  geographicFocus: string[]
  investmentCriteria: string
  investmentConstraints: string
  investmentStrategy: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ── Opportunities ──

export type PipelineStatus = 'new' | 'active' | 'archived' | 'ignored'

export type FitScore = 'strong' | 'moderate' | 'weak'

export interface MandateFit {
  mandateId: string
  fitScore: FitScore
  reasoning: string
}

export interface Opportunity {
  id: string
  name: string
  investmentTypeId: string
  investmentTypeName: string
  pipelineStatus: PipelineStatus
  assetManagerId: string
  assetManagerName: string
  assignedTo: string
  snapshotData: Record<string, unknown>
  snapshotCitations: Record<string, string>
  sourceType: string
  mandateFits: MandateFit[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

import { create } from 'zustand'
import { dealsApi } from './api'
import type {
  InvestmentType,
  DocumentTemplate,
  Mandate,
  MandateStatus,
  Opportunity,
  PipelineStatus,
} from './types'

interface DealsState {
  // Data
  investmentTypes: InvestmentType[]
  templates: DocumentTemplate[]
  mandates: Mandate[]
  opportunities: Opportunity[]
  pipelineFilter: PipelineStatus | null

  // Loading flags
  loadingInvestmentTypes: boolean
  loadingTemplates: boolean
  loadingMandates: boolean
  loadingOpportunities: boolean

  // Actions
  fetchInvestmentTypes: () => Promise<void>
  fetchTemplates: (investmentTypeId?: string) => Promise<void>
  fetchMandates: (status?: MandateStatus) => Promise<void>
  fetchOpportunities: (filters?: { pipelineStatus?: PipelineStatus; assignedTo?: string }) => Promise<void>
  setPipelineFilter: (status: PipelineStatus | null) => void
}

export const useDealsStore = create<DealsState>((set) => ({
  investmentTypes: [],
  templates: [],
  mandates: [],
  opportunities: [],
  pipelineFilter: null,

  loadingInvestmentTypes: false,
  loadingTemplates: false,
  loadingMandates: false,
  loadingOpportunities: false,

  fetchInvestmentTypes: async () => {
    set({ loadingInvestmentTypes: true })
    try {
      const investmentTypes = await dealsApi.listInvestmentTypes()
      set({ investmentTypes })
    } finally {
      set({ loadingInvestmentTypes: false })
    }
  },

  fetchTemplates: async (investmentTypeId?: string) => {
    set({ loadingTemplates: true })
    try {
      const templates = await dealsApi.listTemplates(investmentTypeId)
      set({ templates })
    } finally {
      set({ loadingTemplates: false })
    }
  },

  fetchMandates: async (status?: MandateStatus) => {
    set({ loadingMandates: true })
    try {
      const mandates = await dealsApi.listMandates(status)
      set({ mandates })
    } finally {
      set({ loadingMandates: false })
    }
  },

  fetchOpportunities: async (filters?: { pipelineStatus?: PipelineStatus; assignedTo?: string }) => {
    set({ loadingOpportunities: true })
    try {
      const opportunities = await dealsApi.listOpportunities(filters)
      set({ opportunities })
    } finally {
      set({ loadingOpportunities: false })
    }
  },

  setPipelineFilter: (status) => set({ pipelineFilter: status }),
}))

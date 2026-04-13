import { api } from '@/api/client'
import type {
  InvestmentType,
  DocumentTemplate,
  Mandate,
  MandateStatus,
  Opportunity,
  PipelineStatus,
  AssetManager,
  NewsItem,
  DashboardSummary,
} from './types'

export const dealsApi = {
  // Investment Types
  listInvestmentTypes: () => api.get<InvestmentType[]>('/deals/settings/investment-types'),
  getInvestmentType: (id: string) => api.get<InvestmentType>(`/deals/settings/investment-types/${id}`),
  createInvestmentType: (data: Partial<InvestmentType>) =>
    api.post<InvestmentType>('/deals/settings/investment-types', data),
  updateInvestmentType: (id: string, data: Partial<InvestmentType>) =>
    api.put<InvestmentType>(`/deals/settings/investment-types/${id}`, data),
  deleteInvestmentType: (id: string) => api.delete<void>(`/deals/settings/investment-types/${id}`),

  // Document Templates
  listTemplates: (investmentTypeId?: string) => {
    const params = investmentTypeId ? `?investmentTypeId=${investmentTypeId}` : ''
    return api.get<DocumentTemplate[]>(`/deals/settings/templates${params}`)
  },
  getTemplate: (id: string) => api.get<DocumentTemplate>(`/deals/settings/templates/${id}`),
  updateTemplate: (id: string, data: Partial<DocumentTemplate>) =>
    api.put<DocumentTemplate>(`/deals/settings/templates/${id}`, data),

  // Mandates
  listMandates: (status?: MandateStatus) => {
    const params = status ? `?status=${status}` : ''
    return api.get<Mandate[]>(`/deals/mandates${params}`)
  },
  getMandate: (id: string) => api.get<Mandate>(`/deals/mandates/${id}`),
  createMandate: (data: Partial<Mandate>) => api.post<Mandate>('/deals/mandates', data),
  updateMandate: (id: string, data: Partial<Mandate>) =>
    api.put<Mandate>(`/deals/mandates/${id}`, data),
  deleteMandate: (id: string) => api.delete<void>(`/deals/mandates/${id}`),

  // Opportunities
  listOpportunities: (filters?: { pipelineStatus?: PipelineStatus; assignedTo?: string }) => {
    const params = new URLSearchParams()
    if (filters?.pipelineStatus) params.set('pipelineStatus', filters.pipelineStatus)
    if (filters?.assignedTo) params.set('assignedTo', filters.assignedTo)
    const qs = params.toString()
    return api.get<Opportunity[]>(`/deals/opportunities${qs ? `?${qs}` : ''}`)
  },
  getOpportunity: (id: string) => api.get<Opportunity>(`/deals/opportunities/${id}`),
  createOpportunity: (data: Partial<Opportunity>) =>
    api.post<Opportunity>('/deals/opportunities', data),
  updateOpportunity: (id: string, data: Partial<Opportunity>) =>
    api.put<Opportunity>(`/deals/opportunities/${id}`, data),
  deleteOpportunity: (id: string) => api.delete<void>(`/deals/opportunities/${id}`),

  // Asset Managers
  listAssetManagers: (type?: string) => {
    const params = type ? `?type=${type}` : ''
    return api.get<AssetManager[]>(`/deals/asset-managers${params}`)
  },
  getAssetManager: (id: string) => api.get<AssetManager>(`/deals/asset-managers/${id}`),
  createAssetManager: (data: { name: string; type?: string; location?: string; description?: string; fundInfo?: Record<string, string>; firmInfo?: Record<string, string>; strategy?: Record<string, string> }) =>
    api.post<AssetManager>('/deals/asset-managers', data),
  updateAssetManager: (id: string, data: Partial<AssetManager>) =>
    api.put<AssetManager>(`/deals/asset-managers/${id}`, data),
  deleteAssetManager: (id: string) => api.delete<void>(`/deals/asset-managers/${id}`),

  // News
  listNews: (category?: string) => {
    const params = category ? `?category=${category}` : ''
    return api.get<NewsItem[]>(`/deals/news${params}`)
  },

  // Dashboard
  getDashboardSummary: () => api.get<DashboardSummary>('/deals/dashboard/summary'),
}

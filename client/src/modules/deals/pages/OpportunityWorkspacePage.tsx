import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDealsStore } from '../store'
import { WorkspaceLayout } from '../components/workspace/WorkspaceLayout'
import { WorkspaceTabBar } from '../components/workspace/WorkspaceTabBar'

export function OpportunityWorkspacePage() {
  const { oppId } = useParams<{ oppId: string }>()
  const navigate = useNavigate()
  const store = useDealsStore()
  const [showCreateDoc, setShowCreateDoc] = useState(false)

  useEffect(() => {
    if (oppId) {
      store.fetchWorkspace(oppId)
      if (store.investmentTypes.length === 0) store.fetchInvestmentTypes()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oppId])

  if (store.loadingWorkspace || !store.activeOpportunity) {
    return <div className="text-muted-foreground p-6">Loading workspace...</div>
  }

  function handleTabClick(tabId: string) {
    if (store.leftPanelTabId !== tabId) {
      store.setLeftPanel(tabId)
    } else {
      store.setRightPanel(tabId)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
        <Button variant="ghost" size="sm" onClick={() => navigate('/home/deals/opportunities')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-lg font-semibold truncate">{store.activeOpportunity.name}</h1>
        <Badge>{store.activeOpportunity.pipelineStatus}</Badge>
        {store.activeOpportunity.assetManagerName && (
          <span className="text-sm text-muted-foreground">{store.activeOpportunity.assetManagerName}</span>
        )}
        {store.activeOpportunity.investmentTypeName && (
          <Badge variant="outline">{store.activeOpportunity.investmentTypeName}</Badge>
        )}
      </div>

      {/* Tab Bar */}
      <WorkspaceTabBar
        tabs={store.workspaceTabs}
        leftTabId={store.leftPanelTabId}
        rightTabId={store.rightPanelTabId}
        onTabClick={handleTabClick}
        onNewDocument={() => setShowCreateDoc(true)}
      />

      {/* Split Panels — takes remaining height */}
      <div className="flex-1 overflow-hidden">
        <WorkspaceLayout
          opportunity={store.activeOpportunity}
          investmentTypes={store.investmentTypes}
          documents={store.workspaceDocuments}
          tabs={store.workspaceTabs}
          leftTabId={store.leftPanelTabId}
          rightTabId={store.rightPanelTabId}
          onOpportunityUpdate={(opp) => useDealsStore.setState({ activeOpportunity: opp })}
          onDocumentUpdate={(doc) => store.updateWorkspaceDocument(doc)}
        />
      </div>

      {/* CreateDocumentDialog will be added in Task 5 */}
      {showCreateDoc && (
        <div className="hidden" data-placeholder="create-document-dialog" />
      )}
    </div>
  )
}

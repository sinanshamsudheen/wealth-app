# 12 — AI Integration

## Architecture: AI as an External Service

AI capabilities in Invictus AI are provided by **external AI services** — separate from both the frontend and the core backend. The frontend and backend do **not** call LLM providers (Anthropic, OpenAI, etc.) directly. Instead, they call dedicated AI service endpoints that handle all LLM orchestration, agent execution, tool calling, and knowledge retrieval externally.

```
┌──────────────────┐       ┌──────────────────┐       ┌─────────────────────────┐
│   Frontend SPA   │       │   Core Backend    │       │   External AI Services  │
│   (React app)    │──────▶│   (FastAPI)       │──────▶│   (Separate service)    │
│                  │       │                   │       │                         │
│  • Chat UI       │       │  • Proxies AI     │       │  • LLM orchestration    │
│  • Agent status  │       │    requests       │       │  • Agent runtime        │
│  • HITL approval │       │  • Stores results │       │  • Tool execution       │
│  • Displays data │       │  • Auth/tenant    │       │  • Knowledge base / RAG │
│                  │       │    context        │       │  • Multi-provider       │
└──────────────────┘       └──────────────────┘       │    routing              │
                                                       │  • Streaming responses  │
                                                       └─────────────────────────┘
```

### Key Principle

**The frontend is a consumer, not an orchestrator.** It sends requests to the backend, which either handles them directly or proxies them to the external AI services. The frontend never:
- Holds LLM API keys
- Routes between LLM providers
- Manages conversation context/memory
- Executes agent tools
- Calls embedding or vector search APIs

All of that happens externally. The frontend simply renders what it receives.

## How the Frontend Interacts with AI

### Chat

The frontend's chat panel calls **backend endpoints** that proxy to the external AI service:

```typescript
// Frontend: useChatStore action
async sendMessage(conversationId: string, message: string) {
  // Calls the backend API — NOT an LLM provider directly
  const response = await apiClient.post('/api/v1/platform/chat/messages', {
    conversationId,
    content: message,
    moduleContext: activeModule?.slug,  // tells AI service which module is active
  })

  // For streaming responses, connect to SSE endpoint
  const eventSource = new EventSource(
    `/api/v1/platform/chat/stream?conversationId=${conversationId}`
  )
  eventSource.onmessage = (event) => {
    const chunk = JSON.parse(event.data)
    appendStreamToken(conversationId, chunk.token)
  }
}
```

### Agent Runs

The frontend triggers agent runs via the backend and polls/subscribes for status:

```typescript
// Frontend: trigger an agent run
async triggerAgent(agentId: string, input: Record<string, unknown>) {
  // Backend creates the run and dispatches to external AI service
  const run = await apiClient.post('/api/v1/platform/agents/runs', {
    agentId,
    input,
  })
  return run  // { id, status: 'pending', ... }
}

// Frontend: subscribe to run updates via WebSocket
socket.on(`agent:run:${runId}`, (update) => {
  // update: { status, currentStep, output, hitlRequired, ... }
  updateRun(runId, update)
})
```

### HITL (Human-in-the-Loop) Approval

When the external AI service needs human approval for a tool action, it pauses the run and the backend notifies the frontend:

```typescript
// Frontend receives HITL request via WebSocket
socket.on(`agent:hitl:${runId}`, (hitlRequest) => {
  // hitlRequest: { toolName, parameters, description, timeout }
  showApprovalDialog(hitlRequest)
})

// User approves or rejects
async respondToHITL(runId: string, approved: boolean, reason?: string) {
  await apiClient.post(`/api/v1/platform/agents/runs/${runId}/hitl`, {
    approved,
    reason,
  })
}
```

### AI-Assisted Features (Per Module)

Module-specific AI features (e.g., "generate meeting brief", "draft IPS", "evaluate deal") are triggered via standard backend API calls. The backend delegates to the external AI service internally:

```typescript
// Example: Generate a meeting brief in Engage
const brief = await apiClient.post(`/api/v1/engage/meetings/${meetingId}/generate-brief`)
// Returns: { summary, keyPoints, suggestedActions, ... }

// Example: Draft an IPS in Plan
const ips = await apiClient.post(`/api/v1/plan/clients/${clientId}/generate-ips`, {
  planId,
  riskProfileId,
})
// Returns: { content, sections, ... }

// Example: Screen a deal in Deals
const screening = await apiClient.post(`/api/v1/deals/${dealId}/ai-screen`)
// Returns: { score, criteria, recommendation, rationale }
```

The frontend doesn't know or care that these endpoints use AI internally — they're just API calls that return structured data.

## Backend's Role (Core API Server)

The core FastAPI backend acts as a **proxy and persistence layer** between the frontend and the external AI services:

### What the backend does:
- **Authenticates and authorizes** AI requests (JWT + RBAC)
- **Injects tenant and module context** into AI service calls
- **Proxies chat and agent requests** to the external AI service
- **Stores results** in the database (conversations, messages, agent runs, generated documents)
- **Streams responses** from the AI service back to the frontend via SSE/WebSocket
- **Manages HITL state** — tracks pending approvals, enforces timeouts
- **Tracks usage** — logs token consumption per user/tenant for billing

### What the backend does NOT do:
- Call LLM providers directly (no Anthropic SDK, no OpenAI SDK in the core backend)
- Manage agent tool definitions or execution
- Handle RAG / knowledge base retrieval
- Route between LLM providers

### Backend AI Proxy Endpoints

```python
# server/app/platform/ai/router.py

@router.post("/chat/messages")
async def send_chat_message(
    data: ChatMessageRequest,
    user = Depends(get_current_user),
    db = Depends(get_db),
):
    """Proxy chat message to external AI service, store result."""
    # 1. Store user message in DB
    await chat_repo.save_message(user.tenant_id, data.conversation_id, data)

    # 2. Forward to external AI service with context
    ai_response = await ai_service_client.chat(
        conversation_id=data.conversation_id,
        message=data.content,
        tenant_id=user.tenant_id,
        module_context=data.module_context,
    )

    # 3. Store AI response in DB
    await chat_repo.save_message(user.tenant_id, data.conversation_id, ai_response)

    return ai_response


@router.get("/chat/stream")
async def stream_chat_response(
    conversation_id: str,
    user = Depends(get_current_user),
):
    """SSE endpoint — streams tokens from external AI service to frontend."""
    async def event_generator():
        async for chunk in ai_service_client.chat_stream(conversation_id):
            yield f"data: {json.dumps(chunk)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/agents/runs")
async def create_agent_run(
    data: AgentRunRequest,
    user = Depends(get_current_user),
    db = Depends(get_db),
):
    """Trigger an agent run via external AI service."""
    run = await agent_repo.create_run(user.tenant_id, data)
    await ai_service_client.trigger_agent(run.id, data.agent_id, data.input)
    return run
```

### AI Service Client

A thin HTTP client that communicates with the external AI service:

```python
# server/app/platform/ai/client.py

class AIServiceClient:
    """HTTP client for the external AI service."""

    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key
        self.http = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=60.0,
        )

    async def chat(self, conversation_id: str, message: str, **context) -> dict:
        response = await self.http.post("/chat", json={
            "conversation_id": conversation_id,
            "message": message,
            **context,
        })
        return response.json()

    async def chat_stream(self, conversation_id: str):
        async with self.http.stream("GET", f"/chat/stream/{conversation_id}") as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    yield json.loads(line[6:])

    async def trigger_agent(self, run_id: str, agent_id: str, input: dict):
        await self.http.post("/agents/run", json={
            "run_id": run_id,
            "agent_id": agent_id,
            "input": input,
        })
```

## External AI Service (Out of Scope)

The external AI service is a **separate system** — it is not part of this repository. It handles:

- **LLM provider routing** — Anthropic Claude, Azure OpenAI, OpenRouter, etc.
- **Agent runtime** — agent definitions, tool calling, step execution, multi-turn reasoning
- **Knowledge base / RAG** — embedding, vector search, document retrieval
- **Tool execution** — web search (Tavily), data lookups, calculations
- **Conversation memory** — context window management, summarization
- **HITL coordination** — pausing runs, waiting for approval callbacks

The core backend communicates with it via HTTP/REST. Connection details:

```python
# server/app/config.py
class Settings(BaseSettings):
    ai_service_url: str          # e.g., "https://ai.invictus.ai" or internal URL
    ai_service_api_key: str      # Service-to-service auth key
```

The AI service is developed and deployed independently. Its architecture, provider choices, and internal implementation are outside the scope of this repo's architecture docs.

## Frontend Environment Variables

The frontend has **no LLM API keys**. AI-related env vars are limited to:

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Backend API URL (AI requests go through the backend) |
| `VITE_WS_URL` | WebSocket URL (for real-time agent/chat updates) |

That's it. No `VITE_ANTHROPIC_API_KEY`, no `VITE_OPENROUTER_API_KEY`. The frontend talks only to the backend.

## Data Flow Summary

### Chat Message Flow

```
1. User types message in ChatPanel
2. Frontend: POST /api/v1/platform/chat/messages { content, conversationId, moduleContext }
3. Backend: stores user message → forwards to External AI Service
4. External AI Service: processes with LLM, returns response (or streams it)
5. Backend: stores AI response → streams to frontend via SSE
6. Frontend: renders streamed tokens in ChatMessage component
```

### Agent Run Flow

```
1. User triggers agent (or scheduled trigger fires)
2. Frontend/Backend: POST /api/v1/platform/agents/runs { agentId, input }
3. Backend: creates run record → dispatches to External AI Service
4. External AI Service: executes agent steps (LLM calls, tool use)
5. External AI Service → Backend: sends step updates via webhook/callback
6. Backend → Frontend: pushes updates via WebSocket
7. If HITL required: Backend pauses, frontend shows approval dialog
8. User approves → Backend → External AI Service resumes
9. Run completes → Backend stores output → Frontend renders result
```

### Module AI Feature Flow

```
1. User clicks "Generate Brief" in Engage meeting page
2. Frontend: POST /api/v1/engage/meetings/:id/generate-brief
3. Backend: calls External AI Service with meeting context + client data
4. External AI Service: uses RAG + LLM to generate brief
5. Backend: stores generated brief → returns to frontend
6. Frontend: renders the brief in the UI
```

## AI Features Per Module

These are exposed as standard API endpoints. The frontend calls them like any other backend endpoint — no special AI handling needed on the frontend side.

### Engage (CRM AI)

| Feature | Endpoint | Returns |
|---------|----------|---------|
| Prospect Research | `POST /engage/prospects/:id/ai-research` | Background info, net worth estimate, interests |
| Meeting Brief | `POST /engage/meetings/:id/generate-brief` | Prep brief from client history + market data |
| Interaction Summary | `POST /engage/interactions/:id/summarize` | Structured summary of call/meeting notes |
| Next Best Action | `GET /engage/clients/:id/next-actions` | Suggested engagement actions |
| Email Draft | `POST /engage/communications/draft` | AI-drafted client email |

### Plan (Planning AI)

| Feature | Endpoint | Returns |
|---------|----------|---------|
| Risk Analysis | `POST /plan/clients/:id/analyze-risk` | Risk category from IPQ responses |
| Plan Generation | `POST /plan/clients/:id/generate-plan` | Draft financial plan |
| IPS Draft | `POST /plan/clients/:id/generate-ips` | Investment Policy Statement draft |
| Goal Scenarios | `POST /plan/goals/:id/scenarios` | Monte Carlo simulation results |

### Deals (Deal AI)

| Feature | Endpoint | Returns |
|---------|----------|---------|
| Deal Screening | `POST /deals/:id/ai-screen` | Score, criteria evaluation, recommendation |
| Due Diligence | `POST /deals/:id/extract-dd` | Key data points from deal documents |
| Suitability Match | `POST /deals/:id/match-clients` | Clients matching deal's risk/return profile |
| Deal Memo | `POST /deals/:id/generate-memo` | Auto-generated deal memo |

### Insights (Analytics AI)

| Feature | Endpoint | Returns |
|---------|----------|---------|
| Natural Language Query | `POST /insights/query` | Query results from data in natural language |
| Anomaly Detection | `GET /insights/anomalies` | Flagged unusual portfolio changes |
| Report Narration | `POST /insights/reports/:id/narrate` | Narrative explanation of report data |

### Tools & Communication (Productivity AI)

| Feature | Endpoint | Returns |
|---------|----------|---------|
| Smart Task Creation | `POST /tools/tasks/ai-suggest` | Suggested tasks from recent activity |
| Action Item Extraction | `POST /tools/meetings/:id/extract-actions` | Action items from meeting notes |
| Communication Template | `POST /tools/communications/generate` | Personalized client communication |

## Chat Context Awareness

The chat service is module-aware. When the frontend sends a message, it includes the active module context so the external AI service can scope its responses appropriately:

```typescript
// Frontend sends module context with every chat message
{
  conversationId: "conv-123",
  content: "Show me clients with AUM over $5M",
  moduleContext: "engage",           // Currently in Engage module
  entityContext: {                    // Optional: what the user is looking at
    type: "client",
    id: "client-456",
  }
}
```

The backend forwards this context to the external AI service, which uses it to select the right knowledge base, tools, and system prompt.

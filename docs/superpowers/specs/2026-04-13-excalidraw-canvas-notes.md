# Excalidraw Canvas Notes — Design Spec

## Overview

Replace the Tiptap rich text editor for notes with a full Excalidraw whiteboard canvas. Notes in the workspace sidebar open an interactive drawing surface where analysts can brainstorm visually — mind maps, sticky notes, diagrams, freehand sketches. Deliverable documents continue using the Tiptap editor.

## Architecture

- **New component:** `CanvasPanel.tsx` wraps `@excalidraw/excalidraw` React component
- **Data storage:** Excalidraw scene JSON serialized as string in `Document.content` field
- **Rendering logic:** `OpportunityWorkspacePage` renders `CanvasPanel` when `activeTab.type === 'note'`, `DocumentPanel` when `activeTab.type === 'document'`
- **No backend changes:** Notes are already `Document` entities with `documentType: 'note'`. Existing CRUD API and mock handlers handle them.

## Component: CanvasPanel

**File:** `client/src/modules/deals/components/workspace/CanvasPanel.tsx`

**Props:**
```typescript
interface CanvasPanelProps {
  document: Document
  opportunityId: string
  onUpdate: (doc: Document) => void
}
```

**Behavior:**
- On mount: parse `document.content` as JSON → pass to Excalidraw as `initialData`
- If `document.content` is null/empty: Excalidraw starts with blank canvas
- On every Excalidraw `onChange`: debounce 2 seconds, serialize scene elements + appState to JSON string, save via `dealsApi.updateDocument(opportunityId, docId, { content: jsonString })`
- Display document name and "Draft" badge in a small header above the canvas
- Inline rename on click (same pattern as DocumentPanel)
- Save status indicator: "Saving..." / "Saved"
- Canvas fills entire remaining height (`flex-1`)

**Excalidraw configuration:**
- Theme: match app theme (light/dark)
- Full toolbar visible (Excalidraw's built-in tools: select, shapes, arrows, text, freehand draw, eraser, image)
- Grid mode off by default
- Collaboration features disabled (single-user)
- `viewModeEnabled` set to `true` when document status is `approved` (read-only)

**Undo/Redo:**
- Excalidraw has built-in undo/redo
- Header undo/redo buttons should be DISABLED when a canvas note tab is active (to avoid conflict)
- Excalidraw's own Ctrl+Z/Ctrl+Shift+Z works within the canvas

## Page Changes

**File:** `client/src/modules/deals/pages/OpportunityWorkspacePage.tsx`

Current rendering logic:
```tsx
{(activeTab?.type === 'document' || activeTab?.type === 'note') && activeDocument && (
  <DocumentPanel ... />
)}
```

New logic — split document and note rendering:
```tsx
{activeTab?.type === 'document' && activeDocument && (
  <DocumentPanel ... />
)}
{activeTab?.type === 'note' && activeDocument && (
  <CanvasPanel ... />
)}
```

Header undo/redo buttons: disable when `activeTab?.type === 'note'`.

## Tab Icon

**File:** `client/src/modules/deals/components/workspace/WorkspaceContentTabs.tsx`

Change note tab icon from `StickyNote` to `Palette` (from lucide-react) to indicate canvas/drawing mode.

## Mock Data

Existing mock notes (`doc-note-1`, `doc-note-2`) currently have HTML content. Update them to have Excalidraw-compatible JSON content (a basic scene with a few elements) so the canvas renders with sample content on load.

## Dependencies

Install: `@excalidraw/excalidraw` (MIT, ~2MB)

## What Stays the Same

- Sidebar note listing and creation
- Document API, mock handlers, store actions
- Share/validation dialogs (notes can still be included as documents)
- Source file viewer, snapshot panel
- Deliverable documents use Tiptap (unchanged)

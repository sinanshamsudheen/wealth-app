# 03 — Frontend Architecture

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5.9 | Type safety |
| Vite | 8 | Build tool & dev server |
| pnpm | 10.15 | Package manager |
| Zustand | 5 | State management |
| shadcn/ui | latest | Component library (base-nova style) |
| Tailwind CSS | 4.2 | Utility-first styling |
| React Router | 7 | Client-side routing |
| MSW | 2 | API mocking (dev mode) |
| Recharts | latest | Data visualization |
| Lucide React | latest | Icons |
| Motion (Framer Motion) | 12+ | Animation library (to be added) |

---

## Design System & Visual Identity

### Design Philosophy

Invictus AI is a **premium wealth management platform** used by financial advisors managing billions in assets. The interface must project **trust, precision, and intelligence** — it should feel like a Bloomberg terminal crossed with a luxury fintech product. Every visual choice should reinforce that this is a professional tool for serious financial work, enhanced by AI.

**Design pillars:**
1. **Authority** — Clean, confident layouts with strong visual hierarchy. Data-dense without feeling cluttered.
2. **Precision** — Pixel-perfect alignment, consistent spacing, meticulous typography. Financial professionals notice details.
3. **Intelligence** — AI features should feel ambient and integrated, not bolted-on. Subtle glows, streaming animations, and contextual surfaces.
4. **Warmth** — Despite being data-heavy, the platform should feel approachable. Rounded corners, smooth transitions, and human-readable formatting.

### Typography

**Current:** Geist Variable (sans-serif) as the sole font family.

**Target dual-font system:**

| Role | Font | Weight Range | Usage |
|------|------|-------------|-------|
| **Display / Headings** | A distinctive display font (e.g., Satoshi, Plus Jakarta Sans, General Sans, or a premium serif like Fraunces) | 500–800 | Page titles, module names, hero numbers, AUM figures |
| **Body / UI** | Geist Variable (current) | 300–600 | Body text, labels, form inputs, table data, navigation |
| **Monospace / Data** | Geist Mono or JetBrains Mono | 400–500 | Financial figures, IDs, code blocks, timestamps |

**Typography scale (rem):**

```
--text-xs:    0.75rem / 1rem      # Badges, captions, timestamps
--text-sm:    0.875rem / 1.25rem  # Secondary labels, table cells
--text-base:  1rem / 1.5rem       # Body text, form inputs
--text-lg:    1.125rem / 1.75rem  # Section headers, card titles
--text-xl:    1.25rem / 1.75rem   # Page subtitles
--text-2xl:   1.5rem / 2rem       # Page titles
--text-3xl:   1.875rem / 2.25rem  # Hero numbers, AUM displays
--text-4xl:   2.25rem / 2.5rem    # Dashboard hero metrics
```

**Rules:**
- Financial figures (AUM, returns, deal sizes) use **tabular numerals** (`font-variant-numeric: tabular-nums`) for column alignment
- Percentages and currency use the monospace font at display sizes for precision
- Never use font sizes below `0.6875rem` (11px) — financial data must be readable

### Color System

The current theme uses a neutral achromatic OKLCH palette. This should be extended with a **brand accent** and **module-specific accent colors** while keeping the base neutral.

**Brand palette (target):**

```css
:root {
  /* Brand accent — deep navy/indigo for trust and authority */
  --brand-primary: oklch(0.35 0.12 260);        /* Deep navy */
  --brand-primary-light: oklch(0.55 0.15 260);   /* Lighter navy */
  --brand-primary-subtle: oklch(0.95 0.02 260);   /* Very subtle wash */

  /* Semantic status colors — financial context */
  --status-positive: oklch(0.65 0.18 155);        /* Gains / up / success */
  --status-negative: oklch(0.55 0.22 25);         /* Losses / down / error */
  --status-warning: oklch(0.75 0.15 75);          /* Alerts / caution */
  --status-info: oklch(0.60 0.15 250);            /* Informational */

  /* Module accent colors (match existing ModulesHomePage) */
  --module-engage: oklch(0.65 0.18 155);          /* Emerald */
  --module-plan: oklch(0.55 0.18 260);            /* Blue */
  --module-tools: oklch(0.55 0.18 290);           /* Violet */
  --module-deals: oklch(0.70 0.15 80);            /* Amber */
  --module-insights: oklch(0.65 0.18 45);         /* Orange */
  --module-admin: oklch(0.55 0.02 260);           /* Slate */
}
```

**Rules:**
- Positive/negative colors are **never** red/green alone — always paired with icons (↑↓) or labels for color-blind accessibility
- Module accent colors are used sparingly: sidebar active indicator, module header accent, badge backgrounds
- The base neutral palette remains dominant — accents are punctuation, not wallpaper
- Dark mode inverts lightness but preserves accent hues

### Elevation & Depth

Define a consistent shadow/elevation system rather than ad-hoc `shadow-sm`:

```css
--shadow-xs: 0 1px 2px oklch(0 0 0 / 0.04);                          /* Inline elements */
--shadow-sm: 0 1px 3px oklch(0 0 0 / 0.06), 0 1px 2px oklch(0 0 0 / 0.04);  /* Cards */
--shadow-md: 0 4px 6px oklch(0 0 0 / 0.06), 0 2px 4px oklch(0 0 0 / 0.04);  /* Raised cards, dropdowns */
--shadow-lg: 0 10px 15px oklch(0 0 0 / 0.08), 0 4px 6px oklch(0 0 0 / 0.04); /* Modals, popovers */
--shadow-xl: 0 20px 25px oklch(0 0 0 / 0.10), 0 8px 10px oklch(0 0 0 / 0.04); /* Floating panels */
```

**Usage:**
- Level 0: Flush with background (table rows, inline elements)
- Level 1 (`shadow-xs`): Subtle lift (input fields, tags)
- Level 2 (`shadow-sm`): Cards, sidebar items
- Level 3 (`shadow-md`): Dropdowns, tooltips, hover cards
- Level 4 (`shadow-lg`): Dialogs, modal overlays
- Level 5 (`shadow-xl`): The AI chat panel, floating action panels

### Spacing & Layout Grid

**Base unit:** 4px (`0.25rem`). All spacing derives from multiples of 4.

```
--space-1:  0.25rem    (4px)
--space-2:  0.5rem     (8px)
--space-3:  0.75rem    (12px)
--space-4:  1rem       (16px)
--space-5:  1.25rem    (20px)
--space-6:  1.5rem     (24px)
--space-8:  2rem       (32px)
--space-10: 2.5rem     (40px)
--space-12: 3rem       (48px)
--space-16: 4rem       (64px)
```

**Page layout constants:**

| Token | Value | Usage |
|-------|-------|-------|
| `--sidebar-width` | 260px | Expanded sidebar |
| `--sidebar-collapsed` | 64px | Icon-only sidebar |
| `--topnav-height` | 56px | Top navigation bar |
| `--right-panel-width` | 380px | Chat / task panel |
| `--page-padding` | 24px (desktop), 16px (mobile) | Content area padding |
| `--max-content-width` | 1400px | Maximum content width for readability |

### Motion & Animation

**Library:** Add `motion` (Framer Motion v12+) for orchestrated animations. Use CSS transitions for simple hover/focus states.

**Animation principles:**
- **Fast is respectful** — transitions should feel instant but smooth. Most under 200ms.
- **Stagger for hierarchy** — list items and dashboard cards animate in with 30-50ms stagger delays
- **Meaningful motion** — elements enter from where they conceptually come from (sidebar items slide from left, modals scale from center)
- **Reduce motion** — all animations respect `prefers-reduced-motion` via `motion`'s built-in support

**Standard timing tokens:**

```css
--duration-instant: 100ms;   /* Hover states, focus rings */
--duration-fast: 150ms;      /* Button presses, toggles */
--duration-normal: 200ms;    /* Panel open/close, dropdown reveal */
--duration-slow: 300ms;      /* Page transitions, modal enter */
--duration-deliberate: 500ms; /* Complex orchestrated sequences */

--ease-out: cubic-bezier(0.16, 1, 0.3, 1);         /* Enter/appear */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);     /* Move/reposition */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* Playful bounce */
```

**Key animation patterns:**

| Pattern | Where Used | Implementation |
|---------|-----------|----------------|
| **Staggered fade-in** | Dashboard cards, table rows, module grid | `motion` with `staggerChildren: 0.04` |
| **Slide + fade** | Sidebar navigation, dropdown menus | `motion` `initial={{ x: -8, opacity: 0 }}` |
| **Scale pop** | Notification badges, status indicators | CSS `transform: scale()` with spring ease |
| **Streaming text** | AI chat responses | Character-by-character with cursor animation |
| **Number ticker** | AUM, portfolio value, deal sizes | Animated counting with `motion`'s `useSpring` |
| **Skeleton shimmer** | Loading states for all data views | CSS gradient animation on placeholder shapes |
| **3D flip** | Module cards on homepage (existing) | CSS `transform: rotateY()` with `preserve-3d` |

### Data Visualization Standards

**Chart library:** Recharts (current). Consider adding `@visx/visx` for custom financial visualizations in the future.

**Chart color palette (sequential, accessible):**

```css
--chart-1: oklch(0.55 0.18 260);   /* Primary series (navy) */
--chart-2: oklch(0.65 0.18 155);   /* Secondary series (emerald) */
--chart-3: oklch(0.70 0.15 80);    /* Tertiary series (amber) */
--chart-4: oklch(0.55 0.18 290);   /* Quaternary series (violet) */
--chart-5: oklch(0.65 0.18 45);    /* Quinary series (orange) */
```

**Chart rules:**
- All charts include a legend when more than 1 series
- Tooltips show formatted currency/percentage values with proper locale
- Line charts use `strokeWidth: 2` with subtle gradient fills beneath
- Bar charts use `radius: [4, 4, 0, 0]` for rounded top corners
- Empty states show a custom illustration, never a blank chart area
- Charts animate on initial render (1 series at a time, left to right)

### Shared Component Patterns

#### Financial Data Display

```tsx
// Standard pattern for displaying financial values
<MetricCard
  label="Total AUM"
  value={4250000000}
  format="currency"           // Formats as $4.25B
  change={13.8}               // Percentage change
  changeDirection="up"         // Shows green ↑ indicator
  sparkline={last30Days}       // Optional mini chart
/>
```

Financial values follow these formatting rules:
- Amounts > $1B: `$X.XXB` (e.g., $4.25B)
- Amounts > $1M: `$X.XXM` (e.g., $12.50M)
- Amounts > $1K: `$X.XXK` (e.g., $850.00K)
- Below $1K: Full value with 2 decimals
- Percentages: Always show sign (`+13.8%`, `-2.1%`)
- Use `Intl.NumberFormat` for locale-aware formatting

#### Status Indicators

Consistent status patterns across all modules:

```
Active / Connected / Funded    → Emerald dot + label
Pending / Draft / Proposed     → Amber dot + label
Inactive / Failed / Cancelled  → Red dot + label
Archived / Paused / Closed     → Gray dot + label
```

Each status indicator is a dot (8px circle) + text label. Never rely on color alone.

#### Empty States

Every list, table, and dashboard section has a designed empty state:
- Relevant illustration or icon (not a generic empty box)
- Clear headline explaining what will appear here
- Action button to create the first item (when applicable)
- Subtle background pattern to fill visual space

#### Loading States

Three tiers of loading feedback:
1. **Skeleton screens** — for page-level data loading (matches the layout shape of real content)
2. **Inline spinners** — for button actions and form submissions (small, within the triggering element)
3. **Progress indicators** — for multi-step operations (agent runs, report generation) with step labels

Never use full-page spinners. Content should appear progressively.

---

## Module Registry & Lazy Loading

### Module Registry

The module registry (`client/src/modules/registry.ts`) is the single source of truth for all module metadata. It replaces the duplicated `MODULES` arrays currently in `ModulesHomePage.tsx` and `ModuleSwitcher.tsx`.

```typescript
export interface ModuleDefinition {
  id: string
  name: string
  slug: string
  description: string
  icon: LucideIcon
  basePath: string
  requiredPermissions: string[]
  lazyRoot: () => Promise<{ default: React.ComponentType }>
  status: 'active' | 'planned' | 'beta'
  color: {
    text: string       // Tailwind text color class
    bg: string         // Tailwind background class
    border: string     // Tailwind border class
    badge: string      // Tailwind badge background class
    accent: string     // CSS variable name (e.g., '--module-engage')
  }
  sidebarNav: SidebarNavItem[]  // Module-specific sidebar navigation
}
```

### Lazy Loading

Each module's root component is lazy-loaded via `React.lazy()`. Vite automatically code-splits at dynamic `import()` boundaries, so each module becomes its own chunk.

```typescript
// In App.tsx
{MODULE_REGISTRY.map(mod => (
  <Route
    key={mod.id}
    path={`${mod.slug}/*`}
    element={
      <ModuleGuard permissions={mod.requiredPermissions}>
        <Suspense fallback={<ModuleLoadingSkeleton module={mod} />}>
          <LazyModuleRoot loader={mod.lazyRoot} />
        </Suspense>
      </ModuleGuard>
    }
  />
))}
```

**Note:** The `Suspense` fallback should be a skeleton screen that matches the module's layout shape, not a generic spinner. `ModuleLoadingSkeleton` renders a sidebar skeleton + content area skeleton using the module's accent color.

### Module Route Definition

Each module exports its own route tree in `routes.tsx`:

```typescript
// client/src/modules/engage/routes.tsx
import { Routes, Route } from 'react-router-dom'

export default function EngageRoutes() {
  return (
    <Routes>
      <Route index element={<EngageDashboard />} />
      <Route path="clients" element={<ClientList />} />
      <Route path="clients/:clientId" element={<ClientDetail />} />
      <Route path="prospects" element={<ProspectList />} />
      <Route path="prospects/:prospectId" element={<ProspectDetail />} />
    </Routes>
  )
}
```

---

## Module-Scoped Organization

### Components
Each module owns its components in `modules/<slug>/components/`. Components are not shared across modules — shared components go in `shared/components/` or `shared/ui/`.

### State (Zustand Stores)
Each module owns its Zustand store(s) in `modules/<slug>/store/`:
- Module stores manage module-specific state only
- Global stores (`useAuthStore`, `useThemeStore`) live in `client/src/store/`
- Platform stores (`useChatStore`, `useAgentStore`) live in `platform/*/store/`
- A module **never** reads another module's store directly

### API Layer
Each module defines its own API client functions and MSW handlers in `modules/<slug>/api/`:
- Uses the shared fetch wrapper from `shared/api/client.ts` (handles auth token injection)
- MSW mock handlers are co-located with the module for dev/test scenarios

### Types
Module-specific TypeScript types live in `modules/<slug>/types/`. Cross-module shared types (e.g., `Client`, `Deal`) live in `shared/types/`.

---

## Import Boundary Rules

```
✅ modules/engage/ → shared/         (any module can import shared code)
✅ modules/engage/ → platform/       (any module can use platform features)
✅ modules/engage/ → store/          (global stores like auth, theme)
❌ modules/engage/ → modules/deals/  (NO cross-module imports)
❌ modules/engage/ → modules/plan/   (NO cross-module imports)
```

These rules are enforced by:
1. **Convention** — documented here and in code reviews
2. **ESLint** — `eslint-plugin-boundaries` (to be configured) for automated enforcement

---

## Shared Code Organization

```
client/src/shared/
├── components/     # ErrorBoundary, EmptyState, LoadingScreen, DataTable,
│                   # MetricCard, StatusBadge, SkeletonLoader, etc.
├── ui/             # shadcn/ui primitives (Button, Card, Dialog, etc.)
├── hooks/          # usePolling, usePermission, useModuleContext, useDebounce,
│                   # useFormatCurrency, useAnimateNumber
├── lib/            # cn() utility, constants, formatters (currency, date, percentage)
├── types/          # Cross-module types (Client, User, Pagination, ApiResponse)
└── api/            # Shared API client (client.ts with auth token injection)
```

---

## Platform Features

Cross-cutting features that aren't module-specific live in `platform/`:

```
client/src/platform/
├── chat/           # AI chat UI (ChatInput, ChatMessage, ChatPanel, useChatStore)
├── agents/         # Agent run UI (AgentCard, AgentGrid, useAgentStore, useRunStore)
└── notifications/  # Toast/notification system
```

These are available to all modules and render in the global layout (AppShell).

**Important:** The chat and agent UIs are purely **frontend consumers** — they call backend API endpoints which proxy to an external AI service. The frontend does not hold any LLM API keys, does not route between LLM providers, and does not manage AI conversation context. It sends messages to `/api/v1/platform/chat/*` and renders the streamed responses. See [12-ai-integration.md](12-ai-integration.md) for the full architecture.

---

## Responsive Design

### Breakpoints

```
sm:   640px    # Small tablets
md:   768px    # Tablets
lg:   1024px   # Small desktops (sidebar collapses below this)
xl:   1280px   # Standard desktops
2xl:  1536px   # Large desktops (right panel always visible above this)
```

### Responsive behavior

| Viewport | Sidebar | Right Panel | Layout |
|----------|---------|-------------|--------|
| < 768px | Hidden (hamburger toggle) | Hidden (sheet overlay) | Single column |
| 768–1024px | Collapsed (icon-only) | Hidden (sheet overlay) | Main content full width |
| 1024–1280px | Expanded | Hidden (toggle button) | Main content full width |
| > 1280px | Expanded | Visible (if open) | Three-column layout |

### Touch considerations
- Minimum tap target: 44×44px on mobile
- Swipe gestures for sidebar toggle on tablet
- No hover-only interactions — all hover states have tap equivalents

---

## Accessibility

| Concern | Implementation |
|---------|---------------|
| **Color contrast** | All text meets WCAG AA (4.5:1 for normal text, 3:1 for large text) |
| **Color independence** | Status never conveyed by color alone — always paired with icon or label |
| **Keyboard navigation** | Full keyboard nav for all interactive elements; visible focus rings |
| **Screen readers** | ARIA labels on icon-only buttons; `aria-live` for dynamic content; semantic HTML |
| **Reduced motion** | All animations respect `prefers-reduced-motion`; `motion` handles this natively |
| **Focus management** | Focus trapped in modals/dialogs; focus restored on close |
| **Form accessibility** | All inputs have visible labels (no placeholder-only labels) |

---

## Performance Budget

| Metric | Target | Measurement |
|--------|--------|-------------|
| **First Contentful Paint** | < 1.5s | Lighthouse |
| **Largest Contentful Paint** | < 2.5s | Lighthouse |
| **Cumulative Layout Shift** | < 0.1 | Lighthouse |
| **Initial JS bundle** | < 200KB gzip | Vite build output |
| **Per-module chunk** | < 80KB gzip | Vite code-splitting |
| **Total CSS** | < 50KB gzip | Tailwind purge |

**Strategies:**
- Lazy-load module routes (Vite automatic code-splitting at `import()` boundaries)
- Tree-shake unused shadcn/ui components (only import what's used)
- Use `Suspense` boundaries per module for progressive loading
- Optimize images with `loading="lazy"` and `srcset`
- Prefetch adjacent module chunks on hover over module cards

---

## Conventions

- **Named exports** using function declarations: `export function ComponentName() {}`
- **PascalCase filenames** matching component name
- **Props interfaces** defined above the component: `interface ComponentNameProps { ... }`
- **Tailwind** classes composed via `cn()` from `shared/lib/utils`
- **Path alias**: `@` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`)
- **No Prettier** — ESLint handles formatting via flat config
- **Component co-location**: tests, stories, and module-specific types live alongside the component
- **No inline styles** — use Tailwind utilities or CSS variables; exception: dynamic values from data (chart dimensions, progress bars)

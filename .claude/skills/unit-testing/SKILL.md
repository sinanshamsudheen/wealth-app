---
name: unit-testing
description: Generate unit and component tests for the React/TypeScript frontend. Use when writing new code, modifying existing components, or completing a feature — to ensure test coverage is created alongside the implementation.
---

## Unit Testing Skill

This skill generates tests for React components, Zustand stores, custom hooks, and utility functions.

### When to Trigger

- After writing or modifying a React component, hook, or store
- When the user asks for tests or says "test this"
- After completing a feature or bugfix (before commit)
- When reviewing code that lacks test coverage

### Test Framework & Setup

**Framework:** Vitest + React Testing Library + jsdom

> **Note:** If the test framework is not yet installed, guide the user through setup first (see Setup section below).

#### Setup (one-time)

If `vitest` is not in `client/package.json`:

```bash
cd client
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
```

Create `client/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
```

Create `client/src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom/vitest'
```

Add to `client/package.json` scripts:
```json
{
  "test": "vitest run",
  "test:watch": "vitest"
}
```

### Test Conventions

- **Test location:** Colocated `__tests__/` directories next to source files, or `src/test/` for integration tests
  - Source: `components/agents/AgentCard.tsx` → Test: `components/agents/__tests__/AgentCard.test.tsx`
  - Source: `store/useAuthStore.ts` → Test: `store/__tests__/useAuthStore.test.ts`
  - Source: `hooks/usePolling.ts` → Test: `hooks/__tests__/usePolling.test.ts`
  - Source: `lib/utils.ts` → Test: `lib/__tests__/utils.test.ts`
- **File naming:** `<ComponentName>.test.tsx` or `<moduleName>.test.ts`
- **Test naming:** `describe('<ComponentName>')` with `it('should ...')` pattern

### Test Structure

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { AgentCard } from '../AgentCard'

describe('AgentCard', () => {
  it('should render the agent name', () => {
    render(<AgentCard name="Deal Research" status="active" />)
    expect(screen.getByText('Deal Research')).toBeInTheDocument()
  })

  it('should show status badge', () => {
    render(<AgentCard name="Deal Research" status="running" />)
    expect(screen.getByText('running')).toBeInTheDocument()
  })

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<AgentCard name="Deal Research" status="active" onClick={onClick} />)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
```

### What to Test

#### Components
- Renders correctly with required props
- Conditional rendering (loading states, empty states, error states)
- User interactions (clicks, form inputs, navigation)
- Accessibility: correct roles, labels, aria attributes

#### Zustand Stores
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../useAuthStore'

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState(useAuthStore.getInitialState())
  })

  it('should start with no user', () => {
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('should set user on login', () => {
    useAuthStore.getState().login('test@example.com')
    expect(useAuthStore.getState().user).toBeDefined()
  })
})
```

#### Custom Hooks
```typescript
import { renderHook, act } from '@testing-library/react'
import { usePolling } from '../usePolling'

describe('usePolling', () => {
  it('should call callback at interval', () => {
    vi.useFakeTimers()
    const callback = vi.fn()
    renderHook(() => usePolling(callback, 1000))
    vi.advanceTimersByTime(3000)
    expect(callback).toHaveBeenCalledTimes(3)
    vi.useRealTimers()
  })
})
```

#### Utility Functions
```typescript
import { cn } from '../utils'

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('should handle conditional classes', () => {
    expect(cn('base', false && 'hidden')).toBe('base')
  })
})
```

### Mocking Patterns

- **API calls:** Use MSW handlers already in `src/api/mock/` — add new handlers for test-specific scenarios
- **Modules:** `vi.mock('@/api/client')` to mock the fetch wrapper
- **Router:** Wrap components in `<MemoryRouter>` from `react-router-dom` when testing components that use routing
- **Zustand stores:** Call `useStore.setState()` directly in tests to set initial state

### What NOT to Test

- shadcn/ui component internals (they are pre-tested)
- Third-party library behavior (Recharts rendering details, React Router internals)
- Implementation details (internal state, private functions)
- Tautological tests that just mirror the implementation

### Running Tests

```bash
cd client
pnpm exec vitest run              # Single run
pnpm exec vitest                  # Watch mode
pnpm exec vitest run --coverage   # With coverage
pnpm exec vitest run src/components/agents  # Specific directory
```

### Behavior

When this skill activates:

1. **Check if vitest is installed:** Look in `client/package.json` devDependencies. If not, run setup first.
2. **Identify what changed:** Look at the components/hooks/stores that were written or modified
3. **Check for existing tests:** Look for colocated `__tests__/` directory — update existing tests if the interface changed
4. **Generate tests:** Create or update test files with comprehensive test cases
5. **Report:** Tell the user what tests were created and how to run them

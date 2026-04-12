---
description: Set up the project for local development
---

You are executing the **project setup** workflow. This ensures all dependencies are installed, environment is configured, and the dev server can start.

## Steps

### 1. Check Node.js

Run `node --version`. Verify it is v18 or later. If not, tell the user to install a newer version (recommend `nvm install --lts` or `fnm install --lts`).

### 2. Check pnpm

Run `pnpm --version`. If it fails:
- Suggest: `corepack enable && corepack prepare pnpm@latest --activate`
- Or: `npm install -g pnpm`

### 3. Install Dependencies

```bash
cd client && pnpm install
```

If this fails, show the error and suggest:
- Check Node.js version compatibility
- Try deleting `node_modules` and `pnpm-lock.yaml` then retrying

### 4. Check Environment

Check if `client/.env.development` exists.

**If it does NOT exist**, create it with placeholder values:

```
VITE_API_BASE_URL=/api
VITE_USE_MOCK_API=true
VITE_ANTHROPIC_API_KEY=your-anthropic-api-key
VITE_TAVILY_API_KEY=your-tavily-api-key
VITE_AZURE_OPENAI_ENDPOINT=your-azure-endpoint
VITE_AZURE_OPENAI_API_KEY=your-azure-api-key
VITE_AZURE_OPENAI_API_VERSION=2024-02-01
VITE_OPENROUTER_API_KEY=your-openrouter-api-key
```

Tell the user: "Created `.env.development` with placeholder values. Replace the API keys with your actual keys. The app will work with MSW mocks even without real keys."

**If it already exists**, confirm it's present and move on.

### 5. Verify Build

```bash
cd client && pnpm build
```

This runs `tsc -b` (type checking) and `vite build`. If it passes, the project is correctly set up.

If it fails, show the error and help diagnose (missing dependencies, TypeScript errors, etc.).

### 6. Start Dev Server

```bash
cd client && pnpm dev
```

### 7. Print Summary

```
Setup complete!

  Dev server:   http://localhost:5173
  Mock API:     enabled (MSW)
  Package mgr:  pnpm {version}
  Node.js:      {version}

Useful commands:
  pnpm dev        Start dev server
  pnpm build      Type-check and build
  pnpm lint       Run ESLint
  /start-feature  Create a feature branch
  /push-pr        Push and create a PR
```

# AGENTS.md

Guidelines for agentic coding assistants in this repository.

## Project Overview

X Thread Analyzer is a Chrome extension (Manifest V3) built with:
- Vue 3 (Composition API, `<script setup>`)
- TypeScript (strict mode)
- Vite + @crxjs/vite-plugin

## Quick Start

```bash
npm install
npm run dev      # Start dev server with HMR
npm run build    # Type check + production build
npm run typecheck# Type check only
npm run preview  # Preview production build
```

No test framework is currently configured. If adding tests, use Vitest:
- Install: `npm install -D vitest @vue/test-utils jsdom`
- Add scripts: `"test": "vitest"`, `"test:run": "vitest run"`
- Run single test: `npx vitest run path/to/test.spec.ts`

## Code Style

### TypeScript
- Strict mode enabled; all checks must pass
- Explicit types for parameters and returns
- Use `import type` for type-only imports
- Prefer `Record<string, unknown>` over `any`
- Interfaces and types: PascalCase

### Vue Components
- Always `<script setup lang="ts">`
- Props: `defineProps<Type>()`, Emits: `defineEmits<{}>()`
- Use `ref` for reactivity, `computed` for derived state
- Component names: PascalCase (`AnalyzerButton.vue`)
- Keep components small; extract logic to composables

### Naming Conventions
- Variables/functions: camelCase (`isAnalyzing`)
- Components/Interfaces/Types: PascalCase (`AnalysisResult`)
- Files: kebab-case for utilities (`use-thread-analyzer.ts`), PascalCase for Vue components
- Constants: UPPER_SNAKE_CASE only for true constants

### Imports
Group and sort alphabetically:
1. Vue core (`vue`)
2. External libraries
3. Internal modules (absolute from `/src`)

Example:
```ts
import { ref, computed } from 'vue'
import { useXTheme } from '@/composables/useXTheme'
import type { AnalysisResult } from '@/types'
```

### Error Handling
- Use try-catch for async operations
- Log errors with `[X Thread Analyzer]` prefix
- Provide user-friendly messages; avoid exposing raw API errors
- Use `AbortController` for cancellable operations
- Throw errors upstream; let caller handle

### Comments & Documentation
- JSDoc for functions:
  ```ts
  /**
   * Scrape comments from X thread
   * Only collects visible comments to avoid loading hidden/spam content
   */
  const scrapeComments = (): XComment[] => { ... }
  ```
- Inline comments explain "why", not "what"

### CSS & Styling
- Scoped CSS in `.vue` files
- Follow X design: blue gradient (#1d9bf0), pill shapes (9999px border-radius)
- Use CSS custom properties from `content.css`
- Mobile-first responsive
- Flexbox/grid preferred

### Chrome Extension
- Use `chrome.*` APIs (storage, runtime, action)
- Handle promise rejections from chrome APIs
- Use `chrome.storage.local` for settings (not `sync`)
- Manifest V3: no `eval()`, service workers correctly
- Permissions in `src/manifest.json` (host_permissions, permissions)

## Project Structure

```
src/
├── manifest.json           # Extension manifest
├── background/
│   └── service-worker.ts  # API proxy, message handler
├── content/
│   ├── main.ts            # Entry, mounts Vue app
│   ├── App.vue            # Root component
│   ├── components/        # UI components
│   ├── composables/       # Reusable logic
│   └── styles/
│       └── content.css    # Scoped styles + CSS variables
├── options/
│   ├── index.html
│   ├── main.ts
│   ├── App.vue
│   └── components/
│       └── SettingsForm.vue
└── types/
    └── index.ts           # All TypeScript interfaces
```

## Code Quality Checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds
- [ ] No `any` types (use `unknown` or explicit types)
- [ ] Vue components use `<script setup lang="ts">`
- [ ] Props/emits typed with `defineProps`/`defineEmits`
- [ ] Errors logged with `[X Thread Analyzer]` prefix
- [ ] Chrome API errors handled gracefully
- [ ] UI follows X design (blue theme, pill buttons)
- [ ] No `console.log` in production code (use only for debug/errors)

## Common Pitfalls

- **CORS errors:** Add API domains to `host_permissions` in `manifest.json`
- **Manifest changes:** Rebuild after editing `src/manifest.json`
- **Type errors:** Use `vue-tsc` for Vue SFCs, not plain `tsc`
- **Extension reload:** Chrome caches aggressively; reload from `chrome://extensions/`
- **State persistence:** Use `chrome.storage.local`; avoid in-memory only

## Tooling & Configuration

- **Type checking:** `vue-tsc` (TypeScript wrapper for Vue SFCs)
- **Build:** Vite + Rollup; manifest processed by @crxjs/vite-plugin
- **No linter** - consider adding ESLint with `@vue/eslint-config-typescript`
- **No Prettier** - if adding, use 2-space indentation, single quotes

## When Making Changes

1. Run `npm run typecheck` before committing
2. Update `README.md` or `docs/` for feature changes
3. Follow existing patterns; examine similar files
4. Keep changes minimal and focused
5. Check `package.json` before adding new dependencies

## Support & Resources

- Vue 3 Composition API: https://vuejs.org/guide/introduction.html
- Chrome Extensions MV3: https://developer.chrome.com/docs/extensions/mv3/
- TypeScript Handbook: https://www.typescriptlang.org/docs/

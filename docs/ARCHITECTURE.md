# X Thread Analyzer - Architecture Decisions

This document records key architectural decisions and their rationale.

## ADR-001: Build Tool Selection

**Decision**: Use Vite with @crxjs/vite-plugin

**Rationale**:
- Fast HMR (Hot Module Replacement) during development
- Native ES modules support
- @crxjs/vite-plugin specifically designed for Chrome extensions
- Handles Manifest V3 automatically
- Vue 3 first-class support

**Alternatives Considered**:
- Webpack: Slower, more complex configuration
- Rollup directly: More manual configuration required
- No build tool: Would miss TypeScript and modern JS features

**Status**: ✅ Implemented

---

## ADR-002: Framework Selection

**Decision**: Use Vue 3 with Composition API

**Rationale**:
- User preference for simplicity
- Excellent TypeScript support
- Smaller bundle size than React
- Composition API aligns well with extension's reactive needs
- Easy state management without external libraries

**Alternatives Considered**:
- React: Larger ecosystem but heavier
- Vanilla JS/TS: Would require more boilerplate for UI components
- Svelte: Good option but less familiar to team

**Status**: ✅ Implemented

---

## ADR-003: UI Positioning Strategy

**Decision**: Fixed sidebar (right side) + floating action button

**Rationale**:
- Sidebar provides persistent analysis view while browsing
- Fixed position prevents accidental dismissal
- 380px width balances content visibility with page space
- FAB provides clear entry point without cluttering UI
- Pin/unpin gives user control over persistence

**Alternatives Considered**:
- Modal/overlay: Would block content, easy to dismiss accidentally
- Bottom panel: Would reduce vertical space significantly
- Inline injection: Would disrupt X's layout, risk of breaking

**Status**: ✅ Implemented

---

## ADR-004: Theme Detection Approach

**Decision**: Read X's data-theme attribute with MutationObserver fallback

**Rationale**:
- X sets `data-theme="dark"` or `data-theme="light"` on HTML element
- MutationObserver catches dynamic theme changes
- Media query fallback for edge cases
- CSS variables update automatically based on detected theme

**Alternatives Considered**:
- Manual toggle only: Less seamless user experience
- System preference only: Wouldn't match X's theme
- Hardcoded themes: Would look out of place

**Status**: ✅ Implemented

---

## ADR-005: API Communication Pattern

**Decision**: Content script → Background Service Worker → External API

**Rationale**:
- Content scripts have CORS restrictions
- Service workers can make unrestricted fetch calls
- Message passing API is well-supported in Manifest V3
- Allows for retry logic and error handling in one place

**Alternatives Considered**:
- Direct fetch from content script: Blocked by CORS
- Offscreen documents: Overkill for simple API calls
- Content script injection of fetch: Security risk

**Status**: ✅ Implemented

---

## ADR-006: Data Storage Strategy

**Decision**: Use chrome.storage.sync for settings

**Rationale**:
- Persists across browser sessions
- Syncs across devices (if user signed into Chrome)
- Encrypted at rest by Chrome
- Simple key-value API
- Sufficient for small configuration data

**Alternatives Considered**:
- chrome.storage.local: No cross-device sync
- IndexedDB: Overkill for simple settings
- LocalStorage: Not available in service workers, not synced

**Status**: ✅ Implemented

---

## ADR-007: DOM Scraping Strategy

**Decision**: Query article[data-testid="tweet"] elements

**Rationale**:
- X uses consistent data-testid attributes
- Article elements contain all tweet data
- Can extract text, author, metrics reliably
- MutationObserver handles dynamically loaded content

**Alternatives Considered**:
- XPath queries: More brittle, harder to maintain
- Text content parsing: Fragile, breaks easily
- X's internal API: Would require authentication, against ToS

**Status**: ✅ Implemented

---

## ADR-008: State Management

**Decision**: Vue composables for local state, chrome.storage for persistence

**Rationale**:
- No external state management library needed
- Composables provide reusable logic
- Reactive integration with Vue's reactivity system
- chrome.storage handles persistence separately

**Alternatives Considered**:
- Pinia: Good but adds dependency
- Vuex: Overkill for this use case
- Global state object: Would lose reactivity benefits

**Status**: ✅ Implemented

---

## ADR-009: TypeScript Configuration

**Decision**: Strict mode enabled, noImplicitAny, strictNullChecks

**Rationale**:
- Catches errors at compile time
- Better IDE support and autocomplete
- Documents API contracts explicitly
- Easier refactoring

**Alternatives Considered**:
- Loose mode: Would allow more errors through
- JavaScript: Would lose type safety

**Status**: ✅ Implemented

---

## ADR-010: CSS Architecture

**Decision**: Scoped CSS in Vue SFCs + CSS variables for theming

**Rationale**:
- Scoped styles prevent conflicts with X's CSS
- CSS variables enable dynamic theme switching
- No build-step CSS processing needed
- Matches X's design tokens (colors, spacing)

**Alternatives Considered**:
- CSS-in-JS: Adds complexity, not needed
- Tailwind: Would conflict with X's styles
- Global CSS: Risk of style leakage

**Status**: ✅ Implemented

---

## ADR-011: Error Handling Strategy

**Decision**: Try-catch with user-friendly error messages

**Rationale**:
- All async operations wrapped in try-catch
- Errors displayed in UI with context
- Graceful degradation (show empty state if analysis fails)
- Console logging for debugging

**Alternatives Considered**:
- Error boundaries (Vue): Not needed for this scale
- Global error handler: Would lose context
- Silent failures: Bad UX

**Status**: ✅ Implemented

---

## ADR-012: Icon Strategy

**Decision**: No icons in initial build (optional for future)

**Rationale**:
- Icons not critical for MVP functionality
- Can be added later without breaking changes
- Reduces initial complexity
- Focus on core functionality first

**Alternatives Considered**:
- Include placeholder icons: Would need proper icon files
- Use emoji: Already using in UI components

**Status**: ✅ Deferred to Phase 2+

---

## ADR-013: Model Selection Strategy

**Decision**: Allow users to specify model name in settings

**Rationale**:
- Different APIs support different models (gpt-4, gpt-3.5-turbo, claude, etc.)
- Users may have preferences based on cost/quality trade-offs
- Default value (gpt-4) provided for convenience
- Simple text input allows flexibility for any API

**Alternatives Considered**:
- Hardcoded model: Too restrictive
- Dropdown with preset models: Wouldn't work with custom/local APIs
- Auto-detect from API: Too complex, unreliable

**Status**: ✅ Implemented

---

## ADR-014: API URL Handling

**Decision**: Smart URL building that auto-appends /chat/completions

**Rationale**:
- Users often enter base URL (e.g., http://localhost:1234/v1)
- Full URL (with /chat/completions) is verbose and error-prone
- Extension can intelligently build the full URL
- Accepts both formats for flexibility

**Implementation**:
```javascript
// If URL ends with /v1, append /chat/completions
// If URL already has /chat/completions, use as-is
// Otherwise, assume base URL and append /v1/chat/completions
```

**Alternatives Considered**:
- Require full URL: More error-prone for users
- Separate base URL and endpoint fields: More complex UI
- No transformation: Wouldn't work with common base URL patterns

**Status**: ✅ Implemented

---

## ADR-015: Progress Tracking

**Decision**: Implement progress bar with percentage and status text

**Rationale**:
- API calls can take 10-30 seconds
- Users need feedback that something is happening
- Progress stages provide context (scraping → analyzing → processing)
- Visual progress bar is more engaging than spinner alone

**Progress Stages**:
- 0-20%: Scraping comments from DOM
- 20-40%: Preparing and sending data
- 40-80%: Waiting for API response
- 80-100%: Processing and displaying results

**Alternatives Considered**:
- Indeterminate spinner: Doesn't show progress
- No progress indicator: Poor UX for long operations
- Real-time streaming: Not supported by all APIs

**Status**: ✅ Implemented

---

## ADR-016: LLM Payload Optimization

**Decision**: Send lightweight comment format to LLM, reconstruct full data locally from cache

**Rationale**:
- LLM response time directly correlates with prompt size
- Sending full comment objects (timestamps, engagement, etc.) wastes tokens
- Comments need only ID, author, text, and engagement metrics for analysis
- Local cache can reconstruct full objects after receiving LLM response with IDs only
- ~70% reduction in payload size (from ~15KB to ~5KB for 35 comments)

**Implementation**:
```typescript
// Lightweight format sent to LLM
interface LightweightComment {
  id: string
  author: string
  text: string  // Truncated to 200 chars
  likes: number
  reposts: number
  replies: number
}

// Full cache passed separately for reconstruction
const response = await analyzeComments(lightweightComments, fullCommentsCache)

// LLM returns: categories: [{name, icon, comments: [{id: string}]}]
// Reconstruct locally: fullCommentsCache.find(c => c.id === comment.id)
```

**Trade-offs**:
- Pros: Faster API responses, lower token costs, same UI display
- Cons: Slightly more complex data flow, cache must stay in memory

**Status**: ✅ Implemented

---

## ADR-017: LLM Response Parsing

**Decision**: Strip markdown code blocks before JSON parsing

**Rationale**:
- LLMs often wrap JSON responses in markdown (```json ... ```)
- Standard JSON.parse() fails on wrapped content
- Defensive parsing improves reliability without requiring prompt changes alone
- Handles multiple common wrapper formats (```json, ```javascript, ```)

**Implementation**:
```typescript
const stripMarkdownCodeBlocks = (content: string): string => {
  // Remove opening blocks: ```json, ```javascript, ```
  // Remove closing blocks: ```
  // Returns cleaned content ready for JSON.parse()
}
```

**Status**: ✅ Implemented

---

## Pending Decisions

### PD-001: Comment Caching
- Should we cache analysis results per thread URL?
- Pros: Faster repeat visits, reduced API costs
- Cons: Stale data, storage limitations

### PD-002: Rate Limiting UI
- How to show rate limit status to users?
- Options: Warning banner, cooldown timer, queue position

### PD-003: Offline Support
- Should extension work offline with cached results?
- Complexity vs. value trade-off

### PD-004: Resizable Sidebar
- Implementation approach for resizable sidebar?
- Options: CSS resize, custom drag handle, width presets
- Constraints: Min/max width, persistence, performance

---

## Change Log

| Date | ADR | Status | Notes |
|------|-----|--------|-------|
| 2026-01-30 | ADR-001 to ADR-015 | Implemented | Phase 1 complete |
| 2026-02-03 | ADR-016 | Implemented | LLM payload optimization |
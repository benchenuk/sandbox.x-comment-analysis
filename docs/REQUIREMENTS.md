# X Thread Analyzer - Project Requirements

## Overview
Chrome extension that analyzes X/Twitter threads using LLM to summarize, categorize, and filter comments while identifying bots and trolls.

## User Journey

### 1. Thread Detection
- User navigates to an X thread (URL pattern: `x.com/*/status/*`)
- Extension automatically detects thread page
- Content script injects floating analyzer button

### 2. Analysis Trigger
- User clicks floating action button (bottom-right corner)
- Button transforms to "Analyzing..." state with spinner
- Sidebar panel slides in from right side

### 3. Data Collection
- Extension scrapes visible comments from DOM
- Collects: text, author, timestamp, likes, reposts, views
- Filters: Only comments with >10 characters, max 50 comments
- Skips original post (first article element)

### 4. API Communication
- Comments sent to background service worker
- Service worker makes POST request to configured API endpoint
- API is OpenAI-compatible (external to this project)
- Request includes: comments array, task type, instructions

### 5. Results Display
- Sidebar shows loading state during analysis
- Results displayed in fixed sidebar (380px width, full height)
- Sidebar is pinned by default, can be unpinned/closed
- Results include:
  - Summary text
  - Categorized comments (with icons)
  - Statistics (total, filtered, analyzed counts)

### 6. Persistent Browsing
- Sidebar remains visible while user scrolls/browses
- User can continue reading thread with analysis visible
- Pin/unpin toggle for sidebar persistence preference

## Functional Requirements

### Content Script
- **FR-001**: Inject floating analyzer button on X thread pages
- **FR-002**: Button must be positioned bottom-right, z-index 9999
- **FR-003**: Detect X light/dark theme and apply to extension UI
- **FR-004**: Scrape comments from article[data-testid="tweet"] elements
- **FR-005**: Skip first article (original post), collect replies only
- **FR-006**: Limit to 50 comments maximum for API efficiency
- **FR-007**: Filter out comments <10 characters
- **FR-008**: Inject fixed sidebar (380px width, right side, full height)
- **FR-009**: Sidebar must persist during scroll, z-index 9998
- **FR-010**: Sidebar must be collapsible with close button
- **FR-011**: Sidebar must have pin/unpin functionality

### Background Service Worker
- **FR-012**: Handle messages from content script via chrome.runtime.sendMessage
- **FR-013**: Read API endpoint and key from chrome.storage.sync
- **FR-014**: Make POST request to external API endpoint
- **FR-015**: Include Authorization header if API key configured
- **FR-016**: Transform API response to internal format
- **FR-017**: Return error messages for failed API calls

### Options Page (Settings)
- **FR-018**: Provide form to configure API endpoint URL
- **FR-019**: Provide field for optional API key
- **FR-020**: Allow setting max comments limit (10-100 range)
- **FR-021**: Theme preference: Auto/Light/Dark
- **FR-022**: Save settings to chrome.storage.sync
- **FR-023**: Show success/error messages on save

### API Integration
- **FR-024**: Send comments array to external API
- **FR-025**: Request format: `{ comments, task: "analyze_thread", instructions: "..." }`
- **FR-026**: Handle API errors gracefully with user-friendly messages
- **FR-027**: Timeout handling for long-running analysis

## Non-Functional Requirements

### Performance
- **NFR-001**: DOM scraping must complete within 500ms
- **NFR-002**: UI injection must not block page rendering
- **NFR-003**: API timeout: 30 seconds maximum
- **NFR-004**: Extension must not impact X page performance

### Security
- **NFR-005**: API key stored in chrome.storage.sync (encrypted by Chrome)
- **NFR-006**: No sensitive data logged to console in production
- **NFR-007**: Content script isolated from X's JavaScript (no direct DOM manipulation conflicts)

### Compatibility
- **NFR-008**: Chrome 88+ (Manifest V3 support)
- **NFR-009**: Works on x.com and twitter.com domains
- **NFR-010**: Handles X's dynamic content loading (MutationObserver)

### UX/UI
- **NFR-011**: Follow X's design language (colors, fonts, spacing)
- **NFR-012**: Smooth animations (300ms transitions)
- **NFR-013**: Loading states for all async operations
- **NFR-014**: Error states with retry options
- **NFR-015**: Responsive design (sidebar width adjustable)

## Technical Constraints

- Manifest V3 required (no persistent background pages)
- Service worker for API calls (avoids CORS issues)
- Vue 3 with Composition API
- TypeScript for type safety
- No external CSS frameworks (custom styles matching X)
- Inter font family (X's native font)

## Future Enhancements (Phase 3+)

- Export analysis results (JSON, PDF)
- Historical analysis storage
- Multiple thread comparison
- Custom categorization rules
- Keyboard shortcuts
- Batch analysis of multiple threads

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-30 | 1.0.0 | Initial requirements documentation |
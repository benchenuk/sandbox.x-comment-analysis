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
- Collects: text, author, timestamp, likes, reposts, replies, views
- Filters: Only visible comments with >5 characters, max 50 comments
- Skips original post (first article element)
- Filters out promoted content and duplicates
- Sorts by engagement score (likes + reposts + replies)

### 4. API Communication
- Comments sent to background service worker
- Service worker makes POST request to configured API endpoint
- API is OpenAI-compatible (external to this project)
- Request includes: comments array, model name, system prompt
- Supports retry logic with exponential backoff (3 attempts)
- Configurable timeout (5-120 seconds)

### 5. Results Display
- Sidebar shows loading state with progress bar (0-100%)
- Progress text updates during analysis phases
- Results displayed in fixed sidebar (380px width, right side, full height)
- Sidebar is pinned by default, can be unpinned/closed
- Error states show with retry button and settings button
- Results include:
  - Summary text
  - Categorized comments (with icons)
  - Statistics (total, filtered, analyzed counts)
  - Engagement metrics per comment

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
- **FR-007**: Filter out comments <5 characters
- **FR-008**: Filter out promoted/ad content
- **FR-009**: Deduplicate comments using tweet IDs
- **FR-010**: Calculate engagement score (likes + reposts + replies)
- **FR-011**: Sort comments by engagement (highest first)
- **FR-012**: Inject fixed sidebar (380px width, right side, full height)
- **FR-013**: Sidebar must persist during scroll, z-index 9998
- **FR-014**: Sidebar must be collapsible with close button
- **FR-015**: Sidebar must have pin/unpin functionality
- **FR-016**: Show progress bar during analysis (0-100%)
- **FR-017**: Display error states with retry and settings buttons

### Background Service Worker
- **FR-018**: Handle messages from content script via chrome.runtime.sendMessage
- **FR-019**: Read settings from chrome.storage.sync (API endpoint, key, model, timeout)
- **FR-020**: Build full API URL (auto-append /chat/completions if needed)
- **FR-021**: Make POST request to external API endpoint with timeout
- **FR-022**: Include Authorization header if API key configured
- **FR-023**: Use user-selected model name in API requests
- **FR-024**: Implement retry logic with exponential backoff (3 attempts)
- **FR-025**: Transform API response to internal format
- **FR-026**: Return user-friendly error messages for failed API calls

### Options Page (Settings)
- **FR-027**: Provide form to configure API base URL
- **FR-028**: Smart URL handling (accepts base URL or full URL)
- **FR-029**: Provide field for optional API key
- **FR-030**: Provide field for model name (e.g., gpt-4, gpt-3.5-turbo)
- **FR-031**: Allow setting max comments limit (10-100 range)
- **FR-032**: Allow setting request timeout (5-120 seconds)
- **FR-033**: Theme preference: Auto/Light/Dark
- **FR-034**: Test connection button to validate API endpoint
- **FR-035**: Save settings to chrome.storage.sync
- **FR-036**: Show success/error messages on save
- **FR-037**: Reset to defaults button

### API Integration
- **FR-038**: Send comments array to external API
- **FR-039**: Request format: OpenAI chat completions API
- **FR-040**: System prompt for comment analysis task
- **FR-041**: Handle API errors gracefully with user-friendly messages
- **FR-042**: Timeout handling for long-running analysis
- **FR-043**: Retry failed requests with exponential backoff

## Non-Functional Requirements

### Performance
- **NFR-001**: DOM scraping must complete within 500ms
- **NFR-002**: UI injection must not block page rendering
- **NFR-003**: API timeout: 30 seconds default (configurable 5-120s)
- **NFR-004**: Extension must not impact X page performance
- **NFR-005**: Progress updates must be smooth (no UI jank)

### Security
- **NFR-006**: API key stored in chrome.storage.sync (encrypted by Chrome)
- **NFR-007**: No sensitive data logged to console in production
- **NFR-008**: Content script isolated from X's JavaScript
- **NFR-009**: Sanitize API responses before rendering

### Compatibility
- **NFR-010**: Chrome 88+ (Manifest V3 support)
- **NFR-011**: Works on x.com and twitter.com domains
- **NFR-012**: Handles X's dynamic content loading (MutationObserver)
- **NFR-013**: Supports localhost API endpoints for development

### UX/UI
- **NFR-014**: Follow X's design language (colors, fonts, spacing)
- **NFR-015**: Smooth animations (300ms transitions)
- **NFR-016**: Loading states for all async operations
- **NFR-017**: Error states with retry options
- **NFR-018**: Progress indication during long operations
- **NFR-019**: Responsive design within sidebar constraints

## Technical Constraints

- Manifest V3 required (no persistent background pages)
- Service worker for API calls (avoids CORS issues)
- Vue 3 with Composition API
- TypeScript for type safety
- No external CSS frameworks (custom styles matching X)
- Inter font family (X's native font)
- Must declare all host_permissions in manifest

## API Requirements

### Supported API Formats
- OpenAI API (https://api.openai.com/v1)
- OpenAI-compatible endpoints (Azure, local LLMs, etc.)
- Must support /chat/completions endpoint

### Request Format
```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "Analysis instructions..."
    },
    {
      "role": "user",
      "content": "Comments to analyze..."
    }
  ],
  "temperature": 0.7,
  "max_tokens": 2000
}
```

### Response Format
```json
{
  "summary": "Thread summary text",
  "categories": [
    {
      "name": "Category Name",
      "icon": "emoji",
      "comments": [...]
    }
  ],
  "filteredCount": 5,
  "analyzedCount": 45
}
```

## Future Enhancements (Phase 4+)

- Export analysis results (JSON, PDF)
- Historical analysis storage
- Multiple thread comparison
- Custom categorization rules
- Keyboard shortcuts
- Batch analysis of multiple threads
- Resizable sidebar
- Sidebar position options (left/right)
- Custom themes
- Import/export settings

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-30 | 1.0.0 | Initial requirements documentation |
| 2026-01-30 | 1.1.0 | Added Phase 2 features: model selection, smart URL handling, progress tracking, retry logic, enhanced error handling |
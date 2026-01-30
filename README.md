# X Thread Analyzer

Chrome extension to analyze X/Twitter threads using LLM. Summarizes, categorizes, and filters comments while identifying bots and trolls.

## Features

- 🔍 Automatically detects X/Twitter threads
- 🤖 One-click analysis with floating action button
- 📊 Fixed sidebar for persistent results while browsing
- 🎨 Follows X's design language with light/dark mode support
- ⚙️ Configurable API endpoint and settings
- 🔒 Secure API key storage

## Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck
```

## Installation

1. Build the extension: `npm run build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist/` folder
5. Configure your API endpoint in the extension options

## Project Structure

```
src/
├── manifest.json              # Extension manifest (entry point)
├── content/                   # Content script (runs on X.com)
│   ├── main.ts               # Content script entry
│   ├── App.vue               # Root Vue component
│   ├── components/           # Vue UI components
│   ├── composables/          # Vue composables (logic)
│   └── styles/               # Scoped CSS
├── background/               # Service worker
│   └── service-worker.ts     # Handles API calls
├── options/                  # Settings page
│   ├── index.html
│   ├── main.ts
│   ├── App.vue
│   └── components/
└── types/                    # TypeScript definitions
    └── index.ts
```

## Configuration

Before using the extension, configure your API endpoint:

1. Click the extension icon and select "Options"
2. Enter your OpenAI-compatible API endpoint URL
3. Add your API key if required
4. Set maximum comments to analyze (10-100)
5. Choose theme preference

## API Format

The extension expects an OpenAI-compatible API that accepts:

```json
{
  "comments": [...],
  "task": "analyze_thread",
  "instructions": "..."
}
```

And returns:

```json
{
  "summary": "...",
  "categories": [...],
  "filteredCount": 0,
  "analyzedCount": 0
}
```

## License

MIT
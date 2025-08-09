# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev        # Start Vite development server (runs on port 5173)
npm run build      # TypeScript check and production build (outputs to dist/)
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

### Installation & Setup
```bash
npm install        # Install dependencies
npm run build      # IMPORTANT: Build first before loading in Chrome
```

**Important:** You must run `npm run build` before loading the extension. The development server (`npm run dev`) cannot be used directly with Chrome extensions due to CORS restrictions.

After building, load the extension in Chrome:
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` directory (created after running `npm run build`)

## Architecture

### Chrome Extension Structure
This is a Chrome Extension (Manifest V3) for MoneyForward expense calculation and partner payment splitting.

**Core Components:**
- **Content Script** (`src/content/index.tsx`): Injected into MoneyForward pages to extract transaction data from the DOM and display calculation results
- **Popup** (`src/popup/Popup.tsx`): Extension popup UI for viewing results and managing settings
- **Background Service Worker** (`src/background/index.ts`): Handles message passing between components
- **Utilities** (`src/utils/`): Shared calculation logic and Chrome storage operations

### Key Files
- `manifest.json`: Chrome extension configuration (Manifest V3)
- `vite.config.ts`: Uses @crxjs/vite-plugin for Chrome extension development
- `src/types/index.ts`: TypeScript interfaces for Settings, Transaction, and CalculationResults

### Data Flow
1. Content script extracts transaction data from MoneyForward's `#cf-detail-table`
2. Calculations apply partner payment ratio and exclusion rules
3. Results display both in-page panel and extension popup
4. Settings persist in Chrome storage

### Special Features
- **Memo-based ratio override**: Numeric values in transaction memos override default partner payment ratio
- **Auto-refresh**: MutationObserver monitors DOM changes to update calculations
- **Partner account tracking**: Identifies partner payments from specified financial institutions
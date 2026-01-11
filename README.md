# FinBoard - Customizable Finance Dashboard

A modern, real-time finance monitoring dashboard  built with Next.js 15, React 19, and TypeScript. Create custom widgets to track stocks, crypto, forex, and more using financial APIs.

[FinBoard Dashboard]

## Features

### Core Features
- **Widget Management** - Add, remove, configure, and rearrange widgets
- **Drag & Drop** - Intuitive drag-and-drop interface for widget arrangement
- **Real-time Updates** - Configurable auto-refresh intervals (30s to 1 hour)
- **Data Visualization** - Line, Area , and Bar charts with Recharts
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Dark Mode** - Full dark mode support with system   preference detection
- **Data Persistence** - Layouts and configs saved to localStorage
- **Export/Import** - Backup and restore dashboard configurations

### Widget Types
- **Card Widgets** - Display key financial metrics (price, change, volume)
- **Table Widgets** - Paginated tables for market movers (gainers, losers)
- **Chart Widgets** - Visualize time series data with multiple chart types

### API Integration
- Pre-configured Alpha Vantage API presets
- Support for stocks, crypto, forex, and market data
- Intelligent caching to optimize API calls
- Easy field selection from API responses

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/finboard.git
cd finboard

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Create optimized build
npm run build

# Start production server
npm start
```

## Project Structure

```
finboard/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout with ThemeProvider
│   │   ├── page.tsx            # Main dashboard page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── dashboard/          # Dashboard components
│   │   │   ├── Header.tsx      # App header with actions
│   │   │   └── WidgetGrid.tsx  # Drag-and-drop widget grid
│   │   ├── modals/             # Modal dialogs
│   │   │   ├── AddWidgetModal.tsx    # Create new widget
│   │   │   ├── EditWidgetModal.tsx   # Configure widget
│   │   │   └── TemplatesModal.tsx    # Dashboard templates
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Toast.tsx
│   │   └── widgets/            # Widget implementations
│   │       ├── CardWidget.tsx
│   │       ├── ChartWidget.tsx
│   │       ├── TableWidget.tsx
│   │       ├── WidgetCard.tsx
│   │       └── SortableWidget.tsx
│   ├── config/
│   │   └── presets.ts          # API presets & templates
│   ├── hooks/
│   │   └── index.ts            # Custom React hooks
│   ├── lib/
│   │   └── api.ts              # API service & parsers
│   ├── store/
│   │   └── widgetStore.ts      # Zustand state management
│   ├── types/
│   │   └── index.ts            # TypeScript definitions
│   └── utils/
│       └── index.ts            # Utility functions
├── public/                     # Static assets
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15.1 |
| Language | TypeScript 5.7 |
| UI Library | React 19 |
| Styling | Tailwind CSS 3.4 |
| State Management | Zustand 5.0 |
| Data Visualization | Recharts 2.15 |
| Drag & Drop | @dnd-kit |
| Animations | Framer Motion 11 |
| Theming | next-themes |
| Icons | Lucide React |

## API Presets

The app comes with pre-configured Alpha Vantage API presets:

### Stocks
- Stock Quote - Real-time price and changes
- Intraday Prices - 5-minute interval data
- Daily/Weekly/Monthly Prices - Historical data
- Company Overview - Fundamentals and metrics

### Crypto
- Crypto Exchange Rate - Real-time rates
- Crypto Daily/Weekly - Historical prices

### Forex
- Forex Exchange Rate - Real-time rates
- Forex Intraday/Daily - Price history

### Market
- Top Gainers & Losers - Market movers
- Market News - Sentiment analysis
- Sector Performance - Sector data

## Customization

### Theme
Toggle between Light, Dark, and System themes using the header controls.

### Widget Sizes
- **Small** - 1 column
- **Medium** - 2 columns
- **Large** - 3 columns
- **Full** - 4 columns

### Refresh Intervals
Configure auto-refresh from 30 seconds to 1 hour per widget.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘/Ctrl + K` | Add Widget |
| `Escape` | Close Modal |

## Configuration

### Environment Variables

Create a `.env.local` file for custom API keys:

```env
# Optional: Use your own Alpha Vantage API key
NEXT_PUBLIC_ALPHA_VANTAGE_KEY=your_api_key_here
```

### API Key Notes
- The app includes a free-tier Alpha Vantage API key
- Free tier: 5 API requests/minute, 500 requests/day
- For production, get your own key at [Alpha Vantage](https://www.alphavantage.co/support/#api-key)



---



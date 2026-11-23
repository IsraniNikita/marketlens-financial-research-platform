# MarketLens

### Financial Research & Paper Trading Platform

MarketLens is a responsive financial research workspace built with Next.js and React. It brings market exploration, company research, technical analysis, portfolio views, and paper trading into a single multi-page application. Its 16 modules share a stock universe and Redux Toolkit state so a symbol selected in one workflow can be carried into another.

**Live demo:** [Open MarketLens](https://israninikita.github.io/marketlens-financial-research-platform/)

**This is a frontend demonstration, not a financial data or trading service.** Market values, news, company financials, charts, and order-book levels are bundled, generated, or simulated locally. MarketLens does not connect to a backend, live quote/news provider, broker, or exchange; it cannot place real orders and is not investment advice.

## What you can do

- Explore a local universe of 39 bundled stock records through market snapshots, search, sector filters, sorting, and pagination.
- Open a company research view with generated financial statements and ratios, chart ranges, and JSON export.
- Compare multiple symbols and inspect generated price series with technical indicators.
- Build and manage browser-local watchlists, screen presets, and threshold alerts.
- Use a virtual INR account to practice validated buy and sell flows, then review orders, transactions, positions, and P&L.
- Open a configurable trading-terminal layout with candlestick or line charts, generated order-book/depth panels, and simulated orders.
- Explore portfolio and risk summaries, sample news/events, and hypothetical strategy backtests.
- Change appearance preferences and create/select named workspace and portfolio records.

## Application modules

| Module | Route | Main capabilities |
|---|---|---|
| Market Overview | `/market-overview` | Demo index/sector snapshot, breadth, movers, simulated quote refresh |
| Market Explorer | `/market-explorer` | Search and browse the bundled stocks; filter, sort, paginate |
| Company Research | `/company-research?symbol=RELIANCE` | Generated statements and ratios, chart ranges, related actions, JSON export |
| Stock Comparison | `/stock-comparison` | Compare two to five symbols using normalized generated series |
| Trading Terminal | `/trading-terminal?symbol=RELIANCE` | Candlestick/line chart, symbol and timeframe selection, panel visibility, paper orders |
| Technical Analysis | `/technical-analysis` | Synthetic price path with SMA, EMA, Bollinger Bands, and RSI |
| Watchlists | `/watchlists?add=RELIANCE` | Create/select lists and add or remove symbols |
| Paper Trading | `/paper-trading` | Virtual account, order validation, positions, order history, transactions |
| Portfolio Manager | `/portfolio-manager` | Paper-account holdings and portfolio labels |
| Risk Analytics | `/risk-analytics` | Simplified volatility, drawdown, Sharpe, VaR, exposure, and scenarios |
| News & Events | `/financial-news` | Sample stories/events and local bookmarks |
| Backtesting Lab | `/strategy-backtesting` | SMA, EMA, RSI, and MACD strategies on synthetic prices |
| Stock Screener | `/stock-screener` | Local-stock filters and saved filter presets |
| Alerts Center | `/alerts-center` | Price/change thresholds, manual evaluation, triggered history |
| Reports & Analytics | `/reports-analytics` | Account summary, transaction CSV, print view, allocation |
| Settings & Workspace | `/settings` | Theme and preference controls, workspace labels, paper-account reset |

The root `/` route redirects to `/market-overview`. Routes with `symbol` or `add` query parameters are used by cross-module links to retain the selected stock.

## Example workflows

### Research a symbol

Search from the Market Explorer or global search, open Company Research, then continue to comparison, watchlists, Technical Analysis, Alerts Center, or the Trading Terminal. The company page displays generated statements and ratios for the selected local stock record and can export that research view as JSON.

### Practice a paper trade

The Paper Trading and Terminal forms validate the symbol, positive quantity, price fields for non-market orders, available cash for buys, and available shares for sells. A market order is immediately simulated at the selected local quote. A successful trade updates the virtual cash balance, position quantity and average entry price, transaction history, and account totals. A sell also records realized P&L.

### Explore a strategy

Backtesting uses a generated price series and supports SMA crossover, EMA crossover, RSI threshold, and MACD crossover rules. Users can change starting capital, position size, stop loss, and target, then inspect the resulting equity curve and summary metrics.

## Architecture

```text
Next.js App Router
└── Root layout
    ├── StoreProvider (IndexedDB hydration)
    ├── ThemeProvider (saved theme and CSS variables)
    └── AppShell (navigation, search, responsive layout, error boundary)
        └── 16 module routes

src/
├── app/                 Route pages, root layout, global styles
├── components/
│   ├── charts/          ECharts wrapper and chart lifecycle
│   ├── layout/          Sidebar, topbar, app shell
│   ├── shared/          Providers, error boundary, shared stock card
│   └── ui/              Buttons, cards, badges, inputs, tables
├── data/                Bundled stock and index records
├── hooks/               Responsive media-query hook
├── lib/                 Calculations, indicators, simulations, IndexedDB helpers
├── store/
│   ├── slices/          Market, trading, portfolio, alerts, settings, and other state
│   ├── index.js         Redux store setup and IndexedDB hydration/persistence
│   └── selectors.js     Shared selectors and derived portfolio metrics
└── types/               JSDoc data-shape definitions
```

### State and persistence

Redux Toolkit organizes shared state into market, watchlist, trading, portfolio, alerts, settings, terminal, and screener slices. Selectors expose shared values and derive metrics such as portfolio exposure and position P&L. This allows different routes to use the same local account and selected market data.

On startup, the store hydrates selected slices from IndexedDB before rendering the app. A store subscriber persists changes for watchlists, alerts, portfolio metadata, trading, and settings. Some modules also use `localStorage` for their own saved data, such as screen presets and news bookmarks. This storage is limited to the current browser profile and origin; there is no login, cloud sync, or cross-device persistence.

### Charts and calculations

Charts are rendered through a shared ECharts wrapper that updates options, responds to window resizing, and disposes chart instances when components unmount. Indicator and portfolio/risk calculation helpers live separately from the page components. The stock and index datasets are bundled under `src/data/`; simulation and generated sample content are in `src/lib/`.

## Technology

- **Framework:** Next.js 16 App Router
- **UI:** React 19, JavaScript (ES modules and JSX)
- **State:** Redux Toolkit, React Redux
- **Styling:** Tailwind CSS 4 and CSS variables
- **Charts:** Apache ECharts
- **Browser storage:** IndexedDB via `idb`, plus `localStorage`
- **Icons:** Lucide React

## Getting started

### Requirements

- Node.js 20.9 or later
- npm

### Install dependencies and run the development server

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

On Windows PowerShell, if the `npm` script is blocked by the local execution policy, use `npm.cmd`:

```powershell
npm.cmd ci
npm.cmd run dev
```

### Build and serve production output

```bash
npm run lint
npm run build
npm run start
```

Available scripts are `dev`, `build`, `start`, and `lint`. There is currently no automated unit- or browser-test script.

### Deploy to GitHub Pages

The `Deploy to GitHub Pages` workflow runs on every push to `main`. It lints the project, creates a static export, and publishes it to the live demo URL above. The repository's **Settings → Pages → Build and deployment → Source** must be set to **GitHub Actions**.

## Data boundaries and known limitations

- **No live data:** the bundled stock quotes are seed/demo values. The Market Overview refresh simulates quote changes; it does not call an API.
- **Generated research:** company descriptions, financial statements, ratios, and many chart histories are illustrative rather than verified filings or exchange history.
- **Explorer sparklines:** the compact charts in Market Explorer reuse one illustrative series; they do not represent individual stock histories.
- **Simulated order book:** bid/ask and depth values are generated from the selected local quote, not exchange liquidity.
- **Order lifecycle:** market orders execute immediately in the reducer. Limit, stop-loss, and stop-limit orders can be created and cancelled, but no price watcher or matching engine fills them automatically.
- **Simplified accounting:** no fees, taxes, slippage, settlement, margin, short selling, or lot-size rules are modeled.
- **One virtual account:** named portfolio entries are labels; holdings remain in the shared trading account rather than being partitioned by portfolio.
- **Manual alerts:** price/change alerts are evaluated only when the user presses **Evaluate Now**. Email, push, and sound preferences are not connected to notification services.
- **Illustrative analytics:** risk metrics and backtests use generated inputs and simplified assumptions. They are educational demonstrations, not forecasts or evidence of strategy performance.
- **Partial preferences:** some settings are saved but are not consumed by every module. Trading Terminal panels can be shown or hidden; drag-and-drop panel rearrangement is not implemented.

## Development and verification

Run `npm run lint` for ESLint and `npm run build` for a production compilation and route generation. Because there is no automated test suite yet, important workflows should also be checked in the browser: module navigation, cross-route stock links, watchlist changes, a small market order, manual alert evaluation, chart controls, CSV/JSON exports, responsive navigation, and browser persistence.

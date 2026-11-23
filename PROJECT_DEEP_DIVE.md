# MarketLens Financial Platform — Project Deep Dive

This guide explains the application as it exists in this repository: its purpose, architecture, data, state, calculations, all 16 modules, what is genuinely interactive, what is simulated, and how to discuss it accurately in an interview.

> **Important:** MarketLens is a frontend demonstration and paper-trading prototype. It does not connect to a broker, exchange, live quote feed, financial-news service, or backend. Prices and most histories, fundamentals, news, events, and chart series are bundled or generated locally. Do not describe the displayed information as live or use it to make investment decisions.

## 1. What the project is

MarketLens is a responsive financial-market analysis workspace built with Next.js and React. It brings several common investing/trading workflows into one UI:

1. Review an illustrative market snapshot.
2. Search a local universe of stocks and explore their displayed metrics.
3. Inspect company profiles, generated financial statements, and ratios.
4. Compare assets and view technical indicators.
5. Organize symbols in watchlists and configure threshold alerts.
6. Place simulated orders in a virtual account.
7. Review account holdings, exposure, risk summaries, reports, and hypothetical strategy backtests.
8. Change visual preferences and switch among saved workspace labels.

It is a **client-side product prototype**, not a full financial system. Its purpose is to demonstrate module composition, responsive navigation, charts, local state, simulated calculations, and connected user flows—not production market data, regulated advice, or execution of real trades.

### A concise interview description

> “I built MarketLens, a responsive financial-analysis and paper-trading dashboard with 16 modules. It uses Next.js App Router, React, Redux Toolkit, Tailwind CSS, and ECharts. The UI shares a local stock universe and Redux state for simulated orders, positions, alerts, and watchlists; preferences and selected data persist in browser storage. I kept external services out of scope, so market information and historical series are clearly demo/synthetic data rather than live feeds.”

### What not to claim

- Do not say that it streams real-time quotes, news, or order-book data.
- Do not say that it sends orders to NSE, BSE, a broker, or any exchange.
- Do not say that the displayed company financials are reported filings.
- Do not describe the backtest as evidence that a strategy will be profitable.
- Do not say that workspace settings, notification toggles, or every order type have production integrations.

## 2. Technology and runtime

The versions below are declared in [`package.json`](./package.json):

| Area | Technology | Role in this project |
|---|---|---|
| Application framework | Next.js 16 App Router | Route-per-module structure, page rendering, production build and server |
| UI | React 19, JavaScript and JSX | Interactive pages and shared components |
| Styling | Tailwind CSS 4 and CSS variables | Responsive utility styling, dark/light theme tokens |
| Global application state | Redux Toolkit and React Redux | Market data, trading account, alerts, portfolios, settings, watchlists, terminal and screener state |
| Charts | Apache ECharts | Charts used by the currently rendered modules |
| Browser persistence | IndexedDB via `idb`; `localStorage` | Local-only persistence; no account or cloud synchronization |
| Icons | Lucide React | Navigation and feature icons |
| Utility libraries | `clsx`, `tailwind-merge`, `nanoid` | Conditional/merged CSS classes; `nanoid` is wrapped by a helper, although current UI IDs are mostly generated with timestamps |

`src/types/stock.js` documents JavaScript data shapes with JSDoc; the application is not written in TypeScript. `jsconfig.json` enables JavaScript files and maps `@/…` to `src/…`.

The package also declares dependencies for other capabilities (for example drag-and-drop, form libraries, React Table, Chart.js, and Lightweight Charts). A dependency being installed does **not** mean every feature is used: the rendered pages use ECharts, and the Lightweight Charts wrapper is present but is not imported by the current pages.

### Run commands

From the project root:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`. To verify a production build:

```bash
npm run build
npm run start
```

Available package scripts are `dev`, `build`, `start`, and `lint`. There is no project-defined `test` script or checked-in automated unit-test suite.

## 3. Application structure

The important source is under [`src/`](./src/):

```text
src/
  app/                 Next.js App Router pages (one route per module)
  components/
    charts/            ECharts and Lightweight Charts wrappers
    layout/            App shell, sidebar, topbar
    shared/            Store/theme providers, error boundary, stock card
    ui/                Button, card, badge, input, and table primitives
  data/                Bundled stock and index/sector snapshots
  hooks/               Responsive media-query hook
  lib/                 Formatting, calculations, indicators, simulations, IndexedDB
  store/
    slices/            Redux state domains
    index.js           Store construction and persistence
    selectors.js       Reusable/memoized state selectors
  types/               JSDoc data-shape definitions
```

Other root files of note:

- [`src/app/layout.js`](./src/app/layout.js) loads global CSS and composes the store provider, theme provider, and shared app shell.
- [`src/app/page.jsx`](./src/app/page.jsx) redirects `/` to `/market-overview`.
- [`src/app/globals.css`](./src/app/globals.css) defines the Tailwind theme mapping, dark/light CSS variables, shared surfaces, focus rings, and print rules.
- [`postcss.config.mjs`](./postcss.config.mjs) connects Tailwind 4 to PostCSS.
- [`next.config.js`](./next.config.js) enables React strict mode and configures remote image host matching. The current stock UI does not depend on remote financial data.
- [`src/data/stocks-combined.js`](./src/data/stocks-combined.js) combines the bundled stock arrays and creates symbol lookup helpers.

There are no `src/app/api` route handlers or server-side finance services in this source tree. Pages are predominantly client components because they use React state, Redux, browser storage, charts, or event handlers.

## 4. How the application runs

### Startup and providers

1. Next.js enters through `src/app/layout.js`.
2. `StoreProvider` calls `initializeStore()` in a browser effect. The app displays “Loading your workspace…” while IndexedDB hydration is pending. A visible alert is rendered if store initialization rejects.
3. `initializeStore()` loads any saved slice records from IndexedDB, then creates the Redux Toolkit store.
4. `ThemeProvider` loads saved preferences/theme and applies the dark or light CSS variables to the document root.
5. `AppShell` renders the persistent navigation/header and the current route’s content.
6. The root route replaces itself with `/market-overview`.

The rendering fallback and storage are browser-oriented. The application does not authenticate a user or retrieve personalized state from a server.

The route content is wrapped in a shared `ErrorBoundary` keyed by pathname. A render-phase error is logged and replaced with a retry screen; navigating to another route creates a fresh boundary.

### Navigation and shared shell

[`src/components/layout/app-shell.jsx`](./src/components/layout/app-shell.jsx) owns the navigation flow:

- A module list maps display labels to route paths.
- `usePathname()` determines the active navigation item.
- Sidebar selections use Next.js router navigation.
- A global search dialog can be opened with **Ctrl+K** or **Cmd+K**. It filters module names/descriptions and the stock list; choosing an asset opens Company Research for that symbol.
- The sidebar collapses on desktop and opens as a drawer on mobile, with an overlay that closes it.
- The topbar contains the exchange toggle, workspace menu, theme switch, market-hours clock, and Alerts Center shortcut.

The market-hours label is a client-side clock calculation for weekdays from 09:15 to 15:30 India time. It does not query an exchange calendar, account for holidays, or confirm that trading is actually open.

### Charts and shared UI

[`src/components/charts/echarts-wrapper.jsx`](./src/components/charts/echarts-wrapper.jsx) initializes ECharts as an SVG chart, updates options when inputs change, resizes on browser window resize, and disposes its chart during cleanup. Market Overview, Company Research, Comparison, Terminal, Technical Analysis, Risk, Backtesting, Portfolio, Reports, and Market Explorer use this wrapper.

The shared UI primitives in `src/components/ui/` standardize buttons, cards, badges, inputs, and tables. The `Button` component supports `asChild` by cloning one valid child element so a styled button can wrap a link. Shared CSS variables allow the same component styles to adapt to dark and light themes.

## 5. Data and state model

### Stock universe

The bundled data is assembled from:

- [`src/data/stocks.js`](./src/data/stocks.js)
- [`src/data/stocks-more-a.js`](./src/data/stocks-more-a.js)
- [`src/data/stocks-more-b.js`](./src/data/stocks-more-b.js)
- [`src/data/stocks-combined.js`](./src/data/stocks-combined.js)

The current universe contains **39 stock records** and the source defines 11 sector labels. Each stock record includes fields such as symbol, name, exchange, sector, price, absolute and percentage change, market capitalization, volume, P/E, EPS, 52-week range, open, and previous close. These values are local seed/demo values, not a quote response.

`stocks-combined.js` exports `ALL_STOCKS`, a symbol-keyed `STOCK_BY_SYMBOL`, `findStock(symbol)`, and `stocksBySector(sector)`. Many controls intentionally show only the first 20 assets; some screens, such as the full Market Explorer and backtest symbol selector, use the larger set.

### Redux slices

[`src/store/index.js`](./src/store/index.js) combines these domains:

| Slice | Main responsibility | Used by |
|---|---|---|
| `market` | Symbol-to-stock map/list, indices, breadth, sectors, refresh timestamp | Market Overview, Explorer, company pages and selectors |
| `watchlist` | Lists, selected list, symbols and optional notes/tags | Watchlists and summary tiles |
| `trading` | Virtual account, orders, positions, transactions and order sequence | Paper Trading, Terminal, Portfolio, Risk, Reports |
| `portfolio` | Named portfolio records, active portfolio, performance-history and allocation fields | Portfolio Manager |
| `alerts` | Alert conditions and triggered-history records | Alerts Center and summary tiles |
| `settings` | Theme, density, defaults, workspaces, notification preference flags | Settings, ThemeProvider and Topbar |
| `terminal` | Selected symbol, chart settings, visible panels, order book and market-depth display | Trading Terminal |
| `screener` | Filters/results/active saved screen | Stock Screener |

[`src/store/selectors.js`](./src/store/selectors.js) exports direct selectors and memoized selectors. For example, `selectPortfolioMetrics` derives the current value and P&L of positions from the position state and market stock map; selectors avoid duplicating this derived calculation in every component.

### Persistence: what survives a refresh

Persistence is **browser-local**, scoped to the current origin and browser profile:

- The Redux store subscriber writes the tracked slices (`watchlist`, `alerts`, `portfolio`, `trading`, `settings`) to corresponding IndexedDB object stores through [`src/lib/idb.js`](./src/lib/idb.js).
- Watchlists, alerts, and portfolio metadata also read/write `localStorage` keys `fp-watchlists`, `fp-alerts`, and `fp-portfolios`.
- Saved screener presets use `fp-screener-screens`.
- Settings use `fp-settings`; the theme also has the `fp-theme` key.
- News bookmarks use `fp-news-bookmarks`.
- Terminal panel/chart selections, the market list, and ordinary in-progress page controls are not all persisted as durable user state.

There is no cloud sync, account login, shared database, or cross-device persistence. Clearing browser data removes local saved information. The `workspaces` object store exists in IndexedDB setup, but workspace data is part of the `settings` state record in the current flow.

### Important distinction: a named portfolio is not an isolated account

The Portfolio Manager creates/selects portfolio **metadata** (name/type/creation time). The paper account’s positions and cash live in the global `trading` slice, not inside each portfolio. Switching the selected portfolio does not partition or replace holdings. This is a prototype-level organization feature, not multi-account portfolio accounting.

## 6. The 16 modules, in detail

### 01. Market Overview — `/market-overview`

**Purpose:** Give a quick summary of broad markets and the user’s local paper account.

**What it displays:**

- Four of the six fixed index records from [`src/data/indices.js`](./src/data/indices.js).
- Fixed sector performance figures and an illustrative market-pulse chart.
- Advancing/declining/unchanged counts derived from the stock list currently in Redux.
- Top five gainers, losers, and most active records, sorted from that local stock list.
- Virtual account value/cash, watchlist count, and active alert count.

**Interactions:** “Explore markets” opens Market Explorer, “Open screener” opens Stock Screener, stock rows open Company Research, and “Refresh demo quotes” runs `simulateMarket()` and replaces the Redux stock list with randomly adjusted demo quotes.

**Data boundary:** The refresh changes stock quote-like values in the in-memory market slice. Index values, sector changes, and the pulse series remain illustrative/static. Refresh does not call an API.

### 02. Market Explorer — `/market-explorer`

**Purpose:** Search and browse the 39 local stock records.

**Interactions:** Search symbol/company/sector, filter by sector, sort by selected columns, paginate 20 records at a time, open a company profile, or navigate to Watchlists with an `add` query parameter.

**Displayed fields:** Symbol, company, sector, price, daily percentage change, market capitalization, volume, P/E, and EPS.

**Data boundary:** Row mini-charts use the same small illustrative series rather than per-stock price history. The search/table itself reads from the local Redux stock list, with `ALL_STOCKS` as a fallback.

### 03. Company Research — `/company-research?symbol=SYMBOL`

**Purpose:** Present a single-stock overview and company-style research layout.

**Interactions:** Change chart range (1M, 3M, 6M, 1Y, 5Y), switch income statement/balance sheet/cash flow, navigate to Watchlists, Comparison, Terminal, Technical Analysis, or Alerts, and export a JSON research report.

**Data generation:** Company ratios and financial statements come from deterministic symbol-seeded functions in [`src/lib/simulations.js`](./src/lib/simulations.js). The chart history is generated locally from the selected stock’s current seed price using trigonometric variation; it is not exchange history. The company description is templated, and “Industry” currently repeats the sector field.

The generated income statement has FY22-FY24 rows; generated balance-sheet and cash-flow tables have FY23-FY24 rows. The ratio set includes P/E, P/B, EPS, ROE, ROCE, debt-to-equity, current ratio, operating margin, net profit margin, and dividend yield.

**Export:** The download contains the local stock object, generated statements, and generated ratios as JSON.

### 04. Stock Comparison — `/stock-comparison?add=SYMBOL`

**Purpose:** Compare two to five local assets side by side.

**Interactions:** Start with RELIANCE, TCS, and HDFCBANK; add/remove symbols; switch between 1Y and 3M display windows; inspect a normalized performance chart and current metadata metrics.

**Chart logic:** Each generated series is normalized to its first value (`first point = 100`), so the chart compares percentage-like movement rather than absolute rupee prices. The 1Y and 3M controls use 252 and 63 synthetic points respectively.

**Data boundary:** Series are deterministic generated paths based on a symbol seed and are not historical market prices.

### 05. Trading Terminal — `/trading-terminal?symbol=SYMBOL`

**Purpose:** Provide a multi-panel workspace for a selected demo asset and the paper account.

**Interactions:** Select a symbol from the terminal’s first-20 list, change chart timeframe/type, expand the chart, show/hide panels, and place simulated orders. Deep links can select the symbol from another module.

**Panels:** Local watchlist, chart, order form, account summary, generated order book, generated market depth, positions, and orders/trades. The visible panel toggles cover watchlist, order book, depth, trades, positions, and account.

**Data boundary:** Candles are generated locally. Bid/ask levels are derived from the selected quote using fixed offsets and sample quantities; they are not exchange order-book data. The timeframe changes the chart labels/configuration, not an external historical data request.

**Orders:** A market order is immediately processed by the shared trading reducer. Limit, stop-loss, and stop-limit orders can be entered, but the current reducer leaves non-market orders pending; there is no price watcher or matching engine to trigger them automatically. Pending orders can be cancelled.

### 06. Technical Analysis — `/technical-analysis?symbol=SYMBOL`

**Purpose:** Visualize a generated price path with common technical indicators.

**Interactions:** Choose from the first 20 assets, set a bounded indicator period, toggle SMA, EMA, and Bollinger Bands overlays, and inspect RSI with 30/70 guide labels.

**Data boundary:** The screen builds a 201-point synthetic price path. It is not loaded from a quote/history provider. Although [`src/lib/indicators.js`](./src/lib/indicators.js) exports additional indicators, this page exposes only SMA, EMA, Bollinger Bands, and RSI.

### 07. Watchlists — `/watchlists?add=SYMBOL`

**Purpose:** Maintain local named lists of symbols to follow.

**Visible interactions:** Create, select, and delete lists; add a stock through the selector; remove a stock from the selected list. A valid `?add=SYMBOL` deep link adds the symbol to an existing list or creates “My Watchlist” when none exists.

**State:** Watchlist entries are stored in Redux and browser persistence. The slice also defines notes, tags, rename, and reorder actions, but the current page does not expose all of those operations.

**Audit fix:** The stock selector now explicitly submits the selected stock’s symbol as its option value. Before this correction, it submitted the display label, which did not match the reducer’s symbol lookup and prevented adding the selected stock.

### 08. Paper Trading — `/paper-trading`

**Purpose:** Simulate a single virtual account with a default starting capital of INR 1,000,000.

**Market-order flow:**

1. Choose a symbol and BUY or SELL.
2. Enter a positive quantity.
3. For a buy, validate the estimated cost against available cash; for a sell, validate that the position has enough shares.
4. Dispatch `placeOrder`.
5. A market order is executed immediately at the local stock price.
6. The reducer updates cash, position quantity/average cost, order state, transaction history, and account totals.

**Other order types:** Limit and stop-type forms validate entered prices and stop prices, but their orders remain pending until explicitly executed by code or cancelled. No UI matcher currently fills them. There are no brokerage fees, exchange fees, taxes, slippage, settlement, short sales, margin, or lot-size rules.

**Account values:** Cash, invested value, unrealized P&L, and total return are derived by the trading slice. The Settings page offers “Reset Paper Account,” which resets this virtual trading state.

### 09. Portfolio Manager — `/portfolio-manager`

**Purpose:** Show the virtual account’s holdings, value, P&L, and sector allocation.

**Data:** Holdings are derived from positions in the global trading slice and current local stock prices. Sector allocation is aggregated from those holdings.

**Interactions:** Create a named portfolio and select among portfolio records.

**Data boundary:** The performance chart is a fixed illustrative series, not a historical series reconstructed from the user’s actual trades. Named portfolios do not own separate positions; all show the same global trading account.

### 10. Risk Analytics — `/risk-analytics`

**Purpose:** Show a basic, educational risk summary based on current paper holdings.

**Metrics and method:**

- Volatility: standard deviation of generated returns, annualized by `sqrt(252)`.
- Maximum drawdown: largest peak-to-trough decline in a generated portfolio value series.
- Sharpe ratio: generated-return average/dispersion with a 6% risk-free assumption and 252-day annualization.
- VaR (95%): absolute value of the empirical lower-tail return at the 5th-percentile index, displayed as a percentage.
- Sector exposure: current value grouped by the stock’s local sector.
- Scenarios: fixed shocks to the whole portfolio, IT holdings, Banking holdings, or the largest position.

**Data boundary:** Returns are synthesized from a deterministic trigonometric function and current holding weights. This is not a historical risk model, covariance model, calibrated VaR system, or prediction. Scenario loss figures are simplified arithmetic illustrations.

### 11. News & Events — `/financial-news`

**Purpose:** Browse sample news stories and a sample economic/company-event calendar.

**Interactions:** Search titles/summaries, filter by category, save/remove bookmarks. Bookmarks persist in `localStorage`.

**Data boundary:** [`NEWS` and `EVENTS`](./src/lib/simulations.js) are hardcoded arrays containing five sample stories and four sample events. There is no news provider, calendar API, notification service, or verification that a sample item/event is real or current.

### 12. Backtesting Lab — `/strategy-backtesting`

**Purpose:** Run a local, hypothetical rules-based strategy against a generated price path.

**Inputs:** Stock, strategy (SMA crossover, EMA crossover, RSI threshold, or MACD crossover), starting capital, position-size percentage, stop-loss percentage, and target percentage.

**Process:** It generates 251 synthetic price points, computes the selected indicator arrays, enters a long position on the implemented buy signal, and exits on a sell signal or configured stop/target. It computes an equity curve and summary values such as return, completed trades, wins/losses, win rate, profit factor, maximum drawdown, and average profit/loss.

**Data boundary and assumptions:** This is a small in-browser educational simulation, not a statistically reliable backtesting engine. It does not model real historical bars, dividends, fees, slippage, liquidity, order execution delays, survivorship bias, or taxes; it supports no short positions or benchmark comparison. A displayed result is not investment advice or a forecast.

### 13. Screener — `/stock-screener`

**Purpose:** Narrow the local stock universe using simple filters.

**Filters:** Minimum market cap, maximum P/E, minimum ROE, maximum debt-to-equity, minimum dividend yield, and minimum daily change.

**Data logic:** P/E, ROE, debt-to-equity, dividend yield, and other ratios used by the screen are generated deterministically from the stock symbol. Market cap and daily change use the local stock records. Default and user-saved screen definitions are available; user saves are stored in `localStorage`.

**Interactions:** Clear filters, apply a preset, save current filter settings under a name, and delete saved presets. The three starter presets are “High ROE Low Debt,” “Undervalued Growth,” and “Momentum Stocks.” Results recalculate in the browser.

### 14. Alerts Center — `/alerts-center?symbol=SYMBOL`

**Purpose:** Create and manage local price/change-threshold alerts.

**Supported UI/evaluation conditions:** Price above, price below, percentage change above, and percentage change below. Users can create, pause/resume, reset, delete, evaluate, and mark triggered history as read.

**Evaluation flow:** “Evaluate Now” sends the alert reducer a quote map built from `ALL_STOCKS`. The reducer checks active, unpaused, untriggered alerts against those supplied values and appends triggered records when conditions match.

**Data boundary:** Evaluation is manual, not a continuously running listener. The quote map comes from the bundled stock array rather than the refreshed Redux quote list. No email, push, sound, server scheduler, or market-data subscription is connected. Additional alert kinds listed in JSDoc are not all implemented by this evaluator.

### 15. Reports & Analytics — `/reports-analytics`

**Purpose:** Summarize account totals, transaction activity, P&L, and current holding allocation.

**Interactions:** Choose a displayed report label and date window (1M/3M/6M/1Y), export a CSV, or invoke browser print.

**Date window:** The selected range filters transaction rows and the period trade/win counts. CSV output includes date, symbol, side, quantity, price, value, and transaction P&L.

**Important distinction:** The report-type selector changes the report heading and export filename, but the page does not implement a separate calculation pipeline for each report type. The equity/performance chart is a fixed illustrative series. Account totals and P&L summary do read the simulated trading state.

### 16. Settings & Workspace — `/settings`

**Purpose:** Configure local preferences, workspace labels, and reset the paper account.

**Controls:** Theme, density, default exchange, currency, timeframe, notification preference flags, saved workspace selection/create/duplicate/delete, Save, and Reset Paper Account.

The initial workspace labels are Beginner, Technical Analysis, Intraday, and Portfolio Monitoring, each with a list of panel names.

**What takes effect:** Theme changes are applied to the global CSS theme. The exchange control in the Topbar toggles the stored NSE/BSE preference. Workspace selection updates the selected workspace label.

**Prototype limits:** Density, currency, notification flags, default timeframe, and workspace panel definitions are stored as preferences but are not consistently wired into every module. The workspace menu does not load a distinct layout into the terminal’s panel state. Notification switches do not send email, push notifications, or sound. “Reset Paper Account” resets trading-account data, not watchlists, alerts, news bookmarks, or all settings.

## 7. Key calculations, in plain language

The helper functions are in [`src/lib/calculations.js`](./src/lib/calculations.js), and the trading reducer’s account recalculation is in [`src/store/slices/tradingSlice.js`](./src/store/slices/tradingSlice.js).

### Position and account arithmetic

For a position with quantity `q`, average entry price `a`, and current local price `p`:

- Invested cost = `a * q`
- Current position value = `p * q`
- Unrealized P&L = `(p - a) * q`
- Position return % = `((p - a) / a) * 100`, when `a` is nonzero

For a successful buy, the account subtracts `execution price * quantity` from cash and recomputes weighted average entry price. For a successful sell, it adds sale proceeds to cash and adds `(sale price - average entry price) * sold quantity` to realized P&L.

- Portfolio value = available cash + current value of open positions
- Total return = portfolio value - initial capital
- Total return % = total return / initial capital * 100, when initial capital is nonzero

These are demo accounting rules; there are no costs or tax considerations.

### Technical indicator helpers

[`src/lib/indicators.js`](./src/lib/indicators.js) contains array-based implementations:

- **SMA:** mean of the last `period` values.
- **EMA:** starts from a period simple mean, then applies `k = 2 / (period + 1)`.
- **RSI:** initial gains/losses are averaged, then smoothed with a Wilder-style recurrence.
- **MACD:** fast EMA minus slow EMA, then EMA signal and histogram.
- **Bollinger Bands:** period mean plus/minus a multiple of population standard deviation (default multiplier 2).
- Also exported: stochastic, ROC, ATR, VWAP, OBV, and standard deviation.

Early values that lack enough history are represented as `null`. Different pages expose different subsets of these helpers.

### Risk helper conventions

The reusable calculations module also includes returns, population standard deviation, annualized volatility, maximum drawdown, Sharpe ratio, beta, correlation, historical percentile VaR, and CAGR. The app’s Risk Analytics page uses a subset and supplies generated returns. These formulas are useful for demonstrating implementation, but the results inherit the limitations of synthetic inputs and simplified assumptions.

## 8. Persistence and failure behavior

[`src/lib/idb.js`](./src/lib/idb.js) wraps the browser `idb` library and creates object stores for watchlists, alerts, portfolios, trading, settings, and workspaces.

The store initialization in `src/store/index.js` reads the mapped IndexedDB records before mounting the Redux provider. Slice reducers also read/write selected `localStorage` keys. This makes the demo convenient across refreshes on the same browser, but it does not provide:

- User identity or authorization.
- Server-side validation or audit history.
- Shared state across browsers/devices.
- Conflict resolution between tabs/devices.
- A backend recovery process if local browser storage is cleared or corrupted.

Storage read/write problems are logged in the relevant helper/provider paths; `StoreProvider` displays a loading state and a startup error message if initialization fails. Some slice-level browser-storage failures fall back to default/empty values with a console warning.

## 9. Implementation boundaries and audit notes

These are important to explain honestly in a demo or interview:

1. **No backend or external financial API:** all currently visible information is local.
2. **Quote refresh is simulation:** `simulateTick()` uses random variation; it is not a feed or a polling client.
3. **Mixed deterministic/random data:** generated company ratios/statements and most chart paths are deterministic per symbol/inputs; the Market Overview refresh uses random noise.
4. **No automatic alert engine:** alert evaluation happens only on button click and uses the bundled quote list.
5. **No order-matching engine:** market orders execute immediately; non-market orders remain pending unless separately acted on in code.
6. **Simplified portfolios:** portfolio records are labels, while positions are global to the paper account.
7. **Illustrative charts:** some chart series are hardcoded sample arrays; others are generated histories, not downloaded prices.
8. **Partial settings integration:** some settings are UI state/preferences rather than application-wide behavior.
9. **No automated test script:** package scripts include lint/build/dev/start, not `test`.
10. **Watchlist add selector:** during the deep-dive review, its option value was corrected to pass the symbol expected by the reducer. Add and remove were then verified against the rebuilt application.

### A realistic production roadmap

If asked what you would do next, discuss the following as future work—not as already completed:

- Add a typed backend/data-access boundary and validate all external responses.
- Use a licensed market-data provider and WebSocket/SSE stream with stale-data/error states.
- Move user state to authenticated server persistence with migrations and conflict handling.
- Build an order simulator/matcher with explicit order lifecycle, fees, slippage, and tests; keep it separate from real brokerage integration.
- Use verified historical data for risk and backtesting; add transaction costs, benchmarks, out-of-sample testing, and clear assumptions.
- Wire settings to behavior, implement real notification delivery, and model portfolios as separate holdings/transactions if multi-portfolio support is required.
- Add unit tests for reducers/calculations, integration tests for workflows, and browser tests for responsive navigation and key pages.

## 10. Interview preparation

### A truthful two-minute walkthrough

1. Start at Market Overview and point out that the UI explicitly labels its market snapshot as demo data.
2. Search for a symbol and open Company Research; explain the query parameter, generated statements/ratios, and JSON export.
3. Open Technical Analysis or Comparison; explain how the plotted data is generated and how the indicator calculations are separated into `src/lib/indicators.js`.
4. Add a symbol to a watchlist and explain Redux actions/selectors and browser-local persistence.
5. Place a small market order in Paper Trading; explain validation, order state, position accounting, and how the account totals are recomputed.
6. Finish on Risk Analytics or Backtesting and proactively state that their inputs are synthetic, so they demonstrate logic and UX rather than predictive performance.

### Common questions and answer cues

**Why Redux Toolkit?**  
The same simulated stocks, orders, positions, alerts, settings, and watchlists are needed on multiple routes. Slices make their actions/reducers explicit; selectors centralize and memoize derived values.

**Why use localStorage and IndexedDB?**  
They make the prototype usable across reloads without a backend. IndexedDB stores structured slice snapshots; localStorage is used by some slices for simple saved preferences/lists. Both are local to the current browser and are not production user persistence.

**How do you prevent made-up data from looking live?**  
The interface labels demo/illustrative data, and the project has no quote API connection. In an interview, state that explicitly before discussing the financial UI.

**How does a market order move through the app?**  
The page validates inputs, dispatches `placeOrder`, the trading reducer records a pending order, immediately calls its market execution path, validates cash or shares, updates the position/cash, records the transaction, and recalculates account values.

**What happens to a limit order?**  
It is recorded as pending. There is no background matcher in the current implementation; the UI can cancel pending orders. Avoid implying that a limit/stop order is automatically filled.

**How are the charts rendered?**  
Pages build an ECharts option object from state/derived arrays and pass it to the shared wrapper. The wrapper creates the chart, calls `setOption` when props change, resizes, and disposes on unmount.

**How would you make the market data real?**  
Create a separate market-data client/service, map provider responses into the existing stock/quote shape, handle loading/error/staleness and market times, then dispatch normalized updates. Avoid placing provider or secret credentials in browser code.

**What is the strongest engineering story?**  
Describe the end-to-end simulated paper-trading flow and the separation between UI pages, Redux state transitions, selector-derived values, and local persistence. Then clearly separate demo limitations from production requirements.

### Resume bullets (accurate for this codebase)

- Built a responsive 16-module financial-market dashboard using Next.js App Router, React, Redux Toolkit, Tailwind CSS, and ECharts.
- Implemented local simulated paper trading, account/position calculations, watchlists, screen filters, alert evaluation, technical indicators, and strategy backtesting.
- Added browser-local IndexedDB/`localStorage` persistence, responsive module navigation, cross-module symbol deep links, and configurable dark/light themes.

If you use these bullets, be ready to clarify that all financial data is simulated/local and no broker or live-market service is connected.

## 11. Suggested code-reading order

To understand the implementation quickly, follow this sequence:

1. [`src/app/layout.js`](./src/app/layout.js) — application providers and shell.
2. [`src/components/layout/app-shell.jsx`](./src/components/layout/app-shell.jsx) — routes, search, responsive navigation.
3. [`src/store/index.js`](./src/store/index.js) and [`src/store/selectors.js`](./src/store/selectors.js) — store initialization, hydration, selectors.
4. [`src/store/slices/tradingSlice.js`](./src/store/slices/tradingSlice.js) — order lifecycle and account arithmetic.
5. [`src/data/stocks-combined.js`](./src/data/stocks-combined.js) and [`src/lib/simulations.js`](./src/lib/simulations.js) — local stock universe and generated data.
6. [`src/lib/indicators.js`](./src/lib/indicators.js) and [`src/lib/calculations.js`](./src/lib/calculations.js) — technical and portfolio/risk calculations.
7. Read one vertical workflow end to end: `src/app/paper-trading/page.jsx` → trading slice → selectors → `src/app/portfolio-manager/page.jsx`.
8. Read the other modules in the route table and compare their inputs to the data-boundary notes above.

## 12. Verification snapshot

The reviewed build was validated after the watchlist selector correction:

- `npm run build` completed and generated the application routes.
- ESLint passed for the changed Watchlists page.
- All 16 module routes returned HTTP 200 and rendered a page heading in the browser.
- The browser route sweep reported no uncaught page errors.
- Watchlist creation, selecting a stock, confirming it appears in the list, removing it, and cleaning up the test list were verified.
- Responsive mobile navigation opened, navigated to Trading Terminal, and closed as expected.

This is a focused build and browser smoke check, not a claim that the project has exhaustive unit, integration, or production market-data tests.


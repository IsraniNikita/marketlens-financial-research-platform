import { createSelector } from '@reduxjs/toolkit'

export const selectMarket = (state) => state.market
export const selectStocks = (state) => state.market.stockList || []
export const selectStockBySymbol = (state, symbol) => state.market.stocks[symbol] || null
export const selectIndices = (state) => state.market.indices || []
export const selectSectorPerformance = (state) => state.market.sectorPerformance || []
export const selectMarketBreadth = (state) => state.market.marketBreadth
export const selectGlobalSearchResults = (state) => state.market.globalSearchResults || []

export const selectWatchlists = (state) => state.watchlist.watchlists || []
export const selectActiveWatchlist = createSelector(
  [(state) => state.watchlist.watchlists, (state) => state.watchlist.activeId],
  (lists, id) => lists.find((w) => w.id === id) || null
)
export const selectWatchlistStocks = createSelector(
  [(state) => state.watchlist.watchlists, (state, id) => id],
  (lists, id) => {
    const wl = lists.find((w) => w.id === id)
    return wl ? wl.stocks : []
  }
)

export const selectAccount = (state) => state.trading.account
export const selectOrders = (state) => state.trading.orders || []
export const selectPositions = (state) => state.trading.positions || {}
export const selectTransactions = (state) => state.trading.transactions || []
export const selectPendingOrders = createSelector(
  [(state) => state.trading.orders],
  (orders) => orders.filter((o) => o.status === 'PENDING')
)

export const selectPortfolios = (state) => state.portfolio.portfolios || []
export const selectActivePortfolio = createSelector(
  [(state) => state.portfolio.portfolios, (state) => state.portfolio.activePortfolioId],
  (list, id) => list.find((p) => p.id === id) || null
)
export const selectPerformanceHistory = (state) => state.portfolio.performanceHistory || []

export const selectAlerts = (state) => state.alerts.alerts || []
export const selectActiveAlerts = createSelector(
  [(state) => state.alerts.alerts],
  (alerts) => alerts.filter((a) => a.active && !a.paused)
)
export const selectTriggeredHistory = (state) => state.alerts.triggeredHistory || []

export const selectSettings = (state) => state.settings
export const selectTerminal = (state) => state.terminal
export const selectScreener = (state) => state.screener
export const selectScreenerResults = (state) => state.screener.results || []

export const selectPortfolioMetrics = createSelector(
  [selectPositions, (state) => state.market.stocks],
  (positions, stocks) => {
    let invested = 0, current = 0
    const items = []
    for (const sym of Object.keys(positions)) {
      const pos = positions[sym]
      if (!pos || pos.qty <= 0) continue
      const stock = stocks[sym]
      const price = stock ? stock.price : (pos.currentPrice || pos.avgPrice)
      const inv = pos.avgPrice * pos.qty
      const cur = price * pos.qty
      invested += inv
      current += cur
      items.push({ symbol: sym, qty: pos.qty, avgPrice: pos.avgPrice, price, invested: inv, current: cur, pnl: cur - inv, pnlPct: inv ? ((cur - inv) / inv) * 100 : 0, name: stock ? stock.name : sym })
    }
    return { invested, current, pnl: current - invested, pnlPct: invested ? ((current - invested) / invested) * 100 : 0, items }
  }
)

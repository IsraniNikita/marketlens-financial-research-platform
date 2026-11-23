import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  orderBook: { bids: [], asks: [] },
  marketDepth: [],
  timeframe: '1D',
  chartType: 'candlestick',
  indicators: [],
  panels: { watchlist: true, chart: true, orderbook: true, depth: true, tradehistory: true, positions: true, info: true, indicators: true },
  fullscreenSymbol: null,
  selectedSymbol: 'RELIANCE',
}

const terminalSlice = createSlice({
  name: 'terminal',
  initialState,
  reducers: {
    setSelectedSymbol(state, action) { state.selectedSymbol = action.payload },
    setOrderBook(state, action) { state.orderBook = action.payload },
    setMarketDepth(state, action) { state.marketDepth = action.payload },
    setTimeframe(state, action) { state.timeframe = action.payload },
    setChartType(state, action) { state.chartType = action.payload },
    addIndicator(state, action) { state.indicators.push(action.payload) },
    removeIndicator(state, action) { state.indicators = state.indicators.filter((i) => i.id !== action.payload) },
    togglePanel(state, action) { state.panels[action.payload] = !state.panels[action.payload] },
    setPanel(state, action) { state.panels[action.payload.panel] = action.payload.value },
    setFullscreenSymbol(state, action) { state.fullscreenSymbol = action.payload },
    resetWorkspace(state) { state.panels = { ...initialState.panels }; state.fullscreenSymbol = null },
  },
})

export const { setSelectedSymbol, setOrderBook, setMarketDepth, setTimeframe, setChartType, addIndicator, removeIndicator, togglePanel, setPanel, setFullscreenSymbol, resetWorkspace } = terminalSlice.actions
export default terminalSlice.reducer

import { createSlice } from '@reduxjs/toolkit'
import { ALL_STOCKS } from '@/data/stocks-combined'

const initialStocks = {}
ALL_STOCKS.forEach((stock) => { initialStocks[stock.symbol] = stock })

const initialState = {
  stocks: initialStocks,
  stockList: ALL_STOCKS,
  indices: [],
  globalSearchResults: [],
  sectorPerformance: [],
  marketBreadth: { advancing: 0, declining: 0, unchanged: 0, ratio: 0 },
  lastUpdate: null,
  status: 'idle',
}

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    setStocks(state, action) {
      const list = action.payload
      const map = {}
      list.forEach((s) => { map[s.symbol] = s })
      state.stocks = map
      state.stockList = list
      state.status = 'ready'
    },
    setIndices(state, action) {
      state.indices = action.payload
    },
    setGlobalSearchResults(state, action) {
      state.globalSearchResults = action.payload
    },
    setSectorPerformance(state, action) {
      state.sectorPerformance = action.payload
    },
    setMarketBreadth(state, action) {
      state.marketBreadth = action.payload
    },
    updatePrices(state, action) {
      const updates = action.payload
      updates.forEach((u) => {
        if (state.stocks[u.symbol]) {
          const s = state.stocks[u.symbol]
          s.price = u.price
          s.change = u.change
          s.changePct = u.changePct
          s.lastUpdate = u.lastUpdate
        }
      })
      state.lastUpdate = Date.now()
    },
  },
})

export const { setStocks, setIndices, setGlobalSearchResults, setSectorPerformance, setMarketBreadth, updatePrices } = marketSlice.actions
export default marketSlice.reducer

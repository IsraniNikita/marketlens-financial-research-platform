import { createSlice } from '@reduxjs/toolkit'

const loadPortfolios = () => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('fp-portfolios')
    return raw ? JSON.parse(raw) : []
  } catch (error) {
    console.warn('[Portfolio] Failed to load saved portfolios:', error)
    return []
  }
}

const initialPortfolios = loadPortfolios()
const initialState = {
  portfolios: initialPortfolios,
  activePortfolioId: initialPortfolios.length ? initialPortfolios[0].id : null,
  performanceHistory: [],
  allocations: {},
}

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    createPortfolio(state, action) {
      const p = { id: Date.now().toString(), name: action.payload.name, type: action.payload.type || 'custom', createdAt: Date.now() }
      state.portfolios.push(p)
      if (!state.activePortfolioId) state.activePortfolioId = p.id
      localStorage.setItem('fp-portfolios', JSON.stringify(state.portfolios))
    },
    renamePortfolio(state, action) {
      const p = state.portfolios.find((x) => x.id === action.payload.id)
      if (p) p.name = action.payload.name
      localStorage.setItem('fp-portfolios', JSON.stringify(state.portfolios))
    },
    deletePortfolio(state, action) {
      state.portfolios = state.portfolios.filter((x) => x.id !== action.payload)
      if (state.activePortfolioId === action.payload) {
        state.activePortfolioId = state.portfolios.length ? state.portfolios[0].id : null
      }
      localStorage.setItem('fp-portfolios', JSON.stringify(state.portfolios))
    },
    setActivePortfolio(state, action) {
      state.activePortfolioId = action.payload
    },
    setPerformanceHistory(state, action) {
      state.performanceHistory = action.payload
    },
    setAllocation(state, action) {
      state.allocations = action.payload
    },
    addPerformancePoint(state, action) {
      state.performanceHistory.push({ date: Date.now(), value: action.payload.value })
      if (state.performanceHistory.length > 500) state.performanceHistory.shift()
    },
  },
})

export const { createPortfolio, renamePortfolio, deletePortfolio, setActivePortfolio, setPerformanceHistory, setAllocation, addPerformancePoint } = portfolioSlice.actions
export default portfolioSlice.reducer

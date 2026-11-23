import { createSlice } from '@reduxjs/toolkit'

const defaultScreens = [
  { id: 's1', name: 'High ROE Low Debt', filters: { roeMin: 15, deMax: 1 } },
  { id: 's2', name: 'Undervalued Growth', filters: { peMax: 25 } },
  { id: 's3', name: 'Momentum Stocks', filters: { changePctMin: 2 } },
]

function loadSavedScreens() {
  if (typeof window === 'undefined') return defaultScreens
  try {
    const saved = localStorage.getItem('fp-screener-screens')
    return saved ? JSON.parse(saved) : defaultScreens
  } catch (error) {
    console.warn('[Screener] Failed to load saved screens:', error)
    return defaultScreens
  }
}

const initialState = {
  filters: {},
  results: [],
  savedScreens: loadSavedScreens(),
  activeScreen: null,
}

const screenerSlice = createSlice({
  name: 'screener',
  initialState,
  reducers: {
    setFilters(state, action) { state.filters = action.payload },
    setResults(state, action) { state.results = action.payload },
    saveScreen(state, action) {
      const screen = { id: Date.now().toString(), name: action.payload.name, filters: action.payload.filters, createdAt: Date.now() }
      state.savedScreens.push(screen)
      localStorage.setItem('fp-screener-screens', JSON.stringify(state.savedScreens))
    },
    deleteScreen(state, action) {
      state.savedScreens = state.savedScreens.filter((x) => x.id !== action.payload)
      localStorage.setItem('fp-screener-screens', JSON.stringify(state.savedScreens))
    },
    setActiveScreen(state, action) { state.activeScreen = action.payload },
    updateScreen(state, action) {
      const s = state.savedScreens.find((x) => x.id === action.payload.id)
      if (s) Object.assign(s, action.payload)
    },
  },
})

export const { setFilters, setResults, saveScreen, deleteScreen, setActiveScreen, updateScreen } = screenerSlice.actions
export default screenerSlice.reducer

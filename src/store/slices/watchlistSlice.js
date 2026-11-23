import { createSlice } from '@reduxjs/toolkit'

const loadWatchlists = () => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('fp-watchlists')
    return raw ? JSON.parse(raw) : []
  } catch (error) {
    console.warn('[Watchlists] Failed to load saved watchlists:', error)
    return []
  }
}

const initialState = {
  watchlists: loadWatchlists(),
  activeId: null,
}

const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
    createWatchlist(state, action) {
      const wl = { id: action.payload.id || Date.now().toString(), name: action.payload.name, stocks: [], notes: action.payload.notes || '', tags: [], createdAt: Date.now() }
      state.watchlists.push(wl)
      state.activeId = wl.id
      localStorage.setItem('fp-watchlists', JSON.stringify(state.watchlists))
    },
    renameWatchlist(state, action) {
      const wl = state.watchlists.find((w) => w.id === action.payload.id)
      if (wl) { wl.name = action.payload.name; localStorage.setItem('fp-watchlists', JSON.stringify(state.watchlists)) }
    },
    deleteWatchlist(state, action) {
      state.watchlists = state.watchlists.filter((w) => w.id !== action.payload)
      if (state.activeId === action.payload) state.activeId = state.watchlists.length ? state.watchlists[0].id : null
      localStorage.setItem('fp-watchlists', JSON.stringify(state.watchlists))
    },
    setActiveWatchlist(state, action) {
      state.activeId = action.payload
    },
    addToWatchlist(state, action) {
      const { watchlistId, symbol } = action.payload
      const wl = state.watchlists.find((w) => w.id === watchlistId)
      if (wl && !wl.stocks.includes(symbol)) {
        wl.stocks.push(symbol)
        localStorage.setItem('fp-watchlists', JSON.stringify(state.watchlists))
      }
    },
    removeFromWatchlist(state, action) {
      const { watchlistId, symbol } = action.payload
      const wl = state.watchlists.find((w) => w.id === watchlistId)
      if (wl) {
        wl.stocks = wl.stocks.filter((s) => s !== symbol)
        localStorage.setItem('fp-watchlists', JSON.stringify(state.watchlists))
      }
    },
    reorderWatchlist(state, action) {
      const { watchlistId, stocks } = action.payload
      const wl = state.watchlists.find((w) => w.id === watchlistId)
      if (wl) { wl.stocks = stocks; localStorage.setItem('fp-watchlists', JSON.stringify(state.watchlists)) }
    },
    setWatchlistNotes(state, action) {
      const wl = state.watchlists.find((w) => w.id === action.payload.id)
      if (wl) { wl.notes = action.payload.notes; localStorage.setItem('fp-watchlists', JSON.stringify(state.watchlists)) }
    },
  },
})

export const { createWatchlist, renameWatchlist, deleteWatchlist, setActiveWatchlist, addToWatchlist, removeFromWatchlist, reorderWatchlist, setWatchlistNotes } = watchlistSlice.actions
export default watchlistSlice.reducer

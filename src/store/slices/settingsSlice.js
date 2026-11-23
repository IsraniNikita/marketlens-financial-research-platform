import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  theme: 'dark',
  layout: 'comfortable',
  defaultExchange: 'NSE',
  defaultCurrency: 'INR',
  defaultTimeframe: '1D',
  defaultWatchlist: null,
  defaultPortfolio: null,
  workspaces: [
    { id: 'w1', name: 'Beginner', panels: ['watchlist', 'chart', 'positions'] },
    { id: 'w2', name: 'Technical Analysis', panels: ['chart', 'indicators', 'orderbook'] },
    { id: 'w3', name: 'Intraday', panels: ['orderbook', 'depth', 'tradehistory', 'positions'] },
    { id: 'w4', name: 'Portfolio Monitoring', panels: ['holdings', 'allocation', 'performance'] },
  ],
  activeWorkspace: 'w1',
  notifications: { email: false, push: true, sound: false },
  hydrated: false,
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    hydrateSettings(state, action) {
      Object.assign(state, action.payload, { hydrated: true })
    },
    setTheme(state, action) { state.theme = action.payload },
    setLayout(state, action) { state.layout = action.payload },
    setDefaultExchange(state, action) { state.defaultExchange = action.payload },
    setDefaultCurrency(state, action) { state.defaultCurrency = action.payload },
    setDefaultTimeframe(state, action) { state.defaultTimeframe = action.payload },
    setDefaultWatchlist(state, action) { state.defaultWatchlist = action.payload },
    setDefaultPortfolio(state, action) { state.defaultPortfolio = action.payload },
    setActiveWorkspace(state, action) { state.activeWorkspace = action.payload },
    addWorkspace(state, action) { state.workspaces.push(action.payload) },
    deleteWorkspace(state, action) {
      state.workspaces = state.workspaces.filter((w) => w.id !== action.payload)
      if (state.activeWorkspace === action.payload) state.activeWorkspace = state.workspaces[0]?.id
    },
    updateWorkspace(state, action) {
      const w = state.workspaces.find((x) => x.id === action.payload.id)
      if (w) Object.assign(w, action.payload)
    },
    setNotificationPref(state, action) {
      const k = action.payload.key
      state.notifications[k] = action.payload.value
    },
    saveSettings(state) {
      localStorage.setItem('fp-settings', JSON.stringify({
        theme: state.theme, layout: state.layout, defaultExchange: state.defaultExchange,
        defaultCurrency: state.defaultCurrency, defaultTimeframe: state.defaultTimeframe,
        defaultWatchlist: state.defaultWatchlist, defaultPortfolio: state.defaultPortfolio,
        workspaces: state.workspaces, activeWorkspace: state.activeWorkspace, notifications: state.notifications,
      }))
    },
    resetDemoAccount(state) {
      Object.assign(state, initialState, { hydrated: true })
      localStorage.removeItem('fp-settings')
    },
  },
})

export const { hydrateSettings, setTheme, setLayout, setDefaultExchange, setDefaultCurrency, setDefaultTimeframe, setDefaultWatchlist, setDefaultPortfolio, setActiveWorkspace, addWorkspace, deleteWorkspace, updateWorkspace, setNotificationPref, saveSettings, resetDemoAccount } = settingsSlice.actions
export default settingsSlice.reducer

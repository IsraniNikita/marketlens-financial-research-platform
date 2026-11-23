import { createSlice } from '@reduxjs/toolkit'

const loadAlerts = () => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('fp-alerts')
    return raw ? JSON.parse(raw) : []
  } catch (error) {
    console.warn('[Alerts] Failed to load saved alerts:', error)
    return []
  }
}

const initialState = {
  alerts: loadAlerts(),
  triggeredHistory: [],
}

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    createAlert(state, action) {
      const alert = {
        id: Date.now().toString(),
        symbol: action.payload.symbol,
        type: action.payload.type,
        condition: action.payload.condition,
        value: Number(action.payload.value),
        active: true,
        paused: false,
        triggered: false,
        createdAt: Date.now(),
        triggeredAt: null,
        message: action.payload.message || '',
      }
      state.alerts.push(alert)
      localStorage.setItem('fp-alerts', JSON.stringify(state.alerts))
    },
    editAlert(state, action) {
      const a = state.alerts.find((x) => x.id === action.payload.id)
      if (a) {
        a.type = action.payload.type
        a.condition = action.payload.condition
        a.value = Number(action.payload.value)
        a.message = action.payload.message || ''
        localStorage.setItem('fp-alerts', JSON.stringify(state.alerts))
      }
    },
    deleteAlert(state, action) {
      state.alerts = state.alerts.filter((x) => x.id !== action.payload)
      localStorage.setItem('fp-alerts', JSON.stringify(state.alerts))
    },
    toggleAlert(state, action) {
      const a = state.alerts.find((x) => x.id === action.payload)
      if (a) { a.active = !a.active; localStorage.setItem('fp-alerts', JSON.stringify(state.alerts)) }
    },
    pauseAlert(state, action) {
      const a = state.alerts.find((x) => x.id === action.payload)
      if (a) { a.paused = true; localStorage.setItem('fp-alerts', JSON.stringify(state.alerts)) }
    },
    resumeAlert(state, action) {
      const a = state.alerts.find((x) => x.id === action.payload)
      if (a) { a.paused = false; localStorage.setItem('fp-alerts', JSON.stringify(state.alerts)) }
    },
    setAlertTriggered(state, action) {
      const { id, price, message } = action.payload
      const a = state.alerts.find((x) => x.id === id)
      if (a && !a.triggered) {
        a.triggered = true
        a.triggeredAt = Date.now()
        localStorage.setItem('fp-alerts', JSON.stringify(state.alerts))
        state.triggeredHistory.unshift({
          id: Date.now().toString(),
          alertId: id,
          symbol: a.symbol,
          message: message || `Alert triggered for ${a.symbol}`,
          price,
          triggeredAt: Date.now(),
          read: false,
        })
      }
    },
    resetAlert(state, action) {
      const a = state.alerts.find((x) => x.id === action.payload)
      if (a) { a.triggered = false; a.triggeredAt = null; localStorage.setItem('fp-alerts', JSON.stringify(state.alerts)) }
    },
    markAlertRead(state, action) {
      const h = state.triggeredHistory.find((x) => x.id === action.payload)
      if (h) h.read = true
    },
    evaluateAlerts(state, action) {
      const prices = action.payload
      state.alerts.forEach((a) => {
        if (!a.active || a.paused || a.triggered) return
        const quote = prices[a.symbol]
        const price = typeof quote === 'number' ? quote : quote?.price
        const changePct = typeof quote === 'number' ? null : quote?.changePct
        if (price == null) return
        let fired = false
        let msg = ''
        if (a.type === 'priceAbove' && price >= a.value) { fired = true; msg = `${a.symbol} is now ₹${price.toFixed(2)}, above your target of ₹${a.value}` }
        else if (a.type === 'priceBelow' && price <= a.value) { fired = true; msg = `${a.symbol} is now ₹${price.toFixed(2)}, below your target of ₹${a.value}` }
        else if (a.type === 'pctAbove' && changePct != null && changePct >= a.value) { fired = true; msg = `${a.symbol} is up ${changePct.toFixed(2)}%, above your ${a.value}% threshold` }
        else if (a.type === 'pctBelow' && changePct != null && changePct <= -Math.abs(a.value)) { fired = true; msg = `${a.symbol} is down ${Math.abs(changePct).toFixed(2)}%, below your -${Math.abs(a.value)}% threshold` }
        if (fired) {
          a.triggered = true; a.triggeredAt = Date.now()
          state.triggeredHistory.unshift({
            id: Date.now().toString(), alertId: a.id, symbol: a.symbol, message: msg, price, triggeredAt: Date.now(), read: false,
          })
        }
      })
      localStorage.setItem('fp-alerts', JSON.stringify(state.alerts))
    },
  },
})

export const { createAlert, editAlert, deleteAlert, toggleAlert, pauseAlert, resumeAlert, setAlertTriggered, resetAlert, markAlertRead, evaluateAlerts } = alertsSlice.actions
export default alertsSlice.reducer

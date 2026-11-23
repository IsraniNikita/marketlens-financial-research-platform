import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  account: {
    initialCapital: 1000000,
    availableCash: 1000000,
    investedValue: 0,
    portfolioValue: 1000000,
    realizedPnL: 0,
    unrealizedPnL: 0,
    totalReturn: 0,
    totalReturnPct: 0,
  },
  orders: [],
  positions: {},
  transactions: [],
  nextOrderId: 1,
}

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    setInitialCapital(state, action) {
      const cap = Number(action.payload)
      state.account.initialCapital = cap
      state.account.availableCash = cap
      state.account.portfolioValue = cap
    },
    placeOrder(state, action) {
      const { symbol, side, qty, type, price, stopPrice, marketPrice } = action.payload
      const orderId = 'ORD-' + String(state.nextOrderId++).padStart(6, '0')
      const order = {
        id: orderId,
        symbol,
        side,
        qty: Number(qty),
        type,
        price: type === 'MARKET' ? null : Number(price),
        stopPrice: stopPrice ? Number(stopPrice) : null,
        status: 'PENDING',
        createdAt: Date.now(),
        executedAt: null,
        executionPrice: null,
      }
      state.orders.push(order)

      if (type === 'MARKET') {
        executeOrderById(state, orderId, marketPrice)
      }
      recalculateAccount(state)
      return state
    },
    cancelOrder(state, action) {
      const order = state.orders.find((o) => o.id === action.payload)
      if (order && order.status === 'PENDING') {
        order.status = 'CANCELLED'
      }
    },
    executeOrder(state, action) {
      const { orderId, executionPrice } = action.payload
      executeFilled(state, orderId, executionPrice)
      recalculateAccount(state)
    },
    rejectOrder(state, action) {
      const order = state.orders.find((o) => o.id === action.payload)
      if (order && order.status === 'PENDING') {
        order.status = 'REJECTED'
        order.executedAt = Date.now()
      }
    },
    updatePositionPrice(state, action) {
      const { symbol, price } = action.payload
      const pos = state.positions[symbol]
      if (pos) {
        pos.currentPrice = Number(price)
        recalculateAccount(state)
      }
    },
    recalcAccount(state) {
      recalculateAccount(state)
    },
    resetTradingAccount() {
      return {
        ...initialState,
        account: { ...initialState.account },
        orders: [],
        positions: {},
        transactions: [],
      }
    },
  },
})

function executeFilled(state, orderId, execPrice) {
  const order = state.orders.find((o) => o.id === orderId)
  if (!order || order.status !== 'PENDING') return
  const { symbol, side, qty } = order
  const price = execPrice != null ? Number(execPrice) : Number(order.price)
  if (!Number.isFinite(price) || price <= 0) return

  let tradePnL = null
  if (side === 'BUY') {
    const cost = price * qty
    if (cost > state.account.availableCash) {
      order.status = 'REJECTED'
      order.executedAt = Date.now()
      return
    }
    state.account.availableCash -= cost
    const pos = state.positions[symbol] || { qty: 0, avgPrice: 0, currentPrice: price }
    const newQty = pos.qty + qty
    pos.avgPrice = newQty ? ((pos.avgPrice * pos.qty) + cost) / newQty : price
    pos.qty = newQty
    pos.currentPrice = price
    state.positions[symbol] = pos
  } else {
    const pos = state.positions[symbol]
    if (!pos || pos.qty < qty) {
      order.status = 'REJECTED'
      order.executedAt = Date.now()
      return
    }
    const proceeds = price * qty
    const realized = (price - pos.avgPrice) * qty
    tradePnL = realized
    state.account.availableCash += proceeds
    state.account.realizedPnL += realized
    pos.qty -= qty
    if (pos.qty === 0) {
      pos.avgPrice = 0
    }
    pos.currentPrice = price
    state.positions[symbol] = pos
  }

  order.status = 'EXECUTED'
  order.executionPrice = price
  order.executedAt = Date.now()

  state.transactions.push({
    id: 'TXN-' + String(state.nextOrderId++).padStart(6, '0'),
    orderId,
    symbol,
    side,
    qty,
    price,
    pnl: tradePnL,
    executedAt: Date.now(),
  })
}

function executeOrderById(state, orderId, marketPrice) {
  const order = state.orders.find((o) => o.id === orderId)
  if (!order || order.status !== 'PENDING') return
  const pos = state.positions[order.symbol]
  const price = marketPrice || (pos && pos.currentPrice) || order.price
  executeFilled(state, orderId, price)
}

function recalculateAccount(state) {
  let investedValue = 0
  let currentValue = 0
  for (const position of Object.values(state.positions)) {
    if (position.qty <= 0) continue
    investedValue += position.avgPrice * position.qty
    currentValue += (position.currentPrice ?? position.avgPrice) * position.qty
  }
  state.account.investedValue = investedValue
  state.account.unrealizedPnL = currentValue - investedValue
  state.account.portfolioValue = state.account.availableCash + currentValue
  state.account.totalReturn = state.account.portfolioValue - state.account.initialCapital
  state.account.totalReturnPct = state.account.initialCapital
    ? (state.account.totalReturn / state.account.initialCapital) * 100
    : 0
}

export const { placeOrder, cancelOrder, executeOrder, rejectOrder, updatePositionPrice, recalcAccount, resetTradingAccount, setInitialCapital } = tradingSlice.actions
export default tradingSlice.reducer

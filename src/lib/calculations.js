export function pnl(buyPrice, sellPrice, qty) {
  return (sellPrice - buyPrice) * qty
}

export function pnlPct(buyPrice, sellPrice) {
  if (!buyPrice) return 0
  return ((sellPrice - buyPrice) / buyPrice) * 100
}

export function avgBuyPrice(transactions) {
  let totalQty = 0, totalCost = 0
  for (const t of transactions) {
    if (t.type === 'BUY') { totalQty += t.qty; totalCost += t.price * t.qty }
  }
  return totalQty ? totalCost / totalQty : 0
}

export function holdingQty(transactions) {
  let qty = 0
  for (const t of transactions) {
    if (t.type === 'BUY') qty += t.qty
    else if (t.type === 'SELL') qty -= t.qty
  }
  return qty
}

export function portfolioMetrics(holdings, prices) {
  let invested = 0, current = 0
  for (const h of holdings) {
    const p = prices[h.symbol] || h.avgPrice
    invested += h.avgPrice * h.qty
    current += p * h.qty
  }
  return { invested, current, pnl: current - invested, pnlPct: invested ? ((current - invested) / invested) * 100 : 0 }
}

export function allocationBySymbol(holdings, prices) {
  let total = 0
  const map = {}
  for (const h of holdings) {
    const p = prices[h.symbol] || h.avgPrice
    const v = p * h.qty
    map[h.symbol] = { qty: h.qty, value: v, symbol: h.symbol }
    total += v
  }
  const out = Object.values(map).map((m) => ({ ...m, pct: total ? (m.value / total) * 100 : 0 }))
  return { total, items: out }
}

export function returnsSeries(prices) {
  const rets = []
  for (let i = 1; i < prices.length; i++) rets.push((prices[i] - prices[i - 1]) / prices[i - 1])
  return rets
}

export function stdDev(values) {
  const n = values.length
  if (!n) return 0
  const mean = values.reduce((a, b) => a + b, 0) / n
  const v = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n
  return Math.sqrt(v)
}

export function volatility(prices, annualize = 252) {
  const rets = returnsSeries(prices)
  return stdDev(rets) * Math.sqrt(annualize) * 100
}

export function maxDrawdown(values) {
  let peak = -Infinity, maxDD = 0
  for (const v of values) {
    if (v > peak) peak = v
    const dd = peak ? (peak - v) / peak * 100 : 0
    if (dd > maxDD) maxDD = dd
  }
  return maxDD
}

export function sharpeRatio(returns, riskFree = 0.06, annualize = 252) {
  if (!returns.length) return 0
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  const sd = stdDev(returns)
  return sd ? ((mean * annualize - riskFree) / (sd * Math.sqrt(annualize))) : 0
}

export function beta(stockReturns, marketReturns) {
  let n = Math.min(stockReturns.length, marketReturns.length)
  if (!n) return 0
  let sx = 0, sy = 0, sxy = 0, sxx = 0
  for (let i = 0; i < n; i++) {
    sx += marketReturns[i]; sy += stockReturns[i]
    sxy += marketReturns[i] * stockReturns[i]; sxx += marketReturns[i] * marketReturns[i]
  }
  const mx = sx / n, my = sy / n
  let cov = 0, varx = 0
  for (let i = 0; i < n; i++) {
    cov += (marketReturns[i] - mx) * (stockReturns[i] - my)
    varx += (marketReturns[i] - mx) ** 2
  }
  return varx ? cov / varx : 0
}

export function correlation(a, b) {
  let n = Math.min(a.length, b.length)
  if (!n) return 0
  let ma = a.reduce((x, y) => x + y, 0) / n, mb = b.reduce((x, y) => x + y, 0) / n
  let num = 0, da = 0, db = 0
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb)
    da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2
  }
  const den = Math.sqrt(da * db)
  return den ? num / den : 0
}

export function valueAtRisk(returns, confidence = 0.95) {
  if (!returns.length) return 0
  const n = returns.length
  const sorted = [...returns].sort((x, y) => x - y)
  const idx = Math.floor((1 - confidence) * n)
  return Math.abs(sorted[Math.max(0, Math.min(n - 1, idx))]) * 100
}

export function cagr(start, end, years) {
  if (!years || start <= 0) return 0
  return ((end / start) ** (1 / years) - 1) * 100
}

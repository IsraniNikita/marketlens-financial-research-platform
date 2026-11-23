import { nanoid } from 'nanoid'

function stableValue(seed) {
  let hash = 2166136261
  for (const character of seed) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  }
  return (hash >>> 0) / 4294967295
}

export function generateOHLCV(symbol, basePrice, days = 200, volatility = 0.02) {
  const data = []
  let price = basePrice
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  for (let i = days - 1; i >= 0; i--) {
    const change = (Math.random() - 0.5) * 2 * volatility
    const open = price
    price = Math.max(open * (1 + change), open * 0.5)
    const high = open * (1 + Math.abs(Math.random() * volatility * 2))
    const low = open * (1 - Math.abs(Math.random() * volatility * 2))
    const close = price
    const volume = Math.floor(500000 + Math.random() * 4000000)
    data.push({
      symbol,
      time: now - i * dayMs,
      open: Number(open.toFixed(2)),
      high: Number(Math.max(open, high, close).toFixed(2)),
      low: Number(Math.min(open, low, close).toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    })
  }
  return data
}

export function simulateTick(stock) {
  const drift = (stock.changePct || 0) / 100
  const noise = (Math.random() - 0.5) * 0.003
  const pct = Math.max(-0.05, Math.min(0.05, drift * 0.1 + noise))
  const newPrice = Math.max(stock.price * (1 + pct), 0.01)
  const change = newPrice - stock.prevClose
  const changePct = (change / stock.prevClose) * 100
  return {
    ...stock,
    price: Number(newPrice.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePct: Number(changePct.toFixed(2)),
    lastUpdate: Date.now(),
  }
}

export function simulateMarket(stocks) {
  return stocks.map(simulateTick)
}

export function generateFinancials(symbol) {
  const rev = 10000 + stableValue(`${symbol}:revenue`) * 90000
  return {
    symbol,
    incomeStatement: [
      { period: 'FY24', revenue: Number(rev.toFixed(0)), expenses: Number((rev * 0.72).toFixed(0)), netProfit: Number((rev * 0.14).toFixed(0)), eps: Number((rev * 0.14 / 100).toFixed(2)) },
      { period: 'FY23', revenue: Number((rev * 0.9).toFixed(0)), expenses: Number((rev * 0.9 * 0.73).toFixed(0)), netProfit: Number((rev * 0.9 * 0.13).toFixed(0)), eps: Number((rev * 0.9 * 0.13 / 100).toFixed(2)) },
      { period: 'FY22', revenue: Number((rev * 0.8).toFixed(0)), expenses: Number((rev * 0.8 * 0.74).toFixed(0)), netProfit: Number((rev * 0.8 * 0.12).toFixed(0)), eps: Number((rev * 0.8 * 0.12 / 100).toFixed(2)) },
    ],
    balanceSheet: [
      { period: 'FY24', assets: Number((rev * 1.5).toFixed(0)), liabilities: Number((rev * 0.8).toFixed(0)), equity: Number((rev * 0.7).toFixed(0)), cash: Number((rev * 0.15).toFixed(0)) },
      { period: 'FY23', assets: Number((rev * 1.35).toFixed(0)), liabilities: Number((rev * 0.75).toFixed(0)), equity: Number((rev * 0.65).toFixed(0)), cash: Number((rev * 0.12).toFixed(0)) },
    ],
    cashFlow: [
      { period: 'FY24', operating: Number((rev * 0.18).toFixed(0)), investing: Number((-rev * 0.05).toFixed(0)), financing: Number((-rev * 0.02).toFixed(0)), net: Number((rev * 0.11).toFixed(0)) },
      { period: 'FY23', operating: Number((rev * 0.16).toFixed(0)), investing: Number((-rev * 0.04).toFixed(0)), financing: Number((-rev * 0.01).toFixed(0)), net: Number((rev * 0.11).toFixed(0)) },
    ],
  }
}

export function generateRatios(symbol) {
  return {
    pe: 15 + stableValue(`${symbol}:pe`) * 35,
    pb: 1 + stableValue(`${symbol}:pb`) * 8,
    eps: 10 + stableValue(`${symbol}:eps`) * 100,
    roe: 8 + stableValue(`${symbol}:roe`) * 25,
    roce: 8 + stableValue(`${symbol}:roce`) * 25,
    debtToEquity: stableValue(`${symbol}:debt`) * 1.5,
    currentRatio: 1 + stableValue(`${symbol}:current-ratio`) * 2,
    operatingMargin: 10 + stableValue(`${symbol}:operating-margin`) * 20,
    netProfitMargin: 5 + stableValue(`${symbol}:net-margin`) * 15,
    dividendYield: stableValue(`${symbol}:dividend`) * 3,
  }
}

export const NEWS = [
  { id: 'n1', title: 'Reliance Industries Q2 earnings beat estimates', summary: 'Reliance reported a 12% YoY rise in net profit driven by retail and Jio segments.', source: 'Market Pulse', time: '2h ago', category: 'Market', sentiment: 'positive', related: ['RELIANCE'] },
  { id: 'n2', title: 'RBI keeps repo rate unchanged at 6.5%', summary: 'The Monetary Policy Committee voted to maintain the policy rate amid inflation concerns.', source: 'Economic Times', time: '5h ago', category: 'Economy', sentiment: 'neutral', related: ['HDFCBANK', 'ICICIBANK', 'SBIN'] },
  { id: 'n3', title: 'TCS wins large deal from European banking client', summary: 'Infosys rival TCS secures multi-year digital transformation contract.', source: 'Tech Circle', time: '1d ago', category: 'Company', sentiment: 'positive', related: ['TCS'] },
  { id: 'n4', title: 'Crude oil prices surge on Middle East tensions', summary: 'Brent crude trades above $90 as geopolitical risks escalate.', source: 'Energy Watch', time: '1d ago', category: 'Global', sentiment: 'negative', related: ['RELIANCE', 'ONGC', 'BPCL'] },
  { id: 'n5', title: 'Nifty IT index outperforms broader market', summary: 'IT stocks gain on expectation of increased discretionary spending.', source: 'Market Pulse', time: '2d ago', category: 'Sector', sentiment: 'positive', related: ['INFY', 'WIPRO', 'HCLTECH'] },
]

export const EVENTS = [
  { id: 'e1', symbol: 'RELIANCE', event: 'Earnings', date: '2027-01-15', description: 'Q3 FY27 earnings release (demo schedule)', impact: 'medium' },
  { id: 'e2', symbol: 'TCS', event: 'Dividend', date: '2027-02-01', description: 'Final dividend date (demo schedule)', impact: 'low' },
  { id: 'e3', symbol: 'HDFCBANK', event: 'Earnings', date: '2027-01-20', description: 'Q3 FY27 earnings release (demo schedule)', impact: 'high' },
  { id: 'e4', symbol: 'INFY', event: 'Stock Split', date: '2027-03-01', description: '1:1 stock split proposal (demo schedule)', impact: 'medium' },
]

export function nextId() {
  return nanoid()
}

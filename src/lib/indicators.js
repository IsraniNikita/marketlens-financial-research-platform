export function sma(data, period) {
  const out = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { out.push(null); continue }
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += data[j]
    out.push(sum / period)
  }
  return out
}

export function ema(data, period) {
  const out = []
  const k = 2 / (period + 1)
  let prev = null
  for (let i = 0; i < data.length; i++) {
    if (prev === null) {
      if (i < period - 1) { out.push(null); continue }
      let sum = 0
      for (let j = i - period + 1; j <= i; j++) sum += data[j]
      prev = sum / period
    } else {
      prev = data[i] * k + prev * (1 - k)
    }
    out.push(prev)
  }
  return out
}

export function macd(data, fast = 12, slow = 26, signal = 9) {
  const emaFast = ema(data, fast)
  const emaSlow = ema(data, slow)
  const macdLine = data.map((_, i) => (emaFast[i] == null || emaSlow[i] == null) ? null : emaFast[i] - emaSlow[i])
  const validMacd = macdLine.filter((v) => v != null)
  const rawSignalLine = ema(validMacd, signal)
  const signalOffset = macdLine.length - validMacd.length
  const signalLine = macdLine.map((_, i) => i < signalOffset ? null : rawSignalLine[i - signalOffset])
  const histogram = macdLine.map((v, i) => v == null ? null : (signalLine[i] == null ? null : v - signalLine[i]))
  return { macdLine, signalLine, histogram }
}

export function rsi(data, period = 14) {
  const out = []
  let gains = 0, losses = 0
  for (let i = 1; i < data.length; i++) {
    const ch = data[i] - data[i - 1]
    if (ch >= 0) gains += ch; else losses -= ch
    if (i < period) { out.push(null); continue }
    if (i === period) {
      const avgG = gains / period, avgL = losses / period
      const rs = avgL === 0 ? 100 : avgG / avgL
      out.push(100 - 100 / (1 + rs))
    } else {
      const ch = data[i] - data[i - 1]
      const g = ch > 0 ? ch : 0, l = ch < 0 ? -ch : 0
      gains = (gains * (period - 1) + g) / period
      losses = (losses * (period - 1) + l) / period
      const rs = losses === 0 ? 100 : gains / losses
      out.push(100 - 100 / (1 + rs))
    }
  }
  while (out.length < data.length) out.unshift(null)
  return out
}

export function stochastic(data, period = 14, smooth = 3) {
  const k = [], d = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { k.push(null); d.push(null); continue }
    let hh = -Infinity, ll = Infinity
    for (let j = i - period + 1; j <= i; j++) {
      if (data[j].high > hh) hh = data[j].high
      if (data[j].low < ll) ll = data[j].low
    }
    const val = hh === ll ? 50 : ((data[i].close - ll) / (hh - ll)) * 100
    k.push(val)
    if (k.length >= smooth && k.slice(-smooth).every((v) => v != null)) {
      const sum = k.slice(-smooth).reduce((a, b) => a + b, 0)
      d.push(sum / smooth)
    } else d.push(null)
  }
  return { k, d }
}

export function roc(data, period = 12) {
  const out = []
  for (let i = 0; i < data.length; i++) {
    if (i < period) { out.push(null); continue }
    out.push(((data[i] - data[i - period]) / data[i - period]) * 100)
  }
  return out
}

export function bollingerBands(data, period = 20, mult = 2) {
  const upper = [], middle = [], lower = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { upper.push(null); middle.push(null); lower.push(null); continue }
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += data[j]
    const avg = sum / period
    let sq = 0
    for (let j = i - period + 1; j <= i; j++) sq += (data[j] - avg) ** 2
    const sd = Math.sqrt(sq / period)
    middle.push(avg); upper.push(avg + mult * sd); lower.push(avg - mult * sd)
  }
  return { upper, middle, lower }
}

export function atr(data, period = 14) {
  const tr = []
  for (let i = 0; i < data.length; i++) {
    const h = data[i].high, l = data[i].low, c = i === 0 ? data[i].close : data[i - 1].close
    tr.push(Math.max(h - l, Math.abs(h - c), Math.abs(l - c)))
  }
  const out = []
  for (let i = 0; i < tr.length; i++) {
    if (i < period - 1) { out.push(null); continue }
    if (i === period - 1) {
      out.push(tr.slice(0, period).reduce((a, b) => a + b, 0) / period)
    } else {
      out.push((out[out.length - 1] * (period - 1) + tr[i]) / period)
    }
  }
  return out
}

export function vwap(data) {
  const out = []
  let tpVol = 0, vol = 0
  for (let i = 0; i < data.length; i++) {
    const tp = (data[i].high + data[i].low + data[i].close) / 3
    tpVol += tp * data[i].volume
    vol += data[i].volume
    out.push(vol ? tpVol / vol : tp)
  }
  return out
}

export function obv(data) {
  const out = []
  let v = 0
  for (let i = 0; i < data.length; i++) {
    if (i === 0) v = data[i].volume
    else if (data[i].close > data[i - 1].close) v += data[i].volume
    else if (data[i].close < data[i - 1].close) v -= data[i].volume
    out.push(v)
  }
  return out
}

export function stdDev(data, period = 20) {
  const out = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { out.push(null); continue }
    const win = data.slice(i - period + 1, i + 1)
    const m = win.reduce((a, b) => a + b, 0) / period
    const sq = win.reduce((a, b) => a + (b - m) ** 2, 0) / period
    out.push(Math.sqrt(sq))
  }
  return out
}

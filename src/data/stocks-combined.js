import { SECTORS, EXCHANGES, STOCKS } from './stocks'
import { STOCKS_MORE_A } from './stocks-more-a'
import { STOCKS_MORE_B } from './stocks-more-b'

export { SECTORS, EXCHANGES }
export const ALL_STOCKS = [...STOCKS, ...STOCKS_MORE_A, ...STOCKS_MORE_B]
export const STOCK_BY_SYMBOL = {}
ALL_STOCKS.forEach((s) => { STOCK_BY_SYMBOL[s.symbol] = s })

export function findStock(symbol) {
  return STOCK_BY_SYMBOL[symbol] || null
}

export function stocksBySector(sector) {
  return ALL_STOCKS.filter((s) => s.sector === sector)
}

/**
 * Data-shape documentation (JavaScript, no TypeScript).
 * These objects describe the shape of data used across the platform.
 */

/**
 * Canonical stock identity shared by all modules.
 * @typedef {Object} Stock
 * @property {string} symbol - Unique stock symbol (e.g. 'RELIANCE')
 * @property {string} name - Company name
 * @property {string} exchange - Exchange (NSE, BSE, NYSE, NASDAQ)
 * @property {string} sector - Sector (Banking, IT, Healthcare, etc.)
 * @property {number} price - Current price
 * @property {number} change - Absolute price change
 * @property {number} changePct - Percentage change
 * @property {number} marketCap - Market capitalization
 * @property {number} volume - Trading volume
 * @property {number} pe - P/E ratio
 * @property {number} eps - Earnings per share
 * @property {number} high52 - 52-week high
 * @property {number} low52 - 52-week low
 * @property {number} open - Open price
 * @property {number} prevClose - Previous close
 */

/**
 * OHLCV historical data point.
 * @typedef {Object} OHLCV
 * @property {string} symbol - Stock symbol
 * @property {number} time - Timestamp (ms)
 * @property {number} open - Open price
 * @property {number} high - High price
 * @property {number} low - Low price
 * @property {number} close - Close price
 * @property {number} volume - Volume
 */

/**
 * Trading order.
 * @typedef {Object} Order
 * @property {string} id - Order ID (e.g. 'ORD-000001')
 * @property {string} symbol - Stock symbol
 * @property {'BUY'|'SELL'} side - Buy or sell
 * @property {number} qty - Quantity
 * @property {'MARKET'|'LIMIT'|'STOP_LOSS'|'STOP_LIMIT'} type - Order type
 * @property {number|null} price - Limit price (null for market)
 * @property {number|null} stopPrice - Stop price
 * @property {'PENDING'|'EXECUTED'|'CANCELLED'|'REJECTED'} status
 * @property {number} createdAt - Timestamp
 * @property {number|null} executedAt - Execution timestamp
 * @property {number|null} executionPrice - Execution price
 */

/**
 * Portfolio holding.
 * @typedef {Object} Holding
 * @property {string} symbol - Stock symbol
 * @property {string} name - Company name
 * @property {string} sector - Sector
 * @property {number} qty - Quantity held
 * @property {number} avgPrice - Average purchase price
 * @property {number} price - Current price
 * @property {number} invested - Invested value
 * @property {number} current - Current value
 * @property {number} pnl - Profit/loss
 * @property {number} pnlPct - Profit/loss percentage
 */

/**
 * Virtual trading account.
 * @typedef {Object} Account
 * @property {number} initialCapital - Starting virtual capital
 * @property {number} availableCash - Available cash
 * @property {number} investedValue - Invested value
 * @property {number} portfolioValue - Total portfolio value
 * @property {number} realizedPnL - Realized P&L
 * @property {number} unrealizedPnL - Unrealized P&L
 * @property {number} totalReturn - Total return
 * @property {number} totalReturnPct - Total return percentage
 */

/**
 * Watchlist.
 * @typedef {Object} Watchlist
 * @property {string} id - Watchlist ID
 * @property {string} name - Watchlist name
 * @property {string[]} stocks - Array of stock symbols
 * @property {string} notes - Personal notes
 * @property {string[]} tags - Custom tags
 * @property {number} createdAt - Creation timestamp
 */

/**
 * Alert.
 * @typedef {Object} Alert
 * @property {string} id - Alert ID
 * @property {string} symbol - Stock symbol
 * @property {'priceAbove'|'priceBelow'|'pctAbove'|'pctBelow'|'volumeThreshold'|'rsiThreshold'|'maCondition'|'portfolioLoss'} type
 * @property {string} condition - Alert condition
 * @property {number} value - Threshold value
 * @property {boolean} active - Is alert active
 * @property {boolean} paused - Is alert paused
 * @property {boolean} triggered - Has alert triggered
 * @property {number} createdAt - Creation timestamp
 * @property {number|null} triggeredAt - Trigger timestamp
 * @property {string} message - Alert message
 */

/**
 * Transaction record.
 * @typedef {Object} Transaction
 * @property {string} id - Transaction ID
 * @property {string} orderId - Related order ID
 * @property {string} symbol - Stock symbol
 * @property {'BUY'|'SELL'} side
 * @property {number} qty - Quantity
 * @property {number} price - Execution price
 * @property {number} executedAt - Timestamp
 */

/**
 * Portfolio.
 * @typedef {Object} Portfolio
 * @property {string} id - Portfolio ID
 * @property {string} name - Portfolio name
 * @property {string} type - Portfolio type (long-term, short-term, experimental, custom)
 * @property {number} createdAt - Creation timestamp
 */

/**
 * Technical indicator result.
 * @typedef {Object} IndicatorResult
 * @property {string} name - Indicator name
 * @property {Array<number|null>} values - Indicator values (null for insufficient history)
 * @property {Object} params - Indicator parameters
 */

/**
 * Screen filter.
 * @typedef {Object} ScreenFilter
 * @property {string|null} marketCapMin
 * @property {string|null} peMax
 * @property {string|null} roeMin
 * @property {string|null} deMax
 * @property {string|null} dividendMin
 */

/**
 * Saved screen configuration.
 * @typedef {Object} SavedScreen
 * @property {string} id - Screen ID
 * @property {string} name - Screen name
 * @property {ScreenFilter} filters - Filter configuration
 * @property {number} createdAt - Creation timestamp
 */

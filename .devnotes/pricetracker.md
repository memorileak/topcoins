# Price Tracker Module

## The idea

- Listen to Binance price changes stream: [All Market Rolling Window Statistics Streams](https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams#all-market-rolling-window-statistics-streams).
- Window size: 1h, Stream name: `!ticker_1h@arr@3000ms`
- The stream will push every tokens with price changes back to system.
- System record new price.
- System index token prices in 1 minute interval (this is configurable).
- System calculates velocity, accleration each time it indexes new prices.

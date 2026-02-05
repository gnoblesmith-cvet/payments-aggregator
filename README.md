# payments-aggregator

A real-time payment aggregator application that displays and compares data from multiple payment processors (Worldpay and Stripe).

## Architecture

- **API Service** (`api-service/`): Node.js backend with Express and WebSocket support
- **UI Layer** (`ui-layer/`): React frontend with real-time visualization

## Features

1. **Charts & Comparison Page**: Visual analytics comparing Worldpay and Stripe
   - Transaction volume metrics
   - Revenue tracking
   - 24-hour trend analysis
   - Success vs declined rate comparison

2. **Live Transaction Feed**: Real-time stream of payments via WebSocket
   - Live transaction updates from Worldpay (simulated) and Stripe (real API)
   - Connection status indicator
   - Processor identification
   - Transaction status tracking (success, processing, declined)

3. **Stripe Integration**: Real-time polling of Stripe API
   - Fetches Payment Links and Charges
   - Includes failed charges
   - In-memory caching with configurable polling interval
   - Live WebSocket broadcast of new transactions

## Running the Application

### Environment Variables

The API service supports the following environment variables:

- `STRIPE_SECRET_KEY` (optional): Your Stripe secret API key for live Stripe integration
  - If not set, Stripe polling will be disabled and the app will log a warning
  - Format: `sk_test_...` (test mode) or `sk_live_...` (live mode)
- `STRIPE_POLL_INTERVAL_MS` (optional): Polling interval for Stripe API in milliseconds
  - Default: `30000` (30 seconds)
  - Minimum recommended: `10000` (10 seconds)

Example with environment variables:
```bash
cd api-service
export STRIPE_SECRET_KEY=sk_test_your_key_here
export STRIPE_POLL_INTERVAL_MS=30000
npm install
npm start
```

### Start the API Service
```bash
cd api-service
npm install
npm start
```

The API service will run on `http://localhost:3001`

### Start the UI Layer
```bash
cd ui-layer
npm install
npm run dev
```

The UI will be available at `http://localhost:3000`

## API Endpoints

- `GET /analytics/comparison` - Get aggregated payment statistics
- `GET /system/status` - Check system health
- `GET /stripe/payment-links` - Get cached list of Stripe Payment Links
- `GET /stripe/transactions` - Get cached list of Stripe transactions (includes failed charges)
- `WebSocket ws://localhost:3001` - Live payment feed

## Future Enhancements

- Webhook integration for real-time Stripe events
- Integration with actual Worldpay API
- Splunk log analysis capability
- Historical data persistence
- Advanced filtering and search
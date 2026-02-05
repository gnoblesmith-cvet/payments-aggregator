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
   - Live transaction updates
   - Connection status indicator
   - Processor identification
   - Transaction status tracking

## Running the Application

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
- `WebSocket ws://localhost:3001` - Live payment feed

## Future Enhancements

- Integration with actual Worldpay and Stripe APIs
- Splunk log analysis capability
- Historical data persistence
- Advanced filtering and search
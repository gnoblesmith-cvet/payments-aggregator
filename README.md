# payments-aggregator

A real-time payment aggregator application that displays and compares data from multiple payment processors via webhooks.

## Architecture

- **API Service** (`api-service/`): Node.js backend with Express and WebSocket support
- **UI Layer** (`ui-layer/`): React frontend with real-time visualization
- **Webhook Mocker** (`webhook-mocker/`): Mock webhook service for local development and testing

## Supported Payment Processors

The application now supports **five payment processors** via webhook integration:
1. **Stripe**
2. **Bluefin**
3. **WorldPay Integrated**
4. **Gravity**
5. **Covetrus Payment Processing**

## Features

1. **Charts & Comparison Page**: Visual analytics comparing all payment processors
   - Transaction volume metrics
   - Revenue tracking
   - 24-hour trend analysis
   - Success vs declined rate comparison

2. **Live Transaction Feed**: Real-time stream of payments via WebSocket
   - Live transaction updates from all five payment processors
   - Connection status indicator
   - Processor identification
   - Transaction status tracking (success, processing, declined)

3. **Webhook Integration**: Real-time payment data from all processors
   - Secure webhook endpoints for each payment processor
   - Signature verification for security
   - Live WebSocket broadcast of new transactions
   - Support for multiple transaction event types

## Running the Application

### Environment Variables

The API service supports the following environment variables for webhook signature verification:

- `STRIPE_WEBHOOK_SECRET` (optional): Your Stripe webhook signing secret for signature verification
  - Format: `whsec_...`
  - **IMPORTANT**: If not set, signature verification will be skipped (not recommended for production)
- `BLUEFIN_WEBHOOK_SECRET` (optional): Your Bluefin webhook secret
- `WORLDPAY_WEBHOOK_SECRET` (optional): Your WorldPay Integrated webhook secret
- `GRAVITY_WEBHOOK_SECRET` (optional): Your Gravity webhook secret
- `COVETRUS_WEBHOOK_SECRET` (optional): Your Covetrus Payment Processing webhook secret

**Security Note**: For production deployments, always configure webhook secrets. Without them, the application will accept unsigned webhooks, which is a security risk.

Example with environment variables:
```bash
cd api-service
export STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
export BLUEFIN_WEBHOOK_SECRET=your_bluefin_secret
export WORLDPAY_WEBHOOK_SECRET=your_worldpay_secret
export GRAVITY_WEBHOOK_SECRET=your_gravity_secret
export COVETRUS_WEBHOOK_SECRET=your_covetrus_secret
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

### Analytics & Status
- `GET /analytics/comparison` - Get aggregated payment statistics for all processors
- `GET /system/status` - Check system health

### Webhook Endpoints
Configure these URLs in your payment processor dashboards:
- `POST /webhooks/stripe` - Stripe webhook endpoint
- `POST /webhooks/bluefin` - Bluefin webhook endpoint
- `POST /webhooks/worldpay` - WorldPay Integrated webhook endpoint
- `POST /webhooks/gravity` - Gravity webhook endpoint
- `POST /webhooks/covetrus` - Covetrus Payment Processing webhook endpoint

### WebSocket
- `WebSocket ws://localhost:3001` - Live payment feed for all processors

## Webhook Configuration

### Setting Up Webhooks

For each payment processor, you'll need to configure webhook URLs in their respective dashboards:

1. **Stripe**: 
   - Go to Developers > Webhooks in your Stripe Dashboard
   - Add endpoint: `https://your-domain.com/webhooks/stripe`
   - Select events: `charge.succeeded`, `charge.failed`, `charge.pending`, `payment_intent.succeeded`, `payment_intent.payment_failed`

2. **Bluefin**:
   - Configure webhook URL: `https://your-domain.com/webhooks/bluefin`
   - Include signature header: `X-Bluefin-Signature`

3. **WorldPay Integrated**:
   - Configure webhook URL: `https://your-domain.com/webhooks/worldpay`
   - Include signature header: `X-Worldpay-Signature`

4. **Gravity**:
   - Configure webhook URL: `https://your-domain.com/webhooks/gravity`
   - Include signature header: `X-Gravity-Signature`

5. **Covetrus Payment Processing**:
   - Configure webhook URL: `https://your-domain.com/webhooks/covetrus`
   - Include signature header: `X-Covetrus-Signature`

### Testing Webhooks Locally

#### Option 1: Using the Webhook Mocker (Recommended for Local Development)

For quick local testing without external dependencies, use the included webhook mocker service:

```bash
# Terminal 1: Start the API service
cd api-service
npm install
npm start

# Terminal 2: Start the UI layer
cd ui-layer
npm install
npm run dev

# Terminal 3: Start the webhook mocker
cd webhook-mocker
npm install
npm start
```

The webhook mocker will automatically send mock webhooks for all five payment processors to your local API service. Open http://localhost:3000 to see live mock transactions.

#### Option 2: Using Real Payment Processor Webhooks

For testing with actual payment processor webhooks, use a tool like ngrok to expose your local server:

```bash
# In one terminal, start the API service
cd api-service
npm start

# In another terminal, start ngrok
ngrok http 3001
```

Then use the ngrok URL (e.g., `https://abc123.ngrok.io/webhooks/stripe`) in your payment processor webhook configuration.

## Future Enhancements

- Historical data persistence (database integration)
- Advanced filtering and search
- Webhook retry mechanism
- Rate limiting for webhook endpoints
- Analytics dashboard enhancements
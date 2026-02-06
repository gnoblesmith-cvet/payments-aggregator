# Webhook Mocker Service

A standalone Node.js service that generates and sends mock webhook traffic to the payment aggregator API service. This service simulates webhooks from all five supported payment processors.

## Purpose

This service is used for local development and testing, allowing you to see live transaction data flowing through the application without needing to configure real payment processor webhooks or expose your local server to the internet.

## Supported Payment Processors

The webhook mocker generates mock webhooks for:
1. **Stripe** - Simulates charge and payment intent events
2. **Bluefin** - Simulates transaction notifications
3. **WorldPay Integrated** - Simulates payment status updates
4. **Gravity** - Simulates payment events
5. **Covetrus Payment Processing** - Simulates clinic payment notifications

## Installation

```bash
cd webhook-mocker
npm install
```

## Usage

### Basic Usage

Start the webhook mocker (sends webhooks to http://localhost:3001 by default):

```bash
npm start
```

The service will start sending mock webhooks every 3 seconds (by default) to the API service.

### Configuration

The webhook mocker supports the following environment variables:

- `API_SERVICE_URL` (optional): Target URL for the API service
  - Default: `http://localhost:3001`
  - Example: `http://localhost:8080`

- `WEBHOOK_INTERVAL_MS` (optional): Time between mock webhook sends in milliseconds
  - Default: `3000` (3 seconds)
  - Example: `5000` (5 seconds)

- Webhook secrets (optional, should match api-service configuration):
  - `STRIPE_WEBHOOK_SECRET` (default: `test_webhook_secret_stripe`)
  - `BLUEFIN_WEBHOOK_SECRET` (default: `test_webhook_secret_bluefin`)
  - `WORLDPAY_WEBHOOK_SECRET` (default: `test_webhook_secret_worldpay`)
  - `GRAVITY_WEBHOOK_SECRET` (default: `test_webhook_secret_gravity`)
  - `COVETRUS_WEBHOOK_SECRET` (default: `test_webhook_secret_covetrus`)

### Example with Custom Configuration

```bash
cd webhook-mocker
export API_SERVICE_URL=http://localhost:8080
export WEBHOOK_INTERVAL_MS=5000
export STRIPE_WEBHOOK_SECRET=my_custom_secret
npm start
```

## How It Works

1. The webhook mocker randomly selects one of the five payment processors
2. Generates realistic mock webhook payload data for that processor
3. Creates a valid signature using HMAC SHA256 (matching the expected format for each processor)
4. Sends the webhook to the appropriate endpoint on the API service
5. Repeats at the configured interval

## Mock Data

The service generates randomized but realistic mock data:
- **Transaction IDs**: Unique sequential IDs with processor-specific prefixes
- **Amounts**: Random amounts between $10.00 and $500.00
- **Statuses**: Mix of success, declined, processing, and failed transactions
- **Timestamps**: Current time
- **Customer/Vendor IDs**: Randomized values

## Webhook Endpoints

The mocker sends webhooks to these API service endpoints:
- `POST /webhooks/stripe`
- `POST /webhooks/bluefin`
- `POST /webhooks/worldpay`
- `POST /webhooks/gravity`
- `POST /webhooks/covetrus`

## Testing the Integration

1. Start the API service:
   ```bash
   cd ../api-service
   npm start
   ```

2. Start the UI layer:
   ```bash
   cd ../ui-layer
   npm run dev
   ```

3. Start the webhook mocker:
   ```bash
   cd ../webhook-mocker
   npm start
   ```

4. Open http://localhost:3000 in your browser to see live mock transactions flowing through the system

## Stopping the Service

Press `Ctrl+C` to gracefully stop the webhook mocker.

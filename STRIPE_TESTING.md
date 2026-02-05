# Stripe API Integration Testing Guide

## Testing with Real Stripe Credentials

This guide demonstrates how to test the Stripe API polling integration with real credentials.

### Prerequisites
- A Stripe account (test or live mode)
- Stripe API secret key

### Setup

1. Get your Stripe API key from https://dashboard.stripe.com/test/apikeys

2. Set environment variables:
```bash
export STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
export STRIPE_POLL_INTERVAL_MS=30000  # Optional, defaults to 30 seconds
```

3. Start the API service:
```bash
cd api-service
npm install
npm start
```

### Expected Behavior

#### On Startup (with STRIPE_SECRET_KEY set):
```
✓ Stripe client initialized successfully
  Polling interval: 30000ms
Starting Stripe polling...
HTTP interface activated on port 3001
Fetched X payment links from Stripe
Found Y new Stripe transaction(s)
```

#### On Startup (without STRIPE_SECRET_KEY):
```
⚠️  STRIPE_SECRET_KEY not configured - Stripe polling disabled
   Set STRIPE_SECRET_KEY environment variable to enable real Stripe integration
Stripe polling not started (disabled or not configured)
HTTP interface activated on port 3001
```

### Testing Endpoints

1. **Check system status:**
```bash
curl http://localhost:3001/system/status
```

2. **Get cached Payment Links:**
```bash
curl http://localhost:3001/stripe/payment-links
```

Expected response:
```json
{
  "count": 2,
  "data": [
    { /* Payment Link object from Stripe API */ }
  ]
}
```

3. **Get cached Stripe transactions:**
```bash
curl http://localhost:3001/stripe/transactions
```

Expected response:
```json
{
  "count": 5,
  "data": [
    {
      "txId": "ch_xxxxxxxxxxxxx",
      "processorName": "stripe",
      "moneyAmount": 29.99,
      "currencyType": "USD",
      "outcome": "success",
      "occurredAt": "2026-02-05T20:00:00.000Z",
      "vendorCode": "cus_xxxxx"
    }
  ]
}
```

4. **Get analytics comparison:**
```bash
curl http://localhost:3001/analytics/comparison
```

This endpoint includes both Worldpay (simulated) and Stripe (real API) data.

### WebSocket Live Feed

Connect to `ws://localhost:3001` to receive real-time transaction updates:

```bash
# Using wscat (install with: npm install -g wscat)
wscat -c ws://localhost:3001
```

You'll receive:
- Worldpay transactions (simulated, generated every 2-4 seconds)
- Stripe transactions (real, when new charges are detected during polling)

Example Stripe transaction broadcast:
```json
{
  "txId": "ch_xxxxxxxxxxxxx",
  "processorName": "stripe",
  "moneyAmount": 49.99,
  "currencyType": "USD",
  "outcome": "success",
  "occurredAt": "2026-02-05T20:00:00.000Z",
  "vendorCode": "cus_xxxxx"
}
```

### Transaction Outcomes

The StripePoller normalizes Stripe charge statuses:
- `paid=true, status=succeeded` → `outcome: "success"`
- `status=pending` → `outcome: "processing"`
- `status=failed` or `paid=false` → `outcome: "declined"`

Failed charges are included in the transaction feed.

### Polling Behavior

- Polling occurs at the configured interval (default: 30 seconds)
- Payment Links are fetched (no filtering by active status)
- Charges are fetched (including failed charges, limit 100 per poll)
- New transactions trigger WebSocket broadcasts
- All data is cached in memory

### Troubleshooting

**Problem:** "Error fetching payment links: Invalid API Key"
- Solution: Check that STRIPE_SECRET_KEY is set correctly

**Problem:** No Stripe transactions appearing
- Solution: 
  - Verify you have actual charges in your Stripe account
  - Try creating a test charge in Stripe Dashboard
  - Check polling interval and wait for next poll

**Problem:** "An error occurred with our connection to Stripe"
- Solution: Check network connectivity and Stripe API status

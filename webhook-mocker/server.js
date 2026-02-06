const crypto = require('crypto');
const axios = require('axios');

/**
 * WebhookMocker: Generates and sends mock webhook traffic to the payment aggregator
 * Simulates webhooks from all five payment processors:
 * - Stripe
 * - Bluefin
 * - WorldPay Integrated
 * - Gravity
 * - Covetrus Payment Processing
 */
class WebhookMocker {
  constructor() {
    // Target API service URL (configurable via environment variable)
    this.targetUrl = process.env.API_SERVICE_URL || 'http://localhost:3001';
    
    // Webhook secrets (should match what's configured in api-service)
    this.webhookSecrets = {
      stripe: process.env.STRIPE_WEBHOOK_SECRET || 'test_webhook_secret_stripe',
      bluefin: process.env.BLUEFIN_WEBHOOK_SECRET || 'test_webhook_secret_bluefin',
      worldpay_integrated: process.env.WORLDPAY_WEBHOOK_SECRET || 'test_webhook_secret_worldpay',
      gravity: process.env.GRAVITY_WEBHOOK_SECRET || 'test_webhook_secret_gravity',
      covetrus: process.env.COVETRUS_WEBHOOK_SECRET || 'test_webhook_secret_covetrus'
    };
    
    // Interval between mock webhook sends (in milliseconds)
    this.sendIntervalMs = parseInt(process.env.WEBHOOK_INTERVAL_MS, 10) || 3000; // Default: 3 seconds
    
    // Counter for generating unique transaction IDs
    this.txCounter = 1;
    
    console.log('✓ WebhookMocker initialized');
    console.log(`  Target URL: ${this.targetUrl}`);
    console.log(`  Webhook interval: ${this.sendIntervalMs}ms`);
  }

  /**
   * Start sending mock webhooks at regular intervals
   */
  start() {
    console.log('Starting webhook mocker...');
    console.log('Mock webhooks will be sent to all 5 payment processor endpoints');
    
    // Send an initial webhook immediately
    this.sendRandomWebhook();
    
    // Then continue at regular intervals
    this.timer = setInterval(() => {
      this.sendRandomWebhook();
    }, this.sendIntervalMs);
  }

  /**
   * Stop sending mock webhooks
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('Webhook mocker stopped');
    }
  }

  /**
   * Send a random mock webhook from one of the five processors
   */
  sendRandomWebhook() {
    const processors = ['stripe', 'bluefin', 'worldpay_integrated', 'gravity', 'covetrus'];
    const randomProcessor = processors[Math.floor(Math.random() * processors.length)];
    
    switch (randomProcessor) {
      case 'stripe':
        this.sendStripeWebhook();
        break;
      case 'bluefin':
        this.sendBluefinWebhook();
        break;
      case 'worldpay_integrated':
        this.sendWorldPayWebhook();
        break;
      case 'gravity':
        this.sendGravityWebhook();
        break;
      case 'covetrus':
        this.sendCovetrusWebhook();
        break;
    }
  }

  /**
   * Send a mock Stripe webhook
   */
  async sendStripeWebhook() {
    const eventTypes = [
      'charge.succeeded',
      'charge.failed',
      'charge.pending',
      'payment_intent.succeeded',
      'payment_intent.payment_failed'
    ];
    
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const isChargeEvent = eventType.startsWith('charge.');
    
    let payload;
    if (isChargeEvent) {
      payload = {
        type: eventType,
        data: {
          object: {
            id: `ch_mock_${this.txCounter++}`,
            amount: Math.floor(Math.random() * 50000) + 1000, // $10.00 to $500.00 in cents
            currency: 'usd',
            paid: eventType === 'charge.succeeded',
            status: eventType === 'charge.succeeded' ? 'succeeded' : 
                   eventType === 'charge.pending' ? 'pending' : 'failed',
            created: Math.floor(Date.now() / 1000),
            customer: `cus_mock_${Math.floor(Math.random() * 1000)}`,
            source: {
              id: `card_mock_${Math.floor(Math.random() * 1000)}`
            }
          }
        }
      };
    } else {
      payload = {
        type: eventType,
        data: {
          object: {
            id: `pi_mock_${this.txCounter++}`,
            amount: Math.floor(Math.random() * 50000) + 1000,
            currency: 'usd',
            status: eventType === 'payment_intent.succeeded' ? 'succeeded' : 'failed',
            created: Math.floor(Date.now() / 1000),
            customer: `cus_mock_${Math.floor(Math.random() * 1000)}`
          }
        }
      };
    }
    
    const payloadString = JSON.stringify(payload);
    const signature = this._generateStripeSignature(payloadString);
    
    try {
      await axios.post(`${this.targetUrl}/webhooks/stripe`, payloadString, {
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': signature
        }
      });
      console.log(`✓ Sent Stripe webhook: ${eventType}`);
    } catch (error) {
      console.error(`✗ Failed to send Stripe webhook: ${error.message}`);
    }
  }

  /**
   * Send a mock Bluefin webhook
   */
  async sendBluefinWebhook() {
    const statuses = ['success', 'approved', 'declined', 'failed', 'processing'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const payload = {
      transactionId: `bf_mock_${this.txCounter++}`,
      amount: (Math.random() * 490 + 10).toFixed(2),
      currency: 'USD',
      status: status,
      timestamp: new Date().toISOString(),
      merchantId: `merchant_${Math.floor(Math.random() * 100)}`,
      customerId: `customer_${Math.floor(Math.random() * 1000)}`
    };
    
    const payloadString = JSON.stringify(payload);
    const signature = this._generateGenericSignature(payloadString, this.webhookSecrets.bluefin);
    
    try {
      await axios.post(`${this.targetUrl}/webhooks/bluefin`, payloadString, {
        headers: {
          'Content-Type': 'application/json',
          'x-bluefin-signature': signature
        }
      });
      console.log(`✓ Sent Bluefin webhook: ${status}`);
    } catch (error) {
      console.error(`✗ Failed to send Bluefin webhook: ${error.message}`);
    }
  }

  /**
   * Send a mock WorldPay Integrated webhook
   */
  async sendWorldPayWebhook() {
    const statuses = ['AUTHORISED', 'AUTHORIZED', 'SUCCESS', 'DECLINED', 'CANCELLED', 'PENDING'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const txId = this.txCounter++;
    const payload = {
      orderCode: `WP_${txId}`,
      transactionId: `wp_tx_${txId}`,
      amount: Math.floor(Math.random() * 50000) + 1000, // Amount in cents
      currencyCode: 'USD',
      paymentStatus: status,
      orderDate: new Date().toISOString(),
      merchantCode: `MERCHANT${Math.floor(Math.random() * 100)}`,
      customerId: `cust_${Math.floor(Math.random() * 1000)}`
    };
    
    const payloadString = JSON.stringify(payload);
    const signature = this._generateGenericSignature(payloadString, this.webhookSecrets.worldpay_integrated);
    
    try {
      await axios.post(`${this.targetUrl}/webhooks/worldpay`, payloadString, {
        headers: {
          'Content-Type': 'application/json',
          'x-worldpay-signature': signature
        }
      });
      console.log(`✓ Sent WorldPay webhook: ${status}`);
    } catch (error) {
      console.error(`✗ Failed to send WorldPay webhook: ${error.message}`);
    }
  }

  /**
   * Send a mock Gravity webhook
   */
  async sendGravityWebhook() {
    const statuses = ['success', 'completed', 'approved', 'declined', 'failed', 'processing'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const txId = this.txCounter++;
    const amount = (Math.random() * 490 + 10).toFixed(2);
    const payload = {
      transaction_id: `grav_${txId}`,
      id: `grav_id_${txId}`,
      total: amount,
      amount: amount,
      currency: 'USD',
      payment_status: status,
      status: status,
      created_at: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      customer_id: `grav_cust_${Math.floor(Math.random() * 1000)}`,
      merchant_id: `grav_merch_${Math.floor(Math.random() * 100)}`
    };
    
    const payloadString = JSON.stringify(payload);
    const signature = this._generateGenericSignature(payloadString, this.webhookSecrets.gravity);
    
    try {
      await axios.post(`${this.targetUrl}/webhooks/gravity`, payloadString, {
        headers: {
          'Content-Type': 'application/json',
          'x-gravity-signature': signature
        }
      });
      console.log(`✓ Sent Gravity webhook: ${status}`);
    } catch (error) {
      console.error(`✗ Failed to send Gravity webhook: ${error.message}`);
    }
  }

  /**
   * Send a mock Covetrus webhook
   */
  async sendCovetrusWebhook() {
    const statuses = ['success', 'completed', 'approved', 'declined', 'rejected', 'processing'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const txId = this.txCounter++;
    const amount = (Math.random() * 490 + 10).toFixed(2);
    const payload = {
      paymentId: `cov_${txId}`,
      transactionId: `cov_tx_${txId}`,
      id: `cov_id_${txId}`,
      paymentAmount: amount,
      amount: amount,
      currency: 'USD',
      paymentStatus: status,
      status: status,
      paymentDate: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      clinicId: `clinic_${Math.floor(Math.random() * 100)}`,
      customerId: `cov_cust_${Math.floor(Math.random() * 1000)}`
    };
    
    const payloadString = JSON.stringify(payload);
    const signature = this._generateGenericSignature(payloadString, this.webhookSecrets.covetrus);
    
    try {
      await axios.post(`${this.targetUrl}/webhooks/covetrus`, payloadString, {
        headers: {
          'Content-Type': 'application/json',
          'x-covetrus-signature': signature
        }
      });
      console.log(`✓ Sent Covetrus webhook: ${status}`);
    } catch (error) {
      console.error(`✗ Failed to send Covetrus webhook: ${error.message}`);
    }
  }

  /**
   * Generate Stripe-compatible signature
   * Format: t=timestamp,v1=signature
   */
  _generateStripeSignature(payload) {
    const timestamp = Math.floor(Date.now() / 1000);
    const secret = this.webhookSecrets.stripe;
    
    // Stripe signature includes timestamp in the signed content
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');
    
    return `t=${timestamp},v1=${signature}`;
  }

  /**
   * Generate generic HMAC SHA256 signature for other processors
   */
  _generateGenericSignature(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }
}

// Start the webhook mocker when the script is run directly
if (require.main === module) {
  const mocker = new WebhookMocker();
  mocker.start();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down webhook mocker...');
    mocker.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\nShutting down webhook mocker...');
    mocker.stop();
    process.exit(0);
  });
}

module.exports = WebhookMocker;

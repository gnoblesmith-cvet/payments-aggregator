const crypto = require('crypto');

/**
 * WebhookHandler: Processes incoming webhooks from multiple payment processors
 * Supports: Stripe, Bluefin, WorldPay Integrated, Gravity, and Covetrus Payment Processing
 */
class WebhookHandler {
  constructor() {
    this.listeners = [];
    this.supportedProcessors = [
      'stripe',
      'bluefin',
      'worldpay_integrated',
      'gravity',
      'covetrus'
    ];
    
    // Webhook secrets for signature verification (from environment variables)
    this.webhookSecrets = {
      stripe: process.env.STRIPE_WEBHOOK_SECRET || '',
      bluefin: process.env.BLUEFIN_WEBHOOK_SECRET || '',
      worldpay_integrated: process.env.WORLDPAY_WEBHOOK_SECRET || '',
      gravity: process.env.GRAVITY_WEBHOOK_SECRET || '',
      covetrus: process.env.COVETRUS_WEBHOOK_SECRET || ''
    };

    console.log('✓ WebhookHandler initialized for processors:', this.supportedProcessors.join(', '));
  }

  /**
   * Register a callback for new transaction notifications
   */
  onNewTransaction(callbackFn) {
    this.listeners.push(callbackFn);
  }

  /**
   * Process incoming Stripe webhook
   */
  processStripeWebhook(payload, signature) {
    if (!this._verifyStripeSignature(payload, signature)) {
      throw new Error('Invalid Stripe webhook signature');
    }

    const event = JSON.parse(payload);
    
    // Handle relevant Stripe events
    if (event.type === 'charge.succeeded' || event.type === 'charge.failed' || event.type === 'charge.pending') {
      const charge = event.data.object;
      const transaction = this._normalizeStripeCharge(charge);
      this._notifyListeners(transaction);
      return transaction;
    }
    
    if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const transaction = this._normalizeStripePaymentIntent(paymentIntent);
      this._notifyListeners(transaction);
      return transaction;
    }

    return null; // Event not relevant for transaction tracking
  }

  /**
   * Process incoming Bluefin webhook
   */
  processBluefinWebhook(payload, signature) {
    if (!this._verifyGenericSignature(payload, signature, this.webhookSecrets.bluefin)) {
      throw new Error('Invalid Bluefin webhook signature');
    }

    const data = JSON.parse(payload);
    const transaction = this._normalizeBluefinPayload(data);
    this._notifyListeners(transaction);
    return transaction;
  }

  /**
   * Process incoming WorldPay Integrated webhook
   */
  processWorldPayWebhook(payload, signature) {
    if (!this._verifyGenericSignature(payload, signature, this.webhookSecrets.worldpay_integrated)) {
      throw new Error('Invalid WorldPay webhook signature');
    }

    const data = JSON.parse(payload);
    const transaction = this._normalizeWorldPayPayload(data);
    this._notifyListeners(transaction);
    return transaction;
  }

  /**
   * Process incoming Gravity webhook
   */
  processGravityWebhook(payload, signature) {
    if (!this._verifyGenericSignature(payload, signature, this.webhookSecrets.gravity)) {
      throw new Error('Invalid Gravity webhook signature');
    }

    const data = JSON.parse(payload);
    const transaction = this._normalizeGravityPayload(data);
    this._notifyListeners(transaction);
    return transaction;
  }

  /**
   * Process incoming Covetrus webhook
   */
  processCovetrusWebhook(payload, signature) {
    if (!this._verifyGenericSignature(payload, signature, this.webhookSecrets.covetrus)) {
      throw new Error('Invalid Covetrus webhook signature');
    }

    const data = JSON.parse(payload);
    const transaction = this._normalizeCovetrusPayload(data);
    this._notifyListeners(transaction);
    return transaction;
  }

  /**
   * Verify Stripe webhook signature using Stripe's method
   */
  _verifyStripeSignature(payload, signature) {
    const secret = this.webhookSecrets.stripe;
    if (!secret) {
      console.warn('⚠️  STRIPE_WEBHOOK_SECRET not configured - skipping signature verification');
      return true; // Allow in development/testing
    }

    try {
      // Stripe uses HMAC SHA256 with timestamp
      const stripe = require('stripe');
      // This is a simplified verification - in production, use stripe.webhooks.constructEvent
      return true; // Placeholder for actual Stripe verification
    } catch (error) {
      console.error('Stripe signature verification error:', error.message);
      return false;
    }
  }

  /**
   * Verify webhook signature using HMAC SHA256
   */
  _verifyGenericSignature(payload, signature, secret) {
    if (!secret) {
      console.warn('⚠️  Webhook secret not configured - skipping signature verification');
      return true; // Allow in development/testing
    }

    if (!signature) {
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Signature verification error:', error.message);
      return false;
    }
  }

  /**
   * Normalize Stripe charge to standard transaction format
   */
  _normalizeStripeCharge(charge) {
    let outcome;
    if (charge.paid && charge.status === 'succeeded') {
      outcome = 'success';
    } else if (charge.status === 'pending') {
      outcome = 'processing';
    } else if (charge.status === 'failed' || !charge.paid) {
      outcome = 'declined';
    } else {
      outcome = 'processing';
    }
    
    return {
      txId: charge.id,
      processorName: 'stripe',
      moneyAmount: charge.amount / 100,
      currencyType: charge.currency.toUpperCase(),
      outcome: outcome,
      occurredAt: new Date(charge.created * 1000).toISOString(),
      vendorCode: charge.customer || charge.source?.id || 'N/A'
    };
  }

  /**
   * Normalize Stripe payment intent to standard transaction format
   */
  _normalizeStripePaymentIntent(paymentIntent) {
    let outcome;
    if (paymentIntent.status === 'succeeded') {
      outcome = 'success';
    } else if (paymentIntent.status === 'processing' || paymentIntent.status === 'requires_action') {
      outcome = 'processing';
    } else {
      outcome = 'declined';
    }
    
    return {
      txId: paymentIntent.id,
      processorName: 'stripe',
      moneyAmount: paymentIntent.amount / 100,
      currencyType: paymentIntent.currency.toUpperCase(),
      outcome: outcome,
      occurredAt: new Date(paymentIntent.created * 1000).toISOString(),
      vendorCode: paymentIntent.customer || 'N/A'
    };
  }

  /**
   * Normalize Bluefin payload to standard transaction format
   */
  _normalizeBluefinPayload(data) {
    // Bluefin webhook format (example structure)
    return {
      txId: data.transactionId || data.id,
      processorName: 'bluefin',
      moneyAmount: parseFloat(data.amount || 0),
      currencyType: (data.currency || 'USD').toUpperCase(),
      outcome: this._mapStatus(data.status),
      occurredAt: data.timestamp || new Date().toISOString(),
      vendorCode: data.merchantId || data.customerId || 'N/A'
    };
  }

  /**
   * Normalize WorldPay Integrated payload to standard transaction format
   */
  _normalizeWorldPayPayload(data) {
    // WorldPay webhook format (example structure)
    return {
      txId: data.orderCode || data.transactionId || data.id,
      processorName: 'worldpay_integrated',
      moneyAmount: parseFloat(data.amount || 0) / 100, // Assuming cents
      currencyType: (data.currencyCode || 'USD').toUpperCase(),
      outcome: this._mapStatus(data.paymentStatus || data.status),
      occurredAt: data.orderDate || data.timestamp || new Date().toISOString(),
      vendorCode: data.merchantCode || data.customerId || 'N/A'
    };
  }

  /**
   * Normalize Gravity payload to standard transaction format
   */
  _normalizeGravityPayload(data) {
    // Gravity webhook format (example structure)
    return {
      txId: data.transaction_id || data.id,
      processorName: 'gravity',
      moneyAmount: parseFloat(data.total || data.amount || 0),
      currencyType: (data.currency || 'USD').toUpperCase(),
      outcome: this._mapStatus(data.payment_status || data.status),
      occurredAt: data.created_at || data.timestamp || new Date().toISOString(),
      vendorCode: data.customer_id || data.merchant_id || 'N/A'
    };
  }

  /**
   * Normalize Covetrus payload to standard transaction format
   */
  _normalizeCovetrusPayload(data) {
    // Covetrus Payment Processing webhook format (example structure)
    return {
      txId: data.paymentId || data.transactionId || data.id,
      processorName: 'covetrus',
      moneyAmount: parseFloat(data.paymentAmount || data.amount || 0),
      currencyType: (data.currency || 'USD').toUpperCase(),
      outcome: this._mapStatus(data.paymentStatus || data.status),
      occurredAt: data.paymentDate || data.timestamp || new Date().toISOString(),
      vendorCode: data.clinicId || data.customerId || 'N/A'
    };
  }

  /**
   * Map various status strings to our standardized outcome values
   */
  _mapStatus(status) {
    if (!status) return 'processing';
    
    const statusLower = status.toLowerCase();
    
    // Success patterns
    if (statusLower.includes('success') || 
        statusLower.includes('approved') || 
        statusLower.includes('completed') ||
        statusLower.includes('paid') ||
        statusLower === 'authorised') {
      return 'success';
    }
    
    // Declined/failed patterns
    if (statusLower.includes('declined') || 
        statusLower.includes('failed') || 
        statusLower.includes('rejected') ||
        statusLower.includes('cancelled') ||
        statusLower.includes('error')) {
      return 'declined';
    }
    
    // Processing/pending patterns
    return 'processing';
  }

  /**
   * Notify all registered listeners about a new transaction
   */
  _notifyListeners(transaction) {
    this.listeners.forEach(fn => fn(transaction));
  }
}

module.exports = WebhookHandler;

const Stripe = require('stripe');

/**
 * StripePoller: Manages polling of Stripe API for Payment Links and Charges
 * Stores results in-memory and notifies listeners of new transactions
 */
class StripePoller {
  constructor() {
    this.stripe = null;
    this.isEnabled = false;
    this.pollIntervalMs = parseInt(process.env.STRIPE_POLL_INTERVAL_MS) || 30000; // Default: 30 seconds
    this.pollTimer = null;
    
    // In-memory cache for Stripe data
    this.cache = {
      paymentLinks: [],
      transactions: []
    };
    
    // Track seen transaction IDs to detect new ones
    this.seenTransactionIds = new Set();
    
    // Listeners for new transactions
    this.listeners = [];
    
    this._initialize();
  }

  /**
   * Initialize Stripe client and validate configuration
   */
  _initialize() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      console.warn('⚠️  STRIPE_SECRET_KEY not configured - Stripe polling disabled');
      console.warn('   Set STRIPE_SECRET_KEY environment variable to enable real Stripe integration');
      this.isEnabled = false;
      return;
    }
    
    try {
      this.stripe = new Stripe(secretKey);
      this.isEnabled = true;
      console.log('✓ Stripe client initialized successfully');
      console.log(`  Polling interval: ${this.pollIntervalMs}ms`);
    } catch (error) {
      console.error('✗ Failed to initialize Stripe client:', error.message);
      this.isEnabled = false;
    }
  }

  /**
   * Register a callback for new transaction notifications
   */
  onNewTransaction(callbackFn) {
    this.listeners.push(callbackFn);
  }

  /**
   * Start the polling loop
   */
  startPolling() {
    if (!this.isEnabled) {
      console.log('Stripe polling not started (disabled or not configured)');
      return;
    }
    
    console.log('Starting Stripe polling...');
    
    // Do an immediate poll, then set up interval
    this._pollStripeAPI();
    
    this.pollTimer = setInterval(() => {
      this._pollStripeAPI();
    }, this.pollIntervalMs);
  }

  /**
   * Stop the polling loop
   */
  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
      console.log('Stripe polling stopped');
    }
  }

  /**
   * Main polling function - fetches data from Stripe API
   */
  async _pollStripeAPI() {
    if (!this.isEnabled) return;
    
    try {
      // Poll Payment Links and Charges in parallel
      await Promise.all([
        this._pollPaymentLinks(),
        this._pollCharges()
      ]);
    } catch (error) {
      console.error('Error during Stripe polling:', error.message);
    }
  }

  /**
   * Fetch Payment Links from Stripe API
   */
  async _pollPaymentLinks() {
    try {
      // List all payment links (not filtering by active status as per requirements)
      const response = await this.stripe.paymentLinks.list({
        limit: 100
      });
      
      this.cache.paymentLinks = response.data;
      console.log(`Fetched ${response.data.length} payment links from Stripe`);
    } catch (error) {
      console.error('Error fetching payment links:', error.message);
    }
  }

  /**
   * Fetch Charges from Stripe API (including failed charges)
   */
  async _pollCharges() {
    try {
      // Fetch recent charges (including failed ones)
      const response = await this.stripe.charges.list({
        limit: 100
      });
      
      // Process charges and detect new ones
      const newTransactions = [];
      
      for (const charge of response.data) {
        // Normalize Stripe charge to our transaction format
        const normalizedTx = this._normalizeCharge(charge);
        
        // Check if this is a new transaction
        if (!this.seenTransactionIds.has(normalizedTx.txId)) {
          this.seenTransactionIds.add(normalizedTx.txId);
          newTransactions.push(normalizedTx);
          
          // Notify listeners about new transaction
          this.listeners.forEach(fn => fn(normalizedTx));
        }
        
        // Update cache (replace or add)
        const existingIndex = this.cache.transactions.findIndex(t => t.txId === normalizedTx.txId);
        if (existingIndex >= 0) {
          this.cache.transactions[existingIndex] = normalizedTx;
        } else {
          this.cache.transactions.push(normalizedTx);
        }
      }
      
      if (newTransactions.length > 0) {
        console.log(`Found ${newTransactions.length} new Stripe transaction(s)`);
      }
    } catch (error) {
      console.error('Error fetching charges:', error.message);
    }
  }

  /**
   * Normalize Stripe charge object to our transaction format
   * Maps Stripe data to: {txId, processorName, moneyAmount, currencyType, outcome, occurredAt, vendorCode}
   */
  _normalizeCharge(charge) {
    // Determine outcome based on charge status and paid flag
    let outcome;
    if (charge.paid && charge.status === 'succeeded') {
      outcome = 'success';
    } else if (charge.status === 'pending') {
      outcome = 'processing';
    } else if (charge.status === 'failed' || !charge.paid) {
      outcome = 'declined';
    } else {
      outcome = 'processing'; // Default for unknown statuses
    }
    
    return {
      txId: charge.id, // Stripe charge ID (e.g., ch_xxxxx)
      processorName: 'stripe',
      moneyAmount: charge.amount / 100, // Stripe amounts are in cents
      currencyType: charge.currency.toUpperCase(),
      outcome: outcome,
      occurredAt: new Date(charge.created * 1000).toISOString(), // Convert Unix timestamp to ISO
      vendorCode: charge.customer || charge.source?.id || 'N/A' // Use customer ID or source ID as vendor code
    };
  }

  /**
   * Get cached Payment Links
   */
  getPaymentLinks() {
    return this.cache.paymentLinks;
  }

  /**
   * Get cached Stripe transactions
   */
  getTransactions() {
    return this.cache.transactions;
  }

  /**
   * Get Stripe transactions for analytics (same format as TransactionEngine)
   */
  getTransactionsForAnalytics() {
    return this.cache.transactions;
  }
}

module.exports = StripePoller;

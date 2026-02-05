const StripePoller = require('./stripe-poller');

class TransactionEngine {
  constructor() {
    this.dataStore = { worldpay: [], stripe: [] };
    this.listeners = [];
    this.generatorTimer = null;
    
    // Initialize Stripe poller for real API integration
    this.stripePoller = new StripePoller();
    
    // Forward Stripe transactions to our listeners
    this.stripePoller.onNewTransaction((txData) => {
      this.dataStore.stripe.push(txData);
      this.listeners.forEach(fn => fn(txData));
    });
  }

  onNewTransaction(callbackFn) {
    this.listeners.push(callbackFn);
  }

  beginGenerating() {
    // Start Stripe polling for real API integration
    this.stripePoller.startPolling();
    
    // Continue generating simulated Worldpay transactions only
    this.generatorTimer = setInterval(() => {
      const tx = this._fabricateTransaction();
      this.dataStore[tx.processorName].push(tx);
      this.listeners.forEach(fn => fn(tx));
    }, 1800 + Math.random() * 2400);
  }

  _fabricateTransaction() {
    // Only generate Worldpay transactions now (Stripe uses real API)
    const chosenProcessor = 'worldpay';
    const moneyValue = (Math.random() * 880 + 70).toFixed(2);
    const outcomes = ['success', 'processing', 'declined'];
    const outcomeProbs = [0.82, 0.12, 0.06];
    
    let finalOutcome;
    const roll = Math.random();
    if (roll < outcomeProbs[0]) {
      finalOutcome = outcomes[0];
    } else if (roll < outcomeProbs[0] + outcomeProbs[1]) {
      finalOutcome = outcomes[1];
    } else {
      finalOutcome = outcomes[2];
    }

    return {
      txId: `TX${Date.now()}${Math.random().toString(36).slice(2, 11).toUpperCase()}`,
      processorName: chosenProcessor,
      moneyAmount: parseFloat(moneyValue),
      currencyType: ['USD', 'EUR', 'GBP'][Math.floor(Math.random() * 3)],
      outcome: finalOutcome,
      occurredAt: new Date().toISOString(),
      vendorCode: `V${Math.floor(Math.random() * 899 + 100)}`
    };
  }

  computeStatistics() {
    const metrics = {};
    
    ['worldpay', 'stripe'].forEach(proc => {
      const txList = this.dataStore[proc];
      const successTxs = txList.filter(t => t.outcome === 'success');
      
      metrics[proc] = {
        volumeTotal: txList.length,
        revenueSum: successTxs.reduce((sum, t) => sum + t.moneyAmount, 0),
        successCount: successTxs.length,
        declinedCount: txList.filter(t => t.outcome === 'declined').length
      };
    });

    return {
      metricsData: metrics,
      timeSeriesData: this._generateTimeSeries()
    };
  }

  _generateTimeSeries() {
    const points = [];
    for (let i = 23; i >= 0; i--) {
      const timePoint = new Date();
      timePoint.setHours(timePoint.getHours() - i);
      points.push({
        timeLabel: timePoint.toISOString(),
        worldpayValue: Math.floor(Math.random() * 4200 + 1200),
        stripeValue: Math.floor(Math.random() * 4500 + 900)
      });
    }
    return points;
  }

  /**
   * Get the StripePoller instance for direct access to Stripe data
   */
  getStripePoller() {
    return this.stripePoller;
  }
}

module.exports = TransactionEngine;

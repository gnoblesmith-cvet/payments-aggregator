const WebhookHandler = require('./webhook-handler');

class TransactionEngine {
  constructor() {
    // Updated data store for all five payment processors
    this.dataStore = {
      stripe: [],
      bluefin: [],
      worldpay_integrated: [],
      gravity: [],
      covetrus: []
    };
    this.listeners = [];
    
    // Initialize webhook handler for all payment processors
    this.webhookHandler = new WebhookHandler();
    
    // Forward all webhook transactions to our listeners
    this.webhookHandler.onNewTransaction((txData) => {
      this.dataStore[txData.processorName].push(txData);
      this.listeners.forEach(fn => fn(txData));
    });
  }

  onNewTransaction(callbackFn) {
    this.listeners.push(callbackFn);
  }

  beginGenerating() {
    // Webhook-based architecture - no need to poll or generate simulated data
    // Transactions will arrive via webhook endpoints
    console.log('TransactionEngine ready - awaiting webhook events from payment processors');
  }



  computeStatistics() {
    const metrics = {};
    
    // Compute metrics for all five payment processors
    ['stripe', 'bluefin', 'worldpay_integrated', 'gravity', 'covetrus'].forEach(proc => {
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
        stripeValue: Math.floor(Math.random() * 4500 + 900),
        bluefinValue: Math.floor(Math.random() * 3800 + 1000),
        worldpay_integratedValue: Math.floor(Math.random() * 4200 + 1200),
        gravityValue: Math.floor(Math.random() * 3500 + 800),
        covetrusValue: Math.floor(Math.random() * 3000 + 700)
      });
    }
    return points;
  }

  /**
   * Get the WebhookHandler instance for direct access to webhook processing
   */
  getWebhookHandler() {
    return this.webhookHandler;
  }
}

module.exports = TransactionEngine;

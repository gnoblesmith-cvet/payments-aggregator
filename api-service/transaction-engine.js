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
      const hour = timePoint.getHours();
      
      // Generate realistic time-of-day multiplier
      const multiplier = this._getTimeOfDayMultiplier(hour);
      
      points.push({
        timeLabel: timePoint.toISOString(),
        stripeValue: Math.floor((Math.random() * 4500 + 900) * multiplier),
        bluefinValue: Math.floor((Math.random() * 3800 + 1000) * multiplier),
        worldpay_integratedValue: Math.floor((Math.random() * 4200 + 1200) * multiplier),
        gravityValue: Math.floor((Math.random() * 3500 + 800) * multiplier),
        covetrusValue: Math.floor((Math.random() * 3000 + 700) * multiplier)
      });
    }
    return points;
  }

  /**
   * Returns a multiplier based on hour of day to simulate realistic transaction patterns
   * @param {number} hour - Hour of the day (0-23)
   * @returns {number} - Multiplier value (0-1)
   */
  _getTimeOfDayMultiplier(hour) {
    // Overnight (midnight-6am): Low activity ~20-30%
    if (hour >= 0 && hour < 6) {
      return 0.2 + Math.random() * 0.1;
    }
    
    // Morning ramp-up (6am-10am): Gradual increase
    if (hour >= 6 && hour < 10) {
      // Linear increase from 0.3 to 1.0
      const progress = (hour - 6) / 4; // 0 to 1 over 4 hours
      return 0.3 + (progress * 0.7) + (Math.random() * 0.1 - 0.05);
    }
    
    // Business hours (10am-6pm): Peak activity ~90-100%
    if (hour >= 10 && hour < 18) {
      return 0.9 + Math.random() * 0.1;
    }
    
    // Evening decline (6pm-midnight): Gradual decrease
    if (hour >= 18 && hour < 24) {
      // Linear decrease from 0.9 to 0.3
      const progress = (hour - 18) / 6; // 0 to 1 over 6 hours
      return 0.9 - (progress * 0.6) + (Math.random() * 0.1 - 0.05);
    }
    
    // Default fallback
    return 1.0;
  }

  /**
   * Get the WebhookHandler instance for direct access to webhook processing
   */
  getWebhookHandler() {
    return this.webhookHandler;
  }
}

module.exports = TransactionEngine;

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
    
    // Reorder the points so that noon (12:00) is in the center of the plot
    // This creates a view centered on the middle of the day instead of midnight
    const reorderedPoints = this._centerOnNoon(points);
    return reorderedPoints;
  }

  /**
   * Reorders time series data to center noon (12:00) in the middle of the plot
   * @param {Array} points - Array of time series data points
   * @returns {Array} - Reordered array with noon centered
   */
  _centerOnNoon(points) {
    if (points.length !== 24) {
      return points; // Only works with 24-hour data
    }
    
    const CHART_CENTER_INDEX = 12; // Desired center position for noon in the chart
    const NOON_HOUR = 12; // Target hour to center (noon)
    
    // Find the index where hour is closest to noon (12)
    let noonIndex = -1;
    let minDiff = 24;
    
    for (let i = 0; i < points.length; i++) {
      const hour = new Date(points[i].timeLabel).getUTCHours();
      const diff = Math.abs(hour - NOON_HOUR);
      if (diff < minDiff) {
        minDiff = diff;
        noonIndex = i;
      }
    }
    
    // If noon wasn't found (shouldn't happen with valid data), return original array
    if (noonIndex === -1) {
      return points;
    }
    
    // Calculate the offset needed to center noon at the desired index
    const offset = noonIndex - CHART_CENTER_INDEX;
    
    // Reorder the array by rotating it
    const reordered = [];
    for (let i = 0; i < points.length; i++) {
      const sourceIndex = (i + offset + points.length) % points.length;
      reordered.push(points[sourceIndex]);
    }
    
    return reordered;
  }

  /**
   * Returns a multiplier based on hour of day to simulate realistic transaction patterns
   * @param {number} hour - Hour of the day (0-23)
   * @returns {number} - Multiplier value (0.2-1.0)
   */
  _getTimeOfDayMultiplier(hour) {
    let multiplier;
    
    // Overnight (midnight-6am): Low activity ~20-30%
    if (hour >= 0 && hour < 6) {
      multiplier = 0.2 + Math.random() * 0.1;
    }
    // Morning ramp-up (6am-10am): Gradual increase
    else if (hour >= 6 && hour < 10) {
      // Linear increase from 0.3 to 1.0
      const progress = (hour - 6) / 4; // 0 to 1 over 4 hours
      multiplier = 0.3 + (progress * 0.7) + (Math.random() * 0.1 - 0.05);
    }
    // Business hours (10am-6pm): Peak activity ~90-100%
    else if (hour >= 10 && hour < 18) {
      multiplier = 0.9 + Math.random() * 0.1;
    }
    // Evening decline (6pm-midnight): Gradual decrease
    else if (hour >= 18 && hour < 24) {
      // Linear decrease from 0.9 to 0.3
      const progress = (hour - 18) / 6; // 0 to 1 over 6 hours
      multiplier = 0.9 - (progress * 0.6) + (Math.random() * 0.1 - 0.05);
    }
    // Default fallback
    else {
      multiplier = 1.0;
    }
    
    // Clamp multiplier to reasonable bounds [0.2, 1.0]
    return Math.max(0.2, Math.min(1.0, multiplier));
  }

  /**
   * Get the WebhookHandler instance for direct access to webhook processing
   */
  getWebhookHandler() {
    return this.webhookHandler;
  }
}

module.exports = TransactionEngine;

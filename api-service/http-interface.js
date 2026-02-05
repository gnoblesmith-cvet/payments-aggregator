const express = require('express');
const cors = require('cors');

class HttpInterface {
  constructor(txEngine) {
    this.engine = txEngine;
    this.expressApp = express();
    this._setupMiddleware();
    this._setupRoutes();
  }

  _setupMiddleware() {
    this.expressApp.use(cors());
    this.expressApp.use(express.json());
  }

  _setupRoutes() {
    this.expressApp.get('/analytics/comparison', (req, res) => {
      const statsData = this.engine.computeStatistics();
      res.json(statsData);
    });

    this.expressApp.get('/system/status', (req, res) => {
      res.json({ 
        systemState: 'running', 
        checkedAt: new Date().toISOString() 
      });
    });

    // Stripe-specific endpoints for cached data
    this.expressApp.get('/stripe/payment-links', (req, res) => {
      const stripePoller = this.engine.getStripePoller();
      const paymentLinks = stripePoller.getPaymentLinks();
      res.json({
        count: paymentLinks.length,
        data: paymentLinks
      });
    });

    this.expressApp.get('/stripe/transactions', (req, res) => {
      const stripePoller = this.engine.getStripePoller();
      const transactions = stripePoller.getTransactions();
      res.json({
        count: transactions.length,
        data: transactions
      });
    });
  }

  activate(portNum) {
    const serverInstance = this.expressApp.listen(portNum, () => {
      console.log(`HTTP interface activated on port ${portNum}`);
    });
    return serverInstance;
  }
}

module.exports = HttpInterface;

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
    // Note: Webhook routes use express.raw() for proper signature verification
    // express.json() is conditionally applied to non-webhook routes
    this.expressApp.use((req, res, next) => {
      // Skip JSON parsing for webhook endpoints to allow raw body access
      if (req.path.startsWith('/webhooks/')) {
        next();
      } else {
        express.json()(req, res, next);
      }
    });
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

    // Webhook endpoints for all five payment processors
    this._setupWebhookRoutes();
  }

  _setupWebhookRoutes() {
    const webhookHandler = this.engine.getWebhookHandler();

    // All webhook endpoints need raw body for signature verification
    // They are defined before the global express.json() middleware is applied to them
    
    // Stripe webhook endpoint
    this.expressApp.post('/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
      try {
        const signature = req.headers['stripe-signature'];
        // req.body is a Buffer when using express.raw()
        const payload = req.body.toString();
        
        const transaction = webhookHandler.processStripeWebhook(payload, signature);
        
        if (transaction) {
          console.log(`✓ Processed Stripe webhook: ${transaction.txId}`);
          res.json({ received: true, transactionId: transaction.txId });
        } else {
          res.json({ received: true, message: 'Event type not tracked' });
        }
      } catch (error) {
        console.error('Error processing Stripe webhook:', error.message);
        res.status(400).json({ error: error.message });
      }
    });

    // Bluefin webhook endpoint
    this.expressApp.post('/webhooks/bluefin', express.raw({ type: 'application/json' }), (req, res) => {
      try {
        const signature = req.headers['x-bluefin-signature'];
        // Get raw payload for signature verification
        const payload = req.body.toString();
        
        const transaction = webhookHandler.processBluefinWebhook(payload, signature);
        
        console.log(`✓ Processed Bluefin webhook: ${transaction.txId}`);
        res.json({ received: true, transactionId: transaction.txId });
      } catch (error) {
        console.error('Error processing Bluefin webhook:', error.message);
        res.status(400).json({ error: error.message });
      }
    });

    // WorldPay Integrated webhook endpoint
    this.expressApp.post('/webhooks/worldpay', express.raw({ type: 'application/json' }), (req, res) => {
      try {
        const signature = req.headers['x-worldpay-signature'];
        // Get raw payload for signature verification
        const payload = req.body.toString();
        
        const transaction = webhookHandler.processWorldPayWebhook(payload, signature);
        
        console.log(`✓ Processed WorldPay webhook: ${transaction.txId}`);
        res.json({ received: true, transactionId: transaction.txId });
      } catch (error) {
        console.error('Error processing WorldPay webhook:', error.message);
        res.status(400).json({ error: error.message });
      }
    });

    // Gravity webhook endpoint
    this.expressApp.post('/webhooks/gravity', express.raw({ type: 'application/json' }), (req, res) => {
      try {
        const signature = req.headers['x-gravity-signature'];
        // Get raw payload for signature verification
        const payload = req.body.toString();
        
        const transaction = webhookHandler.processGravityWebhook(payload, signature);
        
        console.log(`✓ Processed Gravity webhook: ${transaction.txId}`);
        res.json({ received: true, transactionId: transaction.txId });
      } catch (error) {
        console.error('Error processing Gravity webhook:', error.message);
        res.status(400).json({ error: error.message });
      }
    });

    // Covetrus Payment Processing webhook endpoint
    this.expressApp.post('/webhooks/covetrus', express.raw({ type: 'application/json' }), (req, res) => {
      try {
        const signature = req.headers['x-covetrus-signature'];
        // Get raw payload for signature verification
        const payload = req.body.toString();
        
        const transaction = webhookHandler.processCovetrusWebhook(payload, signature);
        
        console.log(`✓ Processed Covetrus webhook: ${transaction.txId}`);
        res.json({ received: true, transactionId: transaction.txId });
      } catch (error) {
        console.error('Error processing Covetrus webhook:', error.message);
        res.status(400).json({ error: error.message });
      }
    });

    console.log('✓ Webhook routes configured for all payment processors');
  }

  activate(portNum) {
    const serverInstance = this.expressApp.listen(portNum, () => {
      console.log(`HTTP interface activated on port ${portNum}`);
    });
    return serverInstance;
  }
}

module.exports = HttpInterface;

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
  }

  activate(portNum) {
    const serverInstance = this.expressApp.listen(portNum, () => {
      console.log(`HTTP interface activated on port ${portNum}`);
    });
    return serverInstance;
  }
}

module.exports = HttpInterface;

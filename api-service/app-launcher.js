const TransactionEngine = require('./transaction-engine');
const StreamBroadcaster = require('./stream-broadcaster');
const HttpInterface = require('./http-interface');

class PaymentAggregatorService {
  constructor() {
    this.txEngine = new TransactionEngine();
    this.broadcaster = new StreamBroadcaster();
    this.httpLayer = new HttpInterface(this.txEngine);
    
    this.txEngine.onNewTransaction((txData) => {
      this.broadcaster.pushToClients(txData);
    });
  }

  launch(portNumber) {
    const serverInstance = this.httpLayer.activate(portNumber);
    this.broadcaster.attachToServer(serverInstance);
    this.txEngine.beginGenerating();
  }
}

const aggregatorApp = new PaymentAggregatorService();
aggregatorApp.launch(3001);

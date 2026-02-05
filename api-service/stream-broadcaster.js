const { WebSocketServer } = require('ws');

class StreamBroadcaster {
  constructor() {
    this.wsServer = null;
    this.connectedClients = new Set();
  }

  attachToServer(httpServerInstance) {
    this.wsServer = new WebSocketServer({ server: httpServerInstance });
    
    this.wsServer.on('connection', (clientSocket) => {
      console.log('New websocket client joined');
      this.connectedClients.add(clientSocket);
      
      clientSocket.on('close', () => {
        console.log('Websocket client departed');
        this.connectedClients.delete(clientSocket);
      });
    });
  }

  pushToClients(dataPayload) {
    const messageStr = JSON.stringify(dataPayload);
    this.connectedClients.forEach((clientSocket) => {
      if (clientSocket.readyState === 1) {
        clientSocket.send(messageStr);
      }
    });
  }
}

module.exports = StreamBroadcaster;

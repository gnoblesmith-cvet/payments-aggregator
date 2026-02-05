import React, { useState, useEffect, useRef } from 'react';

const WS_ENDPOINT = 'ws://localhost:3001';

function LiveStreamView() {
  const [transactions, setTransactions] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const wsRef = useRef(null);

  useEffect(() => {
    establishWebSocketConnection();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const establishWebSocketConnection = () => {
    const socket = new WebSocket(WS_ENDPOINT);
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
      setConnectionStatus('connected');
    };
    
    socket.onmessage = (event) => {
      const txData = JSON.parse(event.data);
      setTransactions(prev => [txData, ...prev].slice(0, 50));
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
      setConnectionStatus('disconnected');
      setTimeout(establishWebSocketConnection, 3000);
    };
    
    wsRef.current = socket;
  };

  const getStatusClassName = (outcome) => {
    if (outcome === 'success') return 'status-success';
    if (outcome === 'processing') return 'status-processing';
    return 'status-declined';
  };

  const getProcessorClassName = (processor) => {
    return processor === 'worldpay' ? 'processor-worldpay' : 'processor-stripe';
  };

  return (
    <div>
      <h1 className="page-heading">Live Payment Transaction Feed</h1>
      
      <div className="transaction-feed">
        <div className="feed-header">
          <h2 className="feed-title">Real-Time Transactions</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className={`connection-badge ${connectionStatus === 'connected' ? 'connected' : 'disconnected'}`}>
              <span className="status-dot"></span>
              {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </div>
            <div className="feed-counter">
              {transactions.length} transactions
            </div>
          </div>
        </div>
        
        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
            Waiting for transactions...
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.txId} className="transaction-item">
              <div className="tx-left">
                <div className="tx-id">{tx.txId}</div>
                <span className={`tx-processor ${getProcessorClassName(tx.processorName)}`}>
                  {tx.processorName}
                </span>
              </div>
              <div className="tx-right">
                <div className="tx-amount">
                  {tx.moneyAmount.toFixed(2)} {tx.currencyType}
                </div>
                <span className={`tx-status ${getStatusClassName(tx.outcome)}`}>
                  {tx.outcome}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LiveStreamView;

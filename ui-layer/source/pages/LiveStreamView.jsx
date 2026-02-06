import React, { useState, useEffect, useRef } from 'react';

const WS_ENDPOINT = 'ws://localhost:3001';
const STORAGE_KEY = 'payment_transactions';
const PAGE_SIZE = 25;

function LiveStreamView() {
  const [transactions, setTransactions] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [currentPage, setCurrentPage] = useState(1);
  const wsRef = useRef(null);

  // Load transactions from localStorage on mount
  useEffect(() => {
    const storedTransactions = localStorage.getItem(STORAGE_KEY);
    if (storedTransactions) {
      try {
        const parsed = JSON.parse(storedTransactions);
        setTransactions(parsed);
      } catch (error) {
        console.error('Failed to load transactions from localStorage:', error);
      }
    }
  }, []);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    if (transactions.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
      } catch (error) {
        console.error('Failed to save transactions to localStorage:', error);
        // If quota exceeded, keep only recent transactions
        if (error.name === 'QuotaExceededError') {
          const reducedTransactions = transactions.slice(0, 100);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedTransactions));
            setTransactions(reducedTransactions);
          } catch (retryError) {
            console.error('Failed to save reduced transactions:', retryError);
          }
        }
      }
    }
  }, [transactions]);

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
      setTransactions(prev => {
        const newTransactions = [txData, ...prev];
        // Reset to first page when new transaction arrives
        setCurrentPage(1);
        return newTransactions;
      });
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

  // Calculate pagination
  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
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
          <>
            {paginatedTransactions.map((tx) => (
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
            ))}
            
            {totalPages > 1 && (
              <div className="pagination-controls">
                <button 
                  onClick={goToPreviousPage} 
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {totalPages} ({transactions.length} total transactions)
                </span>
                <button 
                  onClick={goToNextPage} 
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default LiveStreamView;

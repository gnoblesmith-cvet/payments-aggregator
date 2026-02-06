import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE = 'http://localhost:3001';

function ComparisonView() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    const refreshTimer = setInterval(fetchAnalytics, 8000);
    return () => clearInterval(refreshTimer);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE}/analytics/comparison`);
      const payload = await response.json();
      setAnalyticsData(payload);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  if (isLoading) {
    return <div className="loading-indicator">Loading analytics data...</div>;
  }

  const { metricsData, timeSeriesData } = analyticsData;

  return (
    <div>
      <h1 className="page-heading">Payment Processor Comparison</h1>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-title">Worldpay Transactions</div>
          <div className="metric-value">{metricsData.worldpay_integrated.volumeTotal}</div>
          <div className="metric-label">Total Volume</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-title">Worldpay Revenue</div>
          <div className="metric-value">${metricsData.worldpay_integrated.revenueSum.toFixed(2)}</div>
          <div className="metric-label">Successful Payments</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-title">Stripe Transactions</div>
          <div className="metric-value">{metricsData.stripe.volumeTotal}</div>
          <div className="metric-label">Total Volume</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-title">Stripe Revenue</div>
          <div className="metric-value">${metricsData.stripe.revenueSum.toFixed(2)}</div>
          <div className="metric-label">Successful Payments</div>
        </div>
      </div>

      <div className="chart-container">
        <h3 className="chart-title">24-Hour Transaction Volume Trends</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="timeLabel" 
              tickFormatter={(val) => new Date(val).getHours() + ':00'}
              stroke="#718096"
            />
            <YAxis stroke="#718096" />
            <Tooltip 
              labelFormatter={(val) => new Date(val).toLocaleTimeString()}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="worldpay_integratedValue" 
              stroke="#f39c12" 
              strokeWidth={3}
              name="Worldpay"
              dot={{ fill: '#f39c12', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="stripeValue" 
              stroke="#3498db" 
              strokeWidth={3}
              name="Stripe"
              dot={{ fill: '#3498db', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h3 className="chart-title">Success vs Declined Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            {
              name: 'Worldpay',
              Successful: metricsData.worldpay_integrated.successCount,
              Declined: metricsData.worldpay_integrated.declinedCount
            },
            {
              name: 'Stripe',
              Successful: metricsData.stripe.successCount,
              Declined: metricsData.stripe.declinedCount
            }
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#718096" />
            <YAxis stroke="#718096" />
            <Tooltip />
            <Legend />
            <Bar dataKey="Successful" fill="#27ae60" />
            <Bar dataKey="Declined" fill="#e74c3c" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ComparisonView;

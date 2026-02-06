import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE = 'http://localhost:3001';

// Color scheme for all 5 payment processors
const PROCESSOR_COLORS = {
  stripe: '#635BFF',
  bluefin: '#00A3E0',
  worldpay_integrated: '#F39C12',
  gravity: '#8E44AD',
  covetrus: '#16A085'
};

const PROCESSOR_NAMES = {
  stripe: 'Stripe',
  bluefin: 'Bluefin',
  worldpay_integrated: 'WorldPay',
  gravity: 'Gravity',
  covetrus: 'Covetrus'
};

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

  // Prepare data for volume comparison chart
  const volumeComparisonData = Object.keys(PROCESSOR_NAMES).map(key => ({
    name: PROCESSOR_NAMES[key],
    volume: metricsData[key].volumeTotal,
    color: PROCESSOR_COLORS[key]
  }));

  // Prepare data for revenue comparison chart
  const revenueComparisonData = Object.keys(PROCESSOR_NAMES).map(key => ({
    name: PROCESSOR_NAMES[key],
    revenue: metricsData[key].revenueSum,
    color: PROCESSOR_COLORS[key]
  }));

  // Prepare data for success rate comparison
  const successRateData = Object.keys(PROCESSOR_NAMES).map(key => {
    const total = metricsData[key].volumeTotal;
    const success = metricsData[key].successCount;
    const rate = total > 0 ? ((success / total) * 100).toFixed(1) : 0;
    return {
      name: PROCESSOR_NAMES[key],
      rate: parseFloat(rate),
      color: PROCESSOR_COLORS[key]
    };
  });

  // Prepare data for average transaction value
  const avgTransactionData = Object.keys(PROCESSOR_NAMES).map(key => {
    const total = metricsData[key].volumeTotal;
    const revenue = metricsData[key].revenueSum;
    const avg = total > 0 ? (revenue / total) : 0;
    return {
      name: PROCESSOR_NAMES[key],
      avgValue: avg,
      color: PROCESSOR_COLORS[key]
    };
  });

  // Prepare data for success vs declined
  const successDeclinedData = Object.keys(PROCESSOR_NAMES).map(key => ({
    name: PROCESSOR_NAMES[key],
    Successful: metricsData[key].successCount,
    Declined: metricsData[key].declinedCount
  }));

  return (
    <div>
      <h1 className="page-heading">Payment Processor Comparison - All Providers</h1>
      
      {/* Summary Metric Cards for All Processors */}
      <div className="metrics-grid">
        {Object.keys(PROCESSOR_NAMES).map(key => (
          <div className="metric-card" key={key}>
            <div className="metric-title" style={{ color: PROCESSOR_COLORS[key] }}>
              {PROCESSOR_NAMES[key]}
            </div>
            <div className="metric-value">{metricsData[key].volumeTotal}</div>
            <div className="metric-label">Total Transactions</div>
            <div className="metric-value" style={{ fontSize: '1.3rem', marginTop: '0.5rem' }}>
              ${metricsData[key].revenueSum.toFixed(2)}
            </div>
            <div className="metric-label">Total Revenue</div>
          </div>
        ))}
      </div>

      {/* Total Volume Comparison */}
      <div className="chart-container">
        <h3 className="chart-title">Total Transaction Volume by Processor</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={volumeComparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#718096" />
            <YAxis stroke="#718096" />
            <Tooltip />
            <Bar dataKey="volume" name="Total Transactions">
              {volumeComparisonData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Total Revenue Comparison */}
      <div className="chart-container">
        <h3 className="chart-title">Total Revenue by Processor</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={revenueComparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#718096" />
            <YAxis stroke="#718096" />
            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            <Bar dataKey="revenue" name="Total Revenue ($)">
              {revenueComparisonData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Success Rate Comparison */}
      <div className="chart-container">
        <h3 className="chart-title">Success Rate Comparison (%)</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={successRateData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#718096" />
            <YAxis stroke="#718096" domain={[0, 100]} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Bar dataKey="rate" name="Success Rate (%)">
              {successRateData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Average Transaction Value */}
      <div className="chart-container">
        <h3 className="chart-title">Average Transaction Value by Processor</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={avgTransactionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#718096" />
            <YAxis stroke="#718096" />
            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            <Bar dataKey="avgValue" name="Average Transaction ($)">
              {avgTransactionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 24-Hour Transaction Volume Trends - All Processors */}
      <div className="chart-container">
        <h3 className="chart-title">24-Hour Transaction Volume Trends - All Processors</h3>
        <ResponsiveContainer width="100%" height={400}>
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
              dataKey="stripeValue" 
              stroke={PROCESSOR_COLORS.stripe}
              strokeWidth={2}
              name="Stripe"
              dot={{ fill: PROCESSOR_COLORS.stripe, r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="bluefinValue" 
              stroke={PROCESSOR_COLORS.bluefin}
              strokeWidth={2}
              name="Bluefin"
              dot={{ fill: PROCESSOR_COLORS.bluefin, r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="worldpay_integratedValue" 
              stroke={PROCESSOR_COLORS.worldpay_integrated}
              strokeWidth={2}
              name="WorldPay"
              dot={{ fill: PROCESSOR_COLORS.worldpay_integrated, r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="gravityValue" 
              stroke={PROCESSOR_COLORS.gravity}
              strokeWidth={2}
              name="Gravity"
              dot={{ fill: PROCESSOR_COLORS.gravity, r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="covetrusValue" 
              stroke={PROCESSOR_COLORS.covetrus}
              strokeWidth={2}
              name="Covetrus"
              dot={{ fill: PROCESSOR_COLORS.covetrus, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Success vs Declined Comparison - All Processors */}
      <div className="chart-container">
        <h3 className="chart-title">Success vs Declined Transactions - All Processors</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={successDeclinedData}>
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

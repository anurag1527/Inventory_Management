import React, { useEffect, useState } from 'react';
import api from '../api';
import {
  Package, Users, ShoppingCart, AlertTriangle,
  TrendingUp, IndianRupee, BarChart2, ArrowUpRight
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/summary'),
      api.get('/analytics/sales-trend?days=7'),
      api.get('/analytics/top-products?limit=5'),
      api.get('/analytics/low-stock'),
    ]).then(([s, t, tp, ls]) => {
      setSummary(s.data);
      setTrend(t.data);
      setTopProducts(tp.data);
      setLowStock(ls.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen">Loading dashboard...</div>;

  const formatRupee = (v) => `₹${v?.toLocaleString('en-IN') || 0}`;

  const stats = [
    { label: 'Total Revenue', value: formatRupee(summary?.total_revenue), icon: <IndianRupee size={22} />, color: '#3b82f6', sub: `₹${summary?.revenue_today?.toLocaleString('en-IN')} today` },
    { label: 'Total Orders', value: summary?.total_orders, icon: <ShoppingCart size={22} />, color: '#a855f7', sub: `${summary?.orders_today} today` },
    { label: 'Total Products', value: summary?.total_products, icon: <Package size={22} />, color: '#10b981', sub: 'In catalog' },
    { label: 'Total Customers', value: summary?.total_customers, icon: <Users size={22} />, color: '#f59e0b', sub: 'Registered' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: `${s.color}20`, color: s.color }}>{s.icon}</div>
            <div className="stat-details">
              <h3>{s.label}</h3>
              <p>{s.value}</p>
              <span className="stat-sub">{s.sub}</span>
            </div>
            <ArrowUpRight size={16} className="stat-trend-icon" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title"><TrendingUp size={18} /> Revenue - Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-title"><BarChart2 size={18} /> Orders - Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              />
              <Bar dataKey="orders" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="bottom-grid">
        {/* Top Products */}
        <div className="table-container">
          <div className="table-header">
            <h3>🏆 Top Products by Sales</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Units Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem' }}>No sales data yet</td></tr>
              ) : topProducts.map((p, i) => (
                <tr key={p.product_id}>
                  <td><span className="rank-badge">{i + 1}</span></td>
                  <td>{p.name}</td>
                  <td>{p.total_sold}</td>
                  <td>₹{p.revenue?.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Low Stock Alerts */}
        <div className="table-container">
          <div className="table-header">
            <h3><AlertTriangle size={16} style={{ color: '#ef4444' }} /> Low Stock Alerts ({lowStock.length})</h3>
          </div>
          <table>
            <thead>
              <tr><th>Product</th><th>SKU</th><th>Stock</th><th>Threshold</th></tr>
            </thead>
            <tbody>
              {lowStock.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: '#10b981' }}>✅ All stocks healthy</td></tr>
              ) : lowStock.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td><code>{p.sku}</code></td>
                  <td><span className="badge badge-danger">{p.quantity}</span></td>
                  <td>{p.low_stock_threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

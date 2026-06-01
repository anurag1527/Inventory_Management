import React, { useEffect, useState } from 'react';
import api from '../api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, ShoppingCart, Package, IndianRupee } from 'lucide-react';

const COLORS = ['#3b82f6', '#a855f7', '#10b981', '#f59e0b', '#ef4444'];

const Analytics = () => {
  const [trend, setTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [days, setDays] = useState(7);

  useEffect(() => {
    Promise.all([
      api.get(`/analytics/sales-trend?days=${days}`),
      api.get('/analytics/top-products?limit=8'),
      api.get('/analytics/low-stock'),
    ]).then(([t, tp, ls]) => {
      setTrend(t.data);
      setTopProducts(tp.data);
      setLowStock(ls.data);
    }).catch(console.error);
  }, [days]);

  const totalRevenue = trend.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = trend.reduce((s, d) => s + d.orders, 0);

  const pieData = topProducts.slice(0, 5).map(p => ({ name: p.name, value: p.total_sold }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Sales performance and business insights</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[7, 14, 30].map(d => (
            <button key={d} className={`btn ${days === d ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setDays(d)}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: `Revenue (${days}d)`, value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: <IndianRupee size={22} />, color: '#3b82f6' },
          { label: `Orders (${days}d)`, value: totalOrders, icon: <ShoppingCart size={22} />, color: '#a855f7' },
          { label: 'Top Product', value: topProducts[0]?.name || '—', icon: <Package size={22} />, color: '#10b981' },
          { label: 'Low Stock Items', value: lowStock.length, icon: <TrendingUp size={22} />, color: '#ef4444' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: `${s.color}20`, color: s.color }}>{s.icon}</div>
            <div className="stat-details"><h3>{s.label}</h3><p>{s.value}</p></div>
          </div>
        ))}
      </div>

      {/* Revenue Trend */}
      <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="chart-title"><TrendingUp size={18} /> Revenue Trend — Last {days} Days</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="charts-grid">
        {/* Orders Bar Chart */}
        <div className="chart-card">
          <h3 className="chart-title">📦 Daily Orders</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              <Bar dataKey="orders" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products Pie */}
        <div className="chart-card">
          <h3 className="chart-title">🏆 Top Products by Units Sold</h3>
          {pieData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No sales data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Products Table */}
      <div className="table-container" style={{ marginTop: '1.5rem' }}>
        <div className="table-header"><h3>📊 Top Products — Full Breakdown</h3></div>
        <table>
          <thead><tr><th>Rank</th><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
          <tbody>
            {topProducts.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No sales data yet. Place some orders!</td></tr>
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
    </div>
  );
};

export default Analytics;

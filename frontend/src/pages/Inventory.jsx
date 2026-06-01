import React, { useEffect, useState } from 'react';
import api from '../api';
import { ArrowUpCircle, ArrowDownCircle, SlidersHorizontal, PlusCircle, Trash2, Package } from 'lucide-react';

const movementIcons = {
  STOCK_IN: <ArrowUpCircle size={16} color="#10b981" />,
  STOCK_OUT: <ArrowDownCircle size={16} color="#ef4444" />,
  STOCK_ADJUSTMENT: <SlidersHorizontal size={16} color="#f59e0b" />,
  PRODUCT_CREATED: <PlusCircle size={16} color="#3b82f6" />,
  PRODUCT_DELETED: <Trash2 size={16} color="#6b7280" />,
};

const movementColors = {
  STOCK_IN: 'badge-success',
  STOCK_OUT: 'badge-danger',
  STOCK_ADJUSTMENT: 'badge-warning',
  PRODUCT_CREATED: 'badge-blue',
  PRODUCT_DELETED: 'badge-gray',
};

const Inventory = () => {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedProduct]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, pRes] = await Promise.all([
        api.get(`/stock-movements?limit=100${selectedProduct ? `&product_id=${selectedProduct}` : ''}`),
        api.get('/products')
      ]);
      setMovements(mRes.data);
      setProducts(pRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getProductName = (id) => products.find(p => p.id === id)?.name || `Product #${id}`;

  const stockInCount = movements.filter(m => m.movement_type === 'STOCK_IN' || m.movement_type === 'PRODUCT_CREATED').length;
  const stockOutCount = movements.filter(m => m.movement_type === 'STOCK_OUT').length;
  const adjustCount = movements.filter(m => m.movement_type === 'STOCK_ADJUSTMENT').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Tracking</h1>
          <p className="page-subtitle">Full audit trail of all stock movements</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Stock In', value: stockInCount, icon: <ArrowUpCircle size={20} />, color: '#10b981' },
          { label: 'Stock Out', value: stockOutCount, icon: <ArrowDownCircle size={20} />, color: '#ef4444' },
          { label: 'Adjustments', value: adjustCount, icon: <SlidersHorizontal size={20} />, color: '#f59e0b' },
          { label: 'Total Events', value: movements.length, icon: <Package size={20} />, color: '#3b82f6' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: `${s.color}20`, color: s.color }}>{s.icon}</div>
            <div className="stat-details"><h3>{s.label}</h3><p>{s.value}</p></div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <label style={{ color: 'var(--text-muted)' }}>Filter by Product:</label>
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'white', minWidth: '200px' }}
        >
          <option value="" style={{ color: 'black' }}>All Products</option>
          {products.map(p => <option key={p.id} value={p.id} style={{ color: 'black' }}>{p.name}</option>)}
        </select>
        {selectedProduct && (
          <button className="btn btn-secondary" onClick={() => setSelectedProduct('')}>Clear Filter</button>
        )}
      </div>

      {/* Timeline Table */}
      <div className="table-container">
        <div className="table-header"><h3>📋 Stock Movement History</h3></div>
        <table>
          <thead>
            <tr><th>Date & Time</th><th>Type</th><th>Product</th><th>Change</th><th>Before → After</th><th>Note</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
            ) : movements.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No movements recorded yet.</td></tr>
            ) : movements.map((m) => (
              <tr key={m.id}>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(m.created_at).toLocaleString('en-IN')}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {movementIcons[m.movement_type]}
                    <span className={`badge ${movementColors[m.movement_type]}`}>{m.movement_type.replace('_', ' ')}</span>
                  </div>
                </td>
                <td>{getProductName(m.product_id)}</td>
                <td>
                  <span style={{ color: m.quantity_change >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                    {m.quantity_change >= 0 ? `+${m.quantity_change}` : m.quantity_change}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {m.quantity_before} → <strong style={{ color: 'white' }}>{m.quantity_after}</strong>
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.note || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;

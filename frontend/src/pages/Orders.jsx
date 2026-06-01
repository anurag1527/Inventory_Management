import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, X, Info, ShoppingCart } from 'lucide-react';

const Orders = () => {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState(null);
  const [formData, setFormData] = useState({ customer_id: '', notes: '', items: [] });
  const [currentItem, setCurrentItem] = useState({ product_id: '', quantity: 1 });
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = async () => {
    try {
      const [o, c, p] = await Promise.all([api.get('/orders'), api.get('/customers'), api.get('/products')]);
      setOrders(o.data);
      setCustomers(c.data);
      setProducts(p.data);
    } catch (e) { console.error(e); }
  };

  const handleAddItem = () => {
    if (!currentItem.product_id || currentItem.quantity <= 0) return;
    const prod = products.find(p => p.id === parseInt(currentItem.product_id));
    if (!prod) return;
    if (prod.quantity < currentItem.quantity) {
      showToast(`Only ${prod.quantity} in stock for "${prod.name}"`, 'error');
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: parseInt(currentItem.product_id), quantity: parseInt(currentItem.quantity), name: prod.name, price: prod.price }]
    }));
    setCurrentItem({ product_id: '', quantity: 1 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id) { showToast('Please select a customer', 'error'); return; }
    if (formData.items.length === 0) { showToast('Add at least one product', 'error'); return; }
    try {
      await api.post('/orders', {
        customer_id: parseInt(formData.customer_id),
        notes: formData.notes,
        items: formData.items.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
      });
      setIsModalOpen(false);
      setFormData({ customer_id: '', notes: '', items: [] });
      fetchAll();
      showToast('Order placed successfully!');
    } catch (e) { showToast(e.response?.data?.detail || 'Error placing order', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel and delete this order? Stock will be restored.')) return;
    try {
      await api.delete(`/orders/${id}`);
      fetchAll();
      showToast('Order cancelled. Stock restored.');
    } catch (e) { showToast('Error', 'error'); }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const getCustomerName = (id) => customers.find(c => c.id === id)?.full_name || `Customer #${id}`;

  return (
    <div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{orders.length} orders · ₹{totalRevenue.toLocaleString('en-IN')} total revenue</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Create Order
        </button>
      </div>

      <div className="table-container">
        <div className="table-header"><h3>Order History</h3></div>
        <table>
          <thead>
            <tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><strong>#{o.id}</strong></td>
                <td>{getCustomerName(o.customer_id)}</td>
                <td>{o.items?.length} item(s)</td>
                <td><strong>₹{o.total_amount?.toLocaleString('en-IN')}</strong></td>
                <td><span className="badge badge-success">{o.status}</span></td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(o.created_at).toLocaleString('en-IN')}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn btn-icon" onClick={() => setDetailsOrder(o)} title="View Details"><Info size={15} /></button>
                    {isAdmin() && <button className="btn btn-icon btn-danger-icon" onClick={() => handleDelete(o.id)} title="Cancel Order"><Trash2 size={15} /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Create Order Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2><ShoppingCart size={20} /> Create Order</h2>
              <button className="btn btn-icon" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Customer</label>
                <select required value={formData.customer_id} onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'white' }}>
                  <option value="" style={{ color: 'black' }}>Select Customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id} style={{ color: 'black' }}>{c.full_name} — {c.email}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Notes (optional)</label><input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Order notes..." /></div>

              <div className="form-section-label">Add Products</div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <select value={currentItem.product_id} onChange={(e) => setCurrentItem({ ...currentItem, product_id: e.target.value })}
                  style={{ flex: 1, padding: '0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'white' }}>
                  <option value="" style={{ color: 'black' }}>Select Product...</option>
                  {products.map(p => <option key={p.id} value={p.id} style={{ color: 'black' }}>{p.name} — ₹{p.price} (Stock: {p.quantity})</option>)}
                </select>
                <input type="number" min="1" value={currentItem.quantity} onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                  style={{ width: '70px', padding: '0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'white' }} />
                <button type="button" className="btn btn-secondary" onClick={handleAddItem}>Add</button>
              </div>
              {formData.items.length > 0 && (
                <div className="order-items-list">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="order-item-row">
                      <span>{item.name} × {item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                      <button type="button" onClick={() => setFormData({ ...formData, items: formData.items.filter((_, i) => i !== idx) })}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><X size={14} /></button>
                    </div>
                  ))}
                  <div className="order-total-row">
                    Total: ₹{formData.items.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString('en-IN')}
                  </div>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Place Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {detailsOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Order #{detailsOrder.id} Details</h2>
              <button className="btn btn-icon" onClick={() => setDetailsOrder(null)}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div><label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>CUSTOMER</label><p>{getCustomerName(detailsOrder.customer_id)}</p></div>
              <div><label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>STATUS</label><p><span className="badge badge-success">{detailsOrder.status}</span></p></div>
              <div><label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>DATE</label><p>{new Date(detailsOrder.created_at).toLocaleString('en-IN')}</p></div>
              <div><label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>TOTAL</label><p><strong>₹{detailsOrder.total_amount?.toLocaleString('en-IN')}</strong></p></div>
              {detailsOrder.notes && <div style={{ gridColumn: 'span 2' }}><label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>NOTES</label><p>{detailsOrder.notes}</p></div>}
            </div>
            <h3 style={{ marginBottom: '0.75rem' }}>Items</h3>
            <table>
              <thead><tr><th>Product ID</th><th>Quantity</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
              <tbody>
                {detailsOrder.items?.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.product_id}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.price_at_time?.toLocaleString('en-IN')}</td>
                    <td><strong>₹{(item.price_at_time * item.quantity)?.toLocaleString('en-IN')}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;

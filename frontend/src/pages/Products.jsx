import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2, X, Package, SlidersHorizontal } from 'lucide-react';

const CATEGORIES = ['General', 'Electronics', 'Clothing', 'Food', 'Furniture', 'Stationery', 'Other'];

const Products = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', sku: '', category: 'General', price: '', quantity: '', low_stock_threshold: 10 });
  const [adjustData, setAdjustData] = useState({ quantity_change: '', movement_type: 'STOCK_IN', note: '' });
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchProducts(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (e) { console.error(e); }
  };

  const handleOpenModal = (product = null) => {
    setCurrentProduct(product);
    setFormData(product
      ? { name: product.name, sku: product.sku, category: product.category, price: product.price, quantity: product.quantity, low_stock_threshold: product.low_stock_threshold }
      : { name: '', sku: '', category: 'General', price: '', quantity: '', low_stock_threshold: 10 });
    setIsModalOpen(true);
  };

  const handleOpenAdjust = (product) => {
    setCurrentProduct(product);
    setAdjustData({ quantity_change: '', movement_type: 'STOCK_IN', note: '' });
    setIsAdjustOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, price: parseFloat(formData.price), quantity: parseInt(formData.quantity), low_stock_threshold: parseInt(formData.low_stock_threshold) };
      if (currentProduct) await api.put(`/products/${currentProduct.id}`, payload);
      else await api.post('/products', payload);
      setIsModalOpen(false);
      fetchProducts();
      showToast(currentProduct ? 'Product updated!' : 'Product added!');
    } catch (e) { showToast(e.response?.data?.detail || 'Error', 'error'); }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/products/${currentProduct.id}/adjust-stock`, {
        quantity_change: parseInt(adjustData.quantity_change),
        movement_type: adjustData.movement_type,
        note: adjustData.note
      });
      setIsAdjustOpen(false);
      fetchProducts();
      showToast('Stock adjusted successfully!');
    } catch (e) { showToast(e.response?.data?.detail || 'Error', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
      showToast('Product deleted.');
    } catch (e) { showToast(e.response?.data?.detail || 'Error', 'error'); }
  };

  return (
    <div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{products.length} products in catalog</p>
        </div>
        {isAdmin() && (
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Add Product
          </button>
        )}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr><th>SKU</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Threshold</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td><code>{p.sku}</code></td>
                <td><strong>{p.name}</strong></td>
                <td><span className="badge badge-blue">{p.category}</span></td>
                <td>₹{p.price?.toLocaleString('en-IN')}</td>
                <td>
                  <span className={`badge ${p.quantity <= p.low_stock_threshold ? 'badge-danger' : 'badge-success'}`}>
                    {p.quantity}
                  </span>
                </td>
                <td>{p.low_stock_threshold}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn btn-icon" title="Adjust Stock" onClick={() => handleOpenAdjust(p)}>
                      <SlidersHorizontal size={15} />
                    </button>
                    {isAdmin() && <>
                      <button className="btn btn-icon" title="Edit" onClick={() => handleOpenModal(p)}>
                        <Edit size={15} />
                      </button>
                      <button className="btn btn-icon btn-danger-icon" title="Delete" onClick={() => handleDelete(p.id)}>
                        <Trash2 size={15} />
                      </button>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No products found.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2><Package size={20} /> {currentProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button className="btn btn-icon" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label>Name</label><input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="form-group"><label>SKU</label><input required value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} /></div>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'white' }}>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ color: 'black' }}>{c}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Price (₹)</label><input type="number" step="0.01" min="0.01" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} /></div>
                <div className="form-group"><label>Quantity</label><input type="number" min="0" required value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Low Stock Threshold</label><input type="number" min="0" value={formData.low_stock_threshold} onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })} /></div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustOpen && currentProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2><SlidersHorizontal size={20} /> Adjust Stock — {currentProduct.name}</h2>
              <button className="btn btn-icon" onClick={() => setIsAdjustOpen(false)}><X size={20} /></button>
            </div>
            <div className="stock-info-bar">
              <span>Current Stock: <strong>{currentProduct.quantity}</strong></span>
            </div>
            <form onSubmit={handleAdjustSubmit}>
              <div className="form-group">
                <label>Action Type</label>
                <select value={adjustData.movement_type} onChange={(e) => setAdjustData({ ...adjustData, movement_type: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'white' }}>
                  <option value="STOCK_IN" style={{ color: 'black' }}>STOCK_IN — Add stock</option>
                  <option value="STOCK_ADJUSTMENT" style={{ color: 'black' }}>STOCK_ADJUSTMENT — Correct quantity</option>
                </select>
              </div>
              <div className="form-group">
                <label>Quantity Change (use negative to reduce)</label>
                <input type="number" required value={adjustData.quantity_change} onChange={(e) => setAdjustData({ ...adjustData, quantity_change: e.target.value })} placeholder="e.g. 10 or -5" />
              </div>
              <div className="form-group"><label>Note (optional)</label><input value={adjustData.note} onChange={(e) => setAdjustData({ ...adjustData, note: e.target.value })} placeholder="Reason for adjustment..." /></div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAdjustOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Apply Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;

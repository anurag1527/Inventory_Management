import React, { useEffect, useState } from 'react';
import api from '../api';
import { Shield, User as UserIcon, Plus, X } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', role: 'manager' });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, customersRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/customers')
      ]);

      const staff = usersRes.data.map(u => ({ ...u, type: 'Staff', displayId: `STAFF-${u.id}` }));
      const custs = customersRes.data.map(c => ({
        ...c,
        type: 'Customer',
        displayId: `CUST-${c.id}`,
        role: 'customer' // Virtual role for display
      }));

      // Combine both lists and sort by newest
      const combined = [...staff, ...custs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setUsers(combined);
    } catch (e) {
      console.error(e);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', formData);
      setIsModalOpen(false);
      setFormData({ full_name: '', email: '', password: '', role: 'manager' });
      fetchData();
      showToast('Staff user added successfully!');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error creating user', 'error');
    }
  };

  return (
    <div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">User & Directory Management</h1>
          <p className="page-subtitle">Showing all Staff (Admins/Managers) and registered Customers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Add Staff
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Account Type</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.displayId}>
                <td><code style={{ color: 'var(--text-muted)' }}>{u.displayId}</code></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="avatar-sm" style={{ background: u.role === 'customer' ? 'var(--success)' : 'var(--primary)' }}>
                      {u.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <strong>{u.full_name}</strong>
                  </div>
                </td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${
                    u.role === 'admin' ? 'badge-danger' : 
                    u.role === 'manager' ? 'badge-blue' : 'badge-success'
                  }`}>
                    {u.role === 'customer' ? <UserIcon size={12} /> : <Shield size={12} />} 
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '0.85rem', color: u.type === 'Staff' ? 'var(--primary)' : 'var(--success)' }}>
                    {u.type}
                  </span>
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(u.created_at).toLocaleDateString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2><Shield size={20} /> Add New Staff (Admin/Manager)</h2>
              <button className="btn btn-icon" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddStaff}>
              <div className="form-group">
                <label>Full Name</label>
                <input required placeholder="Staff Name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" required placeholder="staff@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" required placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'white' }}>
                  <option value="manager" style={{ color: 'black' }}>Manager (Limited Access)</option>
                  <option value="admin" style={{ color: 'black' }}>Admin (Full Access)</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  BarChart2, Warehouse, LogOut, Shield, ArrowLeftRight
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon"><Warehouse size={22} /></div>
        <span>InvManage</span>
      </div>

      <div className="user-badge">
        <div className="user-avatar">{user?.full_name?.charAt(0).toUpperCase()}</div>
        <div>
          <div className="user-name">{user?.full_name}</div>
          <div className={`role-tag ${user?.role}`}>{user?.role}</div>
        </div>
      </div>

      <nav className="nav-links">
        <p className="nav-section-label">Main</p>
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Package size={18} /> Products
        </NavLink>
        <NavLink to="/inventory" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <ArrowLeftRight size={18} /> Inventory
        </NavLink>
        <NavLink to="/orders" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <ShoppingCart size={18} /> Orders
        </NavLink>
        <NavLink to="/customers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Users size={18} /> Customers
        </NavLink>

        <p className="nav-section-label">Insights</p>
        <NavLink to="/analytics" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <BarChart2 size={18} /> Analytics
        </NavLink>

        {isAdmin() && (
          <>
            <p className="nav-section-label">Admin</p>
            <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Shield size={18} /> Users
            </NavLink>
          </>
        )}
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        <LogOut size={18} /> Sign Out
      </button>
    </div>
  );
};

export default Sidebar;

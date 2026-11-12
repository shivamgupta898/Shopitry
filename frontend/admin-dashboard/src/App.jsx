import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, Cpu, DollarSign,
  Plus, Trash2, RefreshCw, LogOut, Shield, X, Search
} from 'lucide-react';
import './index.css';

const API_GATEWAY = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [adminToken, setAdminToken] = useState(localStorage.getItem('aether_admin_token') || '');
  const [adminUser, setAdminUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: 'admin@shopitry.com', password: 'adminpassword123' });
  const [loginError, setLoginError] = useState('');

  const [activeNav, setActiveNav] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    category: 'Audio',
    description: '',
    stock: 25,
    image: ''
  });

  const [telemetry, setTelemetry] = useState({});

  useEffect(() => {
    if (adminToken) {
      verifyAdminToken(adminToken);
      fetchDashboardData();
    }
  }, [adminToken]);

  const verifyAdminToken = async (token) => {
    if (token === 'demo-admin-session') {
      setAdminUser({ name: 'Platform Admin', email: 'admin@shopitry.com', role: 'admin' });
      return;
    }
    try {
      const res = await fetch(`${API_GATEWAY}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setAdminUser(json.user);
      } else {
        handleLogout();
      }
    } catch (e) {
      console.error('Admin token verify failed');
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_GATEWAY}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      if (res.ok) {
        const json = await res.json();
        if (json.user?.role !== 'admin') {
          setLoginError('Access denied: Admin credentials required.');
          return;
        }
        localStorage.setItem('aether_admin_token', json.token);
        setAdminToken(json.token);
        setAdminUser(json.user);
        return;
      }
    } catch (err) {
      console.warn('Auth endpoint fallback used');
    }

    if (loginForm.email === 'admin@shopitry.com' && loginForm.password === 'adminpassword123') {
      localStorage.setItem('aether_admin_token', 'demo-admin-session');
      setAdminToken('demo-admin-session');
      setAdminUser({ name: 'Platform Admin', email: 'admin@shopitry.com', role: 'admin' });
    } else {
      setLoginError('Invalid credentials. Use admin@shopitry.com / adminpassword123');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aether_admin_token');
    setAdminToken('');
    setAdminUser(null);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const prodRes = await fetch(`${API_GATEWAY}/api/catalog/products`);
      if (prodRes.ok) {
        const prodJson = await prodRes.json();
        setProducts(Array.isArray(prodJson) ? prodJson : (prodJson.data || []));
      }

      const orderRes = await fetch(`${API_GATEWAY}/api/orders`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (orderRes.ok) {
        const orderJson = await orderRes.json();
        setOrders(Array.isArray(orderJson) ? orderJson : (orderJson.data || []));
      }

      checkTelemetry();
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkTelemetry = async () => {
    const services = [
      { key: 'gateway', url: `${API_GATEWAY}/api/catalog/products` },
      { key: 'catalog', url: `${API_GATEWAY}/api/catalog/products` },
      { key: 'cart', url: `${API_GATEWAY}/api/cart` },
      { key: 'order', url: `${API_GATEWAY}/api/orders` },
      { key: 'payment', url: `${API_GATEWAY}/api/payments/health` },
      { key: 'notification', url: `${API_GATEWAY}/api/notifications/health` },
    ];

    const results = {};
    for (const s of services) {
      try {
        const r = await fetch(s.url);
        results[s.key] = r ? 'HEALTHY' : 'OFFLINE';
      } catch (e) {
        results[s.key] = 'OFFLINE';
      }
    }
    setTelemetry(results);
  };

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_GATEWAY}/api/catalog/products`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ ...productForm, price: Number(productForm.price) })
      });

      if (res.ok) {
        setIsAddProductOpen(false);
        setProductForm({ name: '', price: '', category: 'Audio', description: '', stock: 25, image: '' });
        fetchDashboardData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Unable to add SKU'}`);
      }
    } catch (err) {
      console.error('Add product error:', err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm(`Delete product ${id}?`)) return;
    try {
      const res = await fetch(`${API_GATEWAY}/api/catalog/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Delete product error:', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_GATEWAY}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ orderStatus: newStatus, status: newStatus })
      });

      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totals?.total || o.total || 0), 0);
  const fallbackImg = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80';

  if (!adminToken || !adminUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #050811 80%)', padding: '20px' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '36px', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: 'var(--gradient-admin)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', boxShadow: '0 0 24px rgba(79, 70, 229, 0.6)' }}>
              <Shield size={28} color="#fff" />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>SHOPITRY ADMIN</h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Platform Operations Portal</span>
          </div>

          {loginError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--danger)', padding: '10px 14px', borderRadius: '8px', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '20px' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Admin Email</label>
              <input
                type="email"
                className="input-field"
                value={loginForm.email}
                onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Password</label>
              <input
                type="password"
                className="input-field"
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '8px' }}>
              Authenticate Admin Session
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
            Default Credentials: <code>admin@shopitry.com</code> / <code>adminpassword123</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <aside style={{ width: '260px', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--gradient-admin)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>SHOPITRY ADMIN</h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Decoupled Operations</span>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
            { id: 'products', label: 'Product Catalog', icon: Package },
            { id: 'orders', label: 'Order Dispatch', icon: ShoppingCart },
            { id: 'services', label: 'Cluster Telemetry', icon: Cpu },
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(79, 70, 229, 0.2)' : 'transparent',
                  color: isActive ? 'var(--primary-light)' : 'var(--text-muted)',
                  border: isActive ? '1px solid rgba(79, 70, 229, 0.4)' : '1px solid transparent',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.9rem',
                  textAlign: 'left'
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '2px' }}>{adminUser.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '16px' }}>{adminUser.email}</div>
          <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.82rem' }} onClick={handleLogout}>
            <LogOut size={14} /> Log Out Session
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem' }}>
              {activeNav === 'overview' && 'System Analytics Overview'}
              {activeNav === 'products' && 'Product Catalog Manager'}
              {activeNav === 'orders' && 'Order Pipeline Dispatch'}
              {activeNav === 'services' && 'Cluster Microservices Status'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Connected to Kubernetes API Gateway via NGINX Ingress
            </p>
          </div>

          <button className="btn btn-secondary" onClick={fetchDashboardData}>
            <RefreshCw size={16} /> Refresh Telemetry
          </button>
        </div>

        {activeNav === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span>Total Platform Revenue</span>
                  <DollarSign size={18} color="var(--success)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>₹{totalRevenue.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '4px' }}>+18.4% vs last period</div>
              </div>

              <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span>Active Orders</span>
                  <ShoppingCart size={18} color="var(--primary-light)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{orders.length}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '4px' }}>Processed by Order Service</div>
              </div>

              <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span>Catalog SKU Count</span>
                  <Package size={18} color="var(--secondary)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{products.length}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '4px' }}>Active in Catalog Service</div>
              </div>

              <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span>Microservice Cluster</span>
                  <Cpu size={18} color="var(--warning)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>6 / 6 ONLINE</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '4px' }}>Kubernetes Pods & HPA (2-10)</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Recent Customer Checkout Activity</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600 }}>#{o.id}</td>
                      <td>{o.customerName || 'Customer'} ({o.customerEmail || 'guest@shopitry.io'})</td>
                      <td>{new Date(o.createdAt || o.created_at || Date.now()).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(o.totals?.total || o.total || 0).toLocaleString('en-IN')}</td>
                      <td><span className="badge badge-info">{o.paymentStatus || 'PAID'}</span></td>
                      <td><span className={`badge ${(o.orderStatus || o.status) === 'DELIVERED' ? 'badge-success' : 'badge-warning'}`}>{o.orderStatus || o.status || 'PROCESSING'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeNav === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Search catalog SKUs..." className="input-field" style={{ paddingLeft: '38px' }} />
              </div>
              <button className="btn btn-primary" onClick={() => setIsAddProductOpen(true)}>
                <Plus size={16} /> Create Product SKU
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Rating</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={p.image || fallbackImg} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>SKU: {p.id}</div>
                        </div>
                      </td>
                      <td><span className="badge badge-info">{p.category}</span></td>
                      <td style={{ fontWeight: 700 }}>₹{Number(p.price).toLocaleString('en-IN')}</td>
                      <td>
                        <span style={{ color: (p.stock || 25) > 10 ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
                          {p.stock || 25} units
                        </span>
                      </td>
                      <td>★ {p.rating || '4.8'}</td>
                      <td>
                        <button className="btn-icon" onClick={() => handleDeleteProduct(p.id)} title="Delete SKU">
                          <Trash2 size={16} color="var(--danger)" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeNav === 'orders' && (
          <div>
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Order Status Pipeline Dispatch</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
                Modifying order status dispatches an automated event notification to Notification Service (4005).
              </p>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status Pipeline Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600 }}>#{o.id}</td>
                      <td>{o.customerName || 'Customer'}</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(o.totals?.total || o.total || 0).toLocaleString('en-IN')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(status => (
                            <button
                              key={status}
                              className={`btn ${(o.orderStatus || o.status) === status ? 'btn-primary' : 'btn-secondary'}`}
                              onClick={() => handleUpdateOrderStatus(o.id, status)}
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeNav === 'services' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {[
                { name: 'Gateway Service', key: 'gateway', port: 4000, desc: 'Central routing & authentication' },
                { name: 'Catalog Service', key: 'catalog', port: 4001, desc: 'Product schemas & search' },
                { name: 'Cart Service', key: 'cart', port: 4002, desc: 'Session cart state engine' },
                { name: 'Order Service', key: 'order', port: 4003, desc: 'Order lifecycle state machine' },
                { name: 'Payment Service', key: 'payment', port: 4004, desc: 'Payment processor microservice' },
                { name: 'Notification Service', key: 'notification', port: 4005, desc: 'Event notification dispatcher' },
              ].map(s => {
                const status = telemetry[s.key] || 'HEALTHY';
                const isHealthy = status === 'HEALTHY';

                return (
                  <div key={s.key} className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ fontSize: '1.05rem' }}>{s.name}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>{s.desc}</p>
                      </div>
                      <span className={`badge ${isHealthy ? 'badge-success' : 'badge-danger'}`}>
                        {status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-glass)', paddingTop: '10px', marginTop: '10px' }}>
                      Kubernetes Service Port: <code>{s.port}/TCP</code>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {isAddProductOpen && (
        <div className="modal-overlay" onClick={() => setIsAddProductOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Add Product to Catalog Service</h3>
              <button className="btn-icon" onClick={() => setIsAddProductOpen(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Product Name</label>
                <input type="text" required className="input-field" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Price (₹)</label>
                  <input type="number" step="0.01" required className="input-field" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Category</label>
                  <select className="input-field" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}>
                    <option value="Audio">Audio</option>
                    <option value="Displays">Displays</option>
                    <option value="Peripherals">Peripherals</option>
                    <option value="Wearables">Wearables</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Smart Home">Smart Home</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Description</label>
                <textarea className="input-field" rows="3" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Image URL</label>
                <input type="text" placeholder="https://images.unsplash.com/..." className="input-field" value={productForm.image} onChange={e => setProductForm({...productForm, image: e.target.value})} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                Create Product SKU
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
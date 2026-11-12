import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/catalog/products`)
      .then((res) => res.json())
      .then(setProducts)
      .catch(() => setStatus('Catalog service unreachable'));
  }, []);

  const addToCart = (product) => {
    setCart((prev) => [...prev, product]);
  };

  const placeOrder = async () => {
    if (!cart.length) return;
    const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'guest-1', items: cart, totalAmount }),
    });
    if (res.ok) {
      const order = await res.json();
      setCart([]);
      setStatus(`Order placed: ${order.orderId}`);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 920, margin: '40px auto', padding: '0 20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Shopitry</h1>
        <button onClick={placeOrder} disabled={!cart.length} style={{ padding: '10px 16px', cursor: 'pointer' }}>
          Checkout ({cart.length})
        </button>
      </header>

      {status && <p style={{ background: '#f3f4f6', padding: 12, borderRadius: 6 }}>{status}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginTop: 24 }}>
        {products.map((item) => (
          <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
            <small style={{ color: '#6b7280' }}>{item.category}</small>
            <h3 style={{ margin: '8px 0' }}>{item.name}</h3>
            <p style={{ fontWeight: 600 }}>₹{item.price.toLocaleString('en-IN')}</p>
            <button onClick={() => addToCart(item)} style={{ width: '100%', padding: 8, cursor: 'pointer' }}>
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
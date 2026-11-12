import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function App() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/orders`).then((r) => r.json()).then(setOrders).catch(() => {});
    fetch(`${API_BASE}/catalog/products`).then((r) => r.json()).then(setProducts).catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 960, margin: '40px auto', padding: '0 20px' }}>
      <h1>Shopitry Operations Console</h1>

      <section style={{ marginTop: 24 }}>
        <h2>Active Inventory ({products.length})</h2>
        <ul>
          {products.map((p) => (
            <li key={p.id}>{p.name} — ₹{p.price.toLocaleString('en-IN')} ({p.stock} in stock)</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Recent Orders ({orders.length})</h2>
        {orders.length === 0 ? <p>No orders placed yet.</p> : (
          <ul>
            {orders.map((o) => (
              <li key={o.orderId}>{o.orderId} | User: {o.userId} | ₹{o.totalAmount} | {o.status}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
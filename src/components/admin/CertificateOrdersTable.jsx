import { useState, useEffect } from 'react';
import { Package, Search, Calendar, MapPin, Loader2, RotateCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function CertificateOrdersTable() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('certificate_orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const { error } = await supabase
        .from('certificate_orders')
        .update({ delivery_status: newStatus })
        .eq('id', orderId);
        
      if (error) throw error;
      
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, delivery_status: newStatus } : o));
    } catch (e) {
      console.error('Failed to update status', e);
      alert('Failed to update delivery status.');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = orders.filter(o => {
    const s = search.toLowerCase();
    const matchSearch = 
      (o.student_name && o.student_name.toLowerCase().includes(s)) ||
      (o.student_email && o.student_email.toLowerCase().includes(s)) ||
      (o.phone && o.phone.includes(s)) ||
      (o.razorpay_order_id && o.razorpay_order_id.toLowerCase().includes(s));
      
    const matchStatus = statusFilter === 'All' || o.delivery_status === statusFilter;
    
    return matchSearch && matchStatus;
  });

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <h2>
          <Package size={22} color="var(--accent)" style={{ display: 'inline', verticalAlign: 'bottom', marginRight: 8 }} /> 
          Physical Certificate Orders
        </h2>
        
        <div className="admin-section-actions">
          <input 
            placeholder="Search by name, email, phone..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="btn btn-outline btn-sm">
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={loadOrders}>
              <RotateCw size={14} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            No orders found matching your search.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Order Details</th>
                  <th>Delivery Address</th>
                  <th>Delivery Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.student_name}</div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>{order.student_email}</div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>{order.phone}</div>
                      <div style={{ marginTop: 6 }}>
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{order.domain}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', marginBottom: 4 }}>
                        <Calendar size={13} className="text-muted" /> 
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.8rem' }}>
                        <span className="text-muted">Pay ID:</span> {order.razorpay_payment_id}
                      </div>
                      <div style={{ fontSize: '0.8rem' }}>
                        <span className="text-muted">Order ID:</span> {order.razorpay_order_id}
                      </div>
                      <span className="badge badge-success" style={{ marginTop: 6, display: 'inline-block' }}>Paid ₹199</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                        <MapPin size={14} className="text-muted" style={{ marginTop: 2, flexShrink: 0 }} />
                        <div style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                          {order.full_name}<br />
                          {order.address_line1}<br />
                          {order.address_line2 && <>{order.address_line2}<br /></>}
                          {order.city}, {order.state} - {order.pincode}<br />
                          {order.country}
                        </div>
                      </div>
                    </td>
                    <td>
                      <select 
                        value={order.delivery_status} 
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        disabled={updating === order.id}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                          background: 'var(--surface-1)',
                          color: 'var(--text)',
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                      {updating === order.id && <Loader2 size={14} className="spin text-muted" style={{ marginLeft: 8 }} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

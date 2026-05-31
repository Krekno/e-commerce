"use client";

import { useEffect, useState } from 'react';
import { getSellerOrders, updateOrderItemStatus } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function SellerOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user || !user.roles?.includes('ROLE_SELLER')) {
        router.push('/');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.roles?.includes('ROLE_SELLER')) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = () => {
    setLoading(true);
    getSellerOrders()
      .then(async data => {
        const detailedOrders = await Promise.all(
          data.map(async (order: any) => {
            const detailedItems = await Promise.all(
              order.items.map(async (item: any) => {
                try {
                  const { getProductById } = await import('@/lib/api');
                  const product = await getProductById(item.productId);
                  return { ...item, product };
                } catch (e) {
                  return item;
                }
              })
            );
            return { ...order, items: detailedItems };
          })
        );
        setOrders(detailedOrders);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to fetch orders');
        setLoading(false);
      });
  };

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    try {
      await updateOrderItemStatus(itemId, newStatus);
      // Re-fetch to see updated data
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };



  if (authLoading || loading) return <div className="container mt-4 text-center">Loading...</div>;

  return (
    <div className="container mt-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>Manage Orders</h1>
        <Link href="/seller" className="btn text-muted" style={{ border: '1px solid var(--border)' }}>
          Back to Dashboard
        </Link>
      </div>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <Package size={48} style={{ opacity: 0.5, margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No orders found</h3>
          <p style={{ opacity: 0.7 }}>When customers purchase your products, they will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map((order: any) => (
            <div key={order.id} style={{ padding: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Order ID: {order.id}</div>
                  <div style={{ fontWeight: 600 }}>Customer: {order.userEmail}</div>
                </div>
                <div style={{ opacity: 0.7, textAlign: 'right' }}>
                  <div style={{ marginBottom: '0.5rem' }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                  {order.status === 'REFUNDED' && (
                    <span style={{ color: 'green', fontWeight: 600, fontSize: '0.875rem' }}>Refunded</span>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {order.items
                  .filter((item: any) => item.sellerEmail === user?.email)
                  .map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {item.product?.imageUrl ? (
                        <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, backgroundColor: 'var(--surface)' }}>
                          <img src={item.product.imageUrl} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                      ) : (
                        <div style={{ width: '60px', height: '60px', borderRadius: '8px', backgroundColor: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={24} style={{ opacity: 0.5 }} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.product?.name || `Product ID: ${item.productId}`}</div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Qty: {item.quantity} - ₺{item.price.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        Status: {item.status}
                      </span>
                      <select 
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                      >
                        <option value="PROCESSING">Processing</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="RETURN_REQUESTED">Return Requested</option>
                        <option value="RETURNED">Returned</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

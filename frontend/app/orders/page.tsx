"use client";

import { useEffect, useState } from 'react';
import { getOrders, requestReturn } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import Link from 'next/link';

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      getOrders()
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
    }
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'SHIPPED':
        return <Truck size={20} className="text-blue-500" />;
      case 'PROCESSING':
        return <Clock size={20} className="text-yellow-500" />;
      case 'CANCELLED':
        return <XCircle size={20} className="text-red-500" />;
      case 'RETURN_REQUESTED':
        return <Clock size={20} className="text-orange-500" />;
      case 'RETURNED':
        return <CheckCircle size={20} className="text-gray-500" />;
      default:
        return <Package size={20} />;
    }
  };

  const getStepper = (status: string) => {
    const steps = ['PROCESSING', 'SHIPPED', 'DELIVERED'];
    const currentIndex = steps.indexOf(status);
    
    if (status === 'CANCELLED') return <div style={{ color: 'red', fontWeight: 'bold' }}>CANCELLED</div>;
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', marginTop: '0.5rem' }}>
        {steps.map((step, index) => (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ 
              width: '20px', height: '20px', borderRadius: '50%', 
              background: index <= currentIndex ? 'var(--primary)' : 'var(--border)',
              color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center',
              fontWeight: 'bold'
            }}>
              {index < currentIndex ? '✓' : index + 1}
            </div>
            <span style={{ opacity: index <= currentIndex ? 1 : 0.5, fontWeight: index <= currentIndex ? 'bold' : 'normal' }}>
              {step}
            </span>
            {index < steps.length - 1 && <div style={{ width: '20px', height: '2px', background: index < currentIndex ? 'var(--primary)' : 'var(--border)' }} />}
          </div>
        ))}
      </div>
    );
  };

  const handleReturnRequest = async (itemId: string) => {
    if (!confirm('Are you sure you want to request a return for this item?')) return;
    try {
      await requestReturn(itemId);
      // Refresh orders
      const data = await getOrders();
      setOrders(data);
      alert('Return request submitted successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to submit return request');
    }
  };



  if (authLoading || loading) return <div className="container mt-4 text-center">Loading orders...</div>;

  return (
    <div className="container mt-4">
      <h1 className="mb-4" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>My Orders</h1>
      {error && <div className="alert alert-error">{error}</div>}
      
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <Package size={48} style={{ opacity: 0.5, margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No orders yet</h3>
          <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>When you buy something, it will appear here.</p>
          <Link href="/" className="btn btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order: any) => (
            <div key={order.id} style={{ padding: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Order ID</div>
                  <div style={{ fontWeight: 600 }}>{order.id}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>Payment: {order.status}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {order.items.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                      {item.product?.imageUrl ? (
                        <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, backgroundColor: 'var(--surface)' }}>
                          <img src={item.product.imageUrl} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                      ) : (
                        <div style={{ width: '80px', height: '80px', borderRadius: '8px', backgroundColor: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={32} style={{ opacity: 0.5 }} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                          {item.product?.name || `Product ID: ${item.productId}`}
                        </div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Qty: {item.quantity} | Seller: {item.sellerEmail}</div>
                        {getStepper(item.status)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>₺{item.price.toFixed(2)}</div>
                      <div>
                        <div style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                          {getStatusIcon(item.status)} <span style={{ fontWeight: 500 }}>{item.status}</span>
                        </div>
                        {item.status === 'DELIVERED' && (
                          <button 
                            onClick={() => handleReturnRequest(item.id)}
                            className="btn" 
                            style={{ marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem', border: '1px solid var(--border)', background: 'transparent' }}
                          >
                            Request Return
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div style={{ opacity: 0.7 }}>
                  Ordered on {new Date(order.createdAt).toLocaleDateString()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {order.status === 'REFUNDED' && (
                    <span style={{ color: 'green', fontWeight: 600, fontSize: '0.875rem' }}>Refunded</span>
                  )}
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                    Total: ₺{order.totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from 'react';
import { getCart, getProductById, removeCartItem, updateCartItemQuantity } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type CartItemDetails = {
  productId: string;
  quantity: number;
  price: number;
  name?: string;
  imageUrl?: string;
};

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<CartItemDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchCartItems = async () => {
      try {
        const cart = await getCart(user.id);
        if (cart && cart.items && cart.items.length > 0) {
          // Fetch product details for each item
          const detailedItems = await Promise.all(
            cart.items.map(async (item: any) => {
              try {
                const product = await getProductById(item.productId);
                return {
                  ...item,
                  name: product.name,
                  imageUrl: product.imageUrl
                };
              } catch (e) {
                // If product was deleted, just return original item
                return { ...item, name: 'Unknown Product' };
              }
            })
          );
          setItems(detailedItems);
        } else {
          setItems([]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load cart');
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, [user, authLoading, router]);

  const handleRemove = async (productId: string) => {
    if (!user) return;
    try {
      await removeCartItem(user.id, productId);
      setItems(items.filter(i => i.productId !== productId));
      toast.success('Item removed');
    } catch (err: any) {
      toast.error('Failed to remove item');
    }
  };

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    if (!user) return;
    if (newQuantity < 1) return;
    
    const previousItems = [...items];
    setItems(items.map(i => i.productId === productId ? { ...i, quantity: newQuantity } : i));
    
    try {
      await updateCartItemQuantity(user.id, productId, newQuantity);
    } catch (err: any) {
      toast.error('Failed to update quantity');
      setItems(previousItems);
    }
  };

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (authLoading || loading) return <div className="container mt-4 text-center">Loading...</div>;

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Your Cart</h1>
      
      {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}
      
      {items.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <p style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--muted)' }}>Your cart is empty.</p>
          <Link href="/" className="btn btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="card">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map(item => (
              <li key={item.productId} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <div 
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    backgroundColor: 'var(--background)', 
                    borderRadius: '8px',
                    backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    flexShrink: 0
                  }} 
                />
                <div style={{ flex: 1 }}>
                  <Link href={`/products/${item.productId}`} style={{ fontWeight: '600', fontSize: '1.25rem', color: 'var(--foreground)', textDecoration: 'none' }}>
                    {item.name}
                  </Link>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', color: 'var(--muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem' }}>₺{item.price.toFixed(2)} x</span>
                      <input 
                        type="number" 
                        min="1"
                        value={item.quantity} 
                        onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 1)}
                        style={{ width: '60px', padding: '0.25rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--background)', color: 'var(--foreground)' }}
                      />
                    </div>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>₺{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemove(item.productId)}
                  className="btn" 
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none' }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '1.5rem' }}>
              Total: <span style={{ fontWeight: '800', color: 'var(--primary)' }}>₺{total.toFixed(2)}</span>
            </div>
            <Link href="/checkout" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

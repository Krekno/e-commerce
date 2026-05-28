"use client";

import { useEffect, useState, use } from 'react';
import { getProductById, createOrder } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);
        setProduct(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleBuy = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setOrdering(true);
    setError('');
    
    try {
      await createOrder({
        items: [
          {
            productId: product.id,
            quantity: quantity,
            price: product.price
          }
        ]
      });
      setOrderSuccess(true);
      
      // Update local stock to reflect purchase
      setProduct((prev: any) => ({
        ...prev,
        stockQuantity: prev.stockQuantity - quantity
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return <div className="container mt-4 text-center">Loading...</div>;
  if (error) return <div className="container mt-4 text-center error-msg">{error}</div>;
  if (!product) return <div className="container mt-4 text-center">Product not found</div>;

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <Link href="/" className="text-muted" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
          &larr; Back to Products
        </Link>
        <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
          <div 
            style={{ 
              height: '300px', 
              backgroundColor: 'var(--border)', 
              borderRadius: '8px',
              backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} 
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{product.name}</h1>
            <p style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '2rem', marginBottom: '1rem' }}>
              ${product.price?.toFixed(2)}
            </p>
            <p className="text-muted" style={{ marginBottom: '2rem', lineHeight: '1.6' }}>
              {product.description || 'No description available for this product.'}
            </p>
            
            <div style={{ marginTop: 'auto' }}>
              <div style={{ marginBottom: '1rem' }}>
                <span className="text-muted">Stock Available: {product.stockQuantity}</span>
              </div>
              
              {orderSuccess ? (
                <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', borderRadius: '8px', textAlign: 'center' }}>
                  <strong>Order placed successfully!</strong>
                  <div style={{ marginTop: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={() => setOrderSuccess(false)}>Buy Again</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <div className="input-group" style={{ marginBottom: 0, width: '100px' }}>
                    <label>Qty</label>
                    <input 
                      type="number" 
                      min="1" 
                      max={product.stockQuantity} 
                      value={quantity} 
                      onChange={e => setQuantity(parseInt(e.target.value) || 1)} 
                    />
                  </div>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1 }} 
                    onClick={handleBuy} 
                    disabled={ordering || product.stockQuantity < 1}
                  >
                    {ordering ? 'Processing...' : product.stockQuantity < 1 ? 'Out of Stock' : 'Buy Now'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

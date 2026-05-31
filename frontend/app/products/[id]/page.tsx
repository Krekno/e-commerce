"use client";

import { useEffect, useState, use } from 'react';
import { getProductById, createOrder, addCartItem, getUserAddresses } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

    // Redirect to checkout with buy now params
    router.push(`/checkout?buyNowProductId=${product.id}&buyNowQuantity=${quantity}`);
  };

  const [addingToCart, setAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setAddingToCart(true);
    setError('');
    try {
      await addCartItem(user.id, {
        productId: product.id,
        quantity: quantity,
        price: product.price,
        sellerEmail: product.sellerEmail
      });
      setCartSuccess(true);
      toast.success(`${quantity} ${quantity > 1 ? 'items' : 'item'} added to cart!`);
      setTimeout(() => setCartSuccess(false), 3000);
    } catch (err: any) {
      const msg = err.message || 'Failed to add to cart';
      setError(msg);
      toast.error(msg);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <div className="container mt-4 text-center">Loading...</div>;
  if (error) return <div className="container mt-4 text-center error-msg">{error}</div>;
  if (!product) return <div className="container mt-4 text-center">Product not found</div>;

  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '2rem auto' }}>
      <div>
        <Link href="/" className="text-muted" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
          &larr; Back to Products
        </Link>
        <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
          <div className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div 
              style={{ 
                width: '100%',
                height: '600px', 
                backgroundColor: 'transparent', 
                backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : 'none',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center'
              }} 
            />
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{product.name}</h1>
            <p style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '2rem', marginBottom: '1rem' }}>
              ₺{product.price?.toFixed(2)}
            </p>
            <p className="text-muted" style={{ marginBottom: '2rem', lineHeight: '1.6' }}>
              {product.description || 'No description available for this product.'}
            </p>
            
            <div style={{ marginTop: 'auto' }}>
              <div style={{ marginBottom: '1rem' }}>
                <span className="text-muted">Stock Available: {product.stockQuantity}</span>
              </div>
              
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="input-group" style={{ marginBottom: 0, width: '80px' }}>
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
                      className="btn" 
                      style={{ flex: 1, minWidth: '140px', backgroundColor: 'var(--border)', color: 'var(--foreground)' }} 
                      onClick={handleAddToCart} 
                      disabled={addingToCart || product.stockQuantity < 1}
                    >
                      {addingToCart ? 'Adding...' : cartSuccess ? '✔ Added' : '🛒 Add to Cart'}
                    </button>
                    
                    <button 
                      className="btn btn-primary" 
                      style={{ flex: 1, minWidth: '140px' }} 
                      onClick={handleBuy} 
                      disabled={product.stockQuantity < 1}
                    >
                      {product.stockQuantity < 1 ? 'Out of Stock' : 'Buy Now'}
                    </button>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

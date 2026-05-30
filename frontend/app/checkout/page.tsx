"use client";

import { useEffect, useState } from 'react';
import { getCart, createOrder, processPayment, clearCart } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type CartItem = {
  productId: string;
  quantity: number;
  price: number;
};

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [cardData, setCardData] = useState({
    cardHolderName: '',
    cardNumber: '',
    expireMonth: '',
    expireYear: '',
    cvc: ''
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchCartItems = async () => {
      try {
        const cart = await getCart(user.email);
        if (cart && cart.items && cart.items.length > 0) {
          setItems(cart.items);
        } else {
          router.push('/cart'); // redirect if cart is empty
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load cart');
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, [user, authLoading, router]);

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setProcessing(true);
    setError('');

    try {
      // 1. Create the Order (deducts stock)
      const order = await createOrder({ items });
      
      // 2. Process Payment via Iyzico dynamically
      await processPayment(order.id, cardData);

      // 3. Clear Cart
      await clearCart(user.email);

      // 4. Show success
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardData({
      ...cardData,
      [e.target.name]: e.target.value
    });
  };

  if (authLoading || loading) return <div className="container mt-4 text-center">Loading...</div>;

  if (success) {
    return (
      <div className="container" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{ color: 'var(--success)', marginBottom: '1rem' }}>Payment Successful!</h1>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>
            Thank you for your order. Your payment was processed dynamically and an email receipt has been sent!
          </p>
          <Link href="/" className="btn btn-primary">Return to Store</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <Link href="/cart" className="text-muted" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
        &larr; Back to Cart
      </Link>
      
      <div className="card" style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          Secure Checkout
        </h1>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', marginBottom: '2rem' }}>
          <span>Total to Pay:</span>
          <span style={{ fontWeight: '800', color: 'var(--primary)' }}>${total.toFixed(2)}</span>
        </div>

        {error && <div className="error-msg" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        <form onSubmit={handleCheckout}>
          <div className="input-group">
            <label>Cardholder Name</label>
            <input 
              type="text" 
              name="cardHolderName" 
              placeholder="John Doe" 
              required 
              value={cardData.cardHolderName} 
              onChange={handleInputChange} 
            />
          </div>
          
          <div className="input-group">
            <label>Card Number</label>
            <input 
              type="text" 
              name="cardNumber" 
              placeholder="0000 0000 0000 0000" 
              required 
              value={cardData.cardNumber} 
              onChange={handleInputChange} 
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Expiry Month</label>
              <input 
                type="text" 
                name="expireMonth" 
                placeholder="12" 
                maxLength={2} 
                required 
                value={cardData.expireMonth} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Expiry Year</label>
              <input 
                type="text" 
                name="expireYear" 
                placeholder="2030" 
                maxLength={4} 
                required 
                value={cardData.expireYear} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>CVC</label>
              <input 
                type="text" 
                name="cvc" 
                placeholder="123" 
                maxLength={3} 
                required 
                value={cardData.cvc} 
                onChange={handleInputChange} 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }}
            disabled={processing}
          >
            {processing ? 'Processing Payment...' : `Pay $${total.toFixed(2)}`}
          </button>
        </form>
      </div>
    </div>
  );
}

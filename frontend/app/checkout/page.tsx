"use client";

import { useEffect, useState } from 'react';
import { getCart, createOrder, processPayment, clearCart, getUserAddresses, addAddress } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type CartItem = {
  productId: string;
  quantity: number;
  price: number;
  sellerEmail?: string;
};

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [addresses, setAddresses] = useState<any[]>([]);
  const [shippingAddressId, setShippingAddressId] = useState('');
  const [billingAddressId, setBillingAddressId] = useState('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    addressType: 'Home',
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
    phone: ''
  });

  const [cardData, setCardData] = useState({
    firstName: '',
    lastName: '',
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
        const buyNowProductId = searchParams.get('buyNowProductId');
        const buyNowQuantity = parseInt(searchParams.get('buyNowQuantity') || '1');

        if (buyNowProductId) {
          const { getProductById } = await import('@/lib/api');
          const product = await getProductById(buyNowProductId);
          setItems([{
            productId: product.id,
            quantity: buyNowQuantity,
            price: product.price,
            sellerEmail: product.sellerEmail
          }]);
        } else {
          const cart = await getCart(user.id);
          if (cart && cart.items && cart.items.length > 0) {
            const detailedItems = await Promise.all(
              cart.items.map(async (item: any) => {
                try {
                  const { getProductById } = await import('@/lib/api');
                  const product = await getProductById(item.productId);
                  return { ...item, sellerEmail: product.sellerEmail };
                } catch (e) {
                  return item;
                }
              })
            );
            setItems(detailedItems);
          } else {
            router.push('/cart'); // redirect if cart is empty
            return;
          }
        }

        let userAddrs: any[] = [];
        try {
          const rawAddrs = await getUserAddresses();
          if (Array.isArray(rawAddrs)) {
            userAddrs = rawAddrs;
          }
        } catch (addrErr: any) {
          console.warn("Could not fetch addresses (likely 404 empty):", addrErr);
        }

        setAddresses(userAddrs);
        if (userAddrs.length > 0) {
          setShippingAddressId(userAddrs[0].id);
          setBillingAddressId(userAddrs[0].id);
        } else {
          setIsAddingAddress(true);
          setError('You have no saved addresses. Please add an address to continue.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load cart');
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, [user, authLoading, router, searchParams]);

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setProcessing(true);
    setError('');

    try {
      if (!shippingAddressId || !billingAddressId) {
        throw new Error("Please select shipping and billing addresses.");
      }

      // 1. Create the Order (deducts stock)
      const order = await createOrder({ items, shippingAddressId, billingAddressId });
      
      // 2. Process Payment via Iyzico dynamically
      const response = await processPayment(order.id, cardData);

      if (response && response.status === 'success') {
          // Clear cart on success only if it wasn't a Buy Now
          if (!searchParams.get('buyNowProductId')) {
            await clearCart(user.id);
          }
          
          setSuccess(true);
      } else {
          throw new Error(response.errorMessage || 'Payment failed.');
      }

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

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewAddress({
      ...newAddress,
      [e.target.name]: e.target.value
    });
  };

  const submitNewAddress = async () => {
    try {
      const added = await addAddress(newAddress);
      setAddresses([...addresses, added]);
      setShippingAddressId(added.id);
      setBillingAddressId(added.id);
      setIsAddingAddress(false);
      setError('');
    } catch (err: any) {
      alert('Failed to add address');
    }
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
          Checkout
        </h1>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', marginBottom: '2rem' }}>
          <span>Total to Pay:</span>
          <span style={{ fontWeight: '800', color: 'var(--primary)' }}>₺{total.toFixed(2)}</span>
        </div>

        {error && <div className="error-msg" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Shipping & Billing Address</h2>
          
          {addresses.length > 0 && !isAddingAddress && (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Shipping Address</label>
                <select 
                  className="input-group input" 
                  value={shippingAddressId} 
                  onChange={(e) => setShippingAddressId(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  {addresses.map(a => <option key={a.id} value={a.id}>{a.addressType} - {a.street}, {a.city}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Billing Address</label>
                <select 
                  className="input-group input" 
                  value={billingAddressId} 
                  onChange={(e) => setBillingAddressId(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  {addresses.map(a => <option key={a.id} value={a.id}>{a.addressType} - {a.street}, {a.city}</option>)}
                </select>
              </div>
              <button onClick={() => setIsAddingAddress(true)} className="btn" style={{ fontSize: '0.875rem' }}>+ Add New Address</button>
            </div>
          )}

          {isAddingAddress && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {addresses.length === 0 && (
                <div style={{ padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px', marginBottom: '1rem', fontWeight: '500' }}>
                  ℹ️ You need to provide an address before you can complete your order.
                </div>
              )}
              <input type="text" name="addressType" placeholder="Type (Home/Work)" value={newAddress.addressType} onChange={handleAddressChange} style={{ padding: '0.5rem' }} />
              <input type="text" name="street" placeholder="Street Address" value={newAddress.street} onChange={handleAddressChange} style={{ padding: '0.5rem' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" name="city" placeholder="City" value={newAddress.city} onChange={handleAddressChange} style={{ flex: 1, padding: '0.5rem' }} />
                <input type="text" name="province" placeholder="State/Province" value={newAddress.province} onChange={handleAddressChange} style={{ flex: 1, padding: '0.5rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" name="postalCode" placeholder="Postal Code" value={newAddress.postalCode} onChange={handleAddressChange} style={{ flex: 1, padding: '0.5rem' }} />
                <input type="text" name="country" placeholder="Country" value={newAddress.country} onChange={handleAddressChange} style={{ flex: 1, padding: '0.5rem' }} />
              </div>
              <input type="text" name="phone" placeholder="Phone Number" value={newAddress.phone} onChange={handleAddressChange} style={{ padding: '0.5rem' }} />
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={submitNewAddress} className="btn btn-primary">Save Address</button>
                {addresses.length > 0 && <button type="button" onClick={() => setIsAddingAddress(false)} className="btn">Cancel</button>}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleCheckout}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>First Name</label>
              <input 
                type="text" 
                name="firstName" 
                placeholder="John" 
                required 
                value={cardData.firstName} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Last Name</label>
              <input 
                type="text" 
                name="lastName" 
                placeholder="Doe" 
                required 
                value={cardData.lastName} 
                onChange={handleInputChange} 
              />
            </div>
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
            {processing ? 'Processing Payment...' : `Pay ₺${total.toFixed(2)}`}
          </button>
        </form>
      </div>
    </div>
  );
}

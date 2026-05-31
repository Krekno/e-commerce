"use client";

import { useEffect, useState } from 'react';
import { getUserAddresses, addAddress } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddressesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newAddress, setNewAddress] = useState({
    addressType: 'Home',
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchAddresses = async () => {
      try {
        const data = await getUserAddresses();
        if (Array.isArray(data)) {
          setAddresses(data);
        }
      } catch (err: any) {
        if (!err.message?.includes('"status":404')) {
          setError(err.message || 'Failed to load addresses');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [user, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewAddress({
      ...newAddress,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMsg('');
    
    try {
      const added = await addAddress(newAddress);
      setAddresses([...addresses, added]);
      setSuccessMsg('Address added successfully!');
      setNewAddress({
        addressType: 'Home',
        street: '',
        city: '',
        province: '',
        postalCode: '',
        country: '',
        phone: ''
      });
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add address');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) return <div className="container mt-4 text-center">Loading...</div>;

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <button onClick={() => router.back()} className="text-muted" style={{ display: 'inline-block', marginBottom: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
        &larr; Go Back
      </button>

      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>My Addresses</h1>

      {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}
      {successMsg && <div style={{ padding: '1rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>{successMsg}</div>}

      <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Saved Addresses</h2>
          {addresses.length === 0 ? (
            <p className="text-muted">You have no saved addresses.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {addresses.map((addr) => (
                <div key={addr.id} className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{addr.addressType}</div>
                  <div className="text-muted">{addr.street}</div>
                  <div className="text-muted">{addr.city}, {addr.province} {addr.postalCode}</div>
                  <div className="text-muted">{addr.country}</div>
                  <div className="text-muted mt-2">Phone: {addr.phone}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Add New Address</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Address Type (Home, Work, etc)</label>
                <input type="text" name="addressType" value={newAddress.addressType} onChange={handleInputChange} required />
              </div>
              <div className="input-group">
                <label>Street</label>
                <input type="text" name="street" value={newAddress.street} onChange={handleInputChange} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>City</label>
                  <input type="text" name="city" value={newAddress.city} onChange={handleInputChange} required />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>State/Province</label>
                  <input type="text" name="province" value={newAddress.province} onChange={handleInputChange} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Postal Code</label>
                  <input type="text" name="postalCode" value={newAddress.postalCode} onChange={handleInputChange} required />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Country</label>
                  <input type="text" name="country" value={newAddress.country} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input type="text" name="phone" value={newAddress.phone} onChange={handleInputChange} required />
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Save Address'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

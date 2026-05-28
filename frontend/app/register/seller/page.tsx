"use client";

import { useState } from 'react';
import { registerSeller } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SellerRegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    storeName: '',
    storeDescription: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setProcessing(true);
    
    // Simulate payment processing delay
    setTimeout(async () => {
      try {
        await registerSeller({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          storeName: formData.storeName,
          storeDescription: formData.storeDescription
        });
        setSuccess(true);
        setTimeout(() => router.push('/login'), 2500);
      } catch (err: any) {
        setError(err.message || 'Registration failed');
        setProcessing(false);
      }
    }, 1500);
  };

  if (success) {
    return (
      <div className="container text-center mt-4">
        <h2>Payment & Registration Successful!</h2>
        <p>Your seller account is ready. Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="auth-container card" style={{ maxWidth: '500px' }}>
        <h2 className="text-center">Become a Seller</h2>
        <p className="text-center text-muted text-sm mt-2 mb-4">
          Join our marketplace. A one-time registration fee of <strong>5000 TRY</strong> applies.
        </p>

        {step === 1 ? (
          <form onSubmit={handleNextStep}>
            <div className="grid grid-cols-2">
              <div className="input-group">
                <label>First Name</label>
                <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label>Last Name</label>
                <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} />
              </div>
            </div>
            
            <div className="input-group">
              <label>Email</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" name="password" required value={formData.password} onChange={handleChange} />
            </div>
            
            <div className="input-group">
              <label>Store Name</label>
              <input type="text" name="storeName" required value={formData.storeName} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Store Description</label>
              <textarea name="storeDescription" rows={3} value={formData.storeDescription} onChange={handleChange}></textarea>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Continue to Payment</button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '1rem', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Registration Fee</span>
                <strong>5000.00 TRY</strong>
              </div>
            </div>

            <div className="input-group">
              <label>Card Number</label>
              <input type="text" name="cardNumber" placeholder="0000 0000 0000 0000" required value={formData.cardNumber} onChange={handleChange} maxLength={19} />
            </div>
            <div className="grid grid-cols-2">
              <div className="input-group">
                <label>Expiry Date</label>
                <input type="text" name="expiry" placeholder="MM/YY" required value={formData.expiry} onChange={handleChange} maxLength={5} />
              </div>
              <div className="input-group">
                <label>CVV</label>
                <input type="text" name="cvv" placeholder="123" required value={formData.cvv} onChange={handleChange} maxLength={4} />
              </div>
            </div>

            {error && <div className="error-msg mb-4">{error}</div>}
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn" onClick={() => setStep(1)} disabled={processing}>Back</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={processing}>
                {processing ? 'Processing Payment...' : 'Pay & Register'}
              </button>
            </div>
          </form>
        )}
        
        <p className="text-center text-sm mt-4 text-muted">
          Don't want to sell? <Link href="/register" style={{ color: 'var(--primary)' }}>Register as a regular user</Link>
        </p>
      </div>
    </div>
  );
}

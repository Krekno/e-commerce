"use client";

import Link from 'next/link';

export default function CheckoutSuccessPage() {
  return (
    <div className="container" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
      <div className="card" style={{ padding: '3rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
        <h1 style={{ color: 'var(--success)', marginBottom: '1rem' }}>Payment Successful!</h1>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>
          Thank you for your order. Your 3D Secure payment was verified and processed successfully. An email receipt has been sent!
        </p>
        <Link href="/" className="btn btn-primary">Return to Store</Link>
      </div>
    </div>
  );
}

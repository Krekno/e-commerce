"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function FailureContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Unknown error occurred during payment verification.';

  return (
    <div className="card" style={{ padding: '3rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
      <h1 style={{ color: 'var(--error)', marginBottom: '1rem' }}>Payment Failed</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>
        Unfortunately, your payment could not be processed. 
        <br /><br />
        <strong>Reason:</strong> {error}
      </p>
      <Link href="/checkout" className="btn btn-primary">Try Again</Link>
    </div>
  );
}

export default function CheckoutFailurePage() {
  return (
    <div className="container" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
      <Suspense fallback={<div>Loading error details...</div>}>
        <FailureContent />
      </Suspense>
    </div>
  );
}

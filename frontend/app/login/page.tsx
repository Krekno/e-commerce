"use client";

import { useState } from 'react';
import { login } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { refreshUser } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      // The backend returns headers with JWT or sets a cookie
      // The exact handling depends on Spring Security setup
      // Assuming our fetchApi wrapper throws if not 200 OK
      await login({ email, password });
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('isAuthenticated', 'true');
      }
      
      // Attempt to refresh user, which should use the HTTP-Only cookie set by backend
      await refreshUser();
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="container">
      <div className="auth-container card">
        <h2 className="text-center">Welcome Back</h2>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="input-group">
            <label>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <div className="error-msg mb-4">{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
        </form>
        <p className="text-center text-sm mt-4 text-muted">
          Don't have an account? <Link href="/register" style={{ color: 'var(--primary)' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

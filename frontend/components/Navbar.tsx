"use client";

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';
import { logout } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, loading, mounted, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jwt');
        localStorage.removeItem('isAuthenticated');
      }
      await refreshUser();
      router.push('/');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link href="/" className="nav-brand">Krekno Market</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div className="nav-links">
            {mounted ? (
              !loading && user ? (
                <>
                  <Link href="/profile" className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600', color: 'var(--foreground)' }}>
                    <span>👤</span> {user.firstName}
                  </Link>
                  <Link href="/seller" className="nav-link">Sell</Link>
                  <button onClick={handleLogout} className="btn" style={{ padding: '0.4rem 1rem' }}>Logout</button>
                </>
              ) : !loading ? (
                <>
                  <Link href="/login" className="nav-link">Login</Link>
                  <Link href="/register" className="btn btn-primary" style={{ padding: '0.4rem 1rem' }}>Sign Up</Link>
                </>
              ) : null
            ) : (
              <>
                <Link href="/login" className="nav-link">Login</Link>
                <Link href="/register" className="btn btn-primary" style={{ padding: '0.4rem 1rem' }}>Sign Up</Link>
              </>
            )}
          </div>
          <button 
            onClick={toggleTheme} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '1.25rem',
              color: 'var(--foreground)'
            }}
            title="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </nav>
  );
}

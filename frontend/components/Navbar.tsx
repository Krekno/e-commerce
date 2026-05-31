"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';
import { ShoppingCart, User, Moon, Sun, Search } from 'lucide-react';
import { useState } from 'react';
import { logout } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, loading, mounted, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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
        <Link href="/" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Image src="/logo.png" alt="Pazar Logo" width={28} height={28} style={{ objectFit: 'contain' }} priority />
          Pazar
        </Link>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: '400px', margin: '0 2rem' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.5rem 1rem 0.5rem 2.5rem', 
                borderRadius: '9999px',
                border: '1px solid var(--border)',
                background: 'var(--background)',
                color: 'var(--foreground)',
                outline: 'none'
              }}
            />
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          </div>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div className="nav-links">
            {mounted ? (
              !loading && user ? (
                <>

                  <Link href="/profile" className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600', color: 'var(--foreground)' }}>
                    <User size={20} /> {user.firstName}
                  </Link>
                  <Link href="/orders" className="nav-link">Orders</Link>
                  <Link href="/cart" className="nav-link" style={{ display: 'flex', alignItems: 'center', paddingRight: '1rem' }} title="View Cart">
                    <ShoppingCart size={20} />
                  </Link>
                  {user.roles?.includes('ROLE_SELLER') && (
                    <Link href="/seller" className="nav-link">Sell</Link>
                  )}
                  {user.roles?.includes('ROLE_ADMIN') && (
                    <Link href="/admin/categories" className="nav-link">Categories</Link>
                  )}
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
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </div>
    </nav>
  );
}

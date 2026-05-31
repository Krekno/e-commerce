"use client";

import { useEffect, useState } from 'react';
import { getProducts, getCategories } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodData, catData] = await Promise.all([getProducts(), getCategories()]);
        if (Array.isArray(prodData)) {
          setProducts(prodData);
        }
        if (Array.isArray(catData)) {
          setCategories(catData);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container">
      <div style={{ 
        position: 'relative', 
        textAlign: 'center', 
        padding: '3rem 1.5rem',
        marginBottom: '2rem',
        borderRadius: '24px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-xl)'
      }}>
        {/* Background Decorative Blobs */}
        <div style={{
          position: 'absolute',
          top: '-30%', left: '-10%',
          width: '60%', height: '160%',
          background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.15) 0%, rgba(255, 255, 255, 0) 70%)',
          zIndex: 0,
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%', right: '-10%',
          width: '60%', height: '160%',
          background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.15) 0%, rgba(255, 255, 255, 0) 70%)',
          zIndex: 0,
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 4vw, 3.5rem)', 
            fontWeight: '800', 
            lineHeight: '1.1',
            letterSpacing: '-0.03em',
            marginBottom: '0',
            color: 'var(--foreground)'
          }}>
            Welcome to{' '}
            <span style={{ 
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block',
              paddingRight: '0.1em'
            }}>
              Pazar
            </span>
          </h1>
        </div>
      </div>

      <div id="products-section" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>Featured Products</h2>
        {!loading && categories.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`btn ${selectedCategoryId === 'all' ? 'btn-primary' : ''}`}
              style={selectedCategoryId !== 'all' ? { background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' } : {}}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`btn ${selectedCategoryId === cat.id ? 'btn-primary' : ''}`}
                style={selectedCategoryId !== cat.id ? { background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' } : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center mt-4">Loading products...</div>
      ) : error ? (
        <div className="text-center error-msg mt-4">{error}</div>
      ) : products.length === 0 ? (
        <div className="text-center mt-4 text-muted">No products available yet.</div>
      ) : (
        <div className="grid grid-cols-4">
          {(selectedCategoryId === 'all' ? products : products.filter(p => p.category?.id === selectedCategoryId)).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
          {(selectedCategoryId === 'all' ? products : products.filter(p => p.category?.id === selectedCategoryId)).length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
              No products found in this category.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

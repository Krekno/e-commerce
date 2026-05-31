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
      <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
        <h1 style={{ 
          fontSize: 'clamp(2rem, 4vw, 3rem)', 
          fontWeight: '800', 
          lineHeight: '1.1',
          letterSpacing: '-0.03em',
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

      <div id="products-section" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>Featured Products</h2>
        {!loading && categories.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Root Categories */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedCategoryId('all')}
                className={`btn ${selectedCategoryId === 'all' ? 'btn-primary' : ''}`}
                style={selectedCategoryId !== 'all' ? { background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' } : {}}
              >
                All Categories
              </button>
              {categories.filter(cat => !cat.parent).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`btn ${selectedCategoryId === cat.id || categories.find(c => c.id === selectedCategoryId)?.parent?.id === cat.id ? 'btn-primary' : ''}`}
                  style={selectedCategoryId !== cat.id && categories.find(c => c.id === selectedCategoryId)?.parent?.id !== cat.id ? { background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' } : {}}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Subcategories (shown if a root category or its subcategory is selected) */}
            {selectedCategoryId !== 'all' && categories.some(cat => cat.parent?.id === (categories.find(c => c.id === selectedCategoryId)?.parent?.id || selectedCategoryId)) && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingLeft: '1rem', borderLeft: '2px solid var(--border)' }}>
                <button
                  onClick={() => setSelectedCategoryId(categories.find(c => c.id === selectedCategoryId)?.parent?.id || selectedCategoryId)}
                  className={`btn btn-sm ${selectedCategoryId === (categories.find(c => c.id === selectedCategoryId)?.parent?.id || selectedCategoryId) ? 'btn-primary' : ''}`}
                  style={selectedCategoryId !== (categories.find(c => c.id === selectedCategoryId)?.parent?.id || selectedCategoryId) ? { background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)', fontSize: '0.875rem' } : { fontSize: '0.875rem' }}
                >
                  All in {categories.find(c => c.id === (categories.find(c => c.id === selectedCategoryId)?.parent?.id || selectedCategoryId))?.name}
                </button>
                {categories.filter(cat => cat.parent?.id === (categories.find(c => c.id === selectedCategoryId)?.parent?.id || selectedCategoryId)).map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`btn btn-sm ${selectedCategoryId === cat.id ? 'btn-primary' : ''}`}
                    style={selectedCategoryId !== cat.id ? { background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)', fontSize: '0.875rem' } : { fontSize: '0.875rem' }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
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
          {(selectedCategoryId === 'all' 
            ? products 
            : products.filter(p => {
                if (p.category?.id === selectedCategoryId) return true;
                const productCat = categories.find(c => c.id === p.category?.id);
                if (productCat?.parent?.id === selectedCategoryId) return true;
                return false;
              })
          ).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
          {(selectedCategoryId === 'all' 
            ? products 
            : products.filter(p => {
                if (p.category?.id === selectedCategoryId) return true;
                const productCat = categories.find(c => c.id === p.category?.id);
                if (productCat?.parent?.id === selectedCategoryId) return true;
                return false;
              })
          ).length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
              No products found in this category.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, use } from 'react';
import { searchProducts } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

export default function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const unwrappedParams = use(searchParams);
  const query = unwrappedParams.q || '';
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError('');
      try {
        if (!query) {
          setProducts([]);
          return;
        }
        const data = await searchProducts(query);
        setProducts(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to search products');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <div className="container" style={{ margin: '2rem auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Search Results</h1>
        {query ? (
          <p className="text-muted">Showing results for <strong>"{query}"</strong></p>
        ) : (
          <p className="text-muted">Please enter a search term.</p>
        )}
      </div>

      {loading ? (
        <div className="text-center mt-4">Loading...</div>
      ) : error ? (
        <div className="error-msg text-center">{error}</div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-4" style={{ gap: '2rem' }}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        query && (
          <div className="card text-center" style={{ padding: '3rem' }}>
            <p style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--muted)' }}>
              No products found matching your search.
            </p>
            <Link href="/" className="btn btn-primary">Back to Home</Link>
          </div>
        )
      )}
    </div>
  );
}

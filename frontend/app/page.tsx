"use client";

import { useEffect, useState } from 'react';
import { getProducts } from '@/lib/api';
import ProductCard from '@/components/ProductCard';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        if (Array.isArray(data)) {
          setProducts(data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem' }}>
          Welcome to <span className="nav-brand">Pazar</span>
        </h1>
        <p className="text-muted" style={{ fontSize: '1.25rem' }}>
          Discover amazing products directly from sellers.
        </p>
      </div>

      {loading ? (
        <div className="text-center mt-4">Loading products...</div>
      ) : error ? (
        <div className="text-center error-msg mt-4">{error}</div>
      ) : products.length === 0 ? (
        <div className="text-center mt-4 text-muted">No products available yet.</div>
      ) : (
        <div className="grid grid-cols-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

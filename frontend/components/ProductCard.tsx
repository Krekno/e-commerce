"use client";

import Link from 'next/link';

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    price: number;
    stockQuantity: number;
    imageUrl?: string;
  };
};

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div 
        style={{ 
          height: '200px', 
          backgroundColor: 'var(--border)', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} 
      />
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{product.name}</h3>
      <p style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1.5rem', marginBottom: '1rem' }}>
        ${product.price?.toFixed(2) || '0.00'}
      </p>
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="text-sm text-muted">Stock: {product.stockQuantity}</span>
        <Link href={`/products/${product.id}`} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
          View Details
        </Link>
      </div>
    </div>
  );
}

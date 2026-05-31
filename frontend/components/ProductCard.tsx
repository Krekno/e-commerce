"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { addCartItem } from '@/lib/api';
import { toast } from 'sonner';

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    price: number;
    stockQuantity: number;
    imageUrl?: string;
    sellerEmail?: string;
  };
};

export default function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please log in to add items to cart.');
      return;
    }
    setAdding(true);
    try {
      await addCartItem(user.id, { 
        productId: product.id, 
        quantity: 1, 
        price: product.price,
        sellerEmail: product.sellerEmail || 'unknown@seller.com'
      });
      toast.success('Added to cart!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Link href={`/products/${product.id}`} style={{ display: 'block' }}>
      <div 
        style={{ 
          height: '300px', 
          backgroundColor: 'transparent', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : 'none',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center'
        }} 
      />
      </Link>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{product.name}</h3>
        <div style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '1.25rem' }}>
          ₺{product.price?.toFixed(2) || '0.00'}
        </div>
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="text-sm text-muted">Stock: {product.stockQuantity}</span>
        <button 
          className="btn btn-primary" 
          style={{ padding: '0.5rem 1rem' }}
          onClick={handleAddToCart}
          disabled={adding || product.stockQuantity <= 0}
        >
          {adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

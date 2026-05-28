"use client";

import { useState } from 'react';
import { createProduct } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function SellerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    imageUrl: '',
    categoryId: '1'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (loading) return <div className="container mt-4">Loading...</div>;

  if (!user || !user.roles?.includes('ROLE_SELLER')) {
    return (
      <div className="container mt-4 text-center">
        <h2>Access Denied</h2>
        <p>You must be logged in as a seller to access this page.</p>
        <button className="btn btn-primary mt-4" onClick={() => router.push('/')}>Go Home</button>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await createProduct({
        ...formData,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity, 10),
        categoryId: parseInt(formData.categoryId, 10)
      });
      setSuccess('Product created successfully!');
      setFormData({
        name: '', description: '', price: '', stockQuantity: '', imageUrl: '', categoryId: '1'
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <h2>Create a New Product</h2>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="input-group">
            <label>Product Name</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Description</label>
            <textarea name="description" rows={3} value={formData.description} onChange={handleChange}></textarea>
          </div>
          <div className="grid grid-cols-2">
            <div className="input-group">
              <label>Price ($)</label>
              <input type="number" step="0.01" name="price" required value={formData.price} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Stock Quantity</label>
              <input type="number" name="stockQuantity" required value={formData.stockQuantity} onChange={handleChange} />
            </div>
          </div>
          <div className="input-group">
            <label>Image URL</label>
            <input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} />
          </div>
          
          {error && <div className="error-msg mb-4">{error}</div>}
          {success && <div style={{ color: 'var(--success)', marginBottom: '1rem' }}>{success}</div>}
          
          <button type="submit" className="btn btn-primary">Create Product</button>
        </form>
      </div>
    </div>
  );
}

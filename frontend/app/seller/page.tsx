"use client";

import { useState, useEffect } from 'react';
import { createProduct, getCategories } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';

export default function SellerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    imageUrl: '',
    categoryId: ''
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getCategories().then(data => {
      setCategories(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, categoryId: data[0].id.toString() }));
      }
    }).catch(console.error);
  }, []);



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

  const rootCategories = categories.filter(c => !c.parent);
  const childCategories = categories.filter(c => c.parent);

  const renderCategoryOptions = () => {
    return rootCategories.map(root => {
      const children = childCategories.filter(c => c.parent.id === root.id);
      if (children.length > 0) {
        return (
          <optgroup key={root.id} label={root.name}>
            <option value={root.id}>{root.name} (General)</option>
            {children.map(child => (
              <option key={child.id} value={child.id}>{child.name}</option>
            ))}
          </optgroup>
        );
      } else {
        return <option key={root.id} value={root.id}>{root.name}</option>;
      }
    });
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
      setFormData(prev => ({
        ...prev,
        name: '', description: '', price: '', stockQuantity: '', imageUrl: ''
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem auto', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Seller Dashboard</h1>
        <button className="btn btn-primary" onClick={() => router.push('/seller/orders')}>
          Manage Orders
        </button>
      </div>
      
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto 2rem auto' }}>
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
              <label>Price (₺)</label>
              <input type="number" step="0.01" name="price" required value={formData.price} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Stock Quantity</label>
              <input type="number" name="stockQuantity" required value={formData.stockQuantity} onChange={handleChange} />
            </div>
          </div>
          <div className="input-group">
            <label>Category</label>
            <select 
              className="form-control mb-4" 
              name="categoryId" 
              value={formData.categoryId} 
              onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
              style={{ width: '100%', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: '1rem', outline: 'none', transition: 'var(--transition)' }}
            >
              {renderCategoryOptions()}
            </select>
          </div>
          <div className="input-group mt-4">
            <label>Product Image</label>
            <ImageUpload 
              currentImage={formData.imageUrl} 
              onUpload={(url) => setFormData({ ...formData, imageUrl: url })} 
            />
          </div>
          
          {error && <div className="error-msg mb-4">{error}</div>}
          {success && <div style={{ color: 'var(--success)', marginBottom: '1rem' }}>{success}</div>}
          
          <button type="submit" className="btn btn-primary">Create Product</button>
        </form>
      </div>
    </div>
  );
}

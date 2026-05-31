"use client";

import { useState, useEffect } from 'react';
import { getCategories, createCategory, deleteCategory } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { FolderOpen, Folder, Trash2, ChevronDown } from 'lucide-react';

export default function AdminCategories() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="container mt-4">Loading...</div>;

  if (!user || !user.roles?.includes('ROLE_ADMIN')) {
    return (
      <div className="container mt-4 text-center">
        <h2>Access Denied</h2>
        <p>You must be logged in as an admin to access this page.</p>
        <button className="btn btn-primary mt-4" onClick={() => router.push('/')}>Go Home</button>
      </div>
    );
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setError('');
    setSuccess('');
    try {
      const payload: any = { name: newCategoryName };
      if (parentCategoryId) {
        payload.parentId = parseInt(parentCategoryId, 10);
      }
      const newCat = await createCategory(payload);
      setCategories([...categories, newCat]);
      setNewCategoryName('');
      setParentCategoryId('');
      setSuccess('Category created successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? All its subcategories might be affected.')) return;
    setError('');
    setSuccess('');
    try {
      await deleteCategory(id);
      // refetch to ensure child categories are properly cleaned up in UI
      fetchCategories();
      setSuccess('Category deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
    }
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

  const renderCategoryNode = (category: any, depth = 0) => {
    const children = categories.filter(c => c.parent?.id === category.id);
    const hasChildren = children.length > 0;
    const isRoot = depth === 0;

    if (!hasChildren && !isRoot) {
      return (
        <div key={category.id} style={{ 
          padding: '1rem 1.25rem', 
          background: 'var(--surface-hover)', 
          borderRadius: 'var(--radius-sm)', 
          border: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <strong style={{ color: 'var(--foreground)' }}>{category.name}</strong> 
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>ID: {category.id}</span>
            <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }} style={{ background: 'transparent', border: 'none', color: 'var(--danger, #ef4444)', cursor: 'pointer', padding: '0.2rem', display: 'flex', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} title="Delete Category"><Trash2 size={18} /></button>
          </div>
        </div>
      );
    }

    return (
      <details key={category.id} style={{ 
        background: isRoot ? 'var(--surface)' : 'transparent',
        borderRadius: isRoot ? 'var(--radius)' : '0',
        border: isRoot ? '1px solid var(--border)' : 'none',
        boxShadow: isRoot ? 'var(--shadow-sm)' : 'none',
        overflow: 'hidden',
        transition: 'var(--transition)',
        marginTop: !isRoot ? '0.5rem' : '0'
      }}>
        <summary style={{ 
          padding: isRoot ? '1.25rem' : '1rem 1.25rem',
          background: !isRoot ? 'var(--surface-hover)' : 'transparent',
          borderRadius: !isRoot ? 'var(--radius-sm)' : '0',
          border: !isRoot ? '1px solid var(--border)' : 'none',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          listStyle: 'none',
          outline: 'none',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => { if(isRoot) e.currentTarget.style.background = 'var(--surface-hover)'; }}
        onMouseLeave={(e) => { if(isRoot) e.currentTarget.style.background = 'transparent'; }}
        >
          {isRoot && (
            <div style={{ 
              width: '48px', height: '48px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              marginRight: '1.25rem', 
              color: 'var(--primary)'
            }}>
              <Folder size={24} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', fontSize: isRoot ? '1.1rem' : '1rem', color: 'var(--foreground)', marginBottom: '0.2rem' }}>{category.name}</strong>
            <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
              ID: {category.id} • {children.length} subcategories
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteCategory(category.id); }} style={{ background: 'transparent', border: 'none', color: 'var(--danger, #ef4444)', cursor: 'pointer', padding: '0.5rem', display: 'flex', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} title="Delete Category"><Trash2 size={20} /></button>
            <div style={{ color: 'var(--muted)', display: 'flex', paddingRight: '0.5rem' }}>
              <ChevronDown size={20} />
            </div>
          </div>
        </summary>
        <div style={{ 
          padding: isRoot ? '0 1.25rem 1.25rem 5.5rem' : '0.5rem 0 0 1.5rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isRoot ? '0.75rem' : '0.5rem' 
        }}>
          {children.length > 0 ? children.map(child => renderCategoryNode(child, depth + 1)) : (
            <div style={{ padding: '0.5rem 1rem', color: 'var(--muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
              No subcategories available.
            </div>
          )}
        </div>
      </details>
    );
  };

  return (
    <div className="container mt-4 page-wrapper">
      <div className="card" style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2.5rem', boxShadow: 'var(--shadow-xl)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block', marginBottom: '0.5rem' }}>
            Manage Categories
          </h2>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>Create and organize your product categories.</p>
        </div>
        
        <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--surface-hover)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <input 
                type="text" 
                placeholder="E.g., Electronics, Clothing" 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                style={{ width: '100%', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: '1rem', outline: 'none', transition: 'var(--transition)' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.15)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <select
                value={parentCategoryId}
                onChange={(e) => setParentCategoryId(e.target.value)}
                style={{ width: '100%', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: '1rem', outline: 'none', transition: 'var(--transition)' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.15)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              >
                <option value="">-- No Parent (Root Category) --</option>
                {renderCategoryOptions()}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}>
              <span style={{ marginRight: '0.5rem', fontSize: '1.2rem', lineHeight: 1 }}>+</span> Add Category
            </button>
          </div>
        </form>

        {error && <div className="error-msg mb-4">{error}</div>}
        {success && <div className="mb-4" style={{ color: 'var(--success)', padding: '1rem 1.5rem', background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '500', fontSize: '1rem' }}>
          <span style={{ background: 'var(--success)', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>✓</span> 
          {success}
        </div>}

        <div style={{ paddingTop: '1rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            Existing Categories
            <span className="badge badge-user" style={{ fontSize: '0.8rem' }}>{categories.length}</span>
          </h3>
          
          {categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--surface-hover)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
              <div style={{ marginBottom: '1rem', opacity: 0.5, display: 'flex', justifyContent: 'center' }}><FolderOpen size={48} /></div>
              <p className="text-muted" style={{ fontSize: '1.15rem' }}>No categories found. Start by adding one above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1" style={{ gap: '1.25rem' }}>
              {rootCategories.map((root) => renderCategoryNode(root))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

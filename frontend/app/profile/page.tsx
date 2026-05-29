"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { updateUser } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    profilePicture: '',
    password: '',
    confirmPassword: ''
  });

  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Initializing form fields when user object loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        profilePicture: user.profilePicture || '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 1.5rem' }}></div>
        <p className="text-muted">Loading your profile details...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container" style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '3rem 2rem', borderRadius: '16px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.75rem' }}>Access Restricted</h2>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>
            Please log in or register to view and customize your account profile.
          </p>
          <button className="btn btn-primary" onClick={() => router.push('/login')} style={{ width: '100%', padding: '0.75rem' }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setUpdating(true);

    try {
      // Prepare update payload
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        profilePicture: formData.profilePicture,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      await updateUser(payload);
      
      // Update the client auth context state
      await refreshUser();
      
      setSuccess('Profile updated successfully!');
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));

      // Dismiss success alert after 4 seconds
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Determine avatar background / fallback initial letter
  const getInitial = () => {
    if (formData.firstName) return formData.firstName.charAt(0).toUpperCase();
    if (user.firstName) return user.firstName.charAt(0).toUpperCase();
    return 'U';
  };

  const isSeller = user.roles?.includes('ROLE_SELLER') || !!(user as any).storeName;

  return (
    <div className="container" style={{ maxWidth: '900px', margin: '1.5rem auto' }}>
      <div className="grid grid-cols-2" style={{ gap: '2.5rem', alignItems: 'start' }}>
        
        {/* Left Side: Avatar Panel & Info Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Visual Avatar Panel */}
          <div className="card text-center" style={{ borderRadius: '16px', position: 'relative', overflow: 'hidden', padding: '2.5rem 1.5rem' }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '80px',
              background: 'linear-gradient(135deg, var(--primary) 0%, rgba(0,0,0,0.7) 100%)',
              opacity: 0.15,
              zIndex: 1
            }}></div>
            
            <div style={{ position: 'relative', zIndex: 2 }}>
              {/* Dynamic Avatar Ring */}
              <div style={{
                position: 'relative',
                width: '120px',
                height: '120px',
                margin: '0 auto 1.5rem',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--muted) 100%)',
                padding: '3px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {formData.profilePicture ? (
                    <img 
                      src={formData.profilePicture} 
                      alt="Profile Avatar" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        // Fallback on broken image link
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--foreground)', opacity: 0.8 }}>
                      {getInitial()}
                    </span>
                  )}
                </div>
              </div>

              <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>{user.email}</p>
              
              {/* Role Badges */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <span className="badge badge-user">Buyer</span>
                {isSeller && (
                  <span className="badge badge-seller">Seller</span>
                )}
              </div>
            </div>
          </div>

          {/* Seller Store Information Card */}
          {isSeller && (
            <div className="card" style={{ borderRadius: '16px', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🏪</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Store Information</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', display: 'block', fontWeight: '600' }}>
                    Store Name
                  </label>
                  <span style={{ fontSize: '1rem', fontWeight: '500' }}>{(user as any).storeName || 'N/A'}</span>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', display: 'block', fontWeight: '600' }}>
                    Store Description
                  </label>
                  <p className="text-muted" style={{ fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
                    {(user as any).storeDescription || 'No description provided.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Account Settings Edit Form */}
        <div className="card" style={{ borderRadius: '16px', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Account Details</h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>First Name</label>
                <input 
                  type="text" 
                  name="firstName" 
                  required 
                  value={formData.firstName} 
                  onChange={handleChange}
                  placeholder="John"
                />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Last Name</label>
                <input 
                  type="text" 
                  name="lastName" 
                  required 
                  value={formData.lastName} 
                  onChange={handleChange}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Email Address</label>
              <input 
                type="email" 
                name="email" 
                required 
                value={formData.email} 
                onChange={handleChange}
                placeholder="john.doe@example.com"
              />
              <span className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                ⚠️ Changing your email address updates your login username.
              </span>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Avatar / Profile Image URL</label>
              <input 
                type="url" 
                name="profilePicture" 
                value={formData.profilePicture} 
                onChange={handleChange}
                placeholder="https://images.unsplash.com/... or absolute url"
              />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />
            
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Change Password (Optional)</h3>
            
            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>New Password</label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange}
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Confirm Password</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange}
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            {error && <div className="error-msg" style={{ margin: '0.5rem 0 0' }}>{error}</div>}
            {success && <div style={{ color: 'var(--success)', fontSize: '0.875rem', margin: '0.5rem 0 0', fontWeight: '500' }}>{success}</div>}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ padding: '0.75rem', width: '100%', marginTop: '0.5rem' }} 
              disabled={updating}
            >
              {updating ? 'Saving Settings...' : 'Save Settings'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

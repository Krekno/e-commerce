"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { updateUser, registerSeller, logout, getUserAddresses } from '@/lib/api';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import { Lock, Store, ChevronDown, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, loading, mounted, refreshUser } = useAuth();
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

  const [sellerData, setSellerData] = useState({
    storeName: '',
    storeDescription: '',
    companyType: 'PERSONAL',
    address: '',
    gsmNumber: '',
    identityNumber: '',
    iban: '',
    cardHolderName: '',
    cardNumber: '',
    expireMonth: '',
    expireYear: '',
    cvc: ''
  });
  const [registeringSeller, setRegisteringSeller] = useState(false);
  const [sellerError, setSellerError] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jwt');
        localStorage.removeItem('isAuthenticated');
      }
      await refreshUser();
      router.push('/');
    } catch (e) {
      console.error(e);
    }
  };

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
      
      // Fetch user addresses for the seller registration form
      getUserAddresses().then(data => {
        if (Array.isArray(data)) {
          setAddresses(data);
          if (data.length > 0 && !sellerData.address) {
            const first = data[0];
            const formatted = `${first.street}, ${first.city}, ${first.province} ${first.postalCode}, ${first.country}`;
            setSellerData(prev => ({ ...prev, address: formatted }));
          }
        }
      }).catch(err => {
        console.error("Failed to fetch addresses:", err);
      }).finally(() => {
        setLoadingAddresses(false);
      });
    }
  }, [user]);

  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  if (loading || !mounted) {
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
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}><Lock size={48} /></div>
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

  const handleSellerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setSellerData({ ...sellerData, [e.target.name]: e.target.value });
  };

  const handleSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSellerError('');
    setRegisteringSeller(true);
    try {
      await registerSeller(sellerData);
      await refreshUser();
      setSuccess('Successfully registered as a seller!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setSellerError(err.message || 'Registration failed');
    } finally {
      setRegisteringSeller(false);
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
                <Store size={24} />
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

        {/* Right Side: Accordion Menus */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Addresses Link Block */}
          <Link href="/addresses" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ borderRadius: '16px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'var(--transition)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: 'var(--foreground)' }}>My Addresses</h2>
              <span style={{ color: 'var(--primary)' }}>Manage &rarr;</span>
            </div>
          </Link>

          {/* Account Details Accordion */}
          <details className="card" style={{ borderRadius: '16px', padding: '1.5rem', transition: 'var(--transition)' }}>
            <summary style={{ fontSize: '1.25rem', fontWeight: '600', cursor: 'pointer', outline: 'none', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Account Details <ChevronDown size={20} />
            </summary>
            
            <div style={{ marginTop: '1.5rem' }}>
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
              <label>Avatar / Profile Image</label>
              <ImageUpload 
                currentImage={formData.profilePicture} 
                onUpload={(url) => setFormData({ ...formData, profilePicture: url })} 
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
          </details>

          {!isSeller && (
            <details className="card" style={{ borderRadius: '16px', padding: '1.5rem', borderTop: '4px solid var(--primary)', transition: 'var(--transition)' }}>
              <summary style={{ fontSize: '1.25rem', fontWeight: '600', cursor: 'pointer', outline: 'none', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Become a Seller <ChevronDown size={20} />
              </summary>
              
              <div style={{ marginTop: '1.5rem' }}>
                <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Start selling your products by completing your seller profile.
              </p>
              
              <form onSubmit={handleSellerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Store Name</label>
                  <input type="text" name="storeName" required value={sellerData.storeName} onChange={handleSellerChange} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Company Type</label>
                  <select name="companyType" required value={sellerData.companyType} onChange={handleSellerChange}>
                    <option value="PERSONAL">Personal</option>
                    <option value="PRIVATE_COMPANY">Private Company</option>
                    <option value="LIMITED_OR_JOINT_STOCK_COMPANY">Limited / Joint Stock</option>
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Store Description</label>
                  <textarea name="storeDescription" rows={3} value={sellerData.storeDescription} onChange={handleSellerChange} style={{ resize: 'vertical' }}></textarea>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Address</label>
                  {loadingAddresses ? (
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>Loading addresses...</p>
                  ) : addresses.length === 0 ? (
                    <div>
                      <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>You don't have any saved addresses.</p>
                      <Link href="/addresses" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-block' }}>Add an Address</Link>
                    </div>
                  ) : (
                    <select name="address" required value={sellerData.address} onChange={handleSellerChange}>
                      {addresses.map(addr => {
                        const formatted = `${addr.street}, ${addr.city}, ${addr.province} ${addr.postalCode}, ${addr.country}`;
                        return (
                          <option key={addr.id} value={formatted}>
                            {addr.addressType} - {addr.street}, {addr.city}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>GSM Number</label>
                  <input type="tel" pattern="[0-9]+" name="gsmNumber" placeholder="5554443322" maxLength={10} minLength={10} required value={sellerData.gsmNumber} onChange={handleSellerChange} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Identity Number (TCKN)</label>
                  <input type="text" name="identityNumber" required value={sellerData.identityNumber} onChange={handleSellerChange} maxLength={11} minLength={11} pattern="[0-9]+" />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>IBAN</label>
                  <input type="text" name="iban" placeholder="TR000000000000000000000000" maxLength={26} required value={sellerData.iban} onChange={handleSellerChange} />
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />
                
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Payment Details (5000 ₺ Registration Fee)</h3>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Card Holder Name</label>
                  <input type="text" name="cardHolderName" required value={sellerData.cardHolderName} onChange={handleSellerChange} placeholder="John Doe" />
                </div>
                
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Card Number</label>
                  <input type="text" name="cardNumber" maxLength={16} minLength={16} pattern="[0-9]+" required value={sellerData.cardNumber} onChange={handleSellerChange} placeholder="1234567890123456" />
                </div>

                <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Exp. Month</label>
                    <input type="text" name="expireMonth" maxLength={2} required value={sellerData.expireMonth} onChange={handleSellerChange} placeholder="MM" />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Exp. Year</label>
                    <input type="text" name="expireYear" maxLength={2} required value={sellerData.expireYear} onChange={handleSellerChange} placeholder="YY" />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>CVC</label>
                    <input type="text" name="cvc" maxLength={3} required value={sellerData.cvc} onChange={handleSellerChange} placeholder="123" />
                  </div>
                </div>

                {sellerError && <div className="error-msg" style={{ margin: '0.5rem 0 0' }}>{sellerError}</div>}

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ padding: '0.75rem', width: '100%', marginTop: '0.5rem' }} 
                  disabled={registeringSeller}
                >
                  {registeringSeller ? 'Processing Payment...' : 'Pay 5000 ₺ & Register'}
                  </button>
                </form>
              </div>
            </details>
          )}

          {/* Logout Button */}
          <div 
            className="card" 
            style={{ borderRadius: '16px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'var(--transition)', border: '1px solid rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.05)', marginTop: '1rem' }}
            onClick={handleLogout}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LogOut size={20} /> Logout
            </h2>
          </div>
        </div>

      </div>
    </div>
  );
}

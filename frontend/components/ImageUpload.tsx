"use client";

import { useState, useRef } from 'react';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string;
}

export default function ImageUpload({ onUpload, currentImage }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: create local preview
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await res.json();
      setPreview(data.secure_url);
      onUpload(data.secure_url);
    } catch (err) {
      console.error(err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
      {preview && (
        <img 
          src={preview} 
          alt="Preview" 
          style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} 
        />
      )}
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        disabled={uploading}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
      <button 
        type="button" 
        className="btn" 
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        style={{ padding: '0.5rem 1rem' }}
      >
        {uploading ? 'Uploading...' : (preview ? 'Change Image' : 'Upload Image')}
      </button>
    </div>
  );
}

'use client';

import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
}

export default function ImageUploader({ images, onImagesChange, maxImages = 5 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remaining = maxImages - images.length;

    if (fileArray.length > remaining) {
      toast.error(`Maksimal ${maxImages} gambar. Anda bisa menambah ${remaining} lagi.`);
      return;
    }

    const formData = new FormData();
    fileArray.forEach(file => formData.append('images', file));

    setUploading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Upload gagal');
        return;
      }

      onImagesChange([...images, ...data.urls]);
      toast.success(data.message);
    } catch {
      toast.error('Gagal upload gambar');
    } finally {
      setUploading(false);
    }
  }, [images, maxImages, onImagesChange]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      handleUpload(e.target.files);
      e.target.value = '';
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) {
      handleUpload(e.dataTransfer.files);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function removeImage(index: number) {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  }

  function moveImage(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= images.length) return;
    const updated = [...images];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onImagesChange(updated);
  }

  const remaining = maxImages - images.length;

  return (
    <div className="space-y-4">
      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((url, index) => (
            <div key={url} className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Gambar ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); moveImage(index, index - 1); }}
                    className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                    title="Geser ke kiri"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); moveImage(index, index + 1); }}
                    className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                    title="Geser ke kanan"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); removeImage(index); }}
                  className="w-8 h-8 bg-red-500/90 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  title="Hapus gambar"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-medium px-2 py-0.5 rounded-md">
                {index + 1}
              </div>

              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-primary-600 text-white text-xs font-medium px-2 py-0.5 rounded-md">
                  Utama
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Zone */}
      {remaining > 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-primary-500 bg-primary-50 scale-[1.02]'
              : uploading
              ? 'border-gray-300 bg-gray-50 opacity-60'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-sm font-medium text-gray-600">Mengupload gambar...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Klik atau seret gambar ke sini
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPEG, PNG, WebP, GIF • Maks 5MB • {remaining} slot tersisa
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          {images.length} dari {maxImages} gambar • Seret untuk mengurutkan • Gambar pertama adalah gambar utama
        </p>
      )}
    </div>
  );
}

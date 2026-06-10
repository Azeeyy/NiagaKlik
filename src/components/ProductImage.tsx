'use client';

import { useState } from 'react';

interface ProductImageProps {
  name: string;
  category: string;
  image?: string;
  className?: string;
  isPreOrder?: boolean;
  condition?: string;
}

// Category-specific gradient pairs (hex colors) and icons
const categoryStyles: Record<string, { from: string; to: string; icon: string }> = {
  'Elektronik':       { from: '#60a5fa', to: '#4f46e5', icon: '📱' },
  'Fashion Pria':     { from: '#06b6d4', to: '#1d4ed8', icon: '👔' },
  'Fashion Wanita':   { from: '#f472b6', to: '#e11d48', icon: '👗' },
  'Makanan & Minuman': { from: '#fb923c', to: '#ef4444', icon: '🍕' },
  'Kesehatan':        { from: '#34d399', to: '#0d9488', icon: '💊' },
  'Kecantikan':       { from: '#a78bfa', to: '#9333ea', icon: '💄' },
  'Olahraga':         { from: '#84cc16', to: '#16a34a', icon: '🏃' },
  'Otomotif':         { from: '#64748b', to: '#334155', icon: '🚗' },
  'Buku':             { from: '#fbbf24', to: '#ca8a04', icon: '📚' },
  'Mainan & Hobi':    { from: '#e879f9', to: '#db2777', icon: '🎮' },
  'Perlengkapan Rumah': { from: '#fb7185', to: '#f97316', icon: '🏠' },
  'Aksesoris':        { from: '#c084fc', to: '#6366f1', icon: '⌚' },
};

const defaultStyle = { from: '#60a5fa', to: '#7c3aed', icon: '🎯' };

function getCategoryStyle(category: string) {
  return categoryStyles[category] || defaultStyle;
}

export default function ProductImage({ name, category, image, className = '', isPreOrder, condition }: ProductImageProps) {
  const [imgError, setImgError] = useState(false);
  const hasImage = image && image.length > 0 && !imgError;

  const style = getCategoryStyle(category);

  // Badges - shared by both real images and SVG placeholders
  const badges = (
    <>
      <div className="absolute top-3 left-3 flex flex-col gap-1">
        {isPreOrder && (
          <span className="px-2.5 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg shadow-lg">
            PRE-ORDER
          </span>
        )}
      </div>
      {condition === 'bekas' && (
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 bg-yellow-500 text-white text-xs font-bold rounded-lg shadow-lg">
            Bekas
          </span>
        </div>
      )}
    </>
  );

  if (hasImage) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
        {badges}
      </div>
    );
  }

  // Generate gradient SVG placeholder
  const gradientId = `grad-${name.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={style.from} />
            <stop offset="100%" stopColor={style.to} />
          </linearGradient>
        </defs>

        <rect width="400" height="400" fill={`url(#${gradientId})`} />
        
        {/* Decorative circles */}
        <circle cx="80" cy="80" r="160" fill="white" opacity="0.08" />
        <circle cx="320" cy="120" r="140" fill="white" opacity="0.06" />
        <circle cx="200" cy="320" r="120" fill="white" opacity="0.05" />

        {/* Icon */}
        <text
          x="200"
          y="170"
          textAnchor="middle"
          fontSize="80"
          dominantBaseline="central"
        >
          {style.icon}
        </text>

        {/* Product name */}
        <text
          x="200"
          y="260"
          textAnchor="middle"
          fill="white"
          opacity="0.9"
          fontSize="16"
          fontWeight="600"
          fontFamily="Inter, system-ui, sans-serif"
          dominantBaseline="central"
        >
          <tspan x="200" dy="0">
            {name.length > 30 ? name.substring(0, 28) + '…' : name}
          </tspan>
        </text>

        {/* Category label */}
        <text
          x="200"
          y="290"
          textAnchor="middle"
          fill="white"
          opacity="0.6"
          fontSize="12"
          fontFamily="Inter, system-ui, sans-serif"
          dominantBaseline="central"
        >
          {category}
        </text>
      </svg>
      {badges}
    </div>
  );
}

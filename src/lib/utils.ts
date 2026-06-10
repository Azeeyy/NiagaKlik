export function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
  }).format(new Date(date));
}

export function formatDateRelative(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  return formatDateShort(date);
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NK-${timestamp}-${random}`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'status-pending',
    diproses: 'status-processing',
    dikirim: 'status-shipped',
    selesai: 'status-completed',
    dibatalkan: 'status-cancelled',
  };
  return colors[status] || 'status-pending';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Menunggu',
    diproses: 'Diproses',
    dikirim: 'Dikirim',
    selesai: 'Selesai',
    dibatalkan: 'Dibatalkan',
  };
  return labels[status] || status;
}

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cn_wallet: 'CN Wallet',
    qris: 'QRIS',
    cod: 'COD (Bayar di Tempat)',
  };
  return labels[method] || method;
}

export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * 0.05); // 5% fee
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function getInitials(name: string): string {
  const parts = name.split(' ');
  const initials = parts
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  // For single-word names, take first 2 chars of the name
  if (initials.length < 2 && name.length >= 2) {
    return name.substring(0, 2).toUpperCase();
  }
  
  return initials;
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const PRODUCT_CATEGORIES = [
  'Elektronik',
  'Fashion Pria',
  'Fashion Wanita',
  'Makanan & Minuman',
  'Kesehatan',
  'Kecantikan',
  'Olahraga',
  'Otomotif',
  'Buku',
  'Mainan & Hobi',
  'Perlengkapan Rumah',
  'Aksesoris',
  'Lainnya',
] as const;

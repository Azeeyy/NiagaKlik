import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  getStatusLabel,
  getStatusColor,
  getPaymentMethodLabel,
  calculatePlatformFee,
  truncateText,
  getInitials,
  generateOTP,
  cn,
  formatDateRelative,
  formatDateShort,
} from '@/lib/utils';

describe('formatPrice', () => {
  it('formats zero', () => {
    const result = formatPrice(0);
    // Intl inserts non-breaking space (\xa0) between Rp and number in id-ID locale
    expect(result.replace(/\xa0/g, ' ').trim()).toBe('Rp 0');
  });

  it('formats thousands', () => {
    const result = formatPrice(15000);
    expect(result.replace(/\xa0/g, ' ').trim()).toBe('Rp 15.000');
  });

  it('formats millions', () => {
    const result = formatPrice(12999000);
    expect(result.replace(/\xa0/g, ' ').trim()).toBe('Rp 12.999.000');
  });

  it('formats large numbers', () => {
    const result = formatPrice(1000000000);
    expect(result.replace(/\xa0/g, ' ').trim()).toBe('Rp 1.000.000.000');
  });

  it('handles small numbers', () => {
    const result = formatPrice(99);
    expect(result.replace(/\xa0/g, ' ').trim()).toBe('Rp 99');
  });
});

describe('getStatusLabel', () => {
  it('returns correct label for pending', () => {
    expect(getStatusLabel('pending')).toBe('Menunggu');
  });

  it('returns correct label for diproses', () => {
    expect(getStatusLabel('diproses')).toBe('Diproses');
  });

  it('returns correct label for dikirim', () => {
    expect(getStatusLabel('dikirim')).toBe('Dikirim');
  });

  it('returns correct label for selesai', () => {
    expect(getStatusLabel('selesai')).toBe('Selesai');
  });

  it('returns correct label for dibatalkan', () => {
    expect(getStatusLabel('dibatalkan')).toBe('Dibatalkan');
  });

  it('returns the input string for unknown status', () => {
    expect(getStatusLabel('unknown')).toBe('unknown');
  });
});

describe('getStatusColor', () => {
  it('returns status-pending for pending', () => {
    expect(getStatusColor('pending')).toBe('status-pending');
  });

  it('returns status-processing for diproses', () => {
    expect(getStatusColor('diproses')).toBe('status-processing');
  });

  it('returns status-shipped for dikirim', () => {
    expect(getStatusColor('dikirim')).toBe('status-shipped');
  });

  it('returns status-completed for selesai', () => {
    expect(getStatusColor('selesai')).toBe('status-completed');
  });

  it('returns status-cancelled for dibatalkan', () => {
    expect(getStatusColor('dibatalkan')).toBe('status-cancelled');
  });

  it('returns default for unknown status', () => {
    expect(getStatusColor('unknown')).toBe('status-pending');
  });
});

describe('getPaymentMethodLabel', () => {
  it('returns CN Wallet for cn_wallet', () => {
    expect(getPaymentMethodLabel('cn_wallet')).toBe('CN Wallet');
  });

  it('returns QRIS for qris', () => {
    expect(getPaymentMethodLabel('qris')).toBe('QRIS');
  });

  it('returns COD label for cod', () => {
    expect(getPaymentMethodLabel('cod')).toBe('COD (Bayar di Tempat)');
  });

  it('returns input for unknown method', () => {
    expect(getPaymentMethodLabel('unknown')).toBe('unknown');
  });
});

describe('calculatePlatformFee', () => {
  it('calculates 5% fee correctly', () => {
    expect(calculatePlatformFee(100000)).toBe(5000);
  });

  it('rounds down odd fee amounts', () => {
    expect(calculatePlatformFee(99999)).toBe(5000); // 4999.95 → 5000
  });

  it('handles zero amount', () => {
    expect(calculatePlatformFee(0)).toBe(0);
  });

  it('handles large amounts', () => {
    expect(calculatePlatformFee(100000000)).toBe(5000000);
  });

  it('handles 1 rupiah', () => {
    // 1 * 0.05 = 0.05 → rounded to 0
    expect(calculatePlatformFee(1)).toBe(0);
  });
});

describe('truncateText', () => {
  it('returns text unchanged if within max length', () => {
    expect(truncateText('Hello', 10)).toBe('Hello');
  });

  it('truncates and adds ellipsis', () => {
    expect(truncateText('Hello World This Is Long', 10)).toBe('Hello Worl...');
  });

  it('handles empty string', () => {
    expect(truncateText('', 5)).toBe('');
  });

  it('handles exact length', () => {
    expect(truncateText('Exact', 5)).toBe('Exact');
  });
});

describe('getInitials', () => {
  it('gets initials from full name', () => {
    expect(getInitials('Budi Santoso')).toBe('BS');
  });

  it('gets initials from single name', () => {
    expect(getInitials('Budi')).toBe('BU');
  });

  it('returns uppercase', () => {
    expect(getInitials('budi santoso')).toBe('BS');
  });

  it('handles three word names', () => {
    expect(getInitials('Muhammad Ali Khan')).toBe('MA');
  });
});

describe('generateOTP', () => {
  it('generates a 6-digit string', () => {
    const otp = generateOTP();
    expect(otp).toHaveLength(6);
    expect(Number.isInteger(Number(otp))).toBe(true);
  });

  it('generates at least 100000', () => {
    for (let i = 0; i < 100; i++) {
      const otp = generateOTP();
      expect(Number(otp)).toBeGreaterThanOrEqual(100000);
      expect(Number(otp)).toBeLessThanOrEqual(999999);
    }
  });

  it('generates different values on successive calls', () => {
    const otp1 = generateOTP();
    const otp2 = generateOTP();
    expect(otp1).not.toBe(otp2);
  });
});

describe('cn (classname utility)', () => {
  it('joins truthy class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('filters out falsy values', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar');
  });

  it('handles all falsy values', () => {
    expect(cn(false, undefined, null)).toBe('');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });
});

describe('formatDateRelative', () => {
  it('returns "Baru saja" for very recent dates', () => {
    const now = new Date();
    expect(formatDateRelative(now)).toBe('Baru saja');
  });

  it('returns minutes for recent dates', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatDateRelative(fiveMinAgo)).toBe('5 menit lalu');
  });

  it('returns hours for older dates', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000);
    expect(formatDateRelative(threeHoursAgo)).toBe('3 jam lalu');
  });

  it('returns days for much older dates', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400 * 1000);
    expect(formatDateRelative(twoDaysAgo)).toBe('2 hari lalu');
  });
});

describe('formatDateShort', () => {
  it('formats date in Indonesian format', () => {
    const date = new Date('2024-06-15');
    const result = formatDateShort(date);
    expect(result).toContain('2024');
    expect(result).toContain('15');
    // Should contain Indonesian month name or number
    expect(result.length).toBeGreaterThan(0);
  });
});

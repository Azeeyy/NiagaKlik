import { describe, it, expect } from 'vitest';
import {
  isValidTransition,
  canCancelOrder,
  canPerformAction,
  getAllowedTransitions,
  getTargetStatusForAction,
  calculateOrderFinancials,
  calculatePlatformFeeForPayment,
} from '@/lib/order-validator';

describe('Order Status Flow - Validation', () => {
  describe('isValidTransition', () => {
    it('allows pending → diproses', () => {
      expect(isValidTransition('pending', 'diproses')).toBe(true);
    });

    it('allows pending → dibatalkan', () => {
      expect(isValidTransition('pending', 'dibatalkan')).toBe(true);
    });

    it('allows diproses → dikirim', () => {
      expect(isValidTransition('diproses', 'dikirim')).toBe(true);
    });

    it('allows diproses → dibatalkan', () => {
      expect(isValidTransition('diproses', 'dibatalkan')).toBe(true);
    });

    it('allows dikirim → selesai', () => {
      expect(isValidTransition('dikirim', 'selesai')).toBe(true);
    });

    it('forbids pending → dikirim (skip)', () => {
      expect(isValidTransition('pending', 'dikirim')).toBe(false);
    });

    it('forbids pending → selesai (skip)', () => {
      expect(isValidTransition('pending', 'selesai')).toBe(false);
    });

    it('forbids selesai → anything', () => {
      expect(isValidTransition('selesai', 'diproses')).toBe(false);
      expect(isValidTransition('selesai', 'dikirim')).toBe(false);
      expect(isValidTransition('selesai', 'pending')).toBe(false);
    });

    it('forbids dibatalkan → anything', () => {
      expect(isValidTransition('dibatalkan', 'diproses')).toBe(false);
      expect(isValidTransition('dibatalkan', 'pending')).toBe(false);
    });

    it('returns false for unknown status', () => {
      expect(isValidTransition('unknown' as any, 'diproses')).toBe(false);
    });
  });

  describe('getAllowedTransitions', () => {
    it('returns diproses and dibatalkan for pending', () => {
      expect(getAllowedTransitions('pending')).toEqual(['diproses', 'dibatalkan']);
    });

    it('returns dikirim and dibatalkan for diproses', () => {
      expect(getAllowedTransitions('diproses')).toEqual(['dikirim', 'dibatalkan']);
    });

    it('returns selesai for dikirim', () => {
      expect(getAllowedTransitions('dikirim')).toEqual(['selesai']);
    });

    it('returns empty for selesai', () => {
      expect(getAllowedTransitions('selesai')).toEqual([]);
    });

    it('returns empty for dibatalkan', () => {
      expect(getAllowedTransitions('dibatalkan')).toEqual([]);
    });
  });

  describe('getTargetStatusForAction', () => {
    it('maps process to diproses', () => {
      expect(getTargetStatusForAction('process')).toBe('diproses');
    });

    it('maps ship to dikirim', () => {
      expect(getTargetStatusForAction('ship')).toBe('dikirim');
    });

    it('maps complete to selesai', () => {
      expect(getTargetStatusForAction('complete')).toBe('selesai');
    });

    it('maps cancel to dibatalkan', () => {
      expect(getTargetStatusForAction('cancel')).toBe('dibatalkan');
    });

    it('returns null for unknown action', () => {
      expect(getTargetStatusForAction('unknown' as any)).toBeNull();
    });
  });

  describe('canCancelOrder', () => {
    // Pembeli rules
    it('pembeli can cancel pending order', () => {
      expect(canCancelOrder('pending', 'pembeli')).toEqual({ valid: true });
    });

    it('pembeli cannot cancel diproses order', () => {
      expect(canCancelOrder('diproses', 'pembeli')).toEqual({
        valid: false,
        error: 'Pembeli hanya dapat membatalkan pesanan dengan status "pending"',
      });
    });

    it('pembeli cannot cancel dikirim order', () => {
      expect(canCancelOrder('dikirim', 'pembeli')).toEqual({
        valid: false,
        error: 'Pembeli hanya dapat membatalkan pesanan dengan status "pending"',
      });
    });

    it('pembeli cannot cancel completed order', () => {
      expect(canCancelOrder('selesai', 'pembeli')).toEqual({
        valid: false,
        error: 'Pesanan sudah selesai, tidak dapat dibatalkan',
      });
    });

    // Penjual rules
    it('penjual can cancel pending order', () => {
      expect(canCancelOrder('pending', 'penjual')).toEqual({ valid: true });
    });

    it('penjual can cancel diproses order', () => {
      expect(canCancelOrder('diproses', 'penjual')).toEqual({ valid: true });
    });

    it('penjual cannot cancel dikirim order', () => {
      const result = canCancelOrder('dikirim', 'penjual');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Penjual hanya dapat membatalkan');
    });

    it('penjual cannot cancel completed order', () => {
      expect(canCancelOrder('selesai', 'penjual')).toEqual({
        valid: false,
        error: 'Pesanan sudah selesai, tidak dapat dibatalkan',
      });
    });

    // Operator rules
    it('operator can cancel any active order', () => {
      expect(canCancelOrder('pending', 'operator')).toEqual({ valid: true });
      expect(canCancelOrder('diproses', 'operator')).toEqual({ valid: true });
      expect(canCancelOrder('dikirim', 'operator')).toEqual({ valid: true });
    });

    it('operator cannot cancel completed order', () => {
      expect(canCancelOrder('selesai', 'operator')).toEqual({
        valid: false,
        error: 'Pesanan sudah selesai, tidak dapat dibatalkan',
      });
    });

    // Already cancelled
    it('cannot cancel already cancelled order', () => {
      expect(canCancelOrder('dibatalkan', 'pembeli')).toEqual({
        valid: false,
        error: 'Pesanan sudah dibatalkan sebelumnya',
      });
    });
  });

  describe('canPerformAction - process', () => {
    it('penjual can process pending order', () => {
      expect(canPerformAction('pending', 'process', 'penjual')).toEqual({ valid: true });
    });

    it('pembeli cannot process order', () => {
      const result = canPerformAction('pending', 'process', 'pembeli');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Hanya penjual');
    });

    it('cannot process already processed order', () => {
      const result = canPerformAction('diproses', 'process', 'penjual');
      expect(result.valid).toBe(false);
    });

    it('cannot process completed order', () => {
      const result = canPerformAction('selesai', 'process', 'penjual');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('sudah selesai');
    });
  });

  describe('canPerformAction - ship', () => {
    it('penjual can ship processed order', () => {
      expect(canPerformAction('diproses', 'ship', 'penjual')).toEqual({ valid: true });
    });

    it('pembeli cannot ship order', () => {
      const result = canPerformAction('diproses', 'ship', 'pembeli');
      expect(result.valid).toBe(false);
    });

    it('cannot ship pending order directly', () => {
      const result = canPerformAction('pending', 'ship', 'penjual');
      expect(result.valid).toBe(false);
    });
  });

  describe('canPerformAction - complete', () => {
    it('pembeli can complete shipped order', () => {
      expect(canPerformAction('dikirim', 'complete', 'pembeli')).toEqual({ valid: true });
    });

    it('penjual cannot complete order', () => {
      const result = canPerformAction('dikirim', 'complete', 'penjual');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Hanya pembeli');
    });

    it('cannot complete pending order', () => {
      const result = canPerformAction('pending', 'complete', 'pembeli');
      expect(result.valid).toBe(false);
    });
  });

  describe('canPerformAction - cancel (integration)', () => {
    it('pembeli can cancel pending order', () => {
      expect(canPerformAction('pending', 'cancel', 'pembeli')).toEqual({ valid: true });
    });

    it('pembeli cannot cancel diproses order', () => {
      const result = canPerformAction('diproses', 'cancel', 'pembeli');
      expect(result.valid).toBe(false);
    });

    it('penjual can cancel pending order', () => {
      expect(canPerformAction('pending', 'cancel', 'penjual')).toEqual({ valid: true });
    });

    it('penjual can cancel diproses order', () => {
      expect(canPerformAction('diproses', 'cancel', 'penjual')).toEqual({ valid: true });
    });

    it('cannot cancel completed order', () => {
      const result = canPerformAction('selesai', 'cancel', 'pembeli');
      expect(result.valid).toBe(false);
    });
  });
});

describe('Order Financial Calculations', () => {
  describe('calculatePlatformFeeForPayment', () => {
    it('charges 5% fee for CN Wallet', () => {
      expect(calculatePlatformFeeForPayment(100000, 'cn_wallet')).toBe(5000);
    });

    it('charges 5% fee for QRIS', () => {
      expect(calculatePlatformFeeForPayment(100000, 'qris')).toBe(5000);
    });

    it('charges no fee for COD', () => {
      expect(calculatePlatformFeeForPayment(100000, 'cod')).toBe(0);
    });

    it('handles zero amount', () => {
      expect(calculatePlatformFeeForPayment(0, 'cn_wallet')).toBe(0);
    });
  });

  describe('calculateOrderFinancials', () => {
    it('calculates CN Wallet transaction correctly', () => {
      const result = calculateOrderFinancials(100000, 'cn_wallet', 15000);
      expect(result).toEqual({
        subtotal: 100000,
        platformFee: 5000,
        shippingCost: 15000,
        codFee: 0,
        grandTotal: 120000,
      });
    });

    it('calculates COD transaction correctly', () => {
      const result = calculateOrderFinancials(100000, 'cod', 15000);
      expect(result).toEqual({
        subtotal: 100000,
        platformFee: 0,
        shippingCost: 15000,
        codFee: 5000,
        grandTotal: 120000,
      });
    });

    it('calculates QRIS transaction correctly', () => {
      const result = calculateOrderFinancials(50000, 'qris', 10000);
      expect(result).toEqual({
        subtotal: 50000,
        platformFee: 2500,
        shippingCost: 10000,
        codFee: 0,
        grandTotal: 62500,
      });
    });

    it('handles zero shipping cost', () => {
      const result = calculateOrderFinancials(200000, 'cn_wallet', 0);
      expect(result).toEqual({
        subtotal: 200000,
        platformFee: 10000,
        shippingCost: 0,
        codFee: 0,
        grandTotal: 210000,
      });
    });

    it('handles large amounts', () => {
      const result = calculateOrderFinancials(10000000, 'cn_wallet', 50000);
      expect(result).toEqual({
        subtotal: 10000000,
        platformFee: 500000,
        shippingCost: 50000,
        codFee: 0,
        grandTotal: 10550000,
      });
    });
  });
});

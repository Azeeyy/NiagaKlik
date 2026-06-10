import { describe, it, expect } from 'vitest';
import {
  canWithdrawBalance,
  canTopUp,
  applyTopUp,
  applyPayment,
  applySellerTransfer,
  applyWithdrawal,
  applyRefund,
} from '@/lib/order-validator';

describe('Wallet - Validation', () => {
  describe('canTopUp', () => {
    it('allows top-up above minimum', () => {
      expect(canTopUp(50000)).toEqual({ valid: true });
    });

    it('allows top-up exactly at minimum', () => {
      expect(canTopUp(10000)).toEqual({ valid: true });
    });

    it('rejects top-up below minimum', () => {
      const result = canTopUp(5000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Minimal top-up');
    });

    it('rejects zero top-up', () => {
      const result = canTopUp(0);
      expect(result.valid).toBe(false);
    });
  });

  describe('canWithdrawBalance', () => {
    it('allows withdrawal with sufficient balance', () => {
      expect(canWithdrawBalance(100000, 50000)).toEqual({ valid: true });
    });

    it('allows withdrawal at minimum amount', () => {
      expect(canWithdrawBalance(100000, 50000)).toEqual({ valid: true });
    });

    it('rejects withdrawal just below minimum', () => {
      const result = canWithdrawBalance(100000, 49000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Minimal penarikan');
    });

    it('rejects withdrawal below minimum', () => {
      const result = canWithdrawBalance(100000, 10000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Minimal penarikan');
    });

    it('rejects withdrawal exceeding balance', () => {
      const result = canWithdrawBalance(50000, 100000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Saldo tidak mencukupi');
    });

    it('rejects withdrawal when balance is zero', () => {
      const result = canWithdrawBalance(0, 50000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Saldo tidak mencukupi');
    });

    it('rejects negative amount withdrawal', () => {
      const result = canWithdrawBalance(100000, -1000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Minimal penarikan');
    });
  });
});

describe('Wallet - Transaction Operations', () => {
  describe('applyTopUp', () => {
    it('adds amount to balance', () => {
      const result = applyTopUp(100000, 50000);
      expect(result).toEqual({
        newBalance: 150000,
        transactionType: 'topup',
        description: 'Top-up saldo',
      });
    });

    it('handles zero initial balance', () => {
      const result = applyTopUp(0, 100000);
      expect(result.newBalance).toBe(100000);
    });
  });

  describe('applyPayment', () => {
    it('deducts amount from balance when sufficient', () => {
      const result = applyPayment(200000, 150000, 'NK-ABC123');
      expect(result).toEqual({
        success: true,
        newBalance: 50000,
        transactionType: 'payment',
        description: 'Pembayaran pesanan #NK-ABC123',
      });
    });

    it('returns error when balance insufficient', () => {
      const result = applyPayment(50000, 100000, 'NK-ABC123');
      expect(result).toEqual({ success: false, error: 'Saldo tidak mencukupi' });
    });

    it('handles exact balance payment', () => {
      const result = applyPayment(100000, 100000, 'NK-ABC123');
      expect(result).toEqual({
        success: true,
        newBalance: 0,
        transactionType: 'payment',
        description: 'Pembayaran pesanan #NK-ABC123',
      });
    });

    it('returns error when balance is zero', () => {
      const result = applyPayment(0, 50000, 'NK-ABC123');
      expect(result).toEqual({ success: false, error: 'Saldo tidak mencukupi' });
    });
  });

  describe('applySellerTransfer', () => {
    it('transfers amount minus platform fee to seller', () => {
      const result = applySellerTransfer(0, 100000, 5000);
      expect(result).toEqual({
        newBalance: 95000,
        transactionType: 'transfer',
        description: 'Pendapatan dari penjualan (setelah fee 5000)',
      });
    });

    it('handles zero fee', () => {
      const result = applySellerTransfer(500000, 100000, 0);
      expect(result.newBalance).toBe(600000);
    });

    it('adds to existing seller balance', () => {
      const result = applySellerTransfer(200000, 100000, 5000);
      expect(result.newBalance).toBe(295000);
    });

    it('handles large fee deduction', () => {
      const result = applySellerTransfer(0, 1000000, 50000);
      expect(result.newBalance).toBe(950000);
    });
  });

  describe('applyWithdrawal', () => {
    it('deducts amount when balance sufficient', () => {
      const result = applyWithdrawal(200000, 50000, 'Bank BCA');
      expect(result).toEqual({
        success: true,
        newBalance: 150000,
        transactionType: 'withdrawal',
        description: 'Penarikan ke Bank BCA',
      });
    });

    it('returns error when balance insufficient', () => {
      const result = applyWithdrawal(30000, 50000, 'GoPay');
      expect(result).toEqual({ success: false, error: 'Saldo tidak mencukupi' });
    });

    it('handles full balance withdrawal', () => {
      const result = applyWithdrawal(100000, 100000, 'DANA');
      expect(result).toMatchObject({ success: true, newBalance: 0 });
    });
  });

  describe('applyRefund', () => {
    it('adds refund amount to balance', () => {
      const result = applyRefund(0, 150000, 'NK-ABC123');
      expect(result).toEqual({
        newBalance: 150000,
        transactionType: 'refund',
        description: 'Refund pesanan #NK-ABC123',
      });
    });

    it('adds to existing balance', () => {
      const result = applyRefund(50000, 100000, 'NK-ABC123');
      expect(result.newBalance).toBe(150000);
    });
  });
});

describe('Wallet - End-to-End Flow Scenarios', () => {
  it('complete top-up → payment → refund cycle for pembeli', () => {
    let balance = 0;

    // Top-up
    balance = applyTopUp(balance, 200000).newBalance;
    expect(balance).toBe(200000);

    // Payment
    const paymentResult = applyPayment(balance, 150000, 'NK-ORDER1');
    expect(paymentResult.success).toBe(true);
    if (paymentResult.success) balance = paymentResult.newBalance;
    expect(balance).toBe(50000);

    // Refund
    balance = applyRefund(balance, 150000, 'NK-ORDER1').newBalance;
    expect(balance).toBe(200000);
  });

  it('complete sale cycle for penjual with platform fee', () => {
    let sellerBalance = 0;
    const saleAmount = 100000;
    const platformFee = 5000;

    // Sale completed - money transferred to seller after fee
    const transferResult = applySellerTransfer(sellerBalance, saleAmount, platformFee);
    sellerBalance = transferResult.newBalance;
    expect(sellerBalance).toBe(95000);

    // Withdrawal
    const withdrawResult = applyWithdrawal(sellerBalance, 50000, 'Bank BCA');
    expect(withdrawResult.success).toBe(true);
    if (withdrawResult.success) sellerBalance = withdrawResult.newBalance;
    expect(sellerBalance).toBe(45000);
  });

  it('handles multiple top-ups and partial withdrawals', () => {
    let balance = 0;

    balance = applyTopUp(balance, 100000).newBalance;
    balance = applyTopUp(balance, 50000).newBalance;
    expect(balance).toBe(150000);

    const w1 = applyWithdrawal(balance, 75000, 'GoPay');
    if (w1.success) balance = w1.newBalance;
    expect(balance).toBe(75000);

    const w2 = applyWithdrawal(balance, 75000, 'GoPay');
    if (w2.success) balance = w2.newBalance;
    expect(balance).toBe(0);
  });
});

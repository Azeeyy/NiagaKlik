/**
 * Order status flow validation logic.
 * Valid transitions: pending → diproses → dikirim → selesai
 * Cancel rules:
 *   - Pembeli can cancel only when status is 'pending'
 *   - Penjual can cancel when status is 'pending' or 'diproses'
 */

export type OrderStatus = 'pending' | 'diproses' | 'dikirim' | 'selesai' | 'dibatalkan';
export type UserRole = 'pembeli' | 'penjual' | 'operator';
export type PaymentMethod = 'cn_wallet' | 'qris' | 'cod';
export type OrderAction = 'process' | 'ship' | 'complete' | 'cancel';

// Valid forward transitions map
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['diproses', 'dibatalkan'],
  diproses: ['dikirim', 'dibatalkan'],
  dikirim: ['selesai'],
  selesai: [],
  dibatalkan: [],
};

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Menunggu',
  diproses: 'Diproses',
  dikirim: 'Dikirim',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
};

/**
 * Maps user actions to target order statuses
 */
const ACTION_TO_STATUS: Record<OrderAction, OrderStatus> = {
  process: 'diproses',
  ship: 'dikirim',
  complete: 'selesai',
  cancel: 'dibatalkan',
};

/**
 * Returns allowed transitions from a given status.
 */
export function getAllowedTransitions(status: OrderStatus): OrderStatus[] {
  return [...VALID_TRANSITIONS[status]];
}

/**
 * Returns whether a status transition is valid for any user.
 */
export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Validates whether a user can cancel an order given its current status and the user's role.
 *
 * Rules:
 * - Pembeli can only cancel orders in 'pending' status.
 * - Penjual can cancel orders in 'pending' or 'diproses' status.
 * - Operator can always cancel.
 */
export function canCancelOrder(
  currentStatus: OrderStatus,
  userRole: UserRole
): ValidationResult {
  if (currentStatus === 'selesai') {
    return { valid: false, error: 'Pesanan sudah selesai, tidak dapat dibatalkan' };
  }
  if (currentStatus === 'dibatalkan') {
    return { valid: false, error: 'Pesanan sudah dibatalkan sebelumnya' };
  }

  if (userRole === 'operator') {
    return { valid: true };
  }

  if (userRole === 'pembeli') {
    if (currentStatus !== 'pending') {
      return { valid: false, error: 'Pembeli hanya dapat membatalkan pesanan dengan status "pending"' };
    }
    return { valid: true };
  }

  if (userRole === 'penjual') {
    if (currentStatus === 'pending' || currentStatus === 'diproses') {
      return { valid: true };
    }
    return { valid: false, error: 'Penjual hanya dapat membatalkan pesanan dengan status "pending" atau "diproses"' };
  }

  return { valid: false, error: 'Role tidak dikenal' };
}

/**
 * Returns the target status for a given action, or null if the action is unknown.
 */
export function getTargetStatusForAction(action: OrderAction): OrderStatus | null {
  return ACTION_TO_STATUS[action] ?? null;
}

/**
 * Validates whether a specific action is allowed on an order given its current status.
 */
export function canPerformAction(
  currentStatus: OrderStatus,
  action: OrderAction,
  userRole: UserRole,
  paymentMethod?: PaymentMethod
): ValidationResult {
  if (currentStatus === 'dibatalkan') {
    return { valid: false, error: 'Pesanan sudah dibatalkan' };
  }
  if (currentStatus === 'selesai') {
    return { valid: false, error: 'Pesanan sudah selesai' };
  }

  // Cancel action uses separate role-based validation
  if (action === 'cancel') {
    return canCancelOrder(currentStatus, userRole);
  }

  const targetStatus = getTargetStatusForAction(action);
  if (!targetStatus) {
    return { valid: false, error: `Aksi "${action}" tidak dikenal` };
  }

  if (!isValidTransition(currentStatus, targetStatus)) {
    const currentLabel = STATUS_LABELS[currentStatus] || currentStatus;
    const targetLabel = STATUS_LABELS[targetStatus] || targetStatus;
    return {
      valid: false,
      error: `Tidak dapat mengubah status dari "${currentLabel}" ke "${targetLabel}"`,
    };
  }

  // Role-specific validations for non-cancel actions
  if (action === 'process' || action === 'ship') {
    if (userRole !== 'penjual') {
      return { valid: false, error: 'Hanya penjual yang dapat memproses/mengirim pesanan' };
    }
  }

  if (action === 'complete') {
    if (userRole !== 'pembeli') {
      return { valid: false, error: 'Hanya pembeli yang dapat mengkonfirmasi pesanan selesai' };
    }
  }

  return { valid: true };
}

/**
 * Calculates platform fee based on payment method.
 * Non-COD transactions: 5% fee.
 * COD transactions: no platform fee.
 */
export function calculatePlatformFeeForPayment(
  amount: number,
  paymentMethod: PaymentMethod
): number {
  if (paymentMethod === 'cod') return 0;
  return Math.round(amount * 0.05);
}

/**
 * Calculates all financial components of an order.
 */
export interface OrderFinancials {
  subtotal: number;
  platformFee: number;
  shippingCost: number;
  codFee: number;
  grandTotal: number;
}

export function calculateOrderFinancials(
  subtotal: number,
  paymentMethod: PaymentMethod,
  shippingCost: number = 0
): OrderFinancials {
  const platformFee = calculatePlatformFeeForPayment(subtotal, paymentMethod);
  const codFee = paymentMethod === 'cod' ? 5000 : 0;
  const grandTotal = subtotal + platformFee + shippingCost + codFee;

  return { subtotal, platformFee, shippingCost, codFee, grandTotal };
}

/**
 * Wallet transaction helper that validates balance sufficiency.
 */
export function canWithdrawBalance(
  currentBalance: number,
  amount: number,
  minWithdrawal: number = 50000
): ValidationResult {
  if (amount < minWithdrawal) {
    return { valid: false, error: `Minimal penarikan Rp ${minWithdrawal.toLocaleString('id-ID')}` };
  }
  if (amount > currentBalance) {
    return { valid: false, error: 'Saldo tidak mencukupi' };
  }
  return { valid: true };
}

/**
 * Wallet top-up validation.
 */
export function canTopUp(
  amount: number,
  minTopUp: number = 10000
): ValidationResult {
  if (amount < minTopUp) {
    return { valid: false, error: `Minimal top-up Rp ${minTopUp.toLocaleString('id-ID')}` };
  }
  return { valid: true };
}

/**
 * Simulates a wallet top-up transaction.
 */
export function applyTopUp(
  currentBalance: number,
  amount: number
): { newBalance: number; transactionType: string; description: string } {
  return {
    newBalance: currentBalance + amount,
    transactionType: 'topup',
    description: 'Top-up saldo',
  };
}

/**
 * Simulates a wallet payment transaction.
 */
export type PaymentResult = 
  | { success: true; newBalance: number; transactionType: string; description: string }
  | { success: false; error: string };

export function applyPayment(
  currentBalance: number,
  amount: number,
  orderNumber: string
): PaymentResult {
  if (currentBalance < amount) {
    return { success: false, error: 'Saldo tidak mencukupi' };
  }
  return {
    success: true,
    newBalance: currentBalance - amount,
    transactionType: 'payment',
    description: `Pembayaran pesanan #${orderNumber}`,
  };
}

/**
 * Simulates a seller payment transfer (pembeli confirms completion).
 */
export function applySellerTransfer(
  sellerBalance: number,
  amount: number,
  platformFee: number
): { newBalance: number; transactionType: string; description: string } {
  const sellerAmount = amount - platformFee;
  return {
    newBalance: sellerBalance + sellerAmount,
    transactionType: 'transfer',
    description: `Pendapatan dari penjualan (setelah fee ${platformFee})`,
  };
}

/**
 * Simulates a withdrawal transaction.
 */
export type WithdrawalResult = 
  | { success: true; newBalance: number; transactionType: string; description: string }
  | { success: false; error: string };

export function applyWithdrawal(
  currentBalance: number,
  amount: number,
  destination: string
): WithdrawalResult {
  if (currentBalance < amount) {
    return { success: false, error: 'Saldo tidak mencukupi' };
  }
  return {
    success: true,
    newBalance: currentBalance - amount,
    transactionType: 'withdrawal',
    description: `Penarikan ke ${destination}`,
  };
}

/**
 * Simulates a refund transaction.
 */
export function applyRefund(
  currentBalance: number,
  amount: number,
  orderNumber: string
): { newBalance: number; transactionType: string; description: string } {
  return {
    newBalance: currentBalance + amount,
    transactionType: 'refund',
    description: `Refund pesanan #${orderNumber}`,
  };
}

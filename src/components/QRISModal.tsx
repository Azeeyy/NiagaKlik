'use client';

import { useState, useEffect, useRef } from 'react';

interface QRISModalProps {
  amount: number;
  orderNumber: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}// Generate a deterministic QR-like pattern from a string
function isPositionPatternOuterRing(
  row: number, col: number,
  rStart: number, rEnd: number,
  cStart: number, cEnd: number
): boolean {
  return (row === rStart || row === rEnd) && (col >= cStart && col <= cEnd) ||
         (col === cStart || col === cEnd) && (row >= rStart && row <= rEnd);
}

function isPositionPatternInner(row: number, col: number, rStart: number, rEnd: number, cStart: number, cEnd: number): boolean {
  return row >= rStart && row <= rEnd && col >= cStart && col <= cEnd;
}

function isCornerArea(row: number, col: number, size: number): string | null {
  if (row < 7 && col < 7) return 'tl'; // top-left
  if (row < 7 && col >= size - 7) return 'tr'; // top-right
  if (row >= size - 7 && col < 7) return 'bl'; // bottom-left
  return null;
}

function generateQRPattern(seed: string, size: number): boolean[][] {
  const grid: boolean[][] = [];
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  for (let row = 0; row < size; row++) {
    grid[row] = [];
    for (let col = 0; col < size; col++) {
      const corner = isCornerArea(row, col, size);
      
      if (corner === 'tl') {
        // Top-left corner: outer ring on row 0/6, col 0/6; inner square rows 2-4, cols 2-4
        const outerRing = isPositionPatternOuterRing(row, col, 0, 6, 0, 6);
        const innerSquare = isPositionPatternInner(row, col, 2, 4, 2, 4);
        grid[row][col] = outerRing || innerSquare;
      } else if (corner === 'tr') {
        // Top-right corner: outer ring on row 0/6, col (size-7)/(size-1); inner square rows 2-4, cols (size-5)-(size-3)
        const outerRing = isPositionPatternOuterRing(row, col, 0, 6, size - 7, size - 1);
        const innerSquare = isPositionPatternInner(row, col, 2, 4, size - 5, size - 3);
        grid[row][col] = outerRing || innerSquare;
      } else if (corner === 'bl') {
        // Bottom-left corner: outer ring on row (size-7)/(size-1), col 0/6; inner square rows (size-5)-(size-3), cols 2-4
        const outerRing = isPositionPatternOuterRing(row, col, size - 7, size - 1, 0, 6);
        const innerSquare = isPositionPatternInner(row, col, size - 5, size - 3, 2, 4);
        grid[row][col] = outerRing || innerSquare;
      } else {
        // Data area - use hash for pseudo-random pattern
        const pseudoRandom = Math.sin(row * 7.31 + col * 13.17 + hash) * 10000;
        grid[row][col] = Math.abs(Math.round(pseudoRandom % 2)) === 1;
      }
    }
  }
  return grid;
}

export default function QRISModal({ amount, orderNumber, onConfirm, onCancel, loading }: QRISModalProps) {
  const [expired, setExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [scanned, setScanned] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setExpired(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Draw QR code on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 29; // 29x29 grid for QR-like
    const cellSize = canvas.width / (size + 4); // 2 cell padding on each side
    const padding = cellSize * 2;

    const pattern = generateQRPattern(orderNumber + amount.toString(), size);

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw modules
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (pattern[row][col]) {
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(
            padding + col * cellSize,
            padding + row * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }

    // Add NiagaKlik branding overlay in center
    ctx.fillStyle = '#ffffff';
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const overlaySize = cellSize * 6;
    ctx.fillRect(centerX - overlaySize / 2, centerY - overlaySize / 2, overlaySize, overlaySize);
    
    ctx.fillStyle = '#2563eb';
    ctx.font = `bold ${cellSize * 2}px Inter, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NK', centerX, centerY);

  }, [orderNumber, amount]);

  function handleSimulateScan() {
    setScanned(true);
  }

  function handleConfirmPayment() {
    onConfirm();
  }

  const progressPercent = (timeLeft / 300) * 100;

  return (
    <div className="modal-overlay z-50" onClick={() => !loading && onCancel()}>
      <div 
        className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Pembayaran QRIS</h2>
          <p className="text-gray-500 mt-1">Scan QR code dengan aplikasi pembayaran</p>
        </div>

        {/* Timer */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${expired ? 'text-red-600' : timeLeft < 60 ? 'text-orange-600' : 'text-gray-600'}`}>
              {expired ? 'Kode QR kadaluwarsa' : 'Sisa waktu pembayaran'}
            </span>
            <span className={`text-lg font-bold font-mono ${expired ? 'text-red-600' : timeLeft < 60 ? 'text-orange-600' : 'text-gray-900'}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                expired ? 'bg-red-500' : timeLeft < 60 ? 'bg-orange-500' : 'bg-primary-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className={`relative bg-white rounded-2xl p-4 border-2 ${
            expired ? 'border-red-200 opacity-50' : 'border-gray-100'
          } shadow-lg`}>
            <canvas 
              ref={canvasRef} 
              width={280} 
              height={280} 
              className="block"
            />
            {expired && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm">
                  EXPIRED
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="bg-gray-50 rounded-xl p-4 text-center mb-4">
          <p className="text-sm text-gray-500 mb-1">Total Pembayaran</p>
          <p className="text-3xl font-bold text-gray-900">
            Rp {amount.toLocaleString('id-ID')}
          </p>
        </div>

        {/* Order Info */}
        <p className="text-xs text-gray-400 text-center mb-6">
          Pesanan: #{orderNumber}
        </p>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Cara Pembayaran:</h4>
          <ol className="text-xs text-blue-700 space-y-1.5 list-decimal list-inside">
            <li>Buka aplikasi pembayaran (GoPay, OVO, DANA, Mobile Banking)</li>
            <li>Pilih menu Scan QR / QRIS</li>
            <li>Scan kode QR di atas</li>
            <li>Konfirmasi pembayaran</li>
            <li>Klik tombol <strong>Sudah Bayar</strong> di bawah</li>
          </ol>
        </div>

        {/* Simulate Scan Button */}
        {!scanned && !expired && (
          <button
            onClick={handleSimulateScan}
            className="btn-secondary w-full mb-3 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Simulasi: Saya Sudah Scan QR
          </button>
        )}

        {/* After scan - show confirm button */}
        {scanned && !expired && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-3">
              <svg className="w-6 h-6 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-700 font-medium">
                QR Code berhasil dipindai! Klik konfirmasi untuk menyelesaikan pesanan.
              </p>
            </div>
            <button
              onClick={handleConfirmPayment}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Konfirmasi Pembayaran
                </>
              )}
            </button>
          </div>
        )}

        {/* Expired state */}
        {expired && (
          <div className="text-center">
            <p className="text-sm text-red-600 mb-4">Kode QR sudah tidak berlaku</p>
            <button onClick={onCancel} className="btn-primary w-full">
              Kembali ke Checkout
            </button>
          </div>
        )}

        {/* Cancel button (before scan) */}
        {!scanned && !expired && (
          <button onClick={onCancel} disabled={loading} className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-2">
            Batalkan Pembayaran
          </button>
        )}
      </div>
    </div>
  );
}

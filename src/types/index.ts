import type { Timestamp } from 'firebase/firestore';

// ─── User ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'tenant';
  roomId: string | null;
  phone: string;
  moveInDate: Timestamp | null;
  isActive: boolean;
  createdAt: Timestamp;
}

// ─── Room ────────────────────────────────────────────────────────────────────

export interface Room {
  id: string;
  roomNumber: string; // "Room 1", "Room 2", "Room 3"
  monthlyRent: number; // editable, in PHP
  status: 'vacant' | 'occupied';
  maxOccupants: number; // default 2
  currentTenantIds: string[]; // up to maxOccupants
  description: string;
}

// ─── Meter Reading ───────────────────────────────────────────────────────────

export interface MeterReading {
  id: string;
  roomId: string;
  tenantId: string; // primary tenant on the bill
  previousReading: number; // kWh
  currentReading: number; // kWh
  consumption: number; // currentReading - previousReading
  ratePerKwh: number; // snapshot of rate at time of reading
  totalElectricBill: number; // consumption × ratePerKwh
  billingPeriod: string; // e.g. "2026-09"
  readingDate: Timestamp;
  meterPhotoUrl: string; // Firebase Storage URL
  createdBy: string; // admin userId
  createdAt: Timestamp;
}

// ─── Bill ────────────────────────────────────────────────────────────────────

export type BillStatus = 'unpaid' | 'partial' | 'paid';

export interface Bill {
  id: string;
  tenantId: string;
  roomId: string;
  billingPeriod: string; // e.g. "2026-09"
  roomRent: number;
  electricBill: number;
  totalAmount: number; // roomRent + electricBill
  amountPaid: number; // running total of payments
  balance: number; // totalAmount - amountPaid
  meterReadingId: string;
  status: BillStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export type PaymentMethod = 'cash' | 'qr_code';

export interface Payment {
  id: string;
  billId: string;
  tenantId: string;
  roomId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceLastFour: string | null; // last 4 digits for QR payments
  receiptPhotoUrl: string | null; // uploaded receipt for QR payments
  paymentDate: Timestamp;
  receivedBy: string; // admin userId
  notes: string;
  createdAt: Timestamp;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface GlobalSettings {
  ratePerKwh: number;
  qrCodeImageUrl: string; // owner's QR code for payments
}

import { useState, useRef } from 'react';
import { usePayments } from '@/hooks/usePayments';
import { useBills } from '@/hooks/useBills';
import { useTenants } from '@/hooks/useTenants';
import { useRooms } from '@/hooks/useRooms';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Camera, Loader2 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { PaymentMethod } from '@/types';

export default function PaymentsPage() {
  const { payments, loading, recordPayment } = usePayments();
  const { bills, updateBill } = useBills();
  const { tenants } = useTenants();
  const { rooms } = useRooms();
  const { user } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [receiptPhoto, setReceiptPhoto] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    billId: '',
    amount: '',
    paymentMethod: 'cash' as PaymentMethod,
    referenceLastFour: '',
    notes: '',
  });

  const unpaidBills = bills.filter((b) => b.status !== 'paid');

  const resetForm = () => {
    setFormData({ billId: '', amount: '', paymentMethod: 'cash', referenceLastFour: '', notes: '' });
    setReceiptPhoto(null);
    setReceiptPreview(null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const selectedBill = bills.find((b) => b.id === formData.billId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.billId || !formData.amount) return;

    setSubmitting(true);
    try {
      const bill = bills.find((b) => b.id === formData.billId);
      if (!bill) throw new Error('Bill not found');

      const amount = parseFloat(formData.amount);
      const newAmountPaid = bill.amountPaid + amount;
      const newBalance = bill.totalAmount - newAmountPaid;
      const newStatus = newBalance <= 0 ? 'paid' : 'partial';

      // Record the payment
      await recordPayment(
        {
          billId: bill.id,
          tenantId: bill.tenantId,
          roomId: bill.roomId,
          amount,
          paymentMethod: formData.paymentMethod,
          referenceLastFour: formData.paymentMethod === 'qr_code' ? formData.referenceLastFour : null,
          paymentDate: Timestamp.now(),
          receivedBy: user?.uid || '',
          notes: formData.notes,
        },
        receiptPhoto || undefined
      );

      // Update bill status
      await updateBill(bill.id, {
        amountPaid: newAmountPaid,
        balance: Math.max(0, newBalance),
        status: newStatus,
      });

      toast.success('Payment recorded successfully');
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground mt-1">
            Record and track tenant payments
          </p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a payment against an outstanding bill
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Select Bill */}
              <div className="space-y-2">
                <Label>Select Bill</Label>
                <Select
                  value={formData.billId}
                  onValueChange={(value) => setFormData({ ...formData, billId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an unpaid bill" />
                  </SelectTrigger>
                  <SelectContent>
                    {unpaidBills.map((bill) => {
                      const tenant = tenants.find((t) => t.id === bill.tenantId);
                      const room = rooms.find((r) => r.id === bill.roomId);
                      return (
                        <SelectItem key={bill.id} value={bill.id}>
                          {tenant?.displayName} — {room?.roomNumber} — {bill.billingPeriod} (₱
                          {bill.balance.toLocaleString()})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Bill Summary */}
              {selectedBill && (
                <div className="rounded-lg bg-muted/50 p-4 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount</span>
                    <span>₱{selectedBill.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Already Paid</span>
                    <span>₱{selectedBill.amountPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1.5">
                    <span>Remaining Balance</span>
                    <span className="text-destructive">
                      ₱{selectedBill.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paymentMethod: value as PaymentMethod })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="qr_code">QR Code (GCash/Bank Transfer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₱)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedBill?.balance}
                  placeholder="Enter payment amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              {/* QR Code Payment Fields */}
              {formData.paymentMethod === 'qr_code' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="refNumber">Last 4 Digits of Reference Number</Label>
                    <Input
                      id="refNumber"
                      maxLength={4}
                      placeholder="e.g., 1234"
                      value={formData.referenceLastFour}
                      onChange={(e) =>
                        setFormData({ ...formData, referenceLastFour: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Receipt Photo */}
                  <div className="space-y-2">
                    <Label>Receipt Photo</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    {receiptPreview ? (
                      <div className="relative rounded-lg overflow-hidden border">
                        <img
                          src={receiptPreview}
                          alt="Receipt"
                          className="w-full h-40 object-cover"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="absolute bottom-2 right-2"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Change Photo
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-20 border-dashed"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">Upload receipt photo</span>
                      </Button>
                    )}
                  </div>
                </>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.billId || !formData.amount || submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Recording...
                  </>
                ) : (
                  'Record Payment'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payments Table */}
      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No payments yet</h3>
            <p className="text-muted-foreground text-sm">Record your first payment</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const tenant = tenants.find((t) => t.id === payment.tenantId);
                  const room = rooms.find((r) => r.id === payment.roomId);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {tenant?.displayName || 'Unknown'}
                      </TableCell>
                      <TableCell>{room?.roomNumber || '—'}</TableCell>
                      <TableCell className="font-semibold">
                        ₱{payment.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {payment.paymentMethod === 'qr_code' ? 'QR Code' : 'Cash'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.referenceLastFour
                          ? `****${payment.referenceLastFour}`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {payment.paymentDate?.toDate
                          ? format(payment.paymentDate.toDate(), 'MMM dd, yyyy')
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {payment.notes || '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

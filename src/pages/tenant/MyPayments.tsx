import { useAuth } from '@/contexts/AuthContext';
import { usePayments } from '@/hooks/usePayments';
import { useRooms } from '@/hooks/useRooms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreditCard } from 'lucide-react';
import { format } from 'date-fns';

export default function MyPaymentsPage() {
  const { userProfile } = useAuth();
  const { payments, loading } = usePayments(userProfile?.id);
  const { rooms } = useRooms();

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Payments</h1>
        <p className="text-muted-foreground mt-1">
          Your payment history
        </p>
      </div>

      {/* Total Paid Summary */}
      {payments.length > 0 && (
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Total Amount Paid
              </span>
              <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                ₱{totalPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments Table */}
      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No payments yet</h3>
            <p className="text-muted-foreground text-sm">
              Your payment records will appear here
            </p>
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
                  <TableHead>Date</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const room = rooms.find((r) => r.id === payment.roomId);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.paymentDate?.toDate
                          ? format(payment.paymentDate.toDate(), 'MMM dd, yyyy')
                          : 'N/A'}
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

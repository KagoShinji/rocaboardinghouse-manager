import { useAuth } from '@/contexts/AuthContext';
import { useBills } from '@/hooks/useBills';
import { useRooms } from '@/hooks/useRooms';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText } from 'lucide-react';

export default function MyBillsPage() {
  const { userProfile } = useAuth();
  const { bills, loading } = useBills(userProfile?.id);
  const { rooms } = useRooms();

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
        <h1 className="text-3xl font-bold tracking-tight">My Bills</h1>
        <p className="text-muted-foreground mt-1">
          View your billing history
        </p>
      </div>

      {bills.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No bills yet</h3>
            <p className="text-muted-foreground text-sm">
              Your bills will appear here once generated
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Billing History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Electric</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => {
                  const room = rooms.find((r) => r.id === bill.roomId);
                  return (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium">{bill.billingPeriod}</TableCell>
                      <TableCell>{room?.roomNumber || '—'}</TableCell>
                      <TableCell>
                        ₱{bill.roomRent.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        ₱{bill.electricBill.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₱{bill.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        ₱{bill.amountPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₱{bill.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={bill.status} />
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

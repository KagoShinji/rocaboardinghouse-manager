import { useState } from 'react';
import { useBills } from '@/hooks/useBills';
import { useRooms } from '@/hooks/useRooms';
import { useTenants } from '@/hooks/useTenants';
import { useMeterReadings } from '@/hooks/useMeterReadings';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { BillStatus } from '@/types';

export default function BillsPage() {
  const { bills, loading, createBill } = useBills();
  const { rooms } = useRooms();
  const { tenants } = useTenants();
  const { readings } = useMeterReadings();

  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState(format(new Date(), 'yyyy-MM'));
  const [generating, setGenerating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<BillStatus | 'all'>('all');

  const handleGenerateBills = async () => {
    setGenerating(true);
    try {
      const occupiedRooms = rooms.filter((r) => r.status === 'occupied');
      let generated = 0;

      for (const room of occupiedRooms) {
        const primaryTenantId = room.currentTenantIds?.[0];
        if (!primaryTenantId) continue;

        // Check if bill already exists for this room/period
        const existingBill = bills.find(
          (b) => b.roomId === room.id && b.billingPeriod === billingPeriod
        );
        if (existingBill) continue;

        // Find meter reading for this room/period
        const reading = readings.find(
          (r) => r.roomId === room.id && r.billingPeriod === billingPeriod
        );

        const electricBill = reading?.totalElectricBill || 0;
        const totalAmount = room.monthlyRent + electricBill;

        await createBill({
          tenantId: primaryTenantId,
          roomId: room.id,
          billingPeriod,
          roomRent: room.monthlyRent,
          electricBill,
          totalAmount,
          amountPaid: 0,
          balance: totalAmount,
          meterReadingId: reading?.id || '',
          status: 'unpaid',
        });
        generated++;
      }

      if (generated > 0) {
        toast.success(`Generated ${generated} bill(s) for ${billingPeriod}`);
      } else {
        toast.info('No new bills to generate. Bills may already exist for this period.');
      }
      setGenerateDialogOpen(false);
    } catch (error) {
      toast.error('Failed to generate bills');
    } finally {
      setGenerating(false);
    }
  };

  const filteredBills =
    filterStatus === 'all' ? bills : bills.filter((b) => b.status === filterStatus);

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bills</h1>
          <p className="text-muted-foreground mt-1">
            Generate and manage monthly bills
          </p>
        </div>
        <Button onClick={() => setGenerateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Bills
        </Button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'unpaid', 'partial', 'paid'] as const).map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(status)}
            className="capitalize"
          >
            {status}
            {status !== 'all' && (
              <span className="ml-1.5 text-xs">
                ({bills.filter((b) => b.status === status).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Generate Bills Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Monthly Bills</DialogTitle>
            <DialogDescription>
              This will create bills for all occupied rooms, combining rent + electricity for the
              selected billing period.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="billingPeriod">Billing Period</Label>
              <Input
                id="billingPeriod"
                type="month"
                value={billingPeriod}
                onChange={(e) => setBillingPeriod(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Make sure meter readings have been recorded for this period before generating bills.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateBills} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Bills'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bills Table */}
      {filteredBills.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No bills found</h3>
            <p className="text-muted-foreground text-sm">
              Generate bills for the current billing period
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Electric</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((bill) => {
                  const tenant = tenants.find((t) => t.id === bill.tenantId);
                  const room = rooms.find((r) => r.id === bill.roomId);
                  return (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium">
                        {tenant?.displayName || 'Unknown'}
                      </TableCell>
                      <TableCell>{room?.roomNumber || '—'}</TableCell>
                      <TableCell>{bill.billingPeriod}</TableCell>
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

import { useAuth } from '@/contexts/AuthContext';
import { useBills } from '@/hooks/useBills';
import { usePayments } from '@/hooks/usePayments';
import { useRooms } from '@/hooks/useRooms';
import { useMeterReadings } from '@/hooks/useMeterReadings';
import { useSettings } from '@/hooks/useSettings';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  DoorOpen,
  CreditCard,
  Zap,
  AlertTriangle,
  FileText,
  QrCode,
} from 'lucide-react';

export default function TenantDashboard() {
  const { userProfile } = useAuth();
  const { bills } = useBills(userProfile?.id);
  const { payments } = usePayments(userProfile?.id);
  const { rooms } = useRooms();
  const { readings } = useMeterReadings(undefined, userProfile?.id);
  const { settings } = useSettings();

  const room = rooms.find((r) => r.id === userProfile?.roomId);
  const currentBill = bills[0]; // Most recent bill
  const unpaidBills = bills.filter((b) => b.status !== 'paid');
  const _totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const latestReading = readings[0];

  const totalOutstanding = unpaidBills.reduce((sum, b) => sum + b.balance, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {userProfile?.displayName?.split(' ')[0] || 'Tenant'}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's your rental summary
        </p>
      </div>

      {/* Alert for outstanding bills */}
      {totalOutstanding > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                You have an outstanding balance of{' '}
                <span className="font-bold">
                  ₱{totalOutstanding.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Please settle your balance at your earliest convenience
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Your Room"
          value={room?.roomNumber || 'Unassigned'}
          icon={DoorOpen}
          description={room ? `₱${room.monthlyRent.toLocaleString()} / month` : ''}
          iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          title="Current Bill"
          value={
            currentBill
              ? `₱${currentBill.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
              : '₱0.00'
          }
          icon={FileText}
          description={currentBill ? `Period: ${currentBill.billingPeriod}` : 'No bills yet'}
          iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        />
        <StatCard
          title="Outstanding Balance"
          value={`₱${totalOutstanding.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
          icon={totalOutstanding > 0 ? AlertTriangle : CreditCard}
          description={`${unpaidBills.length} unpaid bill(s)`}
          iconClassName={
            totalOutstanding > 0
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
          }
        />
        <StatCard
          title="Last Consumption"
          value={latestReading ? `${latestReading.consumption.toFixed(1)} kWh` : '—'}
          icon={Zap}
          description={
            latestReading
              ? `₱${latestReading.totalElectricBill.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
              : 'No readings yet'
          }
          iconClassName="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
      </div>

      {/* Current Bill Breakdown + QR Code */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bill Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Bill Breakdown</CardTitle>
            <CardDescription>
              {currentBill ? `Billing period: ${currentBill.billingPeriod}` : 'No active bill'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentBill ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Room Rent</span>
                  <span className="font-mono">
                    ₱{currentBill.roomRent.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Electric Bill (VECO)</span>
                  <span className="font-mono">
                    ₱{currentBill.electricBill.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span>
                    ₱{currentBill.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="text-emerald-600">
                    ₱{currentBill.amountPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Balance</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      ₱{currentBill.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                    <StatusBadge status={currentBill.status} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No bill available for the current period
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code for Payment */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Pay via QR Code</CardTitle>
            </div>
            <CardDescription>
              Scan the QR code below to pay, then send your receipt to the admin
            </CardDescription>
          </CardHeader>
          <CardContent>
            {settings.qrCodeImageUrl ? (
              <div className="flex items-center justify-center p-4 bg-white rounded-lg border">
                <img
                  src={settings.qrCodeImageUrl}
                  alt="Payment QR Code"
                  className="max-h-56 object-contain"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <QrCode className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">QR code not yet configured by the admin</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3 text-center">
              After paying, please provide the last 4 digits of your reference number to the admin
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

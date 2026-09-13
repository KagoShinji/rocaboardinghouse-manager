import { useRooms } from '@/hooks/useRooms';
import { useTenants } from '@/hooks/useTenants';
import { useBills } from '@/hooks/useBills';
import { usePayments } from '@/hooks/usePayments';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, DoorOpen, FileText, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

export default function AdminDashboard() {
  const { rooms } = useRooms();
  const { tenants } = useTenants();
  const { bills } = useBills();
  const { payments } = usePayments();

  const activeTenants = tenants.filter((t) => t.isActive);
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied');
  const vacantRooms = rooms.filter((r) => r.status === 'vacant');
  const unpaidBills = bills.filter((b) => b.status === 'unpaid' || b.status === 'partial');

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  // Aggregate payments by month for chart
  const monthlyData = payments.reduce((acc, p) => {
    const month = p.paymentDate?.toDate ? format(p.paymentDate.toDate(), 'MMM yyyy') : 'N/A';
    const existing = acc.find((d) => d.month === month);
    if (existing) {
      existing.amount += p.amount;
    } else {
      acc.push({ month, amount: p.amount });
    }
    return acc;
  }, [] as { month: string; amount: number }[]);

  // Recent payments (last 5)
  const recentPayments = payments.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your rental property
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Tenants"
          value={activeTenants.length}
          icon={Users}
          description={`${tenants.length} total registered`}
          iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          title="Occupied Rooms"
          value={`${occupiedRooms.length} / ${rooms.length}`}
          icon={DoorOpen}
          description={`${vacantRooms.length} vacant`}
          iconClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          title="Unpaid Bills"
          value={unpaidBills.length}
          icon={unpaidBills.length > 0 ? AlertTriangle : FileText}
          description={unpaidBills.length > 0 ? 'Requires attention' : 'All clear'}
          iconClassName={
            unpaidBills.length > 0
              ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
          }
        />
        <StatCard
          title="Total Revenue"
          value={`₱${totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          description="All time"
          iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Revenue</CardTitle>
            <CardDescription>Payment collection over time</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    formatter={(value) => [`₱${Number(value).toLocaleString()}`, 'Revenue']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--card))',
                    }}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                No payment data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Payments</CardTitle>
            <CardDescription>Latest 5 payments received</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((payment) => {
                    const tenant = tenants.find((t) => t.id === payment.tenantId);
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {tenant?.displayName || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          ₱{payment.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="capitalize">
                          {payment.paymentMethod === 'qr_code' ? 'QR Code' : 'Cash'}
                        </TableCell>
                        <TableCell>
                          {payment.paymentDate?.toDate
                            ? format(payment.paymentDate.toDate(), 'MMM dd, yyyy')
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No payments recorded yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unpaid Bills Alert */}
      {unpaidBills.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Outstanding Bills
            </CardTitle>
            <CardDescription>Bills that are still unpaid or partially paid</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpaidBills.slice(0, 10).map((bill) => {
                  const tenant = tenants.find((t) => t.id === bill.tenantId);
                  return (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium">
                        {tenant?.displayName || 'Unknown'}
                      </TableCell>
                      <TableCell>{bill.billingPeriod}</TableCell>
                      <TableCell>
                        ₱{bill.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
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

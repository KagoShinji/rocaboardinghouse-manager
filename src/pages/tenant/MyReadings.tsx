import { useAuth } from '@/contexts/AuthContext';
import { useMeterReadings } from '@/hooks/useMeterReadings';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Gauge } from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function MyReadingsPage() {
  const { userProfile } = useAuth();
  const { readings, loading } = useMeterReadings(undefined, userProfile?.id);


  // Chart data (reverse to show chronological order)
  const chartData = [...readings]
    .reverse()
    .map((r) => ({
      period: r.billingPeriod,
      consumption: r.consumption,
      bill: r.totalElectricBill,
    }));

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
        <h1 className="text-3xl font-bold tracking-tight">My Readings</h1>
        <p className="text-muted-foreground mt-1">
          VECO electric meter reading history
        </p>
      </div>

      {/* Consumption Trend Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Consumption Trend</CardTitle>
            <CardDescription>Your electricity usage over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="period" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'consumption' ? `${Number(value).toFixed(1)} kWh` : `₱${Number(value).toLocaleString()}`,
                    name === 'consumption' ? 'Consumption' : 'Bill Amount',
                  ]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'hsl(var(--card))',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="consumption"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Readings Table */}
      {readings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Gauge className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No readings yet</h3>
            <p className="text-muted-foreground text-sm">
              Your meter readings will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reading History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Previous</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Consumption</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Electric Bill</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readings.map((reading) => (
                  <TableRow key={reading.id}>
                    <TableCell className="font-medium">{reading.billingPeriod}</TableCell>
                    <TableCell className="font-mono">
                      {reading.previousReading.toFixed(1)} kWh
                    </TableCell>
                    <TableCell className="font-mono">
                      {reading.currentReading.toFixed(1)} kWh
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      {reading.consumption.toFixed(1)} kWh
                    </TableCell>
                    <TableCell className="font-mono">
                      ₱{reading.ratePerKwh.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ₱{reading.totalElectricBill.toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      {reading.readingDate?.toDate
                        ? format(reading.readingDate.toDate(), 'MMM dd, yyyy')
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

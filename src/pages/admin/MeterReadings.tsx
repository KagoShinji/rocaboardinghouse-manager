import { useState, useRef } from 'react';
import { useMeterReadings } from '@/hooks/useMeterReadings';
import { useRooms } from '@/hooks/useRooms';
import { useTenants } from '@/hooks/useTenants';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
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
import { Plus, Gauge, Camera, Zap } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function MeterReadingsPage() {
  const { readings, loading, addReading } = useMeterReadings();
  const { rooms } = useRooms();
  const { tenants } = useTenants();
  const { settings } = useSettings();
  const { user } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [currentReadingInput, setCurrentReadingInput] = useState('');
  const [meterPhoto, setMeterPhoto] = useState<File | null>(null);
  const [meterPhotoPreview, setMeterPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const occupiedRooms = rooms.filter((r) => r.status === 'occupied');

  // Get previous reading for selected room
  const getPreviousReading = (roomId: string): number => {
    const roomReadings = readings.filter((r) => r.roomId === roomId);
    if (roomReadings.length > 0) {
      return roomReadings[0].currentReading; // Most recent (sorted desc)
    }
    return 0;
  };

  const previousReading = selectedRoomId ? getPreviousReading(selectedRoomId) : 0;
  const currentReadingNum = parseFloat(currentReadingInput) || 0;
  const consumption = Math.max(0, currentReadingNum - previousReading);
  const totalBill = consumption * settings.ratePerKwh;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMeterPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setMeterPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId || !currentReadingInput) return;

    setSubmitting(true);
    try {
      const room = rooms.find((r) => r.id === selectedRoomId);
      const primaryTenantId = room?.currentTenantIds?.[0] || '';
      const now = new Date();

      await addReading(
        {
          roomId: selectedRoomId,
          tenantId: primaryTenantId,
          previousReading,
          currentReading: currentReadingNum,
          consumption,
          ratePerKwh: settings.ratePerKwh,
          totalElectricBill: totalBill,
          billingPeriod: format(now, 'yyyy-MM'),
          readingDate: Timestamp.now(),
          createdBy: user?.uid || '',
        },
        meterPhoto || undefined
      );

      toast.success('Meter reading recorded successfully');
      setDialogOpen(false);
      setSelectedRoomId('');
      setCurrentReadingInput('');
      setMeterPhoto(null);
      setMeterPhotoPreview(null);
    } catch (error) {
      toast.error('Failed to record reading');
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
          <h1 className="text-3xl font-bold tracking-tight">Meter Readings</h1>
          <p className="text-muted-foreground mt-1">
            Record VECO electric meter readings for each room
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Reading
        </Button>
      </div>

      {/* Rate info */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
        <CardContent className="flex items-center gap-3 py-4">
          <Zap className="h-5 w-5 text-amber-600" />
          <div>
            <span className="text-sm font-medium">Current Electricity Rate: </span>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
              ₱{settings.ratePerKwh.toFixed(2)} per kWh
            </span>
          </div>
        </CardContent>
      </Card>

      {/* New Reading Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Record Meter Reading</DialogTitle>
              <DialogDescription>
                Enter the current meter reading from the VECO electric meter
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Room</Label>
                <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select occupied room" />
                  </SelectTrigger>
                  <SelectContent>
                    {occupiedRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.roomNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRoomId && (
                <>
                  <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Previous Reading</span>
                      <span className="font-mono font-semibold">{previousReading.toFixed(1)} kWh</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentReading">Current Reading (kWh)</Label>
                    <Input
                      id="currentReading"
                      type="number"
                      step="0.1"
                      min={previousReading}
                      placeholder="Enter current meter reading"
                      value={currentReadingInput}
                      onChange={(e) => setCurrentReadingInput(e.target.value)}
                      required
                    />
                  </div>

                  {currentReadingInput && (
                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Consumption</span>
                        <span className="font-mono font-semibold">{consumption.toFixed(1)} kWh</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Rate</span>
                        <span className="font-mono">₱{settings.ratePerKwh.toFixed(2)} / kWh</span>
                      </div>
                      <div className="flex justify-between text-base font-bold border-t pt-2">
                        <span>Electric Bill</span>
                        <span className="text-primary">
                          ₱{totalBill.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Meter Photo Upload */}
                  <div className="space-y-2">
                    <Label>Meter Photo</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    {meterPhotoPreview ? (
                      <div className="relative rounded-lg overflow-hidden border">
                        <img
                          src={meterPhotoPreview}
                          alt="Meter reading"
                          className="w-full h-48 object-cover"
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
                        className="w-full h-24 border-dashed"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-6 w-6 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">Upload meter photo</span>
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedRoomId || !currentReadingInput || submitting}>
                {submitting ? 'Recording...' : 'Record Reading'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Readings Table */}
      {readings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Gauge className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No readings yet</h3>
            <p className="text-muted-foreground text-sm">Record your first meter reading</p>
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
                  <TableHead>Room</TableHead>
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
                {readings.map((reading) => {
                  const room = rooms.find((r) => r.id === reading.roomId);
                  return (
                    <TableRow key={reading.id}>
                      <TableCell className="font-medium">
                        {room?.roomNumber || 'Unknown'}
                      </TableCell>
                      <TableCell>{reading.billingPeriod}</TableCell>
                      <TableCell className="font-mono">
                        {reading.previousReading.toFixed(1)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {reading.currentReading.toFixed(1)}
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

import { useState, useRef } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, QrCode, Save, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { settings, loading, updateSettings, uploadQrCode } = useSettings();
  const [ratePerKwh, setRatePerKwh] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);

  // Initialize form values once settings load
  if (!loading && !ratePerKwh) {
    setRatePerKwh(settings.ratePerKwh.toString());
  }

  const handleSaveRate = async () => {
    setSaving(true);
    try {
      await updateSettings({ ratePerKwh: parseFloat(ratePerKwh) });
      toast.success('Electricity rate updated');
    } catch (error) {
      toast.error('Failed to update rate');
    } finally {
      setSaving(false);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQr(true);
    try {
      await uploadQrCode(file);
      toast.success('QR code uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload QR code');
    } finally {
      setUploadingQr(false);
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure rates and system preferences
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Electricity Rate */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <Zap className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Electricity Rate</CardTitle>
                <CardDescription>
                  Set the price per kilowatt-hour (kWh) for VECO electric billing
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="ratePerKwh">Rate per kWh (₱)</Label>
                <Input
                  id="ratePerKwh"
                  type="number"
                  step="0.01"
                  min="0"
                  value={ratePerKwh}
                  onChange={(e) => setRatePerKwh(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveRate} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This rate will be used for all new meter readings. Previous readings retain
              the rate that was active at the time they were recorded.
            </p>
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <QrCode className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Payment QR Code</CardTitle>
                <CardDescription>
                  Upload your GCash/bank QR code that tenants can use for payments
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={qrInputRef}
              type="file"
              accept="image/*"
              onChange={handleQrUpload}
              className="hidden"
            />

            {settings.qrCodeImageUrl ? (
              <div className="space-y-3">
                <div className="rounded-lg border overflow-hidden bg-white p-4 flex items-center justify-center">
                  <img
                    src={settings.qrCodeImageUrl}
                    alt="Payment QR Code"
                    className="max-h-64 object-contain"
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => qrInputRef.current?.click()}
                  disabled={uploadingQr}
                >
                  {uploadingQr ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Replace QR Code
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full h-32 border-dashed"
                onClick={() => qrInputRef.current?.click()}
                disabled={uploadingQr}
              >
                {uploadingQr ? (
                  <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-6 w-6 mr-2 text-muted-foreground" />
                )}
                <span className="text-muted-foreground">Upload QR Code Image</span>
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              This QR code will be displayed to tenants in their portal for convenient payment.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

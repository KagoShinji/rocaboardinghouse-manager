import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadFile } from '@/lib/firestore';
import type { GlobalSettings } from '@/types';

const SETTINGS_DOC = 'settings/global';

const DEFAULT_SETTINGS: GlobalSettings = {
  ratePerKwh: 12, // default PHP per kWh
  qrCodeImageUrl: '',
};

export function useSettings() {
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'global'),
      (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data() as GlobalSettings);
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const updateSettings = async (data: Partial<GlobalSettings>) => {
    await setDoc(doc(db, 'settings', 'global'), { ...settings, ...data }, { merge: true });
  };

  const uploadQrCode = async (file: File) => {
    const url = await uploadFile(`settings/qr-code-${Date.now()}`, file);
    await updateSettings({ qrCodeImageUrl: url });
    return url;
  };

  return { settings, loading, updateSettings, uploadQrCode };
}

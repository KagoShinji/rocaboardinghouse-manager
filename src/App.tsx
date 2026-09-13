import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { TenantLayout } from '@/components/layout/TenantLayout';
import { Toaster } from '@/components/ui/sonner';

// Pages
import LoginPage from '@/pages/LoginPage';
import AdminDashboard from '@/pages/admin/Dashboard';
import RoomsPage from '@/pages/admin/Rooms';
import TenantsPage from '@/pages/admin/Tenants';
import MeterReadingsPage from '@/pages/admin/MeterReadings';
import BillsPage from '@/pages/admin/Bills';
import PaymentsPage from '@/pages/admin/Payments';
import SettingsPage from '@/pages/admin/Settings';
import TenantDashboard from '@/pages/tenant/Dashboard';
import MyBillsPage from '@/pages/tenant/MyBills';
import MyReadingsPage from '@/pages/tenant/MyReadings';
import MyPaymentsPage from '@/pages/tenant/MyPayments';

function RootRedirect() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (userProfile?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/tenant/dashboard" replace />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="tenants" element={<TenantsPage />} />
            <Route path="readings" element={<MeterReadingsPage />} />
            <Route path="bills" element={<BillsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Tenant Routes */}
          <Route
            path="/tenant"
            element={
              <ProtectedRoute requiredRole="tenant">
                <TenantLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<TenantDashboard />} />
            <Route path="bills" element={<MyBillsPage />} />
            <Route path="readings" element={<MyReadingsPage />} />
            <Route path="payments" element={<MyPaymentsPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </Router>
  );
}

export default App;

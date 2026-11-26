import { useEffect } from 'react';
import { Route, Routes, BrowserRouter } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';
import { restoreSession } from '@/features/auth/authSlice';
import { useAppDispatch } from '@/hooks/redux';
import { AdminCatalogPage } from '@/pages/admin/AdminCatalogPage';
import { AdminConfigPage } from '@/pages/admin/AdminConfigPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminLiveOpsPage } from '@/pages/admin/AdminLiveOpsPage';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { AdminPlayersPage } from '@/pages/admin/AdminPlayersPage';
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage';
import { ChainPage } from '@/pages/ChainPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DeliveryPage } from '@/pages/DeliveryPage';
import { EmployeesPage } from '@/pages/EmployeesPage';
import { FactoriesPage } from '@/pages/FactoriesPage';
import { FarmPage } from '@/pages/FarmPage';
import { FinancePage } from '@/pages/FinancePage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { HomePage } from '@/pages/HomePage';
import { InventoryPage } from '@/pages/InventoryPage';
import { LoginPage } from '@/pages/LoginPage';
import { MallsPage } from '@/pages/MallsPage';
import { MissionsPage } from '@/pages/MissionsPage';
import { ModulePage } from '@/pages/ModulePage';
import { ProductionPage } from '@/pages/ProductionPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { RegisterPage } from '@/pages/RegisterPage';
import { RestaurantsPage } from '@/pages/RestaurantsPage';
import { SupermarketsPage } from '@/pages/SupermarketsPage';
import { UpgradesPage } from '@/pages/UpgradesPage';

export function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(restoreSession());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-slate-950 text-slate-100">
              <Navbar />
              <HomePage />
            </div>
          }
        />
        <Route
          path="/login"
          element={
            <div className="min-h-screen bg-slate-950 text-slate-100">
              <Navbar />
              <LoginPage />
            </div>
          }
        />
        <Route
          path="/register"
          element={
            <div className="min-h-screen bg-slate-950 text-slate-100">
              <Navbar />
              <RegisterPage />
            </div>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <div className="min-h-screen bg-slate-950 text-slate-100">
              <Navbar />
              <ForgotPasswordPage />
            </div>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-slate-950 text-slate-100">
                <Navbar />
                <ProfilePage />
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/farm"
          element={
            <ProtectedRoute>
              <FarmPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/inventory"
          element={
            <ProtectedRoute>
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/factories"
          element={
            <ProtectedRoute>
              <FactoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/production"
          element={
            <ProtectedRoute>
              <ProductionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/restaurants"
          element={
            <ProtectedRoute>
              <RestaurantsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/chain"
          element={
            <ProtectedRoute>
              <ChainPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/supermarkets"
          element={
            <ProtectedRoute>
              <SupermarketsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/malls"
          element={
            <ProtectedRoute>
              <MallsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/employees"
          element={
            <ProtectedRoute>
              <EmployeesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/delivery"
          element={
            <ProtectedRoute>
              <DeliveryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/finance"
          element={
            <ProtectedRoute>
              <FinancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/upgrades"
          element={
            <ProtectedRoute>
              <UpgradesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/missions"
          element={
            <ProtectedRoute>
              <MissionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/map"
          element={
            <ProtectedRoute>
              <ModulePage
                title="Business Map"
                description="View your empire footprint across Rural Valley, Suburbs, Industrial Park, and City Districts."
                requiredStage={1}
              />
            </ProtectedRoute>
          }
        />

        {/* Separate Internal Company Admin Portal */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminDashboardPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/players"
          element={
            <AdminProtectedRoute>
              <AdminPlayersPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/catalog"
          element={
            <AdminProtectedRoute>
              <AdminCatalogPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/liveops"
          element={
            <AdminProtectedRoute>
              <AdminLiveOpsPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/config"
          element={
            <AdminProtectedRoute>
              <AdminConfigPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminProtectedRoute>
              <AdminReportsPage />
            </AdminProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { RoleRoute } from './auth/RoleRoute';
import { AdminShell } from './layouts/AdminShell';
import { AppShell } from './layouts/AppShell';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { AuthPage } from './pages/AuthPage';
import { PlannerPage } from './pages/PlannerPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminActivityPage } from './pages/admin/AdminActivityPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminPlannerViewPage } from './pages/admin/AdminPlannerViewPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminStatsPage } from './pages/admin/AdminStatsPage';
import { AdminUserDetailPage } from './pages/admin/AdminUserDetailPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
                <Route element={<ProtectedRoute />}>
                    <Route element={<AppShell />}>
                        <Route path="/planner" element={<PlannerPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                    </Route>
                    <Route element={<RoleRoute allowedRoles={["admin"]} unauthorizedElement={<UnauthorizedPage />} />}>
                        <Route element={<AdminShell />}>
                            <Route path="/admin" element={<AdminDashboardPage />} />
                            <Route path="/admin/users" element={<AdminUsersPage />} />
                            <Route path="/admin/users/:userId" element={<AdminUserDetailPage />} />
                            <Route path="/admin/planner/:userId" element={<AdminPlannerViewPage />} />
                            <Route path="/admin/activity" element={<AdminActivityPage />} />
                            <Route path="/admin/stats" element={<AdminStatsPage />} />
                            <Route path="/admin/settings" element={<AdminSettingsPage />} />
                        </Route>
                    </Route>
                </Route>
                <Route path="*" element={<Navigate to="/planner" replace />} />
            </Routes>
        </AuthProvider>
    );
}

export default App;
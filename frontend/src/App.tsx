import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { Login } from './features/auth/Login';
import { Register } from './features/auth/Register';
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary';
import MainLayout from './components/layout/MainLayout';
import { SystemDashboard } from './features/calculator/SystemDashboard';
import AdminLayout from './features/admin/AdminLayout';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { AdminUsers } from './features/admin/AdminUsers';
import { AdminResources } from './features/admin/AdminResources';
import { AdminInvites } from './features/admin/AdminInvites';
import { AdminSupport } from './features/admin/AdminSupport';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return isAuthenticated ? children : <Navigate to="/login" />;
};

const ProtectedAdminRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated, loading, user } = useAuth();
    if (loading) return <div>Loading...</div>;
    return isAuthenticated && user?.role === 'admin' ? children : <Navigate to="/" />;
};

function App() {
    return (
        <GlobalErrorBoundary>
            <AuthProvider>
                <ToastProvider>
                    <Router>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route
                                path="/"
                                element={
                                    <ProtectedRoute>
                                        <MainLayout>
                                            <SystemDashboard />
                                        </MainLayout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/*"
                                element={
                                    <ProtectedAdminRoute>
                                        <AdminLayout />
                                    </ProtectedAdminRoute>
                                }
                            >
                                <Route index element={<AdminDashboard />} />
                                <Route path="users" element={<AdminUsers />} />
                                <Route path="resources" element={<AdminResources />} />
                                <Route path="invites" element={<AdminInvites />} />
                                <Route path="support" element={<AdminSupport />} />
                            </Route>
                        </Routes>
                    </Router>
                </ToastProvider>
            </AuthProvider>
        </GlobalErrorBoundary>
    );
}

export default App;

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { Login } from './features/auth/Login';
import { Register } from './features/auth/Register';
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary';
import MainLayout from './components/layout/MainLayout';
import { SystemDashboard } from './features/calculator/SystemDashboard';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return isAuthenticated ? children : <Navigate to="/login" />;
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
                        </Routes>
                    </Router>
                </ToastProvider>
            </AuthProvider>
        </GlobalErrorBoundary>
    );
}

export default App;

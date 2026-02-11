import React from 'react';
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary';
import MainLayout from './components/layout/MainLayout';
import { SystemDashboard } from './features/calculator/SystemDashboard';

function App() {
    return (
        <GlobalErrorBoundary>
            <MainLayout>
                <SystemDashboard />
            </MainLayout>
        </GlobalErrorBoundary>
    );
}

export default App;

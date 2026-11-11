import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAppStore } from './store';
import Analytics from './components/dashboard/Analytics';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import SelectionFlow from './pages/SelectionFlow';

function AppRoutes() {
  const location = useLocation();
  const { selectedHall } = useAppStore();
  const isSelectionRoute =
    location.pathname.includes('select-state') ||
    location.pathname.includes('select-branch') ||
    location.pathname.includes('select-hall');

  if (!selectedHall && !isSelectionRoute) {
    return <Navigate to="/select-state" replace />;
  }

  if (selectedHall && isSelectionRoute) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Routes>
      <Route path="/select-state" element={<SelectionFlow />} />
      <Route path="/states/:stateId/select-branch" element={<SelectionFlow />} />
      <Route path="/states/:stateId/branches/:branchId/select-hall" element={<SelectionFlow />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route
        path="/analytics"
        element={
          <Layout>
            <Analytics />
          </Layout>
        }
      />
      <Route path="/" element={<Navigate to={selectedHall ? '/dashboard' : '/select-state'} replace />} />
      <Route path="*" element={<Navigate to={selectedHall ? '/dashboard' : '/select-state'} replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}

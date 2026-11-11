import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from './store';
import Dashboard from './pages/Dashboard';
import SelectionFlow from './pages/SelectionFlow';
import Analytics from './components/dashboard/Analytics';
import Layout from './components/layout/Layout';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

type StudentRecord = {
  name: string;
  id: string;
  attendance: number;
  meals: number;
  status: string;
  lastSeen: string;
  meal: string;
  history: Array<{
    date: string;
    meal: string;
    status: string;
    time: string;
  }>;
};

function AppRoutes() {
  const location = useLocation();
  const { selectedHall, selectedBranch, selectedState } = useAppStore();
  const [now, setNow] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  const attendanceStudents: StudentRecord[] = [
    {
      name: 'A. Rohith',
      id: 'NMCH-2041',
      attendance: 100,
      meals: 2,
      status: 'Eaten',
      lastSeen: '08:12',
      meal: 'Breakfast',
      history: [
        { date: '2026-08-01', meal: 'Breakfast', status: 'Present', time: '08:10' },
        { date: '2026-08-02', meal: 'Lunch', status: 'Present', time: '12:20' },
        { date: '2026-08-03', meal: 'Dinner', status: 'Present', time: '19:32' }
      ]
    }
  ];

  const filteredStudents = attendanceStudents.filter((student) =>
    `${student.name} ${student.id}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <Route
        path="/dashboard"
        element={
          <Dashboard
            now={now}
            students={filteredStudents}
            onViewAttendance={(student) => setSelectedStudent(student)}
          />
        }
      />

      <Route
        path="/analytics"
        element={
          <Layout>
            <Analytics />
          </Layout>
        }
      />

      <Route
        path="/"
        element={selectedHall ? <Navigate to="/dashboard" replace /> : <Navigate to="/select-state" replace />}
      />

      <Route
        path="*"
        element={selectedHall ? <Navigate to="/dashboard" replace /> : <Navigate to="/select-state" replace />}
      />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
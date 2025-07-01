import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TherapistDashboard from './pages/TherapistDashboard';
import PatientDashboard from './pages/PatientDashboard';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path=":tenant_domain/login" element={<LoginPage />} />
      <Route path=":tenant_domain/admin" element={<AdminDashboard />} />
      <Route path=":tenant_domain/therapist" element={<TherapistDashboard />} />
      <Route path=":tenant_domain/patient" element={<PatientDashboard />} />
      <Route path="*" element={<Navigate to="/demo.mentalspace.com/login" replace />} />
    </Routes>
  );
};

export default App; 
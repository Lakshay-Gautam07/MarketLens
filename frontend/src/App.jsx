import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Overview from './pages/Overview';
import Landscape from './pages/Landscape';
import CompetitorDetail from './pages/CompetitorDetail';
import Changes from './pages/Changes';
import Pricing from './pages/Pricing';
import Signals from './pages/Signals';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="landscape" element={<Landscape />} />
          <Route path="landscape/:id" element={<CompetitorDetail />} />
          <Route path="competitors" element={<Navigate to="/landscape" replace />} />
          <Route path="competitors/:id" element={<CompetitorDetail />} />
          <Route path="changes" element={<Changes />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="signals" element={<Signals />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

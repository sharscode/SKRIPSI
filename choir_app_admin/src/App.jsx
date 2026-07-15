import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AnggotaListPage from './pages/anggota/AnggotaListPage';
import AnggotaFormPage from './pages/anggota/AnggotaFormPage';
import AnggotaUkmPage from './pages/anggota/AnggotaUkmPage';
import AcaraListPage from './pages/acara/AcaraListPage';
import AcaraFormPage from './pages/acara/AcaraFormPage';
import AcaraDetailPage from './pages/acara/AcaraDetailPage';
import LatihanListPage from './pages/latihan/LatihanListPage';
import LatihanFormPage from './pages/latihan/LatihanFormPage';
import AbsensiPage from './pages/latihan/AbsensiPage';
import PartiturListPage from './pages/partitur/PartiturListPage';
import PartiturFormPage from './pages/partitur/PartiturFormPage';
import SkkkPage from './pages/SkkkPage';
import RekapPage from './pages/RekapPage';
import AdminListPage from './pages/AdminListPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'16px' }}>
      <div style={{ width:'40px', height:'40px', border:'4px solid #D4E1EE', borderTopColor:'#6B91B8', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
      <p style={{ color:'#64748B', fontFamily:'Inter,sans-serif' }}>Memuat...</p>
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/anggota" element={<AnggotaListPage />} />
              <Route path="/anggota/new" element={<AnggotaFormPage />} />
              <Route path="/anggota/:id/edit" element={<AnggotaFormPage />} />
              <Route path="/anggota-ukm" element={<AnggotaUkmPage />} />
              <Route path="/acara" element={<AcaraListPage />} />
              <Route path="/acara/new" element={<AcaraFormPage />} />
              <Route path="/acara/:id" element={<AcaraDetailPage />} />
              <Route path="/acara/:id/edit" element={<AcaraFormPage />} />
              <Route path="/latihan" element={<LatihanListPage />} />
              <Route path="/latihan/new" element={<LatihanFormPage />} />
              <Route path="/latihan/:id/edit" element={<LatihanFormPage />} />
              <Route path="/latihan/:id/absensi" element={<AbsensiPage />} />
              <Route path="/partitur" element={<PartiturListPage />} />
              <Route path="/partitur/new" element={<PartiturFormPage />} />
              <Route path="/partitur/:id/edit" element={<PartiturFormPage />} />
              <Route path="/skkk" element={<SkkkPage />} />
              <Route path="/rekap" element={<RekapPage />} />
              <Route path="/admin" element={<AdminListPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

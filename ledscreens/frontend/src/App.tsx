import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Locations from './pages/Locations';
import LaunchCampaign from './pages/LaunchCampaign';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ApiDocs from './pages/ApiDocs';
import Profile from './pages/Profile';
import Register from './pages/Register';
import ScreenPreview from './pages/ScreenPreview';
import GovLogin from './pages/GovLogin';
import GovDashboard from './pages/GovDashboard';
import PartnerWithUs from './pages/PartnerWithUs';
import CompleteProfile from './pages/CompleteProfile';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import About from './pages/About';
import DomainRouter from './components/DomainRouter';
import NotFound from './pages/NotFound';
import { useAuth } from './AuthContext';




function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const userRole = user?.role || localStorage.getItem('userRole');
  
  const isAuthPage = ['/login', '/register', '/forgot-password', '/gov-login', '/complete-profile'].includes(location.pathname);
  const isScreenPage = location.pathname.startsWith('/screen/');
  const isAdminPage = location.pathname.startsWith('/admin');
  const isAdmin = userRole === 'admin';
  const isGov = userRole === 'government';
  
  // Hide UI for Auth, Screens, Admin dashboard OR if the user is an admin
  const shouldHideUI = isAuthPage || isScreenPage || isAdminPage || isAdmin;

  useEffect(() => {
    // Redirect logic
    if (token) {
      if (isAdmin && !isAdminPage && !isScreenPage && !isAuthPage) {
        navigate('/admin', { replace: true });
      }
    }
  }, [location.pathname, isAdmin, isGov, token, navigate]);

  return (
    DomainRouter &&
    <DomainRouter>
      <div className="flex flex-col min-h-screen">
        <ScrollToTop />
        {!shouldHideUI && <Navbar />}
        <main className="flex-grow flex flex-col">
          <Routes>
            {/* ── Public routes ─────────────────────── */}
            <Route path="/login"    element={<Login />} />
            <Route path="/gov-login" element={<GovLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/docs" element={<ApiDocs />} />
            <Route path="/screen/:deviceId" element={<ScreenPreview />} />


            {/* ── Protected routes ──────────────────── */}
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/locations" element={<ProtectedRoute><Locations /></ProtectedRoute>} />
            <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
            <Route path="/launch-campaign" element={<ProtectedRoute requireProfile><LaunchCampaign /></ProtectedRoute>} />
            <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/partner-with-us" element={<ProtectedRoute><PartnerWithUs /></ProtectedRoute>} />
            <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
            <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
            <Route path="/privacy" element={<ProtectedRoute><Privacy /></ProtectedRoute>} />
            <Route path="/terms" element={<ProtectedRoute><Terms /></ProtectedRoute>} />
            <Route path="/admin/*" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="/gov-dashboard" element={<ProtectedRoute govOnly><GovDashboard /></ProtectedRoute>} />

            {/* ── Fallback / 404 ────────────────────── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        {!shouldHideUI && location.pathname !== '/locations' && <Footer />}
      </div>
    </DomainRouter>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

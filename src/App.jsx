import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Batches from './pages/Batches';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Login from './pages/Login';
import StaffLogin from './pages/StaffLogin';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Certificate from './pages/Certificate';
import CertificateDummy from './pages/CertificateDummy';
import ResetPassword from './pages/ResetPassword';
import AuthCallback from './pages/AuthCallback';
import ApplyInternship from './pages/ApplyInternship';
import PremiumApplication from './pages/PremiumApplication';
import ApplyAmbassador from './pages/ApplyAmbassador';
import NotFound from './pages/NotFound';
import About from './pages/About';
import Courses from './pages/Courses';
import Faq from './pages/Faq';
import RefundPolicy from './pages/RefundPolicy';
import CancellationPolicy from './pages/CancellationPolicy';
import CampusAmbassador from './pages/CampusAmbassador';
import ScrollToTop from './components/ScrollToTop';
import Verify from './pages/Verify';
import HallOfFame from './pages/HallOfFame';
import EmployerPortal from './pages/EmployerPortal';
import SocialProof from './components/SocialProof';
import ResumePricing from './pages/resume/ResumePricing';
import ResumeBuilder from './pages/resume/ResumeBuilder';

// 1. Naye Projects Pages Import kiye gaye hain
import Projects from './pages/Projects'; // (Agar 'components' folder me ho to path check kar lein)
import AddProject from './pages/AddProject';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <SocialProof />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/batches" element={<Batches />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/about" element={<About />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/cancellation-policy" element={<CancellationPolicy />} />
          <Route path="/ambassador" element={<CampusAmbassador />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/hall-of-fame" element={<HallOfFame />} />
          <Route path="/hire-talent" element={<EmployerPortal />} />

          {/* 2. Projects Routes Layout ke andar add kar diye gaye hain */}
          <Route path="/projects" element={<Projects />} />
          <Route path="/add-project" element={<AddProject />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/staff-login" element={<StaffLogin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/certificate/*" element={<Certificate />} />
        <Route path="/certificate/dummy" element={<CertificateDummy />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/apply" element={<ApplyInternship />} />
        <Route path="/apply-premium" element={<PremiumApplication />} />
        <Route path="/apply-ambassador" element={<ApplyAmbassador />} />
        <Route path="/employers" element={<EmployerPortal />} />
        
        {/* Commercial AI Resume Builder Routes */}
        <Route path="/resume" element={<ResumePricing />} />
        <Route path="/resume/builder/:id" element={<ResumeBuilder />} />
        <Route path="/resume-builder" element={<Navigate to="/resume" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

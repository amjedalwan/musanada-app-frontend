import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

// استيراد الصفحات (تأكد من استيراد الواجهتين الجديدتين)
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard'; // واجهة الطالب المنفصلة
import OrgDashboard from './pages/OrgDashboard';         // واجهة المؤسسة المنفصلة
import Opportunities from './pages/Opportunities';
import OpportunityDetails from './pages/OpportunityDetails';
import CreateOpportunity from './pages/CreateOpportunity';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import StudentProfile from './pages/StudentProfile';
import { toast, Toaster } from 'react-hot-toast';
import ManageOpportunities from './pages/ManageOpportunities';
import StudentHoursLog from './pages/StudentHoursLog';
import OrgProfile from './pages/OrgProfile';
import MyApplications from './pages/my-applications';
import OpportunitiesMap from './pages/OpportunitiesMap';
import Certificates from './pages/Certificates';
import EditOpportunity from './pages/EditOpportunity';
import EvaluateVolunteers from './pages/EvaluateVolunteers';
import LogHours from './pages/LogHours';
import OpportunityApplicants from './pages/OpportunityApplicants';
import CertificatesManagement from './pages/CertificatesManagement';
import ManageVolunteers from './pages/ManageVolunteers';
import VolunteerPortfolio from './pages/VolunteerPortfolio';
import AdminDashboard from './pages/AdminDashboard';
import OrganizationVerification from './pages/OrganizationVerification';
import AdminUsers from './pages/AdminUsers';
import AdminAnalytics from './pages/AdminAnalytics';
import OpportunityModeration from './pages/OpportunityModeration';
import SkillsManagement from './pages/SkillsManagement';
import AllPendingApplicants from './pages/AllPendingApplicants';
import GlobalCertificateManager from './pages/GlobalCertificateManager';


const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  
  // دالة آمنة لجلب بيانات المستخدم
  const getUserData = () => {
    const userData = localStorage.getItem('user');
    if (!userData || userData === "undefined") return {};
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error("Error parsing user data:", error);
      return {};
    }
  };

  const user = getUserData();

  if (!token) return <Navigate to="/login" replace />;

  if (userRole === 'organization' && user.status === 'pending') {
    // يفضل توجيه المستخدم لصفحة انتظار بدلاً من مسح كل شيء
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
function App() {
  // دالة لجلب الدور الحالي ديناميكياً داخل الرندر
  const getCurrentRole = () => localStorage.getItem('role');

  return (
    <Routes>
      {/* المسارات العامة */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          {(() => {
            const role = localStorage.getItem('role');
            if (role === 'admin') return <AdminDashboard />; // تأكد من استيراد هذه الصفحة
            if (role === 'organization') return <OrgDashboard />;
            if (role === 'student') return <StudentDashboard />;
            return toast.error("حسابك قيد المراجعة من قبل الإدارة، ستصلك رسالة عند التفعيل.");
          })()}
        </ProtectedRoute>
      } />

      {/* البروفايل الذكي */}
      <Route path="/profile" element={
        <ProtectedRoute>
          {getCurrentRole() === 'organization' ? <OrgProfile /> : <StudentProfile />}
        </ProtectedRoute>
      } />

      {/* مسارات مشتركة محمية بالتوكن فقط */}
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/opportunities-map" element={<ProtectedRoute><OpportunitiesMap /></ProtectedRoute>} />
      <Route path="/dashboard/manage-opportunities" element={<ManageOpportunities />} />

      <Route path="/opportunities" element={<Opportunities />} />
      <Route path="admin/users" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminUsers />
        </ProtectedRoute>
      } />
      <Route path="admin/skills" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <SkillsManagement />
        </ProtectedRoute>
      } />
      <Route path="admin/verify-orgs" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <OrganizationVerification />
        </ProtectedRoute>
      } />
      <Route path="/admin/opportunities" element={<OpportunityModeration />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} /> 
      
       <Route path="/opportunities/:id" element={<OpportunityDetails />} />
      <Route path="/my-applications" element={
        <ProtectedRoute allowedRoles={['student']}>
          <MyApplications />
        </ProtectedRoute>
      } />
      <Route path="/logs" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentHoursLog />
        </ProtectedRoute>
      } />
      <Route path="/certificates" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Certificates />
        </ProtectedRoute>
      } />

      {/* --- مسارات المؤسسات فقط (حماية صارمة) --- */}
      <Route path="/opportunities/create" element={
        <ProtectedRoute allowedRoles={['organization']}>
          <CreateOpportunity />
        </ProtectedRoute>
      } />
      <Route path="/manage-opportunities" element={
        <ProtectedRoute allowedRoles={['organization']}>
          <ManageOpportunities />
        </ProtectedRoute>
      } />
      //صفحة عرض الشهايد
      <Route path="/certificates-management" element={
        <ProtectedRoute allowedRoles={['organization']}>
          <CertificatesManagement />
        </ProtectedRoute>
      } />

      <Route path="/org-profile" element={
        <ProtectedRoute allowedRoles={['organization']}>
          <OrgProfile />
        </ProtectedRoute>
      } />
      <Route path="/manage-volunteers" element={
        <ProtectedRoute allowedRoles={['organization']}>
          <ManageVolunteers />
        </ProtectedRoute>
      } />
      <Route path="/volunteer-portfolio/:id" element={
        <ProtectedRoute allowedRoles={['organization']}>
          <VolunteerPortfolio />
        </ProtectedRoute>
      } />
      <Route path="/pending-applicants" element={
        <ProtectedRoute allowedRoles={['organization']}>
          <AllPendingApplicants />
        </ProtectedRoute>
      } />

      <Route path="/global-certificate-manager/:code" element={<GlobalCertificateManager />} />
      <Route path="/edit-opportunity/:id" element={<EditOpportunity />} />
      <Route path="/evaluate-volunteers/:opportunityId" element={<EvaluateVolunteers />} />
      {/* التوجيهات التلقائية للأخطاء */}

      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/org/log-hours/:opportunityId/:userId" element={<LogHours />} />

      <Route path="opportunity-applicants/:id" element={<OpportunityApplicants />} />
    </Routes>
  );
}

export default App;
import React, { useState, useEffect, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, LoginSignupForm, useAuth } from './components/Auth';
import Header from './components/Header';
import Footer from './components/Footer';
// Lazy Loaded Pages
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const CaseView = React.lazy(() => import('./pages/CaseView'));
const PatientPortal = React.lazy(() => import('./pages/PatientPortal'));
const PatientIntake = React.lazy(() => import('./pages/PatientIntake'));
const PatientProfileView = React.lazy(() => import('./pages/PatientProfileView'));
const UserManagement = React.lazy(() => import('./pages/admin/UserManagement'));
const SystemStats = React.lazy(() => import('./pages/admin/SystemStats'));
const Finance = React.lazy(() => import('./pages/admin/Finance'));
const AIConfig = React.lazy(() => import('./pages/admin/AIConfig'));
const SupportTicketsPage = React.lazy(() => import('./pages/admin/SupportTicketsPage'));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard'));
const NurseDashboard = React.lazy(() => import('./pages/NurseDashboard'));
const EmergencyDashboard = React.lazy(() => import('./pages/EmergencyDashboard'));
const PatientDashboard = React.lazy(() => import('./pages/PatientDashboard'));
const PharmacyDashboard = React.lazy(() => import('./pages/PharmacyDashboard'));
const InsuranceDashboard = React.lazy(() => import('./pages/InsuranceDashboard'));
const ResearchCommunity = React.lazy(() => import('./pages/ResearchCommunity').then(module => ({ default: module.ResearchCommunity })));
const RadiologyDashboard = React.lazy(() => import('./pages/RadiologyDashboard'));
const LabDashboard = React.lazy(() => import('./pages/LabDashboard'));
const ManagerDashboard = React.lazy(() => import('./pages/ManagerDashboard'));
const IntegrationsPage = React.lazy(() => import('./pages/patient/Integrations').then(module => ({ default: module.IntegrationsPage })));
const AdminIntegrationsDashboard = React.lazy(() => import('./pages/admin/IntegrationDashboard').then(module => ({ default: module.AdminIntegrationsDashboard })));
const SharedView = React.lazy(() => import('./pages/SharedView'));
const EmergencyView = React.lazy(() => import('./pages/EmergencyView'));
const Marketplace = React.lazy(() => import('./pages/Marketplace'));
const DeveloperPortal = React.lazy(() => import('./pages/DeveloperPortal'));
const PhysioDashboard = React.lazy(() => import('./pages/PhysioDashboard'));
const TraineeDashboard = React.lazy(() => import('./pages/TraineeDashboard'));
const ComplianceDashboard = React.lazy(() => import('./pages/ComplianceDashboard'));
const AIEngineerDashboard = React.lazy(() => import('./pages/AIEngineerDashboard'));
const CreditsPage = React.lazy(() => import('./pages/CreditsPage'));
const TechnicalSecurityPage = React.lazy(() => import('./pages/TechnicalSecurityPage'));
const EcosystemPage = React.lazy(() => import('./pages/EcosystemPage'));
const CostTransparencyPage = React.lazy(() => import('./pages/CostTransparencyPage'));
const BodyMapPage = React.lazy(() => import('./pages/BodyMapPage'));
const TriagePage = React.lazy(() => import('./pages/TriagePage'));
const SpecialistsPage = React.lazy(() => import('./pages/SpecialistsPage'));
const InfoPage = React.lazy(() => import('./pages/InfoPage'));
const CareFinderPage = React.lazy(() => import('./pages/patient/CareFinderPage').then(module => ({ default: module.CareFinderPage })));
const HealthTrendsPage = React.lazy(() => import('./pages/patient/HealthTrendsPage').then(module => ({ default: module.HealthTrendsPage })));
const DataSharingPage = React.lazy(() => import('./pages/patient/DataSharing').then(module => ({ default: module.DataSharingPage })));
const PatientHealthHub = React.lazy(() => import('./pages/PatientHealthHub'));
const DentistDashboard = React.lazy(() => import('./pages/DentistDashboard'));
const OrthopedicsDashboard = React.lazy(() => import('./pages/specialists/OrthopedicsDashboard'));
const CardiologyDashboard = React.lazy(() => import('./pages/specialists/CardiologyDashboard'));
const UrologyDashboard = React.lazy(() => import('./pages/specialists/UrologyDashboard'));
const GastroDashboard = React.lazy(() => import('./pages/specialists/GastroDashboard'));
const DermatologyDashboard = React.lazy(() => import('./pages/specialists/DermatologyDashboard'));
const OphthalmologyDashboard = React.lazy(() => import('./pages/specialists/OphthalmologyDashboard'));
const PediatricsDashboardPage = React.lazy(() => import('./pages/specialists/PediatricsDashboardPage'));
const HematologyDashboard = React.lazy(() => import('./pages/specialists/HematologyDashboard'));
const MetabolicDashboard = React.lazy(() => import('./pages/specialists/MetabolicDashboard'));
const OncologyDashboard = React.lazy(() => import('./pages/specialists/OncologyDashboard'));
const RheumatologyDashboard = React.lazy(() => import('./pages/specialists/RheumatologyDashboard'));
const MasterDoctorPage = React.lazy(() => import('./pages/MasterDoctorPage'));
const HelpPage = React.lazy(() => import('./pages/HelpPage'));
const RoadmapPage = React.lazy(() => import('./pages/RoadmapPage'));
const VIPLongevityPage = React.lazy(() => import('./pages/VIPLongevityPage'));


import { Role } from './types/index';
import { ICONS } from './constants/index';
import AIChatbot from './components/AIChatbot';
import { ToastContainer } from './components/Toast';
import UserProfileModal from './components/UserProfileModal';
import { ThemeProvider } from './components/Theme';
import AntigravityManager from './components/AntigravityManager';
import { AIAssistantWidget } from './components/AIAssistantWidget';
import CreateCaseForm from './components/CreateCaseForm';
import AdminLayout from './components/AdminLayout';


// A modal component for the login form
const LoginModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="relative glass-card p-1 rounded-[32px] overflow-hidden animate-fade-in">
                <LoginSignupForm onLogin={onClose} />
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

// Define role groups for route protection
// Define role groups for route protection
const nonPatientRoles = [Role.Doctor, Role.Nurse, Role.Specialist, Role.Admin, Role.Dentist];
const patientRole = [Role.Patient];

// A component to protect routes based on user authentication and role.
const ProtectedRoute: React.FC<{ children: React.ReactElement; allowedRoles: Role[] }> = ({ children, allowedRoles }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
                    <div className="text-sm font-bold text-gray-500">Verifying Session...</div>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

import { FeedbackModal } from './components/FeedbackModal';

// Main layout that includes the header
const AppLayout: React.FC = () => {
    const { user } = useAuth();
    const [isLoginModalOpen, setLoginModalOpen] = useState(false);
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [isChatbotOpen, setChatbotOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('ServiceWorker registration successful');
                    })
                    .catch(err => {
                        console.log('ServiceWorker registration failed:', err);
                    });
            });
        }
    }, []);

    // Check if we should show the landing page or redirect
    const isLanding = location.pathname === '/';

    return (
        <div className="flex flex-col min-h-screen">
            <Header
                onLoginClick={() => setLoginModalOpen(true)}
                onProfileClick={() => setProfileModalOpen(true)}
                onFeedbackClick={() => setFeedbackModalOpen(true)}
            />
            <ToastContainer />
            <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} />
            <AntigravityManager />
            <main className="flex-grow">
                <Routes>
                    <Route path="/" element={
                        user ? (
                            user.role === Role.Patient ? <Navigate to="/patient-dashboard" replace /> :
                                user.role === Role.Nurse ? <Navigate to="/nurse-dashboard" replace /> :
                                    user.role === Role.Dentist ? <Navigate to="/dentist-dashboard" replace /> :
                                        user.role === Role.Pharmacist ? <Navigate to="/pharmacy" replace /> :
                                            user.role === Role.BillingOfficer ? <Navigate to="/billing" replace /> :
                                                user.role === Role.Radiologist ? <Navigate to="/radiology" replace /> :
                                                    user.role === Role.LabTechnician ? <Navigate to="/lab" replace /> :
                                                        user.role === Role.Physiotherapist ? <Navigate to="/physio" replace /> :
                                                            user.role === Role.Trainee ? <Navigate to="/trainee" replace /> :
                                                                user.role === Role.ComplianceOfficer ? <Navigate to="/compliance" replace /> :
                                                                    user.role === Role.AIEngineer ? <Navigate to="/ai-engineering" replace /> :
                                                                        user.role === Role.HospitalManager ? <Navigate to="/manager" replace /> :
                                                                            user.role === Role.Admin ? <Navigate to="/admin" replace /> :
                                                                                <Navigate to="/dashboard" replace />
                        ) : (
                            <LandingPage onGetStarted={() => setLoginModalOpen(true)} />
                        )
                    } />

                    {/* Public Shared Routes */}
                    <Route path="/shared/:token" element={<SharedView />} />
                    <Route path="/emergency/:id" element={<EmergencyView />} />

                    {/* Role-Specific Dashboards */}
                    <Route
                        path="/nurse-dashboard"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Nurse, Role.Admin]}>
                                <NurseDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/emergency"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Doctor, Role.Nurse, Role.Admin]}>
                                <EmergencyDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/leaderboard"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Patient, Role.Doctor, Role.Admin]}>
                                <Leaderboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/patient-dashboard"
                        element={
                            <ProtectedRoute allowedRoles={patientRole}>
                                <PatientDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/health-trends"
                        element={
                            <ProtectedRoute allowedRoles={patientRole}>
                                <HealthTrendsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/data-sharing"
                        element={
                            <ProtectedRoute allowedRoles={patientRole}>
                                <DataSharingPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/health-trends"
                        element={
                            <ProtectedRoute allowedRoles={patientRole}>
                                <HealthTrendsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/data-sharing"
                        element={
                            <ProtectedRoute allowedRoles={patientRole}>
                                <DataSharingPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/care-finder"
                        element={
                            <ProtectedRoute allowedRoles={patientRole}>
                                <CareFinderPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={nonPatientRoles}>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/case/:id"
                        element={
                            <ProtectedRoute allowedRoles={nonPatientRoles}>
                                <CaseView />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/patient-intake"
                        element={
                            <ProtectedRoute allowedRoles={[...nonPatientRoles, ...patientRole]}>
                                <PatientIntake />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/credits"
                        element={
                            <ProtectedRoute allowedRoles={[...nonPatientRoles, ...patientRole]}>
                                <CreditsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/patient/:id"
                        element={
                            <ProtectedRoute allowedRoles={nonPatientRoles}>
                                <PatientProfileView />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Admin]}>
                                <AdminLayout>
                                    <AdminDashboard />
                                </AdminLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/users"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Admin]}>
                                <AdminLayout>
                                    <UserManagement />
                                </AdminLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/stats"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Admin]}>
                                <AdminLayout>
                                    <SystemStats />
                                </AdminLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/finance"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Admin]}>
                                <AdminLayout>
                                    <Finance />
                                </AdminLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/ai-config"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Admin]}>
                                <AdminLayout>
                                    <AIConfig />
                                </AdminLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/support"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Admin]}>
                                <AdminLayout>
                                    <SupportTicketsPage />
                                </AdminLayout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/research-community"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Doctor, Role.Nurse, Role.Patient, Role.Admin]}>
                                <ResearchCommunity />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/pharmacy"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Pharmacist, Role.Admin]}>
                                <PharmacyDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/billing"
                        element={
                            <ProtectedRoute allowedRoles={[Role.BillingOfficer, Role.Admin]}>
                                <InsuranceDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/radiology"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Radiologist, Role.Admin]}>
                                <RadiologyDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/lab"
                        element={
                            <ProtectedRoute allowedRoles={[Role.LabTechnician, Role.Admin]}>
                                <LabDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/manager"
                        element={
                            <ProtectedRoute allowedRoles={[Role.HospitalManager, Role.Admin]}>
                                <ManagerDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/integrations"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Patient, Role.Admin]}>
                                <IntegrationsPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/health-hub"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Patient, Role.Admin]}>
                                <PatientHealthHub />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/physio"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Physiotherapist, Role.Admin]}>
                                <PhysioDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/trainee"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Trainee, Role.Admin]}>
                                <TraineeDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/compliance"
                        element={
                            <ProtectedRoute allowedRoles={[Role.ComplianceOfficer, Role.Admin]}>
                                <ComplianceDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/dentist-dashboard"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Dentist, Role.Admin]}>
                                <DentistDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/orthopedics"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Specialist, Role.Doctor, Role.Admin]}>
                                <OrthopedicsDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/cardiology"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Specialist, Role.Doctor, Role.Admin]}>
                                <CardiologyDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/urology"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Specialist, Role.Doctor, Role.Admin]}>
                                <UrologyDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/gastroenterology"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Specialist, Role.Doctor, Role.Admin]}>
                                <GastroDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/dermatology"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Specialist, Role.Doctor, Role.Admin]}>
                                <DermatologyDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/ophthalmology"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Specialist, Role.Doctor, Role.Admin]}>
                                <OphthalmologyDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/pediatrics"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Specialist, Role.Doctor, Role.Admin, Role.Patient]}>
                                <PediatricsDashboardPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/hematology"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Specialist, Role.Doctor, Role.Admin]}>
                                <HematologyDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/metabolic"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Specialist, Role.Doctor, Role.Admin]}>
                                <MetabolicDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/oncology"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Specialist, Role.Doctor, Role.Admin]}>
                                <OncologyDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/rheumatology"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Specialist, Role.Doctor, Role.Admin]}>
                                <RheumatologyDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/master-doctor"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Specialist, Role.Doctor, Role.Admin, Role.Patient]}>
                                <MasterDoctorPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/ai-engineering"
                        element={
                            <ProtectedRoute allowedRoles={[Role.AIEngineer, Role.Admin]}>
                                <AIEngineerDashboard />
                            </ProtectedRoute>
                        }
                    />


                    <Route
                        path="/admin/integrations"
                        element={
                            <ProtectedRoute allowedRoles={[Role.Admin]}>
                                <AdminLayout>
                                    <AdminIntegrationsDashboard />
                                </AdminLayout>
                            </ProtectedRoute>
                        }
                    />


                    {/* Public Marketplace & Developer Portal */}
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/developer-portal" element={<DeveloperPortal />} />
                    <Route path="/security" element={<TechnicalSecurityPage />} />
                    <Route path="/ecosystem" element={<EcosystemPage />} />
                    <Route path="/billing-transparency" element={<CostTransparencyPage />} />
                    <Route path="/body-map" element={<BodyMapPage />} />

                    <Route path="/triage" element={<TriagePage />} />
                    <Route path="/specialists" element={<SpecialistsPage />} />
                    <Route path="/about" element={<InfoPage type="about" />} />
                    <Route path="/terms" element={<InfoPage type="terms" />} />
                    <Route path="/privacy" element={<InfoPage type="privacy" />} />
                    <Route path="/security-audit" element={<InfoPage type="security" />} />
                    <Route path="/help" element={<HelpPage />} />
                    <Route path="/roadmap" element={<RoadmapPage />} />
                    <Route path="/vip-longevity" element={<VIPLongevityPage />} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} />
            <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setProfileModalOpen(false)} user={user} />

            {/* Patient Chatbot Button */}
            {!isLanding && user?.role === Role.Patient && (
                <button
                    onClick={() => setChatbotOpen(true)}
                    className="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-primary text-white p-5 rounded-3xl shadow-2xl shadow-primary/40 hover:bg-primary-hover transition-all transform hover:scale-110 z-40 active:scale-95 group"
                    aria-label="Open AI health assistant"
                >
                    <div className="group-hover:rotate-12 transition-transform">
                        {ICONS.voiceChat}
                    </div>
                </button>
            )}
            <AIChatbot isOpen={isChatbotOpen} onClose={() => setChatbotOpen(false)} />

            {/* Doctor/Staff Assistant */}
            <AIAssistantWidget />
            {!isLanding && <Footer />}
        </div>
    );
};


const AppFallback = () => {
    const { t } = useTranslation();
    return (
        <div className="w-full h-screen flex items-center justify-center text-text-main bg-background font-heading font-bold text-2xl tracking-tighter">
            {t('initializing')} <span className="text-primary ml-2">{t('healthSystem')}</span>
        </div>
    );
};

import { GoogleOAuthProvider } from '@react-oauth/google';

const App: React.FC = () => {
    const [clientId, setClientId] = useState<string>(import.meta.env.VITE_GOOGLE_CLIENT_ID || "");
    const [configLoaded, setConfigLoaded] = useState(false);

    useEffect(() => {
        // Fetch runtime config
        fetch('/api/auth/config')
            .then(res => res.json())
            .then(data => {
                if (data.googleClientId) {
                    setClientId(data.googleClientId);
                }
            })
            .catch(err => console.log("Config fetch failed:", err))
            .finally(() => setConfigLoaded(true));
    }, []);

    if (!configLoaded) return <AppFallback />;

    return (
        <GoogleOAuthProvider clientId={clientId || "AUTH_CLIENT_ID_MISSING"}>
            <AuthProvider>
                <ThemeProvider>
                    <BrowserRouter>
                        <Suspense fallback={<AppFallback />}>
                            <AppLayout />
                        </Suspense>
                    </BrowserRouter>
                </ThemeProvider>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
};

export default App;

import React, { useState, useEffect, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, LoginSignupForm, useAuth } from './components/Auth';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import CaseView from './pages/CaseView';
import PatientPortal from './pages/PatientPortal';
import PatientIntake from './pages/PatientIntake';
import PatientProfileView from './pages/PatientProfileView';
import UserManagement from './pages/admin/UserManagement';
import SystemStats from './pages/admin/SystemStats';
import Finance from './pages/admin/Finance';
import AIConfig from './pages/admin/AIConfig';
import AdminLayout from './components/AdminLayout';
import NurseDashboard from './pages/NurseDashboard';
import EmergencyDashboard from './pages/EmergencyDashboard';
import PatientDashboard from './pages/PatientDashboard';
import { Role } from './types/index';
import { ICONS } from './constants/index';
import AIChatbot from './components/AIChatbot';
import { ToastContainer } from './components/Toast';
import UserProfileModal from './components/UserProfileModal';
import { ThemeProvider } from './components/Theme';
import AntigravityManager from './components/AntigravityManager';
import { AIAssistantWidget } from './components/AIAssistantWidget';
import PharmacyDashboard from './pages/PharmacyDashboard';
import InsuranceDashboard from './pages/InsuranceDashboard';
import { ResearchCommunity } from './pages/ResearchCommunity';

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
const nonPatientRoles = [Role.Doctor, Role.Nurse, Role.Specialist, Role.Admin];
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

// Main layout that includes the header
const AppLayout: React.FC = () => {
    const { user } = useAuth();
    const [isLoginModalOpen, setLoginModalOpen] = useState(false);
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
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
            <Header onLoginClick={() => setLoginModalOpen(true)} onProfileClick={() => setProfileModalOpen(true)} />
            <ToastContainer />
            <AntigravityManager />
            <main className="flex-grow">
                <Routes>
                    <Route path="/" element={
                        user ? (
                            user.role === Role.Patient ? <Navigate to="/patient-dashboard" replace /> :
                                user.role === Role.Nurse ? <Navigate to="/nurse-dashboard" replace /> :
                                    user.role === Role.Pharmacist ? <Navigate to="/pharmacy" replace /> :
                                        user.role === Role.BillingOfficer ? <Navigate to="/billing" replace /> :
                                            <Navigate to="/dashboard" replace />
                        ) : (
                            <LandingPage onGetStarted={() => setLoginModalOpen(true)} />
                        )
                    } />
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
                        path="/patient-dashboard"
                        element={
                            <ProtectedRoute allowedRoles={patientRole}>
                                <PatientDashboard />
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
            <Footer />
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

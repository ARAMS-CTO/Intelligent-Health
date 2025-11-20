
import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, LoginSignupForm, useAuth } from './components/Auth';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import CaseView from './pages/CaseView';
import PatientPortal from './pages/PatientPortal';
import PatientIntake from './pages/PatientIntake';
import PatientProfileView from './pages/PatientProfileView';
import { Role } from './types/index';
import { ICONS } from './constants/index';
import AIChatbot from './components/AIChatbot';
import { ToastContainer } from './components/Toast';
import UserProfileModal from './components/UserProfileModal';
import { ThemeProvider } from './components/Theme';
import AntigravityManager from './components/AntigravityManager';

// A modal component for the login form
const LoginModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="relative">
                <LoginSignupForm onLogin={onClose} />
                <button onClick={onClose} className="absolute top-0 right-0 mt-4 mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

// Define role groups for route protection
const nonPatientRoles = Object.values(Role).filter(r => r !== Role.Patient);
const patientRole = [Role.Patient];

// A component to protect routes based on user authentication and role.
const ProtectedRoute: React.FC<{ children: React.ReactElement; allowedRoles: Role[] }> = ({ children, allowedRoles }) => {
    const { user } = useAuth();

    if (!user) {
        // If user is not logged in, redirect to the landing page.
        return <Navigate to="/" />;
    }
    
    if (!allowedRoles.includes(user.role)) {
        // If user's role is not allowed, redirect to their default home page,
        // which will then redirect them to the correct dashboard/portal.
        return <Navigate to="/" />;
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
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch(err => {
                        console.log('ServiceWorker registration failed: ', err);
                    });
            });
        }
    }, []);

    const getHomeRoute = () => {
        if (!user) return <LandingPage onGetStarted={() => setLoginModalOpen(true)} />;
        if (user.role === Role.Patient) return <Navigate to="/portal" />;
        return <Navigate to="/dashboard" />;
    };
    
    const showFab = location.pathname !== '/';

    return (
        <div className="flex flex-col min-h-screen">
            <Header onLoginClick={() => setLoginModalOpen(true)} onProfileClick={() => setProfileModalOpen(true)} />
            <ToastContainer />
            <AntigravityManager />
            <main className="flex-grow">
                <Routes>
                    <Route path="/" element={getHomeRoute()} />
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
                            <ProtectedRoute allowedRoles={nonPatientRoles}>
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
                        path="/portal" 
                        element={
                            <ProtectedRoute allowedRoles={patientRole}>
                                <PatientPortal />
                            </ProtectedRoute>
                        } 
                    />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} />
            <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setProfileModalOpen(false)} user={user} />
            
            {showFab && (
              <button
                onClick={() => setChatbotOpen(true)}
                className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-hover transition transform hover:scale-110 z-40 animate-fade-in"
                aria-label="Open AI health assistant"
              >
                {ICONS.voiceChat}
              </button>
            )}
            <AIChatbot isOpen={isChatbotOpen} onClose={() => setChatbotOpen(false)} />
        </div>
    );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <HashRouter>
            <Suspense fallback={<div className="w-full h-screen flex items-center justify-center text-text-main bg-background">Loading...</div>}>
              <AppLayout />
            </Suspense>
        </HashRouter>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;

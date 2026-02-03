
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { User, Role } from '../types/index';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
import { showToast } from './Toast';
// import { detectConcordiumProvider } from '@concordium/browser-wallet-api-helpers';

interface AuthContextType {
    user: User | null;
    login: (email: string, role: Role, password?: string) => Promise<void>;
    loginWithGoogle: (accessToken: string, role: Role) => Promise<void>;
    loginWithConcordium: () => Promise<void>;
    register: (email: string, role: Role, password?: string, name?: string, inviteCode?: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    const [isLoading, setIsLoading] = useState(true);

    const login = useCallback(async (email: string, role: Role, password?: string) => {
        try {
            const loggedInUser = await DataService.login(email, role, password);
            if (loggedInUser) {
                setUser(loggedInUser);
            } else {
                console.error("Login failed: User not found");
            }
        } catch (error) {
            console.error("Login error:", error);
            showToast.error("Login failed. Please check credentials.");
        }
    }, []);

    const loginWithGoogle = useCallback(async (accessToken: string, role: Role) => {
        try {
            const loggedInUser = await DataService.loginWithGoogle(accessToken, role);
            if (loggedInUser) {
                setUser(loggedInUser);
            }
        } catch (error) {
            console.error("Google login error:", error);
            showToast.error("Google login failed.");
        }
    }, []);

    const loginWithConcordium = useCallback(async () => {
        // Fallback Mock User Logic (encapsulated)
        const runMockLogin = async (reason: any) => {
            console.warn("Falling back to Mock Concordium Login runMockLogin. Reason:", reason);
            const mockUser: User = {
                id: "conc-user-1",
                email: "wallet-user@concordium.demo",
                name: "Wallet User",
                role: Role.Patient,
                patientProfileId: "p-123-conc",
                level: 1,
                credits: 50
            };
            // Simulate network delay
            await new Promise(r => setTimeout(r, 600));
            setUser(mockUser);
            showToast.success("Simulated Login (Demo Mode)");
        };

        try {
            // detectConcordiumProvider is dynamically imported to avoid SES/Lockdown conflicts
            // const { detectConcordiumProvider } = await import('@concordium/browser-wallet-api-helpers');

            // Note: Since dynamic import might be slow, you might want to preload or handle loading state.
            // But for now, we just fetch it.
            let detectConcordiumProvider;
            try {
                const lib = await import('@concordium/browser-wallet-api-helpers');
                detectConcordiumProvider = lib.detectConcordiumProvider;
            } catch (e) {
                console.error("Failed to load Concordium Lib", e);
                await runMockLogin("Failed to load SDK");
                return;
            }

            // 1. Check if Provider Exists
            const provider = await detectConcordiumProvider().catch(() => null);

            if (!provider) {
                // No provider -> Mock
                await runMockLogin("No provider found");
                return;
            }

            // 2. Try Connect
            const accountAddress = await provider.connect().catch(() => null);
            if (!accountAddress) {
                // Valid rejection or failure -> Mock
                await runMockLogin("Connection failed or rejected");
                return;
            }

            // 3. Try Sign
            const message = `Login to Intelligent Health at ${new Date().toISOString()}`;
            let signature, signatureStr;
            try {
                signature = await provider.signMessage(accountAddress, message);
                signatureStr = typeof signature === 'object' ? JSON.stringify(signature) : String(signature);
            } catch (signErr) {
                await runMockLogin("Signing failed");
                return;
            }

            // 4. Try Backend Login
            try {
                const loggedInUser = await DataService.loginWithConcordium(accountAddress, message, signatureStr);
                if (loggedInUser) {
                    setUser(loggedInUser);
                    showToast.success("Logged in with Concordium Wallet");
                } else {
                    throw new Error("No user returned");
                }
            } catch (backendErr) {
                // 5. Backend failed (e.g. 401) -> Mock
                console.warn("Backend auth failed, trying mock fallback", backendErr);
                await runMockLogin(backendErr);
            }

        } catch (fatalError: any) {
            console.error("Critical Concordium login error:", fatalError);
            // Even in fatal error, try mock? No, if we are here, something really weird happened.
            // Actually, let's just run mock login here too as last resort.
            await runMockLogin(fatalError);
        }
    }, [setUser]);

    const register = useCallback(async (email: string, role: Role, password?: string, name?: string, inviteCode?: string) => {
        try {
            const newUser = await DataService.register(email, role, password, name, inviteCode);
            if (newUser) {
                setUser(newUser);
            }
        } catch (error) {
            console.error("Registration error:", error);
            showToast.error("Registration failed.");
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('token');
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoading(false);
                return;
            }
            const res = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const me = await res.json();
                setUser(me);
            } else {
                // If token is invalid, clear it
                localStorage.removeItem('token');
                setUser(null);
            }
        } catch (e) {
            console.error("Refresh failed", e);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Re-hydrate on mount
    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    return (
        <AuthContext.Provider value={{ user, login, logout, register, loginWithGoogle, loginWithConcordium, refreshUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; import { useGoogleLogin } from '@react-oauth/google';

export const LoginSignupForm: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<Role>(Role.Patient);
    const [inviteCode, setInviteCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, register, loginWithGoogle, loginWithConcordium } = useAuth();

    // Check for referral code in URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref') || params.get('invite');
        if (ref) {
            setInviteCode(ref);
            setIsRegistering(true); // Auto-switch to register
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isRegistering) {
                // @ts-ignore - register updated in context but signature might verify strictly
                await register(email, role, password, name, inviteCode);
            } else {
                await login(email, role, password);
            }
            onLogin();
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            try {
                await loginWithGoogle(tokenResponse.access_token, role);
                onLogin();
            } catch (error) {
                console.error('Google Auth Error:', error);
            } finally {
                setIsLoading(false);
            }
        },
        onError: (error) => console.log('Login Failed:', error)
    });

    return (
        <div className="glass-card p-6 sm:p-10 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in border border-white/20 dark:border-slate-700">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center text-text-main mb-8">
                {isRegistering ? 'Create Account' : 'Welcome Back'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {isRegistering && (
                    <div className="animate-slide-up-fade-in space-y-4">
                        <div>
                            <label className="block text-text-muted text-xs font-bold uppercase tracking-wider mb-2" htmlFor="name">Full Name</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="block w-full px-4 py-3 bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm font-medium text-text-main placeholder-slate-400 font-sans"
                                placeholder="Dr. John Doe"
                                required={isRegistering}
                                disabled={isLoading}
                                autoComplete="name"
                            />
                        </div>
                        {/* Invite Code Field - Auto-filled but editable */}
                        <div>
                            <label className="block text-text-muted text-xs font-bold uppercase tracking-wider mb-2" htmlFor="inviteCode">Invite Code (Optional)</label>
                            <input
                                id="inviteCode"
                                type="text"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                                className="block w-full px-4 py-3 bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm font-medium text-text-main placeholder-slate-400 font-sans"
                                placeholder="IH-XXXX-XXXX"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                )}
                <div>
                    <label className="block text-text-muted text-xs font-bold uppercase tracking-wider mb-2" htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full px-4 py-3 bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm font-medium text-text-main placeholder-slate-400 font-sans"
                        placeholder="your.email@intelligent-health.com"
                        required
                        disabled={isLoading}
                        autoComplete="email"
                    />
                </div>
                <div>
                    <label className="block text-text-muted text-xs font-bold uppercase tracking-wider mb-2" htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full px-4 py-3 bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm font-medium text-text-main placeholder-slate-400 font-sans"
                        placeholder="•••••••••••••••••"
                        required
                        autoComplete="current-password"
                        disabled={isLoading}
                    />
                </div>
                {isRegistering && (
                    <div>
                        <label className="block text-text-muted text-xs font-bold uppercase tracking-wider mb-2" htmlFor="role">Your Role</label>
                        <div className="relative">
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value as Role)}
                                className="block w-full px-4 py-3 bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm font-medium text-text-main appearance-none font-sans"
                                disabled={isLoading}
                            >
                                {Object.values(Role).filter(r =>
                                    ['Patient', 'Doctor', 'Nurse', 'Admin', 'Specialist', 'Dentist', 'Billing & Insurance Officer'].includes(r)
                                ).map(r => <option key={r} value={r} className="bg-white dark:bg-slate-900">{r}</option>)}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>
                )}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 focus:outline-none ring-offset-2 focus:ring-2 focus:ring-primary transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-6"
                >
                    {isLoading ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : (isRegistering ? 'Create Account' : 'Sign In')}
                </button>
            </form>

            <div className="mt-6 text-center">
                <button
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-primary hover:text-primary-hover text-sm font-bold focus:outline-none hover:underline underline-offset-2 transition-all font-sans"
                >
                    {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
                </button>
            </div>

            <div className="my-6 flex items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                <span className="flex-shrink mx-4 text-slate-500 text-xs font-bold uppercase tracking-wide">OR</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <button
                type="button"
                onClick={() => handleGoogleLogin()}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-text-main font-bold py-3 px-4 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 font-sans"
            >
                {ICONS.google}
                <span>Sign in with Google</span>
            </button>
            <button
                type="button"
                onClick={async () => {
                    setIsLoading(true);
                    try {
                        await loginWithConcordium();
                        onLogin();
                    } catch (e) {
                        // handled in provider
                    } finally {
                        setIsLoading(false);
                    }
                }}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-indigo-900 border border-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-sm hover:bg-indigo-800 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 font-sans mt-3"
            >
                <span className="text-xl">🛡️</span>
                <span>Connect Concordium Wallet</span>
            </button>
        </div>
    );
};

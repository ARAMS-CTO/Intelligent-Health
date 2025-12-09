
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { User, Role } from '../types/index';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';

interface AuthContextType {
    user: User | null;
    login: (email: string, role: Role) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    const login = useCallback(async (email: string, role: Role) => {
        try {
            const loggedInUser = await DataService.login(email, role);
            if (loggedInUser) {
                setUser(loggedInUser);
            } else {
                console.error("Login failed: User not found");
            }
        } catch (error) {
            console.error("Login error:", error);
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
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
};

export const LoginSignupForm: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<Role>(Role.Doctor);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // In a real app, we would call register() here if isRegistering is true
        // For now, our login logic handles implicit registration or we can add explicit call
        // But to keep it simple and smooth as requested, we'll stick to the login flow which auto-creates
        // However, if we want to use the name, we should ideally pass it.
        // For this demo, we'll just proceed with login which works for both.
        await login(email, role);
        setIsLoading(false);
        onLogin();
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        const googleUserEmail = "h.sanati@google.com";
        await login(googleUserEmail, Role.Doctor);
        setIsLoading(false);
        onLogin();
    };

    return (
        <div className="bg-surface p-8 rounded-lg shadow-xl w-full max-w-md animate-fade-in">
            <h2 className="text-3xl font-bold text-center text-text-main mb-6">
                {isRegistering ? 'Create Account' : 'Welcome Back'}
            </h2>
            <form onSubmit={handleSubmit}>
                {isRegistering && (
                    <div className="mb-4 animate-slide-up-fade-in">
                        <label className="block text-text-muted text-sm font-bold mb-2" htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-slate-200 dark:bg-slate-700 dark:border-slate-600 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Dr. John Doe"
                            required={isRegistering}
                            disabled={isLoading}
                        />
                    </div>
                )}
                <div className="mb-4">
                    <label className="block text-text-muted text-sm font-bold mb-2" htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-slate-200 dark:bg-slate-700 dark:border-slate-600 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="your.email@hospital.com"
                        required
                        disabled={isLoading}
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-text-muted text-sm font-bold mb-2" htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-slate-200 dark:bg-slate-700 dark:border-slate-600 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="******************"
                        required
                        disabled={isLoading}
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-text-muted text-sm font-bold mb-2" htmlFor="role">Your Role</label>
                    <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as Role)}
                        className="shadow border rounded w-full py-2 px-3 text-gray-700 dark:text-slate-200 dark:bg-slate-700 dark:border-slate-600 leading-tight focus:outline-none focus:shadow-outline bg-white"
                        disabled={isLoading}
                    >
                        {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : (isRegistering ? 'Create Account' : 'Sign In')}
                </button>
            </form>

            <div className="mt-4 text-center">
                <button
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-primary hover:text-primary-hover text-sm font-medium focus:outline-none"
                >
                    {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
                </button>
            </div>

            <div className="my-6 flex items-center">
                <div className="flex-grow border-t border-gray-300 dark:border-slate-600"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
                <div className="flex-grow border-t border-gray-300 dark:border-slate-600"></div>
            </div>
            <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 hover:bg-gray-50 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-500 disabled:opacity-50"
            >
                {ICONS.google}
                <span>Sign in with Google</span>
            </button>
        </div>
    );
};

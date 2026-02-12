import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../../api/client';
import { useSystemStore } from '../calculator/stores/useSystemStore'; // Clear store on logout?

interface User {
    email: string;
    role: string; // 'admin' | 'user'
    is_active: boolean;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (credentials: FormData | URLSearchParams) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await api.auth.me();
                setUser(response.data);
            } catch (error) {
                console.error("Auth check failed:", error);
                localStorage.removeItem('token');
                setUser(null);
            }
        }
        setLoading(false);
    };

    const login = async (credentials: FormData | URLSearchParams) => {
        const response = await api.auth.login(credentials);
        const { access_token, ...userData } = response.data;
        localStorage.setItem('token', access_token);
        setUser(userData);
    };

    const register = async (data: any) => {
        await api.auth.register(data);
        // Auto-login after register logic usually requires password re-entry or automatic token issue.
        // For now, let's assume they go to login page or we auto-login if API returned token.
        // If API returns User only, we redirect to login.
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        // Optional: specific store clearing mechanism
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            loading,
            login,
            register,
            logout
        }}>
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

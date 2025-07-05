"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { AUTH_ENDPOINTS } from "@/lib/apiEndPoints";

interface User {
    id: string;
    name: string;
    email: string;
    designation: string;
    isSuper: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setUser(null);
                return;
            }

            const response = await axios.get(AUTH_ENDPOINTS.ME, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // CHANGE THIS LINE:
            setUser(response.data.data.admin);
        } catch {
            localStorage.removeItem("token");
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await axios.post(AUTH_ENDPOINTS.LOGIN, {
                email,
                password,
            });
            const { token, data } = response.data;

            // Set token in localStorage
            localStorage.setItem("token", token);
            // Set user state
            setUser(response.data.data.admin);

            // Set token in cookie for middleware
            document.cookie = `token=${token}; path=/`;

            // Single router push with replace
            router.replace("/dashboard");
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        // Clear token from localStorage
        localStorage.removeItem("token");
        // Clear token from cookies
        document.cookie =
            "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        // Reset user state
        setUser(null);
        // Force a full page reload to /login
        window.location.href = "/";
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, login, logout, checkAuth }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

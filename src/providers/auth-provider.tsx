'use client';

import { createContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, provider } from '@/config/firebase';
import axiosInstance from '@/lib/axios-instance';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
    User
} from 'firebase/auth';

const storeAuthCookie = (token: string) => {
    const is_secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const secure_flag = is_secure ? '; Secure' : '';
    document.cookie = `auth=${token}; path=/; max-age=3600; SameSite=Strict${secure_flag}`;
};

const clearAuthCookie = () => {
    const is_secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const secure_flag = is_secure ? '; Secure' : '';
    document.cookie = `auth=; path=/; max-age=0; SameSite=Strict${secure_flag}`;
};

type AuthContextType = {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (displayName: string, email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<any>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const syncWithBackend = async (firebaseUser: User, endpoint: string) => {
        console.log("second step, syncing with backend : ", firebaseUser);
        const token = await firebaseUser.getIdToken();

        const metadata = {
            name: firebaseUser.displayName,
        };

        try {
            const response = await axiosInstance.post(`/auth/${endpoint}`, metadata, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            console.log(`Backend ${endpoint} success:`, response.data);
            return response.data;
        } catch (err) {
            console.error(`Backend ${endpoint} error:`, err);
            throw err;
        }
    };

    const loginWithGoogle = async () => {
        try {
            console.log('Starting Google sign-in process');
            const result = await signInWithPopup(auth, provider);
            console.log("Google sign-in successful:", result.user.email);

            const userData = {
                name: result.user.displayName,
            };

            const response = await axiosInstance.post('/auth/google', userData, {
                headers: {
                    Authorization: `Bearer ${await result.user.getIdToken()}`,
                }
            });

            const data = response.data;

            const token = await result.user.getIdToken();
            console.log("created token at loginWithGoogle")
            storeAuthCookie(token);

            console.log("Google auth backend response:", data);

            // Navigate based on whether this is a new user or not
            if (data.isNewUser) {
                router.push('/');
            } else {
                router.push('/');
            }

            return result;
        } catch (error) {
            console.error('Google login error:', error);
            throw error;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            console.log(" User details ", firebaseUser)
            if (firebaseUser) {
                // User is signed in, store token in cookie
                try {
                    const token = await firebaseUser.getIdToken();
                    console.log("created token at onAuthStateChanged")
                    storeAuthCookie(token);
                } catch (error) {
                    console.error("Error getting token:", error);
                }
            } else {
                console.log("User is signed out, clearing cookie");
                // User is signed out, clear cookie
                clearAuthCookie();
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const token = await userCredential.user.getIdToken(true);
            console.log("created token at login")
            storeAuthCookie(token);
            await syncWithBackend(userCredential.user, "login");
            router.push('/');
        } catch (error) {
            console.log("Login error:", error);
            throw error;
        }
    };

    const register = async (displayName: string, email: string, password: string) => {
        if (!/\S+@\S+\.\S+/.test(email)) {
            throw new Error("Invalid email format");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        console.log("first step done, user created: ", userCredential);

        await updateProfile(userCredential.user, { displayName });
        await userCredential.user.reload();
        const token = await userCredential.user.getIdToken(true);
        console.log("created token at register")
        storeAuthCookie(token);

        await syncWithBackend(userCredential.user, "register");

        router.push('/');
    };

    const logout = () => {
        console.log("Logging out user:", user?.email);
        try {
            console.log("Clearing auth cookie");
            clearAuthCookie();
            signOut(auth);
            console.log("User logged out successfully");
            router.push('/auth/login');
        }
        catch (err) {
            console.error("Logout failed:", err);
        }
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, login, register, loginWithGoogle, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;
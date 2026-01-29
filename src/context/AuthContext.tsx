"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { allEvents } from "@/data/events";

interface UserRegistration {
    eventId: string;
    eventName: string;
    teamNumber: number;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    userRegistrations: UserRegistration[];
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    isRegisteredForEvent: (eventId: string) => boolean;
    getRegisteredEventName: () => string | null;
    refreshRegistrations: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRegistrations, setUserRegistrations] = useState<UserRegistration[]>([]);

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
            if (user) {
                fetchUserRegistrations(user.email || "");
            } else {
                setUserRegistrations([]);
            }
        });

        return () => unsubscribe();
    }, []);

    // Fetch user registrations from all events
    const fetchUserRegistrations = async (email: string) => {
        if (!email) return;

        const registrations: UserRegistration[] = [];

        for (const event of allEvents) {
            try {
                const teamsRef = collection(db, "registrations", event.id, "teams");
                const q = query(teamsRef, where("email", "==", email));
                const snapshot = await getDocs(q);

                snapshot.forEach((doc) => {
                    const data = doc.data();
                    registrations.push({
                        eventId: event.id,
                        eventName: data.eventName || event.title,
                        teamNumber: data.teamNumber
                    });
                });
            } catch (error) {
                console.error(`Error fetching registrations for ${event.id}:`, error);
            }
        }

        setUserRegistrations(registrations);
    };

    const refreshRegistrations = async () => {
        if (user?.email) {
            await fetchUserRegistrations(user.email);
        }
    };

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Error signing in with Google:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUserRegistrations([]);
        } catch (error) {
            console.error("Error signing out:", error);
            throw error;
        }
    };

    const isRegisteredForEvent = (eventId: string): boolean => {
        return userRegistrations.some((reg) => reg.eventId === eventId);
    };

    const getRegisteredEventName = (): string | null => {
        if (userRegistrations.length > 0) {
            return userRegistrations[0].eventName;
        }
        return null;
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                userRegistrations,
                signInWithGoogle,
                logout,
                isRegisteredForEvent,
                getRegisteredEventName,
                refreshRegistrations
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

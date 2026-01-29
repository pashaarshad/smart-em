"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, loading, signInWithGoogle, logout, getRegisteredEventName } = useAuth();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Events", href: "/#events" },
        { name: "Schedule", href: "/#schedule" },
        { name: "About", href: "/#about" },
    ];

    const registeredEvent = getRegisteredEventName();

    const handleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? "bg-[#0a0a0c]/95 backdrop-blur-xl border-b border-white/[0.04]"
                : "bg-transparent"
                }`}
        >
            <nav className="container-main">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="flex items-baseline gap-1">
                            <span className="text-white font-semibold text-lg">SHRESHTA</span>
                            <span className="text-[#d4a843] text-sm font-medium">&apos;26</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-[15px] text-zinc-400 hover:text-white transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Desktop Right Section */}
                    <div className="hidden lg:flex items-center gap-4">
                        {loading ? (
                            <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
                        ) : user ? (
                            <div className="flex items-center gap-3">
                                {/* User Info */}
                                <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
                                    {user.photoURL ? (
                                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={user.photoURL}
                                                alt={user.displayName || "User"}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-[#d4a843] flex items-center justify-center text-sm font-bold text-black">
                                            {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                                        </div>
                                    )}
                                    <span className="text-sm text-zinc-300 font-medium whitespace-nowrap">
                                        {user.displayName || user.email?.split("@")[0]}
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="ml-1 p-1.5 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                                        title="Logout"
                                    >
                                        <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Show registered event or register button */}
                                {registeredEvent ? (
                                    <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-semibold whitespace-nowrap">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Registered
                                    </div>
                                ) : (
                                    <Link href="/#events" className="btn btn-primary">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Register Now
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3" >
                                <button
                                    onClick={handleLogin}
                                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white transition-all text-sm font-semibold whitespace-nowrap"
                                >
                                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Login
                                </button>

                                <Link href="/#events" className="btn btn-primary">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Register Now
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="lg:hidden p-2 text-zinc-400 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isMobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden border-t border-white/[0.04] py-4 animate-fade-in">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="block py-3 text-zinc-400 hover:text-white transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {/* Mobile User Section */}
                        {user ? (
                            <div className="mt-4 pt-4 border-t border-white/[0.04]">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-[#d4a843] flex items-center justify-center text-sm font-bold text-black">
                                        {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">
                                            {user.displayName || user.email?.split("@")[0]}
                                        </p>
                                        <p className="text-zinc-500 text-xs">{user.email}</p>
                                    </div>
                                </div>
                                {registeredEvent ? (
                                    <div className="flex items-center justify-center gap-2 w-full py-3.5 px-5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-semibold mb-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Registered for {registeredEvent}
                                    </div>
                                ) : (
                                    <Link
                                        href="/#events"
                                        className="btn btn-primary w-full mb-3"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Register Now
                                    </Link>
                                )}
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-zinc-400 text-sm font-medium hover:bg-white/10 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="mt-4 pt-4 border-t border-white/[0.04] space-y-3">
                                <button
                                    onClick={() => {
                                        handleLogin();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-white text-black font-medium"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Login with Google
                                </button>
                                <Link
                                    href="/#events"
                                    className="btn btn-primary w-full"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Register Now
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </nav>
        </header>
    );
}

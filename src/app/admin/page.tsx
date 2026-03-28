"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Coordinator credentials mapped to event IDs
const COORDINATOR_ACCOUNTS: Record<string, { username: string; password: string; eventName: string; coordinator: string }> = {
    "dhurandharah": { username: "priya_dh", password: "dh2026", eventName: "DHURANDHARAH", coordinator: "Priya M R" },
    "samanvaya": { username: "ranjitha_sm", password: "sm2026", eventName: "SAMANVAYA", coordinator: "Ranjitha N" },
    "arthasangram": { username: "prajwal_as", password: "as2026", eventName: "ARTHASANGRAM", coordinator: "Prajwal S" },
    "vikraya": { username: "adheena_vk", password: "vk2026", eventName: "VIKRAYA", coordinator: "Adheena Jojo" },
    "logic-overload": { username: "arshad_lo", password: "lo2026", eventName: "LOGIC OVERLOAD", coordinator: "Arshad Pasha" },
    "pratyaya": { username: "kruthika_pr", password: "pr2026", eventName: "PRATYAYA", coordinator: "Kruthika B" },
    "nidhi-anveshanam": { username: "sinchana_na", password: "na2026", eventName: "NIDHI ANVESHANAM", coordinator: "T L Sinchana" },
    "e-sports": { username: "hari_es", password: "es2026", eventName: "E-SPORTS", coordinator: "Hari Kiran" },
    "lasyagathi": { username: "poornima_lg", password: "lg2026", eventName: "LASYAGATHI", coordinator: "Poornima M" },
    "lasya-tandava": { username: "aishwarya_lt", password: "lt2026", eventName: "LASYA TANDAVA", coordinator: "Aishwarya" },
    "swara-madurya": { username: "poorvi_sw", password: "sw2026", eventName: "SWARA MADURYA", coordinator: "Poorvi H" },
    "drushyavahini": { username: "kowshik_dv", password: "dv2026", eventName: "DRUSHYAVAHINI", coordinator: "Kowshik" },
    "dandashataka": { username: "puneeth_dk", password: "dk2026", eventName: "DANDASHATAKA", coordinator: "Puneeth S" },
};

const CATEGORIES = [
    {
        key: "management",
        label: "Management",
        icon: "📊",
        color: "#3b82f6",
        colorFaded: "rgba(59,130,246,0.12)",
        borderColor: "rgba(59,130,246,0.35)",
        events: ["dhurandharah", "samanvaya", "arthasangram", "vikraya"],
    },
    {
        key: "it",
        label: "IT & Tech",
        icon: "💻",
        color: "#10b981",
        colorFaded: "rgba(16,185,129,0.12)",
        borderColor: "rgba(16,185,129,0.35)",
        events: ["logic-overload", "pratyaya", "nidhi-anveshanam", "e-sports"],
    },
    {
        key: "cultural",
        label: "Cultural",
        icon: "🎭",
        color: "#a855f7",
        colorFaded: "rgba(168,85,247,0.12)",
        borderColor: "rgba(168,85,247,0.35)",
        events: ["lasyagathi", "lasya-tandava", "swara-madurya", "drushyavahini"],
    },
    {
        key: "sports",
        label: "Sports",
        icon: "🏏",
        color: "#f97316",
        colorFaded: "rgba(249,115,22,0.12)",
        borderColor: "rgba(249,115,22,0.35)",
        events: ["dandashataka"],
    },
];

export default function AdminLoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [activeQuickLogin, setActiveQuickLogin] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const isLoggedIn = sessionStorage.getItem("adminLoggedIn");
        if (isLoggedIn === "true") {
            router.push("/admin/dashboard");
        }
    }, [router]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const uname = username.trim().toLowerCase();
        const pwd = password.trim().toLowerCase();

        setTimeout(() => {
            // Admin
            if (uname === "admin" && pwd === "admin") {
                sessionStorage.setItem("adminLoggedIn", "true");
                sessionStorage.setItem("adminRole", "admin");
                sessionStorage.removeItem("adminEventId");
                sessionStorage.removeItem("adminEventName");
                router.push("/admin/dashboard");
                setLoading(false);
                return;
            }

            // Legacy admin
            if (uname === "sdc26" && pwd === "sdc123") {
                sessionStorage.setItem("adminLoggedIn", "true");
                sessionStorage.setItem("adminRole", "admin");
                sessionStorage.removeItem("adminEventId");
                sessionStorage.removeItem("adminEventName");
                router.push("/admin/dashboard");
                setLoading(false);
                return;
            }

            // Coordinator
            for (const [eventId, creds] of Object.entries(COORDINATOR_ACCOUNTS)) {
                if (uname === creds.username && pwd === creds.password) {
                    sessionStorage.setItem("adminLoggedIn", "true");
                    sessionStorage.setItem("adminRole", "coordinator");
                    sessionStorage.setItem("adminEventId", eventId);
                    sessionStorage.setItem("adminEventName", creds.eventName);
                    router.push("/admin/dashboard");
                    setLoading(false);
                    return;
                }
            }

            setError("Invalid username or password");
            setLoading(false);
        }, 500);
    };

    const handleQuickLogin = (eventId: string) => {
        const creds = COORDINATOR_ACCOUNTS[eventId];
        if (creds) {
            setUsername(creds.username);
            setPassword(creds.password);
            setActiveQuickLogin(eventId);
            setError("");
        }
    };

    return (
        <>
            <style jsx>{`
                .page-bg {
                    min-height: 100vh;
                    background: #08080c;
                    background-image:
                        radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,168,67,0.08) 0%, transparent 70%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                }

                .main-grid {
                    display: grid;
                    grid-template-columns: 400px 1fr;
                    gap: 28px;
                    max-width: 1060px;
                    width: 100%;
                    align-items: start;
                }

                /* ─── Left: Login Card ─── */
                .login-card {
                    background: linear-gradient(170deg, rgba(26,26,32,0.95) 0%, rgba(18,18,22,0.98) 100%);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 20px;
                    padding: 44px 36px 36px;
                    position: relative;
                    overflow: hidden;
                }

                .login-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 120px;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #d4a843, transparent);
                }

                .card-icon {
                    width: 64px;
                    height: 64px;
                    margin: 0 auto 20px;
                    background: linear-gradient(135deg, rgba(212,168,67,0.15) 0%, rgba(212,168,67,0.04) 100%);
                    border: 1px solid rgba(212,168,67,0.2);
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .card-title {
                    text-align: center;
                    font-size: 24px;
                    font-weight: 800;
                    color: #ffffff;
                    margin: 0 0 4px;
                    letter-spacing: -0.3px;
                }

                .card-subtitle {
                    text-align: center;
                    font-size: 13px;
                    color: #52525b;
                    margin: 0 0 32px;
                }

                .input-group {
                    margin-bottom: 18px;
                }

                .input-label {
                    display: block;
                    font-size: 11.5px;
                    font-weight: 700;
                    color: #71717a;
                    margin-bottom: 7px;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                }

                .input-field {
                    width: 100%;
                    padding: 13px 16px;
                    background: rgba(255,255,255,0.025);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 12px;
                    font-size: 15px;
                    color: #e4e4e7;
                    outline: none;
                    transition: all 0.2s ease;
                    font-family: inherit;
                }

                .input-field:focus {
                    border-color: rgba(212,168,67,0.45);
                    background: rgba(255,255,255,0.04);
                    box-shadow: 0 0 0 3px rgba(212,168,67,0.08);
                }

                .input-field::placeholder {
                    color: #3f3f46;
                }

                .coord-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 5px 12px;
                    background: rgba(59,130,246,0.1);
                    border: 1px solid rgba(59,130,246,0.2);
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #60a5fa;
                    margin-bottom: 18px;
                    animation: fadeSlide 0.3s ease;
                }

                @keyframes fadeSlide {
                    from { opacity: 0; transform: translateY(-6px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .error-box {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 11px 14px;
                    margin-bottom: 18px;
                    background: rgba(239,68,68,0.08);
                    border: 1px solid rgba(239,68,68,0.2);
                    border-radius: 10px;
                    color: #fca5a5;
                    font-size: 13px;
                    font-weight: 500;
                }

                .sign-in-btn {
                    width: 100%;
                    padding: 14px;
                    background: linear-gradient(135deg, #d4a843 0%, #b8922e 100%);
                    border: none;
                    border-radius: 12px;
                    font-size: 15px;
                    font-weight: 700;
                    color: #000;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.25s ease;
                    margin-top: 6px;
                    font-family: inherit;
                }

                .sign-in-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 8px 28px rgba(212,168,67,0.35);
                }

                .sign-in-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .divider-line {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    margin: 22px 0;
                }

                .divider-line span {
                    font-size: 11px;
                    color: #3f3f46;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    white-space: nowrap;
                }

                .divider-line::before, .divider-line::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: rgba(255,255,255,0.05);
                }

                .admin-fill-btn {
                    width: 100%;
                    padding: 12px;
                    background: transparent;
                    border: 1px solid rgba(212,168,67,0.18);
                    border-radius: 12px;
                    color: #d4a843;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-family: inherit;
                }

                .admin-fill-btn:hover {
                    background: rgba(212,168,67,0.06);
                    border-color: rgba(212,168,67,0.35);
                }

                .back-link {
                    display: block;
                    text-align: center;
                    margin-top: 20px;
                    font-size: 13px;
                    color: #52525b;
                    text-decoration: none;
                    transition: color 0.2s;
                }

                .back-link:hover {
                    color: #d4a843;
                }

                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 2.5px solid rgba(0,0,0,0.15);
                    border-top-color: #000;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* ─── Right: Quick Login Panel ─── */
                .quick-panel {
                    background: linear-gradient(170deg, rgba(20,20,26,0.6) 0%, rgba(14,14,18,0.8) 100%);
                    border: 1px solid rgba(255,255,255,0.04);
                    border-radius: 20px;
                    padding: 28px;
                    max-height: 82vh;
                    overflow-y: auto;
                }

                .quick-panel::-webkit-scrollbar {
                    width: 4px;
                }
                .quick-panel::-webkit-scrollbar-thumb {
                    background: rgba(212,168,67,0.2);
                    border-radius: 2px;
                }

                .panel-heading {
                    font-size: 16px;
                    font-weight: 700;
                    color: #e4e4e7;
                    margin: 0 0 4px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .panel-desc {
                    font-size: 12px;
                    color: #3f3f46;
                    margin: 0 0 24px;
                }

                .cat-section {
                    margin-bottom: 22px;
                }

                .cat-section:last-child {
                    margin-bottom: 0;
                }

                .cat-label {
                    font-size: 10.5px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                    margin-bottom: 10px;
                    padding-left: 2px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .event-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }

                .ev-btn {
                    position: relative;
                    padding: 14px 16px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                    overflow: hidden;
                }

                .ev-btn::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 12px;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    pointer-events: none;
                }

                .ev-btn:hover {
                    transform: translateY(-1px);
                }

                .ev-btn .ev-name {
                    display: block;
                    font-size: 12.5px;
                    font-weight: 700;
                    margin-bottom: 3px;
                    letter-spacing: 0.2px;
                }

                .ev-btn .ev-coord {
                    display: block;
                    font-size: 11px;
                    opacity: 0.5;
                    font-weight: 400;
                }

                .ev-btn .ev-check {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    animation: pop 0.3s ease;
                }

                @keyframes pop {
                    0% { transform: scale(0); }
                    60% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }

                @media (max-width: 860px) {
                    .main-grid {
                        grid-template-columns: 1fr;
                        max-width: 480px;
                    }
                    .quick-panel {
                        max-height: none;
                    }
                }
            `}</style>

            <div className="page-bg">
                <div className="main-grid">
                    {/* ─── Login Card ─── */}
                    <div className="login-card">
                        <div className="card-icon">
                            <svg width="28" height="28" fill="none" stroke="#d4a843" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="card-title">Admin Login</h1>
                        <p className="card-subtitle">SHRESHTA 2026 Dashboard</p>

                        {activeQuickLogin && (
                            <div className="coord-tag">
                                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {COORDINATOR_ACCOUNTS[activeQuickLogin]?.eventName} — {COORDINATOR_ACCOUNTS[activeQuickLogin]?.coordinator}
                            </div>
                        )}

                        {error && (
                            <div className="error-box">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin}>
                            <div className="input-group">
                                <label className="input-label">Username</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={username}
                                    onChange={(e) => { setUsername(e.target.value); setActiveQuickLogin(null); }}
                                    placeholder="Enter username"
                                    required
                                    suppressHydrationWarning
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setActiveQuickLogin(null); }}
                                    placeholder="Enter password"
                                    required
                                    suppressHydrationWarning
                                />
                            </div>

                            <button type="submit" className="sign-in-btn" disabled={loading} suppressHydrationWarning>
                                {loading ? (
                                    <div className="spinner" />
                                ) : (
                                    <>
                                        Sign In
                                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="divider-line">
                            <span>or</span>
                        </div>

                        <button
                            type="button"
                            className="admin-fill-btn"
                            onClick={() => { setUsername("admin"); setPassword("admin"); setActiveQuickLogin(null); setError(""); }}
                        >
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            Admin Full Access
                        </button>

                        <a href="/" className="back-link">← Back to Home</a>
                    </div>

                    {/* ─── Quick Login Panel ─── */}
                    <div className="quick-panel">
                        <h2 className="panel-heading">
                            <span style={{ fontSize: "18px" }}>⚡</span>
                            Quick Coordinator Login
                        </h2>
                        <p className="panel-desc">Select your event to auto-fill credentials, then Sign In</p>

                        {CATEGORIES.map(cat => (
                            <div key={cat.key} className="cat-section">
                                <div className="cat-label" style={{ color: cat.color }}>
                                    <span>{cat.icon}</span> {cat.label}
                                </div>
                                <div className="event-grid">
                                    {cat.events.map(eventId => {
                                        const creds = COORDINATOR_ACCOUNTS[eventId];
                                        const isActive = activeQuickLogin === eventId;
                                        return (
                                            <button
                                                key={eventId}
                                                className="ev-btn"
                                                onClick={() => handleQuickLogin(eventId)}
                                                style={{
                                                    background: isActive
                                                        ? cat.colorFaded
                                                        : "rgba(255,255,255,0.015)",
                                                    border: `1px solid ${isActive ? cat.borderColor : "rgba(255,255,255,0.05)"}`,
                                                    color: isActive ? cat.color : "#a1a1aa",
                                                    boxShadow: isActive
                                                        ? `0 4px 20px ${cat.colorFaded}, inset 0 1px 0 ${cat.borderColor}`
                                                        : "none",
                                                }}
                                            >
                                                <span className="ev-name" style={{ color: isActive ? "#fff" : "#d4d4d8" }}>
                                                    {creds.eventName}
                                                </span>
                                                <span className="ev-coord">{creds.coordinator}</span>
                                                {isActive && (
                                                    <span
                                                        className="ev-check"
                                                        style={{ background: cat.color, color: "#000" }}
                                                    >
                                                        ✓
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

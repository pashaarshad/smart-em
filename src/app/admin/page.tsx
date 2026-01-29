"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Check if already logged in
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

        // Simple authentication check
        const validUsername = username.toLowerCase() === "sdc26";
        const validPassword = password.toLowerCase() === "sdc123";

        setTimeout(() => {
            if (validUsername && validPassword) {
                sessionStorage.setItem("adminLoggedIn", "true");
                router.push("/admin/dashboard");
            } else {
                setError("Invalid username or password");
            }
            setLoading(false);
        }, 500);
    };

    return (
        <>
            <style jsx>{`
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #0a0a0c 0%, #141418 100%);
                    padding: 20px;
                }

                .login-box {
                    width: 100%;
                    max-width: 420px;
                    background: linear-gradient(180deg, #1a1a1f 0%, #141418 100%);
                    border: 1px solid rgba(212, 168, 67, 0.2);
                    border-radius: 24px;
                    padding: 48px 40px;
                    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 40px;
                }

                .login-icon {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 24px;
                    background: linear-gradient(135deg, rgba(212, 168, 67, 0.2) 0%, rgba(212, 168, 67, 0.05) 100%);
                    border: 1px solid rgba(212, 168, 67, 0.3);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .login-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: #fff;
                    margin: 0 0 8px 0;
                }

                .login-subtitle {
                    font-size: 14px;
                    color: #71717a;
                    margin: 0;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: #a1a1aa;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .form-input {
                    width: 100%;
                    padding: 16px 18px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 14px;
                    font-size: 16px;
                    color: #fff;
                    outline: none;
                    transition: all 0.2s ease;
                }

                .form-input:focus {
                    border-color: rgba(212, 168, 67, 0.5);
                    background: rgba(255, 255, 255, 0.05);
                    box-shadow: 0 0 0 3px rgba(212, 168, 67, 0.1);
                }

                .form-input::placeholder {
                    color: #52525b;
                }

                .error-box {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 14px 16px;
                    margin-bottom: 20px;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 12px;
                    color: #fca5a5;
                    font-size: 14px;
                }

                .login-btn {
                    width: 100%;
                    padding: 18px 24px;
                    background: linear-gradient(135deg, #d4a843 0%, #b8922e 100%);
                    border: none;
                    border-radius: 14px;
                    font-size: 17px;
                    font-weight: 700;
                    color: #000;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.3s ease;
                    margin-top: 10px;
                }

                .login-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 35px rgba(212, 168, 67, 0.4);
                }

                .login-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .spinner {
                    width: 22px;
                    height: 22px;
                    border: 3px solid rgba(0, 0, 0, 0.2);
                    border-top-color: #000;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .back-link {
                    display: block;
                    text-align: center;
                    margin-top: 24px;
                    font-size: 14px;
                    color: #71717a;
                    text-decoration: none;
                    transition: color 0.2s;
                }

                .back-link:hover {
                    color: #d4a843;
                }
            `}</style>

            <div className="login-container">
                <div className="login-box">
                    <div className="login-header">
                        <div className="login-icon">
                            <svg width="40" height="40" fill="none" stroke="#d4a843" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="login-title">Admin Login</h1>
                        <p className="login-subtitle">SHRESHTA 2026 Dashboard</p>
                    </div>

                    {error && (
                        <div className="error-box">
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input
                                type="text"
                                className="form-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                required
                            />
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? (
                                <div className="spinner" />
                            ) : (
                                <>
                                    Sign In
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    <a href="/" className="back-link">← Back to Home</a>
                </div>
            </div>
        </>
    );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { allEvents } from "@/data/events";
import { Registration } from "@/types/admin";
import Link from "next/link";

export default function CheckInPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [search, setSearch] = useState("");
    const [checkingIn, setCheckingIn] = useState<string | null>(null);
    const [lastCheckedIn, setLastCheckedIn] = useState<Registration | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isCoordinator, setIsCoordinator] = useState(false);
    const [coordEventId, setCoordEventId] = useState<string | null>(null);
    const [coordEventName, setCoordEventName] = useState<string | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const [showUncheckedIn, setShowUncheckedIn] = useState(false);
    const [sendingEmail, setSendingEmail] = useState<string | null>(null);

    // Auth
    useEffect(() => {
        const isLoggedIn = sessionStorage.getItem("adminLoggedIn");
        if (isLoggedIn !== "true") {
            router.push("/admin");
        } else {
            setIsAuthenticated(true);
            const role = sessionStorage.getItem("adminRole");
            const eventId = sessionStorage.getItem("adminEventId");
            const eventName = sessionStorage.getItem("adminEventName");
            if (role === "coordinator" && eventId) {
                setIsCoordinator(true);
                setCoordEventId(eventId);
                setCoordEventName(eventName);
            }
        }
    }, [router]);

    // Real-time data
    useEffect(() => {
        if (!isAuthenticated) return;
        const unsubscribes: (() => void)[] = [];
        const eventRegsMap: Record<string, Registration[]> = {};

        const eventsToFetch = isCoordinator && coordEventId
            ? allEvents.filter(e => e.id === coordEventId)
            : allEvents;

        for (const event of eventsToFetch) {
            const teamsRef = collection(db, "registrations", event.id, "teams");
            const unsub = onSnapshot(teamsRef, (snapshot) => {
                const regs: Registration[] = [];
                snapshot.forEach((docSnap) => {
                    regs.push({ id: docSnap.id, eventId: event.id, ...docSnap.data() } as Registration);
                });
                eventRegsMap[event.id] = regs;
                const allRegs: Registration[] = [];
                for (const ev of eventsToFetch) {
                    allRegs.push(...(eventRegsMap[ev.id] || []));
                }
                setRegistrations(allRegs);
            });
            unsubscribes.push(unsub);
        }

        return () => unsubscribes.forEach(u => u());
    }, [isAuthenticated, isCoordinator, coordEventId]);

    // Focus search on load
    useEffect(() => {
        if (isAuthenticated) searchRef.current?.focus();
    }, [isAuthenticated]);

    // Search filter
    const filtered = registrations.filter(r => {
        if (showUncheckedIn && r.checkedIn) return false;

        if (search.length < 2) {
            return showUncheckedIn ? true : false;
        }

        const q = search.toLowerCase();
        const memberMatch = r.members?.some(m =>
            m.name.toLowerCase().includes(q) || m.phone.includes(q)
        );
        return (
            memberMatch ||
            r.email?.toLowerCase().includes(q) ||
            r.collegeName?.toLowerCase().includes(q) ||
            r.eventName?.toLowerCase().includes(q) ||
            String(r.teamNumber).includes(q)
        );
    });

    // Sort: not checked in first, then by name
    const sorted = [...filtered].sort((a, b) => {
        if (a.checkedIn && !b.checkedIn) return 1;
        if (!a.checkedIn && b.checkedIn) return -1;
        return (a.members?.[0]?.name || "").localeCompare(b.members?.[0]?.name || "");
    });

    const totalCheckedIn = registrations.filter(r => r.checkedIn).length;
    const totalRegs = registrations.length;

    const handleCheckIn = async (reg: Registration) => {
        setCheckingIn(reg.id);
        try {
            const docRef = doc(db, "registrations", reg.eventId, "teams", reg.id);
            await updateDoc(docRef, {
                checkedIn: true,
                checkedInAt: Timestamp.now(),
            });
            setLastCheckedIn(reg);
            setShowSuccess(true);
            setSearch("");
            setTimeout(() => {
                setShowSuccess(false);
                searchRef.current?.focus();
            }, 2500);
        } catch (err) {
            console.error("Check-in failed:", err);
            alert("Check-in failed. Please try again.");
        } finally {
            setCheckingIn(null);
        }
    };

    const handleUndoCheckIn = async (reg: Registration) => {
        try {
            const docRef = doc(db, "registrations", reg.eventId, "teams", reg.id);
            await updateDoc(docRef, {
                checkedIn: false,
                checkedInAt: null,
            });
        } catch (err) {
            console.error("Undo failed:", err);
        }
    };

    const handleSendReminder = async (reg: Registration) => {
        setSendingEmail(reg.id);
        try {
            const res = await fetch("/api/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "reminder",
                    to: reg.email,
                    subject: `Urgent Reminder: SHRESHTA 2026 - ${reg.eventName || 'Event'}`,
                    participantName: reg.members?.[0]?.name || "Participant",
                    eventName: reg.eventName || 'Event'
                }),
            });
            if (!res.ok) throw new Error("Failed to send");
            alert("Auto-reminder sent successfully to " + reg.email);
        } catch (err: any) {
            console.error(err);
            alert("Failed to send reminder email. Please ensure Resend API is active.");
        } finally {
            setSendingEmail(null);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <>
            <style jsx>{`
                .checkin-page {
                    min-height: 100vh;
                    background: #08080c;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                }

                .checkin-header {
                    background: linear-gradient(180deg, rgba(20,20,28,0.95) 0%, rgba(8,8,12,0.95) 100%);
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                    padding: 16px 24px;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    backdrop-filter: blur(12px);
                }

                .header-row {
                    max-width: 700px;
                    margin: 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .header-left h1 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 800;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .header-left p {
                    margin: 2px 0 0;
                    font-size: 12px;
                    color: #52525b;
                }

                .back-btn {
                    padding: 8px 16px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 10px;
                    color: #a1a1aa;
                    font-size: 13px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.2s;
                }

                .back-btn:hover {
                    background: rgba(255,255,255,0.08);
                    color: #fff;
                }

                .checkin-body {
                    max-width: 700px;
                    margin: 0 auto;
                    padding: 24px 20px 80px;
                }

                /* Live Counter */
                .live-counter {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .counter-card {
                    flex: 1;
                    padding: 16px;
                    border-radius: 14px;
                    text-align: center;
                }

                .counter-num {
                    font-size: 32px;
                    font-weight: 800;
                    margin: 0;
                    line-height: 1;
                }

                .counter-label {
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    margin: 6px 0 0;
                }

                /* Search */
                .search-box {
                    position: relative;
                    margin-bottom: 20px;
                }

                .search-icon {
                    position: absolute;
                    left: 18px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #52525b;
                    pointer-events: none;
                }

                .search-input {
                    width: 100%;
                    padding: 18px 18px 18px 52px;
                    background: rgba(255,255,255,0.03);
                    border: 2px solid rgba(212,168,67,0.2);
                    border-radius: 16px;
                    font-size: 17px;
                    color: #fff;
                    outline: none;
                    transition: all 0.2s;
                    font-family: inherit;
                }

                .search-input:focus {
                    border-color: rgba(212,168,67,0.5);
                    background: rgba(255,255,255,0.05);
                    box-shadow: 0 0 0 4px rgba(212,168,67,0.08);
                }

                .search-input::placeholder {
                    color: #3f3f46;
                }

                .search-hint {
                    text-align: center;
                    color: #3f3f46;
                    font-size: 13px;
                    margin-top: 12px;
                }

                /* Results */
                .results-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .result-card {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 16px;
                    padding: 18px 20px;
                    transition: all 0.2s;
                }

                .result-card:hover {
                    background: rgba(255,255,255,0.04);
                }

                .result-card.checked {
                    opacity: 0.55;
                    border-color: rgba(16,185,129,0.2);
                }

                .result-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 10px;
                }

                .result-name {
                    font-size: 17px;
                    font-weight: 700;
                    color: #fff;
                    margin: 0 0 2px;
                }

                .result-college {
                    font-size: 13px;
                    color: #71717a;
                    margin: 0;
                }

                .result-badge {
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                    white-space: nowrap;
                }

                .result-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 14px;
                    margin-bottom: 12px;
                    font-size: 12.5px;
                    color: #71717a;
                }

                .result-meta span {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .members-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-bottom: 14px;
                }

                .member-chip {
                    padding: 4px 10px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 6px;
                    font-size: 12px;
                    color: #a1a1aa;
                }

                .checkin-btn {
                    width: 100%;
                    padding: 14px;
                    border: none;
                    border-radius: 12px;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.25s;
                    font-family: inherit;
                }

                .checkin-btn.primary {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: #fff;
                }

                .checkin-btn.primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 8px 24px rgba(16,185,129,0.3);
                }

                .checkin-btn.warning {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: #000;
                }

                .checkin-btn.warning:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 8px 24px rgba(245,158,11,0.3);
                }

                .checkin-btn.done {
                    background: rgba(16,185,129,0.08);
                    border: 1px solid rgba(16,185,129,0.2);
                    color: #34d399;
                    cursor: default;
                }

                .undo-btn {
                    margin-top: 6px;
                    width: 100%;
                    padding: 8px;
                    background: transparent;
                    border: 1px solid rgba(239,68,68,0.2);
                    border-radius: 8px;
                    color: #f87171;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: inherit;
                }

                .undo-btn:hover {
                    background: rgba(239,68,68,0.08);
                }

                /* Success overlay */
                .success-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    background: rgba(0,0,0,0.8);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.2s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .success-card {
                    text-align: center;
                    padding: 48px 40px;
                    animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                @keyframes popIn {
                    from { transform: scale(0.7); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                .success-check {
                    width: 100px;
                    height: 100px;
                    margin: 0 auto 24px;
                    background: linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 100%);
                    border: 3px solid #10b981;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 48px;
                    animation: checkBounce 0.6s 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both;
                }

                @keyframes checkBounce {
                    from { transform: scale(0); }
                    to { transform: scale(1); }
                }

                .success-title {
                    font-size: 28px;
                    font-weight: 800;
                    color: #34d399;
                    margin: 0 0 8px;
                }

                .success-name {
                    font-size: 20px;
                    font-weight: 700;
                    color: #fff;
                    margin: 0 0 4px;
                }

                .success-detail {
                    font-size: 14px;
                    color: #71717a;
                    margin: 0;
                }

                .spinner-sm {
                    width: 18px;
                    height: 18px;
                    border: 2.5px solid rgba(255,255,255,0.2);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .no-results {
                    text-align: center;
                    padding: 40px 20px;
                    color: #3f3f46;
                }

                .no-results p {
                    font-size: 14px;
                    margin: 8px 0 0;
                }

                @media (max-width: 600px) {
                    .checkin-body { padding: 16px 12px 80px; }
                    .search-input { font-size: 16px; padding: 16px 16px 16px 48px; }
                    .counter-num { font-size: 26px; }
                }
            `}</style>

            <div className="checkin-page">
                {/* Header */}
                <div className="checkin-header">
                    <div className="header-row">
                        <div className="header-left">
                            <h1>
                                🎫 Check-In Desk
                            </h1>
                            <p>{isCoordinator ? coordEventName : "All Events"} • SHRESHTA 2026</p>
                        </div>
                        <Link href="/admin/dashboard" className="back-btn">
                            ← Dashboard
                        </Link>
                    </div>
                </div>

                <div className="checkin-body">
                    {/* Live Counter */}
                    <div className="live-counter">
                        <div className="counter-card" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                            <p className="counter-num" style={{ color: "#34d399" }}>{totalCheckedIn}</p>
                            <p className="counter-label" style={{ color: "#6ee7b7" }}>Checked In</p>
                        </div>
                        <div className="counter-card" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                            <p className="counter-num" style={{ color: "#60a5fa" }}>{totalRegs}</p>
                            <p className="counter-label" style={{ color: "#93c5fd" }}>Total</p>
                        </div>
                        <div className="counter-card" style={{ background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)" }}>
                            <p className="counter-num" style={{ color: "#d4a843" }}>{totalRegs - totalCheckedIn}</p>
                            <p className="counter-label" style={{ color: "#d4a843" }}>Remaining</p>
                        </div>
                    </div>

                    {/* Search & Actions */}
                    <div className="search-actions" style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                        <div className="search-box" style={{ flex: 1, margin: 0 }}>
                            <svg className="search-icon" width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                ref={searchRef}
                                type="text"
                                className="search-input"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Type name, phone, or college..."
                                autoComplete="off"
                            />
                        </div>
                        <button
                            onClick={() => setShowUncheckedIn(!showUncheckedIn)}
                            style={{
                                padding: "0 20px",
                                background: showUncheckedIn ? "rgba(212,168,67,0.15)" : "rgba(255,255,255,0.03)",
                                color: showUncheckedIn ? "#d4a843" : "#a1a1aa",
                                border: `2px solid ${showUncheckedIn ? "rgba(212,168,67,0.4)" : "rgba(255,255,255,0.06)"}`,
                                borderRadius: "16px",
                                cursor: "pointer",
                                minWidth: "max-content",
                                fontWeight: 600,
                                fontSize: "15px",
                                transition: "all 0.2s"
                            }}
                        >
                            {showUncheckedIn ? "✓ Pending" : "Show Pending"}
                        </button>
                    </div>

                    {/* Results */}
                    {search.length < 2 && !showUncheckedIn ? (
                        <div className="search-hint">
                            Type at least 2 characters to search participants or click "Show Pending"
                        </div>
                    ) : sorted.length === 0 ? (
                        <div className="no-results">
                            <span style={{ fontSize: "40px" }}>🔍</span>
                            <p>No participants found.</p>
                        </div>
                    ) : (
                        <div className="results-list">
                            {sorted.map((reg) => {
                                const isChecked = reg.checkedIn;
                                const isVerified = reg.paymentStatus === "completed";
                                const mainName = reg.members?.[0]?.name || "Unknown";

                                return (
                                    <div key={`${reg.eventId}-${reg.id}`} className={`result-card ${isChecked ? "checked" : ""}`}>
                                        <div className="result-top">
                                            <div>
                                                <p className="result-name">{mainName}</p>
                                                <p className="result-college">{reg.collegeName}</p>
                                            </div>
                                            <span
                                                className="result-badge"
                                                style={{
                                                    background: isVerified ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                                                    color: isVerified ? "#34d399" : "#fbbf24",
                                                    border: `1px solid ${isVerified ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
                                                }}
                                            >
                                                {isVerified ? "✓ Verified" : "⏳ Pending"}
                                            </span>
                                        </div>

                                        <div className="result-meta">
                                            <span>🎪 {reg.eventName}</span>
                                            <span>👥 Team #{reg.teamNumber}</span>
                                            <span>📧 {reg.email}</span>
                                        </div>

                                        <div className="members-list">
                                            {reg.members?.map((m, i) => (
                                                <span key={i} className="member-chip">
                                                    {m.name} • {m.phone}
                                                </span>
                                            ))}
                                        </div>

                                        {isChecked ? (
                                            <>
                                                <button className="checkin-btn done" disabled>
                                                    ✅ Already Checked In
                                                    {reg.checkedInAt && (
                                                        <span style={{ fontSize: "12px", opacity: 0.7, marginLeft: "4px" }}>
                                                            ({new Date(reg.checkedInAt.seconds * 1000).toLocaleTimeString()})
                                                        </span>
                                                    )}
                                                </button>
                                                <button className="undo-btn" onClick={() => handleUndoCheckIn(reg)}>
                                                    ↩ Undo Check-In
                                                </button>
                                            </>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                                <button
                                                    className={`checkin-btn ${isVerified ? "primary" : "warning"}`}
                                                    onClick={() => handleCheckIn(reg)}
                                                    disabled={checkingIn === reg.id}
                                                    style={{ flex: 1, margin: 0 }}
                                                >
                                                    {checkingIn === reg.id ? (
                                                        <><div className="spinner-sm" /> Checking In...</>
                                                    ) : isVerified ? (
                                                        <>✅ Check In</>
                                                    ) : (
                                                        <>⚠️ Check In <span style={{fontSize: '11px', opacity: 0.8}}>(Payment Pending)</span></>
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => handleSendReminder(reg)}
                                                    disabled={sendingEmail === reg.id}
                                                    style={{
                                                        padding: "0 16px",
                                                        background: "rgba(59,130,246,0.1)",
                                                        color: "#60a5fa",
                                                        border: "1px solid rgba(59,130,246,0.2)",
                                                        borderRadius: "12px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontFamily: "inherit",
                                                        fontSize: "14px",
                                                        fontWeight: 600,
                                                        cursor: sendingEmail === reg.id ? "not-allowed" : "pointer",
                                                        transition: "all 0.2s",
                                                        opacity: sendingEmail === reg.id ? 0.7 : 1
                                                    }}
                                                    title="Send Auto Reminder via Email API"
                                                >
                                                    {sendingEmail === reg.id ? "Sending..." : "📧 Auto Mail"}
                                                </button>

                                                <a
                                                    href={`tel:${reg.members?.[0]?.phone}`}
                                                    style={{
                                                        padding: "0 16px",
                                                        background: "rgba(16,185,129,0.1)",
                                                        color: "#34d399",
                                                        border: "1px solid rgba(16,185,129,0.2)",
                                                        borderRadius: "12px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        textDecoration: "none",
                                                        fontSize: "14px",
                                                        fontWeight: 600,
                                                        cursor: "pointer",
                                                        transition: "all 0.2s"
                                                    }}
                                                    title="Call Participant"
                                                >
                                                    📞 Call
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Success Overlay */}
                {showSuccess && lastCheckedIn && (
                    <div className="success-overlay">
                        <div className="success-card">
                            <div className="success-check">✓</div>
                            <p className="success-title">Checked In!</p>
                            <p className="success-name">{lastCheckedIn.members?.[0]?.name}</p>
                            <p className="success-detail">{lastCheckedIn.eventName} • Team #{lastCheckedIn.teamNumber}</p>
                            <p className="success-detail">{lastCheckedIn.collegeName}</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

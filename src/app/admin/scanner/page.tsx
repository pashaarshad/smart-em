"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import QRScanner from "@/components/admin/QRScanner";
import Link from "next/link";
import "../dashboard/admin.css";

interface ScanResult {
    status: "success" | "already_checked_in" | "not_found" | "error" | "pending";
    message: string;
    teamData?: any;
}

export default function ScannerPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const isLoggedIn = sessionStorage.getItem("adminLoggedIn");
        if (isLoggedIn !== "true") {
            router.push("/admin");
        } else {
            setIsAuthenticated(true);
        }
    }, [router]);

    const handleScan = async (decodedText: string) => {
        if (isVerifying) return;
        setIsVerifying(true);
        setScanResult({ status: "pending", message: "Verifying QR Code..." });

        try {
            // Parse QR Data
            let data;
            try {
                data = JSON.parse(decodedText);
            } catch {
                throw new Error("Invalid QR Code format.");
            }

            if (!data.id || !data.eid) {
                throw new Error("Invalid SHRESHTA QR Code.");
            }

            // Fetch registration from Firestore
            const docRef = doc(db, "registrations", data.eid, "teams", data.id);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                setScanResult({ status: "not_found", message: "Registration not found in database." });
                setIsVerifying(false);
                return;
            }

            const regData = docSnap.data();

            if (regData.checkedIn) {
                setScanResult({
                    status: "already_checked_in",
                    message: `Team is already checked in. (Checked in at: ${regData.checkedInAt?.toDate().toLocaleString()})`,
                    teamData: regData
                });
            } else {
                // Check in the team
                await updateDoc(docRef, {
                    checkedIn: true,
                    checkedInAt: Timestamp.now(),
                });

                setScanResult({
                    status: "success",
                    message: "Check-in successful!",
                    teamData: regData
                });
            }
        } catch (err: any) {
            console.error("Scan Error:", err);
            setScanResult({ status: "error", message: err.message || "An error occurred while scanning." });
        } finally {
            setIsVerifying(false);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div>
                    <h1 className="admin-title">QR Scanner</h1>
                    <p className="admin-subtitle">Event Day Check-in</p>
                </div>
                <Link href="/admin/dashboard" className="secondary-btn" style={{ textDecoration: 'none' }}>
                    Dashboard
                </Link>
            </header>

            <div className="admin-content" style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '40px' }}>
                <div style={{ background: '#13131a', padding: '30px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                    <h2 style={{ color: '#fff', fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <svg width="24" height="24" fill="none" stroke="#d4a843" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        Scan Participant QR
                    </h2>

                    <QRScanner onScan={handleScan} />

                    {scanResult && (
                        <div style={{
                            marginTop: '24px',
                            padding: '20px',
                            borderRadius: '12px',
                            background: scanResult.status === 'success' ? 'rgba(16,185,129,0.1)' :
                                scanResult.status === 'already_checked_in' ? 'rgba(245,158,11,0.1)' :
                                    scanResult.status === 'pending' ? 'rgba(255,255,255,0.05)' :
                                        'rgba(239,68,68,0.1)',
                            border: `1px solid ${scanResult.status === 'success' ? 'rgba(16,185,129,0.3)' :
                                    scanResult.status === 'already_checked_in' ? 'rgba(245,158,11,0.3)' :
                                        scanResult.status === 'pending' ? 'rgba(255,255,255,0.1)' :
                                            'rgba(239,68,68,0.3)'}`
                        }}>
                            <h3 style={{
                                margin: '0 0 8px 0',
                                fontSize: '18px',
                                color: scanResult.status === 'success' ? '#34d399' :
                                    scanResult.status === 'already_checked_in' ? '#fbbf24' :
                                        scanResult.status === 'pending' ? '#a1a1aa' :
                                            '#f87171'
                            }}>
                                {scanResult.status === 'success' ? '✅ Verified' :
                                    scanResult.status === 'already_checked_in' ? '⚠️ Already Scanned' :
                                        scanResult.status === 'pending' ? '⏳ Verifying...' :
                                            '❌ Error'}
                            </h3>
                            <p style={{ color: '#e4e4e7', fontSize: '15px', margin: '0' }}>{scanResult.message}</p>

                            {scanResult.teamData && (
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <p style={{ color: '#a1a1aa', margin: '0 0 8px 0', fontSize: '13px' }}>Team Details:</p>
                                    <p style={{ margin: '0 0 4px 0', color: '#fff' }}><strong>Event:</strong> {scanResult.teamData.eventName}</p>
                                    <p style={{ margin: '0 0 4px 0', color: '#fff' }}><strong>College:</strong> {scanResult.teamData.collegeName}</p>
                                    <p style={{ margin: '0', color: '#fff' }}><strong>Members:</strong> {scanResult.teamData.members?.map((m: any) => m.name).join(', ')}</p>
                                </div>
                            )}

                            <button
                                onClick={() => setScanResult(null)}
                                style={{
                                    marginTop: '16px',
                                    padding: '8px 16px',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#e4e4e7',
                                    cursor: 'pointer'
                                }}
                            >
                                Clear Result
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Registration } from "@/types/admin";
import { generateAndUploadCertificate } from "@/lib/certificateService";
import { sendCertificateEmail } from "@/lib/emailService";

interface CertificatePanelProps {
    registrations: Registration[];
    onClose: () => void;
}

export default function CertificatePanel({ registrations, onClose }: CertificatePanelProps) {
    const [selectedEvent, setSelectedEvent] = useState("all");
    const [onlyCheckedIn, setOnlyCheckedIn] = useState(false);
    const [onlyVerified, setOnlyVerified] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, currentName: "" });
    const [results, setResults] = useState<{ success: number; failed: number; skipped: number }>({ success: 0, failed: 0, skipped: 0 });
    const [done, setDone] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Get unique events
    const events = Array.from(new Set(registrations.map(r => r.eventId))).map(id => {
        const reg = registrations.find(r => r.eventId === id);
        return { id, name: reg?.eventName || id };
    });

    // Filter registrations
    const filtered = registrations.filter(r => {
        if (selectedEvent !== "all" && r.eventId !== selectedEvent) return false;
        if (onlyVerified && r.paymentStatus !== "completed") return false;
        if (onlyCheckedIn && !r.checkedIn) return false;
        return true;
    });

    // Count already generated
    const alreadyGenerated = filtered.filter(r => r.certificateUrl).length;

    const handleGeneratePreview = async () => {
        if (filtered.length === 0) return;
        const sample = filtered[0];
        const memberName = sample.members[0]?.name || "Sample Name";

        try {
            const { generateCertificateImage } = await import("@/lib/certificateService");
            const blob = await generateCertificateImage({
                participantName: memberName,
                eventName: sample.eventName,
                collegeName: sample.collegeName,
                teamNumber: sample.teamNumber,
            });
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
        } catch (err) {
            console.error("Preview generation failed:", err);
        }
    };

    const handleGenerateAll = async () => {
        setGenerating(true);
        setDone(false);
        const res = { success: 0, failed: 0, skipped: 0 };
        setProgress({ current: 0, total: filtered.length, currentName: "" });

        for (let i = 0; i < filtered.length; i++) {
            const reg = filtered[i];
            const memberName = reg.members[0]?.name || "Participant";
            setProgress({ current: i + 1, total: filtered.length, currentName: memberName });

            // Skip if already generated and emailed
            if (reg.certificateUrl && reg.certificateSentAt) {
                res.skipped++;
                continue;
            }

            try {
                // Generate certificate (or reuse existing URL)
                let certUrl = reg.certificateUrl;
                if (!certUrl) {
                    certUrl = await generateAndUploadCertificate(
                        {
                            participantName: memberName,
                            eventName: reg.eventName,
                            collegeName: reg.collegeName,
                            teamNumber: reg.teamNumber,
                        },
                        reg.eventId,
                        reg.id
                    );
                }

                // Send email
                const emailSent = await sendCertificateEmail({
                    to: reg.email,
                    participantName: memberName,
                    eventName: reg.eventName,
                    certificateUrl: certUrl,
                });

                // Update Firestore
                const docRef = doc(db, "registrations", reg.eventId, "teams", reg.id);
                await updateDoc(docRef, {
                    certificateUrl: certUrl,
                    ...(emailSent ? { certificateSentAt: Timestamp.now() } : {}),
                });

                res.success++;
            } catch (err) {
                console.error(`Failed for ${memberName}:`, err);
                res.failed++;
            }
        }

        setResults(res);
        setGenerating(false);
        setDone(true);
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 99999,
                background: "rgba(0,0,0,0.85)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
            }}
            onClick={(e) => e.target === e.currentTarget && !generating && onClose()}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "680px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    background: "linear-gradient(180deg, #1a1a1f 0%, #141418 100%)",
                    border: "1px solid rgba(212,168,67,0.25)",
                    borderRadius: "20px",
                    boxShadow: "0 25px 80px rgba(0,0,0,0.7)",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "24px 28px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div>
                        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "10px" }}>
                            🏆 Certificate Generator
                        </h2>
                        <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#71717a" }}>
                            Generate & email certificates to participants
                        </p>
                    </div>
                    {!generating && (
                        <button
                            onClick={onClose}
                            style={{
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "10px",
                                color: "#71717a",
                                fontSize: "20px",
                                width: "36px",
                                height: "36px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            ×
                        </button>
                    )}
                </div>

                {/* Body */}
                <div style={{ padding: "24px 28px" }}>
                    {/* Filters */}
                    <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: "200px" }}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#a1a1aa", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Event
                            </label>
                            <select
                                value={selectedEvent}
                                onChange={(e) => setSelectedEvent(e.target.value)}
                                disabled={generating}
                                style={{
                                    width: "100%",
                                    padding: "12px 14px",
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "10px",
                                    color: "#fff",
                                    fontSize: "14px",
                                    outline: "none",
                                }}
                            >
                                <option value="all">All Events</option>
                                {events.map(e => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Toggles */}
                    <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "#a1a1aa" }}>
                            <input
                                type="checkbox"
                                checked={onlyVerified}
                                onChange={(e) => setOnlyVerified(e.target.checked)}
                                disabled={generating}
                                style={{ accentColor: "#d4a843" }}
                            />
                            Verified payments only
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "#a1a1aa" }}>
                            <input
                                type="checkbox"
                                checked={onlyCheckedIn}
                                onChange={(e) => setOnlyCheckedIn(e.target.checked)}
                                disabled={generating}
                                style={{ accentColor: "#d4a843" }}
                            />
                            Checked-in only
                        </label>
                    </div>

                    {/* Stats */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "12px",
                        marginBottom: "24px",
                    }}>
                        <div style={{
                            background: "rgba(212,168,67,0.08)",
                            border: "1px solid rgba(212,168,67,0.2)",
                            borderRadius: "12px",
                            padding: "16px",
                            textAlign: "center",
                        }}>
                            <p style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#d4a843" }}>{filtered.length}</p>
                            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#a1a1aa" }}>Recipients</p>
                        </div>
                        <div style={{
                            background: "rgba(16,185,129,0.08)",
                            border: "1px solid rgba(16,185,129,0.2)",
                            borderRadius: "12px",
                            padding: "16px",
                            textAlign: "center",
                        }}>
                            <p style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#34d399" }}>{alreadyGenerated}</p>
                            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#a1a1aa" }}>Already Sent</p>
                        </div>
                        <div style={{
                            background: "rgba(59,130,246,0.08)",
                            border: "1px solid rgba(59,130,246,0.2)",
                            borderRadius: "12px",
                            padding: "16px",
                            textAlign: "center",
                        }}>
                            <p style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#60a5fa" }}>{filtered.length - alreadyGenerated}</p>
                            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#a1a1aa" }}>Pending</p>
                        </div>
                    </div>

                    {/* Preview */}
                    {previewUrl && (
                        <div style={{ marginBottom: "24px" }}>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#a1a1aa", marginBottom: "8px" }}>Preview:</p>
                            <img
                                src={previewUrl}
                                alt="Certificate Preview"
                                style={{
                                    width: "100%",
                                    borderRadius: "12px",
                                    border: "1px solid rgba(212,168,67,0.2)",
                                }}
                            />
                        </div>
                    )}

                    {/* Progress */}
                    {generating && (
                        <div style={{
                            background: "rgba(59,130,246,0.08)",
                            border: "1px solid rgba(59,130,246,0.2)",
                            borderRadius: "12px",
                            padding: "20px",
                            marginBottom: "20px",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                <span style={{ fontSize: "14px", color: "#60a5fa", fontWeight: 600 }}>
                                    Generating & Emailing...
                                </span>
                                <span style={{ fontSize: "14px", color: "#a1a1aa" }}>
                                    {progress.current}/{progress.total}
                                </span>
                            </div>
                            <div style={{
                                width: "100%",
                                height: "6px",
                                background: "rgba(255,255,255,0.05)",
                                borderRadius: "3px",
                                overflow: "hidden",
                                marginBottom: "8px",
                            }}>
                                <div style={{
                                    width: `${(progress.current / progress.total) * 100}%`,
                                    height: "100%",
                                    background: "linear-gradient(90deg, #3b82f6, #d4a843)",
                                    borderRadius: "3px",
                                    transition: "width 0.3s ease",
                                }} />
                            </div>
                            <p style={{ margin: 0, fontSize: "13px", color: "#71717a" }}>
                                Current: {progress.currentName}
                            </p>
                        </div>
                    )}

                    {/* Results */}
                    {done && (
                        <div style={{
                            background: "rgba(16,185,129,0.08)",
                            border: "1px solid rgba(16,185,129,0.2)",
                            borderRadius: "12px",
                            padding: "20px",
                            marginBottom: "20px",
                            textAlign: "center",
                        }}>
                            <p style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: 700, color: "#34d399" }}>
                                ✅ Generation Complete!
                            </p>
                            <div style={{ display: "flex", justifyContent: "center", gap: "24px" }}>
                                <span style={{ color: "#34d399", fontSize: "14px" }}>✓ {results.success} sent</span>
                                <span style={{ color: "#71717a", fontSize: "14px" }}>⏭ {results.skipped} skipped</span>
                                {results.failed > 0 && (
                                    <span style={{ color: "#f87171", fontSize: "14px" }}>✗ {results.failed} failed</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Buttons */}
                    <div style={{ display: "flex", gap: "12px" }}>
                        <button
                            onClick={handleGeneratePreview}
                            disabled={generating || filtered.length === 0}
                            style={{
                                flex: 1,
                                padding: "14px",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "12px",
                                color: "#a1a1aa",
                                fontSize: "15px",
                                fontWeight: 600,
                                cursor: generating || filtered.length === 0 ? "not-allowed" : "pointer",
                                opacity: generating || filtered.length === 0 ? 0.5 : 1,
                                transition: "all 0.2s ease",
                            }}
                        >
                            👁 Preview
                        </button>
                        <button
                            onClick={handleGenerateAll}
                            disabled={generating || filtered.length === 0}
                            style={{
                                flex: 2,
                                padding: "14px",
                                background: generating || filtered.length === 0
                                    ? "rgba(212,168,67,0.2)"
                                    : "linear-gradient(135deg, #d4a843 0%, #b8922e 100%)",
                                border: "none",
                                borderRadius: "12px",
                                color: generating || filtered.length === 0 ? "#71717a" : "#000",
                                fontSize: "15px",
                                fontWeight: 700,
                                cursor: generating || filtered.length === 0 ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                transition: "all 0.2s ease",
                            }}
                        >
                            {generating ? (
                                <>
                                    <div style={{
                                        width: "18px", height: "18px",
                                        border: "3px solid rgba(0,0,0,0.2)",
                                        borderTopColor: "#000",
                                        borderRadius: "50%",
                                        animation: "spin 0.8s linear infinite",
                                    }} />
                                    Generating...
                                </>
                            ) : (
                                <>🏆 Generate & Email ({filtered.length})</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

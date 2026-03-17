"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, updateDoc, getDocs, deleteDoc, addDoc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { allEvents } from "@/data/events";

// Typed Imports
import { Registration, Member } from "@/types/admin";
import { exportToExcel, exportToPDF } from "@/lib/admin/export";
import { generateAndUploadQR } from "@/lib/qrCodeService";
import { sendQREmail } from "@/lib/emailService";

// Components
import StatsCards from "@/components/admin/StatsCards";
import RegistrationTable from "@/components/admin/RegistrationTable";
import PinModal from "@/components/admin/PinModal";
import DeleteModal from "@/components/admin/DeleteModal";
import DetailsModal from "@/components/admin/DetailsModal";
import ExportModal from "@/components/admin/ExportModal";
import BulkVerifyModal from "@/components/admin/BulkVerifyModal";
import AlertPanel from "@/components/admin/AlertPanel";
import CertificatePanel from "@/components/admin/CertificatePanel";
import "./admin.css";

const EDIT_PIN = "6565";

export default function AdminDashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<string>("all");
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, checkedIn: 0 });
    const router = useRouter();

    // Edit mode states
    const [editMode, setEditMode] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);

    // Deletion states
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteStatus, setDeleteStatus] = useState({ isDeleting: false, error: "" });
    const [deleteContext, setDeleteContext] = useState<{ id: string, eventId: string, teamNumber: number, eventName: string } | null>(null);

    // Details Modal State
    const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
    const [editData, setEditData] = useState<Registration | null>(null);

    // Export State
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportType, setExportType] = useState<'excel' | 'pdf'>('excel');
    const [exportFields, setExportFields] = useState({ fee: true, utr: true, status: true, date: true });

    const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
    const [showBulkVerifyModal, setShowBulkVerifyModal] = useState(false);
    const [showAlertPanel, setShowAlertPanel] = useState(false);
    const [showCertificatePanel, setShowCertificatePanel] = useState(false);

    // Auth check
    useEffect(() => {
        const isLoggedIn = sessionStorage.getItem("adminLoggedIn");
        if (isLoggedIn !== "true") {
            router.push("/admin");
        } else {
            setIsAuthenticated(true);
        }
    }, [router]);

    // Real-Time Data Fetching with onSnapshot
    useEffect(() => {
        if (!isAuthenticated) return;

        setLoading(true);
        const unsubscribes: (() => void)[] = [];
        const eventRegsMap: Record<string, Registration[]> = {};

        const computeStats = () => {
            const allRegs: Registration[] = [];
            for (const event of allEvents) {
                allRegs.push(...(eventRegsMap[event.id] || []));
            }
            allRegs.sort((a, b) => {
                const timeA = a.registeredAt?.seconds || 0;
                const timeB = b.registeredAt?.seconds || 0;
                return timeB - timeA;
            });
            setRegistrations(allRegs);
            setStats({
                total: allRegs.length,
                pending: allRegs.filter(r => r.paymentStatus !== "completed").length,
                verified: allRegs.filter(r => r.paymentStatus === "completed").length,
                checkedIn: allRegs.filter(r => r.checkedIn === true).length
            });
            setLoading(false);
        };

        for (const event of allEvents) {
            const teamsRef = collection(db, "registrations", event.id, "teams");
            const unsub = onSnapshot(teamsRef, (snapshot) => {
                const regs: Registration[] = [];
                snapshot.forEach((docSnap) => {
                    regs.push({
                        id: docSnap.id,
                        eventId: event.id,
                        ...docSnap.data()
                    } as Registration);
                });
                eventRegsMap[event.id] = regs;
                computeStats();
            }, (error) => {
                console.error(`Error listening to ${event.id}:`, error);
            });
            unsubscribes.push(unsub);
        }

        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
    }, [isAuthenticated]);

    const filteredRegistrations = selectedEvent === "all"
        ? registrations
        : registrations.filter(r => r.eventId === selectedEvent);

    // Handlers
    const handlePinSubmit = (pin: string) => {
        if (pin === EDIT_PIN) {
            setEditMode(true);
            setShowPinModal(false);
        } else {
            alert("Incorrect PIN");
        }
    };

    const handleRowClick = (reg: Registration) => {
        setSelectedRegistration(reg);
        if (editMode) {
            setEditData({ ...reg, members: [...reg.members.map(m => ({ ...m }))] });
        }
    };

    const handleUpdateStatus = async (eventId: string, docId: string, status: string) => {
        try {
            const docRef = doc(db, "registrations", eventId, "teams", docId);
            const updateData: any = { paymentStatus: status };
            const reg = registrations.find(r => r.id === docId && r.eventId === eventId);

            // Generate QR and send email if moving to 'completed' and hasn't been done
            if (status === "completed" && reg && !reg.qrCodeUrl) {
                try {
                    // Update state to show processing if you want (could use a toast)
                    const verifiedTimeStamp = new Date().toISOString();
                    const qrUrl = await generateAndUploadQR({
                        teamId: reg.id,
                        eventId: reg.eventId,
                        eventName: reg.eventName,
                        teamNumber: reg.teamNumber,
                        collegeName: reg.collegeName,
                        members: reg.members,
                        registrationFee: reg.registrationFee,
                        verifiedAt: verifiedTimeStamp
                    });

                    updateData.qrCodeUrl = qrUrl;
                    updateData.qrSentAt = new Date();

                    await sendQREmail({
                        to: reg.email,
                        teamNumber: reg.teamNumber,
                        eventName: reg.eventName,
                        collegeName: reg.collegeName,
                        members: reg.members,
                        qrCodeUrl: qrUrl
                    });
                } catch (qrError) {
                    console.error("Failed to generate/send QR:", qrError);
                    alert("Status updated, but failed to generate/send QR code email.");
                }
            }

            await updateDoc(docRef, updateData);

            setRegistrations(prev => prev.map(r =>
                r.id === docId && r.eventId === eventId ? { ...r, ...updateData } : r
            ));

            setStats(prev => ({
                ...prev,
                pending: status === "completed" ? prev.pending - 1 : prev.pending + 1,
                verified: status === "completed" ? prev.verified + 1 : prev.verified - 1
            }));

            if (selectedRegistration?.id === docId) {
                setSelectedRegistration(prev => prev ? { ...prev, ...updateData } : null);
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleSaveEdits = async () => {
        if (!editData) return;
        try {
            const docRef = doc(db, "registrations", editData.eventId, "teams", editData.id);
            const originalReg = registrations.find(r => r.id === editData.id);

            if (originalReg && originalReg.eventId !== editData.eventId) {
                await deleteDoc(doc(db, "registrations", originalReg.eventId, "teams", originalReg.id));
                const { id, ...dataWithoutId } = editData;
                await addDoc(collection(db, "registrations", editData.eventId, "teams"), dataWithoutId);
            } else {
                await updateDoc(docRef, {
                    collegeName: editData.collegeName,
                    members: editData.members,
                    registrationFee: editData.registrationFee,
                    eventName: editData.eventName,
                    utrNumber: editData.utrNumber,
                    paymentStatus: editData.paymentStatus
                });
            }
            window.location.reload();
        } catch (error) {
            console.error("Error saving edits:", error);
            alert("Failed to save changes.");
        }
    };

    const handleDeleteConfirm = async (pin: string) => {
        if (pin !== EDIT_PIN) {
            setDeleteStatus({ isDeleting: false, error: "Incorrect PIN" });
            return;
        }
        if (!deleteContext) return;

        try {
            setDeleteStatus({ isDeleting: true, error: "" });
            await deleteDoc(doc(db, "registrations", deleteContext.eventId, "teams", deleteContext.id));
            window.location.reload();
        } catch (error: any) {
            console.error("Deletion Error:", error);
            setDeleteStatus({ isDeleting: false, error: `Failed to delete. ${error?.message || ''}` });
        }
    };

    const handleCopyUtr = (utr: string) => {
        navigator.clipboard.writeText(utr);
        setCopiedUtr(utr);
        setTimeout(() => setCopiedUtr(null), 2000);
    };

    const handleBulkVerify = async (matchedItems: { id: string, eventId: string }[]) => {
        try {
            setLoading(true);
            const updatePromises = matchedItems.map(item => {
                return handleUpdateStatus(item.eventId, item.id, "completed");
            });

            await Promise.all(updatePromises);

            // Refresh registrations
            window.location.reload();
        } catch (error) {
            console.error("Bulk verification error:", error);
            alert("Failed to update some registrations.");
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div className="header-inner">
                    <h1 className="header-title">
                        <span>SHRESHTA</span> Admin
                        {editMode && <span className="edit-mode-badge" style={{ marginLeft: '12px', fontSize: '12px', background: 'rgba(212,168,67,0.2)', padding: '4px 8px', borderRadius: '4px' }}>✏️ Edit Mode</span>}
                    </h1>
                    <div className="header-actions">
                        <a
                            href="/admin/scanner"
                            style={{
                                background: 'linear-gradient(135deg, #d4a843 0%, #b88a2e 100%)',
                                color: '#000',
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                textDecoration: 'none',
                                fontSize: '14px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            QR Scanner
                        </a>
                        <button
                            onClick={() => setShowAlertPanel(true)}
                            style={{
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                color: '#000',
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            Alert
                        </button>
                        <button
                            onClick={() => setShowCertificatePanel(true)}
                            style={{
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                color: '#fff',
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                            Certificates
                        </button>
                        <button
                            className="verify-btn"
                            onClick={() => setShowBulkVerifyModal(true)}
                            style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#fff',
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Auto Verify
                        </button>
                        <button className={`edit-btn ${editMode ? 'active' : ''}`} onClick={() => editMode ? setEditMode(false) : setShowPinModal(true)}>
                            {editMode ? "Exit" : "Edit"}
                        </button>
                        <button className="logout-btn" onClick={() => { sessionStorage.removeItem("adminLoggedIn"); router.push("/admin"); }}>Logout</button>
                    </div>
                </div>
            </header>

            <div className="dashboard-content">
                <StatsCards stats={stats} />

                <div className="filter-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div className="filter-label">Filter by Event:</div>
                        <select className="filter-select" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
                            <option value="all">All Events</option>
                            {allEvents.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => { setExportType('excel'); setShowExportModal(true); }} style={{ padding: '10px 16px', background: '#107c41', borderRadius: '8px', color: '#fff', border: 'none', cursor: 'pointer' }}>Excel</button>
                        <button onClick={() => { setExportType('pdf'); setShowExportModal(true); }} style={{ padding: '10px 16px', background: '#b91c1c', borderRadius: '8px', color: '#fff', border: 'none', cursor: 'pointer' }}>PDF</button>
                    </div>
                </div>

                <div className="table-container">
                    <div className="table-header">
                        <h2 className="table-title">Registrations</h2>
                        <span className="table-count">{filteredRegistrations.length} teams</span>
                    </div>
                    {loading ? (
                        <div className="loading-container"><div className="loading-spinner" /></div>
                    ) : (
                        <RegistrationTable registrations={filteredRegistrations} onRowClick={handleRowClick} />
                    )}
                </div>
            </div>

            {/* Modals */}
            {showPinModal && (
                <PinModal
                    title="Enter Edit PIN"
                    subtitle="Enter 4-digit PIN to enable edit mode"
                    onClose={() => setShowPinModal(false)}
                    onSubmit={handlePinSubmit}
                />
            )}

            {showDeleteConfirm && (
                <DeleteModal
                    context={deleteContext}
                    isDeleting={deleteStatus.isDeleting}
                    error={deleteStatus.error}
                    onClose={() => setShowDeleteConfirm(false)}
                    onConfirm={handleDeleteConfirm}
                />
            )}

            {selectedRegistration && (
                <DetailsModal
                    registration={selectedRegistration}
                    editMode={editMode}
                    editData={editData}
                    allEvents={allEvents}
                    copiedUtr={copiedUtr}
                    onClose={() => { setSelectedRegistration(null); setEditData(null); }}
                    onSave={handleSaveEdits}
                    onDelete={(reg) => {
                        setDeleteContext({ id: reg.id, eventId: reg.eventId, teamNumber: reg.teamNumber, eventName: reg.eventName });
                        setSelectedRegistration(null);
                        setShowDeleteConfirm(true);
                    }}
                    onUpdateField={(f, v) => setEditData(prev => prev ? { ...prev, [f]: v } : null)}
                    onUpdateMember={(i, f, v) => {
                        if (!editData) return;
                        const newMembers = [...editData.members];
                        newMembers[i] = { ...newMembers[i], [f]: v };
                        setEditData({ ...editData, members: newMembers });
                    }}
                    onEventChange={(id) => {
                        if (!editData) return;
                        const event = allEvents.find(e => e.id === id);
                        if (event) setEditData({ ...editData, eventId: id, eventName: event.title, registrationFee: event.registrationFee, category: event.category });
                    }}
                    onCopyUtr={handleCopyUtr}
                    onUpdateStatus={handleUpdateStatus}
                />
            )}

            <ExportModal
                show={showExportModal}
                exportType={exportType}
                exportFields={exportFields}
                onClose={() => setShowExportModal(false)}
                onFieldChange={(f, v) => setExportFields(prev => ({ ...prev, [f]: v }))}
                onDownload={() => {
                    if (exportType === 'excel') exportToExcel(registrations, selectedEvent, allEvents, exportFields);
                    else exportToPDF(registrations, selectedEvent, allEvents, exportFields);
                    setShowExportModal(false);
                }}
            />

            {showBulkVerifyModal && (
                <BulkVerifyModal
                    pendingRegistrations={registrations.filter(r => r.paymentStatus !== 'completed')}
                    onClose={() => setShowBulkVerifyModal(false)}
                    onVerify={handleBulkVerify}
                />
            )}

            {showAlertPanel && (
                <AlertPanel
                    registrations={registrations}
                    onClose={() => setShowAlertPanel(false)}
                />
            )}

            {showCertificatePanel && (
                <CertificatePanel
                    registrations={registrations}
                    onClose={() => setShowCertificatePanel(false)}
                />
            )}
        </div>
    );
}

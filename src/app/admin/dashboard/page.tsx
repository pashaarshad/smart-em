"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, updateDoc, getDocs, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { allEvents } from "@/data/events";

// Typed Imports
import { Registration, Member } from "@/types/admin";
import { exportToExcel, exportToPDF } from "@/lib/admin/export";

// Components
import StatsCards from "@/components/admin/StatsCards";
import RegistrationTable from "@/components/admin/RegistrationTable";
import PinModal from "@/components/admin/PinModal";
import DeleteModal from "@/components/admin/DeleteModal";
import DetailsModal from "@/components/admin/DetailsModal";
import ExportModal from "@/components/admin/ExportModal";
import BulkVerifyModal from "@/components/admin/BulkVerifyModal";
import "./admin.css";

const EDIT_PIN = "6565";

export default function AdminDashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<string>("all");
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0 });
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

    // Auth check
    useEffect(() => {
        const isLoggedIn = sessionStorage.getItem("adminLoggedIn");
        if (isLoggedIn !== "true") {
            router.push("/admin");
        } else {
            setIsAuthenticated(true);
        }
    }, [router]);

    // Data Fetching
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchAllRegistrations = async () => {
            setLoading(true);
            const allRegs: Registration[] = [];

            for (const event of allEvents) {
                try {
                    const teamsRef = collection(db, "registrations", event.id, "teams");
                    const snapshot = await getDocs(teamsRef);
                    snapshot.forEach((docSnap) => {
                        allRegs.push({
                            id: docSnap.id,
                            eventId: event.id,
                            ...docSnap.data()
                        } as Registration);
                    });
                } catch (error) {
                    console.error(`Error fetching ${event.id}:`, error);
                }
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
                verified: allRegs.filter(r => r.paymentStatus === "completed").length
            });
            setLoading(false);
        };

        fetchAllRegistrations();
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
            await updateDoc(docRef, { paymentStatus: status });

            setRegistrations(prev => prev.map(r =>
                r.id === docId && r.eventId === eventId ? { ...r, paymentStatus: status } : r
            ));

            setStats(prev => ({
                ...prev,
                pending: status === "completed" ? prev.pending - 1 : prev.pending + 1,
                verified: status === "completed" ? prev.verified + 1 : prev.verified - 1
            }));

            if (selectedRegistration?.id === docId) {
                setSelectedRegistration(prev => prev ? { ...prev, paymentStatus: status } : null);
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
        } catch (error) {
            setDeleteStatus({ isDeleting: false, error: "Failed to delete." });
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
                const docRef = doc(db, "registrations", item.eventId, "teams", item.id);
                return updateDoc(docRef, { paymentStatus: "completed" });
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
        </div>
    );
}

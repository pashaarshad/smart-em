"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, updateDoc, getDocs, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { allEvents } from "@/data/events";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Member {
    name: string;
    phone: string;
}

interface Registration {
    id: string;
    teamNumber: number;
    eventId: string;
    eventName: string;
    category: string;
    collegeName: string;
    email: string;
    members: Member[];
    registrationFee: string;
    utrNumber: string;
    screenshotUrl?: string;
    paymentStatus: string;
    registeredAt: any;
}

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
    const [pinInput, setPinInput] = useState("");
    const [pinError, setPinError] = useState("");
    const [editingRow, setEditingRow] = useState<string | null>(null);
    const [editData, setEditData] = useState<Registration | null>(null);

    // Delete Confirmation State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteStep, setDeleteStep] = useState<'warning' | 'pin' | 'deleting'>('warning');
    const [deleteTimer, setDeleteTimer] = useState(5);
    const [deletePin, setDeletePin] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [deleteContext, setDeleteContext] = useState<{ id: string, eventId: string, teamNumber: number, eventName: string } | null>(null);

    // Details Modal State
    const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);

    // Copied State
    const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

    // Export State
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportType, setExportType] = useState<'excel' | 'pdf'>('excel');
    const [exportFields, setExportFields] = useState({
        fee: true,
        utr: true,
        status: true,
        date: true
    });

    // Check authentication
    useEffect(() => {
        const isLoggedIn = sessionStorage.getItem("adminLoggedIn");
        if (isLoggedIn !== "true") {
            router.push("/admin");
        } else {
            setIsAuthenticated(true);
        }
    }, [router]);

    // Fetch registrations
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

    // Handle PIN verification
    const handlePinSubmit = () => {
        if (pinInput === EDIT_PIN) {
            setEditMode(true);
            setShowPinModal(false);
            setPinInput("");
            setPinError("");
        } else {
            setPinError("Incorrect PIN");
        }
    };

    // Start editing a row (inline or module)
    const startEditing = (reg: Registration) => {
        setEditingRow(reg.id);
        setEditData({ ...reg, members: [...reg.members.map(m => ({ ...m }))] });
    };

    // Cancel editing
    const cancelEditing = () => {
        setEditingRow(null);
        setEditData(null);
    };

    // Save edits
    const saveEdits = async () => {
        if (!editData) return;

        try {
            const docRef = doc(db, "registrations", editData.eventId, "teams", editData.id);

            // If event changed, we need to move the document
            const originalReg = registrations.find(r => r.id === editData.id);

            if (originalReg && originalReg.eventId !== editData.eventId) {
                // Delete from old collection
                await deleteDoc(doc(db, "registrations", originalReg.eventId, "teams", originalReg.id));

                // Get new team number for new event
                const newEventTeams = collection(db, "registrations", editData.eventId, "teams");
                const snapshot = await getDocs(newEventTeams);
                const newTeamNumber = snapshot.size + 1;

                // Add to new collection with new ID
                const { id, ...dataWithoutId } = editData;
                await addDoc(collection(db, "registrations", editData.eventId, "teams"), {
                    ...dataWithoutId,
                    teamNumber: newTeamNumber
                });
            } else {
                // Update in place
                await updateDoc(docRef, {
                    collegeName: editData.collegeName,
                    members: editData.members,
                    registrationFee: editData.registrationFee,
                    eventName: editData.eventName,
                    utrNumber: editData.utrNumber,
                    paymentStatus: editData.paymentStatus
                });
            }

            // Reload page to refresh data (simplest way to handle ID changes/moves)
            window.location.reload();
        } catch (error) {
            console.error("Error saving edits:", error);
            alert("Failed to save changes. Please try again.");
        }
    };

    // Update edit status directly (for modal or inline)
    const updatePaymentStatus = async (eventId: string, docId: string, status: string) => {
        try {
            const docRef = doc(db, "registrations", eventId, "teams", docId);
            await updateDoc(docRef, { paymentStatus: status });

            setRegistrations(prev => prev.map(r =>
                r.id === docId && r.eventId === eventId
                    ? { ...r, paymentStatus: status }
                    : r
            ));

            setStats(prev => ({
                ...prev,
                pending: status === "completed" ? prev.pending - 1 : prev.pending + 1,
                verified: status === "completed" ? prev.verified + 1 : prev.verified - 1
            }));

            // Also update selected registration if modal is open
            if (selectedRegistration && selectedRegistration.id === docId) {
                setSelectedRegistration(prev => prev ? { ...prev, paymentStatus: status } : null);
            }
            // Also update editData if editing
            if (editData && editData.id === docId) {
                setEditData(prev => prev ? { ...prev, paymentStatus: status } : null);
            }

        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    // Update edit data
    const updateEditField = (field: keyof Registration, value: any) => {
        if (!editData) return;
        setEditData({ ...editData, [field]: value });
    };

    const updateEditMember = (index: number, field: keyof Member, value: string) => {
        if (!editData) return;
        const newMembers = [...editData.members];
        newMembers[index] = { ...newMembers[index], [field]: value };
        setEditData({ ...editData, members: newMembers });
    };

    const handleEventChange = (newEventId: string) => {
        if (!editData) return;
        const event = allEvents.find(e => e.id === newEventId);
        if (event) {
            setEditData({
                ...editData,
                eventId: newEventId,
                eventName: event.title,
                registrationFee: event.registrationFee,
                category: event.category
            });
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem("adminLoggedIn");
        router.push("/admin");
    };

    // Delete Handlers
    const handleDeleteRequest = (reg: Registration) => {
        setDeleteContext({
            id: reg.id,
            eventId: reg.eventId,
            teamNumber: reg.teamNumber,
            eventName: reg.eventName
        });
        setDeleteStep('warning');
        setDeleteTimer(5);

        // Close the Edit Modal Immediately so it is not visible behind the delete modal
        closeModal();

        setShowDeleteConfirm(true);
    };

    // Timer effect for delete warning
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showDeleteConfirm && deleteStep === 'warning' && deleteTimer > 0) {
            interval = setInterval(() => {
                setDeleteTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [showDeleteConfirm, deleteStep, deleteTimer]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        // Only close if clicking the overlay (not the box)
        // AND not in the middle of deleting
        if (e.target === e.currentTarget && deleteStep !== 'deleting') {
            setShowDeleteConfirm(false);
            setDeletePin("");
            setDeleteError("");
            setDeleteStep('warning'); // Reset step
            setDeleteContext(null); // Reset target
        }
    };

    const handleCopyUtr = (utr: string) => {
        navigator.clipboard.writeText(utr);
        setCopiedUtr(utr);
        setTimeout(() => setCopiedUtr(null), 2000);
    };

    const proceedToPin = () => {
        if (deleteTimer === 0) {
            setDeleteStep('pin');
        }
    };

    const confirmDelete = async () => {
        if (deletePin !== EDIT_PIN) {
            setDeleteError("Incorrect PIN");
            return;
        }

        if (deleteContext) {
            await executeDelete(deleteContext.id, deleteContext.eventId);
        }
    };

    const executeDelete = async (regId: string, eventId: string) => {
        try {
            setDeleteStep('deleting');
            setDeleteError("");

            await deleteDoc(doc(db, "registrations", eventId, "teams", regId));

            // Clean up states
            setShowDeleteConfirm(false);
            setDeletePin("");
            setDeleteError("");
            setDeleteContext(null);

            // Refresh data
            window.location.reload();
        } catch (error) {
            console.error("Error deleting document:", error);
            setDeleteError("Failed to delete registration.");
            setDeleteStep('pin'); // Go back to PIN screen on error
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp?.seconds) return "N/A";
        return new Date(timestamp.seconds * 1000).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getExportData = (data: Registration[]) => {
        return data.map(r => {
            const baseData: any = {
                "ID": r.teamNumber,
                "Event": r.eventName,
                "College": r.collegeName,
                "Email": r.email,
            };

            // Add Member Details Columns
            const maxMembers = 5;
            for (let i = 0; i < maxMembers; i++) {
                const member = r.members[i];
                if (member) {
                    baseData[`M${i + 1} Name`] = member.name;
                    baseData[`M${i + 1} #`] = member.phone;
                } else {
                    baseData[`M${i + 1} Name`] = "";
                    baseData[`M${i + 1} #`] = "";
                }
            }

            // Optional Fields
            if (exportFields.fee) baseData["Fee"] = r.registrationFee;
            if (exportFields.utr) baseData["UTR"] = r.utrNumber;
            if (exportFields.status) baseData["Status"] = r.paymentStatus;
            if (exportFields.date) baseData["Date"] = formatDate(r.registeredAt).split(',')[0];

            return baseData;
        });
    };

    // Export to Excel
    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const exportDate = new Date().toISOString().split('T')[0];

        // Helper to process a batch of registrations for a sheet  
        const processSheet = (regs: Registration[], sheetName: string) => {
            const formattedData = getExportData(regs);
            const ws = XLSX.utils.json_to_sheet(formattedData);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        };

        if (selectedEvent === "all") {
            const grouped = registrations.reduce((acc, curr) => {
                const key = curr.eventName || "Unknown";
                if (!acc[key]) acc[key] = [];
                acc[key].push(curr);
                return acc;
            }, {} as Record<string, Registration[]>);

            Object.keys(grouped).forEach(eventName => {
                const safeName = eventName.replace(/[\[\]\*\/\\\?]/g, "").substring(0, 30);
                processSheet(grouped[eventName], safeName);
            });
        } else {
            processSheet(filteredRegistrations, "Registrations");
        }

        XLSX.writeFile(wb, `Shreshta_Registrations_${exportDate}.xlsx`);
        setShowExportModal(false);
    };

    // Export to PDF
    const exportToPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for more columns
        const exportDate = new Date().toISOString().split('T')[0];

        doc.setFontSize(18);
        doc.text("SHRESHTA 2026 - Registrations", 14, 20);
        doc.setFontSize(12);
        doc.text(`Generated on: ${exportDate}`, 14, 28);

        // Define Headers based on config
        const headers = ["ID", "College", "Email"];

        const maxMembers = 5;
        for (let i = 0; i < maxMembers; i++) {
            headers.push(`M${i + 1}`);
        }

        if (exportFields.fee) headers.push("Fee");
        if (exportFields.utr) headers.push("UTR");
        if (exportFields.status) headers.push("Status");

        const generateTable = (data: Registration[], startY: number) => {
            const tableRows = data.map(r => {
                const row = [
                    r.teamNumber.toString(),
                    r.collegeName,
                    r.email
                ];

                // Members
                for (let i = 0; i < maxMembers; i++) {
                    const m = r.members[i];
                    row.push(m ? `${m.name}\n${m.phone}` : "-");
                }

                if (exportFields.fee) row.push(r.registrationFee);
                if (exportFields.utr) row.push(r.utrNumber);
                if (exportFields.status) row.push(r.paymentStatus);

                return row;
            });

            autoTable(doc, {
                head: [headers],
                body: tableRows,
                startY: startY,
                theme: 'grid',
                styles: { fontSize: 7, cellPadding: 1 },
                headStyles: { fillColor: [212, 168, 67] },
                columnStyles: {
                    0: { cellWidth: 10 }, // ID
                    1: { cellWidth: 35 }, // College
                    2: { cellWidth: 35 }, // Email
                    // Members cols auto
                }
            });
            // @ts-ignore
            return doc.lastAutoTable.finalY + 10;
        };

        let lastY = 35;

        if (selectedEvent === "all") {
            const grouped = registrations.reduce((acc, curr) => {
                const key = curr.eventName || "Unknown";
                if (!acc[key]) acc[key] = [];
                acc[key].push(curr);
                return acc;
            }, {} as Record<string, Registration[]>);

            Object.keys(grouped).forEach(eventName => {
                if (lastY > 180) { // Landscape height check
                    doc.addPage();
                    lastY = 20;
                }

                doc.setFontSize(14);
                // @ts-ignore
                doc.setTextColor(212, 168, 67);
                doc.text(eventName, 14, lastY);
                // @ts-ignore
                doc.setTextColor(0, 0, 0);

                lastY = generateTable(grouped[eventName], lastY + 5);
            });
        } else {
            // @ts-ignore
            doc.setTextColor(212, 168, 67);
            const eventName = filteredRegistrations[0]?.eventName || "Event Details";
            doc.text(eventName, 14, lastY);
            // @ts-ignore
            doc.setTextColor(0, 0, 0);
            generateTable(filteredRegistrations, lastY + 5);
        }

        doc.save(`Shreshta_Registrations_${exportDate}.pdf`);
        setShowExportModal(false);
    };

    const handleExportClick = (type: 'excel' | 'pdf') => {
        setExportType(type);
        setShowExportModal(true);
    };

    // Open Modal Handler
    const handleRowClick = (reg: Registration) => {
        if (!editMode || (editMode && editingRow !== reg.id)) {
            setSelectedRegistration(reg);
            // If in edit mode, initialize edit data for the modal too
            if (editMode) {
                setEditingRow(reg.id);
                setEditData({ ...reg, members: [...reg.members.map(m => ({ ...m }))] });
            }
        }
    };

    const closeModal = () => {
        setSelectedRegistration(null);
        if (editMode) {
            cancelEditing();
        }
    };


    if (!isAuthenticated) {
        return null;
    }

    return (
        <>
            <style jsx>{`
                .dashboard {
                    min-height: 100vh;
                    background: #0a0a0c;
                    color: #fff;
                }

                .dashboard-header {
                    background: linear-gradient(180deg, #1a1a1f 0%, #141418 100%);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    padding: 20px 0;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }

                .header-inner {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .header-title {
                    font-size: 24px;
                    font-weight: 700;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .header-title span { color: #d4a843; }

                .header-actions { display: flex; align-items: center; gap: 12px; }

                .edit-btn {
                    padding: 10px 20px;
                    background: rgba(212, 168, 67, 0.1);
                    border: 1px solid rgba(212, 168, 67, 0.3);
                    border-radius: 10px;
                    color: #d4a843;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .edit-btn:hover { background: rgba(212, 168, 67, 0.2); }
                .edit-btn.active { background: rgba(212, 168, 67, 0.3); border-color: #d4a843; }

                .logout-btn {
                    padding: 10px 20px;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 10px;
                    color: #fca5a5;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .logout-btn:hover { background: rgba(239, 68, 68, 0.2); }

                .dashboard-content {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 32px 24px;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 32px;
                }

                .stat-card {
                    background: linear-gradient(180deg, #1a1a1f 0%, #141418 100%);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 24px;
                }

                .stat-label {
                    font-size: 13px;
                    color: #71717a;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 8px;
                }

                .stat-value { font-size: 36px; font-weight: 800; color: #fff; }
                .stat-card.gold .stat-value { color: #d4a843; }
                .stat-card.green .stat-value { color: #4ade80; }
                .stat-card.yellow .stat-value { color: #fbbf24; }

                .filter-section { margin-bottom: 24px; }
                .filter-label { font-size: 14px; color: #a1a1aa; margin-bottom: 12px; }

                .filter-select {
                    padding: 12px 16px;
                    background: #1a1a1f;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    color: #fff;
                    font-size: 15px;
                    min-width: 250px;
                    cursor: pointer;
                }

                .table-container {
                    background: linear-gradient(180deg, #1a1a1f 0%, #141418 100%);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    overflow: hidden;
                }

                .table-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .table-title { font-size: 18px; font-weight: 700; color: #fff; }
                .table-count { font-size: 14px; color: #d4a843; }

                .registrations-table { width: 100%; border-collapse: collapse; }

                .registrations-table th {
                    text-align: left;
                    padding: 14px 16px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #d4a843;
                    background: rgba(0, 0, 0, 0.3);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }

                .registrations-table td {
                    padding: 14px 16px;
                    font-size: 14px;
                    color: #a1a1aa;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                    vertical-align: top;
                }

                .registrations-table tr:hover td { background: rgba(255, 255, 255, 0.02); cursor: pointer; }

                /* Responsive Table Hiding */
                @media (max-width: 768px) {
                    .hide-mobile { display: none; }
                }

                .event-tag {
                    display: inline-block;
                    padding: 4px 10px;
                    background: rgba(212, 168, 67, 0.15);
                    border: 1px solid rgba(212, 168, 67, 0.3);
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    color: #d4a843;
                    white-space: nowrap;
                }

                .team-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, rgba(212, 168, 67, 0.2) 0%, rgba(212, 168, 67, 0.1) 100%);
                    border: 1px solid rgba(212, 168, 67, 0.3);
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 700;
                    color: #d4a843;
                }

                .college-name { color: #e4e4e7; font-weight: 500; }
                .email-text { font-size: 12px; color: #71717a; }
                .member-item { font-size: 12px; padding: 2px 0; }
                .member-name { color: #e4e4e7; }
                .member-phone { color: #71717a; margin-left: 8px; }

                .utr-number {
                    font-family: monospace;
                    font-size: 12px;
                    color: #a1a1aa;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 4px 8px;
                    border-radius: 4px;
                }

                .status-select {
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                }

                .status-pending { background: rgba(234, 179, 8, 0.15); color: #fbbf24; border: 1px solid rgba(234, 179, 8, 0.3); }
                .status-completed { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }

                /* Fix for dropdown options background */
                select option {
                    background-color: #1a1a1f;
                    color: #fff;
                    padding: 10px;
                }
                
                /* Specific colors for status options */
                .status-select option[value="pending"] { color: #fbbf24; }
                .status-select option[value="completed"] { color: #4ade80; }

                .date-text { font-size: 12px; color: #71717a; }

                .loading-container { display: flex; align-items: center; justify-content: center; padding: 80px 20px; }
                .loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid rgba(212, 168, 67, 0.2);
                    border-top-color: #d4a843;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin { to { transform: rotate(360deg); } }

                .empty-state { text-align: center; padding: 80px 20px; color: #71717a; }
                .mobile-scroll { overflow-x: auto; }

                /* Edit Mode Styles & Modal */
                .edit-input {
                    width: 100%;
                    padding: 8px 10px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(212, 168, 67, 0.3);
                    border-radius: 6px;
                    color: #fff;
                    font-size: 13px;
                    outline: none;
                }

                .edit-input:focus { border-color: #d4a843; }

                .edit-select {
                    width: 100%;
                    padding: 8px 10px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(212, 168, 67, 0.3);
                    border-radius: 6px;
                    color: #fff;
                    font-size: 13px;
                    cursor: pointer;
                }

                .action-btns { display: flex; gap: 8px; }
                .save-btn { padding: 6px 12px; background: rgba(34, 197, 94, 0.2); border: 1px solid rgba(34, 197, 94, 0.4); border-radius: 6px; color: #4ade80; font-size: 12px; font-weight: 600; cursor: pointer; }
                .cancel-btn { padding: 6px 12px; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 6px; color: #fca5a5; font-size: 12px; font-weight: 600; cursor: pointer; }
                .edit-row-btn { padding: 6px 12px; background: rgba(212, 168, 67, 0.2); border: 1px solid rgba(212, 168, 67, 0.4); border-radius: 6px; color: #d4a843; font-size: 12px; font-weight: 600; cursor: pointer; }

                /* Modal Overlay */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.85);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                    backdrop-filter: blur(8px);
                }

                .modal-box {
                    background: #141418;
                    border: 1px solid rgba(212, 168, 67, 0.2);
                    border-radius: 20px;
                    padding: 32px;
                    max-width: 700px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }

                .modal-close {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #71717a;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }
                .modal-close:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }

                .modal-title { font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 8px; padding-right: 20px; }
                .modal-subtitle { font-size: 14px; color: #71717a; margin-bottom: 24px; font-weight: 500;}
                .pin-input { width: 100%; padding: 16px; background: rgba(255, 255, 255, 0.05); border: 2px solid rgba(255, 255, 255, 0.1); border-radius: 12px; font-size: 24px; font-family: monospace; color: #fff; text-align: center; letter-spacing: 8px; outline: none; }
                .pin-input:focus { border-color: #d4a843; }
                .pin-error { color: #fca5a5; font-size: 14px; margin-top: 12px; }
                .modal-btns { display: flex; gap: 12px; margin-top: 24px; }
                .modal-btn { flex: 1; padding: 14px; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; border: none; }
                .modal-btn.primary { background: #d4a843; color: #000; }
                .modal-btn.secondary { background: rgba(255, 255, 255, 0.1); color: #fff; }
                .edit-mode-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(212, 168, 67, 0.2); border: 1px solid rgba(212, 168, 67, 0.4); border-radius: 6px; color: #d4a843; font-size: 12px; font-weight: 600; margin-left: 12px; }

                /* Details Styling */
                .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px; }
                .full-width { grid-column: 1 / -1; }
                
                .detail-group {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 16px;
                }
                
                .detail-label { 
                    font-size: 11px; 
                    color: #71717a; 
                    text-transform: uppercase; 
                    letter-spacing: 0.5px;
                    margin-bottom: 8px; 
                    font-weight: 600; 
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .detail-value { font-size: 15px; color: #fff; font-weight: 500; word-break: break-all; }
                
                .detail-value.highlight { color: #d4a843; font-size: 18px; font-weight: 700; }
                
                .member-chip {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 8px;
                    margin-bottom: 6px;
                }
                .member-chip:last-child { margin-bottom: 0; }
                .member-chip-name { font-weight: 500; font-size: 14px; }
                .member-chip-phone { font-size: 12px; color: #71717a; font-family: monospace; }

                .utr-display {
                    font-family: monospace;
                    background: rgba(0, 0, 0, 0.3);
                    padding: 8px 12px;
                    border-radius: 6px;
                    border: 1px dashed rgba(255, 255, 255, 0.1);
                    color: #d4a843;
                }

                @media (max-width: 768px) {
                    .header-title { font-size: 16px; width: auto; }
                    .header-title span:last-child { display: none; } /* Hide text logo on super small if needed, for now just edit mode badge */
                    .edit-mode-badge { display: none; }
                    .stats-grid { grid-template-columns: 1fr; gap: 12px; }
                    .filter-select { width: 100%; }
                    .header-actions { position: static; flex-direction: row; gap: 8px; }
                    .logout-btn { padding: 6px 10px; font-size: 12px; } 
                    .edit-btn {  padding: 6px 10px; font-size: 12px; }

                    .modal-grid { grid-template-columns: 1fr; gap: 16px; }
                    
                    /* Hide Desktop Table parts on Mobile */
                    .desktop-only, .desktop-table-body { display: none; }
                    
                    /* Show Mobile Body */
                    .mobile-only-body { display: table-row-group; }
                    
                    /* Adjust table for card view */
                    .registrations-table { display: block; }
                    .mobile-card-row { display: block; border-bottom: 1px solid rgba(255,255,255,0.08); }
                    .mobile-card-row:last-child { border-bottom: none; }
                }

                @media (min-width: 769px) {
                     .mobile-only-body { display: none; }
                }
            `}</style>

            {/* PIN Modal */}
            {showPinModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <button className="modal-close" onClick={() => { setShowPinModal(false); setPinInput(""); setPinError(""); }}>×</button>
                        <h3 className="modal-title">🔐 Enter Edit PIN</h3>
                        <p className="modal-subtitle">Enter 4-digit PIN to enable edit mode</p>
                        <input
                            type="password"
                            className="pin-input"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            placeholder="••••"
                            maxLength={4}
                            autoFocus
                        />
                        {pinError && <p className="pin-error">{pinError}</p>}
                        <div className="modal-btns">
                            <button className="modal-btn secondary" onClick={() => { setShowPinModal(false); setPinInput(""); setPinError(""); }}>
                                Cancel
                            </button>
                            <button className="modal-btn primary" onClick={handlePinSubmit}>
                                Unlock
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE Process Modals */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={handleBackdropClick}>
                    <div className="modal-box" style={{ maxWidth: '400px', border: '1px solid rgba(239, 68, 68, 0.4)', textAlign: 'center' }}>

                        {deleteStep === 'warning' && (
                            <>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                                <h3 className="modal-title" style={{ color: '#ef4444', justifyContent: 'center', padding: 0 }}>Permanently Delete?</h3>
                                <p className="modal-subtitle" style={{ color: '#fca5a5', marginBottom: '8px' }}>
                                    This action CANNOT be undone.
                                </p>
                                <p style={{ fontSize: '13px', color: '#71717a', marginBottom: '24px' }}>
                                    You are about to delete <b>{deleteContext?.teamNumber}</b> from <b>{deleteContext?.eventName}</b>.
                                </p>
                                <div className="modal-btns">
                                    <button className="modal-btn secondary" onClick={() => { setShowDeleteConfirm(false); setDeleteContext(null); }}>
                                        Cancel
                                    </button>
                                    <button
                                        className="modal-btn"
                                        onClick={proceedToPin}
                                        disabled={deleteTimer > 0}
                                        style={{
                                            background: deleteTimer > 0 ? 'rgba(239, 68, 68, 0.1)' : '#ef4444',
                                            color: deleteTimer > 0 ? '#71717a' : '#fff',
                                            cursor: deleteTimer > 0 ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {deleteTimer > 0 ? `Wait ${deleteTimer}s` : "Yes, Proceed"}
                                    </button>
                                </div>
                            </>
                        )}

                        {deleteStep === 'pin' && (
                            <>
                                <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>×</button>
                                <h3 className="modal-title" style={{ color: '#ef4444', justifyContent: 'center' }}>Enter PIN to Delete</h3>
                                <p className="modal-subtitle">Security verification required.</p>
                                <input
                                    type="password"
                                    className="pin-input"
                                    value={deletePin}
                                    onChange={(e) => setDeletePin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                    placeholder="••••"
                                    maxLength={4}
                                    autoFocus
                                    style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}
                                />
                                {deleteError && <p className="pin-error">{deleteError}</p>}
                                <div className="modal-btns">
                                    <button className="modal-btn secondary" onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeletePin("");
                                        setDeleteError("");
                                        setDeleteStep('warning');
                                    }}>
                                        Cancel
                                    </button>
                                    <button
                                        className="modal-btn"
                                        onClick={confirmDelete}
                                        style={{ background: '#ef4444', color: '#fff' }}
                                    >
                                        DELETE NOW
                                    </button>
                                </div>
                            </>
                        )}

                        {deleteStep === 'deleting' && (
                            <div style={{ padding: '20px 0' }}>
                                <div className="loading-spinner" style={{ margin: '0 auto 20px', borderColor: 'rgba(239, 68, 68, 0.2)', borderTopColor: '#ef4444' }} />
                                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ef4444' }}>Deleting Registration...</h3>
                                <p style={{ fontSize: '13px', color: '#71717a', marginTop: '8px' }}>Please wait, this may take a moment.</p>
                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* Details Modal */}
            {selectedRegistration && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <button className="modal-close" onClick={closeModal}>×</button>
                        <h3 className="modal-title">
                            {editMode ? "Edit Registration" : "Registration Details"}
                        </h3>

                        {editMode && editData ? (
                            <div className="edit-form-container">
                                <div className="detail-row">
                                    <div className="detail-label">Event</div>
                                    <select
                                        className="edit-select"
                                        value={editData.eventId}
                                        onChange={(e) => handleEventChange(e.target.value)}
                                    >
                                        {allEvents.map((event) => (
                                            <option key={event.id} value={event.id}>
                                                {event.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="detail-row">
                                    <div className="detail-label">College</div>
                                    <input
                                        type="text"
                                        className="edit-input"
                                        value={editData.collegeName}
                                        onChange={(e) => updateEditField("collegeName", e.target.value)}
                                    />
                                </div>
                                <div className="detail-row">
                                    <div className="detail-label">Team Members</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {editData.members?.map((member, idx) => (
                                            <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    type="text"
                                                    className="edit-input"
                                                    value={member.name}
                                                    onChange={(e) => updateEditMember(idx, "name", e.target.value)}
                                                    placeholder="Name"
                                                    style={{ flex: 1 }}
                                                />
                                                <input
                                                    type="text"
                                                    className="edit-input"
                                                    value={member.phone}
                                                    onChange={(e) => updateEditMember(idx, "phone", e.target.value)}
                                                    placeholder="Phone"
                                                    style={{ width: '120px' }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="detail-row">
                                    <div className="detail-label">UTR Number</div>
                                    <input
                                        type="text"
                                        className="edit-input"
                                        value={editData.utrNumber}
                                        onChange={(e) => updateEditField("utrNumber", e.target.value)}
                                    />
                                </div>
                                <div className="detail-row">
                                    <div className="detail-label">Payment Status</div>
                                    <select
                                        className={`edit-select`}
                                        value={editData.paymentStatus}
                                        onChange={(e) => updateEditField("paymentStatus", e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="completed">Verified</option>
                                    </select>
                                </div>
                                <div className="modal-btns" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                    <button
                                        className="modal-btn"
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            color: '#fca5a5',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            fontSize: '12px',
                                            padding: '8px 12px',
                                            flex: 'unset',
                                            width: 'auto'
                                        }}
                                        onClick={() => editData && handleDeleteRequest(editData)}
                                    >
                                        Delete
                                    </button>
                                    <div style={{ display: 'flex', gap: '12px', flex: 1, justifyContent: 'flex-end' }}>
                                        <button className="modal-btn secondary" onClick={closeModal} style={{ flex: 'unset', width: '100px' }}>Cancel</button>
                                        <button className="modal-btn primary" onClick={saveEdits} style={{ flex: 'unset', width: '140px' }}>Save Changes</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="details-container">
                                <div className="modal-grid">
                                    {/* Team ID */}
                                    <div className="detail-group">
                                        <div className="detail-label">
                                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                            </svg>
                                            Team ID
                                        </div>
                                        <div className="detail-value highlight">#{selectedRegistration.teamNumber}</div>
                                    </div>

                                    {/* Registration Date */}
                                    <div className="detail-group">
                                        <div className="detail-label">
                                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Registration Date
                                        </div>
                                        <div className="detail-value">{formatDate(selectedRegistration.registeredAt)}</div>
                                    </div>

                                    {/* Event - Full Width */}
                                    <div className="detail-group full-width">
                                        <div className="detail-label">
                                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                            </svg>
                                            Event Name
                                        </div>
                                        <div className="detail-value" style={{ fontSize: '18px', fontWeight: '600' }}>
                                            {selectedRegistration.eventName}
                                        </div>
                                    </div>

                                    {/* College */}
                                    <div className="detail-group">
                                        <div className="detail-label">
                                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            College
                                        </div>
                                        <div className="detail-value">{selectedRegistration.collegeName}</div>
                                    </div>

                                    {/* Email */}
                                    <div className="detail-group">
                                        <div className="detail-label">
                                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            Contact Email
                                        </div>
                                        <div className="detail-value">{selectedRegistration.email}</div>
                                    </div>

                                    {/* Members - Full Width */}
                                    <div className="detail-group full-width">
                                        <div className="detail-label">
                                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            Team Members
                                        </div>
                                        <div className="members-grid">
                                            {selectedRegistration.members?.map((m, i) => (
                                                <div key={i} className="member-chip">
                                                    <span className="member-chip-name">{m.name}</span>
                                                    <span className="member-chip-phone">{m.phone}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Payment Section - Full Width Grid */}
                                    <div className="detail-group full-width" style={{ background: 'rgba(212, 168, 67, 0.05)', borderColor: 'rgba(212, 168, 67, 0.2)' }}>
                                        <div className="modal-grid" style={{ marginTop: 0 }}>
                                            {/* Fee */}
                                            <div>
                                                <div className="detail-label">Registration Fee</div>
                                                <div className="detail-value" style={{ fontSize: '20px', color: '#d4a843' }}>{selectedRegistration.registrationFee}</div>
                                            </div>

                                            {/* UTR */}
                                            <div>
                                                <div className="detail-label">UTR Number</div>
                                                <div className="utr-display" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                                                    <span>{selectedRegistration.utrNumber}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCopyUtr(selectedRegistration.utrNumber);
                                                        }}
                                                        style={{
                                                            background: 'rgba(255, 255, 255, 0.1)',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            padding: '4px 8px',
                                                            color: copiedUtr === selectedRegistration.utrNumber ? '#4ade80' : '#a1a1aa',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            fontSize: '11px',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        title="Copy UTR"
                                                    >
                                                        {copiedUtr === selectedRegistration.utrNumber ? (
                                                            <>
                                                                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                Copied!
                                                            </>
                                                        ) : (
                                                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                                {selectedRegistration.screenshotUrl && (
                                                    <a
                                                        href={selectedRegistration.screenshotUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            marginTop: '12px',
                                                            fontSize: '13px',
                                                            color: '#d4a843',
                                                            textDecoration: 'none',
                                                            fontWeight: 600,
                                                            background: 'rgba(212, 168, 67, 0.1)',
                                                            padding: '6px 12px',
                                                            borderRadius: '6px'
                                                        }}
                                                    >
                                                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        View Screenshot
                                                    </a>
                                                )}
                                            </div>

                                            {/* Status */}
                                            <div className="full-width" style={{ marginTop: '10px' }}>
                                                <div className="detail-label">Payment Status</div>
                                                <select
                                                    className={`status-select ${selectedRegistration.paymentStatus === "completed" ? "status-completed" : "status-pending"}`}
                                                    value={selectedRegistration.paymentStatus}
                                                    onChange={(e) => updatePaymentStatus(selectedRegistration.eventId, selectedRegistration.id, e.target.value)}
                                                    style={{ width: '100%', padding: '12px' }}
                                                >
                                                    <option value="pending">⚠️ Pending Verification</option>
                                                    <option value="completed">✅ Verified</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Export Options Modal */}
            {showExportModal && (
                <div className="modal-overlay">
                    <div className="modal-box" style={{ maxWidth: '400px' }}>
                        <button className="modal-close" onClick={() => setShowExportModal(false)}>×</button>
                        <h3 className="modal-title">Export Options</h3>
                        <p className="modal-subtitle">Select fields to include in the {exportType.toUpperCase()} file.</p>

                        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                            <div className="detail-group" style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>
                                <input type="checkbox" checked={true} disabled style={{ marginRight: '10px' }} />
                                Basic Info (ID, Event, College, Email, Members)
                            </div>

                            <label className="detail-group" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={exportFields.fee}
                                    onChange={(e) => setExportFields({ ...exportFields, fee: e.target.checked })}
                                    style={{ marginRight: '10px' }}
                                />
                                Registration Fee
                            </label>

                            <label className="detail-group" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={exportFields.utr}
                                    onChange={(e) => setExportFields({ ...exportFields, utr: e.target.checked })}
                                    style={{ marginRight: '10px' }}
                                />
                                UTR Number
                            </label>

                            <label className="detail-group" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={exportFields.status}
                                    onChange={(e) => setExportFields({ ...exportFields, status: e.target.checked })}
                                    style={{ marginRight: '10px' }}
                                />
                                Payment Status
                            </label>

                            <label className="detail-group" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={exportFields.date}
                                    onChange={(e) => setExportFields({ ...exportFields, date: e.target.checked })}
                                    style={{ marginRight: '10px' }}
                                />
                                Registration Date
                            </label>
                        </div>

                        <div className="modal-btns">
                            <button className="modal-btn secondary" onClick={() => setShowExportModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="modal-btn primary"
                                onClick={exportType === 'excel' ? exportToExcel : exportToPDF}
                            >
                                Download {exportType.toUpperCase()}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="dashboard">
                <header className="dashboard-header">
                    <div className="header-inner">
                        <h1 className="header-title">
                            <svg width="28" height="28" fill="none" stroke="#d4a843" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                            </svg>
                            <span>SHRESHTA</span> Admin
                            {editMode && <span className="edit-mode-badge">✏️ Edit Mode</span>}
                        </h1>
                        <div className="header-actions">
                            <button
                                className={`edit-btn ${editMode ? 'active' : ''}`}
                                onClick={() => editMode ? setEditMode(false) : setShowPinModal(true)}
                            >
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                {editMode ? "Exit" : "Edit"}
                            </button>
                            <button className="logout-btn" onClick={handleLogout}>
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                <div className="dashboard-content">
                    {/* Stats */}
                    <div className="stats-grid">
                        <div className="stat-card gold">
                            <div className="stat-label">Total Registrations</div>
                            <div className="stat-value">{stats.total}</div>
                        </div>
                        <div className="stat-card yellow">
                            <div className="stat-label">Pending Verification</div>
                            <div className="stat-value">{stats.pending}</div>
                        </div>
                        <div className="stat-card green">
                            <div className="stat-label">Verified Payments</div>
                            <div className="stat-value">{stats.verified}</div>
                        </div>
                    </div>

                    {/* Filter */}
                    <div className="filter-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <div className="filter-label">Filter by Event:</div>
                            <select
                                className="filter-select"
                                value={selectedEvent}
                                onChange={(e) => setSelectedEvent(e.target.value)}
                            >
                                <option value="all">All Events</option>
                                {allEvents.map((event) => (
                                    <option key={event.id} value={event.id}>
                                        {event.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => handleExportClick('excel')}
                                style={{
                                    padding: '10px 16px',
                                    background: '#107c41',
                                    border: '1px solid #107c41',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Excel
                            </button>
                            <button
                                onClick={() => handleExportClick('pdf')}
                                style={{
                                    padding: '10px 16px',
                                    background: '#b91c1c',
                                    border: '1px solid #b91c1c',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                PDF
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="table-container">
                        <div className="table-header">
                            <h2 className="table-title">Registrations</h2>
                            <span className="table-count">{filteredRegistrations.length} teams</span>
                        </div>

                        {loading ? (
                            <div className="loading-container">
                                <div className="loading-spinner" />
                            </div>
                        ) : filteredRegistrations.length === 0 ? (
                            <div className="empty-state">
                                <p>No registrations found</p>
                            </div>
                        ) : (
                            <div className="mobile-scroll">
                                <table className="registrations-table">
                                    <thead className="desktop-only">
                                        <tr>
                                            <th>#</th>
                                            <th>Event</th>
                                            <th>College</th>
                                            <th>Email</th>
                                            <th>Members</th>
                                            <th>Fee</th>
                                            <th>UTR Number</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="desktop-table-body">
                                        {filteredRegistrations.map((reg) => {
                                            return (
                                                <tr key={`${reg.eventId}-${reg.id}`} onClick={() => handleRowClick(reg)}>
                                                    <td>
                                                        <span className="team-badge">{reg.teamNumber}</span>
                                                    </td>
                                                    <td>
                                                        <span className="event-tag">{reg.eventName}</span>
                                                    </td>
                                                    <td>
                                                        <span className="college-name">{reg.collegeName}</span>
                                                    </td>
                                                    <td>
                                                        <span className="email-text">{reg.email}</span>
                                                    </td>
                                                    <td>
                                                        {reg.members?.map((member, idx) => (
                                                            <div key={idx} className="member-item">
                                                                <span className="member-name">{member.name}</span>
                                                                <span className="member-phone">{member.phone}</span>
                                                            </div>
                                                        ))}
                                                    </td>
                                                    <td>{reg.registrationFee}</td>
                                                    <td>
                                                        <span className="utr-number">{reg.utrNumber}</span>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`status-select ${reg.paymentStatus === "completed" ? "status-completed" : "status-pending"}`}
                                                            style={{ padding: '6px 10px', display: 'inline-block' }}
                                                        >
                                                            {reg.paymentStatus === "completed" ? "Verified" : "Pending"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="date-text">{formatDate(reg.registeredAt)}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    {/* Mobile View - Cards Logic */}
                                    <tbody className="mobile-only-body">
                                        {filteredRegistrations.map((reg) => (
                                            <tr key={`${reg.eventId}-${reg.id}-mobile`} onClick={() => handleRowClick(reg)} className="mobile-card-row">
                                                <td style={{ display: 'block', width: '100%', padding: '16px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                        <span className="team-badge">{reg.teamNumber}</span>
                                                        <span
                                                            className={`status-select ${reg.paymentStatus === "completed" ? "status-completed" : "status-pending"}`}
                                                            style={{ padding: '4px 8px', fontSize: '11px' }}
                                                        >
                                                            {reg.paymentStatus === "completed" ? "Verified" : "Pending"}
                                                        </span>
                                                    </div>

                                                    <div style={{ marginBottom: '8px' }}>
                                                        <span className="event-tag" style={{ fontSize: '12px' }}>{reg.eventName}</span>
                                                    </div>

                                                    <div style={{ marginBottom: '4px', fontWeight: 500, color: '#fff' }}>
                                                        {reg.collegeName}
                                                    </div>
                                                    <div style={{ marginBottom: '12px', fontSize: '12px', color: '#71717a' }}>
                                                        {reg.email}
                                                    </div>

                                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px' }}>
                                                        {reg.members?.map((member, idx) => (
                                                            <div key={idx} className="member-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span className="member-name" style={{ fontSize: '13px' }}>{member.name}</span>
                                                                <span className="member-phone">{member.phone}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

"use client";

import { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendAlertEmail } from "@/lib/emailService";
import { Registration } from "@/types/admin";

interface AlertPanelProps {
    registrations: Registration[];
    onClose: () => void;
}

const TEMPLATES = [
    {
        id: "reminder_30",
        label: "⏰ 30 Minutes Reminder",
        subject: "⏰ Event starts in 30 minutes!",
        message: "Your event is starting in 30 minutes! Please make sure you are at the venue. Don't forget to carry your College ID card and show the QR code at the entry gate. See you there! 🎉"
    },
    {
        id: "reminder_1hr",
        label: "⏰ 1 Hour Reminder",
        subject: "⏰ Event starts in 1 hour!",
        message: "Your event is starting in 1 hour! Please plan your arrival accordingly. Make sure you have your College ID and registration QR code ready. We can't wait to see you! 🚀"
    },
    {
        id: "venue_update",
        label: "📍 Venue Update",
        subject: "📍 Venue Update — Important",
        message: "There has been a change in venue for your event. Please check the updated venue details on our website. Contact the event coordinator if you have any questions."
    },
    {
        id: "custom",
        label: "✏️ Custom Message",
        subject: "",
        message: ""
    }
];

export default function AlertPanel({ registrations, onClose }: AlertPanelProps) {
    const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
    const [subject, setSubject] = useState(TEMPLATES[0].subject);
    const [message, setMessage] = useState(TEMPLATES[0].message);
    const [targetEvent, setTargetEvent] = useState<string>("all");
    const [onlyVerified, setOnlyVerified] = useState(true);
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ success: boolean; count: number } | null>(null);

    const handleTemplateChange = (templateId: string) => {
        const template = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];
        setSelectedTemplate(template);
        if (template.id !== "custom") {
            setSubject(template.subject);
            setMessage(template.message);
        }
    };

    const getRecipients = () => {
        let filtered = registrations;
        if (targetEvent !== "all") {
            filtered = filtered.filter(r => r.eventId === targetEvent);
        }
        if (onlyVerified) {
            filtered = filtered.filter(r => r.paymentStatus === "completed");
        }
        // Get unique emails
        const emails = [...new Set(filtered.map(r => r.email).filter(Boolean))];
        return { emails, count: filtered.length };
    };

    const handleSend = async () => {
        if (!subject.trim() || !message.trim()) {
            alert("Please fill in both subject and message.");
            return;
        }

        const { emails } = getRecipients();
        if (emails.length === 0) {
            alert("No recipients found with the current filters.");
            return;
        }

        const confirmed = confirm(`Send alert to ${emails.length} email(s)?`);
        if (!confirmed) return;

        setSending(true);
        setResult(null);

        try {
            // Determine event name for email
            const eventName = targetEvent === "all"
                ? "SHRESHTA 2026"
                : registrations.find(r => r.eventId === targetEvent)?.eventName || "SHRESHTA 2026";

            const success = await sendAlertEmail({
                to: emails,
                eventName,
                subject: subject,
                message: message,
            });

            // Log notification to Firestore
            await addDoc(collection(db, "notifications"), {
                subject,
                message,
                eventFilter: targetEvent,
                recipientCount: emails.length,
                sentAt: Timestamp.now(),
                success,
            });

            setResult({ success, count: emails.length });
        } catch (error) {
            console.error("Failed to send alert:", error);
            setResult({ success: false, count: 0 });
        } finally {
            setSending(false);
        }
    };

    const { emails, count } = getRecipients();

    // Get unique events from registrations
    const uniqueEvents = [...new Map(registrations.map(r => [r.eventId, r.eventName])).entries()];

    return (
        <div className="modal-overlay">
            <div className="modal-box" style={{ maxWidth: '560px' }}>
                <button className="modal-close" onClick={onClose}>×</button>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    📢 Send Alert / Notification
                </h3>

                {/* Template Selection */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ color: '#a1a1aa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Template</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {TEMPLATES.map(t => (
                            <button
                                key={t.id}
                                onClick={() => handleTemplateChange(t.id)}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: selectedTemplate.id === t.id ? '1px solid #d4a843' : '1px solid rgba(255,255,255,0.1)',
                                    background: selectedTemplate.id === t.id ? 'rgba(212,168,67,0.15)' : 'rgba(255,255,255,0.03)',
                                    color: selectedTemplate.id === t.id ? '#d4a843' : '#a1a1aa',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Target Event */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ color: '#a1a1aa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Send To</label>
                    <select
                        value={targetEvent}
                        onChange={(e) => setTargetEvent(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#e4e4e7',
                            fontSize: '14px'
                        }}
                    >
                        <option value="all">All Events</option>
                        {uniqueEvents.map(([id, name]) => (
                            <option key={id} value={id}>{name}</option>
                        ))}
                    </select>
                </div>

                {/* Verified Only Toggle */}
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                        type="checkbox"
                        checked={onlyVerified}
                        onChange={(e) => setOnlyVerified(e.target.checked)}
                        id="verified-only"
                        style={{ accentColor: '#d4a843' }}
                    />
                    <label htmlFor="verified-only" style={{ color: '#a1a1aa', fontSize: '13px' }}>
                        Only verified participants
                    </label>
                    <span style={{ marginLeft: 'auto', color: '#d4a843', fontSize: '13px', fontWeight: 600 }}>
                        {emails.length} recipient(s)
                    </span>
                </div>

                {/* Subject */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ color: '#a1a1aa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Subject</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Email subject..."
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#e4e4e7',
                            fontSize: '14px'
                        }}
                    />
                </div>

                {/* Message */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ color: '#a1a1aa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Message</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        rows={5}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#e4e4e7',
                            fontSize: '14px',
                            resize: 'vertical',
                            lineHeight: '1.5'
                        }}
                    />
                </div>

                {/* Result */}
                {result && (
                    <div style={{
                        marginBottom: '16px',
                        padding: '12px',
                        borderRadius: '8px',
                        background: result.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${result.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        color: result.success ? '#34d399' : '#f87171',
                        fontSize: '14px'
                    }}>
                        {result.success
                            ? `✅ Alert sent successfully to ${result.count} recipient(s)!`
                            : '❌ Failed to send alert. Please try again.'}
                    </div>
                )}

                {/* Send Button */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            color: '#a1a1aa',
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending || emails.length === 0}
                        style={{
                            flex: 2,
                            padding: '12px',
                            background: sending ? 'rgba(212,168,67,0.3)' : 'linear-gradient(135deg, #d4a843, #b88a2e)',
                            border: 'none',
                            borderRadius: '10px',
                            color: '#000',
                            fontSize: '15px',
                            fontWeight: 700,
                            cursor: sending || emails.length === 0 ? 'not-allowed' : 'pointer',
                            opacity: emails.length === 0 ? 0.5 : 1
                        }}
                    >
                        {sending ? '⏳ Sending...' : `📢 Send to ${emails.length} Recipient(s)`}
                    </button>
                </div>
            </div>
        </div>
    );
}

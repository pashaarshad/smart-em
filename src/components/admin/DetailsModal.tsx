"use client";

import { Registration, Member, Event } from "@/types/admin";
import { formatDate } from "@/lib/admin/export";

interface DetailsModalProps {
    registration: Registration;
    editMode: boolean;
    editData: Registration | null;
    allEvents: Event[];
    copiedUtr: string | null;
    onClose: () => void;
    onSave: () => void;
    onDelete: (reg: Registration) => void;
    onUpdateField: (field: keyof Registration, value: any) => void;
    onUpdateMember: (index: number, field: keyof Member, value: string) => void;
    onEventChange: (eventId: string) => void;
    onCopyUtr: (utr: string) => void;
    onUpdateStatus: (eventId: string, id: string, status: string) => void;
}

export default function DetailsModal({
    registration,
    editMode,
    editData,
    allEvents,
    copiedUtr,
    onClose,
    onSave,
    onDelete,
    onUpdateField,
    onUpdateMember,
    onEventChange,
    onCopyUtr,
    onUpdateStatus
}: DetailsModalProps) {
    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <button className="modal-close" onClick={onClose}>×</button>
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
                                onChange={(e) => onEventChange(e.target.value)}
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
                                onChange={(e) => onUpdateField("collegeName", e.target.value)}
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
                                            onChange={(e) => onUpdateMember(idx, "name", e.target.value)}
                                            placeholder="Name"
                                            style={{ flex: 1 }}
                                        />
                                        <input
                                            type="text"
                                            className="edit-input"
                                            value={member.phone}
                                            onChange={(e) => onUpdateMember(idx, "phone", e.target.value)}
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
                                onChange={(e) => onUpdateField("utrNumber", e.target.value)}
                            />
                        </div>
                        <div className="detail-row">
                            <div className="detail-label">Payment Status</div>
                            <select
                                className={`edit-select`}
                                value={editData.paymentStatus}
                                onChange={(e) => onUpdateField("paymentStatus", e.target.value)}
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
                                onClick={() => editData && onDelete(editData)}
                            >
                                Delete
                            </button>
                            <div style={{ display: 'flex', gap: '12px', flex: 1, justifyContent: 'flex-end' }}>
                                <button className="modal-btn secondary" onClick={onClose} style={{ flex: 'unset', width: '100px' }}>Cancel</button>
                                <button className="modal-btn primary" onClick={onSave} style={{ flex: 'unset', width: '140px' }}>Save Changes</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="details-container">
                        <div className="modal-grid">
                            <div className="detail-group">
                                <div className="detail-label">Team ID</div>
                                <div className="detail-value highlight">#{registration.teamNumber}</div>
                            </div>

                            <div className="detail-group">
                                <div className="detail-label">Registration Date</div>
                                <div className="detail-value">{formatDate(registration.registeredAt)}</div>
                            </div>

                            <div className="detail-group full-width">
                                <div className="detail-label">Event Name</div>
                                <div className="detail-value" style={{ fontSize: '18px', fontWeight: '600' }}>
                                    {registration.eventName}
                                </div>
                            </div>

                            <div className="detail-group">
                                <div className="detail-label">College</div>
                                <div className="detail-value">{registration.collegeName}</div>
                            </div>

                            <div className="detail-group">
                                <div className="detail-label">Contact Email</div>
                                <div className="detail-value">{registration.email}</div>
                            </div>

                            <div className="detail-group full-width">
                                <div className="detail-label">Team Members</div>
                                <div className="members-grid">
                                    {registration.members?.map((m, i) => (
                                        <div key={i} className="member-chip">
                                            <span className="member-chip-name">{m.name}</span>
                                            <span className="member-chip-phone">{m.phone}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="detail-group full-width" style={{ background: 'rgba(212, 168, 67, 0.05)', borderColor: 'rgba(212, 168, 67, 0.2)' }}>
                                <div className="modal-grid" style={{ marginTop: 0 }}>
                                    <div>
                                        <div className="detail-label">Registration Fee</div>
                                        <div className="detail-value" style={{ fontSize: '20px', color: '#d4a843' }}>{registration.registrationFee}</div>
                                    </div>

                                    <div>
                                        <div className="detail-label">UTR Number</div>
                                        <div className="utr-display" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                                            <span>{registration.utrNumber}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onCopyUtr(registration.utrNumber);
                                                }}
                                                className="copy-btn"
                                            >
                                                {copiedUtr === registration.utrNumber ? "Copied!" : "Copy"}
                                            </button>
                                        </div>
                                        {registration.screenshotUrl && (
                                            <a href={registration.screenshotUrl} target="_blank" rel="noopener noreferrer" className="screenshot-link">
                                                View Screenshot
                                            </a>
                                        )}
                                    </div>

                                    <div className="full-width" style={{ marginTop: '10px' }}>
                                        <div className="detail-label">Payment Status</div>
                                        <select
                                            className={`status-select ${registration.paymentStatus === "completed" ? "status-completed" : "status-pending"}`}
                                            value={registration.paymentStatus}
                                            onChange={(e) => onUpdateStatus(registration.eventId, registration.id, e.target.value)}
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
    );
}

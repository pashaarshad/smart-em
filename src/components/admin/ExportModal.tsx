"use client";

interface ExportModalProps {
    show: boolean;
    exportType: 'excel' | 'pdf';
    exportFields: {
        fee: boolean;
        utr: boolean;
        status: boolean;
        date: boolean;
    };
    onClose: () => void;
    onFieldChange: (field: string, value: boolean) => void;
    onDownload: () => void;
}

export default function ExportModal({ show, exportType, exportFields, onClose, onFieldChange, onDownload }: ExportModalProps) {
    if (!show) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-box" style={{ maxWidth: '400px' }}>
                <button className="modal-close" onClick={onClose}>×</button>
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
                            onChange={(e) => onFieldChange("fee", e.target.checked)}
                            style={{ marginRight: '10px' }}
                        />
                        Registration Fee
                    </label>

                    <label className="detail-group" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={exportFields.utr}
                            onChange={(e) => onFieldChange("utr", e.target.checked)}
                            style={{ marginRight: '10px' }}
                        />
                        UTR Number
                    </label>

                    <label className="detail-group" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={exportFields.status}
                            onChange={(e) => onFieldChange("status", e.target.checked)}
                            style={{ marginRight: '10px' }}
                        />
                        Payment Status
                    </label>

                    <label className="detail-group" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={exportFields.date}
                            onChange={(e) => onFieldChange("date", e.target.checked)}
                            style={{ marginRight: '10px' }}
                        />
                        Registration Date
                    </label>
                </div>

                <div className="modal-btns">
                    <button className="modal-btn secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="modal-btn primary" onClick={onDownload}>
                        Download {exportType.toUpperCase()}
                    </button>
                </div>
            </div>
        </div>
    );
}

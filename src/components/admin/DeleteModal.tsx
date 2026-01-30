"use client";

import { useState, useEffect } from "react";

interface DeleteModalProps {
    onClose: () => void;
    onConfirm: (pin: string) => void;
    context: {
        teamNumber: number;
        eventName: string;
    } | null;
    isDeleting: boolean;
    error: string;
}

export default function DeleteModal({ onClose, onConfirm, context, isDeleting, error }: DeleteModalProps) {
    const [step, setStep] = useState<'warning' | 'pin'>('warning');
    const [timer, setTimer] = useState(5);
    const [pin, setPin] = useState("");

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 'warning' && timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    if (isDeleting) {
        return (
            <div className="modal-overlay">
                <div className="modal-box" style={{ maxWidth: '400px', textAlign: 'center' }}>
                    <div style={{ padding: '20px 0' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto 20px', borderColor: 'rgba(239, 68, 68, 0.2)', borderTopColor: '#ef4444' }} />
                        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ef4444' }}>Deleting Registration...</h3>
                        <p style={{ fontSize: '13px', color: '#71717a', marginTop: '8px' }}>Please wait, this may take a moment.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: '400px', border: '1px solid rgba(239, 68, 68, 0.4)', textAlign: 'center' }}>
                {step === 'warning' ? (
                    <>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                        <h3 className="modal-title" style={{ color: '#ef4444', justifyContent: 'center', padding: 0 }}>Permanently Delete?</h3>
                        <p className="modal-subtitle" style={{ color: '#fca5a5', marginBottom: '8px' }}>
                            This action CANNOT be undone.
                        </p>
                        <p style={{ fontSize: '13px', color: '#71717a', marginBottom: '24px' }}>
                            You are about to delete <b>{context?.teamNumber}</b> from <b>{context?.eventName}</b>.
                        </p>
                        <div className="modal-btns">
                            <button className="modal-btn secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                className="modal-btn"
                                onClick={() => timer === 0 && setStep('pin')}
                                disabled={timer > 0}
                                style={{
                                    background: timer > 0 ? 'rgba(239, 68, 68, 0.1)' : '#ef4444',
                                    color: timer > 0 ? '#71717a' : '#fff',
                                    cursor: timer > 0 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {timer > 0 ? `Wait ${timer}s` : "Yes, Proceed"}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <button className="modal-close" onClick={onClose}>×</button>
                        <h3 className="modal-title" style={{ color: '#ef4444', justifyContent: 'center' }}>Enter PIN to Delete</h3>
                        <p className="modal-subtitle">Security verification required.</p>
                        <input
                            type="password"
                            className="pin-input"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            placeholder="••••"
                            maxLength={4}
                            autoFocus
                            style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}
                        />
                        {error && <p className="pin-error">{error}</p>}
                        <div className="modal-btns">
                            <button className="modal-btn secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                className="modal-btn"
                                onClick={() => onConfirm(pin)}
                                style={{ background: '#ef4444', color: '#fff' }}
                            >
                                DELETE NOW
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

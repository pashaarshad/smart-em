"use client";

import { useState } from "react";

interface PinModalProps {
    onClose: () => void;
    onSubmit: (pin: string) => void;
    title: string;
    subtitle: string;
}

export default function PinModal({ onClose, onSubmit, title, subtitle }: PinModalProps) {
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = () => {
        onSubmit(pin);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <button className="modal-close" onClick={onClose}>×</button>
                <h3 className="modal-title">🔐 {title}</h3>
                <p className="modal-subtitle">{subtitle}</p>
                <input
                    type="password"
                    className="pin-input"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="••••"
                    maxLength={4}
                    autoFocus
                />
                {error && <p className="pin-error">{error}</p>}
                <div className="modal-btns">
                    <button className="modal-btn secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="modal-btn primary" onClick={handleSubmit}>
                        Unlock
                    </button>
                </div>
            </div>
        </div>
    );
}

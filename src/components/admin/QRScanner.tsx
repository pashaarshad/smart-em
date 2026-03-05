"use client";

import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";

interface QRScannerProps {
    onScan: (data: string) => void;
    onError?: (error: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(() => { });
            }
        };
    }, []);

    const startScanner = () => {
        setIsScanning(true);

        setTimeout(() => {
            scannerRef.current = new Html5QrcodeScanner(
                "qr-reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
                    rememberLastUsedCamera: true,
                },
                false
            );

            scannerRef.current.render(
                (decodedText) => {
                    onScan(decodedText);
                    if (scannerRef.current) {
                        scannerRef.current.clear().catch(() => { });
                    }
                    setIsScanning(false);
                },
                (errorMessage) => {
                    // Ignore continuous scan errors
                }
            );
        }, 100);
    };

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(() => { });
            scannerRef.current = null;
        }
        setIsScanning(false);
    };

    return (
        <div>
            {!isScanning ? (
                <button
                    onClick={startScanner}
                    style={{
                        width: "100%",
                        padding: "20px",
                        background: "linear-gradient(135deg, #d4a843 0%, #b88a2e 100%)",
                        border: "none",
                        borderRadius: "14px",
                        color: "#000",
                        fontSize: "18px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                    }}
                >
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    Start QR Scanner
                </button>
            ) : (
                <div>
                    <div
                        id="qr-reader"
                        style={{
                            borderRadius: "14px",
                            overflow: "hidden",
                            border: "2px solid rgba(212,168,67,0.3)",
                        }}
                    />
                    <button
                        onClick={stopScanner}
                        style={{
                            width: "100%",
                            marginTop: "12px",
                            padding: "14px",
                            background: "rgba(239,68,68,0.15)",
                            border: "1px solid rgba(239,68,68,0.3)",
                            borderRadius: "12px",
                            color: "#f87171",
                            fontSize: "15px",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        Stop Scanner
                    </button>
                </div>
            )}
        </div>
    );
}

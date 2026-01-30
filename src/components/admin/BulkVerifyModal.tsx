"use client";

import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Registration } from "@/types/admin";

// Set worker to local path or CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface BulkVerifyModalProps {
    pendingRegistrations: Registration[];
    onClose: () => void;
    onVerify: (matchedIds: { id: string, eventId: string }[]) => Promise<void>;
}

export default function BulkVerifyModal({ pendingRegistrations, onClose, onVerify }: BulkVerifyModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<{
        totalItems: number;
        matches: { id: string, teamNumber: number, eventName: string, utr: string }[];
        unmatchedUtrs: string[];
    } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files ? e.target.files[0] : null;
        if (selectedFile && selectedFile.type === "application/pdf") {
            setFile(selectedFile);
            setResults(null);
        } else {
            alert("Please select a PDF file");
        }
    };

    const processPdf = async () => {
        if (!file) return;

        try {
            setIsProcessing(true);
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = "";

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(" ");
                fullText += pageText + " ";
            }

            // Normalize text: remove spaces for matching UTRs
            const normalizedText = fullText.replace(/\s/g, "");

            const matchedItems: { id: string, teamNumber: number, eventName: string, utr: string }[] = [];

            pendingRegistrations.forEach(reg => {
                if (reg.utrNumber && normalizedText.includes(reg.utrNumber.trim())) {
                    matchedItems.push({
                        id: reg.id,
                        teamNumber: reg.teamNumber,
                        eventName: reg.eventName,
                        utr: reg.utrNumber
                    });
                }
            });

            setResults({
                totalItems: pendingRegistrations.length,
                matches: matchedItems,
                unmatchedUtrs: []
            });

        } catch (error) {
            console.error("PDF Processing Error:", error);
            alert("Failed to process PDF. Make sure it's a searchable PDF (not an image scan).");
        } finally {
            setIsProcessing(false);
        }
    };

    const confirmVerification = async () => {
        if (!results || results.matches.length === 0) return;

        const matchedData = results.matches.map(m => {
            const reg = pendingRegistrations.find(r => r.id === m.id);
            return { id: m.id, eventId: reg?.eventId || "" };
        });

        await onVerify(matchedData);
        onClose();
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div className="modal-content" style={{
                background: '#1a1a1f',
                border: '1px solid rgba(212,168,67,0.3)',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '80vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div className="modal-header" style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <h2 style={{ color: '#fff', margin: 0, fontSize: '20px' }}>Automatic Verification</h2>
                    <p style={{ color: '#a1a1aa', margin: '4px 0 0 0', fontSize: '14px' }}>Upload bank statement to match UTRs</p>
                </div>

                <div className="modal-body" style={{ padding: '24px', overflowY: 'auto' }}>
                    {!results ? (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{
                                border: '2px dashed rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                padding: '40px',
                                background: 'rgba(255,255,255,0.02)',
                                marginBottom: '24px'
                            }}>
                                <input
                                    type="file"
                                    id="pdf-upload"
                                    accept="application/pdf"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="pdf-upload" style={{ cursor: 'pointer' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📄</div>
                                    <div style={{ color: '#fff', fontWeight: '600' }}>
                                        {file ? file.name : "Click to upload bank statement"}
                                    </div>
                                    <div style={{ color: '#71717a', fontSize: '13px', marginTop: '4px' }}>
                                        Only searchable PDF files supported
                                    </div>
                                </label>
                            </div>

                            <button
                                onClick={processPdf}
                                disabled={!file || isProcessing}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: file ? '#d4a843' : 'rgba(255,255,255,0.05)',
                                    color: file ? '#000' : '#71717a',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '700',
                                    cursor: file ? 'pointer' : 'not-allowed'
                                }}
                            >
                                {isProcessing ? "Processing PDF..." : "Scan & Match UTRs"}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ flex: 1, background: 'rgba(16,185,129,0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
                                    <div style={{ color: '#10b981', fontSize: '24px', fontWeight: '800' }}>{results.matches.length}</div>
                                    <div style={{ color: '#a1a1aa', fontSize: '12px' }}>Matches Found</div>
                                </div>
                                <div style={{ flex: 1, background: 'rgba(239,68,68,0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
                                    <div style={{ color: '#ef4444', fontSize: '24px', fontWeight: '800' }}>{results.totalItems - results.matches.length}</div>
                                    <div style={{ color: '#a1a1aa', fontSize: '12px' }}>Still Pending</div>
                                </div>
                            </div>

                            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                                {results.matches.map((match, i) => (
                                    <div key={match.id} style={{
                                        padding: '12px',
                                        borderBottom: i === results.matches.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>{match.eventName} - Team #{match.teamNumber}</div>
                                            <div style={{ color: '#71717a', fontSize: '12px' }}>UTR: {match.utr}</div>
                                        </div>
                                        <div style={{ color: '#10b981', fontSize: '12px', fontWeight: '700' }}>MATCHED</div>
                                    </div>
                                ))}
                                {results.matches.length === 0 && (
                                    <div style={{ textAlign: 'center', color: '#71717a', padding: '20px' }}>
                                        No matches found.
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={confirmVerification}
                                disabled={results.matches.length === 0}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: '#10b981',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                Approve {results.matches.length} Registrations
                            </button>
                            <button
                                onClick={() => setResults(null)}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: 'transparent',
                                    color: '#71717a',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    marginTop: '8px'
                                }}
                            >
                                Try another file
                            </button>
                        </div>
                    )}
                </div>

                <div className="modal-footer" style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'right' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            background: 'rgba(255,255,255,0.05)',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            cursor: 'pointer'
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

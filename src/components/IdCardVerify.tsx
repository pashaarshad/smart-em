"use client";

import { useState, useRef, useEffect } from "react";
import { createWorker } from "tesseract.js";

interface IdCardVerifyProps {
    participantName: string;
    collegeName: string;
    referenceFaceBlob: Blob | null;
    onVerified: (imageFile: File, verified: boolean) => void;
}

export default function IdCardVerify({ participantName, collegeName, referenceFaceBlob, onVerified }: IdCardVerifyProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<"idle" | "verified" | "mismatch" | "error">("idle");
    const [faceMatchStatus, setFaceMatchStatus] = useState<"idle" | "match" | "nomatch" | "error" | "loading_models">("idle");
    const [extractedText, setExtractedText] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const faceapiRef = useRef<any>(null);

    useEffect(() => {
        const loadModels = async () => {
            try {
                setFaceMatchStatus("loading_models");
                const faceapi = await import("face-api.js");
                faceapiRef.current = faceapi;
                await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
                await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
                await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
                setFaceMatchStatus("idle");
            } catch (err) {
                console.error("Failed to load face mapping models:", err);
                setFaceMatchStatus("error");
            }
        };
        loadModels();
    }, []);

    const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("File size must be less than 5MB");
            e.target.value = "";
            return;
        }

        setSelectedFile(file);
        setIsProcessing(true);
        setVerificationStatus("idle");

        if (faceMatchStatus !== "error") {
            setFaceMatchStatus("idle");
        }

        try {
            const worker = await createWorker("eng");
            const ret = await worker.recognize(file);
            const text = ret.data.text;
            await worker.terminate();

            setExtractedText(text);

            // Normalize text for comparison
            const normalizedText = text.toLowerCase().replace(/[^a-z0-9\s]/g, "");
            const normalizedName = participantName.toLowerCase().trim();
            const normalizedCollege = collegeName.toLowerCase().trim();

            // Check if name or college name is found
            const nameWords = normalizedName.split(/\s+/).filter(w => w.length > 2);
            const nameMatch = nameWords.some(word => normalizedText.includes(word));
            const collegeMatch = normalizedCollege.split(/\s+/).filter(w => w.length > 2).some(word => normalizedText.includes(word));

            let isTextVerified = false;

            if (nameMatch || collegeMatch) {
                setVerificationStatus("verified");
                isTextVerified = true;
            } else {
                setVerificationStatus("mismatch");
            }

            // Face Matching
            if (referenceFaceBlob && faceapiRef.current && faceMatchStatus !== "error") {
                const faceapi = faceapiRef.current;

                // Convert blobs to images
                const refImg = await faceapi.bufferToImage(referenceFaceBlob);
                const idImg = await faceapi.bufferToImage(file);

                const refDetection = await faceapi.detectSingleFace(refImg, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
                const idDetection = await faceapi.detectSingleFace(idImg, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

                if (refDetection && idDetection) {
                    const distance = faceapi.euclideanDistance(refDetection.descriptor, idDetection.descriptor);
                    if (distance < 0.6) {
                        setFaceMatchStatus("match");
                    } else {
                        setFaceMatchStatus("nomatch");
                    }
                } else {
                    setFaceMatchStatus("nomatch");
                }
            }

            onVerified(file, isTextVerified);
        } catch (err) {
            console.error("ID Card Error:", err);
            setVerificationStatus("error");
            onVerified(file, false);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!referenceFaceBlob) {
        return (
            <div style={{
                marginTop: "16px",
                padding: "16px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px",
                opacity: 0.5
            }}>
                <p style={{ fontSize: "14px", color: "#a1a1aa", margin: 0, textAlign: "center" }}>
                    Please capture your face photo first to unlock ID Card verification.
                </p>
            </div>
        );
    }

    return (
        <div style={{
            marginTop: "16px",
            padding: "16px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px"
        }}>
            <label style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#e4e4e7",
                marginBottom: "12px"
            }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                </svg>
                College ID Card *
            </label>

            <input
                type="file"
                accept="image/*"
                onChange={handleIdUpload}
                style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "14px"
                }}
            />

            {isProcessing && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "10px",
                    fontSize: "13px",
                    color: "#d4a843"
                }}>
                    <div className="spinner" style={{ width: "14px", height: "14px", borderWidth: "2px" }} />
                    Verifying ID card...
                </div>
            )}

            {verificationStatus === "verified" && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "10px",
                    padding: "10px 14px",
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    borderRadius: "10px",
                    fontSize: "13px",
                    color: "#34d399"
                }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    ID card verified successfully
                </div>
            )}

            {verificationStatus === "mismatch" && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "10px",
                    padding: "10px 14px",
                    background: "rgba(245,158,11,0.1)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    borderRadius: "10px",
                    fontSize: "13px",
                    color: "#fbbf24"
                }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Name/college not detected — ID card still uploaded
                </div>
            )}

            {verificationStatus === "error" && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "10px",
                    fontSize: "13px",
                    color: "#f87171"
                }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Could not process ID card. Please try again.
                </div>
            )}

            {/* Face Match Results */}
            {faceMatchStatus === "match" && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "10px",
                    padding: "10px 14px",
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    borderRadius: "10px",
                    fontSize: "13px",
                    color: "#34d399"
                }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Face matches ID card photo
                </div>
            )}

            {faceMatchStatus === "nomatch" && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "10px",
                    padding: "10px 14px",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "10px",
                    fontSize: "13px",
                    color: "#fca5a5"
                }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Face does not match ID card photo or not found on ID
                </div>
            )}

            <p style={{ fontSize: "11px", color: "#71717a", marginTop: "8px" }}>
                Upload a clear photo of your college ID card (Max 5MB)
            </p>
        </div>
    );
}

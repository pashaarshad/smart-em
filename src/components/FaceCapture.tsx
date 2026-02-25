"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface FaceCaptureProps {
    onCapture: (imageBlob: Blob) => void;
}

export default function FaceCapture({ onCapture }: FaceCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [faceCount, setFaceCount] = useState<number | null>(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [error, setError] = useState("");
    const faceapiRef = useRef<any>(null);
    const detectIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const loadModels = useCallback(async () => {
        try {
            const faceapi = await import("face-api.js");
            faceapiRef.current = faceapi;
            await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
            setModelsLoaded(true);
        } catch (err) {
            console.error("Failed to load face detection models:", err);
            setError("Face detection models failed to load. You can still capture your photo.");
            setModelsLoaded(true); // Allow capture without detection
        }
    }, []);

    const startCamera = async () => {
        setError("");
        setCapturedImage(null);
        setFaceCount(null);
        setIsCameraOpen(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" }
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(e => console.error("Video play error:", e));
            } else {
                // Fallback in case it's still null, assign it shortly after
                setTimeout(() => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play().catch(e => console.error("Video play error:", e));
                    }
                }, 100);
            }

            if (!modelsLoaded) {
                await loadModels();
            }

            // Start face detection loop
            startDetection();
        } catch (err: any) {
            console.error("Camera error:", err);
            setError("Could not access camera. Please allow camera permissions.");
            setIsCameraOpen(false);
        }
    };

    const startDetection = () => {
        if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);

        detectIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || !faceapiRef.current) return;

            try {
                const detections = await faceapiRef.current.detectAllFaces(
                    videoRef.current,
                    new faceapiRef.current.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
                );
                setFaceCount(detections.length);
            } catch {
                // Silently handle detection errors
            }
        }, 500);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        setIsDetecting(true);
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                setCapturedImage(url);
                onCapture(blob);
                stopCamera();
            }
            setIsDetecting(false);
        }, "image/jpeg", 0.85);
    };

    const stopCamera = () => {
        if (detectIntervalRef.current) {
            clearInterval(detectIntervalRef.current);
            detectIntervalRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);

    };

    const retake = () => {
        setCapturedImage(null);
        setFaceCount(null);
        startCamera();
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Face Photo *
            </label>

            {error && (
                <p style={{ fontSize: "12px", color: "#f87171", marginBottom: "10px" }}>{error}</p>
            )}

            {!isCameraOpen && !capturedImage && (
                <button
                    type="button"
                    onClick={startCamera}
                    style={{
                        width: "100%",
                        padding: "14px",
                        background: "rgba(212,168,67,0.1)",
                        border: "1px dashed rgba(212,168,67,0.4)",
                        borderRadius: "12px",
                        color: "#d4a843",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        transition: "all 0.2s"
                    }}
                >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Open Camera & Capture Face
                </button>
            )}

            {isCameraOpen && (
                <div style={{ position: "relative" }}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                            width: "100%",
                            minHeight: "240px",
                            backgroundColor: "#000",
                            objectFit: "cover",
                            borderRadius: "12px",
                            border: faceCount === 1 ? "2px solid #10b981" : faceCount && faceCount > 1 ? "2px solid #ef4444" : "2px solid rgba(255,255,255,0.1)",
                            transition: "border-color 0.3s"
                        }}
                    />

                    {/* Face detection indicator */}
                    <div style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: faceCount === 1 ? "rgba(16,185,129,0.9)" : faceCount && faceCount > 1 ? "rgba(239,68,68,0.9)" : "rgba(245,158,11,0.9)",
                        color: "#fff"
                    }}>
                        {faceCount === 1 ? "✓ Face Detected" : faceCount && faceCount > 1 ? "⚠️ Multiple faces! Only 1 allowed" : "Looking for face..."}
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                        <button
                            type="button"
                            onClick={capturePhoto}
                            disabled={isDetecting || faceCount !== 1}
                            style={{
                                flex: 1,
                                padding: "12px",
                                background: faceCount === 1 ? "linear-gradient(135deg, #10b981, #059669)" : "rgba(255,255,255,0.1)",
                                border: "none",
                                borderRadius: "10px",
                                color: faceCount === 1 ? "#fff" : "#a1a1aa",
                                fontSize: "14px",
                                fontWeight: 700,
                                cursor: faceCount === 1 ? "pointer" : "not-allowed"
                            }}
                        >
                            {isDetecting ? "Processing..." : "📸 Capture"}
                        </button>
                        <button
                            type="button"
                            onClick={stopCamera}
                            style={{
                                padding: "12px 16px",
                                background: "rgba(239,68,68,0.2)",
                                border: "1px solid rgba(239,68,68,0.4)",
                                borderRadius: "10px",
                                color: "#f87171",
                                fontSize: "14px",
                                fontWeight: 600,
                                cursor: "pointer"
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {capturedImage && (
                <div style={{ position: "relative" }}>
                    <img
                        src={capturedImage}
                        alt="Captured face"
                        style={{
                            width: "100%",
                            borderRadius: "12px",
                            border: "2px solid #10b981"
                        }}
                    />
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
                        Face photo captured successfully
                    </div>
                    <button
                        type="button"
                        onClick={retake}
                        style={{
                            width: "100%",
                            marginTop: "8px",
                            padding: "10px",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "10px",
                            color: "#a1a1aa",
                            fontSize: "13px",
                            cursor: "pointer"
                        }}
                    >
                        Retake Photo
                    </button>
                </div>
            )}

            <canvas ref={canvasRef} style={{ display: "none" }} />
            <p style={{ fontSize: "11px", color: "#71717a", marginTop: "8px" }}>
                Open camera to capture a clear face photo for identity verification
            </p>
        </div>
    );
}

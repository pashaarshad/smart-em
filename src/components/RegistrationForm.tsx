"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { signInWithPopup, User } from "firebase/auth";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage, googleProvider, GOOGLE_SHEETS_URL, UPI_ID, UPI_NAME } from "@/lib/firebase";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/context/AuthContext";

interface RegistrationFormProps {
    eventId: string;
    eventName: string;
    category: "it" | "management" | "cultural" | "sports";
    teamSize: string;
    registrationFee: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Member {
    name: string;
    phone: string;
}

type RegistrationStep = "auth" | "form" | "payment" | "transaction" | "success";

export default function RegistrationForm({
    eventId,
    eventName,
    category,
    teamSize,
    registrationFee,
    isOpen,
    onClose,
    onSuccess
}: RegistrationFormProps) {
    const { user: globalUser } = useAuth();
    const [step, setStep] = useState<RegistrationStep>("auth");
    const [user, setUser] = useState<User | null>(null);
    const [collegeName, setCollegeName] = useState("");
    const [members, setMembers] = useState<Member[]>([{ name: "", phone: "" }]);
    const [utrNumber, setUtrNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [teamNumber, setTeamNumber] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(300);
    const [mounted, setMounted] = useState(false);
    const [canCompletePayment, setCanCompletePayment] = useState(false);
    const [paymentDelay, setPaymentDelay] = useState(15);
    const [screenshot, setScreenshot] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("File size must be less than 5MB");
                e.target.value = "";
                setScreenshot(null);
                return;
            }
            setScreenshot(file);
        }
    };

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Timer for payment completion button
    useEffect(() => {
        if (step === "payment") {
            setCanCompletePayment(false);
            setPaymentDelay(15);
            const interval = setInterval(() => {
                setPaymentDelay((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        setCanCompletePayment(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [step]);

    const getRequiredMembers = (): number => {
        if (teamSize.includes("8 + 2") || teamSize.includes("8+2")) return 10;
        if (teamSize.includes("4")) return 4;
        if (teamSize.includes("2")) return 2;
        if (teamSize.includes("Solo") || teamSize.includes("1") || teamSize.includes("Individual")) return 1;
        return 2;
    };

    const requiredMembers = getRequiredMembers();

    const getFeeAmount = (): string => {
        const match = registrationFee.match(/₹?(\d+)/);
        return match ? match[1] : "0";
    };

    const feeAmount = getFeeAmount();

    // Auto-skip auth if already logged in
    useEffect(() => {
        if (isOpen && globalUser && step === "auth") {
            setUser(globalUser);
            setStep("form");
        }
    }, [isOpen, globalUser, step]);

    useEffect(() => {
        const initialMembers: Member[] = [];
        for (let i = 0; i < requiredMembers; i++) {
            initialMembers.push({ name: "", phone: "" });
        }
        setMembers(initialMembers);
    }, [requiredMembers]);

    useEffect(() => {
        if (step === "payment" && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [step, timeLeft]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            setError("");
            const result = await signInWithPopup(auth, googleProvider);
            setUser(result.user);
            setStep("form");
        } catch (err: any) {
            setError(err.message || "Failed to sign in with Google");
        } finally {
            setLoading(false);
        }
    };

    const updateMember = (index: number, field: keyof Member, value: string) => {
        const updated = [...members];
        updated[index][field] = value;
        setMembers(updated);
    };

    const validateForm = (): boolean => {
        if (!collegeName.trim()) {
            setError("Please enter your college name");
            return false;
        }
        for (let i = 0; i < members.length; i++) {
            if (!members[i].name.trim()) {
                setError(`Please enter Member ${i + 1} name`);
                return false;
            }
            if (!members[i].phone.trim() || members[i].phone.length < 10) {
                setError(`Please enter a valid phone number for Member ${i + 1}`);
                return false;
            }
        }
        return true;
    };

    const handleProceedToPayment = () => {
        setError("");
        if (validateForm()) {
            setTimeLeft(300);
            setStep("payment");
        }
    };

    const handlePaymentDone = () => {
        setStep("transaction");
    };

    const handleSubmit = async () => {
        if (!utrNumber.trim()) {
            setError("Please enter the UTR Number");
            return;
        }

        if (!screenshot) {
            setError("Please upload the payment screenshot");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const registrationsRef = collection(db, "registrations", eventId, "teams");
            const snapshot = await getDocs(registrationsRef);
            const nextTeamNumber = snapshot.size + 1;
            const teamId = `${eventId}-${nextTeamNumber}`; // Create a unique ID for storage path

            // Upload Screenshot
            let screenshotUrl = "";
            if (screenshot) {
                const storageRef = ref(storage, `registrations/${eventId}/${teamId}/screenshot.jpg`);
                await uploadBytes(storageRef, screenshot);
                screenshotUrl = await getDownloadURL(storageRef);
            }

            const registrationData = {
                teamNumber: nextTeamNumber,
                eventId,
                eventName,
                category,
                email: user?.email || "",
                collegeName,
                members,
                registrationFee,
                utrNumber,
                screenshotUrl, // Save URL
                paymentStatus: "pending",
                registeredAt: Timestamp.now(),
                userId: user?.uid || ""
            };

            await addDoc(registrationsRef, registrationData);

            try {
                // Convert screenshot to Base64 for Google Drive backup
                let base64Image = "";
                let mimeType = "";
                if (screenshot) {
                    try {
                        const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.readAsDataURL(file);
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = error => reject(error);
                        });
                        const result = await toBase64(screenshot);
                        // Result looks like "data:image/jpeg;base64,....."
                        // split to get just the base64 part if needed, but Apps Script might want the whole thing or just the part. 
                        // Usually easier to send parts.
                        const matches = result.match(/^data:(.+);base64,(.+)$/);
                        if (matches && matches.length === 3) {
                            mimeType = matches[1];
                            base64Image = matches[2];
                        }
                    } catch (e) {
                        console.error("Base64 conversion failed", e);
                    }
                }

                await fetch(GOOGLE_SHEETS_URL, {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...registrationData,
                        registeredAt: new Date().toISOString(),
                        fileData: base64Image,
                        mimeType: mimeType
                    }),
                });
            } catch (sheetError) {
                console.error("Google Sheets sync failed:", sheetError);
            }

            setTeamNumber(nextTeamNumber);
            setStep("success");
            onSuccess();

        } catch (err: any) {
            console.error("REGISTRATION ERROR:", err);
            setError(err.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep("auth");
        setCollegeName("");
        setUtrNumber("");
        setError("");
        setTeamNumber(null);
        setUser(null);
        document.body.style.overflow = 'unset';
        onClose();
    };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${feeAmount}&cu=INR&tn=${encodeURIComponent(`SHRESHTA 2026 - ${eventName}`)}`;

    // Payment app deep links
    const paymentApps = [
        { name: "Google Pay", icon: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg", url: `gpay://upi/pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${feeAmount}&cu=INR` },
        { name: "PhonePe", icon: "https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg", url: `phonepe://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${feeAmount}&cu=INR` },
        { name: "Paytm", icon: "https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg", url: `paytmmp://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${feeAmount}&cu=INR` },
    ];

    if (!isOpen || !mounted) return null;

    return createPortal(
        <>
            <style jsx>{`
                .registration-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    background: rgba(0, 0, 0, 0.9);
                    backdrop-filter: blur(10px);
                    animation: fadeIn 0.3s ease;
                    overscroll-behavior: contain;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .registration-modal {
                    width: 100%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow-y: auto;
                    background: linear-gradient(180deg, #1a1a1f 0%, #141418 100%);
                    border: 1px solid rgba(212, 168, 67, 0.2);
                    border-radius: 24px;
                    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);
                    animation: slideUp 0.4s ease;
                }

                .registration-modal::-webkit-scrollbar {
                    width: 6px;
                }

                .registration-modal::-webkit-scrollbar-thumb {
                    background: #d4a843;
                    border-radius: 3px;
                }

                .modal-header {
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 24px 28px;
                    background: linear-gradient(180deg, #1a1a1f 0%, rgba(26, 26, 31, 0.95) 100%);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    backdrop-filter: blur(10px);
                }

                .modal-title {
                    font-size: 22px;
                    font-weight: 700;
                    color: #fff;
                    margin: 0;
                }

                .modal-subtitle {
                    font-size: 14px;
                    color: #d4a843;
                    margin: 4px 0 0 0;
                    font-weight: 500;
                }

                .close-btn {
                    width: 44px;
                    height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .close-btn:hover {
                    background: rgba(239, 68, 68, 0.2);
                    border-color: rgba(239, 68, 68, 0.5);
                }

                .close-btn svg {
                    width: 20px;
                    height: 20px;
                    color: #a1a1aa;
                }

                .modal-body {
                    padding: 28px;
                }

                .error-box {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    margin-bottom: 24px;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 12px;
                    color: #fca5a5;
                    font-size: 14px;
                }

                .auth-container {
                    text-align: center;
                    padding: 40px 20px;
                }

                .auth-icon {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 24px;
                    background: linear-gradient(135deg, rgba(212, 168, 67, 0.2) 0%, rgba(212, 168, 67, 0.05) 100%);
                    border: 1px solid rgba(212, 168, 67, 0.3);
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .auth-title {
                    font-size: 24px;
                    font-weight: 700;
                    color: #fff;
                    margin: 0 0 8px 0;
                }

                .auth-subtitle {
                    font-size: 15px;
                    color: #71717a;
                    margin: 0 0 32px 0;
                    line-height: 1.6;
                }

                .google-btn {
                    width: 100%;
                    padding: 16px 24px;
                    background: #fff;
                    border: none;
                    border-radius: 14px;
                    font-size: 16px;
                    font-weight: 600;
                    color: #000;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    transition: all 0.2s ease;
                }

                .google-btn:hover {
                    background: #f5f5f5;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
                }

                .google-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #a1a1aa;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .form-input {
                    width: 100%;
                    padding: 16px 18px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 14px;
                    font-size: 16px;
                    color: #fff;
                    outline: none;
                    transition: all 0.2s ease;
                }

                .form-input:focus {
                    border-color: rgba(212, 168, 67, 0.5);
                    background: rgba(255, 255, 255, 0.05);
                    box-shadow: 0 0 0 3px rgba(212, 168, 67, 0.1);
                }

                .form-input::placeholder {
                    color: #52525b;
                }

                .form-input[readonly] {
                    background: rgba(255, 255, 255, 0.02);
                    color: #71717a;
                }

                .members-section {
                    margin: 24px 0;
                }

                .members-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #a1a1aa;
                    margin-bottom: 16px;
                }

                .member-card {
                    padding: 20px;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    margin-bottom: 12px;
                }

                .member-header {
                    font-size: 14px;
                    font-weight: 700;
                    color: #d4a843;
                    margin-bottom: 14px;
                }

                .member-inputs {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .member-input {
                    width: 100%;
                    padding: 14px 16px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 10px;
                    font-size: 15px;
                    color: #fff;
                    outline: none;
                    transition: all 0.2s ease;
                }

                .member-input:focus {
                    border-color: rgba(212, 168, 67, 0.4);
                    background: rgba(255, 255, 255, 0.05);
                }

                .fee-box {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px 24px;
                    background: linear-gradient(135deg, rgba(212, 168, 67, 0.15) 0%, rgba(212, 168, 67, 0.05) 100%);
                    border: 1px solid rgba(212, 168, 67, 0.3);
                    border-radius: 16px;
                    margin: 24px 0;
                }

                .fee-label {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 15px;
                    color: #a1a1aa;
                }

                .fee-amount {
                    font-size: 24px;
                    font-weight: 800;
                    color: #d4a843;
                }

                .primary-btn {
                    width: 100%;
                    padding: 18px 24px;
                    background: linear-gradient(135deg, #d4a843 0%, #b8922e 100%);
                    border: none;
                    border-radius: 14px;
                    font-size: 17px;
                    font-weight: 700;
                    color: #000;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.3s ease;
                }

                .primary-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 35px rgba(212, 168, 67, 0.4);
                }

                .primary-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .payment-container {
                    text-align: center;
                    padding: 20px 0;
                }

                .payment-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #fff;
                    margin: 0 0 8px 0;
                }

                .payment-amount {
                    font-size: 32px;
                    font-weight: 800;
                    color: #d4a843;
                    margin: 0 0 24px 0;
                }

                .qr-container {
                    display: inline-block;
                    padding: 20px;
                    background: #fff;
                    border-radius: 20px;
                    margin-bottom: 20px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                }

                .upi-id-box {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 20px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    margin-bottom: 20px;
                }

                .upi-label {
                    font-size: 13px;
                    color: #71717a;
                }

                .upi-value {
                    font-size: 15px;
                    font-weight: 600;
                    color: #fff;
                    font-family: monospace;
                }

                .timer-box {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    padding: 14px 24px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 50px;
                    margin-bottom: 24px;
                }

                .timer-box.warning {
                    background: rgba(239, 68, 68, 0.2);
                }

                .timer-value {
                    font-size: 20px;
                    font-weight: 700;
                    font-family: monospace;
                    color: #fff;
                }

                .timer-label {
                    font-size: 13px;
                    color: #a1a1aa;
                }

                .payment-apps {
                    display: flex;
                    justify-content: center;
                    gap: 16px;
                    margin: 24px 0;
                    flex-wrap: wrap;
                }

                .payment-app-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 16px 24px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 14px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-decoration: none;
                    min-width: 100px;
                }

                .payment-app-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(212, 168, 67, 0.5);
                    transform: translateY(-3px);
                }

                .payment-app-icon {
                    width: 40px;
                    height: 40px;
                    object-fit: contain;
                }

                .payment-app-name {
                    font-size: 12px;
                    font-weight: 600;
                    color: #a1a1aa;
                }

                .success-btn {
                    width: 100%;
                    padding: 18px 24px;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    border: none;
                    border-radius: 14px;
                    font-size: 17px;
                    font-weight: 700;
                    color: #fff;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.3s ease;
                }

                .success-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 35px rgba(16, 185, 129, 0.4);
                }

                .transaction-container {
                    text-align: center;
                    padding: 20px 0;
                }

                .success-icon {
                    width: 70px;
                    height: 70px;
                    margin: 0 auto 20px;
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%);
                    border: 2px solid rgba(16, 185, 129, 0.4);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .success-container {
                    text-align: center;
                    padding: 40px 20px;
                }

                .success-container .success-icon {
                    width: 100px;
                    height: 100px;
                    margin-bottom: 24px;
                }

                .success-title {
                    font-size: 28px;
                    font-weight: 800;
                    color: #fff;
                    margin: 0 0 12px 0;
                }

                .success-team {
                    font-size: 18px;
                    color: #a1a1aa;
                    margin: 0 0 8px 0;
                }

                .team-number {
                    color: #d4a843;
                    font-weight: 700;
                }

                .success-event {
                    font-size: 14px;
                    color: #71717a;
                    margin: 0 0 32px 0;
                }

                .secondary-btn {
                    width: 100%;
                    padding: 16px 24px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 14px;
                    font-size: 16px;
                    font-weight: 600;
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .secondary-btn:hover {
                    background: rgba(255, 255, 255, 0.12);
                    border-color: rgba(255, 255, 255, 0.25);
                }

                .spinner {
                    width: 22px;
                    height: 22px;
                    border: 3px solid rgba(0, 0, 0, 0.2);
                    border-top-color: #000;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .transaction-input {
                    width: 100%;
                    padding: 18px 20px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    border-radius: 14px;
                    font-size: 18px;
                    font-family: monospace;
                    color: #fff;
                    outline: none;
                    text-align: center;
                    letter-spacing: 2px;
                    margin: 20px 0;
                    transition: all 0.2s ease;
                }

                .transaction-input:focus {
                    border-color: rgba(212, 168, 67, 0.5);
                    box-shadow: 0 0 0 4px rgba(212, 168, 67, 0.1);
                }

                .transaction-hint {
                    font-size: 13px;
                    color: #71717a;
                    margin-bottom: 24px;
                }
            `}</style>

            <div className="registration-overlay">
                <div className="registration-modal">
                    {/* Header */}
                    <div className="modal-header">
                        <div>
                            <h2 className="modal-title">Event Registration</h2>
                            <p className="modal-subtitle">{eventName}</p>
                        </div>
                        <button className="close-btn" onClick={handleClose}>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="modal-body">
                        {/* Error */}
                        {error && (
                            <div className="error-box">
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Step 1: Auth */}
                        {step === "auth" && (
                            <div className="auth-container">
                                <div className="auth-icon">
                                    <svg width="40" height="40" fill="none" stroke="#d4a843" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="auth-title">Sign in to Register</h3>
                                <p className="auth-subtitle">
                                    Sign in with your Google account to continue with the event registration
                                </p>
                                <button className="google-btn" onClick={handleGoogleSignIn} disabled={loading}>
                                    {loading ? (
                                        <div className="spinner" />
                                    ) : (
                                        <>
                                            <svg width="22" height="22" viewBox="0 0 24 24">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                            Continue with Google
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Step 2: Form */}
                        {step === "form" && (
                            <div>
                                <div className="form-group">
                                    <label className="form-label">
                                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Email (from Google)
                                    </label>
                                    <input type="email" className="form-input" value={user?.email || ""} readOnly />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        College Name *
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={collegeName}
                                        onChange={(e) => setCollegeName(e.target.value)}
                                        placeholder="Enter your college name"
                                    />
                                </div>

                                <div className="members-section">
                                    <div className="members-title">
                                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Team Members ({requiredMembers} required)
                                    </div>
                                    {members.map((member, index) => (
                                        <div key={index} className="member-card">
                                            <div className="member-header">Member {index + 1}</div>
                                            <div className="member-inputs">
                                                <input
                                                    type="text"
                                                    className="member-input"
                                                    value={member.name}
                                                    onChange={(e) => updateMember(index, "name", e.target.value)}
                                                    placeholder="Full Name"
                                                />
                                                <input
                                                    type="tel"
                                                    className="member-input"
                                                    value={member.phone}
                                                    onChange={(e) => updateMember(index, "phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                                                    placeholder="Phone Number"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="fee-box">
                                    <span className="fee-label">
                                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Entry Fee
                                    </span>
                                    <span className="fee-amount">{registrationFee}</span>
                                </div>

                                <button className="primary-btn" onClick={handleProceedToPayment}>
                                    Continue to Payment
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Step 3: Payment */}
                        {step === "payment" && (
                            <div className="payment-container">
                                <h3 className="payment-title">Scan QR Code to Pay</h3>
                                <p className="payment-amount">₹{feeAmount}</p>

                                <div className="qr-container">
                                    <QRCodeSVG value={upiUrl} size={220} level="H" includeMargin={true} />
                                </div>

                                <div className="upi-id-box">
                                    <span className="upi-label">UPI ID:</span>
                                    <span className="upi-value">{UPI_ID}</span>
                                </div>

                                <div className={`timer-box ${timeLeft < 60 ? 'warning' : ''}`}>
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="timer-value">{formatTime(timeLeft)}</span>
                                    <span className="timer-label">remaining</span>
                                </div>

                                {/* Payment App Buttons */}
                                {/* Payment App Buttons - Mobile Only */}
                                <div className="payment-apps md:hidden">
                                    {paymentApps.map((app) => (
                                        <a key={app.name} href={app.url} className="payment-app-btn">
                                            <img src={app.icon} alt={app.name} className="payment-app-icon" />
                                            <span className="payment-app-name">{app.name}</span>
                                        </a>
                                    ))}
                                </div>

                                {timeLeft === 0 ? (
                                    <div style={{ color: '#fca5a5', marginBottom: '16px' }}>
                                        <p>Payment time expired.</p>
                                        <button onClick={() => setTimeLeft(300)} style={{ color: '#d4a843', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                                            Restart Timer
                                        </button>
                                    </div>
                                ) : !canCompletePayment ? (
                                    <div className="w-full py-4 text-center rounded-xl bg-white/5 border border-white/10 text-zinc-400">
                                        <p className="text-sm font-medium animate-pulse">
                                            Please complete payment... Confirmation enabled in {paymentDelay}s
                                        </p>
                                    </div>
                                ) : (
                                    <button className="success-btn animate-fade-in" onClick={handlePaymentDone}>
                                        <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        I have completed the payment
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Step 4: Transaction ID */}
                        {step === "transaction" && (
                            <div className="transaction-container">
                                <div className="success-icon">
                                    <svg width="36" height="36" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="payment-title">Payment Confirmation</h3>
                                <p style={{ color: '#71717a', marginBottom: '24px' }}>Enter your UTR Number to complete registration</p>

                                {error && (
                                    <div className="error-box" style={{ marginBottom: '20px' }}>
                                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {error}
                                    </div>
                                )}

                                <input
                                    type="text"
                                    className="transaction-input"
                                    value={utrNumber}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/^\d*$/.test(val)) {
                                            setUtrNumber(val);
                                        }
                                    }}
                                    placeholder="Enter UTR Number (Digits Only)"
                                />
                                <p className="transaction-hint">You can find the UTR Number in your UPI app&apos;s transaction history</p>

                                <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                                    <label className="form-label">
                                        Payment Screenshot *
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="form-input"
                                        onChange={handleFileChange}
                                        style={{ padding: '12px' }}
                                    />
                                    <p style={{ fontSize: '12px', color: '#71717a', marginTop: '6px' }}>
                                        Upload screenshot (Max 5MB)
                                    </p>
                                </div>

                                <button className="primary-btn" onClick={handleSubmit} disabled={loading}>
                                    {loading ? <div className="spinner" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000' }} /> : "Submit Registration"}
                                </button>
                            </div>
                        )}

                        {/* Step 5: Success */}
                        {step === "success" && (
                            <div className="success-container">
                                <div className="success-icon">
                                    <svg width="50" height="50" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="success-title">Registration Successful!</h3>
                                <p className="success-team">
                                    You are registered as <span className="team-number">Team #{teamNumber}</span>
                                </p>
                                <p className="success-event">for {eventName}</p>
                                <button className="secondary-btn" onClick={handleClose}>Close</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}

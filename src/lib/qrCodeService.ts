import QRCode from "qrcode";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export interface QRData {
    teamId: string;
    eventId: string;
    eventName: string;
    teamNumber: number;
    collegeName: string;
    members: { name: string; phone: string }[];
    registrationFee: string;
    verifiedAt: string;
}

/**
 * Generate QR code as a data URL (base64 PNG)
 */
export async function generateQRDataUrl(data: QRData): Promise<string> {
    const qrPayload = JSON.stringify({
        id: data.teamId,
        eid: data.eventId,
        tn: data.teamNumber,
        ev: data.eventName,
        col: data.collegeName,
        t: data.verifiedAt,
    });

    const dataUrl = await QRCode.toDataURL(qrPayload, {
        width: 400,
        margin: 2,
        color: {
            dark: "#1a1a2e",
            light: "#ffffff",
        },
        errorCorrectionLevel: "H",
    });

    return dataUrl;
}

/**
 * Generate QR code and upload to Firebase Storage
 * Returns the download URL of the uploaded QR image
 */
export async function generateAndUploadQR(data: QRData): Promise<string> {
    // Generate QR as buffer
    const qrPayload = JSON.stringify({
        id: data.teamId,
        eid: data.eventId,
        tn: data.teamNumber,
        ev: data.eventName,
        col: data.collegeName,
        t: data.verifiedAt,
    });

    const dataUrl = await QRCode.toDataURL(qrPayload, {
        width: 400,
        margin: 2,
        color: {
            dark: "#1a1a2e",
            light: "#ffffff",
        },
        errorCorrectionLevel: "H",
    });

    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Upload to Firebase Storage
    const storageRef = ref(
        storage,
        `qrcodes/${data.eventId}/${data.teamId}.png`
    );
    await uploadBytes(storageRef, blob, { contentType: "image/png" });

    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
}

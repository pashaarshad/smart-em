/**
 * Certificate Generation Service
 * Generates beautiful certificates using HTML Canvas and uploads to Firebase Storage
 */

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface CertificateData {
    participantName: string;
    eventName: string;
    collegeName: string;
    teamNumber: number;
    eventDate?: string;
}

/**
 * Draw a rounded rectangle on canvas
 */
function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

/**
 * Generate a certificate image as a Blob using Canvas
 */
export async function generateCertificateImage(data: CertificateData): Promise<Blob> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    // A4 landscape-ish proportions
    const W = 1600;
    const H = 1120;
    canvas.width = W;
    canvas.height = H;

    // ── Background gradient ──
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "#0c0c14");
    bgGrad.addColorStop(0.5, "#111120");
    bgGrad.addColorStop(1, "#0c0c14");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Decorative corner accents ──
    const gold = "#d4a843";
    const goldFaded = "rgba(212, 168, 67, 0.15)";
    const goldMedium = "rgba(212, 168, 67, 0.4)";

    // Top-left corner lines
    ctx.strokeStyle = goldMedium;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, 100); ctx.lineTo(40, 40); ctx.lineTo(100, 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(50, 110); ctx.lineTo(50, 50); ctx.lineTo(110, 50);
    ctx.stroke();

    // Top-right corner lines
    ctx.beginPath();
    ctx.moveTo(W - 100, 40); ctx.lineTo(W - 40, 40); ctx.lineTo(W - 40, 100);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W - 110, 50); ctx.lineTo(W - 50, 50); ctx.lineTo(W - 50, 110);
    ctx.stroke();

    // Bottom-left corner lines
    ctx.beginPath();
    ctx.moveTo(40, H - 100); ctx.lineTo(40, H - 40); ctx.lineTo(100, H - 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(50, H - 110); ctx.lineTo(50, H - 50); ctx.lineTo(110, H - 50);
    ctx.stroke();

    // Bottom-right corner lines
    ctx.beginPath();
    ctx.moveTo(W - 100, H - 40); ctx.lineTo(W - 40, H - 40); ctx.lineTo(W - 40, H - 100);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W - 110, H - 50); ctx.lineTo(W - 50, H - 50); ctx.lineTo(W - 50, H - 110);
    ctx.stroke();

    // ── Inner border ──
    ctx.strokeStyle = goldFaded;
    ctx.lineWidth = 1;
    roundRect(ctx, 70, 70, W - 140, H - 140, 16);
    ctx.stroke();

    // ── Top decorative line ──
    const lineGrad = ctx.createLinearGradient(200, 0, W - 200, 0);
    lineGrad.addColorStop(0, "transparent");
    lineGrad.addColorStop(0.3, gold);
    lineGrad.addColorStop(0.7, gold);
    lineGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(200, 120);
    ctx.lineTo(W - 200, 120);
    ctx.stroke();

    // ── College name ──
    ctx.fillStyle = "#71717a";
    ctx.font = "600 16px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SESHADRIPURAM DEGREE COLLEGE, MYSURU", W / 2, 160);

    // ── SHRESHTA 2026 ──
    ctx.fillStyle = gold;
    ctx.font = "800 52px 'Segoe UI', sans-serif";
    ctx.fillText("SHRESHTA 2026", W / 2, 225);

    // ── Certificate Title ──
    ctx.fillStyle = "#ffffff";
    ctx.font = "300 22px 'Segoe UI', sans-serif";
    ctx.letterSpacing = "6px";
    ctx.fillText("CERTIFICATE  OF  PARTICIPATION", W / 2, 280);

    // ── Decorative divider ──
    const divGrad = ctx.createLinearGradient(400, 0, W - 400, 0);
    divGrad.addColorStop(0, "transparent");
    divGrad.addColorStop(0.3, goldMedium);
    divGrad.addColorStop(0.5, gold);
    divGrad.addColorStop(0.7, goldMedium);
    divGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(400, 310);
    ctx.lineTo(W - 400, 310);
    ctx.stroke();

    // ── "This is to certify that" ──
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "400 18px 'Segoe UI', sans-serif";
    ctx.fillText("This is to certify that", W / 2, 370);

    // ── Participant Name ──
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 48px 'Segoe UI', sans-serif";
    ctx.fillText(data.participantName.toUpperCase(), W / 2, 435);

    // ── Underline under name ──
    const nameWidth = ctx.measureText(data.participantName.toUpperCase()).width;
    const nameGrad = ctx.createLinearGradient(W / 2 - nameWidth / 2, 0, W / 2 + nameWidth / 2, 0);
    nameGrad.addColorStop(0, "transparent");
    nameGrad.addColorStop(0.2, gold);
    nameGrad.addColorStop(0.8, gold);
    nameGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = nameGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - nameWidth / 2 - 20, 450);
    ctx.lineTo(W / 2 + nameWidth / 2 + 20, 450);
    ctx.stroke();

    // ── College name of participant ──
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "400 18px 'Segoe UI', sans-serif";
    ctx.fillText(`from  ${data.collegeName}`, W / 2, 490);

    // ── Event description ──
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "400 18px 'Segoe UI', sans-serif";
    ctx.fillText("has successfully participated in the event", W / 2, 540);

    // ── Event Name ──
    ctx.fillStyle = gold;
    ctx.font = "700 38px 'Segoe UI', sans-serif";
    ctx.fillText(`"${data.eventName}"`, W / 2, 600);

    // ── Team # ──
    ctx.fillStyle = "#71717a";
    ctx.font = "400 16px 'Segoe UI', sans-serif";
    ctx.fillText(`Team #${data.teamNumber}`, W / 2, 640);

    // ── Date ──
    const eventDate = data.eventDate || "15th May 2026";
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "400 17px 'Segoe UI', sans-serif";
    ctx.fillText(`held on  ${eventDate}  at Seshadripuram Degree College, Mysuru`, W / 2, 690);

    // ── Bottom decorative line ──
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(300, 730);
    ctx.lineTo(W - 300, 730);
    ctx.stroke();

    // ── Signature areas ──
    // Left signature
    ctx.strokeStyle = goldMedium;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(250, 880);
    ctx.lineTo(550, 880);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 16px 'Segoe UI', sans-serif";
    ctx.fillText("Event Coordinator", 400, 910);

    // Center seal area
    ctx.strokeStyle = goldMedium;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(W / 2, 850, 50, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = gold;
    ctx.font = "700 14px 'Segoe UI', sans-serif";
    ctx.fillText("SDC", W / 2, 845);
    ctx.fillText("MYSURU", W / 2, 865);

    // Right signature
    ctx.strokeStyle = goldMedium;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W - 550, 880);
    ctx.lineTo(W - 250, 880);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 16px 'Segoe UI', sans-serif";
    ctx.fillText("Principal", W - 400, 910);

    // ── Footer ──
    ctx.fillStyle = "#3f3f46";
    ctx.font = "400 12px 'Segoe UI', sans-serif";
    ctx.fillText("SESHADRIPURAM EDUCATIONAL TRUST  •  #25, Hebbal Ring Road, Hebbal, Mysuru–570017", W / 2, H - 60);

    // ── Bottom decorative line ──
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(200, H - 120);
    ctx.lineTo(W - 200, H - 120);
    ctx.stroke();

    // Convert canvas to blob
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Failed to generate certificate image"));
            },
            "image/png",
            1.0
        );
    });
}

/**
 * Generate certificate and upload to Firebase Storage
 */
export async function generateAndUploadCertificate(
    data: CertificateData,
    eventId: string,
    registrationId: string
): Promise<string> {
    const blob = await generateCertificateImage(data);

    const storageRef = ref(
        storage,
        `certificates/${eventId}/${registrationId}.png`
    );

    await uploadBytes(storageRef, blob, { contentType: "image/png" });
    const downloadUrl = await getDownloadURL(storageRef);

    return downloadUrl;
}

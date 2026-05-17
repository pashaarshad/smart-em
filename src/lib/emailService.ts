// Email service to trigger backend route

interface SendQREmailParams {
    to: string;
    teamNumber: number;
    eventName: string;
    collegeName: string;
    members: { name: string; phone: string }[];
    qrCodeUrl: string;
}

interface SendCertificateEmailParams {
    to: string;
    participantName: string;
    eventName: string;
    certificateUrl: string;
}

interface SendAlertEmailParams {
    to: string[];
    eventName: string;
    subject: string;
    message: string;
}

interface SendWelcomeEmailParams {
    to: string;
    eventName: string;
    teamNumber: number;
    collegeName: string;
    members: { name: string; phone: string }[];
}

/**
 * Send QR code email after payment verification
 */
export async function sendQREmail(params: SendQREmailParams): Promise<boolean> {
    try {
        const response = await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "qr",
                to: params.to,
                subject: `✅ Registration Confirmed — ${params.eventName} | SHRESHTA 2026`,
                teamNumber: params.teamNumber,
                eventName: params.eventName,
                collegeName: params.collegeName,
                members: params.members,
                qrCodeUrl: params.qrCodeUrl,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Email send failed:", errorData);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error sending QR email:", error);
        return false;
    }
}

/**
 * Send welcome email immediately after registration (before payment verification)
 */
export async function sendWelcomeEmail(params: SendWelcomeEmailParams): Promise<boolean> {
    try {
        const response = await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "welcome",
                to: params.to,
                subject: `🎉 Registration Received! — ${params.eventName} | SHRESHTA 2026`,
                teamNumber: params.teamNumber,
                eventName: params.eventName,
                collegeName: params.collegeName,
                members: params.members,
            }),
        });

        return response.ok;
    } catch (error) {
        console.error("Error sending welcome email:", error);
        return false;
    }
}

/**
 * Send certificate email
 */
export async function sendCertificateEmail(params: SendCertificateEmailParams): Promise<boolean> {
    try {
        const response = await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "certificate",
                to: params.to,
                subject: `🏆 Your Certificate — ${params.eventName} | SHRESHTA 2026`,
                participantName: params.participantName,
                eventName: params.eventName,
                certificateUrl: params.certificateUrl,
            }),
        });

        return response.ok;
    } catch (error) {
        console.error("Error sending certificate email:", error);
        return false;
    }
}

/**
 * Send bulk alert/notification email
 */
export async function sendAlertEmail(params: SendAlertEmailParams): Promise<boolean> {
    try {
        const response = await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "alert",
                to: params.to,
                subject: params.subject,
                eventName: params.eventName,
                message: params.message,
            }),
        });

        return response.ok;
    } catch (error) {
        console.error("Error sending alert email:", error);
        return false;
    }
}

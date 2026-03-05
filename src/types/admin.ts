export interface Member {
    name: string;
    phone: string;
}

export interface Registration {
    id: string;
    teamNumber: number;
    eventId: string;
    eventName: string;
    category: string;
    collegeName: string;
    email: string;
    members: Member[];
    registrationFee: string;
    utrNumber: string;
    screenshotUrl?: string;
    facePhotoUrl?: string;
    idCardUrl?: string;
    idCardVerified?: boolean;
    paymentStatus: string;
    registeredAt: any;
    // QR Code & Check-in
    qrCodeUrl?: string;
    qrSentAt?: any;
    checkedIn?: boolean;
    checkedInAt?: any;
    // Certificate
    certificateUrl?: string;
    certificateSentAt?: any;
}

export interface Event {
    id: string;
    title: string;
    category: string;
    registrationFee: string;
}

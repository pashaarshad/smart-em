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
    paymentStatus: string;
    registeredAt: any;
}

export interface Event {
    id: string;
    title: string;
    category: string;
    registrationFee: string;
}

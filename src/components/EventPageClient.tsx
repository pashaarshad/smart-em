"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import RegistrationForm from "./RegistrationForm";
import RegisteredTeams from "./RegisteredTeams";
import Link from "next/link";

interface EventPageClientProps {
    eventId: string;
    eventName: string;
    category: "it" | "management" | "cultural" | "sports";
    teamSize: string;
    registrationFee: string;
}

export default function EventPageClient({
    eventId,
    eventName,
    category,
    teamSize,
    registrationFee
}: EventPageClientProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { user, userRegistrations, isRegisteredForEvent, refreshRegistrations } = useAuth();

    const isRegisteredForThisEvent = isRegisteredForEvent(eventId);
    const hasAnyRegistration = userRegistrations.length > 0;
    const registeredEventName = hasAnyRegistration ? userRegistrations[0].eventName : null;

    const handleRegistrationSuccess = () => {
        refreshRegistrations();
    };

    // User already registered for this event
    if (isRegisteredForThisEvent) {
        return (
            <div className="w-full">
                <div className="w-full py-4 px-6 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
                    <div className="flex items-center justify-center gap-2 text-green-400 font-semibold text-lg mb-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        You have registered!
                    </div>
                    <p className="text-green-400/70 text-sm">Successfully registered for {eventName}</p>
                </div>
            </div>
        );
    }

    // User already registered for another event
    if (hasAnyRegistration && !isRegisteredForThisEvent) {
        return (
            <div className="w-full">
                <div className="w-full py-4 px-6 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
                    <div className="flex items-center justify-center gap-2 text-yellow-400 font-semibold mb-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Already Registered
                    </div>
                    <p className="text-yellow-400/70 text-sm mb-3">
                        You have already registered for <strong>{registeredEventName}</strong>
                    </p>
                    <p className="text-zinc-500 text-xs">Each participant can only register for one event</p>
                </div>
            </div>
        );
    }

    // User not logged in or can register
    return (
        <>
            <button
                onClick={() => setIsFormOpen(true)}
                className="btn btn-primary w-full py-4 text-base shadow-lg shadow-[#d4a843]/20 hover:shadow-[#d4a843]/40"
            >
                Register Now
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
            </button>

            <RegistrationForm
                eventId={eventId}
                eventName={eventName}
                category={category}
                teamSize={teamSize}
                registrationFee={registrationFee}
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={handleRegistrationSuccess}
            />
        </>
    );
}

export function EventTeamsSection({
    eventId,
    eventName
}: {
    eventId: string;
    eventName: string;
}) {
    return <RegisteredTeams eventId={eventId} eventName={eventName} />;
}

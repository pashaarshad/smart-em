import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getEventById, allEvents } from "@/data/events";
import EventPageClient from "@/components/EventPageClient";

export function generateStaticParams() {
    return allEvents.map((event) => ({ id: event.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const event = getEventById(id);

    if (!event) {
        return { title: "Event Not Found | SHRESHTA 2026" };
    }

    return {
        title: `${event.title} | SHRESHTA 2026`,
        description: event.description,
    };
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const event = getEventById(id);

    if (!event) {
        notFound();
    }

    const categoryConfig = {
        it: { label: "Tech", badge: "badge-tech", color: "#3b82f6" },
        management: { label: "Management", badge: "badge-management", color: "#d4a843" },
        cultural: { label: "Cultural", badge: "badge-cultural", color: "#ec4899" },
        sports: { label: "Sports", badge: "badge-sports", color: "#22c55e" },
    };

    const config = categoryConfig[event.category];

    return (
        <main className="min-h-screen bg-[#0a0a0c]">
            {/* Hero */}
            <section className="relative h-[400px] md:h-[480px]">
                <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/80 to-black/30" />

                {/* Back Button */}
                <div className="absolute top-24 left-0 right-0 z-20">
                    <div className="container-main px-4 sm:px-6 lg:px-0">
                        <Link
                            href="/#events"
                            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors group bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
                        >
                            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Events
                        </Link>
                    </div>
                </div>

                {/* Desktop Logo Centered Vertically */}
                <div className="absolute inset-0 z-10 pointer-events-none hidden lg:flex items-center justify-end">
                    <div className="container-main w-full flex justify-end px-0">
                        <div className="relative w-64 h-64 mr-12 shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            <Image
                                src={event.image}
                                alt="Event Logo"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div className="absolute bottom-0 left-0 right-0 pb-12 z-10">
                    <div className="container-main flex items-end justify-between px-4 sm:px-6 lg:px-8">
                        <div className="max-w-3xl">
                            <div className="flex flex-wrap gap-3 mb-4">
                                <span className={`badge ${config.badge}`}>{config.label}</span>
                                <span className="badge border border-white/10 bg-white/5 text-zinc-300">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {event.teamSize}
                                </span>
                            </div>
                            <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                                {event.title}
                            </h1>
                            <p className="text-zinc-300 text-lg max-w-2xl leading-relaxed">{event.description}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content */}
            <section className="container-main py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* About */}
                        <div className="card-static p-6 md:p-8 bg-[#18181c]/50 border-white/5">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#d4a843]/10 flex items-center justify-center border border-[#d4a843]/20">
                                    <svg className="w-5 h-5 text-[#d4a843]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                About This Event
                            </h2>
                            <p className="text-zinc-400 leading-loose text-lg">{event.longDescription}</p>
                        </div>

                        {/* Rules */}
                        <div className="card-static p-6 md:p-8 bg-[#18181c]/50 border-white/5">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#d4a843]/10 flex items-center justify-center border border-[#d4a843]/20">
                                    <svg className="w-5 h-5 text-[#d4a843]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                                Rules & Guidelines
                            </h2>
                            <ul className="space-y-4">
                                {event.rules.map((rule, i) => (
                                    <li key={i} className="flex items-start gap-4 group">
                                        <span className="w-6 h-6 rounded-md bg-[#d4a843]/10 text-[#d4a843] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 group-hover:bg-[#d4a843] group-hover:text-black transition-colors duration-300">
                                            {i + 1}
                                        </span>
                                        <span className="text-zinc-300 text-base">{rule}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Details Card */}
                        <div className="card-static p-6 md:p-8 sticky top-24 bg-[#18181c] border-white/10 shadow-xl shadow-black/50">
                            <h3 className="text-sm font-bold text-[#d4a843] uppercase tracking-widest mb-8 border-b border-white/5 pb-4">
                                Event Details
                            </h3>

                            <div className="space-y-6 mb-8">
                                {[
                                    { icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", label: "Date", value: event.date },
                                    { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "Time", value: event.time },
                                    { icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z", label: "Venue", value: event.venue },
                                    { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", label: "Team Size", value: event.teamSize },
                                    { icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1", label: "Entry Fee", value: event.registrationFee },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 group">
                                        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center shrink-0 group-hover:bg-[#d4a843]/10 group-hover:scale-105 transition-all duration-300">
                                            <svg className="w-6 h-6 text-zinc-500 group-hover:text-[#d4a843] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">{item.label}</p>
                                            <p className="text-white font-medium text-lg">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Client-side Registration Button */}
                            <EventPageClient
                                eventId={event.id}
                                eventName={event.title}
                                category={event.category}
                                teamSize={event.teamSize}
                                registrationFee={event.registrationFee}
                            />
                        </div>

                        {/* Coordinator Card */}
                        <div className="card-static p-6 md:p-8 bg-[#18181c] border-white/10">
                            <h3 className="text-sm font-bold text-[#d4a843] uppercase tracking-widest mb-6">Coordinator</h3>

                            <div className="flex items-center gap-4 mb-6">
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-inner"
                                    style={{ backgroundColor: `${config.color}20`, color: config.color }}
                                >
                                    {event.coordinator.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                </div>
                                <div>
                                    <p className="text-white font-bold text-lg mb-0.5">{event.coordinator}</p>
                                    <p className="text-sm text-zinc-400">Event Coordinator</p>
                                </div>
                            </div>

                            <a
                                href={`tel:${event.coordinatorPhone}`}
                                className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#d4a843]/50 text-white transition-all group"
                            >
                                <div className="w-8 h-8 rounded-full bg-[#d4a843] flex items-center justify-center text-black group-hover:scale-110 transition-transform">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <span className="font-mono text-lg font-medium group-hover:text-[#d4a843] transition-colors">
                                    {event.coordinatorPhone}
                                </span>
                            </a>
                            <p className="text-center text-xs text-zinc-600 mt-3">Click to call coordinator</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

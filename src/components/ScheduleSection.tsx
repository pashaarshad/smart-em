"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, AlertCircle, Sparkles } from "lucide-react";

// Inline data to ensure component works without missing "lib/eventData"
const eventInfo = {
    date: "February 17, 2026",
    day: "Tuesday",
    time: "8:30 AM onwards",
    registrationDeadline: "February 15, 2026"
};

const rules = [
    "College ID is mandatory",
    "Reporting time - 8:30AM onwards",
    "Register on or before 15th February 2026 for all events",
    "Judges Decision will be considered as final",
    "Discipline should be maintained",
    "Conditions Applied for all the events"
];

const scheduleData = [
    { time: "8:30 AM", event: "Registration & Reporting", venue: "Main Hall" },
    { time: "9:30 AM", event: "Inaugural Ceremony", venue: "Auditorium" },
    { time: "10:00 AM", event: "IT Events Begin", venue: "Computer Labs" },
    { time: "10:00 AM", event: "Management Events Begin", venue: "Seminar Halls" },
    { time: "11:00 AM", event: "Cultural Events Begin", venue: "Open Stage" },
    { time: "2:00 PM", event: "E-Sports Tournament", venue: "Gaming Arena" },
    { time: "3:00 PM", event: "Sports Events", venue: "Ground" },
    { time: "5:00 PM", event: "Finals & Prize Distribution", venue: "Auditorium" },
];

const ScheduleSection = () => {
    return (
        <center style={{ padding: '3rem' }}>
            <section id="schedule" className="py-24 md:py-32 relative overflow-hidden bg-[#0a0a0c]">
                {/* Decorative Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#d4a843]/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#d4a843]/3 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/3 rounded-full blur-[100px]" />
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    {/* Section Header - Centered */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 bg-[#d4a843]/10 border border-[#d4a843]/20 rounded-full px-4 py-2 mb-6">
                            <Sparkles className="w-4 h-4 text-[#d4a843]" />
                            <span className="text-sm font-medium text-[#d4a843] uppercase tracking-widest">
                                Timeline
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-6">
                            Event <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4a843] via-[#e8c468] to-[#d4a843]">Schedule</span>
                        </h2>
                        <center>
                            <p className="text-zinc-400 max-w-xl mx-auto text-lg text-center w-full">
                                {eventInfo.date}, {eventInfo.day} • {eventInfo.time}
                            </p>
                        </center>
                    </motion.div>

                    {/* Main Content Grid - Centered */}
                    <div className="flex justify-center">
                        <div className="grid lg:grid-cols-2 gap-8 w-full max-w-5xl">
                            {/* Schedule Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="rounded-3xl bg-gradient-to-br from-[#12121a] to-[#0c0c12] border border-white/[0.08] p-6 md:p-8 hover:border-[#d4a843]/30 transition-all duration-500 shadow-2xl"
                            >
                                {/* Day Header */}
                                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/[0.06]">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4a843]/20 to-[#d4a843]/5 border border-[#d4a843]/20 flex items-center justify-center shadow-lg shadow-[#d4a843]/5">
                                        <Calendar className="w-6 h-6 text-[#d4a843]" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-bold text-white">{eventInfo.date}</h3>
                                        <p className="text-sm text-zinc-500 font-medium">{eventInfo.day}</p>
                                    </div>
                                </div>

                                {/* Events Timeline */}
                                <div className="space-y-0 relative">
                                    {/* Vertical Timeline Line */}
                                    <div className="absolute left-[15px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-[#d4a843]/50 via-[#d4a843]/20 to-transparent" />

                                    {scheduleData.map((item, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: index * 0.05 }}
                                            className="relative flex items-start gap-5 group py-4 first:pt-0 last:pb-0"
                                        >
                                            {/* Timeline Dot */}
                                            <div className="relative z-10 w-8 h-8 rounded-full bg-[#0c0c12] border-2 border-[#d4a843]/40 flex items-center justify-center group-hover:border-[#d4a843] group-hover:scale-110 transition-all duration-300 shadow-lg shadow-black/50 shrink-0">
                                                <div className="w-2.5 h-2.5 bg-[#d4a843]/60 rounded-full group-hover:bg-[#d4a843] transition-colors" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pb-4 border-b border-white/[0.04] group-last:border-0 group-last:pb-0">
                                                {/* Time Badge */}
                                                <div className="shrink-0">
                                                    <span className="inline-flex items-center text-xs text-[#d4a843] font-mono font-bold bg-[#d4a843]/10 px-3 py-1.5 rounded-lg border border-[#d4a843]/20">
                                                        {item.time}
                                                    </span>
                                                </div>

                                                {/* Event Details */}
                                                <div className="flex-1">
                                                    <p className="font-semibold text-white text-base group-hover:text-[#d4a843] transition-colors">
                                                        {item.event}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1 group-hover:text-zinc-400 transition-colors">
                                                        <MapPin className="w-3 h-3" />
                                                        <span>{item.venue}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Rules & Guidelines Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.15 }}
                                className="rounded-3xl bg-gradient-to-br from-[#12121a] to-[#0c0c12] border border-white/[0.08] p-6 md:p-8 hover:border-[#d4a843]/30 transition-all duration-500 shadow-2xl flex flex-col"
                            >
                                {/* Header */}
                                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/[0.06]">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4a843]/20 to-[#d4a843]/5 border border-[#d4a843]/20 flex items-center justify-center shadow-lg shadow-[#d4a843]/5">
                                        <AlertCircle className="w-6 h-6 text-[#d4a843]" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-bold text-white">Rules & Guidelines</h3>
                                        <p className="text-sm text-zinc-500 font-medium">Important information</p>
                                    </div>
                                </div>

                                {/* Rules List */}
                                <div className="space-y-4 flex-1">
                                    {rules.map((rule, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.2 + index * 0.05 }}
                                            className="flex items-start gap-4 group p-3 rounded-xl hover:bg-white/[0.02] transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4a843]/20 to-[#d4a843]/5 border border-[#d4a843]/30 flex items-center justify-center flex-shrink-0 group-hover:bg-[#d4a843] group-hover:border-[#d4a843] transition-all shadow-lg">
                                                <span className="text-xs font-bold text-[#d4a843] group-hover:text-black transition-colors">{index + 1}</span>
                                            </div>
                                            <p className="text-[14px] text-zinc-300 leading-relaxed pt-1">{rule}</p>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Registration Deadline Alert */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-[#d4a843]/10 to-[#d4a843]/5 border border-[#d4a843]/20 relative overflow-hidden group"
                                >
                                    {/* Decorative Clock */}
                                    <div className="absolute -top-4 -right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Clock className="w-28 h-28 text-[#d4a843]" />
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 text-[#d4a843] font-bold mb-2">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm uppercase tracking-wider">Registration Deadline</span>
                                        </div>
                                        <p className="text-white text-xl md:text-2xl font-bold">
                                            {eventInfo.registrationDeadline}
                                        </p>
                                    </div>

                                    {/* Animated Border */}
                                    <div className="absolute inset-0 rounded-2xl border-2 border-[#d4a843]/0 group-hover:border-[#d4a843]/30 transition-colors duration-500" />
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>
        </center>
    );
};

export default ScheduleSection;

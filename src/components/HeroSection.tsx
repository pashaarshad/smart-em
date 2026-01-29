"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, MapPin, Calendar, Clock } from "lucide-react";
import Link from "next/link";

import CountdownTimer from "./CountdownTimer";

export default function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,168,67,0.12),transparent)]" />

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `linear-gradient(white 1px, transparent 1px),
                             linear-gradient(90deg, white 1px, transparent 1px)`,
                        backgroundSize: '60px 60px'
                    }}
                />

                {/* Floating orbs */}
                <motion.div
                    animate={{
                        y: [0, -30, 0],
                        x: [0, 15, 0],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#d4a843]/5 blur-3xl"
                />
                <motion.div
                    animate={{
                        y: [0, 20, 0],
                        x: [0, -20, 0],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#d4a843]/8 blur-3xl"
                />
            </div>

            <div className="container-main relative z-10 pt-24 pb-16">
                <div className="max-w-5xl mx-auto text-center">
                    {/* College Badge */}
                    {/* College Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d4a843]/10 border border-[#d4a843]/20 mb-8"
                    >
                        <Sparkles className="w-4 h-4 text-[#d4a843]" />
                        <span className="text-sm font-medium text-[#d4a843]">SDC Mysuru Annual Fest</span>
                    </motion.div>



                    {/* Main Heading - SHRESHTA 2026 */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="font-[family-name:var(--font-playfair)] text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
                    >
                        <span className="text-white">SHRESHTA</span>
                        <span className="text-gold-gradient ml-4">2026</span>
                    </motion.h1>

                    {/* Subtitle */}
                    <div className="w-full flex justify-center">
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-lg sm:text-xl text-zinc-400 max-w-2xl my-10 leading-relaxed"
                            style={{ textAlign: 'center' }}
                        >
                            Experience the grandest intercollegiate fest featuring competitions in IT, Management, Cultural &amp; Sports events.
                        </motion.p>
                    </div>

                    {/* Event Info Pills */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
                        style={{ marginTop: '3%', marginBottom: '2%' }}
                    >
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#18181c] border border-[#d4a843]/30">
                            <Calendar className="w-4 h-4 text-[#d4a843]" />
                            <span className="text-sm text-white">February 17, 2026, Tuesday</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#18181c] border border-white/10">
                            <Clock className="w-4 h-4 text-zinc-400" />
                            <span className="text-sm text-zinc-300">8:30 AM onwards</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#18181c] border border-white/10">
                            <MapPin className="w-4 h-4 text-zinc-400" />
                            <span className="text-sm text-zinc-300">Seshadripuram Degree College, Mysuru</span>
                        </div>
                    </motion.div>

                    {/* Countdown Timer */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex justify-center mb-10"
                    >
                        <CountdownTimer />
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        style={{ marginTop: '3%' }}
                    >
                        <Link href="#events" className="btn btn-primary flex items-center gap-2 group px-8 py-3.5">
                            Explore Events
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="#register" className="btn btn-secondary flex items-center gap-2 px-8 py-3.5">
                            Register Now
                        </Link>
                    </motion.div>
                </div>
            </div>

        </section>
    );
}

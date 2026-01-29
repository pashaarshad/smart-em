"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TimeUnit {
    value: number;
    label: string;
}

const CountdownTimer = () => {
    // Event date: February 17, 2026, 8:30 AM IST
    const targetDate = new Date("2026-02-17T08:30:00+05:30").getTime();
    const [timeLeft, setTimeLeft] = useState<TimeUnit[]>([
        { value: 0, label: "Days" },
        { value: 0, label: "Hours" },
        { value: 0, label: "Minutes" },
        { value: 0, label: "Seconds" },
    ]);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);

        const calculateTime = () => {
            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                setTimeLeft([
                    { value: days, label: "Days" },
                    { value: hours, label: "Hours" },
                    { value: minutes, label: "Minutes" },
                    { value: seconds, label: "Seconds" },
                ]);
            }
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    if (!isMounted) {
        return (
            <div className="flex gap-3 sm:gap-4">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col items-center">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#18181c] border border-white/[0.06]" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex gap-3 sm:gap-4">
            {timeLeft.map((unit, index) => (
                <motion.div
                    key={unit.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="flex flex-col items-center"
                >
                    <div className="relative">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#16161c] border border-white/[0.08] flex items-center justify-center overflow-hidden group hover:border-[#d4a843]/50 transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#d4a843]/5 to-transparent" />
                            <AnimatePresence mode="popLayout">
                                <motion.span
                                    key={unit.value}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -20, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-2xl sm:text-3xl font-bold text-white relative z-10 tabular-nums"
                                >
                                    {unit.value.toString().padStart(2, "0")}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-zinc-500 mt-2 uppercase tracking-wider">
                        {unit.label}
                    </span>
                </motion.div>
            ))}
        </div>
    );
};

export default CountdownTimer;

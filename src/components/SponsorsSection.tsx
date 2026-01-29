"use client";

import { motion } from "framer-motion";

const sponsors = [
    { id: 1, image: "/ad1.jpeg", name: "Sponsor 1" },
    { id: 2, image: "/sp2.jfif", name: "Sponsor 2" },
];

const SponsorsSection = () => {
    return (
        <section className="py-20 bg-[#0a0a0c] overflow-hidden">
            <br /><br /><br />
            <div className="container-main px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <span className="text-[#d4a843] text-sm font-semibold tracking-[0.2em] uppercase">
                        Proudly Supported By
                    </span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mt-4">
                        Our Sponsors

                    </h2>
                    <br />
                    <center>
                        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#d4a843] to-transparent mx-auto mt-6 rounded-full" />

                    </center>
                    <br />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="flex flex-wrap justify-center items-center gap-8 md:gap-16"
                >
                    {sponsors.map((sponsor, index) => (
                        <motion.div
                            key={sponsor.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.15 }}
                            whileHover={{ scale: 1.05 }}
                            className="group relative"
                        >
                            <div className="absolute -inset-4 bg-[#d4a843]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative w-64 h-40 bg-[#141418]/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex items-center justify-center hover:border-[#d4a843]/50 transition-all duration-300 shadow-lg">
                                <img
                                    src={sponsor.image}
                                    alt={sponsor.name}
                                    className="w-full h-full object-contain filter brightness-100 hover:brightness-110 transition-all duration-300"
                                />
                            </div>
                            <br />
                        </motion.div>
                    ))}
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-center text-zinc-500 text-sm md:text-base font-medium tracking-wide mt-16"
                >
                    Thank you for making <span className="text-white">SHRESHTA 2026</span> possible
                </motion.p>
            </div>
        </section>
    );
};

export default SponsorsSection;

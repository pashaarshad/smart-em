import Link from "next/link";
import { collegeInfo, studentCouncil } from "@/data/events";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#0a0a0c] border-t border-white/[0.04]" style={{ padding: '2rem' }}>
            <div className="container-main py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-[#d4a843] flex items-center justify-center">
                                <span className="text-black font-bold text-lg">S</span>
                            </div>
                            <div>
                                <p className="text-white font-semibold">SHRESHTA 2026</p>
                                <p className="text-xs text-zinc-500">SDC Mysuru</p>
                            </div>
                        </div>
                        <p className="text-sm text-zinc-500 leading-relaxed mb-6">
                            {collegeInfo.trust}
                        </p>
                        <p className="text-xs text-zinc-600">
                            {collegeInfo.address}
                        </p>
                    </div>

                    {/* Events */}
                    <div>
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Events</h4>
                        <ul className="space-y-3">
                            {[
                                { name: "Tech Events", href: "/#events" },
                                { name: "Management Events", href: "/#events" },
                                { name: "Cultural Events", href: "/#events" },
                                { name: "Sports Events", href: "/#events" },
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm text-zinc-500 hover:text-[#d4a843] transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Quick Links</h4>
                        <ul className="space-y-3">
                            {[
                                { name: "Home", href: "/" },
                                { name: "Schedule", href: "/#schedule" },
                                { name: "Register", href: "/#register" },
                                { name: "About", href: "/#about" },
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm text-zinc-500 hover:text-[#d4a843] transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Student Council */}
                    <div>
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Student Council</h4>
                        <div className="space-y-4">
                            {studentCouncil.slice(0, 3).map((member) => (
                                <div key={member.name}>
                                    <p className="text-xs text-[#d4a843] uppercase tracking-wide">{member.role}</p>
                                    <p className="text-sm text-zinc-400">{member.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <br />

                {/* Bottom Bar */}
                <div className="border-t border-white/[0.04] mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-zinc-300">
                        © {currentYear} <b>SHRESHTA • Seshadripuram Degree College, Mysuru</b>
                    </p>
                    <br />

                </div>

                {/* Designer Credit */}
                <div className="mt-8 pt-8 border-t border-white/[0.04] text-center" style={{ paddingTop: '2rem', paddingBottom: '0.2rem' }}>
                    <p className="text-zinc-100 text-sm">
                        Designed by <a href="https://arshadpasha.tech" target="_blank" rel="noopener noreferrer" className="text-[#d4a843] hover:text-[#e5b854] transition-colors font-bold hover:underline decoration-[#d4a843]/30 underline-offset-4">Arshad Pasha</a>
                    </p>
                </div>
            </div>
        </footer>
    );
}

"use client";

interface SectionHeaderProps {
    title: string;
    subtitle: string;
    category: "it" | "management" | "cultural" | "sports";
    icon: React.ReactNode;
}

export default function SectionHeader({
    title,
    subtitle,
    category,
    icon,
}: SectionHeaderProps) {
    const categoryColors = {
        it: "from-indigo-500 to-purple-600",
        management: "from-amber-500 to-orange-600",
        cultural: "from-pink-500 to-rose-600",
        sports: "from-emerald-500 to-green-600",
    };

    return (
        <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
                <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${categoryColors[category]} flex items-center justify-center`}
                >
                    {icon}
                </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                {title} <span className="text-gradient">Events</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">{subtitle}</p>
        </div>
    );
}

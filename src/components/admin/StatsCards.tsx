"use client";

interface StatsCardsProps {
    stats: {
        total: number;
        pending: number;
        verified: number;
    };
}

export default function StatsCards({ stats }: StatsCardsProps) {
    return (
        <div className="stats-grid">
            <div className="stat-card gold">
                <div className="stat-label">Total Registrations</div>
                <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-card yellow">
                <div className="stat-label">Pending Verification</div>
                <div className="stat-value">{stats.pending}</div>
            </div>
            <div className="stat-card green">
                <div className="stat-label">Verified Payments</div>
                <div className="stat-value">{stats.verified}</div>
            </div>
        </div>
    );
}

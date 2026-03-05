"use client";

interface StatsCardsProps {
    stats: {
        total: number;
        pending: number;
        verified: number;
        checkedIn?: number;
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
            {stats.checkedIn !== undefined && (
                <div className="stat-card" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <div className="stat-label" style={{ color: '#818cf8' }}>📍 Checked In</div>
                    <div className="stat-value" style={{ color: '#a5b4fc' }}>{stats.checkedIn}</div>
                </div>
            )}
        </div>
    );
}

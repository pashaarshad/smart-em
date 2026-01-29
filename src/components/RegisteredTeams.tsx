"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Member {
    name: string;
    phone: string;
}

interface Registration {
    id: string;
    teamNumber: number;
    collegeName: string;
    email: string;
    members: Member[];
    registrationFee: string;
    transactionId: string;
    paymentStatus: string;
    registeredAt: any;
}

interface RegisteredTeamsProps {
    eventId: string;
    eventName: string;
}

export default function RegisteredTeams({ eventId, eventName }: RegisteredTeamsProps) {
    const [teams, setTeams] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const teamsRef = collection(db, "registrations", eventId, "teams");
        const q = query(teamsRef, orderBy("teamNumber", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const teamsData: Registration[] = [];
            snapshot.forEach((doc) => {
                teamsData.push({
                    id: doc.id,
                    ...doc.data()
                } as Registration);
            });
            setTeams(teamsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching teams:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [eventId]);

    return (
        <>
            <style jsx>{`
                .teams-container {
                    background: linear-gradient(180deg, rgba(24, 24, 28, 0.8) 0%, rgba(24, 24, 28, 0.5) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 20px;
                    padding: 28px;
                    margin-top: 8px;
                }

                .teams-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 28px;
                }

                .teams-icon {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, rgba(212, 168, 67, 0.15) 0%, rgba(212, 168, 67, 0.05) 100%);
                    border: 1px solid rgba(212, 168, 67, 0.25);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .teams-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #fff;
                    margin: 0;
                }

                .teams-count {
                    font-size: 14px;
                    color: #d4a843;
                    font-weight: 600;
                    margin-left: 8px;
                }

                .loading-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(212, 168, 67, 0.2);
                    border-top-color: #d4a843;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                }

                .empty-icon {
                    width: 70px;
                    height: 70px;
                    margin: 0 auto 20px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .empty-title {
                    font-size: 16px;
                    color: #71717a;
                    margin: 0 0 8px 0;
                }

                .empty-subtitle {
                    font-size: 14px;
                    color: #52525b;
                    margin: 0;
                }

                .teams-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                }

                .teams-table th {
                    text-align: left;
                    padding: 14px 16px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #d4a843;
                    background: rgba(0, 0, 0, 0.3);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }

                .teams-table th:first-child {
                    border-radius: 10px 0 0 0;
                }

                .teams-table th:last-child {
                    border-radius: 0 10px 0 0;
                }

                .teams-table td {
                    padding: 16px;
                    font-size: 14px;
                    color: #a1a1aa;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                    vertical-align: top;
                }

                .teams-table tr:hover td {
                    background: rgba(255, 255, 255, 0.02);
                }

                .team-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    background: linear-gradient(135deg, rgba(212, 168, 67, 0.2) 0%, rgba(212, 168, 67, 0.1) 100%);
                    border: 1px solid rgba(212, 168, 67, 0.3);
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 700;
                    color: #d4a843;
                }

                .college-name {
                    color: #e4e4e7;
                    font-weight: 500;
                }

                .email-text {
                    font-size: 12px;
                    color: #71717a;
                    word-break: break-all;
                }

                .member-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 6px 0;
                    font-size: 13px;
                }

                .member-name {
                    color: #e4e4e7;
                    font-weight: 500;
                }

                .member-phone {
                    color: #71717a;
                    font-family: monospace;
                    font-size: 12px;
                }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .status-pending {
                    background: rgba(234, 179, 8, 0.15);
                    color: #fbbf24;
                    border: 1px solid rgba(234, 179, 8, 0.3);
                }

                .status-verified {
                    background: rgba(34, 197, 94, 0.15);
                    color: #4ade80;
                    border: 1px solid rgba(34, 197, 94, 0.3);
                }

                /* Mobile Cards */
                .mobile-cards {
                    display: none;
                }

                .team-card {
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 16px;
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                }

                .card-team {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .card-team-label {
                    font-size: 16px;
                    font-weight: 700;
                    color: #fff;
                }

                .card-row {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 10px 0;
                }

                .card-icon {
                    width: 32px;
                    height: 32px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .card-content {
                    flex: 1;
                }

                .card-label {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #71717a;
                    margin-bottom: 4px;
                }

                .card-value {
                    font-size: 14px;
                    color: #e4e4e7;
                }

                .members-list {
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                }

                .members-label {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #71717a;
                    margin-bottom: 12px;
                }

                .member-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 12px;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 8px;
                    margin-bottom: 6px;
                }

                @media (max-width: 768px) {
                    .desktop-table {
                        display: none;
                    }

                    .mobile-cards {
                        display: block;
                    }

                    .teams-container {
                        padding: 20px;
                    }
                }
            `}</style>

            <div className="teams-container">
                <div className="teams-header">
                    <div className="teams-icon">
                        <svg width="24" height="24" fill="none" stroke="#d4a843" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h2 className="teams-title">
                        Registered Teams
                        {teams.length > 0 && <span className="teams-count">({teams.length})</span>}
                    </h2>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner" />
                    </div>
                ) : teams.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg width="32" height="32" fill="none" stroke="#52525b" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <p className="empty-title">No teams registered yet</p>
                        <p className="empty-subtitle">Be the first to register for this event!</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="desktop-table">
                            <table className="teams-table">
                                <thead>
                                    <tr>
                                        <th>Team</th>
                                        <th>College</th>
                                        <th>Email</th>
                                        <th>Members</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teams.map((team) => (
                                        <tr key={team.id}>
                                            <td>
                                                <span className="team-badge">{team.teamNumber}</span>
                                            </td>
                                            <td>
                                                <span className="college-name">{team.collegeName}</span>
                                            </td>
                                            <td>
                                                <span className="email-text">{team.email}</span>
                                            </td>
                                            <td>
                                                {team.members.map((member, idx) => (
                                                    <div key={idx} className="member-item">
                                                        <span className="member-name">{member.name}</span>
                                                        <span className="member-phone">{member.phone}</span>
                                                    </div>
                                                ))}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${team.paymentStatus === "completed" ? "status-verified" : "status-pending"}`}>
                                                    {team.paymentStatus === "completed" ? (
                                                        <>
                                                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Verified
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Pending
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="mobile-cards">
                            {teams.map((team) => (
                                <div key={team.id} className="team-card">
                                    <div className="card-header">
                                        <div className="card-team">
                                            <span className="team-badge">{team.teamNumber}</span>
                                            <span className="card-team-label">Team {team.teamNumber}</span>
                                        </div>
                                        <span className={`status-badge ${team.paymentStatus === "completed" ? "status-verified" : "status-pending"}`}>
                                            {team.paymentStatus === "completed" ? "Verified" : "Pending"}
                                        </span>
                                    </div>

                                    <div className="card-row">
                                        <div className="card-icon">
                                            <svg width="16" height="16" fill="none" stroke="#71717a" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <div className="card-content">
                                            <div className="card-label">College</div>
                                            <div className="card-value">{team.collegeName}</div>
                                        </div>
                                    </div>

                                    <div className="card-row">
                                        <div className="card-icon">
                                            <svg width="16" height="16" fill="none" stroke="#71717a" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="card-content">
                                            <div className="card-label">Email</div>
                                            <div className="card-value" style={{ fontSize: '12px', wordBreak: 'break-all' }}>{team.email}</div>
                                        </div>
                                    </div>

                                    <div className="members-list">
                                        <div className="members-label">Team Members</div>
                                        {team.members.map((member, idx) => (
                                            <div key={idx} className="member-row">
                                                <span className="member-name">{member.name}</span>
                                                <span className="member-phone">{member.phone}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

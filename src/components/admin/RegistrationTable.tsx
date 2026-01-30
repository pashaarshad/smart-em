"use client";

import { Registration } from "@/types/admin";
import { formatDate } from "@/lib/admin/export";

interface RegistrationTableProps {
    registrations: Registration[];
    onRowClick: (reg: Registration) => void;
}

export default function RegistrationTable({ registrations, onRowClick }: RegistrationTableProps) {
    return (
        <div className="mobile-scroll">
            <table className="registrations-table">
                <thead className="desktop-only">
                    <tr>
                        <th>#</th>
                        <th>Event</th>
                        <th>College</th>
                        <th>Email</th>
                        <th>Members</th>
                        <th>Fee</th>
                        <th>UTR Number</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody className="desktop-table-body">
                    {registrations.map((reg) => (
                        <tr key={`${reg.eventId}-${reg.id}`} onClick={() => onRowClick(reg)}>
                            <td>
                                <span className="team-badge">{reg.teamNumber}</span>
                            </td>
                            <td>
                                <span className="event-tag">{reg.eventName}</span>
                            </td>
                            <td>
                                <span className="college-name">{reg.collegeName}</span>
                            </td>
                            <td>
                                <span className="email-text">{reg.email}</span>
                            </td>
                            <td>
                                {reg.members?.map((member, idx) => (
                                    <div key={idx} className="member-item">
                                        <span className="member-name">{member.name}</span>
                                        <span className="member-phone">{member.phone}</span>
                                    </div>
                                ))}
                            </td>
                            <td>{reg.registrationFee}</td>
                            <td>
                                <span className="utr-number">{reg.utrNumber}</span>
                            </td>
                            <td>
                                <span
                                    className={`status-select ${reg.paymentStatus === "completed" ? "status-completed" : "status-pending"}`}
                                    style={{ padding: '6px 10px', display: 'inline-block' }}
                                >
                                    {reg.paymentStatus === "completed" ? "Verified" : "Pending"}
                                </span>
                            </td>
                            <td>
                                <span className="date-text">{formatDate(reg.registeredAt)}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_YOUR_API_KEY_HERE");
const FROM_EMAIL = process.env.FROM_EMAIL || "SHRESHTA 2026 <events@shreshta2026.com>";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type } = body;

        if (type === "qr") {
            const { to, subject, teamNumber, eventName, collegeName, members, qrCodeUrl } = body;

            const membersList = members
                .map((m: { name: string; phone: string }, i: number) => `<li>${m.name} — ${m.phone}</li>`)
                .join("");

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: [to],
                subject,
                html: `
                    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #e4e4e7; border-radius: 16px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px; text-align: center;">
                            <h1 style="color: #d4a843; margin: 0; font-size: 28px;">SHRESHTA 2026</h1>
                            <p style="color: #a1a1aa; margin: 8px 0 0;">Seshadripuram Degree College, Mysuru</p>
                        </div>
                        
                        <div style="padding: 32px;">
                            <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
                                <p style="color: #34d399; font-size: 18px; font-weight: 700; margin: 0;">✅ Registration Verified!</p>
                            </div>
                            
                            <h2 style="color: #d4a843; margin: 0 0 4px;">Team #${teamNumber}</h2>
                            <p style="color: #a1a1aa; margin: 0 0 20px; font-size: 14px;">Event: <strong style="color: #fff;">${eventName}</strong></p>
                            
                            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                                <p style="color: #a1a1aa; margin: 0 0 6px; font-size: 13px;">College</p>
                                <p style="color: #fff; margin: 0 0 16px; font-weight: 600;">${collegeName}</p>
                                <p style="color: #a1a1aa; margin: 0 0 6px; font-size: 13px;">Team Members</p>
                                <ul style="color: #fff; margin: 0; padding: 0 0 0 18px; line-height: 1.8;">${membersList}</ul>
                            </div>
                            
                            <div style="text-align: center; margin: 24px 0;">
                                <p style="color: #d4a843; font-weight: 700; margin: 0 0 12px;">🎫 Your Entry QR Code</p>
                                <img src="${qrCodeUrl}" alt="QR Code" style="width: 250px; height: 250px; border-radius: 12px; border: 2px solid rgba(212,168,67,0.3);" />
                                <p style="color: #a1a1aa; font-size: 12px; margin: 12px 0 0;">Show this QR code at the venue for entry</p>
                            </div>
                            
                            <div style="background: rgba(212,168,67,0.1); border: 1px solid rgba(212,168,67,0.2); border-radius: 12px; padding: 16px; text-align: center;">
                                <p style="color: #d4a843; font-weight: 600; margin: 0;">📅 Feb 17, 2026 | ⏰ Reporting: 8:30 AM</p>
                                <p style="color: #a1a1aa; font-size: 13px; margin: 8px 0 0;">SDC Campus, Hebbal Ring Road, Mysuru</p>
                            </div>
                        </div>
                        
                        <div style="background: rgba(255,255,255,0.03); padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06);">
                            <p style="color: #71717a; font-size: 12px; margin: 0;">© 2026 SHRESHTA — Seshadripuram Degree College, Mysuru</p>
                        </div>
                    </div>
                `,
            });

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 400 });
            }

            return NextResponse.json({ success: true, id: data?.id });
        }

        if (type === "certificate") {
            const { to, subject, participantName, eventName, certificateUrl } = body;

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: [to],
                subject,
                html: `
                    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #e4e4e7; border-radius: 16px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px; text-align: center;">
                            <h1 style="color: #d4a843; margin: 0;">🏆 Certificate of Participation</h1>
                        </div>
                        <div style="padding: 32px; text-align: center;">
                            <p style="color: #fff; font-size: 18px;">Dear <strong>${participantName}</strong>,</p>
                            <p style="color: #a1a1aa;">Thank you for participating in <strong style="color: #d4a843;">${eventName}</strong> at SHRESHTA 2026.</p>
                            <p style="color: #a1a1aa;">Your certificate is attached below:</p>
                            <a href="${certificateUrl}" style="display: inline-block; margin: 20px 0; padding: 14px 32px; background: linear-gradient(135deg, #d4a843, #b88a2e); color: #000; text-decoration: none; border-radius: 10px; font-weight: 700;">Download Certificate</a>
                        </div>
                    </div>
                `,
            });

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 400 });
            }

            return NextResponse.json({ success: true, id: data?.id });
        }

        if (type === "alert") {
            const { to, subject, eventName, message } = body;

            const recipients = Array.isArray(to) ? to : [to];

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: recipients,
                subject,
                html: `
                    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #e4e4e7; border-radius: 16px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px; text-align: center;">
                            <h1 style="color: #d4a843; margin: 0;">📢 Event Update</h1>
                            <p style="color: #a1a1aa; margin: 8px 0 0;">${eventName} — SHRESHTA 2026</p>
                        </div>
                        <div style="padding: 32px;">
                            <div style="background: rgba(212,168,67,0.1); border: 1px solid rgba(212,168,67,0.2); border-radius: 12px; padding: 20px;">
                                <p style="color: #fff; font-size: 16px; line-height: 1.6; margin: 0;">${message}</p>
                            </div>
                        </div>
                    </div>
                `,
            });

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 400 });
            }

            return NextResponse.json({ success: true, id: data?.id });
        }

        return NextResponse.json({ error: "Invalid email type" }, { status: 400 });
    } catch (error: any) {
        console.error("Email API error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}

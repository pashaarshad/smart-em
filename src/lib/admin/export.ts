import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Registration } from "@/types/admin";

export const formatDate = (timestamp: any) => {
    if (!timestamp?.seconds) return "N/A";
    return new Date(timestamp.seconds * 1000).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

export const getExportData = (data: Registration[], exportFields: any) => {
    return data.map(r => {
        const baseData: any = {
            "ID": r.teamNumber,
            "Event": r.eventName,
            "College": r.collegeName,
            "Email": r.email,
        };

        const maxMembers = 5;
        for (let i = 0; i < maxMembers; i++) {
            const member = r.members[i];
            if (member) {
                baseData[`M${i + 1} Name`] = member.name;
                baseData[`M${i + 1} #`] = member.phone;
            } else {
                baseData[`M${i + 1} Name`] = "";
                baseData[`M${i + 1} #`] = "";
            }
        }

        if (exportFields.fee) baseData["Fee"] = r.registrationFee;
        if (exportFields.utr) baseData["UTR"] = r.utrNumber;
        if (exportFields.status) baseData["Status"] = r.paymentStatus;
        if (exportFields.date) baseData["Date"] = formatDate(r.registeredAt).split(',')[0];

        return baseData;
    });
};

export const exportToExcel = (registrations: Registration[], selectedEvent: string, allEvents: any[], exportFields: any) => {
    const wb = XLSX.utils.book_new();
    const exportDate = new Date().toISOString().split('T')[0];

    const processSheet = (regs: Registration[], sheetName: string) => {
        const formattedData = getExportData(regs, exportFields);
        const ws = XLSX.utils.json_to_sheet(formattedData);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    };

    if (selectedEvent === "all") {
        const grouped = registrations.reduce((acc, curr) => {
            const key = curr.eventName || "Unknown";
            if (!acc[key]) acc[key] = [];
            acc[key].push(curr);
            return acc;
        }, {} as Record<string, Registration[]>);

        Object.keys(grouped).forEach(eventName => {
            const safeName = eventName.replace(/[\[\]\*\/\\\?]/g, "").substring(0, 30);
            processSheet(grouped[eventName], safeName);
        });
    } else {
        const filtered = registrations.filter(r => r.eventId === selectedEvent);
        processSheet(filtered, "Registrations");
    }

    XLSX.writeFile(wb, `Shreshta_Registrations_${exportDate}.xlsx`);
};

export const exportToPDF = (registrations: Registration[], selectedEvent: string, allEvents: any[], exportFields: any) => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const exportDate = new Date().toISOString().split('T')[0];

    doc.setFontSize(18);
    doc.text("SHRESHTA 2026 - Registrations", 14, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${exportDate}`, 14, 28);

    const headers = ["ID", "College", "Email"];
    const maxMembers = 5;
    for (let i = 0; i < maxMembers; i++) {
        headers.push(`M${i + 1}`);
    }

    if (exportFields.fee) headers.push("Fee");
    if (exportFields.utr) headers.push("UTR");
    if (exportFields.status) headers.push("Status");

    const generateTable = (data: Registration[], startY: number) => {
        const tableRows = data.map(r => {
            const row = [
                r.teamNumber.toString(),
                r.collegeName,
                r.email
            ];

            for (let i = 0; i < maxMembers; i++) {
                const m = r.members[i];
                row.push(m ? `${m.name}\n${m.phone}` : "-");
            }

            if (exportFields.fee) row.push(r.registrationFee);
            if (exportFields.utr) row.push(r.utrNumber);
            if (exportFields.status) row.push(r.paymentStatus);

            return row;
        });

        autoTable(doc, {
            head: [headers],
            body: tableRows,
            startY: startY,
            theme: 'grid',
            styles: { fontSize: 7, cellPadding: 1 },
            headStyles: { fillColor: [212, 168, 67] },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 35 },
                2: { cellWidth: 35 },
            }
        });
        // @ts-ignore
        return doc.lastAutoTable.finalY + 10;
    };

    let lastY = 35;

    if (selectedEvent === "all") {
        const grouped = registrations.reduce((acc, curr) => {
            const key = curr.eventName || "Unknown";
            if (!acc[key]) acc[key] = [];
            acc[key].push(curr);
            return acc;
        }, {} as Record<string, Registration[]>);

        Object.keys(grouped).forEach(eventName => {
            if (lastY > 180) {
                doc.addPage();
                lastY = 20;
            }

            doc.setFontSize(14);
            doc.setTextColor(212, 168, 67);
            doc.text(eventName, 14, lastY);
            doc.setTextColor(0, 0, 0);

            lastY = generateTable(grouped[eventName], lastY + 5);
        });
    } else {
        const filtered = registrations.filter(r => r.eventId === selectedEvent);
        doc.setTextColor(212, 168, 67);
        const eventName = filtered[0]?.eventName || "Event Details";
        doc.text(eventName, 14, lastY);
        doc.setTextColor(0, 0, 0);
        generateTable(filtered, lastY + 5);
    }

    doc.save(`Shreshta_Registrations_${exportDate}.pdf`);
};

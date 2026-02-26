import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useReferenceStore } from '../stores/useReferenceStore';

// Extend jsPDF type to include autotable
interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: { finalY: number };
}

// Helper to find nominal diameter
const getNominalDiameter = (d_mm: number): string => {
    const diameters = useReferenceStore.getState().diameters;
    // Find key where value equals d_mm (or is very close)
    const entry = Object.entries(diameters).find(([_, info]) => Math.abs(info - d_mm) < 0.1);

    if (entry) {
        // If key format is like '4" (100mm)', extract '4"'
        // Or if it is just '4"', return it.
        const match = entry[0].match(/(\d+(?:\.\d+)?")/);
        if (match) return match[1];
        return entry[0].replace(/\s*\(.*?\)/, '').trim(); // Remove (...mm) if present
    }

    // Fallback: Calculate
    if (d_mm) {
        const inches = d_mm / 25.4;
        // If close to integer, return integer
        if (Math.abs(inches - Math.round(inches)) < 0.1) {
            return `${Math.round(inches)}"`;
        }
        return `${inches.toFixed(2)}"`;
    }
    return '-';
};

export interface ReportData {
    projectName?: string;
    scenarioName?: string;
    fluid: {
        name: string;
        temperature: number;
        density: number;
        viscosity: number;
        vaporPressure: number;
    };
    operatingConditions: {
        flow: number;
        head: number;
        staticHead: number;
        pressureSuction: number;
        pressureDischarge: number;
        altitude: number;
        atmosphericPressure: number;
    };
    pump: {
        manufacturer?: string;
        model?: string;
        speed?: number;
        points: { flow: number; head: number; efficiency?: number; npshr?: number }[];
    };
    results: {
        dutyFlow: number;
        dutyHead: number;
        efficiency?: number;
        power?: number;
        costPerYear?: number;
        npshAvailable: number;
        npshRequired?: number;
        npshMargin?: string;
        isExtrapolated?: boolean;
        cavitationRisk?: boolean;
        lowNpshMarginLevel?: 'warning' | 'danger' | 'safe';
        headBreakdown?: {
            static: number;
            pressure: number;
            friction: number;
            total: number;
        }
    };
    suction: {
        totalLength: number;
        totalLoss: number;
        segments: any[];
    };
    discharge: {
        totalLength: number;
        totalLoss: number;
        segments: any[];
    };
    // New fields for Page 2
    charts?: {
        systemCurveImg?: string; // Data URL
        npshCurveImg?: string;   // Data URL
        networkDiagramImg?: string; // Data URL
        networkDiagramRatio?: number;
    };
}

export const generatePDFReport = (data: ReportData) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;
    const chartWidth = pageWidth - (margin * 2);
    let yPos = 20;

    // --- PAGE 1: Summary & Tables ---

    // --- Header ---
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185); // Blue
    doc.text("Pump Analysis Report", margin, yPos);

    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos);

    if (data.projectName) {
        doc.text(`Project: ${data.projectName}`, pageWidth - margin - 50, yPos - 5);
    }
    if (data.scenarioName) {
        doc.text(`Scenario: ${data.scenarioName}`, pageWidth - margin - 50, yPos);
    }

    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(margin, yPos + 5, pageWidth - margin, yPos + 5);
    yPos += 15;

    // --- 1. Executive Summary (Results) ---
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("1. Calculation Results", margin, yPos);
    yPos += 8;

    const resultsBody = [
        ['Operating Flow', `${data.results.dutyFlow.toFixed(2)} m³/h`, 'Total Dynamic Head', `${data.results.dutyHead.toFixed(2)} m`],
        ['NPSH Available', `${data.results.npshAvailable.toFixed(2)} m`, 'NPSH Required', data.results.npshRequired ? `${data.results.npshRequired.toFixed(2)} m` : 'N/A'],
        ['NPSH Margin', data.results.npshMargin || '-', 'Efficiency', data.results.efficiency ? `${data.results.efficiency.toFixed(1)} %` : '-'],
        ['Shaft Power', data.results.power ? `${data.results.power.toFixed(2)} kW` : '-', 'Est. Yearly Cost', data.results.costPerYear ? `R$ ${data.results.costPerYear.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-']
    ];

    autoTable(doc, {
        startY: yPos,
        head: [],
        body: resultsBody,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 40 },
            1: { cellWidth: 50 },
            2: { fontStyle: 'bold', cellWidth: 40 },
            3: { cellWidth: 50 }
        }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // --- Head Breakdown (if available) ---
    if (data.results.headBreakdown) {
        doc.setFontSize(11);
        doc.text("Head Breakdown", margin, yPos);
        yPos += 5;

        const bd = data.results.headBreakdown;
        autoTable(doc, {
            startY: yPos,
            head: [['Component', 'Value (m)', 'Description']],
            body: [
                ['Static Head', bd.static.toFixed(2), 'Elevation Difference (Z2 - Z1)'],
                ['Pressure Head', bd.pressure.toFixed(2), 'Pressure Difference (P2 - P1)'],
                ['Friction Head', bd.friction.toFixed(2), 'Major and Minor Losses'],
                ['Total Head', bd.total.toFixed(2), 'Total Dynamic Head required']
            ],
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 9 }
        });
        yPos = doc.lastAutoTable.finalY + 10;
    }

    // --- 2. System Parameters ---
    doc.setFontSize(14);
    doc.text("2. System Parameters", margin, yPos);
    yPos += 8;

    const paramsBody = [
        ['Fluid Name', data.fluid.name, 'Static Head', `${data.operatingConditions.staticHead} m`],
        ['Density', `${data.fluid.density} kg/m³`, 'Suction Press.', `${data.operatingConditions.pressureSuction} bar g`],
        ['Viscosity', `${data.fluid.viscosity.toExponential(2)} m²/s`, 'Discharge Press.', `${data.operatingConditions.pressureDischarge} bar g`],
        ['Vapor Press.', `${data.fluid.vaporPressure} kPa`, 'Altitude', `${data.operatingConditions.altitude} m`],
        ['Atm. Pressure', `${data.operatingConditions.atmosphericPressure.toFixed(3)} bar`, '', '']
    ];

    autoTable(doc, {
        startY: yPos,
        body: paramsBody,
        theme: 'grid',
        headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 }, 2: { fontStyle: 'bold', cellWidth: 35 } }
    });
    yPos = doc.lastAutoTable.finalY + 10;

    // --- 3. Pump Details & Curve Data (Moved Here) ---
    // Check if enough space, else add page
    if (yPos + 60 > pageHeight - margin) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFontSize(14);
    doc.text("3. Pump Curve Data", margin, yPos);
    yPos += 8;

    // Manufacturer Info
    doc.setFontSize(10);
    doc.text(`Manufacturer: ${data.pump.manufacturer || 'Generic'}`, margin, yPos);
    doc.text(`Model: ${data.pump.model || 'Custom Curve'}`, margin + 100, yPos);
    yPos += 8;

    // Curve Points Table
    const curveBody = data.pump.points.map(p => [
        p.flow.toFixed(2),
        p.head.toFixed(2),
        p.efficiency ? p.efficiency.toFixed(1) : '-',
        p.npshr ? p.npshr.toFixed(2) : 'Opt'
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Flow (m³/h)', 'Head (m)', 'Eff (%)', 'NPSHr (m)']],
        body: curveBody,
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 2, halign: 'center' },
        headStyles: { halign: 'center', fillColor: [41, 128, 185] },
        margin: { left: margin, right: margin }
    });
    yPos = doc.lastAutoTable.finalY + 15;


    // --- PAGE 2: Charts (Dedicated Page) ---
    if (data.charts) {
        doc.addPage();
        yPos = 20;

        // Header Page 2
        doc.setFontSize(16);
        doc.setTextColor(41, 128, 185);
        doc.text("System Analysis & Visualization", margin, yPos);
        yPos += 15;

        // We want both charts on one page. 
        // Available vertical space is roughly 297 - 20 (yPos) - 14 (margin) = 263mm
        // For 2 charts, we previously used 115mm each + padding, which was too tight at the bottom.
        const chartHeight = 105;
        // Maintain a 4:3 aspect ratio based on our 1200x900 HTML export
        const renderWidth = chartHeight * (1200 / 900); // ~153mm
        // Center the charts horizontally on the 210mm wide A4 page.
        const xOffset = (pageWidth - renderWidth) / 2;

        if (data.charts.systemCurveImg) {
            // Use JPEG format
            doc.addImage(data.charts.systemCurveImg, 'JPEG', xOffset, yPos, renderWidth, chartHeight);
            yPos += chartHeight + 4; // Reduced gap for warning

            // Add Extrapolation Warning under System Curve if applicable
            if (data.results.isExtrapolated) {
                // Amber style box
                doc.setDrawColor(245, 158, 11);
                doc.setFillColor(255, 251, 235);
                doc.setLineWidth(0.3);
                const boxHeight = 10;
                doc.roundedRect(xOffset, yPos, renderWidth, boxHeight, 1, 1, 'FD');

                doc.setFontSize(9);
                doc.setTextColor(180, 83, 9);
                doc.text("WARNING: Estimated Operating Point. The intersection extrapolates the provided pump curve.", pageWidth / 2, yPos + 6.5, { align: 'center' });
                yPos += boxHeight + 4;
            } else {
                yPos += 6; // Normal spacing if no warning
            }
        }

        if (data.charts.npshCurveImg) {
            doc.addImage(data.charts.npshCurveImg, 'JPEG', xOffset, yPos, renderWidth, chartHeight);
            yPos += chartHeight + 4; // Reduced gap for warnings

            // Add NPSH Warnings under NPSH chart if applicable
            if (data.results.cavitationRisk) {
                // Red style box
                doc.setDrawColor(239, 68, 68);
                doc.setFillColor(254, 242, 242);
                doc.setLineWidth(0.3);
                const boxHeight = 10;
                doc.roundedRect(xOffset, yPos, renderWidth, boxHeight, 1, 1, 'FD');

                doc.setFontSize(9);
                doc.setTextColor(185, 28, 28);
                doc.text("DANGER: CAVITATION RISK! NPSH Available is less than NPSH Required.", pageWidth / 2, yPos + 6.5, { align: 'center' });
                yPos += boxHeight + 4;
            } else if (data.results.lowNpshMarginLevel === 'warning') {
                // Amber style box
                doc.setDrawColor(245, 158, 11);
                doc.setFillColor(255, 251, 235);
                doc.setLineWidth(0.3);
                const boxHeight = 10;
                doc.roundedRect(xOffset, yPos, renderWidth, boxHeight, 1, 1, 'FD');

                doc.setFontSize(9);
                doc.setTextColor(180, 83, 9);
                doc.text("WARNING: Low NPSH Margin (< 20%). Risk of cavitation under varying conditions.", pageWidth / 2, yPos + 6.5, { align: 'center' });
                yPos += boxHeight + 4;
            } else {
                yPos += 6;
            }
        }

        // Start new page for Network Details
        doc.addPage();
        yPos = 20;
    } else {
        doc.addPage();
        yPos = 20;
    }

    // --- 4. Pipe Network Details (Moved Here) ---
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("4. Pipe Network Details", margin, yPos);
    yPos += 8;

    // Suction Table
    doc.setFontSize(11);
    doc.text("Suction Line", margin, yPos);
    yPos += 4;

    const suctionRows = data.suction.segments.map((seg: any) => [
        seg.name,
        `${seg.length_m} m`,
        getNominalDiameter(seg.diameter_mm),
        seg.material || '-',
        seg.loss_m !== null && seg.loss_m !== undefined ? `${seg.loss_m.toFixed(2)} m` : '-'
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Segment', 'Length', 'Diameter', 'Material', 'Head Loss']],
        body: suctionRows,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] },
        styles: { fontSize: 9, cellPadding: 2, halign: 'center' },
        columnStyles: { 0: { halign: 'left' }, 3: { halign: 'left' } }
    });
    yPos = doc.lastAutoTable.finalY + 8;

    // Discharge Table
    doc.setFontSize(11);
    doc.text("Discharge Line", margin, yPos);
    yPos += 4;

    const dischargeRows = data.discharge.segments.map((seg: any) => [
        seg.name,
        `${seg.length_m} m`,
        getNominalDiameter(seg.diameter_mm),
        seg.material || '-',
        seg.loss_m !== null && seg.loss_m !== undefined ? `${seg.loss_m.toFixed(2)} m` : '-'
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Segment', 'Length', 'Diameter', 'Material', 'Head Loss']],
        body: dischargeRows,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] },
        styles: { fontSize: 9, cellPadding: 2, halign: 'center' },
        columnStyles: { 0: { halign: 'left' }, 3: { halign: 'left' } }
    });

    yPos = doc.lastAutoTable.finalY + 15;


    // --- 5. Calculated Network Diagram (Full Width) ---
    if (data.charts?.networkDiagramImg) {
        // Calculate proportional height based on the physical canvas.
        const ratio = data.charts.networkDiagramRatio || 2;
        // The renderWidth matches chartWidth (the page width minus margins)
        // With proportional height, it guarantees no distortion.
        let renderWidth = chartWidth;
        let renderHeight = renderWidth / ratio;

        // Ensure it fits the page.
        if (yPos + renderHeight > pageHeight - margin) {
            // Give it a fresh page if the remaining space is minimal
            doc.addPage();
            yPos = 20;

            // Cap height to max achievable on an A4 page
            renderHeight = Math.min(renderHeight, pageHeight - margin - yPos - 10);
            renderWidth = renderHeight * ratio; // Re-adjust width to maintain proportion
        }

        // Center it horizontally if width shrunk due to height cap
        const xOffset = margin + (chartWidth - renderWidth) / 2;

        doc.setFontSize(12);
        doc.setTextColor(41, 128, 185);
        doc.text("Calculated Network Diagram", margin, yPos - 5);

        // Usage JPEG
        doc.addImage(data.charts.networkDiagramImg, 'JPEG', xOffset, yPos, renderWidth, renderHeight);
    }


    // Clean filename
    const safeName = (data.projectName || 'report').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const filename = `pump_analysis_${safeName}.pdf`;

    try {
        const pdfBlob = doc.output('blob');
        // Convert to octet-stream to bypass Chrome's built-in PDF viewer intercept, which strips the `download` attribute upon async creation
        const downloadBlob = new Blob([pdfBlob], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(downloadBlob);

        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);

        link.click();

        // Give browser plenty of time to read the Blob before revoking (fixes Chrome network error)
        setTimeout(() => {
            if (link.parentNode) link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 15000);
    } catch (e) {
        console.error("Manual save failed, attempting fallback:", e);
        try {
            // Fallback: Open in new tab as Base64 PDF
            const pdfDataUri = doc.output('datauristring');
            const newWindow = window.open();
            if (newWindow) {
                newWindow.document.write(`<iframe width='100%' height='100%' src='${pdfDataUri}'></iframe>`);
            } else {
                alert("Please allow pop-ups to view the PDF.");
            }
        } catch (fallbackError) {
            console.error("Fallback also failed", fallbackError);
            alert("Failed to generate PDF. See console for details.");
        }
    }
};

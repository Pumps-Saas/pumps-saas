import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autotable
interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: { finalY: number };
}

interface ReportData {
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
        npshAvailable: number;
        npshRequired?: number;
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
    };
}

export const generatePDFReport = (data: ReportData) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;
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
        ['Efficiency', data.results.efficiency ? `${data.results.efficiency.toFixed(1)} %` : '-', 'Shaft Power', data.results.power ? `${data.results.power.toFixed(2)} kW` : '-']
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

    // --- 3. Pipe Network ---
    doc.setFontSize(14);
    doc.text("3. Pipe Network Details", margin, yPos);
    yPos += 8;

    // Suction Table
    doc.setFontSize(11);
    doc.text("Suction Line", margin, yPos);
    yPos += 4;

    const suctionRows = data.suction.segments.map((seg: any) => [
        seg.name,
        `${seg.length_m} m`,
        `${seg.diameter_mm} mm`,
        `${seg.roughness_mm} mm`,
        seg.fittings ? seg.fittings.length : 0
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Segment', 'Length', 'Diameter', 'Roughness', 'Fittings']],
        body: suctionRows,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] },
        styles: { fontSize: 9 }
    });
    yPos = doc.lastAutoTable.finalY + 8;

    // Discharge Table
    doc.setFontSize(11);
    doc.text("Discharge Line", margin, yPos);
    yPos += 4;

    const dischargeRows = data.discharge.segments.map((seg: any) => [
        seg.name,
        `${seg.length_m} m`,
        `${seg.diameter_mm} mm`,
        `${seg.roughness_mm} mm`,
        seg.fittings ? seg.fittings.length : 0
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Segment', 'Length', 'Diameter', 'Roughness', 'Fittings']],
        body: dischargeRows,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] },
        styles: { fontSize: 9 }
    });

    // --- PAGE 2: Charts & Visuals ---
    if (data.charts) {
        doc.addPage();
        yPos = 20;

        // Header Page 2
        doc.setFontSize(16);
        doc.setTextColor(41, 128, 185);
        doc.text("System Analysis & Visualization", margin, yPos);
        yPos += 15;

        // 1. Curve Layout (Top Half)
        // We'll place System Curve (Left) and NPSH Curve (Right)
        const chartWidth = (pageWidth - (margin * 3)) / 2;
        const chartHeight = 70; // Fixed height for charts

        if (data.charts.systemCurveImg) {
            doc.addImage(data.charts.systemCurveImg, 'PNG', margin, yPos, chartWidth, chartHeight);
            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.text("System vs Pump Curve", margin, yPos + chartHeight + 5);
        }

        if (data.charts.npshCurveImg) {
            doc.addImage(data.charts.npshCurveImg, 'PNG', margin + chartWidth + margin, yPos, chartWidth, chartHeight);
            doc.text("NPSH Available vs Required", margin + chartWidth + margin, yPos + chartHeight + 5);
        }

        yPos += chartHeight + 20;

        // 2. Pump Details & Curve Data (Middle/Bottom Right)
        doc.setFontSize(12);
        doc.setTextColor(41, 128, 185);
        doc.text("Pump Curve Data", margin, yPos);
        yPos += 5;

        // Manufacturer Info
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Manufacturer: ${data.pump.manufacturer || 'Generic'}`, margin, yPos);
        doc.text(`Model: ${data.pump.model || 'Custom Curve'}`, margin + 80, yPos);
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
            headStyles: { halign: 'center', fillColor: [41, 128, 185] }, // Center headers too
            margin: { left: margin, right: pageWidth / 2 + 10 } // Constrain width if we want side-by-side or full width
        });

        // Track where the table ended
        const tableEndY = doc.lastAutoTable.finalY + 15;

        // 3. Network Diagram (Bottom)
        // If we have space, put it below.
        if (data.charts.networkDiagramImg) {
            // Check if we have space on this page, otherwise add new page
            const remainingHeight = pageHeight - tableEndY - margin;
            const diagramHeight = 80;

            let diagramY = tableEndY;

            if (remainingHeight < diagramHeight) {
                doc.addPage();
                diagramY = 20;
            }

            doc.setFontSize(12);
            doc.setTextColor(41, 128, 185);
            doc.text("Calculated Network Diagram", margin, diagramY - 5);

            // Center the diagram
            const diagramWidth = pageWidth - (margin * 2);
            // Aspect ratio preservation would be ideal, but for now fit to width
            doc.addImage(data.charts.networkDiagramImg, 'PNG', margin, diagramY, diagramWidth, diagramHeight);
        }
    }

    // Save
    const filename = `pump_analysis_${data.projectName || 'report'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
};

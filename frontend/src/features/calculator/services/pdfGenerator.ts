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
}

export const generatePDFReport = (data: ReportData) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    let yPos = 20;

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

    // Save
    const filename = `pump_analysis_${data.projectName || 'report'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
};

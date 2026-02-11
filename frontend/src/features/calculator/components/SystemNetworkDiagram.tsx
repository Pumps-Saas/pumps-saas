import React, { useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Node,
    Edge,
    Position,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useSystemStore } from '../stores/useSystemStore';
import { OperatingPointResult } from '@/types/engineering';

interface SystemNetworkDiagramProps {
    result: OperatingPointResult | null;
}

export const SystemNetworkDiagram: React.FC<SystemNetworkDiagramProps> = ({ result }) => {
    // Get Topology
    const suction = useSystemStore(state => state.suction_sections);
    const dischargeBefore = useSystemStore(state => state.discharge_sections_before);
    const dischargeParallel = useSystemStore(state => state.discharge_parallel_sections);
    const dischargeAfter = useSystemStore(state => state.discharge_sections_after);

    // Helpers to find result for a section
    const getResult = (id: string) => result?.details?.find(d => d.section_id === id);

    const { nodes, edges } = useMemo(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];

        let x = 50;
        let y = 100;
        const spacingX = 250;

        // 1. Suction Tank
        const suctionTankId = 'source';
        nodes.push({
            id: suctionTankId,
            type: 'input',
            data: { label: 'Suction Tank' },
            position: { x, y },
            style: { background: '#e0f2fe', border: '1px solid #0284c7', fontWeight: 'bold' }
        });

        let lastNodeId = suctionTankId;

        // 2. Suction Pipes
        suction.forEach((s, idx) => {
            x += spacingX;
            const res = getResult(s.id);
            const label = (
                <div className="text-xs">
                    <div className="font-bold">{s.name || `Suction ${idx + 1}`}</div>
                    <div>{s.length_m}m / {s.diameter_mm}mm</div>
                    {res && (
                        <div className="mt-1 pt-1 border-t border-slate-300 text-blue-700">
                            v: {res.velocity_m_s.toFixed(2)} m/s<br />
                            Loss: {res.total_loss_m.toFixed(2)} m
                        </div>
                    )}
                </div>
            );

            nodes.push({
                id: s.id,
                data: { label },
                position: { x, y },
                style: { width: 180 }
            });

            edges.push({
                id: `e-${lastNodeId}-${s.id}`,
                source: lastNodeId,
                target: s.id,
                markerEnd: { type: MarkerType.ArrowClosed }
            });
            lastNodeId = s.id;
        });

        // 3. Pump
        x += spacingX;
        const pumpId = 'pump';
        nodes.push({
            id: pumpId,
            data: { label: result ? `Pump\nHead: ${result.head_op.toFixed(1)}m` : 'Pump' },
            position: { x, y },
            style: { background: '#dcfce7', border: '1px solid #16a34a', fontWeight: 'bold', borderRadius: '50%', width: 100, height: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }
        });
        edges.push({ id: `e-${lastNodeId}-${pumpId}`, source: lastNodeId, target: pumpId, markerEnd: { type: MarkerType.ArrowClosed } });
        lastNodeId = pumpId;

        // 4. Discharge Before
        dischargeBefore.forEach((s, idx) => {
            x += spacingX;
            const res = getResult(s.id);
            const label = (
                <div className="text-xs">
                    <div className="font-bold">{s.name || `Disch. ${idx + 1}`}</div>
                    <div>{s.length_m}m / {s.diameter_mm}mm</div>
                    {res && (
                        <div className="mt-1 pt-1 border-t border-slate-300 text-blue-700">
                            v: {res.velocity_m_s.toFixed(2)} m/s<br />
                            Loss: {res.total_loss_m.toFixed(2)} m
                        </div>
                    )}
                </div>
            );
            nodes.push({
                id: s.id,
                data: { label },
                position: { x, y },
                style: { width: 180 }
            });
            edges.push({ id: `e-${lastNodeId}-${s.id}`, source: lastNodeId, target: s.id, markerEnd: { type: MarkerType.ArrowClosed } });
            lastNodeId = s.id;
        });

        // 5. Parallel Branches
        const branchKeys = Object.keys(dischargeParallel);
        if (branchKeys.length > 0) {
            const splitNodeId = lastNodeId;
            const joinNodeId = `join-${x}`; // Placeholder ID for later join

            // Adjust Y for branches
            let startY = y - ((branchKeys.length - 1) * 150) / 2;
            let maxBranchX = x;

            const parallelEndNodes: string[] = [];

            branchKeys.forEach((key, bIdx) => {
                let currentY = startY + bIdx * 150;
                let currentX = x + spacingX; // Indent branches
                let lastBranchNodeId = splitNodeId;

                dischargeParallel[key].forEach((s, sIdx) => {
                    const res = getResult(s.id);
                    const label = (
                        <div className="text-xs">
                            <div className="font-bold text-indigo-700">{key} - {s.name}</div>
                            <div>{s.length_m}m / {s.diameter_mm}mm</div>
                            {res && (
                                <div className="mt-1 pt-1 border-t border-slate-300 text-blue-700">
                                    v: {res.velocity_m_s.toFixed(2)} m/s<br />
                                    Loss: {res.total_loss_m.toFixed(2)} m
                                </div>
                            )}
                        </div>
                    );

                    nodes.push({
                        id: s.id,
                        data: { label },
                        position: { x: currentX, y: currentY },
                        style: { width: 180, borderColor: '#818cf8' }
                    });

                    edges.push({
                        id: `e-${lastBranchNodeId}-${s.id}`,
                        source: lastBranchNodeId,
                        target: s.id,
                        type: 'smoothstep',
                        markerEnd: { type: MarkerType.ArrowClosed }
                    });

                    lastBranchNodeId = s.id;
                    currentX += spacingX;
                });

                maxBranchX = Math.max(maxBranchX, currentX);
                parallelEndNodes.push(lastBranchNodeId);
            });

            // Re-align x for subsequent nodes
            x = maxBranchX;

            // Create a virtual "Join" point or just connect all to next standard section
            // Let's create a Join Node to bring them back to center Y
            x += 100;
            const joinId = 'junction_join';
            nodes.push({
                id: joinId,
                data: { label: 'Junction' },
                position: { x, y: 100 }, // Back to center
                style: { width: 80, height: 40, background: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center' }
            });

            parallelEndNodes.forEach(endId => {
                edges.push({
                    id: `e-${endId}-${joinId}`,
                    source: endId,
                    target: joinId,
                    type: 'smoothstep',
                    markerEnd: { type: MarkerType.ArrowClosed }
                });
            });

            lastNodeId = joinId;
        }

        // 6. Discharge After
        dischargeAfter.forEach((s, idx) => {
            x += spacingX;
            const res = getResult(s.id);
            const label = (
                <div className="text-xs">
                    <div className="font-bold">{s.name || `Disch. ${idx + 1}`}</div>
                    <div>{s.length_m}m / {s.diameter_mm}mm</div>
                    {res && (
                        <div className="mt-1 pt-1 border-t border-slate-300 text-blue-700">
                            v: {res.velocity_m_s.toFixed(2)} m/s<br />
                            Loss: {res.total_loss_m.toFixed(2)} m
                        </div>
                    )}
                </div>
            );
            nodes.push({
                id: s.id,
                data: { label },
                position: { x, y },
                style: { width: 180 }
            });
            edges.push({ id: `e-${lastNodeId}-${s.id}`, source: lastNodeId, target: s.id, markerEnd: { type: MarkerType.ArrowClosed } });
            lastNodeId = s.id;
        });

        // 7. Discharge Tank
        x += spacingX;
        nodes.push({
            id: 'target',
            type: 'output',
            data: { label: 'Discharge Tank' },
            position: { x, y },
            style: { background: '#e0f2fe', border: '1px solid #0284c7', fontWeight: 'bold' }
        });
        edges.push({ id: `e-${lastNodeId}-target`, source: lastNodeId, target: 'target', markerEnd: { type: MarkerType.ArrowClosed } });

        return { nodes, edges };
    }, [suction, dischargeBefore, dischargeParallel, dischargeAfter, result]);

    return (
        <div style={{ height: 500, width: '100%' }} className="border rounded-xl bg-slate-50">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                fitView
                attributionPosition="bottom-right"
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
};

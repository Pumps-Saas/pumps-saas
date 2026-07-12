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

    // Helpers
    const getResult = (id: string) => result?.details?.find(d => d.section_id === id);

    const { nodes, edges } = useMemo(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];

        let x = 0;
        let y = 300; // Center Y
        const spacingX = 400; // Wide spacing for text labels

        // --- Styles matching "Legacy Print 4" ---
        const suctionTankStyle = {
            backgroundColor: '#add8e6',
            borderColor: '#000',
            borderWidth: '1px',
            width: 120, height: 70,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        };

        const pumpStyle = {
            width: 90, height: 90, borderRadius: '50%',
            background: '#ffa500', // Orange
            border: '2px solid #000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 'bold' as const,
            zIndex: 10
        };

        const endNodeStyle = {
            width: 80, height: 80, borderRadius: '50%',
            background: '#d1d5db', // Grey
            border: '2px solid #000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 'bold' as const,
            zIndex: 10
        };

        const junctionStyle = { width: 4, height: 4, background: '#000', borderRadius: '50%' };

        // --- Nodes & Edges Generation ---

        // 1. Suction Tank
        const sourceId = 'source';
        nodes.push({
            id: sourceId,
            type: 'input',
            data: { label: 'Reservatório\nSucção' }, // Multiline label
            position: { x, y },
            sourcePosition: Position.Right,
            style: suctionTankStyle
        });

        let lastNodeId = sourceId;

        // Helper to add Pipe Segment Edge
        const addPipeEdge = (source: string, target: string, name: string, res: any, edgeType = 'straight') => {
            edges.push({
                id: `e-${source}-${target}`,
                source,
                target,
                type: edgeType,
                // Label format from Print: Name \n Flow \n Velocity \n Loss
                label: `${name}\n${res ? `${result?.flow_op.toFixed(1)} m³/h` : ''}\n${res?.velocity_m_s.toFixed(2) || '-'} m/s\nPerda: ${res?.total_loss_m.toFixed(2) || '0.00'} m`,
                style: { stroke: '#000', strokeWidth: 1.5 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#000', width: 15, height: 15 },
                labelStyle: { fontSize: 11, fill: '#000', fontWeight: 500 },
                labelShowBg: false, // Transparent background as per print (text floats)
                labelBgStyle: { fill: 'transparent' }
            });
        };

        // 2. Suction Segments
        suction.forEach((s, idx) => {
            x += spacingX;
            const isLast = idx === suction.length - 1;
            const targetId = isLast ? 'pump' : `j_suc_${idx}`;

            if (!isLast) {
                nodes.push({
                    id: targetId,
                    data: { label: '' },
                    position: { x, y: y + 35 }, // Adjust center
                    sourcePosition: Position.Right,
                    targetPosition: Position.Left,
                    style: junctionStyle
                });
            }
            addPipeEdge(lastNodeId, targetId, s.name || `Sucção ${idx + 1}`, getResult(s.id));
            lastNodeId = targetId;
        });

        // 3. Pump
        if (suction.length === 0) x += spacingX;
        const pumpId = 'pump';
        nodes.push({
            id: pumpId,
            data: { label: 'Bomba' },
            position: { x, y: y - 10 }, // Slight optical adjustment
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            style: pumpStyle
        });
        // Connect last suction node to pump if not already connected (logic above handles it if suction exists)
        // If suction empty, we need edge? No, x just moved.
        // Wait, if suction list not empty, lastNodeId is 'pump' because we passed 'pump' as targetId for last segment.
        // So we don't need to add edge here.
        // If suction IS empty, lastNodeId is 'source'. We need edge.
        if (suction.length === 0) {
            addPipeEdge(sourceId, pumpId, 'Sucção', null);
        }
        lastNodeId = pumpId;

        // 4. Discharge Before
        dischargeBefore.forEach((s, idx) => {
            x += spacingX;
            const targetId = `j_dis_b_${idx}`;
            nodes.push({
                id: targetId,
                data: { label: '' },
                position: { x, y: y + 42 }, // Center alignment
                sourcePosition: Position.Right,
                targetPosition: Position.Left,
                style: junctionStyle
            });
            addPipeEdge(lastNodeId, targetId, s.name || `Recalque ${idx + 1}`, getResult(s.id));
            lastNodeId = targetId;
        });

        // 5. Parallel (Print Style: Split -> Top/Bottom -> Merge)
        const branchKeys = Object.keys(dischargeParallel);
        if (branchKeys.length > 0) {
            // We need a Split Node
            const splitNodeId = lastNodeId;
            let mergeX = x + spacingX + 100; // Expected merge point
            const mergeNodeId = 'merge_parallel';

            // Create Merge Node
            nodes.push({
                id: mergeNodeId,
                data: { label: '' },
                position: { x: mergeX, y: y + 42 },
                sourcePosition: Position.Right,
                targetPosition: Position.Left,
                style: junctionStyle
            });

            // CORRECT APPROACH with Intermediate Nodes to force separation
            branchKeys.forEach((key, bIdx) => {
                const isTop = bIdx === 0;
                const branchY = isTop ? y - 80 : y + 80;
                // Intermediate node
                const branchMidId = `node_${key}`;
                nodes.push({
                    id: branchMidId,
                    data: { label: '' },
                    position: { x: x + spacingX / 2, y: branchY + 42 },
                    sourcePosition: Position.Right,
                    targetPosition: Position.Left,
                    style: { ...junctionStyle, opacity: 0 } // Invisible handle
                });

                const s = dischargeParallel[key][0];
                const res = getResult(s.id);

                // Edge Split -> Mid
                edges.push({
                    id: `e-split-${key}`,
                    source: splitNodeId,
                    target: branchMidId,
                    type: 'step',
                    style: { stroke: '#000', strokeWidth: 1.5 },
                });

                // Edge Mid -> Merge (This one has the Label)
                edges.push({
                    id: `e-merge-${key}`,
                    source: branchMidId,
                    target: mergeNodeId,
                    type: 'step',
                    label: `${key} (${s.name})\nPerda: ${res?.total_loss_m.toFixed(2) || '-'} m`,
                    style: { stroke: '#000', strokeWidth: 1.5 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#000' },
                    labelStyle: { fontSize: 10, fill: '#000' },
                    labelShowBg: false
                });
            });

            x = mergeX;
            lastNodeId = mergeNodeId;
        }

        // 6. Discharge After
        dischargeAfter.forEach((s, idx) => {
            x += spacingX;
            const isLast = idx === dischargeAfter.length - 1;
            const targetId = isLast ? 'target' : `j_dis_a_${idx}`;

            if (!isLast) {
                nodes.push({
                    id: targetId,
                    data: { label: '' },
                    position: { x, y: y + 42 },
                    sourcePosition: Position.Right,
                    targetPosition: Position.Left,
                    style: junctionStyle
                });
            }
            addPipeEdge(lastNodeId, targetId, s.name || `Final ${idx + 1}`, getResult(s.id));
            lastNodeId = targetId;
        });

        // 7. Discharge Tank Node (if not created by loop)
        // If loop created 'target', styling is standard. We need to override style or push separate.
        // The addPipeEdge loop uses 'targetId'.

        // Let's standardize: The loop creates Intermediate Junctions. The FINAL target is created manually.
        // If isLast, targetId='target'.

        // Find 'target' node if already pushed? 
        // Actually, the loop didn't push 'target' node! It only pushes !isLast nodes.
        // So we must push the final target node now.

        nodes.push({
            id: 'target',
            type: 'output',
            data: { label: 'Fim' },
            position: { x, y: y + 5 }, // Align center
            targetPosition: Position.Left,
            style: endNodeStyle
        });

        // Edge check: The loop added edge to 'target'. Node 'target' exists now. ok.

        return { nodes, edges };
    }, [suction, dischargeBefore, dischargeParallel, dischargeAfter, result]);

    return (
        <div style={{ height: 500, width: '1000px' }} className="border rounded-xl bg-white" id="hidden-network-diagram-container">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                fitView
                attributionPosition="bottom-right"
            >
                <Background color="#aaa" gap={16} />
                <Controls />
            </ReactFlow>
        </div>
    );
};

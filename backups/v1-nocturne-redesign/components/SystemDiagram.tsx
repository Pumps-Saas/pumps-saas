import React, { useMemo } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useSystemStore } from '../stores/useSystemStore';

// We will need custom node types eventually, but starting with default for speed.
// Pump Node, Tank Node, Pipe Segment Edge (with label).

const SystemDiagram: React.FC = () => {
    const suctionSegments = useSystemStore(state => state.suction_sections);
    const dischargeSegments = useSystemStore(state => state.discharge_sections_before);
    const staticHead = useSystemStore(state => state.static_head);

    // Dynamic Node/Edge Generation
    const { nodes, edges } = useMemo(() => {
        const generatedNodes: Node[] = [];
        const generatedEdges: Edge[] = [];

        // 1. Source Tank
        generatedNodes.push({
            id: 'source-tank',
            type: 'input', // or custom 'tank'
            data: { label: 'Suction Tank' },
            position: { x: 50, y: 150 },
            style: { background: '#bfdbfe', border: '1px solid #3b82f6', width: 100 }
        });

        // 2. Pump
        generatedNodes.push({
            id: 'pump',
            type: 'default', // or custom 'pump'
            data: { label: 'Centrifugal Pump' },
            position: { x: 300, y: 150 },
            style: { background: '#fca5a5', border: '1px solid #ef4444', width: 120, borderRadius: '50%' }
        });

        // 3. Discharge Tank / End Point
        generatedNodes.push({
            id: 'discharge-tank',
            type: 'output', // or custom 'tank'
            data: { label: 'Discharge Point\n(Static Head: ' + staticHead + 'm)' },
            position: { x: 600, y: 50 }, // Higher up to represent elevation?
            style: { background: '#bfdbfe', border: '1px solid #3b82f6', width: 100 }
        });

        // Edges
        // Suction Line
        // Currently we just represent the whole suction line as one edge or multiple if we had nodes in between.
        // For Phase 1, the "Segments" are just properties of the line, not necessarily nodal split points unless they are different pipes in series.
        // We will represent them as a single edge connecting Tank -> Pump for now, and label with total length?

        const suctionLength = suctionSegments.reduce((sum: number, s: any) => sum + s.length, 0);
        generatedEdges.push({
            id: 'e-suction',
            source: 'source-tank',
            target: 'pump',
            animated: true,
            label: `Suction: ${suctionLength.toFixed(1)}m`,
            style: { stroke: '#3b82f6', strokeWidth: 3 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
        });

        const dischargeLength = dischargeSegments.reduce((sum: number, s: any) => sum + s.length, 0);
        generatedEdges.push({
            id: 'e-discharge',
            source: 'pump',
            target: 'discharge-tank',
            animated: true,
            label: `Discharge: ${dischargeLength.toFixed(1)}m`,
            style: { stroke: '#ef4444', strokeWidth: 3 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' },
        });

        return { nodes: generatedNodes, edges: generatedEdges };
    }, [suctionSegments, dischargeSegments, staticHead]);

    // React Flow requires a specific height on container
    return (
        <div style={{ height: 400, width: '100%' }} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <ReactFlow
                defaultNodes={nodes}
                defaultEdges={edges}
                // onNodesChange={onNodesChange} // Controlled or Uncontrolled? Let's use default for now
                // onEdgesChange={onEdgesChange}
                fitView
            >
                <Background color="#cbd5e1" gap={20} />
                <Controls />
            </ReactFlow>
        </div>
    );
};

export { SystemDiagram };

import { useCallback, useMemo } from "react";
import ReactFlow, {
  Background, Controls, MiniMap, Node, Edge, Connection,
  NodeChange, MarkerType, ReactFlowProvider, useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import StateNode from "./StateNode";
import { Machine, Mode } from "../lib/automata";

const nodeTypes = { state: StateNode };

interface Props {
  machine: Machine;
  mode: Mode;
  activeStates: Set<string>;
  selected: { kind: "state" | "tran"; id: string } | null;
  onAddState: (x: number, y: number) => void;
  onMoveState: (id: string, x: number, y: number) => void;
  onAddTran: (from: string, to: string) => void;
  onSelect: (s: { kind: "state" | "tran"; id: string } | null) => void;
}

function Inner(p: Props) {
  const { screenToFlowPosition } = useReactFlow();

  const nodes: Node[] = useMemo(() =>
    p.machine.states.map(s => ({
      id: s.id,
      type: "state",
      position: { x: s.x, y: s.y },
      data: {
        label: s.label,
        isStart: s.isStart,
        isAccept: s.isAccept,
        active: p.activeStates.has(s.id),
      },
      selected: p.selected?.kind === "state" && p.selected.id === s.id,
    })),
    [p.machine.states, p.activeStates, p.selected]
  );

  // group same from/to so label shows combined
  const edges: Edge[] = useMemo(() => {
    const groups = new Map<string, any[]>();
    for (const t of p.machine.transitions as any[]) {
      const k = `${t.from}->${t.to}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(t);
    }
    const out: Edge[] = [];
    for (const [, g] of groups) {
      const first = g[0];
      const isLoop = first.from === first.to;
      const label = g.map(x => fmt(x, p.mode)).join(", ");
      out.push({
        id: g.map(x => x.id).join("|"),
        source: first.from,
        target: first.to,
        type: isLoop ? "default" : "smoothstep",
        sourceHandle: isLoop ? "top" : undefined,
        targetHandle: isLoop ? "bot" : undefined,
        label,
        labelStyle: { fontFamily: "ui-monospace, monospace", fontSize: 11, fontWeight: 600 },
        labelBgStyle: { fill: "#fff" },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 3,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#525252" },
        style: { stroke: "#525252", strokeWidth: 1.5 },
        data: { ids: g.map(x => x.id) },
        selected: p.selected?.kind === "tran" && g.some(x => x.id === p.selected!.id),
      });
    }
    return out;
  }, [p.machine.transitions, p.mode, p.selected]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    for (const c of changes) {
      if (c.type === "position" && c.position) {
        p.onMoveState(c.id, c.position.x, c.position.y);
      }
    }
  }, [p]);

  const onConnect = useCallback((c: Connection) => {
    if (c.source && c.target) p.onAddTran(c.source, c.target);
  }, [p]);

  const onPaneClick = useCallback((evt: React.MouseEvent) => {
    if (evt.detail === 2) {
      const pos = screenToFlowPosition({ x: evt.clientX, y: evt.clientY });
      p.onAddState(pos.x - 32, pos.y - 32);
    } else {
      p.onSelect(null);
    }
  }, [p, screenToFlowPosition]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onConnect={onConnect}
      onPaneClick={onPaneClick}
      onNodeClick={(_, n) => p.onSelect({ kind: "state", id: n.id })}
      onEdgeClick={(_, e) => {
        const ids = (e.data?.ids as string[]) ?? [e.id];
        p.onSelect({ kind: "tran", id: ids[0] });
      }}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{ type: "smoothstep" }}
      connectionRadius={40}
    >
      <Background gap={20} size={1} color="#e5e5e5" />
      <Controls showInteractive={false} />
      <MiniMap
        nodeColor={(n) => p.activeStates.has(n.id) ? "#4f46e5" : "#a3a3a3"}
        maskColor="rgba(0,0,0,0.05)"
        pannable
      />
    </ReactFlow>
  );
}

function fmt(t: any, mode: Mode): string {
  if (mode === "TM") return `${t.read}→${t.write},${t.move}`;
  return t.symbol;
}

export default function Graph(props: Props) {
  return (
    <ReactFlowProvider>
      <Inner {...props} />
    </ReactFlowProvider>
  );
}
"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Edge,
  type Node,
  Position,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const DEFAULT_MODULES = [
  "authentication",
  "teams",
  "rbac",
  "calendar",
  "booking",
  "payments",
  "notifications",
  "reviews",
];

export function DnaGraph({
  product = "Booking",
  modules = DEFAULT_MODULES,
}: {
  product?: string;
  modules?: string[];
}) {
  const { nodes, edges } = useMemo(() => {
    const root: Node = {
      id: "root",
      position: { x: 220, y: 20 },
      data: { label: product },
      style: nodeStyle(true),
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
    const childNodes: Node[] = modules.map((m, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      return {
        id: m,
        position: { x: 40 + col * 140, y: 120 + row * 90 },
        data: { label: m },
        style: nodeStyle(false),
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };
    });
    const childEdges: Edge[] = modules.map((m) => ({
      id: `e-${m}`,
      source: "root",
      target: m,
      animated: true,
      style: { stroke: "rgba(34,211,238,0.45)" },
      markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(167,139,250,0.7)" },
    }));
    return { nodes: [root, ...childNodes], edges: childEdges };
  }, [product, modules]);

  return (
    <div className="h-[340px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        colorMode="dark"
      >
        <Background color="#334155" gap={18} size={1} />
        <Controls showInteractive={false} className="!bg-zinc-900 !border-white/10" />
      </ReactFlow>
    </div>
  );
}

function nodeStyle(root: boolean): React.CSSProperties {
  return {
    background: root
      ? "linear-gradient(135deg, rgba(34,211,238,0.25), rgba(167,139,250,0.25))"
      : "rgba(15,23,42,0.9)",
    color: "#e2e8f0",
    border: root
      ? "1px solid rgba(34,211,238,0.45)"
      : "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 500,
    padding: "8px 12px",
    minWidth: 100,
    textAlign: "center",
  };
}

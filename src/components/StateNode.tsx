import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";

interface Data {
  label: string;
  isStart: boolean;
  isAccept: boolean;
  active: boolean;
}

function StateNode({ data, selected }: NodeProps<Data>) {
  return (
    <div className="relative group">
      {/* start arrow */}
      {data.isStart && (
        <div className="absolute -left-7 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none text-sm">
          ▶
        </div>
      )}

      {/* one handle in each direction. small dots, visible on hover */}
      <Handle type="source" position={Position.Right}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white !opacity-0 group-hover:!opacity-100 transition-opacity" />
      <Handle type="target" position={Position.Left}
        className="!w-3 !h-3 !bg-neutral-400 !border-2 !border-white !opacity-0 group-hover:!opacity-100 transition-opacity" />
      <Handle type="source" id="top" position={Position.Top}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white !opacity-0 group-hover:!opacity-100 transition-opacity" />
      <Handle type="target" id="bot" position={Position.Bottom}
        className="!w-3 !h-3 !bg-neutral-400 !border-2 !border-white !opacity-0 group-hover:!opacity-100 transition-opacity" />

      <div className={`
        w-14 h-14 rounded-full flex items-center justify-center
        font-mono text-xs select-none relative
        ${data.active
          ? "bg-indigo-600 text-white border-2 border-indigo-700"
          : selected
          ? "bg-white border-2 border-indigo-500 text-neutral-800"
          : "bg-white border-2 border-neutral-400 text-neutral-800 group-hover:border-neutral-600"
        }
      `}>
        {/* accept = double circle */}
        {data.isAccept && (
          <div className={`absolute inset-1 rounded-full border-2 pointer-events-none ${
            data.active ? "border-white" : "border-neutral-500"
          }`} />
        )}
        <span>{data.label}</span>
      </div>
    </div>
  );
}

export default memo(StateNode);
import { Handle, Position, type NodeProps } from 'reactflow'

interface Data {
  label: string
  type: 'artist' | 'band'
  tooltip?: string
}

export default function GraphNode({ data }: NodeProps<Data>) {
  return (
    <div
      className={
        'px-3 py-2 rounded border shadow text-xs text-white ' +
        (data.type === 'artist' ? 'bg-blue-600' : 'bg-red-600')
      }
      title={data.tooltip}
    >
      <Handle type="target" position={Position.Top} />
      {data.label}
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

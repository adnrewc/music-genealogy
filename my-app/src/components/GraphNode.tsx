import type { NodeProps } from 'reactflow'

interface Data {
  label: string
  type: 'artist' | 'band'
  tooltip?: string
}

export default function GraphNode({ data }: NodeProps<Data>) {
  return (
    <div
      className={
        'px-2 py-1 rounded shadow text-xs ' +
        (data.type === 'band' ? 'bg-blue-200' : 'bg-green-200')
      }
      title={data.tooltip}
    >
      {data.label}
    </div>
  )
}

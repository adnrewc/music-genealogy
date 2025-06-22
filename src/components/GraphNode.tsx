import { Handle, Position, type NodeProps } from 'reactflow'

export interface RelationDisplay {
  id: string
  name: string
  type: 'artist' | 'band'
  role?: string
  years?: string
}

interface Data {
  id: string
  label: string
  type: 'artist' | 'band'
  tooltip?: string
  relations?: RelationDisplay[]
  onRelationClick?: (parent: string, rel: RelationDisplay) => void
}

function roleEmoji(role?: string): string {
  if (!role) return ''
  const r = role.toLowerCase()
  if (r.includes('guitar')) return '🎸'
  if (r.includes('drum')) return '🥁'
  if (r.includes('vocal')) return '🎤'
  return ''
}

export default function GraphNode({ id, data }: NodeProps<Data>) {
  return (
    <div
      className="bg-white border rounded shadow text-xs text-black w-64 animate-fade-in"
      title={data.tooltip}
    >
      <Handle type="target" position={Position.Left} />
      <div className="font-bold bg-gray-100 px-2 py-1 text-sm">{data.label}</div>
      <div className="max-h-40 overflow-auto">
        {data.relations?.map((rel) => (
          <div
            key={rel.id}
            className="flex items-center gap-1 px-2 py-1 hover:bg-blue-100 cursor-pointer"
            onClick={() => data.onRelationClick?.(id, rel)}
          >
            <span>{roleEmoji(rel.role)}</span>
            <span className="flex-1 truncate">{rel.name}</span>
            {rel.years && <span className="text-gray-500">{rel.years}</span>}
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

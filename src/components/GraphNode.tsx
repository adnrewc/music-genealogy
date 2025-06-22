import { Handle, Position, type NodeProps } from 'reactflow'
import { useMemo } from 'react'

export interface RelationDisplay {
  id: string
  name: string
  type: 'artist' | 'band'
  roles?: string[]
  years?: string
  beginYear?: number
}

interface Data {
  id: string
  label: string
  type: 'artist' | 'band'
  tooltip?: string
  relations?: RelationDisplay[]
  onRelationClick?: (parent: string, rel: RelationDisplay) => void
  onClose?: (id: string) => void
}

function roleEmojis(roles?: string[]): string {
  if (!roles) return ''
  const emojis = new Set<string>()
  for (const role of roles) {
    const r = role.toLowerCase()
    if (r.includes('guitar') || r.includes('bass')) emojis.add('🎸')
    if (r.includes('drum')) emojis.add('🥁')
    if (r.includes('vocal')) emojis.add('🎤')
    if (r.includes('keyboard')) emojis.add('🎹')
  }
  return Array.from(emojis).join(' ')
}

export default function GraphNode({ id, data }: NodeProps<Data>) {
  const relations = useMemo(() => {
    const map = new Map<string, RelationDisplay & { roles: string[] }>()
    for (const rel of data.relations || []) {
      const key = `${rel.type}-${rel.id}`
      const entry = map.get(key) || { ...rel, roles: rel.roles ? [...rel.roles] : [] }
      const roles = rel.roles || []
      for (const r of roles) {
        if (!entry.roles.includes(r)) entry.roles.push(r)
      }
      if (
        rel.beginYear !== undefined &&
        (entry.beginYear === undefined || rel.beginYear < entry.beginYear)
      ) {
        entry.beginYear = rel.beginYear
      }
      if (!entry.years && rel.years) entry.years = rel.years
      map.set(key, entry)
    }
    const result = Array.from(map.values())
    result.sort((a, b) => {
      if (a.beginYear && b.beginYear) return a.beginYear - b.beginYear
      return 0
    })
    return result
  }, [data.relations])

  const containerHeight = Math.min(relations.length * 32, 300)

  return (
    <div
      className="relative bg-white rounded-xl shadow-md text-xs text-black w-64 animate-fade-in"
      title={data.tooltip}
    >
      <button
        className="absolute top-1 right-1 text-sm leading-none"
        onClick={() => data.onClose?.(id)}
      >
        ×
      </button>
      <Handle type="target" position={Position.Left} />
      <div className="font-bold bg-gray-100 px-2 py-1 text-sm">{data.label}</div>
      <div
        className="overflow-y-auto p-3 flex flex-col gap-y-1"
        style={{ height: containerHeight, maxHeight: 300 }}
      >
        {relations.map((rel) => (
          <div
            key={`${rel.type}-${rel.id}`}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-blue-100 cursor-pointer rounded transition-colors"
            onClick={() => data.onRelationClick?.(id, rel)}
          >
            <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{rel.name}</span>
            {rel.years && <span className="text-gray-500 flex-none">{rel.years}</span>}
            <span className="flex-none">{roleEmojis(rel.roles)}</span>
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

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

  const set = new Set<string>()
  for (const role of roles) {
    const r = role.toLowerCase()
    let matched = false
    if (r.includes('guitar') || r.includes('bass')) {
      set.add('🎸')
      matched = true
    }
    if (r.includes('vocal')) {
      set.add('🎤')
      matched = true
    }
    if (r.includes('drum')) {
      set.add('🥁')
      matched = true
    }
    if (r.includes('keyboard')) {
      set.add('🎹')
      matched = true
    }
    if (
      r.includes('violin') ||
      r.includes('cello') ||
      r.includes('strings')
    ) {
      set.add('🎻')
      matched = true
    }
    if (
      r.includes('horn') ||
      r.includes('trumpet') ||
      r.includes('sax') ||
      r.includes('trombone')
    ) {
      set.add('🎷')
      matched = true
    }
    if (!matched) {
      set.add('🍺')
    }
  }

  const order = ['🎸', '🎤', '🥁', '🎹', '🎻', '🎷', '🍺']
  return order.filter((e) => set.has(e)).join(' ')
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

  return (
    <div
      id={id}
      className="relative w-64 text-xs text-black bg-white rounded-xl shadow-md p-4 max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 animate-fade-in"
      title={data.tooltip}
    >
      <button
        className="absolute top-1 right-1 text-sm leading-none"
        onClick={() => data.onClose?.(id)}
      >
        ×
      </button>
      <Handle type="target" position={Position.Left} />
      <div className="font-bold bg-gray-100 px-2 py-1 text-sm rounded" title={data.label}>
        {data.label}
      </div>
      <div className="mt-2 flex flex-col gap-y-1">
        {relations.map((rel) => (
          <div
            key={`${rel.type}-${rel.id}`}
            className="flex items-center px-2 py-1 hover:bg-blue-100 cursor-pointer rounded transition-colors"
            onClick={() => data.onRelationClick?.(id, rel)}
            title={rel.name}
          >
            <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="font-medium">{rel.name}</span>
              {roleEmojis(rel.roles) && (
                <span className="ml-1 whitespace-nowrap">{roleEmojis(rel.roles)}</span>
              )}
            </div>
            {rel.years && (
              <span className="flex-none text-xs text-gray-500 text-right ml-2 whitespace-nowrap">
                {rel.years}
              </span>
            )}
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

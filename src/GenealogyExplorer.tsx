import { useCallback, useEffect, useRef, useState } from 'react'
import SearchBar from './components/SearchBar'
import { fetchJson } from './utils/dataFetcher'
import { useVirtualizer } from '@tanstack/react-virtual'

export interface RelationDisplay {
  id: string
  name: string
  type: 'artist' | 'band'
  roles?: string[]
  years?: string
  beginYear?: number
}

interface NodeData {
  id: string
  name: string
  type: 'artist' | 'band'
  tooltip?: string
  relations?: RelationDisplay[]
  parentId?: string
  expanded: boolean
  loading?: boolean
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
    if (r.includes('violin') || r.includes('cello') || r.includes('strings')) {
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

function uniqueRelations(relations: RelationDisplay[] | undefined): RelationDisplay[] {
  const map = new Map<string, RelationDisplay & { roles: string[] }>()
  for (const rel of relations || []) {
    const key = `${rel.type}-${rel.id}`
    const entry = map.get(key) || { ...rel, roles: rel.roles ? [...rel.roles] : [] }
    for (const r of rel.roles || []) {
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
}

function NodeCard({
  node,
  parentName,
  onRelationClick,
  onClose,
  onToggle,
}: {
  node: NodeData
  parentName?: string
  onRelationClick: (parent: string, rel: RelationDisplay) => void
  onClose: (id: string) => void
  onToggle: (id: string) => void
}) {
  return (
    <div className="relative bg-white rounded shadow p-4" key={node.id}>
      <button
        className="absolute top-2 right-2 text-sm"
        onClick={() => onClose(node.id)}
      >
        ×
      </button>
      <div className="flex items-center justify-between">
        <div className="font-bold text-lg" title={node.name}>
          {node.name}
        </div>
        <button className="ml-2 text-sm" onClick={() => onToggle(node.id)}>
          {node.expanded ? '−' : '+'}
        </button>
      </div>
      {parentName && (
        <div className="text-xs text-gray-500 mb-1">Connected to {parentName}</div>
      )}
      {node.tooltip && <div className="text-xs text-gray-500">{node.tooltip}</div>}
      {node.loading && (
        <div className="mt-2 text-sm text-gray-500">Loading...</div>
      )}
      {node.expanded && !node.loading && node.relations && node.relations.length > 0 && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {uniqueRelations(node.relations).map((rel) => (
            <div
              key={`${rel.type}-${rel.id}`}
              className="cursor-pointer bg-gray-100 p-2 rounded hover:bg-blue-100"
              onClick={() => onRelationClick(node.id, rel)}
              title={rel.name}
            >
              <div className="font-medium text-sm truncate">
                {rel.name}
                {roleEmojis(rel.roles) && (
                  <span className="ml-1">{roleEmojis(rel.roles)}</span>
                )}
              </div>
              {rel.years && (
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {rel.years}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function GenealogyExplorer() {
  const [nodes, setNodes] = useState<NodeData[]>([])
  const containerRef = useRef<HTMLDivElement | null>(null)
  const loaded = useRef(new Set<string>())
  const childrenMap = useRef(new Map<string, string[]>())

  const rowVirtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 260,
  })

  interface Relation {
    type: string
    direction?: 'forward' | 'backward'
    artist?: { id: string; name: string; type?: string }
    attributes?: string[]
    begin?: string
    end?: string
  }

  const parseRelation = useCallback((rel: Relation): RelationDisplay | null => {
    if (!rel.artist) return null
    if (
      rel.type !== 'member of band' &&
      rel.type !== 'has member' &&
      rel.type !== 'collaboration'
    )
      return null
    const relatedType = rel.artist.type === 'Group' ? 'band' : 'artist'
    const years = rel.begin || rel.end ? `${rel.begin || ''} - ${rel.end || ''}` : ''
    const beginYear = rel.begin ? parseInt(rel.begin.slice(0, 4)) : undefined
    return {
      id: rel.artist.id,
      name: rel.artist.name,
      type: relatedType,
      roles: rel.attributes,
      years,
      beginYear,
    }
  }, [])


  const loadArtist = useCallback(
    async (mbid: string, parent?: string) => {
      if (loaded.current.has(mbid)) return
      loaded.current.add(mbid)
      setNodes((ns) => [
        ...ns,
        {
          id: mbid,
          name: 'Loading...',
          type: 'artist',
          parentId: parent,
          expanded: true,
          loading: true,
        },
      ])
      try {
        interface ArtistData {
          id: string
          name: string
          type: string
          'life-span'?: { begin?: string; end?: string }
          relations?: Relation[]
        }
        const data = await fetchJson<ArtistData>(
          `https://musicbrainz.org/ws/2/artist/${mbid}?inc=artist-rels&fmt=json`,
        )
        const type = data.type === 'Group' ? 'band' : 'artist'
        const life = data['life-span']
        const years = life && (life.begin || life.end) ? `${life.begin || ''} - ${life.end || ''}` : ''
        const rels: RelationDisplay[] = []
        for (const rel of data.relations || []) {
          const parsed = parseRelation(rel)
          if (parsed) rels.push(parsed)
        }
        setNodes((ns) =>
          ns.map((n) =>
            n.id === mbid
              ? {
                  id: data.id,
                  name: data.name,
                  type,
                  tooltip: years,
                  relations: rels,
                  parentId: parent,
                  expanded: true,
                }
              : n,
          ),
        )
      } catch (err) {
        console.error(err)
        setNodes((ns) => ns.filter((n) => n.id !== mbid))
        loaded.current.delete(mbid)
      }
    },
    [parseRelation],
  )

  const handleRelationClick = useCallback(
    (parent: string, rel: RelationDisplay) => {
      loadArtist(rel.id, parent)
    },
    [loadArtist],
  )

  const handleClose = useCallback((id: string) => {
    setNodes((ns) => {
      const remove = new Set<string>()
      function collect(cur: string) {
        remove.add(cur)
        const children = childrenMap.current.get(cur) || []
        for (const c of children) collect(c)
      }
      collect(id)
      childrenMap.current.delete(id)
      loaded.current = new Set([...loaded.current].filter((x) => !remove.has(x)))
      return ns.filter((n) => !remove.has(n.id))
    })
  }, [])

  const handleToggle = useCallback((id: string) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, expanded: !n.expanded } : n)))
  }, [])

  const handleSearchSelect = useCallback(
    (artist: { id: string; name: string }) => {
      setNodes([])
      loaded.current.clear()
      childrenMap.current.clear()
      loadArtist(artist.id)
    },
    [loadArtist],
  )

  useEffect(() => {
    rowVirtualizer.measure()
  }, [nodes, rowVirtualizer])

  return (
    <div className="w-screen h-screen flex flex-col">
      <SearchBar onSelect={handleSearchSelect} />
      <div ref={containerRef} className="flex-1 overflow-auto p-4 relative">
        <div
          style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}
        >
          {rowVirtualizer.getVirtualItems().map((vItem) => {
            const node = nodes[vItem.index]
            return (
              <div
                key={node.id}
                className="absolute left-0 w-full pb-4"
                style={{ transform: `translateY(${vItem.start}px)` }}
              >
                <NodeCard
                  node={node}
                  parentName={node.parentId ? nodes.find((n) => n.id === node.parentId)?.name : undefined}
                  onRelationClick={handleRelationClick}
                  onClose={handleClose}
                  onToggle={handleToggle}
                />
              </div>
            )
          })}
        </div>
      </div>
      <button
        className="fixed bottom-4 right-4 bg-white border px-3 py-2 rounded shadow"
        onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        Back to Top
      </button>
    </div>
  )
}

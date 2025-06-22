import { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  MarkerType,
  type Node,
  type Edge,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'
import SearchBar from './components/SearchBar'
import GraphNode, { type RelationDisplay } from './components/GraphNode'
import CustomEdge from './components/CustomEdge'
import { fetchJson } from './utils/dataFetcher'

const nodeTypes = { graphNode: GraphNode }
const edgeTypes = { custom: CustomEdge }

function FlowApp() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const loaded = useRef(new Set<string>())
  const childCount = useRef(new Map<string, number>())
  const searchMode = useRef(false)
  const { fitView } = useReactFlow()

  const handleRelationClick = useCallback(
    (parentId: string, rel: RelationDisplay) => {
      loadArtist(rel.id, parentId)
    },
    [loadArtist]
  )

  const addNode = useCallback(
    (
      id: string,
      label: string,
      type: 'artist' | 'band',
      tooltip?: string,
      relations?: RelationDisplay[],
      parent?: string
    ) => {
      setNodes((ns) => {
        const existing = ns.find((n) => n.id === id)
        if (existing) {
          if (!existing.data.relations && relations) {
            existing.data = { ...existing.data, relations }
          }
          return [...ns]
        }

        let position = { x: Math.random() * 800, y: Math.random() * 600 }

        if (parent) {
          const parentNode = ns.find((n) => n.id === parent)
          if (parentNode) {
            const count = childCount.current.get(parent) || 0
            childCount.current.set(parent, count + 1)
            position = {
              x: parentNode.position.x + 260,
              y: parentNode.position.y + count * 160,
            }
          }
        }

        return [
          ...ns,
          {
            id,
            data: { id, label, type, tooltip, relations, onRelationClick: handleRelationClick },
            position,
            type: 'graphNode',
          },
        ]
      })
    },
    [handleRelationClick]
  )

  const addEdge = useCallback(
    (source: string, target: string) => {
      setEdges((es) => {
        if (es.find((e) => e.source === source && e.target === target)) return es
        return [
          ...es,
          {
            id: `e-${source}-${target}`,
            source,
            target,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#555' },
          },
        ]
      })
    },
    []
  )

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
    if (rel.type !== 'member of band' && rel.type !== 'collaboration') return null
    const relatedType = rel.artist.type === 'Group' ? 'band' : 'artist'
    const years = rel.begin || rel.end ? `${rel.begin || ''} - ${rel.end || ''}` : ''
    return {
      id: rel.artist.id,
      name: rel.artist.name,
      type: relatedType,
      role: rel.attributes?.join(', '),
      years,
    }
  }, [])

  const loadArtist = useCallback(
    async (mbid: string, parent?: string) => {
      if (loaded.current.has(mbid)) {
        if (parent) addEdge(parent, mbid)
        return
      }
      loaded.current.add(mbid)

      try {
        interface ArtistData {
          id: string
          name: string
          type: string
          'life-span'?: { begin?: string; end?: string }
          relations?: Relation[]
        }

        const data = await fetchJson<ArtistData>(
          `https://musicbrainz.org/ws/2/artist/${mbid}?inc=artist-rels&fmt=json`
        )

        const type = data.type === 'Group' ? 'band' : 'artist'
        const life = data['life-span']
        const years =
          life && (life.begin || life.end)
            ? `${life.begin || ''} - ${life.end || ''}`
            : ''

        const rels: RelationDisplay[] = []
        for (const rel of data.relations || []) {
          const parsed = parseRelation(rel)
          if (parsed) rels.push(parsed)
        }

        addNode(data.id, data.name, type, years, rels, parent)
        if (parent) addEdge(parent, data.id)
      } catch (err) {
        console.error(err)
      }
    },
    [addNode, addEdge, parseRelation]
  )

  const handleSearchSelect = useCallback(
    (artist: { id: string; name: string }) => {
      setNodes([])
      setEdges([])
      loaded.current.clear()
      childCount.current.clear()
      searchMode.current = true
      loadArtist(artist.id)
    },
    [loadArtist]
  )

  useEffect(() => {
    if (searchMode.current && nodes.length > 0) {
      fitView({ duration: 800 })
      searchMode.current = false
    }
  }, [nodes, fitView])

  return (
    <div className="w-screen h-screen relative">
      <SearchBar onSelect={handleSearchSelect} />
      <div style={{ width: '100%', height: 'calc(100% - 50px)' }}>
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView>
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowApp />
    </ReactFlowProvider>
  )
}

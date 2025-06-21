import { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  useReactFlow,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import SearchBar from './components/SearchBar'
import GraphNode from './components/GraphNode'
import CustomEdge from './components/CustomEdge'
import { fetchJson } from './utils/dataFetcher'

const nodeTypes = { graphNode: GraphNode }
const edgeTypes = { custom: CustomEdge }

function App() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [selected, setSelected] = useState<Node | null>(null)
  const loaded = useRef(new Set<string>())
  const childCount = useRef(new Map<string, number>())
  const searchMode = useRef(false)
  const { fitView, setCenter } = useReactFlow()

  const addNode = useCallback(
    (
      id: string,
      label: string,
      type: 'artist' | 'band',
      tooltip?: string,
      parent?: string
    ) => {
      setNodes((ns) => {
        if (ns.find((n) => n.id === id)) return ns
        let position = { x: Math.random() * 800, y: Math.random() * 600 }
        if (parent) {
          const parentNode = ns.find((n) => n.id === parent)
          if (parentNode) {
            const count = childCount.current.get(parent) || 0
            childCount.current.set(parent, count + 1)
            position = {
              x:
                parentNode.position.x +
                (type === 'band' ? 200 : -200),
              y: parentNode.position.y + count * 80,
            }
          }
        }
        return [
          ...ns,
          { id, data: { label, type, tooltip }, position, type: 'graphNode' },
        ]
      })
    },
    []
  )

  const addEdge = useCallback(
    (source: string, target: string, label?: string) => {
      setEdges((es) => {
        if (es.find((e) => e.source === source && e.target === target)) return es
        return [
          ...es,
          {
            id: `e-${source}-${target}`,
            source,
            target,
            label,
            type: label ? 'custom' : 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#555' },
          },
        ]
      })
    },
    []
  )

  interface Relation {
    type: string
    artist?: { id: string; name: string }
    attributes?: string[]
    begin?: string
    end?: string
  }

  const parseTooltip = useCallback((rel: Relation) => {
    const role = (rel.attributes || []).join(', ')
    const years = rel.begin || rel.end ? `${rel.begin || ''} - ${rel.end || ''}` : ''
    return [role, years].filter(Boolean).join(' ')
  }, [])

  const loadArtist = useCallback(
    async (mbid: string) => {
      if (loaded.current.has(mbid)) return
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
        const years = life && (life.begin || life.end) ? `${life.begin || ''} - ${life.end || ''}` : ''
        addNode(data.id, data.name, type, years)
        for (const rel of data.relations || []) {
          if (rel.type === 'member of band' && rel.artist) {
            addNode(rel.artist.id, rel.artist.name, 'band', parseTooltip(rel), data.id)
            addEdge(data.id, rel.artist.id, 'member of')
          }
          if (rel.type === 'has member' && rel.artist) {
            addNode(rel.artist.id, rel.artist.name, 'artist', parseTooltip(rel), data.id)
            addEdge(data.id, rel.artist.id, 'has member')
          }
        }
      } catch (err) {
        console.error(err)
      }
    },
    [addEdge, addNode, parseTooltip]
  )

  const handleNodeClick = useCallback<import('reactflow').NodeMouseHandler>(
    (_event, node) => {
      setSelected(node)
      loadArtist(node.id)
    },
    [loadArtist]
  )

  const handleNodeDoubleClick = useCallback<import('reactflow').NodeMouseHandler>(
    (_evt, node) => {
      setCenter(node.position.x, node.position.y, { zoom: 1, duration: 800 })
    },
    [setCenter]
  )

  const handleSearchSelect = useCallback((artist: { id: string; name: string }) => {
    setNodes([])
    setEdges([])
    loaded.current.clear()
    childCount.current.clear()
    searchMode.current = true
    loadArtist(artist.id)
  }, [loadArtist])

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
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
      {selected && (
        <div className="absolute right-2 top-14 bg-white border p-2 text-sm shadow">
          <div className="font-bold">{selected.data.label}</div>
          <div className="mb-1">Type: {selected.data.type}</div>
          {selected.data.tooltip && <div className="mb-1">{selected.data.tooltip}</div>}
          <a
            href={`https://musicbrainz.org/${selected.data.type}/${selected.id}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 underline"
          >
            View on MusicBrainz
          </a>
        </div>
      )}
    </div>
  )
}

export default App

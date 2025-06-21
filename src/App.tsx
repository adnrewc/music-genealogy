import { useCallback, useRef, useState } from 'react'
import ReactFlow, { Background, Controls, MiniMap, type Node, type Edge } from 'reactflow'
import 'reactflow/dist/style.css'
import SearchBar from './components/SearchBar'
import GraphNode from './components/GraphNode'
import { fetchJson } from './utils/dataFetcher'

const nodeTypes = { graphNode: GraphNode }

function App() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const loaded = useRef(new Set<string>())

  const addNode = useCallback((id: string, label: string, type: 'artist' | 'band', tooltip?: string) => {
    setNodes((ns) => {
      if (ns.find((n) => n.id === id)) return ns
      const position = { x: Math.random() * 800, y: Math.random() * 600 }
      return [...ns, { id, data: { label, type, tooltip }, position, type: 'graphNode' }]
    })
  }, [])

  const addEdge = useCallback((source: string, target: string) => {
    setEdges((es) => {
      if (es.find((e) => e.source === source && e.target === target)) return es
      return [...es, { id: `e-${source}-${target}`, source, target }]
    })
  }, [])

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
            addNode(rel.artist.id, rel.artist.name, 'band', parseTooltip(rel))
            addEdge(data.id, rel.artist.id)
          }
          if (rel.type === 'has member' && rel.artist) {
            addNode(rel.artist.id, rel.artist.name, 'artist', parseTooltip(rel))
            addEdge(data.id, rel.artist.id)
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
      loadArtist(node.id)
    },
    [loadArtist]
  )

  return (
    <div className="w-screen h-screen">
      <SearchBar onSelect={(a) => loadArtist(a.id)} />
      <div style={{ width: '100%', height: 'calc(100% - 50px)' }}>
        <ReactFlow nodes={nodes} edges={edges} onNodeClick={handleNodeClick} nodeTypes={nodeTypes} fitView>
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  )
}

export default App

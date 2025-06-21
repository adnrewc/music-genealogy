import { useEffect, useState } from 'react'
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow'
import type { Node, Edge } from 'reactflow'
import 'reactflow/dist/style.css'

const DAVE_MBID = '4d5f891d-9bce-45ae-ad86-912dd27252fa'

function App() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`https://musicbrainz.org/ws/2/artist/${DAVE_MBID}?inc=artist-rels&fmt=json`)
        const data = await res.json()
        const newNodes: Node[] = [
          { id: DAVE_MBID, data: { label: data.name }, position: { x: 0, y: 0 }, type: 'default' }
        ]
        const newEdges: Edge[] = []
        let y = 100
        for (const rel of data.relations || []) {
          if (rel.type === 'member of band' && rel.artist) {
            const band = rel.artist
            if (!newNodes.find(n => n.id === band.id)) {
              newNodes.push({ id: band.id, data: { label: band.name }, position: { x: 200, y }, type: 'default' })
              y += 100
            }
            newEdges.push({ id: `e-${DAVE_MBID}-${band.id}`, source: DAVE_MBID, target: band.id })
          }
        }
        setNodes(newNodes)
        setEdges(newEdges)
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [])

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  )
}

export default App

import { useEffect, useState } from 'react'
import { fetchJson } from '../utils/dataFetcher'

interface Artist {
  id: string
  name: string
  disambiguation?: string
}

export default function SearchBar({ onSelect }: { onSelect: (artist: Artist) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Artist[]>([])

  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }
    const handler = setTimeout(async () => {
      try {
        const data = await fetchJson<{ artists: Artist[] }>(
          `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(query)}&fmt=json`
        )
        setResults(data.artists.slice(0, 5))
      } catch (err) {
        console.error(err)
        setResults([])
      }
    }, 500)
    return () => clearTimeout(handler)
  }, [query])

  return (
    <div className="p-2 bg-gray-100">
      <input
        className="border p-1 w-64"
        placeholder="Search artist"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <ul className="bg-white border mt-1 max-h-40 overflow-auto">
          {results.map((a) => (
            <li
              key={a.id}
              className="p-1 hover:bg-blue-100 cursor-pointer"
              onClick={() => {
                onSelect(a)
                setQuery('')
                setResults([])
              }}
            >
              {a.name}
              {a.disambiguation ? ` (${a.disambiguation})` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

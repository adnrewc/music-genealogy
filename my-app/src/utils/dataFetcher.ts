let lastFetch = 0
const cache = new Map<string, unknown>()

export async function fetchJson<T = unknown>(url: string): Promise<T> {
  if (cache.has(url)) {
    return cache.get(url) as T
  }
  const now = Date.now()
  const wait = Math.max(0, 1000 - (now - lastFetch))
  if (wait) {
    await new Promise((res) => setTimeout(res, wait))
  }
  lastFetch = Date.now()
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'MusicGenealogy/1.0 ( example@example.com )'
    }
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  const data = (await res.json()) as T
  cache.set(url, data)
  return data
}

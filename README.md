# 🎸 Music Genealogy Explorer

An interactive web app that lets users explore the "family tree" of bands and artists — see which bands an artist was in, who else was in those bands, and how the entire network of musicians is interconnected. Powered by the [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API).

---

## 🚀 Features

- 🔍 Search for any artist (e.g. *Dave Grohl*) and view their full band history  
- 🌐 Visual graph of artists and bands, with expandable connections  
- 🧠 Recursively explore: see who an artist played with, and who they played with  
- 🎛 Hover for details like roles, years active, and more  
- 🔗 Links out to MusicBrainz profiles for deeper exploration  

---

## 📸 Demo

Coming soon!

---

## 🛠 Tech Stack

- **Frontend:** React (or Next.js)
- **Graph Visualization:** [React Flow](https://reactflow.dev/) or D3.js
- **API:** [MusicBrainz XML Web Service v2](https://musicbrainz.org/doc/MusicBrainz_API)
- **Styling:** Tailwind CSS (or your preferred framework)
- **Optional Caching:** In-memory or Supabase/PostgreSQL for persistent history

---

## 📦 Installation

```bash
git clone https://github.com/your-username/music-genealogy-explorer.git
cd music-genealogy-explorer
npm install
npm run dev
```

---

## 🔧 Usage

1. Search for an artist using the input field.
2. Click a result to explore their band history.
3. Click nodes in the graph to expand the tree further.
4. Hover for role and membership info.

---

## 📡 API Usage

This app uses the following MusicBrainz endpoints:

- `GET /ws/2/artist/?query=artist_name` – search for an artist
- `GET /ws/2/artist/{mbid}?inc=artist-rels` – get artist relationships (band membership, etc.)

Please follow MusicBrainz [rate limits and guidelines](https://musicbrainz.org/doc/MusicBrainz_API#Rate_limiting).

---

## 🧪 Roadmap

- [ ] Display discography and album links  
- [ ] Show family/relationship trees (e.g. siblings, spouses in music)  
- [ ] Save/share custom musical family trees  
- [ ] Integrate Discogs or Spotify metadata  
- [ ] Deploy public version  

---

## 👥 Credits

- Built using data from [MusicBrainz](https://musicbrainz.org/)
- Graph rendering with [React Flow](https://reactflow.dev/)

---

## 📄 License

...

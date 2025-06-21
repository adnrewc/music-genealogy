# 🤖 Agent Instructions – Music Genealogy Explorer

This file provides essential instructions for AI agents (e.g. Codex, Lovable.dev, Continue, GPT-4, etc.) contributing to this project.

---

## 🧠 Project Summary

This is a React-based web app that visualizes the “genealogy” of music. It lets users explore how musicians and bands are connected — who played with whom, in what bands, during which timeframes.

The data is sourced from the [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API).

The app allows recursive exploration:
- Click on an artist → see their bands
- Click on a band → see its members
- Click on a member → see *their* bands
- Repeat infinitely to explore musical connections

---

## 🧰 Tech Stack

- **Frontend:** React or Next.js
- **Graph Rendering:** React Flow (preferred) or D3.js
- **API:** MusicBrainz (REST/XML, v2)
- **Styling:** Tailwind CSS
- **State Management:** Local state or Zustand (TBD)
- **Optional DB/Caching:** Supabase/PostgreSQL or in-memory cache

---

## 🎯 Agent Objectives

1. **Enable user search** for artists (by name) using MusicBrainz `/artist` query endpoint.
2. **Resolve MBID** and fetch artist relationships via `/artist/{mbid}?inc=artist-rels`.
3. **Parse connections** to identify:
   - People who were in bands
   - Bands the artist was in
   - Other members of those bands
   - Time periods of membership
4. **Render graph** of nodes (artists + bands) with expandable/clickable relationships.
5. **Prevent API abuse** by caching MBID results and responses where possible.

---

## 🧩 Component Guidelines

### 🔍 SearchBar
- Simple input + debounce
- Auto-suggest results from MusicBrainz
- Select result to trigger graph load

### 🌐 GraphView
- Render artist and band nodes
- Node types: `person`, `band`
- Expand nodes on click
- Tooltip: Name, role, dates

### 🔁 DataFetcher
- Wraps API calls with caching layer
- Handles rate limiting and errors
- Respects MusicBrainz guidelines

---

## ✅ Done When

- Users can search for an artist by name
- Artist’s bands and bandmates are visualized
- Clicking on another person or band expands their connections
- Users can explore connections without page reloads
- System avoids duplicate nodes and redundant API calls

---

## 📎 Additional Notes

- Do **not** include release/album data in v1 (future stretch goal)
- Assume MusicBrainz response structure is nested and requires parsing
- Respect API rate limits (1 req/sec max)
- Use `mbid` as the primary unique key across entities

---

## 🧪 Test Artists for Development

- Dave Grohl – `e5db18cb-d9a0-4294-8371-8a5f79c6c0c6`
- Trent Reznor – `6c45e0a1-32b4-4f17-bd56-493ba0f7c330`
- Thom Yorke – `6de60b0c-cba5-4c6c-b1e1-872f42f29b5c`

---

## 🔐 Security

This is a public, read-only app using public APIs. No secrets required in v1. Do not hardcode API keys — MusicBrainz does not require one for basic usage.

---

## 🧭 Future Ideas (ignore for now)

- Display discography and release history
- Integrate Spotify album art
- Allow users to save/share “music trees”
- Map geographic or genre-based influence

---

## 🧼 Style Preferences

- Use clean, modern component structure
- Prefer TypeScript (if enabled)
- Descriptive variable names, no abbreviations
- Light theme preferred
- Mobile responsiveness not required in v1


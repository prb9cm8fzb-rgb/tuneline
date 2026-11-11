import { validSpotifyToken } from './spotifyAuth'
import type { Song } from '../models/gameTypes'

export interface SpotifyPlaylist {
  id: string
  name: string
  image?: string
  trackCount: number
}

async function spotifyFetch<T>(path: string): Promise<T> {
  const token = await validSpotifyToken()
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(`Spotify request failed (${response.status}).`)
  return response.json() as Promise<T>
}

export async function getPlaylists(): Promise<SpotifyPlaylist[]> {
  const data = await spotifyFetch<{ items: Array<{ id: string; name: string; images?: Array<{ url: string }>; tracks: { total: number } }>; next: string | null }>('/me/playlists?limit=50')
  return data.items.map((item) => ({ id: item.id, name: item.name, image: item.images?.[0]?.url, trackCount: item.tracks.total }))
}

export async function getPlaylistSongs(playlistId: string): Promise<Song[]> {
  const result: Song[] = []
  let path: string | null = `/playlists/${encodeURIComponent(playlistId)}/tracks?limit=100&fields=items(track(id,uri,name,artists(name),album(release_date))),next`
  while (path) {
    const page: { items: Array<{ track: null | { id: string; uri: string; name: string; artists: Array<{ name: string }>; album: { release_date: string } } }>; next: string | null } =
      await spotifyFetch(path.replace('https://api.spotify.com/v1', ''))
    for (const { track } of page.items) {
      if (!track?.id || !track.uri || !track.artists[0]?.name) continue
      const year = Number(track.album.release_date.slice(0, 4))
      if (!Number.isInteger(year)) continue
      result.push({
        id: track.id,
        spotifyUri: track.uri,
        artist: track.artists.map((artist) => artist.name).join(', '),
        title: track.name,
        releaseYear: year,
        fragmentStartMs: 30_000,
      })
    }
    path = page.next
  }
  return result
}

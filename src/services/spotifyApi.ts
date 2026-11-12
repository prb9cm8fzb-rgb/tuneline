import { validSpotifyToken } from './spotifyAuth'
import type { Song } from '../models/gameTypes'

export interface SpotifyPlaylist {
  id: string
  name: string
  image?: string
  trackCount: number
}

class SpotifyRequestError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Spotify request failed (${status}).`)
    this.name = 'SpotifyRequestError'
    this.status = status
  }
}

async function spotifyFetch<T>(path: string): Promise<T> {
  const token = await validSpotifyToken()
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new SpotifyRequestError(response.status)
  return response.json() as Promise<T>
}

export async function getPlaylists(): Promise<SpotifyPlaylist[]> {
  const data = await spotifyFetch<{
    items: Array<{
      id: string
      name: string
      images?: Array<{ url: string }>
      items?: { total: number }
      tracks?: { total: number }
    }>
    next: string | null
  }>('/me/playlists?limit=50')
  return data.items.map((item) => ({
    id: item.id,
    name: item.name,
    image: item.images?.[0]?.url,
    trackCount: item.items?.total ?? item.tracks?.total ?? 0,
  }))
}

export async function getPlaylistSongs(playlistId: string): Promise<Song[]> {
  const result: Song[] = []
  let path: string | null = `/playlists/${encodeURIComponent(playlistId)}/items?limit=50&fields=items(item(type,id,uri,name,artists(name),album(release_date))),next`
  while (path) {
    let page: {
      items: Array<{
        item?: null | {
          type?: string
          id?: string
          uri?: string
          name?: string
          artists?: Array<{ name: string }>
          album?: { release_date?: string | null }
        }
        track?: null | {
          id?: string
          uri?: string
          name?: string
          artists?: Array<{ name: string }>
          album?: { release_date?: string | null }
        }
      }>
      next: string | null
    }
    try {
      page = await spotifyFetch(path.replace('https://api.spotify.com/v1', ''))
    } catch (error) {
      if (error instanceof SpotifyRequestError && error.status === 403) {
        throw new Error('Spotify only lets TuneLine load playlists you own or can edit with the owner. Copy this playlist to one you own, or choose another playlist.')
      }
      throw error
    }
    for (const playlistItem of page.items) {
      const track = playlistItem.item ?? playlistItem.track
      if (!track?.id || !track.uri || !track.name || !track.artists?.[0]?.name) continue
      const releaseDate = track.album?.release_date
      if (!releaseDate) continue
      const year = Number(releaseDate.slice(0, 4))
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

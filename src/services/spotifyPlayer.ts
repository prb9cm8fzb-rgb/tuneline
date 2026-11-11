declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void
    Spotify?: {
      Player: new (options: {
        name: string
        getOAuthToken: (callback: (token: string) => void) => void
        volume?: number
      }) => {
        connect: () => Promise<boolean>
        disconnect: () => void
        activateElement: () => Promise<void>
        addListener: (event: string, callback: (data: { device_id?: string }) => void) => boolean
        pause: () => Promise<void>
        resume: () => Promise<void>
        seek: (position: number) => Promise<void>
      }
    }
  }
}

import { validSpotifyToken } from './spotifyAuth'

let player: NonNullable<Window['Spotify']>['Player'] extends new (...args: never[]) => infer T ? T | null : never = null
let ready = false
let currentDeviceId: string | null = null
let sdkPromise: Promise<void> | null = null
let initializationPromise: Promise<void> | null = null

function loadSpotifySdk(): Promise<void> {
  if (window.Spotify) return Promise.resolve()
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.onerror = () => {
      sdkPromise = null
      reject(new Error('Could not load the Spotify playback SDK.'))
    }
    window.onSpotifyWebPlaybackSDKReady = () => resolve()
    document.head.append(script)
  })
  return sdkPromise
}

export function initializeSpotifyPlayer(): Promise<void> {
  if (ready && player && currentDeviceId) return Promise.resolve()
  if (initializationPromise) return initializationPromise
  initializationPromise = (async () => {
    await loadSpotifySdk()
    const Spotify = window.Spotify
    if (!Spotify) throw new Error('Spotify playback SDK did not initialize.')
    player = new Spotify.Player({
      name: 'TuneLine',
      getOAuthToken: (callback) => { void validSpotifyToken().then(callback) },
      volume: 0.8,
    })
    player.addListener('ready', ({ device_id }) => { currentDeviceId = device_id ?? null })
    const connected = await player.connect()
    if (!connected) throw new Error('Spotify could not connect to this device.')
    await new Promise<void>((resolve) => {
      const started = Date.now()
      const wait = () => {
        if (currentDeviceId || Date.now() - started > 8_000) return resolve()
        window.setTimeout(wait, 100)
      }
      wait()
    })
    if (!currentDeviceId) throw new Error('Spotify did not provide a playback device.')
    ready = true
  })().finally(() => {
    if (!ready || !currentDeviceId) initializationPromise = null
  })
  return initializationPromise
}

export async function playSpotifyFragment(uri: string, startMs: number, durationSeconds: number) {
  const activation = player?.activateElement()
  await initializeSpotifyPlayer()
  if (!player || !currentDeviceId) throw new Error('Spotify player is not ready.')
  if (activation) await activation
  else await player.activateElement()
  const token = await validSpotifyToken()
  const transfer = await fetch('https://api.spotify.com/v1/me/player', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_ids: [currentDeviceId], play: false }),
  })
  if (!transfer.ok) throw new Error(`Could not select TuneLine as the Spotify player (${transfer.status}).`)
  const play = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(currentDeviceId)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ uris: [uri], position_ms: startMs }),
  })
  if (!play.ok) throw new Error(`Spotify could not start this track (${play.status}).`)
  window.setTimeout(() => { void player?.pause() }, durationSeconds * 1000)
}

export async function pauseSpotify() {
  await player?.pause()
}

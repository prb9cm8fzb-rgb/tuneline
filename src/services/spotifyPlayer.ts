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
let currentPlaybackTarget: { kind: 'connect'; deviceId: string } | { kind: 'browser' } | null = null

type SpotifyConnectDevice = {
  id: string | null
  name: string
  type: string
  is_active: boolean
  is_restricted: boolean
}

export type SpotifyPlaybackRoute =
  | { kind: 'connect'; deviceName: string }
  | { kind: 'browser' }

const spotifyApi = 'https://api.spotify.com/v1'

async function getConnectDevice(): Promise<SpotifyConnectDevice | null> {
  const token = await validSpotifyToken()
  const response = await fetch(`${spotifyApi}/me/player/devices`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (response.status === 204) return null
  if (!response.ok) throw new Error(`Could not check Spotify Connect devices (${response.status}).`)

  const { devices } = await response.json() as { devices: SpotifyConnectDevice[] }
  const available = devices.filter((device) =>
    device.id && !device.is_restricted && device.name.toLowerCase() !== 'tuneline',
  )
  return available.find((device) => device.is_active) ?? (available.length === 1 ? available[0] : null)
}

async function waitForActiveDevice(deviceId: string, token: string) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await fetch(`${spotifyApi}/me/player`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.status !== 204 && !response.ok) {
      throw new Error(`Could not confirm the Spotify playback device (${response.status}).`)
    }
    if (response.ok) {
      const state = await response.json() as { device?: { id?: string } }
      if (state.device?.id === deviceId) return
    }
    await new Promise((resolve) => window.setTimeout(resolve, 250))
  }
  throw new Error('Spotify did not switch to the selected Connect device.')
}

async function playOnBrowser(uri: string, startMs: number, activation?: Promise<{ error?: unknown }>) {
  await initializeSpotifyPlayer()
  if (!player || !currentDeviceId) throw new Error('Spotify player is not ready.')
  if (activation) {
    const result = await activation
    if (result.error) throw result.error
  } else {
    await player.activateElement()
  }

  const token = await validSpotifyToken()
  const transfer = await fetch(`${spotifyApi}/me/player`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_ids: [currentDeviceId], play: false }),
  })
  if (!transfer.ok) throw new Error(`Could not select TuneLine as the Spotify player (${transfer.status}).`)
  const play = await fetch(`${spotifyApi}/me/player/play?device_id=${encodeURIComponent(currentDeviceId)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ uris: [uri], position_ms: startMs }),
  })
  if (!play.ok) throw new Error(`Spotify could not start this track (${play.status}).`)
  currentPlaybackTarget = { kind: 'browser' }
}

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

export async function playSpotifyFragment(uri: string, startMs: number): Promise<SpotifyPlaybackRoute> {
  const activation = player?.activateElement().then(
    () => ({}),
    (error: unknown) => ({ error }),
  )
  const device = await getConnectDevice()
  if (!device?.id) {
    await playOnBrowser(uri, startMs, activation)
    return { kind: 'browser' }
  }

  const token = await validSpotifyToken()
  const transfer = await fetch(`${spotifyApi}/me/player`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_ids: [device.id], play: false }),
  })
  if (!transfer.ok) throw new Error(`Could not select ${device.name} as the Spotify player (${transfer.status}).`)
  await waitForActiveDevice(device.id, token)
  const play = await fetch(`${spotifyApi}/me/player/play?device_id=${encodeURIComponent(device.id)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ uris: [uri], position_ms: startMs }),
  })
  if (!play.ok) throw new Error(`Spotify could not start this track (${play.status}).`)
  currentPlaybackTarget = { kind: 'connect', deviceId: device.id }
  return { kind: 'connect', deviceName: device.name }
}

export async function pauseSpotify() {
  if (currentPlaybackTarget?.kind === 'connect') {
    const token = await validSpotifyToken()
    const response = await fetch(`${spotifyApi}/me/player/pause?device_id=${encodeURIComponent(currentPlaybackTarget.deviceId)}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw new Error(`Could not pause Spotify Connect playback (${response.status}).`)
    currentPlaybackTarget = null
    return
  }
  await player?.pause()
  currentPlaybackTarget = null
}

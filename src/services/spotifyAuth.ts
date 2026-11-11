const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined
const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string | undefined
const verifierKey = 'tuneline-pkce-verifier'
const stateKey = 'tuneline-auth-state'
const tokenKey = 'tuneline-spotify-token'
const scopes = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
]

export type SpotifyToken = { access_token: string; refresh_token?: string; expires_at: number }

function randomString(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (byte) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[byte % 66]).join('')
}

async function challengeFor(verifier: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function spotifyConfigured() {
  return Boolean(clientId && redirectUri)
}

export function getSpotifyToken(): SpotifyToken | null {
  const value = sessionStorage.getItem(tokenKey)
  return value ? JSON.parse(value) as SpotifyToken : null
}

export async function connectSpotify() {
  if (!clientId || !redirectUri) throw new Error('Add VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_REDIRECT_URI to .env.local first.')
  const verifier = randomString(64)
  const state = randomString(32)
  sessionStorage.setItem(verifierKey, verifier)
  sessionStorage.setItem(stateKey, state)
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: await challengeFor(verifier),
    state,
    scope: scopes.join(' '),
  })
  window.location.assign(`https://accounts.spotify.com/authorize?${params}`)
}

export async function completeSpotifyAuth(): Promise<SpotifyToken | null> {
  const query = new URLSearchParams(window.location.search)
  const code = query.get('code')
  if (!code) return getSpotifyToken()
  const returnedState = query.get('state')
  const expectedState = sessionStorage.getItem(stateKey)
  const verifier = sessionStorage.getItem(verifierKey)
  if (!returnedState || returnedState !== expectedState || !verifier || !clientId || !redirectUri) {
    throw new Error('Spotify sign-in could not be verified. Please try connecting again.')
  }
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }),
  })
  if (!response.ok) throw new Error(`Spotify token exchange failed (${response.status}).`)
  const data = await response.json() as { access_token: string; refresh_token?: string; expires_in: number }
  const token: SpotifyToken = { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: Date.now() + data.expires_in * 1000 }
  sessionStorage.setItem(tokenKey, JSON.stringify(token))
  sessionStorage.removeItem(verifierKey)
  sessionStorage.removeItem(stateKey)
  window.history.replaceState({}, '', window.location.pathname)
  return token
}

export async function validSpotifyToken(): Promise<string> {
  const token = getSpotifyToken()
  if (!token) throw new Error('Connect Spotify to continue.')
  if (token.expires_at > Date.now() + 60_000) return token.access_token
  if (!token.refresh_token || !clientId) throw new Error('Spotify session expired. Please connect Spotify again.')

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, grant_type: 'refresh_token', refresh_token: token.refresh_token }),
  })
  if (!response.ok) throw new Error(`Spotify token refresh failed (${response.status}).`)
  const data = await response.json() as { access_token: string; refresh_token?: string; expires_in: number }
  const updated = { ...token, access_token: data.access_token, refresh_token: data.refresh_token ?? token.refresh_token, expires_at: Date.now() + data.expires_in * 1000 }
  sessionStorage.setItem(tokenKey, JSON.stringify(updated))
  return updated.access_token
}

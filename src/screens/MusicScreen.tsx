import { useState } from 'react'
import type { SpotifyPlaylist } from '../services/spotifyApi'
import PrimaryButton from '../components/PrimaryButton'
import type { Game } from '../models/gameTypes'

export default function MusicScreen({ game, connected, playlists, selectedPlaylist, trackCount, loadingPlaylists, loadingSongs, configured, configurationHelp, onConnect, onSelectPlaylist, onDemo, onSpotifyStart, onBack }: {
  game: Game
  connected: boolean
  playlists: SpotifyPlaylist[]
  selectedPlaylist: string
  trackCount: number
  loadingPlaylists: boolean
  loadingSongs: boolean
  configured: boolean
  configurationHelp: string
  onConnect: () => void
  onSelectPlaylist: (playlistId: string) => void
  onDemo: () => void
  onSpotifyStart: () => void
  onBack: () => void
}) {
  const required = game.settings.numberOfTeams * game.settings.songsPerTeam
  const [playlistInfoOpen, setPlaylistInfoOpen] = useState(false)
  return (
    <div className="stage-content music-content">
      <div className="step-kicker">02 / MUSIC SOURCE</div>
      <h2>Choose your soundtrack.</h2>
      <p className="stage-description">Connect Spotify for a unique set of tracks, or try a demo game with sample songs.</p>
      <div className="music-options">
        <article className="music-option spotify-option">
          <div className="music-option-icon spotify-icon">◖</div>
          <div className="music-option-copy">
            <span className="option-tag">YOUR MUSIC</span>
            <div className="music-title-row">
              <h3>{connected ? 'Spotify connected' : 'Connect Spotify'}</h3>
              <button
                type="button"
                className="playlist-info-button"
                aria-label="Which Spotify playlists can I use?"
                aria-expanded={playlistInfoOpen}
                aria-controls="spotify-playlist-info"
                onClick={() => setPlaylistInfoOpen((open) => !open)}
              >
                i
              </button>
            </div>
            <p>Choose a playlist and TuneLine will deal out {required} unique songs.</p>
            {playlistInfoOpen && (
              <aside className="playlist-info" id="spotify-playlist-info" aria-labelledby="spotify-playlist-info-title">
                <strong id="spotify-playlist-info-title">Which playlists can I use?</strong>
                <p>Choose a playlist you own or can edit as a collaborator. A public playlist you only follow or save is not accessible.</p>
                <p>You need at least {required} usable tracks. TuneLine skips tracks without readable song details or a release year.</p>
                <button type="button" className="playlist-info-close" onClick={() => setPlaylistInfoOpen(false)}>CLOSE</button>
              </aside>
            )}
          </div>
          {!connected ? (
            <div className="spotify-connect"><PrimaryButton variant="secondary" onClick={onConnect}>CONNECT SPOTIFY</PrimaryButton><small>{configured ? 'Sign in once in this browser. TuneLine remembers this connection on this device.' : configurationHelp}</small></div>
          ) : (
            <div className="playlist-picker">
              {loadingPlaylists ? <span className="loading-label">LOADING PLAYLISTS…</span> : <select value={selectedPlaylist} onChange={(event) => onSelectPlaylist(event.target.value)}><option value="">Choose a playlist</option>{playlists.map((playlist) => <option value={playlist.id} key={playlist.id}>{playlist.name} · {playlist.trackCount} tracks</option>)}</select>}
              {selectedPlaylist && <span className="track-count">{loadingSongs ? 'Loading tracks…' : `${trackCount} usable tracks`} · {required} needed</span>}
              <PrimaryButton disabled={!selectedPlaylist || loadingSongs || trackCount < required} onClick={onSpotifyStart}>DEAL THE TRACKS <span>↗</span></PrimaryButton>
            </div>
          )}
        </article>
        <article className="music-option demo-option">
          <div className="music-option-icon demo-icon">♫</div>
          <div className="music-option-copy"><span className="option-tag">NO SPOTIFY NEEDED</span><h3>Play the demo</h3><p>Explore every round and timeline screen using sample tracks. Demo tracks repeat between teams.</p></div>
          <PrimaryButton variant="secondary" onClick={onDemo}>USE DEMO TRACKS <span>↗</span></PrimaryButton>
        </article>
      </div>
      <div className="stage-actions"><PrimaryButton variant="quiet" onClick={onBack}>← BACK TO TEAMS</PrimaryButton></div>
    </div>
  )
}

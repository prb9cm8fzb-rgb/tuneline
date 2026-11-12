import type { FragmentDuration, GameSettings, YearTolerance } from '../models/gameTypes'
import PrimaryButton from '../components/PrimaryButton'

export default function GameSetupScreen({ settings, onSettingsChange, onContinue, onCancel }: {
  settings: GameSettings
  onSettingsChange: (settings: GameSettings) => void
  onContinue: () => void
  onCancel: () => void
}) {
  const songCounts = [5, 10, 15, 20]
  const durations: FragmentDuration[] = [10, 20, 30, 40, 50]
  const tolerances: YearTolerance[] = [0, 1, 2, 3]
  const totalSongs = settings.numberOfTeams * settings.songsPerTeam
  const shortestMinutes = Math.round(totalSongs * 0.6)
  const longestMinutes = Math.round(totalSongs * 0.75)
  const toleranceLabel = settings.yearTolerance === 0
    ? 'Exact year'
    : `±${settings.yearTolerance} year${settings.yearTolerance === 1 ? '' : 's'}`

  return (
    <div className="setup-overlay"><div className="setup-panel"><button className="close-button" onClick={onCancel} aria-label="Close setup">×</button>
      <div className="step-kicker">SET UP YOUR GAME</div><h2>Set the scene.</h2>
      <div className="setting-group team-count-group"><span className="setting-label">NUMBER OF TEAMS</span><div className="team-count-options">{Array.from({ length: 8 }, (_, index) => index + 1).map((count) => <button type="button" key={count} aria-pressed={settings.numberOfTeams === count} className={settings.numberOfTeams === count ? 'selected' : ''} onClick={() => onSettingsChange({ ...settings, numberOfTeams: count })}>{count}</button>)}</div></div>
      <div className="setting-group"><span className="setting-label">SONGS PER TEAM</span><div className="segmented-control song-count-control">{songCounts.map((count) => <button type="button" key={count} aria-pressed={settings.songsPerTeam === count} className={settings.songsPerTeam === count ? 'selected' : ''} onClick={() => onSettingsChange({ ...settings, songsPerTeam: count })}>{count}</button>)}</div></div>
      <div className="setting-group"><span className="setting-label">FRAGMENT LENGTH</span><div className="segmented-control">{durations.map((duration) => <button type="button" key={duration} aria-pressed={settings.fragmentDuration === duration} className={settings.fragmentDuration === duration ? 'selected' : ''} onClick={() => onSettingsChange({ ...settings, fragmentDuration: duration })}>{duration}<small>SEC</small></button>)}</div></div>
      <div className="setting-group"><span className="setting-label">YEAR TOLERANCE</span><div className="tolerance-options">{tolerances.map((tolerance) => <button type="button" key={tolerance} aria-pressed={settings.yearTolerance === tolerance} className={settings.yearTolerance === tolerance ? 'selected' : ''} onClick={() => onSettingsChange({ ...settings, yearTolerance: tolerance })}>{tolerance === 0 ? 'Exact' : `± ${tolerance} year${tolerance > 1 ? 's' : ''}`}</button>)}</div></div>
      <div className="setup-note"><span>✦</span> Up to {settings.songsPerTeam * 4} points per team.</div>
      <div className="setup-summary" aria-live="polite">
        <p>{settings.numberOfTeams} {settings.numberOfTeams === 1 ? 'team' : 'teams'} · {settings.songsPerTeam} songs each · {settings.fragmentDuration} sec · {toleranceLabel}</p>
        <strong>Approx. game time: {shortestMinutes}–{longestMinutes} min</strong>
      </div>
      <PrimaryButton onClick={onContinue}>NEXT <span>↗</span></PrimaryButton>
    </div></div>
  )
}

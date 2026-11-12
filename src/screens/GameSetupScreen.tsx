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
  return (
    <div className="setup-overlay"><div className="setup-panel"><button className="close-button" onClick={onCancel} aria-label="Close setup">×</button>
      <div className="step-kicker">SET UP YOUR GAME</div><h2>Set the scene.</h2>
      <div className="setting-group team-count-group"><span className="setting-label">NUMBER OF TEAMS</span><div className="team-count-options">{Array.from({ length: 8 }, (_, index) => index + 1).map((count) => <button key={count} className={settings.numberOfTeams === count ? 'selected' : ''} onClick={() => onSettingsChange({ ...settings, numberOfTeams: count })}>{count}</button>)}</div></div>
      <div className="setting-group"><span className="setting-label">SONGS PER TEAM</span><div className="segmented-control song-count-control">{songCounts.map((count) => <button key={count} className={settings.songsPerTeam === count ? 'selected' : ''} onClick={() => onSettingsChange({ ...settings, songsPerTeam: count })}>{count}</button>)}</div></div>
      <div className="setting-group"><span className="setting-label">FRAGMENT LENGTH</span><div className="segmented-control">{durations.map((duration) => <button key={duration} className={settings.fragmentDuration === duration ? 'selected' : ''} onClick={() => onSettingsChange({ ...settings, fragmentDuration: duration })}>{duration}<small>SEC</small></button>)}</div></div>
      <div className="setting-group"><span className="setting-label">YEAR TOLERANCE</span><div className="tolerance-options">{tolerances.map((tolerance) => <button key={tolerance} className={settings.yearTolerance === tolerance ? 'selected' : ''} onClick={() => onSettingsChange({ ...settings, yearTolerance: tolerance })}>{tolerance === 0 ? 'Exact' : `± ${tolerance} year${tolerance > 1 ? 's' : ''}`}</button>)}</div></div>
      <div className="setup-note"><span>✦</span> Up to {settings.songsPerTeam * 4} points per team.</div>
      <PrimaryButton onClick={onContinue}>NEXT <span>↗</span></PrimaryButton>
    </div></div>
  )
}

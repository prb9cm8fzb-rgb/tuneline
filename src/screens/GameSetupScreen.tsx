import type { FragmentDuration, GameSettings, YearTolerance } from '../models/gameTypes'
import PrimaryButton from '../components/PrimaryButton'

export default function GameSetupScreen({ settings, onSettingsChange, onContinue, onCancel }: {
  settings: GameSettings
  onSettingsChange: (settings: GameSettings) => void
  onContinue: () => void
  onCancel: () => void
}) {
  const durations: FragmentDuration[] = [10, 20, 30, 40, 50]
  const tolerances: YearTolerance[] = [0, 1, 2, 3]
  return (
    <div className="setup-overlay"><div className="setup-panel"><button className="close-button" onClick={onCancel} aria-label="Close setup">×</button>
      <div className="step-kicker">SET UP YOUR GAME</div><h2>Set the scene.</h2>
      <label className="setting-label">NUMBER OF TEAMS <select value={settings.numberOfTeams} onChange={(event) => onSettingsChange({ ...settings, numberOfTeams: Number(event.target.value) })}>{Array.from({ length: 8 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} {index === 0 ? 'team' : 'teams'}</option>)}</select></label>
      <div className="setting-group"><span className="setting-label">FRAGMENT LENGTH</span><div className="segmented-control">{durations.map((duration) => <button key={duration} className={settings.fragmentDuration === duration ? 'selected' : ''} onClick={() => onSettingsChange({ ...settings, fragmentDuration: duration })}>{duration}<small>SEC</small></button>)}</div></div>
      <div className="setting-group"><span className="setting-label">YEAR TOLERANCE</span><div className="tolerance-options">{tolerances.map((tolerance) => <button key={tolerance} className={settings.yearTolerance === tolerance ? 'selected' : ''} onClick={() => onSettingsChange({ ...settings, yearTolerance: tolerance })}>{tolerance === 0 ? 'Exact' : `± ${tolerance} year${tolerance > 1 ? 's' : ''}`}</button>)}</div></div>
      <div className="scoreboard-setting"><div><b>Show scoreboard during game?</b><small>Keep the friendly competition going.</small></div><button role="switch" aria-checked={settings.showScoreboard} className={`toggle ${settings.showScoreboard ? 'on' : ''}`} onClick={() => onSettingsChange({ ...settings, showScoreboard: !settings.showScoreboard })}><i /></button></div>
      <div className="setup-note"><span>✦</span> Ten songs per team. Up to 40 points to win.</div>
      <PrimaryButton onClick={onContinue}>CHOOSE YOUR TEAMS <span>↗</span></PrimaryButton>
    </div></div>
  )
}

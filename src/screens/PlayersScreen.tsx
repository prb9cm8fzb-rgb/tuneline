import type { Team } from '../models/gameTypes'
import { teamColors } from '../store/gameStore'
import AnswerField from '../components/AnswerField'
import PrimaryButton from '../components/PrimaryButton'

export default function PlayersScreen({ teams, onUpdateTeam, onBack, onNext }: {
  teams: Team[]
  onUpdateTeam: (teamId: string, changes: Partial<Team>) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div className="stage-content">
      <div className="step-kicker">01 / TEAM SETUP</div>
      <h2>Who's playing?</h2>
      <p className="stage-description">Pick a color and add both players. Your team name is made from your names.</p>
      <div className="team-grid">
        {teams.map((team, index) => {
          const used = teams.filter((other) => other.id !== team.id).map((other) => other.color)
          return <article className="team-editor" key={team.id}>
            <div className="team-editor-head"><span>TEAM {String(index + 1).padStart(2, '0')}</span><span className="color-preview" style={{ backgroundColor: team.color }} /></div>
            <div className="color-options">
              {teamColors.map((color) => (
                <button key={color} type="button" className={`color-choice ${team.color === color ? 'selected' : ''}`} style={{ backgroundColor: color }} disabled={used.includes(color)} onClick={() => onUpdateTeam(team.id, { color })} aria-label={`Choose ${color} for team ${index + 1}`} />
              ))}
            </div>
            <div className="player-fields">
              <AnswerField label="PLAYER 1" value={team.player1} placeholder="e.g. Nadia" onChange={(value) => onUpdateTeam(team.id, { player1: value })} />
              <AnswerField label="PLAYER 2" value={team.player2} placeholder="e.g. Jeroen" onChange={(value) => onUpdateTeam(team.id, { player2: value })} />
            </div>
          </article>
        })}
      </div>
      <div className="stage-actions"><PrimaryButton variant="secondary" onClick={onBack}>BACK</PrimaryButton><PrimaryButton onClick={onNext}>NEXT: MUSIC <span>↗</span></PrimaryButton></div>
    </div>
  )
}

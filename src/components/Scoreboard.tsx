import type { Team } from '../models/gameTypes'
import TeamBadge from './TeamBadge'

export default function Scoreboard({ teams, activeTeamId, compact = false }: {
  teams: Team[]
  activeTeamId?: string
  compact?: boolean
}) {
  return (
    <div className={`scoreboard ${compact ? 'scoreboard-compact' : ''}`}>
      {teams.map((team, index) => (
        <div className={`score-row ${team.id === activeTeamId ? 'score-row-active' : ''}`} key={team.id}>
          <div className="score-card-heading">
            <span className="score-rank">RANK {String(index + 1).padStart(2, '0')}</span>
            {team.id === activeTeamId && <span className="score-current-turn">● PLAYING</span>}
          </div>
          <div className="score-card-main">
            <TeamBadge team={team} compact />
            <strong>{team.guessingScore + team.timelineScore}<small>PTS</small></strong>
          </div>
        </div>
      ))}
    </div>
  )
}

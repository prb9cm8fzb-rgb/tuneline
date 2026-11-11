import type { Team } from '../models/gameTypes'
import TeamBadge from './TeamBadge'

export default function Scoreboard({ teams, compact = false }: { teams: Team[]; compact?: boolean }) {
  return (
    <div className={`scoreboard ${compact ? 'scoreboard-compact' : ''}`}>
      {teams.map((team, index) => (
        <div className="score-row" key={team.id}>
          <span className="score-rank">{String(index + 1).padStart(2, '0')}</span>
          <TeamBadge team={team} compact />
          <strong>{team.guessingScore + team.timelineScore}<small> PTS</small></strong>
        </div>
      ))}
    </div>
  )
}

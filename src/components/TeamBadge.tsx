import type { Team } from '../models/gameTypes'

export default function TeamBadge({ team, compact = false }: { team: Team; compact?: boolean }) {
  return (
    <span className={`team-badge ${compact ? 'compact' : ''}`}>
      <i className="team-dot" style={{ backgroundColor: team.color }} />
      <span>{team.player1 || 'Player 1'} <b>&</b> {team.player2 || 'Player 2'}</span>
    </span>
  )
}

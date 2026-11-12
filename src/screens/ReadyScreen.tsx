import type { Team } from '../models/gameTypes'
import PrimaryButton from '../components/PrimaryButton'
import TeamBadge from '../components/TeamBadge'

export default function ReadyScreen({ team, round, total, duration, onReady }: {
  team: Team
  round: number
  total: number
  duration: number
  onReady: () => void
}) {
  return (
    <div className="ready-screen">
      <div className="ready-disc"><span>♫</span></div>
      <div className="step-kicker">ROUND {round} OF {total}</div>
      <h2>Ready to listen?</h2>
      <TeamBadge team={team} />
      <p className="stage-description">Listen to a {duration}-second fragment, then enter the artist, title, and year.</p>
      <PrimaryButton onClick={onReady}>WE'RE READY <span>↗</span></PrimaryButton>
    </div>
  )
}

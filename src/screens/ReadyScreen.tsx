import type { Team } from '../models/gameTypes'
import PrimaryButton from '../components/PrimaryButton'
import TeamBadge from '../components/TeamBadge'

export default function ReadyScreen({ team, checker, round, total, duration, onReady }: {
  team: Team
  checker?: Team
  round: number
  total: number
  duration: number
  onReady: () => void
}) {
  return (
    <div className="ready-screen">
      <div className="ready-disc"><span>♫</span></div>
      <div className="step-kicker">ROUND {round} OF {total}</div>
      <h2>Pass the spotlight.</h2>
      <TeamBadge team={team} />
      <p className="stage-description">You have {duration} seconds to listen. The song stays a secret until the check.</p>
      <PrimaryButton onClick={onReady}>WE'RE READY <span>↗</span></PrimaryButton>
      <div className="ready-side-note">UP NEXT <b>{checker ? `${checker.player1} & ${checker.player2}` : 'External player'}</b></div>
    </div>
  )
}

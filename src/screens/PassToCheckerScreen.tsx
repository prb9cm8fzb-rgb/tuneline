import type { Team } from '../models/gameTypes'
import PrimaryButton from '../components/PrimaryButton'
import TeamBadge from '../components/TeamBadge'

export default function PassToCheckerScreen({ team, externalChecker, onStart }: { team?: Team; externalChecker: boolean; onStart: () => void }) {
  return (
    <div className="pass-screen">
      <div className="pass-icon">⇢</div><div className="step-kicker">KEEP THE ANSWER SECRET</div><h2>PASS THE IPAD</h2>
      {team && <TeamBadge team={team} />}
      <p className="stage-description">{externalChecker ? 'An external player must check the answers.' : 'This team will check the answers.'}<br /><strong>Do not show this screen to the playing team.</strong></p>
      <PrimaryButton onClick={onStart}>START CHECK <span>↗</span></PrimaryButton>
      {externalChecker && <small className="external-check-note">An external player must check the answers.</small>}
    </div>
  )
}

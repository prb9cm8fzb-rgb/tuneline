import type { Team } from '../models/gameTypes'
import PrimaryButton from '../components/PrimaryButton'

export default function FinalScoreScreen({ teams, onReview, onPlayAgain }: { teams: Team[]; onReview: () => void; onPlayAgain: () => void }) {
  return (
    <div className="stage-content final-screen">
      <div className="final-trophy">✳</div><div className="step-kicker">THAT'S A WRAP</div><h2>What a soundtrack.</h2>
      <p className="stage-description">The final scores are in. Nice work, everyone.</p>
      <div className="final-score-list">{teams.map((team, index) => <div className={`final-score-row ${index === 0 ? 'winner' : ''}`} key={team.id}><span className="final-rank">{String(index + 1).padStart(2, '0')}</span><i className="team-dot" style={{ backgroundColor: team.color }} /><span className="final-team-names">{team.player1} <b>&amp;</b> {team.player2}{index === 0 && <small>WINNER</small>}</span><span className="final-points">{team.guessingScore + team.timelineScore}<small> / 40</small></span><span className="final-breakdown">{team.guessingScore} GUESS · {team.timelineScore} TIMELINE</span></div>)}</div>
      <div className="final-actions"><PrimaryButton variant="secondary" onClick={onReview}>REVIEW GAME</PrimaryButton><PrimaryButton onClick={onPlayAgain}>PLAY AGAIN <span>↗</span></PrimaryButton></div>
    </div>
  )
}

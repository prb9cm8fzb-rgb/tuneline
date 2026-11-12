import type { Team } from '../models/gameTypes'
import PrimaryButton from '../components/PrimaryButton'

export default function FinalScoreScreen({ teams, songsPerTeam, onReview, onPlayAgain }: { teams: Team[]; songsPerTeam: number; onReview: () => void; onPlayAgain: () => void }) {
  const winner = teams[0]
  return (
    <div className="stage-content final-screen">
      <div className="final-trophy">✳</div><div className="step-kicker">GAME OVER</div><h2>{winner ? `${winner.player1} & ${winner.player2} win!` : 'What a soundtrack.'}</h2>
      <p className="stage-description">Regular points plus one bonus point for every timeline card.</p>
      <div className="final-score-list">{teams.map((team, index) => <div className={`final-score-row ${index === 0 ? 'winner' : ''}`} key={team.id}><span className="final-rank">{String(index + 1).padStart(2, '0')}</span><i className="team-dot" style={{ backgroundColor: team.color }} /><span className="final-team-names">{team.player1} <b>&amp;</b> {team.player2}{index === 0 && <small>WINNER</small>}</span><span className="final-points">{team.guessingScore + team.timelineScore}<small> / {songsPerTeam * 4}</small></span><span className="final-breakdown">{team.guessingScore} REGULAR · {team.timelineScore} TIMELINE CARDS · +{team.timelineScore} BONUS</span></div>)}</div>
      <div className="final-actions"><PrimaryButton variant="secondary" onClick={onReview}>REVIEW GAME</PrimaryButton><PrimaryButton onClick={onPlayAgain}>PLAY AGAIN <span>↗</span></PrimaryButton></div>
    </div>
  )
}

import type { Game } from '../models/gameTypes'
import PrimaryButton from '../components/PrimaryButton'

export default function GameReviewScreen({ game, onBack }: { game: Game; onBack: () => void }) {
  return (
    <div className="stage-content review-screen">
      <div className="step-kicker">GAME REVIEW</div><h2>Every track, every guess.</h2>
      <p className="stage-description">A look back at the answers and release years from this game.</p>
      <div className="review-list">{game.answers.map((answer) => {
        const song = game.songs.find((item) => item.id === answer.songId)
        const team = game.teams.find((item) => item.id === answer.teamId)
        if (!song || !team) return null
        return <article className="review-item" key={answer.id}><span className="review-round">ROUND {answer.roundNumber}</span><span className="review-team"><i className="team-dot" style={{ backgroundColor: team.color }} />{team.player1} &amp; {team.player2}</span><b>{song.artist} — {song.title}</b><span className="review-year">{song.releaseYear}</span><small>GUESSED {answer.enteredYear ?? '—'} · {answer.score}/3 REGULAR · {answer.yearCorrect ? '+1 TIMELINE' : 'NO TIMELINE CARD'}</small></article>
      })}</div>
      <div className="stage-actions"><span className="tolerance-note">{game.answers.length} TRACKS PLAYED</span><PrimaryButton onClick={onBack}>BACK TO FINAL SCORE</PrimaryButton></div>
    </div>
  )
}

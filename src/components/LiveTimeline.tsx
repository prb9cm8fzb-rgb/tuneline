import type { RoundAnswer, Song, Team } from '../models/gameTypes'

export default function LiveTimeline({ songs, answers, teams }: {
  songs: Song[]
  answers: RoundAnswer[]
  teams: Team[]
}) {
  const earnedCards = answers
    .filter((answer) => answer.completed && answer.yearCorrect)
    .map((answer) => ({
      answer,
      song: songs.find((song) => song.id === answer.songId),
      team: teams.find((team) => team.id === answer.teamId),
    }))
    .filter((card): card is { answer: RoundAnswer; song: Song; team: Team } => Boolean(card.song && card.team))
    .sort((a, b) => a.song.releaseYear - b.song.releaseYear || a.answer.roundNumber - b.answer.roundNumber)
  const cardCount = earnedCards.length

  return (
    <section className="live-timeline" aria-label="Your timeline">
      <div className="live-timeline-heading"><strong>YOUR TIMELINE</strong><span>{cardCount} {cardCount === 1 ? 'card' : 'cards'} · +{cardCount} bonus {cardCount === 1 ? 'point' : 'points'}</span></div>
      {earnedCards.length ? (
        <div className="live-timeline-track">
          {earnedCards.map(({ answer, song, team }) => (
            <article className="live-timeline-card" key={answer.id} style={{ borderColor: team.color }} aria-label={`${song.title}, ${song.releaseYear}, earned by ${team.player1} and ${team.player2}`}>
              <strong>{song.artist}</strong>
              <span>{song.title}</span>
              <b>{song.releaseYear}</b>
              <small>♫ ROUND {answer.roundNumber} · {team.player1} &amp; {team.player2}</small>
            </article>
          ))}
        </div>
      ) : <p className="empty-timeline">Your first correct year adds a card here.</p>}
    </section>
  )
}

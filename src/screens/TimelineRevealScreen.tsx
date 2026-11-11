import type { Game, Team } from '../models/gameTypes'
import { scoreTimeline } from '../store/gameStore'
import PrimaryButton from '../components/PrimaryButton'

export default function TimelineRevealScreen({ game, team, onContinue }: { game: Game; team: Team; onContinue: () => void }) {
  const order = game.timelineOrders[team.id] ?? []
  const songs = game.songs.filter((song) => song.teamId === team.id)
  const results = scoreTimeline(songs, order)
  const answers = new Map(game.answers.map((answer) => [answer.songId, answer]))
  const earned = results.filter((result) => result.correctPosition).length
  return (
    <div className="stage-content reveal-screen"><div className="step-kicker">TIMELINE REVEAL</div><h2>Time tells all.</h2><p className="stage-description">{team.player1} &amp; {team.player2} earned {earned} timeline points.</p><div className="reveal-list">{order.map((songId, index) => { const song = songs.find((item) => item.id === songId); const result = results.find((item) => item.songId === songId); const answer = answers.get(songId); return song ? <div className="reveal-item" key={songId}><span className="reveal-number">{String(index + 1).padStart(2, '0')}</span><span className="reveal-song"><b>{song.artist} — {song.title}</b><small>{song.releaseYear} · your guess: {answer?.enteredYear || '—'}</small></span><span className={result?.correctPosition ? 'result-correct' : 'result-wrong'}>{result?.correctPosition ? '✓ +1' : '×'}</span></div> : null })}</div><div className="stage-actions"><span className="tolerance-note">{earned} / {game.settings.songsPerTeam} TIMELINE POINTS</span><PrimaryButton onClick={onContinue}>NEXT TEAM <span>↗</span></PrimaryButton></div></div>
  )
}

import type { RoundAnswer, Song, YearTolerance } from '../models/gameTypes'
import { isYearCorrect, scoreAnswer } from '../store/gameStore'
import PrimaryButton from '../components/PrimaryButton'
import TeamBadge from '../components/TeamBadge'
import type { Team } from '../models/gameTypes'

function CheckToggle({ value, onChange }: { value: boolean | null; onChange: (value: boolean) => void }) {
  return (
    <div className="check-toggle">
      <button className={value === true ? 'active' : ''} aria-pressed={value === true} onClick={() => onChange(true)}>✓</button>
      <button className={value === false ? 'active wrong-active' : ''} aria-pressed={value === false} onClick={() => onChange(false)}>×</button>
    </div>
  )
}

export default function CheckAnswersScreen({ answer, song, team, round, tolerance, nextLabel, artistChoice, titleChoice, onArtistChoice, onTitleChoice, onLock, onNext }: {
  answer: RoundAnswer
  song: Song
  team: Team
  round: number
  tolerance: YearTolerance
  nextLabel: string
  artistChoice: boolean | null
  titleChoice: boolean | null
  onArtistChoice: (value: boolean) => void
  onTitleChoice: (value: boolean) => void
  onLock: () => void
  onNext: () => void
}) {
  const yearCorrect = isYearCorrect(answer.enteredYear, song.releaseYear, tolerance)
  const rows = [
    { label: 'Artist', entered: answer.enteredArtist, official: song.artist, correct: answer.completed ? answer.artistCorrect : artistChoice, onChange: onArtistChoice },
    { label: 'Song title', entered: answer.enteredTitle, official: song.title, correct: answer.completed ? answer.titleCorrect : titleChoice, onChange: onTitleChoice },
  ]
  const resultHeading = !answer.completed
    ? 'Your answers vs. correct answers'
    : answer.yearCorrect
      ? scoreAnswer(answer) === 3 ? 'Nice one!' : 'Timeline card earned!'
      : 'Not quite.'

  return (
    <div className={`stage-content check-content ${answer.completed ? answer.yearCorrect ? 'check-complete-earned' : 'check-complete-missed' : ''}`}>
      <div className="step-kicker">ROUND {round} · {answer.completed ? 'RESULT' : 'ANSWERS REVEALED'}</div>
      <h2>{resultHeading}</h2>
      <p className="stage-description">{answer.completed
        ? answer.yearCorrect
          ? 'Correct year. Timeline card earned.'
          : `Official year: ${song.releaseYear}. No timeline card earned.`
        : 'Compare your answers with the official answers. Mark Artist and Title; TuneLine checks the year automatically.'}</p>
      <div className="result-team"><TeamBadge team={team} /></div>
      <div className="comparison-table">
        <div className="comparison-head"><span /><span>YOUR ANSWER</span><span>CORRECT ANSWER</span><span>RESULT</span></div>
        {rows.map((row) => (
          <div className="comparison-row" key={row.label}>
            <div className="comparison-label">{row.label}</div>
            <b>{row.entered || '—'}</b>
            <b>{row.official}</b>
            {answer.completed
              ? <strong className={row.correct ? 'result-correct' : 'result-wrong'}>{row.correct ? '✓' : '×'}</strong>
              : <CheckToggle value={row.correct ?? null} onChange={row.onChange} />}
          </div>
        ))}
        <div className="comparison-row year-row">
          <div className="comparison-label">Year<small>Accepted: {tolerance === 0 ? 'exact year' : `±${tolerance} year${tolerance === 1 ? '' : 's'}`}</small></div>
          <b>{answer.enteredYear ?? '—'}</b>
          <b>{song.releaseYear}</b>
          <strong className={(answer.completed ? answer.yearCorrect : yearCorrect) ? 'result-correct' : 'result-wrong'}>{(answer.completed ? answer.yearCorrect : yearCorrect) ? '✓' : '×'}</strong>
        </div>
      </div>
      {answer.completed ? (
        <>
          <div className={`timeline-earned ${answer.yearCorrect ? 'earned' : ''}`}>
            <strong>{answer.yearCorrect ? '🎉 TIMELINE CARD EARNED' : 'NO TIMELINE CARD'}</strong>
            <span>{answer.yearCorrect ? '+1 bonus point' : 'Get the year right to earn a timeline card.'}</span>
          </div>
          <div className="result-score">
            <span>ROUND TOTAL<small>{scoreAnswer(answer)}/3 REGULAR + {Number(answer.yearCorrect)} TIMELINE BONUS</small></span>
            <strong>{scoreAnswer(answer) + Number(answer.yearCorrect)} <small> / 4 POINTS</small></strong>
          </div>
          <div className="stage-actions"><span className="tolerance-note">{team.player1.toUpperCase()} &amp; {team.player2.toUpperCase()}</span><PrimaryButton onClick={onNext}>{nextLabel} <span>↗</span></PrimaryButton></div>
        </>
      ) : (
        <div className="stage-actions"><span className="tolerance-note">YEAR CHECKED AUTOMATICALLY</span><PrimaryButton onClick={onLock}>CONFIRM SCORE <span>↗</span></PrimaryButton></div>
      )}
    </div>
  )
}

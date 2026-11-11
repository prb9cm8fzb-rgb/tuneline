import type { RoundAnswer, Song, YearTolerance } from '../models/gameTypes'
import { isYearCorrect } from '../store/gameStore'
import PrimaryButton from '../components/PrimaryButton'

function CheckToggle({ value, onChange }: { value: boolean | null; onChange: (value: boolean) => void }) {
  return <div className="check-toggle"><button className={value === true ? 'active' : ''} onClick={() => onChange(true)}>CORRECT</button><button className={value === false ? 'active wrong-active' : ''} onClick={() => onChange(false)}>WRONG</button></div>
}

export default function CheckAnswersScreen({ answer, song, round, tolerance, artistChoice, titleChoice, onArtistChoice, onTitleChoice, onLock }: {
  answer: RoundAnswer
  song: Song
  round: number
  tolerance: YearTolerance
  artistChoice: boolean | null
  titleChoice: boolean | null
  onArtistChoice: (value: boolean) => void
  onTitleChoice: (value: boolean) => void
  onLock: () => void
}) {
  const yearCorrect = isYearCorrect(answer.enteredYear, song.releaseYear, tolerance)
  return (
    <div className="stage-content check-content">
      <div className="step-kicker">CHECK ANSWERS · ROUND {round}</div><h2>How did they do?</h2>
      <p className="stage-description">Compare each answer with the official track. The year is checked automatically.</p>
      <div className="check-card">
        <div className="official-track"><span className="eyebrow">OFFICIAL ANSWER</span><strong>{song.artist}</strong><b>{song.title}</b><small>RELEASED {song.releaseYear}</small></div>
        <div className="submitted-track"><span className="eyebrow">THEIR ANSWERS</span>
          <div className="submitted-line"><span>ARTIST</span><b>{answer.enteredArtist || '—'}</b><CheckToggle value={artistChoice} onChange={onArtistChoice} /></div>
          <div className="submitted-line"><span>TITLE</span><b>{answer.enteredTitle || '—'}</b><CheckToggle value={titleChoice} onChange={onTitleChoice} /></div>
          <div className="submitted-line"><span>YEAR</span><b>{answer.enteredYear || '—'}</b><span className={`year-verdict ${yearCorrect ? 'result-correct' : 'result-wrong'}`}>{yearCorrect ? '✓ AUTO' : '× AUTO'}</span></div>
        </div>
      </div>
      <div className="stage-actions"><span className="tolerance-note">YEAR TOLERANCE <b>{tolerance === 0 ? 'EXACT' : `±${tolerance} YEAR${tolerance > 1 ? 'S' : ''}`}</b></span><PrimaryButton onClick={onLock}>LOCK THE SCORE <span>↗</span></PrimaryButton></div>
    </div>
  )
}

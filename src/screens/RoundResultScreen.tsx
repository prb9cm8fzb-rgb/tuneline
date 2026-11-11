import type { RoundAnswer } from '../models/gameTypes'
import { scoreAnswer } from '../store/gameStore'
import AnswerResult from '../components/AnswerResult'
import PrimaryButton from '../components/PrimaryButton'

export default function RoundResultScreen({ answer, playerName, finalRound, onNext }: {
  answer: RoundAnswer
  playerName: string
  finalRound: boolean
  onNext: () => void
}) {
  return (
    <div className="stage-content result-screen">
      <div className="step-kicker">ROUND {answer.roundNumber} COMPLETE</div><h2>Here's how you did.</h2>
      <div className="result-table"><div className="result-table-head"><span>PART</span><span>YOUR ANSWER</span><span>RESULT</span></div><AnswerResult label="Artist" value={answer.enteredArtist} correct={answer.artistCorrect} /><AnswerResult label="Song title" value={answer.enteredTitle} correct={answer.titleCorrect} /><AnswerResult label="Year" value={String(answer.enteredYear ?? '')} correct={answer.yearCorrect} /></div>
      <div className="result-score"><span>ROUND SCORE</span><strong>{scoreAnswer(answer)} <small>/ 3 POINTS</small></strong></div>
      <div className="result-private">The right answer stays secret until the final reveal.</div>
      <div className="stage-actions"><span className="tolerance-note">NICE WORK, {playerName.toUpperCase()}</span><PrimaryButton onClick={onNext}>{finalRound ? 'BUILD YOUR TIMELINE' : 'NEXT TURN'} <span>↗</span></PrimaryButton></div>
    </div>
  )
}

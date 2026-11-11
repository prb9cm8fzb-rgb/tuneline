export default function AnswerResult({ label, value, correct }: { label: string; value: string; correct?: boolean }) {
  return (
    <div className="answer-result">
      <span>{label}</span>
      <strong>{value || '—'}</strong>
      <b className={correct ? 'result-correct' : 'result-wrong'}>{correct ? '✓' : '×'}</b>
    </div>
  )
}

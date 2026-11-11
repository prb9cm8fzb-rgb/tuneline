import { useState } from 'react'
import type { Team } from '../models/gameTypes'
import AnswerField from '../components/AnswerField'
import PrimaryButton from '../components/PrimaryButton'
import TeamBadge from '../components/TeamBadge'

export interface AnswerDraft {
  artist: string
  title: string
  year: string
}

export default function AnswerScreen({ team, round, total, draft, onDraftChange, onLock }: {
  team: Team
  round: number
  total: number
  draft?: AnswerDraft
  onDraftChange: (draft: AnswerDraft) => void
  onLock: (artist: string, title: string, year: string) => Promise<void>
}) {
  const [artist, setArtist] = useState(draft?.artist ?? '')
  const [title, setTitle] = useState(draft?.title ?? '')
  const [year, setYear] = useState(draft?.year ?? '')
  const change = (field: keyof AnswerDraft, value: string) => {
    const updated = { artist, title, year, [field]: value }
    if (field === 'artist') setArtist(value)
    if (field === 'title') setTitle(value)
    if (field === 'year') setYear(value)
    onDraftChange(updated)
  }
  return (
    <div className="stage-content answer-screen"><div className="step-kicker">ROUND {round} OF {total} · YOUR TURN</div><h2>What did you hear?</h2><p className="stage-description">Trust your gut. Once you lock your answers, they're final.</p><div className="answer-team"><TeamBadge team={team} /></div><div className="answer-form"><AnswerField label="ARTIST" value={artist} onChange={(value) => change('artist', value)} placeholder="Who was that?" /><AnswerField label="SONG TITLE" value={title} onChange={(value) => change('title', value)} placeholder="Name that tune" /><AnswerField label="RELEASE YEAR" value={year} onChange={(value) => change('year', value)} placeholder="YYYY" type="number" /></div><div className="stage-actions"><span className="tolerance-note">NO TAKE-BACKS ONCE LOCKED</span><PrimaryButton onClick={() => void onLock(artist, title, year)}>LOCK ANSWERS <span>↗</span></PrimaryButton></div></div>
  )
}

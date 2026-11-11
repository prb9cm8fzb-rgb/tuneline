import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Song, RoundAnswer } from '../models/gameTypes'
import type { Team } from '../models/gameTypes'

type Props = { song: Song; index: number; answer?: RoundAnswer; team?: Team; reveal?: boolean }

export default function SongCard({ song, index, answer, team, reveal }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: song.id })
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, borderTopColor: team?.color }}
      className={`song-card ${isDragging ? 'dragging' : ''} ${reveal ? 'song-revealed' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="song-card-top"><span>SONG {String(index + 1).padStart(2, '0')}</span><span className="drag-icon">⠿</span></div>
      {reveal && answer ? (
        <div className="song-card-details">
          <div><small>ARTIST</small><span>{answer.enteredArtist || '—'}</span><b className={answer.artistCorrect ? 'result-correct' : 'result-wrong'}>{answer.artistCorrect ? '✓' : '×'}</b></div>
          <div><small>TITLE</small><span>{answer.enteredTitle || '—'}</span><b className={answer.titleCorrect ? 'result-correct' : 'result-wrong'}>{answer.titleCorrect ? '✓' : '×'}</b></div>
          <div><small>YEAR</small><span>{answer.enteredYear || '—'}</span><b className={answer.yearCorrect ? 'result-correct' : 'result-wrong'}>{answer.yearCorrect ? '✓' : '×'}</b></div>
        </div>
      ) : (
        <div className="song-card-cover"><span className="cover-glyph">♫</span><strong>PLACE<br />IN TIME</strong></div>
      )}
      <div className="song-card-bottom"><span>▶ &nbsp;10 SEC</span>{team && <i style={{ backgroundColor: team.color }} />}</div>
    </article>
  )
}

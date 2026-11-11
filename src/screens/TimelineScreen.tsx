import { useSensors, useSensor, PointerSensor, KeyboardSensor, closestCenter, DndContext, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type { RoundAnswer, Song, Team } from '../models/gameTypes'
import SongCard from '../components/SongCard'
import PrimaryButton from '../components/PrimaryButton'

export default function TimelineScreen({ team, roundCount, order, songs, answers, onReorder, onLock }: {
  team: Team
  roundCount: number
  order: string[]
  songs: Song[]
  answers: RoundAnswer[]
  onReorder: (event: DragEndEvent) => void
  onLock: () => void
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  return (
    <div className="stage-content timeline-screen">
      <div className="step-kicker">FINAL CHALLENGE · TEAM {roundCount}</div><h2>Put the years in order.</h2>
      <p className="stage-description">Drag the songs from oldest to newest. Your answers are shown, but not the official dates.</p>
      <div className="timeline-axis"><span>OLDEST</span><i /><span>NEWEST</span></div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onReorder}>
        <SortableContext items={order} strategy={horizontalListSortingStrategy}>
          <div className="timeline-cards">{order.map((songId, index) => {
            const song = songs.find((item) => item.id === songId)
            const answer = answers.find((item) => item.songId === songId)
            return song ? <SongCard key={song.id} song={song} index={index} answer={answer} team={team} reveal /> : null
          })}</div>
        </SortableContext>
      </DndContext>
      <div className="timeline-footer"><span>↔ &nbsp;DRAG TO REORDER</span><PrimaryButton onClick={onLock}>LOCK TIMELINE <span>↗</span></PrimaryButton></div>
    </div>
  )
}

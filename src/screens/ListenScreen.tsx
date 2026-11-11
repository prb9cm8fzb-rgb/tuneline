import type { Team } from '../models/gameTypes'
import PrimaryButton from '../components/PrimaryButton'
import TeamBadge from '../components/TeamBadge'

function formatTime(seconds: number) {
  return `00:${String(seconds).padStart(2, '0')}`
}

export default function ListenScreen({ team, checker, round, total, duration, secondsLeft, isPlaying, hasPlayed, onPlay, onContinue }: {
  team: Team
  checker?: Team
  round: number
  total: number
  duration: number
  secondsLeft: number
  isPlaying: boolean
  hasPlayed: boolean
  onPlay: () => void
  onContinue: () => void
}) {
  return (
    <div className="listen-screen">
      <div className="round-meta"><span className="step-kicker">ROUND {round} OF {total}</span><span className="live-dot">LISTENING ROOM</span></div>
      <div className="listen-columns">
        <div className="listen-context"><span className="eyebrow">PLAYING</span><TeamBadge team={team} /><div className="thin-rule" /><span className="eyebrow">CHECKING</span>{checker ? <TeamBadge team={checker} /> : <b className="checker-note">External player must check the answers.</b>}</div>
        <div className="listen-player"><div className={`vinyl-mini ${isPlaying ? 'spinning' : ''}`}><span>♫</span></div><div className="waveform" aria-hidden="true">{Array.from({ length: 38 }, (_, index) => <i key={index} style={{ height: `${18 + ((index * 19) % 54)}%` }} />)}</div><div className="timer-row"><span>{formatTime(duration - secondsLeft)}</span><span>{formatTime(duration)}</span></div><div className="timer-track"><i style={{ width: `${((duration - secondsLeft) / duration) * 100}%` }} /></div>
          {!hasPlayed ? <PrimaryButton className="play-song-button" onClick={onPlay}>▶ &nbsp; PLAY SONG</PrimaryButton> : !isPlaying ? <PrimaryButton className="play-song-button" variant="secondary" onClick={onContinue}>CONTINUE TO ANSWERS <span>↗</span></PrimaryButton> : <div className="countdown">{secondsLeft}<small>SECONDS LEFT</small></div>}
        </div>
      </div>
      <p className="no-spoilers"><span>◉</span> Keep the screen turned away from the checking team.</p>
    </div>
  )
}

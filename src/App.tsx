import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { Game, GameSettings, RoundAnswer, Song, Team } from './models/gameTypes'
import {
  getCheckingTeamIndex, isYearCorrect, makeDemoSongs,
  scoreAnswer, scoreTimeline, teamColors,
} from './store/gameStore'
import { db } from './services/database'
import { completeSpotifyAuth, connectSpotify, getSpotifyToken, spotifyConfigured } from './services/spotifyAuth'
import { getPlaylistSongs, getPlaylists, type SpotifyPlaylist } from './services/spotifyApi'
import { pauseSpotify, playSpotifyFragment } from './services/spotifyPlayer'
import AppHeader from './components/AppHeader'
import Scoreboard from './components/Scoreboard'
import HomeScreen from './screens/HomeScreen'
import GameSetupScreen from './screens/GameSetupScreen'
import PlayersScreen from './screens/PlayersScreen'
import MusicScreen from './screens/MusicScreen'
import ReadyScreen from './screens/ReadyScreen'
import ListenScreen from './screens/ListenScreen'
import AnswerScreen from './screens/AnswerScreen'
import PassToCheckerScreen from './screens/PassToCheckerScreen'
import CheckAnswersScreen from './screens/CheckAnswersScreen'
import RoundResultScreen from './screens/RoundResultScreen'
import TimelineScreen from './screens/TimelineScreen'
import TimelineRevealScreen from './screens/TimelineRevealScreen'
import FinalScoreScreen from './screens/FinalScoreScreen'
import GameReviewScreen from './screens/GameReviewScreen'

const defaultSettings: GameSettings = {
  numberOfTeams: 2,
  songsPerTeam: 10,
  fragmentDuration: 20,
  yearTolerance: 1,
  showScoreboard: true,
}

function makeTeams(count: number): Team[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `team-${index + 1}`,
    color: teamColors[index],
    player1: '',
    player2: '',
    guessingScore: 0,
    timelineScore: 0,
  }))
}

function shuffle<T>(items: T[]) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const random = new Uint32Array(1)
    crypto.getRandomValues(random)
    const swap = random[0] % (index + 1)
    ;[result[index], result[swap]] = [result[swap], result[index]]
  }
  return result
}

function freshId() {
  return crypto.randomUUID()
}

export default function App() {
  const [game, setGame] = useState<Game | null>(null)
  const gameRef = useRef<Game | null>(null)
  const writesRef = useRef<Promise<unknown>>(Promise.resolve())
  const [draftSettings, setDraftSettings] = useState<GameSettings>(defaultSettings)
  const [unfinishedGames, setUnfinishedGames] = useState<Game[]>([])
  const [spotifyConnected, setSpotifyConnected] = useState(Boolean(getSpotifyToken()))
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState('')
  const [spotifySongPool, setSpotifySongPool] = useState<Song[]>([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [loadingSongs, setLoadingSongs] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(20)
  const [checkerChoices, setCheckerChoices] = useState<{ artist: boolean | null; title: boolean | null }>({ artist: null, title: null })
  const [error, setError] = useState('')

  const save = useCallback(async (nextGame: Game) => {
    gameRef.current = nextGame
    setGame(nextGame)
    try {
      const pendingWrite = writesRef.current.then(() => db.games.put(nextGame))
      writesRef.current = pendingWrite.catch(() => undefined)
      await pendingWrite
      setUnfinishedGames((games) => {
        const remaining = games.filter((saved) => saved.id !== nextGame.id && saved.status !== 'finished')
        return nextGame.status === 'finished'
          ? remaining
          : [nextGame, ...remaining].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      })
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? `Could not save this game: ${reason.message}` : 'Could not save this game locally.')
    }
  }, [])

  const updateGame = useCallback((updater: (current: Game) => Game) => {
    const current = gameRef.current
    if (current) void save(updater(current))
  }, [save])

  useEffect(() => { gameRef.current = game }, [game])

  useEffect(() => {
    let active = true
    void db.games.where('status').anyOf(['setup', 'playing', 'timeline']).toArray()
      .then((games) => {
        if (active) setUnfinishedGames(games.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)))
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? `Could not load saved games: ${reason.message}` : 'Could not load saved games.')
      })
    void completeSpotifyAuth()
      .then((token) => { if (active) setSpotifyConnected(Boolean(token)) })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Spotify sign-in failed.') })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (game?.phase !== 'listen' || !isPlaying) return
    const timer = window.setInterval(() => setSecondsLeft((remaining) => {
      if (remaining <= 1) {
        window.clearInterval(timer)
        setIsPlaying(false)
        void pauseSpotify().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not pause Spotify.'))
        return 0
      }
      return remaining - 1
    }), 1000)
    return () => window.clearInterval(timer)
  }, [game?.phase, isPlaying])

  useEffect(() => {
    if (game?.phase !== 'music' || !spotifyConnected) return
    setLoadingPlaylists(true)
    void getPlaylists()
      .then(setPlaylists)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load Spotify playlists.'))
      .finally(() => setLoadingPlaylists(false))
  }, [game?.phase, spotifyConnected])

  const currentTeam = game?.teams[game.currentTeamIndex]
  const checkingTeamIndex = game ? getCheckingTeamIndex(game.currentTeamIndex, game.teams.length) : 0
  const checkingTeam = game?.teams[checkingTeamIndex]
  const activeAnswer = game && currentTeam
    ? game.answers.find((answer) => answer.teamId === currentTeam.id && answer.roundNumber === game.currentRoundNumber)
    : undefined
  const activeSong = game && currentTeam
    ? activeAnswer
      ? game.songs.find((song) => song.id === activeAnswer.songId)
      : game.songs.find((song) => song.teamId === currentTeam.id && !game.answers.some((answer) => answer.songId === song.id))
    : undefined
  const answerForResult = game?.answers.at(-1)
  const timelineOrder = game && currentTeam
    ? game.timelineOrders[currentTeam.id] ?? game.songs.filter((song) => song.teamId === currentTeam.id).map((song) => song.id)
    : []
  const timelinePosition = game ? game.teams.findIndex((team) => team.id === currentTeam?.id) + 1 : 0
  const sortedTeams = useMemo(() => game ? [...game.teams].sort((a, b) => (b.guessingScore + b.timelineScore) - (a.guessingScore + a.timelineScore)) : [], [game])

  useEffect(() => {
    if (game?.phase === 'check' && activeAnswer) {
      setCheckerChoices({
        artist: activeAnswer.artistCorrect ?? null,
        title: activeAnswer.titleCorrect ?? null,
      })
    }
  }, [game?.phase, activeAnswer?.id])

  const startSetup = async () => {
    const initial: Game = {
      id: freshId(),
      createdAt: new Date().toISOString(),
      status: 'setup',
      phase: 'setup',
      settings: { ...draftSettings },
      teams: makeTeams(draftSettings.numberOfTeams),
      songs: [],
      answers: [],
      currentTeamIndex: 0,
      currentRoundNumber: 1,
      timelineOrders: {},
    }
    await save(initial)
  }

  const beginMusicSelection = async () => {
    if (!game) return
    if (game.teams.some((team) => !team.player1.trim() || !team.player2.trim())) {
      setError('Add both player names for every team to continue.')
      return
    }
    await save({ ...game, phase: 'music' })
  }

  const startGame = async (demo: boolean) => {
    if (!game) return
    const songsNeeded = game.settings.numberOfTeams * game.settings.songsPerTeam
    const source = demo ? makeDemoSongs(game.teams, game.settings.songsPerTeam) : shuffle(spotifySongPool).slice(0, songsNeeded)
    if (source.length < songsNeeded) {
      setError(`This playlist has ${source.length} usable tracks; ${songsNeeded} are needed. Choose a larger playlist.`)
      return
    }
    const assignedSongs = source.map((song, index) => ({
      ...song,
      id: `${song.id}-${index}`,
      teamId: game.teams[Math.floor(index / game.settings.songsPerTeam)].id,
    }))
    const timelines = Object.fromEntries(game.teams.map((team) => [
      team.id,
      assignedSongs.filter((song) => song.teamId === team.id).map((song) => song.id),
    ]))
    await save({
      ...game,
      status: 'playing',
      phase: 'ready',
      songs: assignedSongs,
      answers: [],
      timelineOrders: timelines,
      currentTeamIndex: 0,
      currentRoundNumber: 1,
      spotifyPlaylistName: demo ? 'Demo tracks' : playlists.find((playlist) => playlist.id === selectedPlaylist)?.name,
    })
  }

  const startListening = async () => {
    if (!game || !activeSong) return
    setSecondsLeft(game.settings.fragmentDuration)
    setIsPlaying(true)
    setHasPlayed(true)
    setError('')
    try {
      if (activeSong.spotifyUri) {
        await playSpotifyFragment(activeSong.spotifyUri, activeSong.fragmentStartMs, game.settings.fragmentDuration)
      }
    } catch (reason) {
      setIsPlaying(false)
      setError(reason instanceof Error ? reason.message : 'Spotify playback could not start.')
      return
    }
    await save({ ...game, phase: 'listen' })
  }

  const lockAnswer = async (artist: string, title: string, year: string) => {
    if (!game || !activeSong || !currentTeam) return
    if (!artist.trim() && !title.trim() && !year.trim()) {
      setError('Enter at least one answer before locking.')
      return
    }
    if (year.trim() && !/^\d{4}$/.test(year.trim())) {
      setError('Enter the year as four digits, or leave it blank.')
      return
    }
    const answer: RoundAnswer = {
      id: freshId(),
      teamId: currentTeam.id,
      songId: activeSong.id,
      roundNumber: game.currentRoundNumber,
      enteredArtist: artist.trim(),
      enteredTitle: title.trim(),
      enteredYear: year ? Number(year) : undefined,
      score: 0,
      completed: false,
    }
    await save({ ...game, phase: 'pass', answerDraft: undefined, answers: [...game.answers, answer] })
  }

  const finishCheck = async () => {
    if (!game || !activeAnswer || !activeSong || !checkingTeam) return
    if (checkerChoices.artist === null || checkerChoices.title === null) {
      setError('Mark both the artist and song title as correct or wrong.')
      return
    }
    const updatedAnswer: RoundAnswer = {
      ...activeAnswer,
      artistCorrect: checkerChoices.artist,
      titleCorrect: checkerChoices.title,
      yearCorrect: isYearCorrect(activeAnswer.enteredYear, activeSong.releaseYear, game.settings.yearTolerance),
      checkedByTeamId: game.teams.length > 1 ? checkingTeam.id : undefined,
      completed: true,
    }
    updatedAnswer.score = scoreAnswer(updatedAnswer)
    const updatedAnswers = game.answers.map((answer) => answer.id === updatedAnswer.id ? updatedAnswer : answer)
    const updatedTeams = game.teams.map((team) => team.id === updatedAnswer.teamId
      ? { ...team, guessingScore: team.guessingScore + updatedAnswer.score }
      : team)
    await save({ ...game, phase: 'roundResult', answers: updatedAnswers, teams: updatedTeams })
  }

  const nextRound = async () => {
    if (!game) return
    if (game.currentTeamIndex + 1 < game.teams.length) {
      await save({ ...game, phase: 'ready', currentTeamIndex: game.currentTeamIndex + 1 })
      return
    }
    if (game.currentRoundNumber < game.settings.songsPerTeam) {
      await save({ ...game, phase: 'ready', currentTeamIndex: 0, currentRoundNumber: game.currentRoundNumber + 1 })
      return
    }
    await save({ ...game, status: 'timeline', phase: 'timeline', currentTeamIndex: 0 })
  }

  const changeTimelineOrder = (event: DragEndEvent) => {
    if (!game || !currentTeam || !event.over || event.active.id === event.over.id) return
    const oldIndex = timelineOrder.indexOf(String(event.active.id))
    const newIndex = timelineOrder.indexOf(String(event.over.id))
    if (oldIndex < 0 || newIndex < 0) return
    const nextOrder = arrayMove(timelineOrder, oldIndex, newIndex)
    void save({ ...game, timelineOrders: { ...game.timelineOrders, [currentTeam.id]: nextOrder } })
  }

  const lockTimeline = async () => {
    if (!game || !currentTeam) return
    const teamSongs = game.songs.filter((song) => song.teamId === currentTeam.id)
    const scored = scoreTimeline(teamSongs, timelineOrder)
    const score = scored.filter((entry) => entry.correctPosition).length
    const updatedTeams = game.teams.map((team) => team.id === currentTeam.id ? { ...team, timelineScore: score } : team)
    if (game.currentTeamIndex + 1 < game.teams.length) {
      await save({ ...game, teams: updatedTeams, phase: 'timelineReveal', currentTeamIndex: game.currentTeamIndex })
    } else {
      await save({ ...game, teams: updatedTeams, status: 'finished', phase: 'finished' })
    }
  }

  const continueTimeline = async () => {
    if (!game || game.currentTeamIndex + 1 >= game.teams.length) return
    await save({ ...game, phase: 'timeline', currentTeamIndex: game.currentTeamIndex + 1 })
  }

  const loadPlaylist = async (playlistId: string) => {
    setSelectedPlaylist(playlistId)
    setSpotifySongPool([])
    if (!playlistId) return
    setLoadingSongs(true)
    try {
      setSpotifySongPool(await getPlaylistSongs(playlistId))
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load tracks from this playlist.')
    } finally {
      setLoadingSongs(false)
    }
  }

  const step = game?.phase === 'listen' || game?.phase === 'answer' || game?.phase === 'pass' || game?.phase === 'check' || game?.phase === 'roundResult'
    ? `ROUND ${game.currentRoundNumber} / ${game.settings.songsPerTeam}`
    : game?.phase === 'timeline' || game?.phase === 'timelineReveal'
      ? `TIMELINE ${timelinePosition} / ${game.teams.length}`
      : undefined

  return (
    <div className="app-shell">
      <AppHeader step={step} onHome={() => { gameRef.current = null; setGame(null); setError('') }} />
      {error && <div className="error-banner" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
      {!game ? (
        <HomeScreen
          canContinue={unfinishedGames.length > 0}
          onStart={() => { setError(''); void startSetup() }}
          onContinue={() => {
            const latestGame = unfinishedGames[0]
            gameRef.current = latestGame
            setGame(latestGame)
            setDraftSettings(latestGame.settings)
            setError('')
          }}
        />
      ) : (
        <main className="game-layout">
          {game.settings.showScoreboard && game.phase !== 'setup' && game.phase !== 'teams' && game.phase !== 'music' && game.phase !== 'ready' && (
            <aside className="game-sidebar">
              <div className="sidebar-heading"><span>GAME BOARD</span><span className="live-dot">LIVE</span></div>
              <Scoreboard teams={sortedTeams} compact />
              <div className="sidebar-game-info"><span>{game.spotifyPlaylistName ?? 'TuneLine game'}</span><small>{game.settings.songsPerTeam} SONGS PER TEAM</small></div>
            </aside>
          )}
          <section className={`game-stage ${game.settings.showScoreboard && !['setup', 'teams', 'music', 'ready'].includes(game.phase) ? '' : 'stage-wide'}`}>
            {game.phase === 'teams' && (
              <PlayersScreen
                teams={game.teams}
                onUpdateTeam={(teamId, changes) => updateGame((current) => ({ ...current, teams: current.teams.map((team) => team.id === teamId ? { ...team, ...changes } : team) }))}
                onBack={() => { gameRef.current = null; setGame(null); setError('') }}
                onNext={() => void beginMusicSelection()}
              />
            )}
            {game.phase === 'music' && (
              <MusicScreen
                game={game}
                connected={spotifyConnected}
                playlists={playlists}
                selectedPlaylist={selectedPlaylist}
                trackCount={spotifySongPool.length}
                loadingPlaylists={loadingPlaylists}
                loadingSongs={loadingSongs}
                configured={spotifyConfigured()}
                configurationHelp={import.meta.env.DEV
                  ? 'Add the Spotify Client ID and redirect URI to .env.local.'
                  : 'Add the Spotify settings as GitHub repository variables and redeploy.'}
                onConnect={() => void connectSpotify().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not connect Spotify.'))}
                onSelectPlaylist={(playlistId) => void loadPlaylist(playlistId)}
                onDemo={() => void startGame(true)}
                onSpotifyStart={() => void startGame(false)}
                onBack={() => updateGame((current) => ({ ...current, phase: 'teams' }))}
              />
            )}
            {game.phase === 'ready' && currentTeam && (
              <ReadyScreen
                team={currentTeam}
                checker={game.teams.length > 1 ? checkingTeam : undefined}
                round={game.currentRoundNumber}
                total={game.settings.songsPerTeam}
                duration={game.settings.fragmentDuration}
                onReady={() => { setSecondsLeft(game.settings.fragmentDuration); setHasPlayed(false); setIsPlaying(false); updateGame((current) => ({ ...current, phase: 'listen' })) }}
              />
            )}
            {game.phase === 'listen' && currentTeam && (
              <ListenScreen
                team={currentTeam}
                checker={game.teams.length > 1 ? checkingTeam : undefined}
                round={game.currentRoundNumber}
                total={game.settings.songsPerTeam}
                duration={game.settings.fragmentDuration}
                secondsLeft={secondsLeft}
                isPlaying={isPlaying}
                hasPlayed={hasPlayed}
                onPlay={() => void startListening()}
                onContinue={() => updateGame((current) => ({ ...current, phase: 'answer' }))}
              />
            )}
            {game.phase === 'answer' && currentTeam && (
              <AnswerScreen
                key={`${currentTeam.id}-${game.currentRoundNumber}`}
                onLock={lockAnswer}
                onDraftChange={(draft) => updateGame((current) => ({ ...current, answerDraft: { teamId: currentTeam.id, roundNumber: game.currentRoundNumber, ...draft } }))}
                draft={game.answerDraft?.teamId === currentTeam.id && game.answerDraft.roundNumber === game.currentRoundNumber ? game.answerDraft : undefined}
                team={currentTeam}
                round={game.currentRoundNumber}
                total={game.settings.songsPerTeam}
              />
            )}
            {game.phase === 'pass' && checkingTeam && (
              <PassToCheckerScreen
                team={game.teams.length > 1 ? checkingTeam : undefined}
                externalChecker={game.teams.length === 1}
                onStart={() => { setCheckerChoices({ artist: null, title: null }); updateGame((current) => ({ ...current, phase: 'check' })) }}
              />
            )}
            {game.phase === 'check' && activeAnswer && activeSong && (
              <CheckAnswersScreen
                answer={activeAnswer}
                song={activeSong}
                round={game.currentRoundNumber}
                tolerance={game.settings.yearTolerance}
                artistChoice={checkerChoices.artist}
                titleChoice={checkerChoices.title}
                onArtistChoice={(value) => { setCheckerChoices((choices) => ({ ...choices, artist: value })); updateGame((current) => ({ ...current, answers: current.answers.map((answer) => answer.id === activeAnswer.id ? { ...answer, artistCorrect: value } : answer) })) }}
                onTitleChoice={(value) => { setCheckerChoices((choices) => ({ ...choices, title: value })); updateGame((current) => ({ ...current, answers: current.answers.map((answer) => answer.id === activeAnswer.id ? { ...answer, titleCorrect: value } : answer) })) }}
                onLock={() => void finishCheck()}
              />
            )}
            {game.phase === 'roundResult' && answerForResult && (
              <RoundResultScreen
                answer={answerForResult}
                playerName={currentTeam?.player1 ?? ''}
                finalRound={game.currentRoundNumber === game.settings.songsPerTeam && game.currentTeamIndex === game.teams.length - 1}
                onNext={() => void nextRound()}
              />
            )}
            {game.phase === 'timeline' && currentTeam && (
              <TimelineScreen
                team={currentTeam}
                roundCount={timelinePosition}
                order={timelineOrder}
                songs={game.songs.filter((song) => song.teamId === currentTeam.id)}
                answers={game.answers}
                onReorder={changeTimelineOrder}
                onLock={() => void lockTimeline()}
              />
            )}
            {game.phase === 'timelineReveal' && currentTeam && (
              <TimelineRevealScreen game={game} team={currentTeam} onContinue={() => void continueTimeline()} />
            )}
            {game.phase === 'finished' && (
              <FinalScoreScreen
                teams={sortedTeams}
                onReview={() => updateGame((current) => ({ ...current, phase: 'review' }))}
                onPlayAgain={() => { gameRef.current = null; setGame(null); setDraftSettings(defaultSettings); setError('') }}
              />
            )}
            {game.phase === 'review' && <GameReviewScreen game={game} onBack={() => updateGame((current) => ({ ...current, phase: 'finished' }))} />}
          </section>
          {game.phase === 'setup' && <GameSetupScreen
            settings={draftSettings}
            onSettingsChange={(settings) => { setDraftSettings(settings); void save({ ...game, settings: { ...settings }, teams: makeTeams(settings.numberOfTeams) }) }}
            onContinue={() => { void save({ ...game, settings: { ...draftSettings }, teams: makeTeams(draftSettings.numberOfTeams), phase: 'teams' }) }}
            onCancel={() => { gameRef.current = null; setGame(null); setError('') }}
          />}
        </main>
      )}
    </div>
  )
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Game, GameSettings, RoundAnswer, Song, Team } from './models/gameTypes'
import {
  isYearCorrect, makeDemoSongs, scoreAnswer, teamColors,
} from './store/gameStore'
import { db } from './services/database'
import { completeSpotifyAuth, connectSpotify, getSpotifyToken, spotifyConfigured } from './services/spotifyAuth'
import { getPlaylistSongs, getPlaylists, type SpotifyPlaylist } from './services/spotifyApi'
import { initializeSpotifyPlayer, pauseSpotify, playSpotifyFragment } from './services/spotifyPlayer'
import AppHeader from './components/AppHeader'
import LiveTimeline from './components/LiveTimeline'
import Scoreboard from './components/Scoreboard'
import HomeScreen from './screens/HomeScreen'
import GameSetupScreen from './screens/GameSetupScreen'
import PlayersScreen from './screens/PlayersScreen'
import MusicScreen from './screens/MusicScreen'
import ReadyScreen from './screens/ReadyScreen'
import ListenScreen from './screens/ListenScreen'
import AnswerScreen from './screens/AnswerScreen'
import CheckAnswersScreen from './screens/CheckAnswersScreen'
import FinalScoreScreen from './screens/FinalScoreScreen'
import GameReviewScreen from './screens/GameReviewScreen'

const defaultSettings: GameSettings = {
  numberOfTeams: 2,
  songsPerTeam: 10,
  fragmentDuration: 20,
  yearTolerance: 0,
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
  const [playbackNotice, setPlaybackNotice] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(20)
  const [answerChoices, setAnswerChoices] = useState<{ artist: boolean | null; title: boolean | null }>({ artist: null, title: null })
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
    void initializeSpotifyPlayer()
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Spotify player could not be initialized.'))
    void getPlaylists()
      .then(setPlaylists)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load Spotify playlists.'))
      .finally(() => setLoadingPlaylists(false))
  }, [game?.phase, spotifyConnected])

  const currentTeam = game?.teams[game.currentTeamIndex]
  const activeAnswer = game && currentTeam
    ? game.answers.find((answer) => answer.teamId === currentTeam.id && answer.roundNumber === game.currentRoundNumber)
    : undefined
  const activeSong = game && currentTeam
    ? activeAnswer
      ? game.songs.find((song) => song.id === activeAnswer.songId)
      : game.songs.find((song) => song.teamId === currentTeam.id && !game.answers.some((answer) => answer.songId === song.id))
    : undefined
  const sortedTeams = useMemo(() => game ? [...game.teams].sort((a, b) => (b.guessingScore + b.timelineScore) - (a.guessingScore + a.timelineScore)) : [], [game])

  useEffect(() => {
    if (game?.phase === 'check' && activeAnswer) {
      setAnswerChoices({
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
    await save({
      ...game,
      status: 'playing',
      phase: 'ready',
      songs: assignedSongs,
      answers: [],
      currentTeamIndex: 0,
      currentRoundNumber: 1,
      spotifyPlaylistName: demo ? 'Demo tracks' : playlists.find((playlist) => playlist.id === selectedPlaylist)?.name,
    })
  }

  const startListening = async () => {
    if (!game || !activeSong) return
    setSecondsLeft(game.settings.fragmentDuration)
    setPlaybackNotice('')
    setError('')
    try {
      if (activeSong.spotifyUri) {
        const route = await playSpotifyFragment(activeSong.spotifyUri, activeSong.fragmentStartMs)
        setPlaybackNotice(route.kind === 'connect'
          ? `Playing on Spotify Connect: ${route.deviceName}`
          : 'No Spotify Connect device found. Playing in the TuneLine browser.')
      }
      setIsPlaying(true)
      setHasPlayed(true)
    } catch (reason) {
      setIsPlaying(false)
      setHasPlayed(false)
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
      enteredYear: year.trim() ? Number(year.trim()) : undefined,
      score: 0,
      completed: false,
    }
    setAnswerChoices({ artist: null, title: null })
    await save({ ...game, phase: 'check', answerDraft: undefined, answers: [...game.answers, answer] })
  }

  const finishCheck = async () => {
    if (!game || !activeAnswer || !activeSong || !currentTeam) return
    if (activeAnswer.completed) return
    if (answerChoices.artist === null || answerChoices.title === null) {
      setError('Mark both the artist and song title as correct or wrong.')
      return
    }
    const updatedAnswer: RoundAnswer = {
      ...activeAnswer,
      artistCorrect: answerChoices.artist,
      titleCorrect: answerChoices.title,
      yearCorrect: isYearCorrect(activeAnswer.enteredYear, activeSong.releaseYear, game.settings.yearTolerance),
      completed: true,
    }
    updatedAnswer.score = scoreAnswer(updatedAnswer)
    const updatedAnswers = game.answers.map((answer) => answer.id === updatedAnswer.id ? updatedAnswer : answer)
    const updatedTeams = game.teams.map((team) => team.id === updatedAnswer.teamId
      ? {
          ...team,
          guessingScore: team.guessingScore + updatedAnswer.score,
          timelineScore: team.timelineScore + Number(updatedAnswer.yearCorrect),
        }
      : team)
    await save({ ...game, answers: updatedAnswers, teams: updatedTeams })
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
    await save({ ...game, status: 'finished', phase: 'finished' })
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

  const step = game?.phase === 'listen' || game?.phase === 'answer' || game?.phase === 'check'
    ? `ROUND ${game.currentRoundNumber} / ${game.settings.songsPerTeam}`
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
            const resumeGame: Game = latestGame.phase === 'timeline' || latestGame.phase === 'timelineReveal' || latestGame.status === 'timeline'
              ? { ...latestGame, status: 'finished', phase: 'finished' }
              : latestGame.phase === 'pass'
                ? { ...latestGame, phase: 'check' }
                : latestGame.phase === 'roundResult'
                  ? { ...latestGame, phase: 'check' }
                : latestGame
            gameRef.current = resumeGame
            setGame(resumeGame)
            setDraftSettings(resumeGame.settings)
            setError('')
          }}
        />
      ) : (
        <main className="game-layout">
          {game.status === 'playing' && (
            <aside className="game-sidebar">
              <div className="sidebar-heading"><span>GAME BOARD</span><span className="live-dot">LIVE</span></div>
              <Scoreboard teams={sortedTeams} compact />
              <div className="sidebar-game-info"><span>{game.spotifyPlaylistName ?? 'TuneLine game'}</span><small>{game.settings.songsPerTeam} SONGS PER TEAM</small></div>
            </aside>
          )}
          <section className={`game-stage ${game.status === 'playing' ? 'game-stage-playing' : 'stage-wide'}`}>
            <div className="game-stage-main">
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
                round={game.currentRoundNumber}
                total={game.settings.songsPerTeam}
                duration={game.settings.fragmentDuration}
                onReady={() => { setSecondsLeft(game.settings.fragmentDuration); setHasPlayed(false); setIsPlaying(false); setPlaybackNotice(''); updateGame((current) => ({ ...current, phase: 'listen' })) }}
              />
            )}
            {game.phase === 'listen' && currentTeam && (
              <ListenScreen
                team={currentTeam}
                round={game.currentRoundNumber}
                total={game.settings.songsPerTeam}
                duration={game.settings.fragmentDuration}
                secondsLeft={secondsLeft}
                isPlaying={isPlaying}
                hasPlayed={hasPlayed}
                playbackNotice={playbackNotice}
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
            {game.phase === 'check' && activeAnswer && activeSong && currentTeam && (
              <CheckAnswersScreen
                answer={activeAnswer}
                song={activeSong}
                team={currentTeam}
                round={game.currentRoundNumber}
                tolerance={game.settings.yearTolerance}
                nextLabel={game.currentRoundNumber === game.settings.songsPerTeam && game.currentTeamIndex === game.teams.length - 1
                  ? 'GAME OVER'
                  : game.currentTeamIndex + 1 < game.teams.length ? 'NEXT TEAM' : 'NEXT ROUND'}
                artistChoice={answerChoices.artist}
                titleChoice={answerChoices.title}
                onArtistChoice={(value) => { setAnswerChoices((choices) => ({ ...choices, artist: value })); updateGame((current) => ({ ...current, answers: current.answers.map((answer) => answer.id === activeAnswer.id ? { ...answer, artistCorrect: value } : answer) })) }}
                onTitleChoice={(value) => { setAnswerChoices((choices) => ({ ...choices, title: value })); updateGame((current) => ({ ...current, answers: current.answers.map((answer) => answer.id === activeAnswer.id ? { ...answer, titleCorrect: value } : answer) })) }}
                onLock={() => void finishCheck()}
                onNext={() => void nextRound()}
              />
            )}
            {game.phase === 'finished' && (
              <FinalScoreScreen
                teams={sortedTeams}
                songsPerTeam={game.settings.songsPerTeam}
                onReview={() => updateGame((current) => ({ ...current, phase: 'review' }))}
                onPlayAgain={() => { gameRef.current = null; setGame(null); setDraftSettings(defaultSettings); setError('') }}
              />
            )}
            {game.phase === 'review' && <GameReviewScreen game={game} onBack={() => updateGame((current) => ({ ...current, phase: 'finished' }))} />}
            </div>
            {game.status === 'playing' && ['ready', 'listen', 'answer', 'check'].includes(game.phase) && (
              <LiveTimeline songs={game.songs} answers={game.answers} teams={game.teams} />
            )}
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

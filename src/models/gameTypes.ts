export type YearTolerance = 0 | 1 | 2 | 3
export type FragmentDuration = 10 | 20 | 30 | 40 | 50
export type GamePhase =
  | 'setup'
  | 'teams'
  | 'music'
  | 'ready'
  | 'listen'
  | 'answer'
  | 'pass'
  | 'check'
  | 'roundResult'
  | 'timeline'
  | 'timelineReveal'
  | 'finished'
  | 'review'

export interface Team {
  id: string
  color: string
  player1: string
  player2: string
  guessingScore: number
  timelineScore: number
}

export interface Song {
  id: string
  spotifyUri?: string
  artist: string
  title: string
  releaseYear: number
  fragmentStartMs: number
  teamId?: string
}

export interface RoundAnswer {
  id: string
  teamId: string
  songId: string
  roundNumber: number
  enteredArtist: string
  enteredTitle: string
  enteredYear?: number
  artistCorrect?: boolean
  titleCorrect?: boolean
  yearCorrect?: boolean
  score: number
  checkedByTeamId?: string
  completed: boolean
}

export interface GameSettings {
  numberOfTeams: number
  songsPerTeam: number
  fragmentDuration: FragmentDuration
  yearTolerance: YearTolerance
}

export interface Game {
  id: string
  createdAt: string
  status: 'setup' | 'playing' | 'timeline' | 'finished'
  phase: GamePhase
  settings: GameSettings
  teams: Team[]
  songs: Song[]
  answers: RoundAnswer[]
  currentTeamIndex: number
  currentRoundNumber: number
  answerDraft?: {
    teamId: string
    roundNumber: number
    artist: string
    title: string
    year: string
  }
  spotifyPlaylistName?: string
}

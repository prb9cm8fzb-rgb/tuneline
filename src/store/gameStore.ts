import type { RoundAnswer, Song, Team, YearTolerance } from '../models/gameTypes'

export const teamColors = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
]

export const demoSongs: Song[] = [
  { id: 'demo-1', artist: 'Queen', title: 'Radio Ga Ga', releaseYear: 1984, fragmentStartMs: 40000 },
  { id: 'demo-2', artist: 'Madonna', title: 'Like a Prayer', releaseYear: 1989, fragmentStartMs: 35000 },
  { id: 'demo-3', artist: 'a-ha', title: 'Take On Me', releaseYear: 1985, fragmentStartMs: 42000 },
  { id: 'demo-4', artist: 'Michael Jackson', title: 'Billie Jean', releaseYear: 1983, fragmentStartMs: 51000 },
  { id: 'demo-5', artist: 'Whitney Houston', title: 'I Wanna Dance with Somebody', releaseYear: 1987, fragmentStartMs: 30000 },
  { id: 'demo-6', artist: 'Tears for Fears', title: 'Everybody Wants to Rule the World', releaseYear: 1985, fragmentStartMs: 46000 },
  { id: 'demo-7', artist: 'The Weeknd', title: 'Blinding Lights', releaseYear: 2019, fragmentStartMs: 58000 },
  { id: 'demo-8', artist: 'ABBA', title: 'Gimme! Gimme! Gimme!', releaseYear: 1979, fragmentStartMs: 39000 },
  { id: 'demo-9', artist: 'Fleetwood Mac', title: 'Dreams', releaseYear: 1977, fragmentStartMs: 25000 },
  { id: 'demo-10', artist: 'Outkast', title: 'Hey Ya!', releaseYear: 2003, fragmentStartMs: 32000 },
]

export const makeDemoSongs = (teams: Team[], songsPerTeam: number): Song[] =>
  teams.flatMap((team, teamIndex) =>
    Array.from({ length: songsPerTeam }, (_, roundIndex) => {
      const sample = demoSongs[(roundIndex + teamIndex * 3) % demoSongs.length]
      return { ...sample, id: `${sample.id}-${team.id}`, teamId: team.id }
    }),
  )

export const isYearCorrect = (
  enteredYear: number | undefined,
  actualYear: number,
  tolerance: YearTolerance,
) => enteredYear !== undefined && Math.abs(enteredYear - actualYear) <= tolerance

export const normalizeAnswer = (value: string) =>
  value.trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ')

export const scoreAnswer = (answer: RoundAnswer) =>
  Number(answer.artistCorrect) + Number(answer.titleCorrect) + Number(answer.yearCorrect)

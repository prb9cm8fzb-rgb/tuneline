import Dexie, { type Table } from 'dexie'
import type { Game } from '../models/gameTypes'

class TuneLineDatabase extends Dexie {
  games!: Table<Game, string>

  constructor() {
    super('TuneLineDatabase')
    this.version(1).stores({ games: 'id, createdAt, status' })
  }
}

export const db = new TuneLineDatabase()

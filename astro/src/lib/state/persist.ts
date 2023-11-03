import type { Art, SessionInfo } from '../../db/account'

export type PersistenceState = (
  | {
      kind: 'IN_MEMORY'
      showInitialWarning: boolean
    }
  | {
      kind: 'PERSISTED'
      cloudSaveState: 'SAVED' | 'SAVING' | 'ERROR'
      art: 'LOADING' | Art
      tutorial?: string[] | undefined
      tutorialIndex?: number | undefined
    }
  | {
      kind: 'SHARED'
      name: string
      authorName: string
      code: string
      tutorial?: string[] | undefined
      tutorialName?: string | undefined
      tutorialIndex?: number | undefined
    }
) & {
  session: SessionInfo | null
  stale: boolean
}
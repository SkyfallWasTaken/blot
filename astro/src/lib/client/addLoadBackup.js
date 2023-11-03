import { useOnEditorChange } from '../events'
import { getStore } from '../state/state'
import defaultProgram from '../examples/defaultProgram'

export function addLoadBackup() {
  const { view } = getStore()

  const backupString = localStorage.getItem('cache')

  const changes = {
    from: 0,
    to: view.state.doc.toString().length,
    insert: backupString ?? defaultProgram
  }

  view.dispatch({ changes })

  useOnEditorChange(backup)
}

export function backup() {
  const { view } = getStore()

  const code = view.state.doc.toString()
  localStorage.setItem('cache', code)
}
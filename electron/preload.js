import { contextBridge } from 'electron'
import Store from 'electron-store'

// A single persistent store for user preferences
const store = new Store({ name: 'prefs' })

contextBridge.exposeInMainWorld('prefs', {
  get: (key) => {
    try { return store.get(key) } catch { return undefined }
  },
  set: (key, value) => {
    try { store.set(key, value); return true } catch { return false }
  },
})


import { app, BrowserWindow } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isDev = !app.isPackaged

let backendProc = null

function startBackendIfNeeded() {
  if (isDev) return
  if (backendProc) return
  try {
    const resourcesPath = process.resourcesPath // .../resources
    const modelsPath = path.join(resourcesPath, 'models', 'vosk-model-small-en-us-0.15')
    // Backend EXE is copied to resources/backend/backend-server.exe by extraResources
    const exePath = path.join(resourcesPath, 'backend', process.platform === 'win32' ? 'backend-server.exe' : 'backend-server')

    backendProc = spawn(exePath, [], {
      env: {
        ...process.env,
        VOSK_MODEL_PATH: modelsPath,
      },
      stdio: 'ignore',
      windowsHide: true,
      detached: false,
    })

    backendProc.on('exit', () => {
      backendProc = null
    })
  } catch (e) {
    // Fail silently; 前端在使用时会提示服务不可用
  }
}

function stopBackendIfNeeded() {
  try {
    if (backendProc && !backendProc.killed) {
      backendProc.kill()
    }
  } catch {}
  backendProc = null
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false, // allow file:// fetch for local assets like samples/manifest.json
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    startBackendIfNeeded()
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  stopBackendIfNeeded()
})

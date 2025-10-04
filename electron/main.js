import { app, BrowserWindow } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn, execFileSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isDev = !app.isPackaged

let backendProc = null
let backendStopTimer = null

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

function killProcessTreeWindowsSync(pid) {
  try {
    execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true })
  } catch {}
}

function killByImageWindowsSync(imageName) {
  try {
    execFileSync('taskkill', ['/IM', imageName, '/T', '/F'], { stdio: 'ignore', windowsHide: true })
  } catch {}
}

function stopBackendIfNeeded() {
  try {
    if (process.platform === 'win32') {
      // Primary: kill tracked PID process tree if available
      if (backendProc && !backendProc.killed) {
        killProcessTreeWindowsSync(backendProc.pid)
      }
      // Safety: also kill by image name to catch PyInstaller onefile child process
      killByImageWindowsSync('backend-server.exe')
    } else {
      if (backendProc) {
        // Try graceful
        backendProc.kill('SIGTERM')
        // Fallback hard kill if it doesn't exit quickly
        if (backendStopTimer) clearTimeout(backendStopTimer)
        backendStopTimer = setTimeout(() => {
          try { backendProc && backendProc.kill('SIGKILL') } catch {}
        }, 3000)
      }
    }
  } catch {}
  // Do not null immediately; keep reference until 'exit' to avoid race
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

// Ensure backend is stopped in all quit paths
app.on('before-quit', () => {
  stopBackendIfNeeded()
})
app.on('will-quit', () => {
  stopBackendIfNeeded()
})
app.on('quit', () => {
  stopBackendIfNeeded()
})

// Extra safety: Node/Electron process signals
process.on('exit', () => {
  stopBackendIfNeeded()
})
process.on('SIGINT', () => {
  stopBackendIfNeeded()
  process.exit(0)
})
process.on('SIGTERM', () => {
  stopBackendIfNeeded()
  process.exit(0)
})

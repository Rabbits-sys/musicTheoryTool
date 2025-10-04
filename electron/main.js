import { app, BrowserWindow, Menu, shell, dialog } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn, execFileSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isDev = !app.isPackaged
const isMac = process.platform === 'darwin'

// Define application menu (including Help)
function setupAppMenu() {
  const template = [
    // macOS app menu
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),

    // File menu
    {
      label: 'File',
      submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
    },

    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' },
      ],
    },

    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    // Window menu
    {
      label: 'Window',
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'close' },
      ],
    },
    // Help menu
    {
      role: 'help',
      label: 'Help',
      submenu: [
        {
          label: '关于本程序',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: '关于',
              message: '乐理练习工具',
              detail:
                '本项目由「浮力声乐」开发，旨在提供简洁高效的乐理/视唱练耳练习工具。\nGitHub 页面：https://github.com/Rabbits-sys/musicTheoryTool',
            })
          },
        },
        { type: 'separator' },
        {
          label: '项目 wiki',
          click: async () => {
            try {
              await shell.openExternal('https://github.com/Rabbits-sys/musicTheoryTool')
            } catch {}
          },
        },
        { type: 'separator' },
        { label: '项目归属：浮力声乐', enabled: false },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

let backendProc = null
let backendStopTimer = null

function getIconPath() {
  try {
    if (isDev) {
      return path.join(__dirname, '..', 'logo.ico')
    }
    return path.join(process.resourcesPath, 'logo.ico')
  } catch {
    return undefined
  }
}

// Set AppUserModelID for Windows taskbar icon consistency
if (process.platform === 'win32') {
  try { app.setAppUserModelId('com.example.musictheorytool') } catch {}
}

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
    icon: getIconPath(),
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
  setupAppMenu()
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

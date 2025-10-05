# Music Theory Tool · 乐理练习桌面应用

离线、跨平台的乐理练习应用：前端 Electron + React + Vite，后端 FastAPI + Vosk（离线语音识别）。

- 功能：唱名识别（do/re/mi…）、半音/全音等音、自然大调、虚拟钢琴（采样）、节拍器
- 前端：React 18 + Vite 5 + MUI 6
- 桌面：Electron 33（预加载提供持久化存储）
- 后端：FastAPI + Uvicorn + Vosk 小模型（完全离线）

---

目录
- 1. 目录结构
- 2. 环境准备
- 3. 开发与调试
- 4. 后端打包为 Windows 可执行文件（PyInstaller）
- 5. Electron 应用打包（含后端 EXE 与模型）
- 6. 运行时行为与端口/模型路径
- 7. 功能速览与接口
- 8. 常见问题（含“后端随 Electron 退出”修复）
- 9. 许可证

---

## 1. 目录结构

- `electron/`
  - `main.js` Electron 主进程（生产环境自动启动/关闭后端 EXE）
  - `preload.js` 预加载（`electron-store` 持久化）
- `src/` React 前端源码
  - `pages/` Piano / Interval / Major / Metronome 页面
  - `components/` 练习组件、键盘、波形等
  - `asr/` WebSocket 客户端（与后端交互）
  - `audio/` 麦克风采集、重采样、Sampler 引擎
  - `store/` Zustand 全局状态
- `backend/` FastAPI + Vosk 后端
  - `main.py` 暴露 `/health` 与 `/ws`
  - `run_server.py` Uvicorn 启动入口（用于打包）
  - `requirements.txt` 后端依赖
- `models/` Vosk 英文小模型 `vosk-model-small-en-us-0.15/`（可替换）
- `samples/` 虚拟钢琴采样与 `manifest.json`（由 Vite 复制到构建产物）
- `build/`（打包资源与 PyInstaller 中间产物）
- `release/` 最终安装包与解包文件（`electron-builder` 产出）
- `vite.config.js` Vite 配置（复制 samples/）
- `package.json` 脚本与 electron-builder 配置

## 2. 环境准备

- Node.js ≥ 18（推荐 20+）
- Python 3.9–3.11（用于后端与 PyInstaller 打包）
- Windows 10/11（本文以 cmd.exe 命令为例）

首次安装依赖：

```bat
cd /d D:\Workplace\JavaScriptProject\musicTheoryTool

:: Python 依赖（后端开发/打包用）
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt

:: Node 依赖（前端/Electron）
npm install
```

## 3. 开发与调试

并行启动（后端 + Vite + Electron）：

```bat
npm run dev
```

或分开启动：

```bat
:: 后端（FastAPI + Uvicorn，127.0.0.1:8000）
npm run dev:backend

:: 前端（Vite，http://127.0.0.1:5173）
npm run dev:renderer

:: Electron 主进程（开发模式下不自动拉起后端）
npm run dev:electron
```

健康检查：

```bat
curl http://127.0.0.1:8000/health
```

返回 `{ "status": "ok" }` 表示后端与模型加载正常。

## 4. 后端打包为 Windows 可执行文件（PyInstaller）

项目已内置 PyInstaller 配置与脚本：

- 入口：`backend/run_server.py`（直接 `uvicorn.run(app)`）
- 规格文件（可选）：`backend-server.spec`
- NPM 脚本：`npm run build:backend`

步骤：

```bat
:: 首次需要安装 PyInstaller（如未安装）
python -m pip install pyinstaller

:: 生成后端可执行文件（默认输出到 backend\dist\backend-server.exe）
npm run build:backend
```

脚本等效命令：

```
pyinstaller --noconfirm --onefile --noconsole --name backend-server --clean --collect-all vosk --distpath backend\dist backend\run_server.py
```

说明：
- `--collect-all vosk` 自动包含 Vosk 的运行时资源；
- 生成单文件 EXE（`backend-server.exe`），无控制台窗口；
- 运行时通过环境变量 `VOSK_MODEL_PATH` 指定模型目录（由 Electron 主进程在生产环境自动设置，详见第 6 节）。

## 5. Electron 应用打包（含后端 EXE 与模型）

项目已配置 electron-builder（NSIS 安装包）：

```bat
:: 构建前端静态资源（Vite，会把 samples/ 复制进 dist/）
npm run build:renderer

:: 构建后端 EXE
npm run build:backend

:: 打包 Electron 应用（或直接 npm run build 一键完成三步）
npx electron-builder
```

关键 `package.json` 片段（已就绪）：
- scripts
  - `build`：`build:renderer && build:backend && electron-builder`
  - `build:backend`：PyInstaller 打包后端
- build.files：`dist/**`, `electron/**`, `backend/**`, `models/**`, `package.json`
- build.extraResources：
  - `models/` → `resources/models`
  - `backend/dist/` → `resources/backend`（包含 `backend-server.exe`）

打包产物输出至 `release/`，安装包名形如 `music-theory-tool-<version>-Setup.exe`。

## 6. 运行时行为与端口/模型路径

- 生产环境（安装包运行）：
  - Electron 主进程会在应用启动时从 `resources/backend/backend-server.exe` 启动后端；
  - 自动设置环境变量 `VOSK_MODEL_PATH` 指向 `resources/models/vosk-model-small-en-us-0.15`；
  - 前端通过 `ws://127.0.0.1:8000/ws` 与后端通信；
  - 应用退出时，主进程会强制终止后端进程树（Windows 使用 `taskkill /T /F`），确保后端不残留。
- 开发环境：
  - 不自动启动后端；使用 `npm run dev:backend` 启动本地 Uvicorn；
  - 前端走 `http://127.0.0.1:5173`，与后端同样通过 `127.0.0.1:8000` 通信。

如需替换/移动模型目录，可自行设置环境变量（一般无需修改）：

```bat
set VOSK_MODEL_PATH=D:\path\to\vosk-model-small-en-us-0.15
```

## 7. 功能速览与接口

- 唱名识别练习：按节拍显示 1–7，分段采集麦克风，后端返回每段的识别结果与置信度；
- 半音/全音练习：给定音名，填写其升/降的半音与全音等音；
- 自然大调练习：根据起始音填写完整自然大调音阶；
- 虚拟钢琴：基于 `samples/manifest.json` 加载采样，支持多个八度与键盘按键；
- 节拍器：可调 BPM 与节拍数，支持强/弱/次强分拍提示。

后端接口：
- HTTP: `GET /health` 健康检查
- WebSocket: `ws://127.0.0.1:8000/ws`
  - `config` 设置采样率；`start_segment`/`end_segment` 控制分段；返回 `segment_result`、`session_results` 等

## 8. 常见问题（含“后端随 Electron 退出”修复）

- 后端没有随 Electron 退出而退出？
  - 已修复：`electron/main.js` 在应用退出路径上统一调用 `taskkill /T /F`（Windows）或 `SIGTERM`→`SIGKILL`（其他平台），确保 Uvicorn/Vosk 进程树被清理；
  - 覆盖 `before-quit`、`will-quit`、`quit`、`process.on('exit'|SIGINT|SIGTERM')` 等钩子，避免边缘情况残留。
- 后端启动失败或 `/health` 报错：
  - 确认 `models/vosk-model-small-en-us-0.15` 存在且可读；如更换模型目录，设置 `VOSK_MODEL_PATH`；
  - 确保已安装 `backend/requirements.txt` 中的依赖。
- 无法录音/无声音：
  - 检查系统麦克风权限（Windows 设置 → 隐私与安全 → 麦克风）。
- 采样未加载：
  - `samples/manifest.json` 是否有效；文件名/大小写是否匹配；构建后置于 `dist/samples/`（由 Vite 自动复制）。

## 9. 许可证

MIT（见 `LICENSE`）。

## 10. 致谢

- Vosk：https://alphacephei.com/vosk/
- FastAPI：https://fastapi.tiangolo.com/
- Electron：https://www.electronjs.org/
- React：https://react.dev/
- Vite：https://vitejs.dev/
- MUI：https://mui.com/
- Zustand：https://zustand.surge.sh/
- PyInstaller：https://www.pyinstaller.org/
- electron-builder：https://www.electron.build/
- github 开源项目（Semitone-Or-Wholetone）：https://github.com/LucyConan/Semitone-Or-Wholetone
- github 开源项目（tonejs-instruments）：https://github.com/nbrosowsky/tonejs-instruments
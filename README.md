# Music Theory Tool · 乐理练习桌面应用

简洁、离线、跨平台的乐理练习应用。前端 Electron + React + Vite，后端 FastAPI + Vosk（离线语音识别）。

- 功能模块（Feature 完整分层）：
  - 唱名识别练习（do/re/mi…）features/syllable
  - 半音/全音等音练习 features/interval
  - 自然大调音阶练习 features/major
  - 虚拟钢琴（采样 + 频谱）features/piano
  - 节拍器 pages/MetronomePage
- 前端：React 18 + Vite 5 + MUI 6
- 桌面：Electron 33
- 后端：FastAPI + Uvicorn + Vosk 小模型（完全离线）

---

## 目录结构（2025-10 起）

```text
.
├─ frontend/                # React 源码（原 src/ 已重命名）
│  ├─ App.jsx
│  ├─ main.jsx             # Vite 入口
│  ├─ pages/               # 页面（Syllable/Interval/Major/Piano/Metronome）
│  ├─ features/            # 业务功能模块
│  │  ├─ syllable/         # 唱名练习（Difficulty/Runner/Results）
│  │  ├─ interval/         # 半音/全音等音
│  │  ├─ major/            # 自然大调
│  │  └─ piano/            # 虚拟钢琴（PianoKeyboardGroup / PianoWavefromCanvas）
│  ├─ store/               # Zustand stores
│  ├─ utils/               # 工具（solfege/enharmonic/time）
│  ├─ audio/               # mic/pianoEngine/pcm-processor（Worklet）
│  └─ asr/                 # wsClient（与后端 WebSocket 交互）
├─ electron/
│  └─ main.js              # 主进程（生产启动后端 EXE；处理关闭）
├─ backend/
│  ├─ main.py              # FastAPI + Vosk（/ws + /health）
│  ├─ run_server.py        # Uvicorn 启动入口（PyInstaller 打包）
│  └─ requirements.txt
├─ resources/              # 运行/打包资源（替代旧 models/、samples/、logo.ico）
│  ├─ models/
│  │  └─ vosk-model-small-en-us-0.15/
│  ├─ samples/             # 钢琴采样与 manifest.json
│  └─ logo.ico             # 应用图标
├─ index.html              # Vite HTML（入口指向 /frontend/main.jsx）
├─ vite.config.js          # 复制 resources/samples → dist/samples
├─ package.json            # 脚本与 electron-builder 配置
└─ README.md
```

> 重要变化：
> - 原 `src/` 已重命名为 `frontend/`。
> - `models/`、`samples/`、`logo.ico` 已迁移至 `resources/` 下。
> - Electron 预加载改为 `electron/preload.cjs`（CommonJS），避免打包后 ESM preload 加载失败。

---

## 快速开始（Windows）

依赖：Node.js ≥ 18（建议 20+）、Python 3.9–3.11、Git。

```bat
cd /d D:\Workplace\JavaScriptProject\musicTheoryTool

:: 安装后端依赖
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt

:: 安装前端/桌面依赖
npm install

:: 开发并行启动（后端 + Vite + Electron）
npm run dev
```

- 开发地址：Vite http://127.0.0.1:5173
- 后端地址：FastAPI ws://127.0.0.1:8000/ws；健康检查 http://127.0.0.1:8000/health
- 首次运行请允许麦克风权限（用于唱名识别练习）。

---

## 构建与打包

```bat
:: 1) 构建前端（Vite，会将 resources/samples 复制到 dist/samples/）
npm run build:renderer

:: 2) 构建后端 EXE（PyInstaller，输出 backend\dist\backend-server.exe）
npm run build:backend

:: 3) 打包 Electron 应用（含后端 EXE 与模型/图标等资源）
npx electron-builder
```

- 打包产物：`release/` 下生成安装包与便携目录 `win-unpacked/`。
- Electron 在生产环境会从 `resources/backend/backend-server.exe` 启动后端，并设置 `VOSK_MODEL_PATH` 指向 `resources/models/vosk-model-small-en-us-0.15`。

---

## 资源放置与路径约定

- Vosk 模型（默认英文小模型）
  - 开发默认路径：`resources/models/vosk-model-small-en-us-0.15`
  - 可通过环境变量覆盖：`VOSK_MODEL_PATH=<绝对或相对路径>`
- 采样（虚拟钢琴）
  - 放置于 `resources/samples/`，Vite 构建时复制到 `dist/samples/`
  - 前端按 `/samples/manifest.json` 读取
- 图标
  - `resources/logo.ico`（打包配置会复制到应用资源根）
---

## 前端功能说明（简）

- 唱名识别（Syllable）
  - 选择难度 → 按节拍显示 1–7 数字 → 对应唱名（1=do, 2=re…）→ 逐题判定与正确率
  - WebSocket 持续分段识别；麦克风采样 16kHz；结果含 `word` 与 `confidence`
- 半音/全音等音（Interval）
  - 给定音名（Helmholtz 标记），填写升/降 半音/全音的所有等音（空格分隔）
- 自然大调（Major）
  - 给定起始音（示例：1=C、1=#C、1=bD），填写完整自然大调音阶（顺序严格匹配）
- 虚拟钢琴（Piano）
  - 三组八度可选，键盘绑定 + 频谱（PianoWavefromCanvas）
- 节拍器（Metronome）
  - 可调 BPM（20–240）、拍数（2–8）、强/弱/次强模式

---

## 技术要点

- 功能分层
  - `frontend/features/*`：每个功能包含 Difficulty/Runner/Results（或等价组件）
  - `frontend/store/*`：每个功能独立 Zustand store，命名规范统一（selectedDifficultyKey / questionSequence / attemptResults 等）
- 语音识别（ASR）
  - 前端：`asr/wsClient.js` 以分段方式推送 PCM16；后端按 grammar 返回单词与置信度
  - 后端：`backend/main.py` 提供 `/ws`；可通过 `/health` 检查模型是否可用
- 虚拟钢琴
  - `audio/pianoEngine.js` 基于 Tone.js Sampler；频谱渲染使用 WebAudio AnalyserNode
---

## 常见问题（Troubleshooting）

1) /health 报错或识别无结果
- 检查 `resources/models/vosk-model-small-en-us-0.15` 是否存在且完整
- 若移动了模型路径，设置 `VOSK_MODEL_PATH` 环境变量

2) 无法录音/无声/识别失败
- 系统麦克风权限未开启；或未授权浏览器/Electron 应用使用麦克风

3) 采样未加载
- `resources/samples/manifest.json` 是否有效；构建后应存在 `dist/samples/manifest.json`

---

## 环境变量

- BACKEND_HOST / BACKEND_PORT：后端监听地址（默认 127.0.0.1:8000）
- VOSK_MODEL_PATH：Vosk 模型目录（开发默认取 `resources/models/...`；生产由 Electron 设置）

---

## 构建脚本（package.json 摘要）

- `npm run dev`：并行启动后端（Uvicorn）+ 前端（Vite）+ Electron
- `npm run build:renderer`：Vite 构建静态资源（复制 samples）
- `npm run build:backend`：PyInstaller 打包后端 EXE
- `npm run build`：renderer + backend + electron-builder 一键打包

---

## License

MIT（见 `LICENSE`）。

## Acknowledgements
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
# 乐理练习工具（唱名识别 · 半音/全音 · 自然大调 · 虚拟钢琴 · 节拍器）

离线、跨平台的乐理练习应用：前端 Electron + React + MUI，后端 FastAPI + Vosk。支持唱名识别（do/re/mi...）、半音/全音等音等、自然大调音阶填写、虚拟钢琴（采样）、节拍器（自定义强弱拍）。

- 前端：React 18 + Vite 5 + MUI 6
- 桌面：Electron 33（预加载提供持久化存储 prefs）
- 音频/乐器：Tone.js（Sampler 采样、合成器、节拍器）
- 语音识别：Vosk 小模型（完全离线），通过 WebSocket 与前端交互

内置 Vosk 英文小模型位于 `models/vosk-model-small-en-us-0.15/`（可通过环境变量覆盖路径）。

---

目录
- 功能概览
- 环境准备
- 快速开始（Windows cmd）
- 运行与调试（分进程）
- 健康检查
- 使用说明（各功能页）
- 语音识别与麦克风说明
- 虚拟钢琴采样与 manifest 说明
- 设置持久化
- 构建与打包
- 关键目录结构
- 常见问题
- 许可证

---

## 功能概览
- 唱名识别练习：按节拍显示 1–7，分段采集麦克风并离线识别是否唱对对应唱名（do/re/mi/fa/so/sol/la/ti/si），展示逐题对错与总正确率。
- 半音/全音练习：随机给出一个音名（涵盖大字一组至小字二组，含升降记号），填写其所有等音（分别为“升/降 半音”和“升/降 全音”）。
- 自然大调练习：给出起始音（可选仅白键或含黑键），填写完整自然大调音阶，严格校验顺序与记号。
- 虚拟钢琴：三组可切换八度的键盘，基于 Tone.Sampler 加载 `samples/` 目录采样；提供频谱/波形可视化；支持键盘绑定（Z/X/C… 与 Q/W/E… 两行）。
- 节拍器：可调 BPM（20–240）、节拍数（2–8），每拍可循环切换 强/弱/次强 三种力度并以不同音色提示。

## 环境准备
- Node.js ≥ 18（推荐 20+）
- Python 3.9+（建议 3.10/3.11）
- Windows 10/11（本说明以 cmd.exe 为例；开发在其他平台也通常可行，打包配置默认产出 Windows NSIS 安装包）

可选：在受限环境下，设置 `VOSK_MODEL_PATH` 指向 Vosk 模型目录。

## 快速开始（Windows cmd）
在 cmd.exe 中执行：

```bat
cd /d D:\Workplace\JavaScriptProject\musicTheoryTool

:: 1) 安装 Python 依赖（FastAPI + Uvicorn + Vosk）
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt

:: 2) 安装 Node 依赖
npm install

:: 3) 一键并行启动（后端 + Vite + Electron）
npm run dev
```

首启可能需要系统弹窗授权麦克风访问，请允许。

## 运行与调试（分进程）
如需分别启动各进程（便于调试）：

```bat
:: 后端（FastAPI + Vosk，127.0.0.1:8000）
npm run dev:backend

:: 前端渲染（Vite，http://127.0.0.1:5173）
npm run dev:renderer

:: Electron 主进程（等待前端就绪）
npm run dev:electron
```

## 健康检查
后端健康检查接口：

```bat
curl http://127.0.0.1:8000/health
```

返回 `{"status":"ok"}` 表示服务与模型加载正常。

## 使用说明（各功能页）
- 唱名练习
  - 选择难度（速度与题量），点击“开始练习”。
  - 屏幕按节拍显示 1–7，请在切换到下一数字前唱出对应唱名：1=do，2=re，3=mi，4=fa，5=so/sol，6=la，7=ti/si。
  - 程序将每个时间窗的录音作为一个片段送入后端识别，结束后展示逐题结果与正确率。
- 半音/全音练习
  - 随机给出一个音名（覆盖大字一组至小字二组，含 # / X / b / bb 记号）。
  - 在两个输入框中分别写出“升/降 半音”的所有等音与“升/降 全音”的所有等音，多个等音用空格分隔，输入规则见占位提示。
  - 到时或提交后自动判题，完毕显示成绩与正确率。
- 自然大调练习
  - 难度可选“仅白键出发”或“包含黑键出发”。
  - 每行给出起始音（如 1=C、1=#C、1=bD），在输入框按顺序填写完整自然大调音阶，空格分隔，记号与顺序需完全一致。
- 虚拟钢琴
  - 从乐器下拉选择采样音色（来自 `samples/manifest.json`）。
  - 三组键盘各自可选择八度；点击琴键或按键盘发声；底部显示实时波形。
  - 使用 “- / +” 可整体上/下移两组行绑定的音域窗口（覆盖 C2–B6）。
- 节拍器
  - 调节 BPM 与节拍数；每个圆点点击可在 强→弱→次强→强 之间循环；开始/停止控制播放。

## 语音识别与麦克风说明
- 后端 WebSocket：`ws://127.0.0.1:8000/ws`
  - 前端发送配置：`{ type: 'config', sampleRate: 16000 }`
  - 片段控制：`start_segment` / `end_segment`；后端返回 `segment_result`，包含 `{ word, confidence }`。
- 麦克风：浏览器端以 AudioWorklet 采集，线性重采样为 16kHz，转换为 PCM16 单声道字节流。
- 识别词汇受限为唱名词表：`do, re, mi, fa, so/sol, la, ti/si`（大小写与少量噪声字符做了轻微归一）。
- 请在安静环境、靠近麦克风清晰发音（英语读音）。首次运行请确保系统允许桌面应用访问麦克风（Windows 设置 → 隐私与安全 → 麦克风）。

高级：如需替换/移动模型目录，可设置环境变量：

```bat
set VOSK_MODEL_PATH=D:\your\vosk-model-small-en-us-0.15
```

## 虚拟钢琴采样与 manifest 说明
Vite 在开发与构建阶段通过 `vite-plugin-static-copy` 将顶层 `samples/` 复制为可访问的静态目录；页面通过 `samples/manifest.json` 读取音色条目并传给 Tone.Sampler。

- 清单文件：`samples/manifest.json`
- 采样文件：放在 `samples/{instrument_key}/` 目录下（建议 mp3/wav）。
- 典型条目：

```json
{
  "instruments": [
    {
      "key": "piano",
      "label": "piano",
      "baseUrl": "samples/piano/",
      "urls": {
        "C4": "C4.mp3",
        "E4": "E4.mp3",
        "G4": "G4.mp3",
        "C5": "C5.mp3"
      }
    }
  ]
}
```

说明：
- `key` 用于标识与下拉显示；`baseUrl` 为相对路径（开发与打包后均保持 `samples/...`）。
- `urls` 的键为音名（Tone 支持的 Note，如 C4/D#4/F5），值为该音名对应的采样文件名。
- Sampler 会对未提供的音高做移调补间，建议每隔 3–4 个半音采一条以提高音质。

## 设置持久化
应用通过 Electron 预加载的 `electron-store` 持久化常用偏好（在渲染端以 `window.prefs.get/set` 提供）；若不可用则回退到 `localStorage`。

涉及键示例（实际可能随版本扩展）：
- `practice.difficultyKey`
- `piano.instrumentKey`, `piano.groupKeys`, `piano.showLabels`, `piano.showBindings`, `piano.keyboardBaseMidi`
- `metronome.bpm`, `metronome.beats`
- `interval.difficultyKey`, `major.difficultyKey`

## 构建与打包
打包产物默认为 Windows（NSIS 安装包）。首次打包需安装 PyInstaller：

```bat
python -m pip install pyinstaller
```

然后执行：

```bat
:: 构建前端
npm run build:renderer

:: 构建后端可执行文件（PyInstaller 打包为 backend\dist\backend-server.exe）
npm run build:backend

:: 打包桌面应用（或直接 npm run build 一次性完成上述三步）
npx electron-builder
```

关键打包配置见 `package.json` 的 `build` 字段：
- asar 打包；输出目录 `release/`
- 资源包含：`dist/**`, `electron/**`, `backend/**`, `models/**`, `package.json`
- 额外资源：
  - `models/` 被复制为 `resources/models`（供 Vosk 使用）
  - `samples/` 被复制为 `resources/samples`（供 Sampler 加载）
  - `backend/dist` 被复制为 `resources/backend`（包含 `backend-server.exe`）

运行时行为（生产环境）：
- Electron 主进程会在启动时从 `resources/backend/backend-server.exe` 启动后端；
- 自动设置 `VOSK_MODEL_PATH=resources/models/vosk-model-small-en-us-0.15`；
- 前端通过 `ws://127.0.0.1:8000/ws` 与后端通信。

## 关键目录结构
- `backend/` FastAPI + Vosk 后端（`main.py` 暴露 `/health` 与 `/ws`）
- `electron/` Electron 主进程与预加载脚本
- `src/` React 前端
  - `components/` 难度选择、练习执行、结果页、键盘、波形等
  - `pages/` Piano / Interval / Major / Metronome 各页面
  - `asr/` WebSocket 客户端
  - `audio/` 麦克风采集、重采样、Sampler 引擎
  - `store/` Zustand 全局状态
  - `utils/` 唱名映射、等音计算、时间工具
- `models/` Vosk 英文小模型（可替换）
- `samples/` 采样与清单（被 Vite/Electron 打包/复制）
- `scripts/` 小工具脚本（例如随机序列校验）

## 常见问题
- 后端启动报错或 `/health` 失败
  - 确认 `models/vosk-model-small-en-us-0.15` 存在且可读；如移动了目录，设置 `VOSK_MODEL_PATH` 指向模型路径。
- 无法录音/无声音
  - 检查系统麦克风权限；更换麦克风设备；关闭其他占用麦克风的应用。
- 识别率偏低
  - 保持安静环境、靠近麦克风、按英语读音清晰发音；必要时降低难度以延长每题时间窗。
- 虚拟钢琴未加载音色
  - 检查 `samples/manifest.json` 是否有效，`baseUrl` 和文件名大小写是否匹配，音频格式是否受支持。

## 小测试（可选）
随机序列不会出现相邻重复的健壮性检查：

```bat
node scripts\test-random-seq.mjs
```

输出包含 `PASS` 表示通过。

## 许可证
MIT（见 `LICENSE`）。

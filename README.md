# 乐理练习工具（唱名识别）

Electron + React 前端，FastAPI + Vosk 后端。根据不同难度随机显示 1-7 数字，按节拍分段录音并离线识别是否唱对对应的唱名（do, re, mi, fa, so/sol, la, ti/si），展示逐题对错与总体正确率。

## 环境
- Node.js 20.18.3
- Python 3.9+（建议 3.10/3.11）
- Windows 10/11（PowerShell）

模型已放在 `models/vosk-model-small-en-us-0.15`。

## 开发运行（PowerShell）

1) 安装 Python 依赖（FastAPI + Uvicorn + Vosk）：

```powershell
Set-Location -Path 'D:\Workplace\JavaScriptProject\musicTheoryTool'
python -m pip install --upgrade pip
python -m pip install -r .\backend\requirements.txt
```

2) 安装 Node 依赖：

```powershell
npm install
```

3) 启动后端（一个 PowerShell 窗口）：

```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

4) 启动前端渲染进程（第二个 PowerShell 窗口）：

```powershell
npm run dev:renderer
```

5) 启动 Electron（第三个 PowerShell 窗口）：

```powershell
npm run dev:electron
```

或一次性并行启动（单窗口）：

```powershell
npm run dev
```

6) 健康检查（另开一个 PowerShell 进行可选验证）：

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:8000/health' -Method GET | ConvertTo-Json
```

若返回 `{ "status": "ok" }`，说明后端与模型加载正常。

## 使用说明
- 首次进入选择难度（简单/中等/困难/极难），难度越高节拍越短、题量越大。
- 点击“开始练习”后：
  - 界面会按节拍显示一个 1-7 的数字；
  - 在该数字显示到下一个数字出现前的时间窗口内，请对着麦克风唱出对应唱名：
    - 1=do, 2=re, 3=mi, 4=fa, 5=so/sol, 6=la, 7=ti/si
  - 程序按每个窗口分段录音并离线识别；
- 练习结束后，显示每题识别结果（对勾/叉）与总体正确率。

提示：
- 需要允许应用访问麦克风（Windows 设置 > 隐私与安全 > 麦克风 > 允许桌面应用访问）。
- 当前使用的 Vosk 英文小模型，建议按英语读音发音（do, re, mi…），支持 "so/sol"、"ti/si" 两种写法。

## 打包

```powershell
npm run build:renderer
npx electron-builder
```
生成产物位于 `release/`。

## 目录结构（关键）
- backend/ FastAPI + Vosk 后端（`main.py` 提供 /health 与 /ws）
- electron/ Electron 主进程与 preload
- src/ React + MUI 前端
  - components/ 难度选择、练习执行、结果页
  - audio/ 麦克风采集与 AudioWorklet（16k PCM）
  - asr/ WebSocket 客户端
  - store/ Zustand 全局状态
- models/ Vosk 英文小模型

## 常见问题
- 后端无法启动或 /health 报错：确认 `models/vosk-model-small-en-us-0.15` 是否存在且可读；如移动了目录，可设置环境变量 `VOSK_MODEL_PATH` 指向模型目录。
- 前端无声音/无法录音：检查系统麦克风权限；更换麦克风设备；关闭其他占用麦克风的应用。
- 识别率低：保证安静环境、靠近麦克风、按英语读音清晰发音；必要时可调慢难度以留足发音时间。


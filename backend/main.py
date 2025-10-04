import asyncio
import json
import os
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from vosk import Model, KaldiRecognizer, SetLogLevel

# Reduce Vosk logging
SetLogLevel(-1)

app = FastAPI(title="Music Theory Tool Backend")

# CORS for dev; Electron loads file:// so ws is fine, but http API may be accessed by vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_RELATIVE_PATH = os.environ.get("VOSK_MODEL_PATH", os.path.join(os.path.dirname(__file__), "..", "models", "vosk-model-small-en-us-0.15"))
MODEL_ABS_PATH = os.path.abspath(MODEL_RELATIVE_PATH)

_model: Optional[Model] = None


def get_model() -> Model:
    global _model
    if _model is None:
        if not os.path.exists(MODEL_ABS_PATH):
            raise RuntimeError(f"Vosk model not found at {MODEL_ABS_PATH}")
        _model = Model(MODEL_ABS_PATH)
    return _model


@app.get("/health")
async def health():
    try:
        m = get_model()
        ok = m is not None
        return {"status": "ok" if ok else "error"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "detail": str(e)})


SOLFEGE_GRAMMAR = [
    "do", "re", "mi", "fa", "so", "sol", "la", "ti", "si",
    # support elongated or repeated vowels (basic) via word variants handled by recognizer acoustics
]

SOLFEGE_TO_NUMBER = {
    "do": 1,
    "re": 2,
    "mi": 3,
    "fa": 4,
    "so": 5,
    "sol": 5,
    "la": 6,
    "ti": 7,
    "si": 7,
}


class SessionState:
    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate
        self.recognizer: KaldiRecognizer = KaldiRecognizer(get_model(), sample_rate, json.dumps(SOLFEGE_GRAMMAR))
        self.recognizer.SetWords(True)
        self.current_segment_id: Optional[int] = None
        self.results = []  # list of {segmentId, word, confidence}

    def start_segment(self, segment_id: int):
        # Reset recognizer for clean segmentation
        self.current_segment_id = segment_id
        self.recognizer.Reset()

    def accept_audio(self, data: bytes):
        # Feed PCM16 mono at self.sample_rate
        self.recognizer.AcceptWaveform(data)

    def end_segment(self):
        if self.current_segment_id is None:
            return None
        # Final result and reset segment
        raw = self.recognizer.FinalResult()
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = {}
        text = (parsed.get("text") or "").strip()
        word = None
        conf = None
        # Vosk word list per result
        alts = parsed.get("result") or []
        if alts:
            # pick highest confidence word among final segment
            best = max(alts, key=lambda w: w.get("conf", 0))
            word = best.get("word")
            conf = float(best.get("conf", 0))
        else:
            # fallback to text token (single word expected by grammar)
            if text:
                tokens = text.split()
                if tokens:
                    word = tokens[0]
                    conf = parsed.get("confidence")
        entry = {"segmentId": self.current_segment_id, "word": word, "confidence": conf}
        self.results.append(entry)
        seg_id = self.current_segment_id
        self.current_segment_id = None
        return entry


@app.websocket("/ws")
async def ws_handler(ws: WebSocket):
    await ws.accept()
    state: Optional[SessionState] = None
    try:
        while True:
            msg = await ws.receive()
            if "text" in msg and msg["text"] is not None:
                try:
                    data = json.loads(msg["text"])
                except Exception:
                    await ws.send_json({"type": "error", "detail": "Invalid JSON"})
                    continue
                mtype = data.get("type")
                if mtype == "config":
                    sr = int(data.get("sampleRate", 16000))
                    state = SessionState(sample_rate=sr)
                    await ws.send_json({"type": "config_ack", "sampleRate": sr})
                elif mtype == "start_segment":
                    if state is None:
                        state = SessionState()
                    seg_id = int(data.get("segmentId"))
                    state.start_segment(seg_id)
                    await ws.send_json({"type": "start_ack", "segmentId": seg_id})
                elif mtype == "end_segment":
                    if state is None:
                        await ws.send_json({"type": "error", "detail": "No session"})
                        continue
                    entry = state.end_segment()
                    await ws.send_json({"type": "segment_result", "result": entry})
                elif mtype == "end_session":
                    final_results = state.results if state else []
                    await ws.send_json({"type": "session_results", "results": final_results})
                    break
                else:
                    await ws.send_json({"type": "error", "detail": f"Unknown type {mtype}"})
            elif "bytes" in msg and msg["bytes"] is not None:
                if state is None:
                    state = SessionState()
                # Bytes should be PCM16 mono at state.sample_rate
                state.accept_audio(msg["bytes"])
            else:
                # Ignore other messages
                pass
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await ws.send_json({"type": "error", "detail": str(e)})
        except Exception:
            pass
    finally:
        try:
            await ws.close()
        except Exception:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False)


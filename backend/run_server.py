import os
import uvicorn

# Import the FastAPI app
from backend.main import app  # noqa: E402

if __name__ == "__main__":
    # Bind to localhost; Electron uses ws://127.0.0.1:8000
    # VOSK_MODEL_PATH should be set by the parent process if needed
    host = os.environ.get("BACKEND_HOST", "127.0.0.1")
    port = int(os.environ.get("BACKEND_PORT", "8000"))
    uvicorn.run(app, host=host, port=port, reload=False)


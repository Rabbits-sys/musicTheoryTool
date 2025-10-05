"""Backend entry point for running the FastAPI ASR server.

This script launches the FastAPI application defined in ``backend.main`` using
Uvicorn. It is used for development and for packaging into a single executable
via PyInstaller.

Environment Variables
---------------------
BACKEND_HOST : str, optional
    Hostname or IP to bind the server to, by default "127.0.0.1".
BACKEND_PORT : int, optional
    Port number to listen on, by default 8000.
VOSK_MODEL_PATH : str, optional
    Absolute or relative path to the Vosk model directory. If not set, the
    application uses the default path configured in ``backend.main``.
"""

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

"""
Custom ADK server with CORS support.
Run locally:  python server.py
Deploy:       Docker → Cloud Run (PORT env var set automatically)
"""
import os
import pathlib
import uvicorn
from dotenv import load_dotenv
from google.adk.cli.fast_api import get_fast_api_app

load_dotenv(pathlib.Path(__file__).parent / ".env")

AGENTS_DIR = str(pathlib.Path(__file__).parent)

allow_origins = ["*"]

app = get_fast_api_app(
    agents_dir=AGENTS_DIR,
    web=False,
    allow_origins=allow_origins,
)

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)

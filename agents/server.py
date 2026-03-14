"""
Custom ADK server with CORS support.
Run locally:  python server.py
Deploy:       Docker → Cloud Run (PORT env var set automatically)
"""
import os
import pathlib
import uvicorn
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from google.adk.cli.fast_api import get_fast_api_app

load_dotenv(pathlib.Path(__file__).parent / ".env")

AGENTS_DIR = str(pathlib.Path(__file__).parent)

allow_origins = ["*"]

app = get_fast_api_app(
    agents_dir=AGENTS_DIR,
    web=False,
    allow_origins=allow_origins,
)

# Explicit CORSMiddleware — ensures headers are present on all responses
# including 4xx/5xx errors that ADK's internal CORS might miss.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)

"""
Custom ADK server with guaranteed CORS support.
Run locally:  python server.py
Deploy:       Docker → Cloud Run (PORT env var set automatically)
"""
import os
import pathlib
import uvicorn
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from google.adk.cli.fast_api import get_fast_api_app

load_dotenv(pathlib.Path(__file__).parent / ".env")

AGENTS_DIR = str(pathlib.Path(__file__).parent)

# Build the inner ADK FastAPI app
_adk_app = get_fast_api_app(
    agents_dir=AGENTS_DIR,
    web=False,
    allow_origins=["*"],
)

# Wrap as a raw ASGI middleware — NOT add_middleware().
#
# Why: FastAPI's ServerErrorMiddleware is always the outermost layer when
# using add_middleware(), so 500 responses are generated BEFORE CORSMiddleware
# can inject Access-Control-Allow-Origin headers, causing browsers to see
# "CORS blocked" instead of the real error.
#
# Wrapping at the ASGI level puts CORSMiddleware OUTSIDE ServerErrorMiddleware,
# guaranteeing the header is present on every response including 500s.
app = CORSMiddleware(
    app=_adk_app,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)

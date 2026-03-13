FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY agents/pyproject.toml .
RUN pip install --no-cache-dir "hatchling" && \
    pip install --no-cache-dir \
        "google-adk>=1.0.0" \
        "pydantic>=2.0.0" \
        "python-dotenv>=1.0.0" \
        "uvicorn[standard]"

# Copy agent code
COPY agents/ .
# Data must go to /data — vacancy_tools.py resolves:
# /app/tools/vacancy_tools.py → .parent.parent.parent/data = /data
COPY data/ /data

# Cloud Run injects PORT env var; default to 8080
ENV PORT=8080

EXPOSE 8080

CMD ["python", "server.py"]

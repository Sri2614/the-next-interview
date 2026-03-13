FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY pyproject.toml .
RUN pip install --no-cache-dir "hatchling" && \
    pip install --no-cache-dir \
        "google-adk>=1.0.0" \
        "pydantic>=2.0.0" \
        "python-dotenv>=1.0.0" \
        "uvicorn[standard]"

# Copy all agent code and data
COPY . .
COPY ../data ./data

# Cloud Run injects PORT env var; default to 8080
ENV PORT=8080

EXPOSE 8080

CMD ["python", "server.py"]

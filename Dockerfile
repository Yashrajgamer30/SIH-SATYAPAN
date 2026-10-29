# AICTE SATYAPAN - Backend Container for Render & Cloud Deployment
FROM python:3.11-slim

# System dependencies for Tesseract OCR, OpenCV headless, PyPDFium2, and SSL certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code and seed demo pack
COPY backend /app/backend
COPY seed /app/seed

WORKDIR /app/backend

ENV PYTHONPATH=.
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Render injects $PORT dynamically (fallback to 8000 if running locally)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

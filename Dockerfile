# Build Frontend
FROM node:18-alpine as builder
WORKDIR /app_ui
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
# Frontend needs to know API URL is relative for single-container
ENV VITE_API_URL=/api
RUN npm run build

# Build Backend
FROM python:3.11-slim
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Code
COPY . .

# Copy Built Frontend from Stage 1
COPY --from=builder /app_ui/dist ./static_ui

# Environment
ENV PORT=8000
ENV AI_PROVIDER=openai

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Run
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

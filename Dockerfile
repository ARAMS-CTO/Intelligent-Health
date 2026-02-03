
# Stage 1: Build the React Frontend
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Set the Google Client ID for the build (Vite needs this at build time)
ARG VITE_GOOGLE_CLIENT_ID=977696014858-94k1jo2uapv9tjqvoi2753q9pbge7953.apps.googleusercontent.com
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build

# Stage 2: Python Backend
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy frontend build from stage 1
COPY --from=build /app/dist ./static

# Install Python dependencies
COPY ./server/requirements.txt ./server/
RUN pip install --no-cache-dir -r server/requirements.txt

# Copy backend code
COPY . .

# Create static/uploads
RUN mkdir -p static/uploads && chmod 777 static/uploads

# Debug
RUN pip freeze

# Expose port
EXPOSE 8080

# Start the application
CMD sh -c "python -m uvicorn server.main:app --host 0.0.0.0 --port ${PORT:-8080}"

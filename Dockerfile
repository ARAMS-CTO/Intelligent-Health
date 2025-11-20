# Stage 1: Build the React Frontend
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Setup the Python Backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if needed
# RUN apt-get update && apt-get install -y ...

# Copy backend requirements and install
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY server ./server

# Copy built frontend assets from Stage 1
COPY --from=build /app/dist ./static

# Expose port
EXPOSE 8080

# Environment variables (can be overridden at runtime)
ENV PORT=8080
ENV GEMINI_API_KEY=""

# Command to run the application
# We need to serve the static files as well. 
# For a simple setup, we can mount the static files in FastAPI and serve index.html for root.
# We need to update main.py to serve static files, or use a separate web server like Nginx.
# For simplicity in this plan, we'll assume main.py is updated to serve static files or we use uvicorn.
CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8080"]

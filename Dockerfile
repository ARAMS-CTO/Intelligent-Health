
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

# Start the application
CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8080"]

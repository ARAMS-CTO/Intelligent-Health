
# Stage 1: Build the React Frontend
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Setup the Python Backend
FROM python:3.11

WORKDIR /app

# Full python image has build-essential and headers

# Copy backend requirements and install
COPY server/requirements.txt .
ARG CACHEBUST=2
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY server ./server

# Copy built frontend assets from Stage 1
COPY --from=build /app/dist ./static

# Expose port
EXPOSE 8080

# Create a volume for uploads to ensure persistence
VOLUME /app/static/uploads

# Start the application
CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8080"]

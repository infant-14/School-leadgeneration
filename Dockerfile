# Use official Node.js image
FROM node:20-slim

# Install system dependencies, Python3, pip, and virtual environment utilities
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# 1. Install Node.js backend dependencies and build
COPY backend/package*.json ./backend/
RUN cd backend && npm install
COPY backend/ ./backend/
RUN cd backend && npm run build

# 2. Setup Python virtual environment and install scraper dependencies
COPY backend_python/requirements.txt ./backend_python/
RUN python3 -m venv /app/venv && \
    /app/venv/bin/pip install --upgrade pip && \
    /app/venv/bin/pip install -r /app/backend_python/requirements.txt

# Install Playwright browser and system libraries
RUN /app/venv/bin/playwright install chromium && \
    /app/venv/bin/playwright install-deps

# Copy the rest of the application files
COPY backend_python/ ./backend_python/
COPY credentials.json ./

# Expose NestJS backend port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start NestJS application
CMD ["node", "backend/dist/main.js"]

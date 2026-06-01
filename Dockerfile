FROM ubuntu:22.04

# Prevent interactive prompts during apt installs
ENV DEBIAN_FRONTEND=noninteractive

# Install System Dependencies, Python 3.10, and Node.js 18
RUN apt-get update && apt-get install -y \
    curl \
    python3.10 \
    python3-pip \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Map python to python3 globally
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3 1

# Set the main working directory
WORKDIR /app

# Copy requirement manifests first for optimal Docker layer caching
COPY requirements.txt ./
COPY backend/package*.json ./backend/

# Install Python ML dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install Node Backend dependencies
WORKDIR /app/backend
RUN npm install

# Move back to root and copy the required project logic
WORKDIR /app
COPY backend ./backend
COPY scripts ./scripts
COPY models ./models

# Pre-create all required storage directories with proper permissions
RUN mkdir -p /app/local_storage/realtime_detection/images \
    /app/local_storage/realtime_detection/videos \
    /app/local_storage/upload_detection/images \
    /app/local_storage/csv_reports \
    /app/local_storage/excel_reports \
    /app/local_storage/exported_images \
    /app/local_storage/logs \
    /app/backend/uploads

# Set execution directory to backend
WORKDIR /app/backend

# Expose backend API port
EXPOSE 5000

# Define start command
CMD ["npm", "start"]

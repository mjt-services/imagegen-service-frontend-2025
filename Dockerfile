# Use the latest Node.js Alpine as the base image
FROM node:alpine AS base

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VIRTUAL_ENV=/opt/venv

# Install necessary system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    curl \
    build-base \
    && python3 -m venv $VIRTUAL_ENV \
    && . $VIRTUAL_ENV/bin/activate \
    && pip install --no-cache-dir --upgrade pip setuptools wheel vastai

# Make the virtual environment default for Python
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Set the working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package manager lockfile and configuration files
COPY pnpm-lock.yaml package.json tsconfig.json ./


# Install Node.js dependencies with pnpm, respecting the lockfile
RUN pnpm install --frozen-lockfile

# Copy the rest of the application source code
COPY src ./src

# Default command to run the application
CMD ["pnpm", "start"]

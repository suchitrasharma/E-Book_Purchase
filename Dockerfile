# ---- Base image ----
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY server/ ./server/
COPY client/ ./client/
COPY data/   ./data/

# Expose the backend API port
EXPOSE 5000

# Seed the database then start the server
CMD ["sh", "-c", "node server/src/seed.js && node server/src/server.js"]

# Use official Node.js image as base
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Expose port 
EXPOSE 3000

# Start the API 
CMD ["node", "server.js"]
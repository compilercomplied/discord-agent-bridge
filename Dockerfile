# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy TypeScript config and source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript to JavaScript
RUN npm install typescript && \
    npm run build && \
    npm uninstall typescript

# Remove source files after build
RUN rm -rf src tsconfig.json

# Set environment to production
ENV NODE_ENV=production

# Run the application
CMD ["npm", "start"]

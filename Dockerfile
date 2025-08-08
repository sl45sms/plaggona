FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application
COPY . .

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S plaggona -u 1001 -G nodejs

# Change ownership of the app directory
RUN chown -R plaggona:nodejs /app
USER plaggona

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/users', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Run the application
CMD ["npm", "start"]
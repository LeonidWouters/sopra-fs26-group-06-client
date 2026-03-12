# Build Stage
FROM node:22.14.0 AS build
WORKDIR /app

# Copy package.json + lockfile
COPY package*.json ./

# Install dependencies
RUN npm ci --loglevel=error

# Copy app source
COPY . .

# Build the Next.js app
RUN npm run build

# Production Stage
FROM node:22.14.0-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Optional: Non-root user
USER 3301

# Set npm cache
RUN npm config set cache /app/.npm-cache --global

# Copy build artifacts
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json

# Expose port
EXPOSE 3000

# Start Next.js server
CMD ["npx", "next", "start"]
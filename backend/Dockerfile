FROM node:18-alpine

WORKDIR /app

# Install system dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++ sqlite

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p /app/data
RUN chown -R node:node /app

USER node

EXPOSE 3001

CMD ["npm", "start"] 
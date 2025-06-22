require('dotenv').config()

module.exports = {
  server: {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  database: {
    path: process.env.DB_PATH || './data/dev.db'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  },
  aws: {
    defaultRegion: process.env.AWS_DEFAULT_REGION || 'us-east-1'
  },
  cors: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || ''
  }
} 
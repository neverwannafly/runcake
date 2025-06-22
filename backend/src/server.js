const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const config = require('../config')

// Import routes
const authRoutes = require('./routes/auth')
const scriptsRoutes = require('./routes/scripts')
const targetGroupsRoutes = require('./routes/targetGroups')
const iamCredentialsRoutes = require('./routes/iamCredentials')
const auditLogsRoutes = require('./routes/auditLogs')
const runnersRoutes = require('./routes/runners')

// Initialize database
require('./database/db')

const app = express()

// Security middleware with relaxed CSP for development
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"], // Allow all HTTPS images
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      upgradeInsecureRequests: [],
    },
  },
}))

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
   
    // Strip http:// and https:// from the origin
    const strippedOrigin = origin.replace(/^https?:\/\//, '')
    
    if (config.cors.allowedOrigins.indexOf(strippedOrigin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

// Logging middleware
if (config.server.nodeEnv === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/scripts', scriptsRoutes)
app.use('/api/target-groups', targetGroupsRoutes)
app.use('/api/iam-credentials', iamCredentialsRoutes)
app.use('/api/audit-logs', auditLogsRoutes)
app.use('/api/runners', runnersRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  
  res.status(500).json({
    success: false,
    message: config.server.nodeEnv === 'development' ? err.message : 'Internal server error'
  })
})

// Start server
const PORT = config.server.port

app.listen(PORT, () => {
  console.log(`🚀 Backend Server is running on port ${PORT}`)
  console.log(`📊 Environment: ${config.server.nodeEnv}`)
  console.log(`🔗 API Base URL: http://localhost:${PORT}`)
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`)
  
  if (config.server.nodeEnv === 'development') {
    console.log('\n📚 Available API Endpoints:')
    console.log('  - POST /api/auth/login')
    console.log('  - GET  /api/auth/me')
    console.log('  - POST /api/auth/logout')
    console.log('  - GET  /api/scripts')
    console.log('  - POST /api/scripts')
    console.log('  - GET  /api/scripts/:id')
    console.log('  - PUT  /api/scripts/:id')
    console.log('  - DELETE /api/scripts/:id')
    console.log('  - POST /api/scripts/:id/execute')
    console.log('  - GET  /api/target-groups')
    console.log('  - POST /api/target-groups')
    console.log('  - GET  /api/target-groups/:id')
    console.log('  - GET  /api/target-groups/:id/preview')
    console.log('  - PUT  /api/target-groups/:id')
    console.log('  - DELETE /api/target-groups/:id')
    console.log('  - GET  /api/iam-credentials')
    console.log('  - POST /api/iam-credentials')
    console.log('  - GET  /api/iam-credentials/:id')
    console.log('  - PUT  /api/iam-credentials/:id')
    console.log('  - DELETE /api/iam-credentials/:id')
    console.log('  - GET  /api/audit-logs')
    console.log('  - GET  /api/audit-logs/:id')
    console.log('  - GET  /api/runners')
    console.log('  - POST /api/runners')
    console.log('  - GET  /api/runners/:id')
    console.log('  - PUT  /api/runners/:id')
    console.log('  - DELETE /api/runners/:id')
  }
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...')
  process.exit(0)
})

module.exports = app 
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const config = require('./config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'coidea.ai-api',
    version: '0.1.0'
  });
});

// API routes
app.use('/api/agents', require('./routes/agents'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/humans', require('./routes/humans'));
app.use('/api/payments', require('./routes/payments'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found'
  });
});

// Start server only if not in test mode or explicitly requested
if (process.env.NODE_ENV !== 'test' || process.env.START_SERVER === 'true') {
  app.listen(config.port, () => {
    console.log(`🚀 coidea.ai API server running on port ${config.port}`);
    console.log(`📡 Connected to chain ID: ${config.chainId}`);
    console.log(`📚 API Docs: http://localhost:${config.port}/api-docs`);
  });
}

module.exports = app;

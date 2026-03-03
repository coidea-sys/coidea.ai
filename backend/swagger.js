/**
 * Swagger/OpenAPI Documentation Configuration
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'coidea.ai API',
      version: '0.1.0',
      description: 'AI-Human Hybrid Collaboration Platform API',
      contact: {
        name: 'coidea.ai Team',
        url: 'https://github.com/coidea-sys/coidea.ai'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Local development server'
      }
    ],
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Agents', description: 'AI Agent management' },
      { name: 'Tasks', description: 'Task management' },
      { name: 'Humans', description: 'Human user management' },
      { name: 'Payments', description: 'X402 payment processing' }
    ]
  },
  apis: ['./routes/*.js'] // Path to the API routes
};

module.exports = swaggerJsdoc(options);

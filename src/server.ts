import express, { Express } from 'express';
import path from 'path';
import { serverConfig, validateConfig } from './config/snag.config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import router from './routes/api.routes';

// Validate configuration before starting server
try {
  validateConfig();
} catch (error: any) {
  console.error('Configuration Error:', error.message);
  process.exit(1);
}

const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS (simple configuration for POC)
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    ip: req.ip,
  });
  next();
});

// API routes
app.use(router);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve index.html for root path
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = serverConfig.port;
app.listen(PORT, () => {
  logger.info(`Server started successfully`, {
    port: PORT,
    environment: serverConfig.nodeEnv,
    baseUrl: `http://localhost:${PORT}`,
  });
  logger.info('Available endpoints:', {
    health: `http://localhost:${PORT}/health`,
    wallet: `http://localhost:${PORT}/api/loyalty/wallet/:walletAddress`,
    points: `http://localhost:${PORT}/api/loyalty/points/:walletAddress`,
    badges: `http://localhost:${PORT}/api/loyalty/badges/:walletAddress`,
    quests: `http://localhost:${PORT}/api/loyalty/quests/:walletAddress`,
    allQuests: `http://localhost:${PORT}/api/loyalty/quests`,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

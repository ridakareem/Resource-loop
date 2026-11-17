import app from './app.js';
import config from './config/env.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';

const PORT = config.port;

// Start the Express HTTP server
const server = app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 ResourceLoop API Server is running!`);
  console.log(`📡 URL:       http://localhost:${PORT}`);
  console.log(`🩺 Health:    http://localhost:${PORT}/api/v1/health`);
  console.log(`🔐 Auth:      http://localhost:${PORT}/api/auth`);
  console.log(`👤 Users:     http://localhost:${PORT}/api/users/me`);
  console.log(`📦 Resources: http://localhost:${PORT}/api/resources`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`==================================================`);
});

// Handle unhandled Promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Gracefully close server and exit
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

// Handle termination signals for graceful shutdown (Docker, PM2, Ctrl+C)
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Shutting down server gracefully...`);
  server.close(() => {
    console.log('Server closed. Process terminated.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;

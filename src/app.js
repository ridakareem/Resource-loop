import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import config from './config/env.js';
import healthRoutes from './routes/health.js';
import apiRoutes from './routes/api.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import notFoundHandler from './middlewares/notFound.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// 1. HTTP Request Logging Middleware
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// 2. CORS Middleware
const corsOptions = {
  origin: config.corsOrigin === '*' 
    ? '*' 
    : config.corsOrigin.split(',').map((origin) => origin.trim()),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
};
app.use(cors(corsOptions));

// 3. Body Parsing Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Welcome / Root Info Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to ResourceLoop Backend API',
    version: '1.0.0',
    documentation: '/api/v1/health',
  });
});

// 5. Health Check Routes (Available at both /health and /api/v1/health)
app.use('/health', healthRoutes);

// 6. Direct /api/auth routes (POST /api/auth/signup, /login, /logout)
app.use('/api/auth', authRoutes);

// 7. Direct /api/users routes (GET /api/users/me, PUT /api/users/me)
app.use('/api/users', userRoutes);

// 8. Direct /api/resources routes (POST /api/resources)
app.use('/api/resources', resourceRoutes);

// 9. API v1 Router (/api/v1/health, /api/v1/auth, /api/v1/users, /api/v1/resources)
app.use('/api/v1', apiRoutes);

// 10. 404 Not Found Handler (Catches any request not matched above)
app.use(notFoundHandler);

// 11. Centralized Error Handling Middleware
app.use(errorHandler);

export default app;

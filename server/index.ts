/**
 * MedLoop Server Entry Point
 * 
 * Express + Socket.io server with device integration routes.
 * Existing patient/visit/auth routes remain untouched.
 */

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Pool } from 'pg';
import { initDeviceRoutes } from './deviceRoutes';
import { initSocketIO } from './socket';

const app = express();
const server = http.createServer(app);

// PostgreSQL pool - credentials from environment variable only
if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL environment variable is not set!');
  process.exit(1);
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000
});

// Middleware - restrict CORS to known origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://med.loopjo.com,http://localhost:5173,http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0.0' });
});

// Initialize Socket.IO
const io = initSocketIO(server, pool);

// Mount device routes (pass pool + socket.io)
const deviceRouter = initDeviceRoutes(pool, io);
app.use('/api', deviceRouter);

// ================================
// EXISTING ROUTES (your current endpoints go here)
// app.use('/api/auth', authRoutes);
// app.use('/api/patients', patientRoutes);
// etc.
// ================================

// Start server
const PORT = parseInt(process.env.PORT || '3001');
server.listen(PORT, () => {
  console.log(`🏥 MedLoop Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready at ws://localhost:${PORT}/ws`);
  console.log(`🔌 Device API at http://localhost:${PORT}/api/device-results`);
});

export { app, server, pool };

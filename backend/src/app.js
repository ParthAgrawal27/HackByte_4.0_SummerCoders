import express from 'express';
import cors from 'cors';
import analyzeRoute from './routes/analyze.js';
import alertsRoute from './routes/alerts.js';

const app = express();

app.use(cors());
app.use(express.json());

// Health route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', analyzeRoute);
app.use('/api/alerts', alertsRoute);

export default app;

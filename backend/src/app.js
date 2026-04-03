import express from 'express';
import cors from 'cors';
import analyzeRoute from './routes/analyze.js';

const app = express();

app.use(cors());
app.use(express.json());

// Health route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', analyzeRoute);

export default app;

import 'dotenv/config';
import app from './app.js';
import { initDB } from './db.js';

const PORT = process.env.PORT || 3000;

initDB();
console.log('Database initialized.');

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

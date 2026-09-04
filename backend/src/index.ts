import dotenv from 'dotenv';
import { createServer } from './server.js';

dotenv.config();

const app = createServer();
const PORT = Number(process.env.PORT) || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});

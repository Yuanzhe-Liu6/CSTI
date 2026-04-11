import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'csti-backend' });
});

app.listen(PORT, () => {
  console.log(`CSTI backend listening on http://localhost:${PORT}`);
});

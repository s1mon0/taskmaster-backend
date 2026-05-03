import express from 'express';
import cors from 'cors';
import listRouter from './server/routes/list.js';
import taskRouter from './server/routes/task.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/list', listRouter);
app.use('/task', taskRouter);

app.listen(PORT, () => {
  console.log(`Backend server běží na http://localhost:${PORT}`);
});

export default app;

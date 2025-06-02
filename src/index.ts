import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import splitRoutes from './routes/split-route'
import { rateLimiter } from './middlewares/rate-limiter'
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
// import { splitWorker } from './jobs/splitQueue';
import { splitQueue, splitWorker } from './config/bullmq';
import path = require('path');
// import './config/worker'

dotenv.config();

const app = express();

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(splitQueue)],
  serverAdapter,
});


app.use('/videos', express.static(path.join(__dirname, '../uploads')));

app.use(bodyParser.json());


app.use('/admin/queues', serverAdapter.getRouter());

app.use(rateLimiter);

app.use('/api', splitRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

 export const connection = new IORedis({
   host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,  // important to convert to number
  maxRetriesPerRequest: null,
});

export const splitQueue = new Queue('video-split', { connection });
export const splitQueueEvents = new QueueEvents('video-split', { connection });

import { processVideo } from '../services/videoProcessor';


// Worker instance
export const splitWorker = new Worker(
  'video-split',
  async (job) => {
    const { youtubeUrl, duration } = job.data;
    return await processVideo(youtubeUrl, duration);
  },
  { connection }
);

// Optional event logs for worker
splitWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

splitWorker.on('failed', (job, err) => {
  // @ts-ignore
  console.error(`❌ Job ${job.id} failed: ${err.message}`);
});


// import { Queue, Worker, QueueEvents } from "bullmq";
// import IORedis from "ioredis"

// const connection = new IORedis({
//     host: process.env.REDIS_HOST,
//     port: Number(process.env.REDIS_PORT),

// })

// export const splitQueue = new Queue('split-video', {connection})
// export const splitQueueEvents =   new QueueEvents('video-split', { connection });


// export {Worker}
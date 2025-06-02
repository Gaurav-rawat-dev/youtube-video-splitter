import { Worker } from 'bullmq';
import { processVideo } from '../services/videoProcessor';
import { connection} from '../config/bullmq';

const splitWorker = new Worker('video-split', async (job) => {
  const { youtubeUrl, duration } = job.data;

  
  return await processVideo(youtubeUrl, duration);
}, {
  connection,
    stalledInterval: 60000
});

// Optional: logs
splitWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

splitWorker.on('failed', (job, err) => {
    // @ts-ignore
  console.error(`❌ Job ${job.id} failed: ${err.message}`);
});

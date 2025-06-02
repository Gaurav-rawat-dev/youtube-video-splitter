// app.js
import express from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import videoRouter from "./src/routes/splitRoute.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(express.json());

// Ensure output and temp folders exist
fs.ensureDirSync(path.join(__dirname, "output"));
fs.ensureDirSync(path.join(__dirname, "temp"));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many requests. Try again later."
});
app.use("/api/", limiter);

// Static files for videos
app.use("/videos", express.static(path.join(__dirname, "output")));

app.use("/api/video", videoRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// queue/videoQueue.js
import Queue from "bull";
import splitProcessor from "../jobs/splitProcessor.js";
const videoQueue = new Queue("video-queue", process.env.REDIS_URL);
videoQueue.process("split-video", splitProcessor);
export default videoQueue;


// routes/splitRoute.js
import express from "express";
import { body, validationResult } from "express-validator";
import videoQueue from "../queue/videoQueue.js";

const router = express.Router();

router.post(
  "/split",
  [
    body("youtubeUrl").isURL().withMessage("Invalid URL"),
    body("duration")
      .isInt({ min: 10, max: 600 })
      .withMessage("Duration must be between 10-600 seconds"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { youtubeUrl, duration } = req.body;
    const job = await videoQueue.add("split-video", { youtubeUrl, duration });
    res.status(202).json({ jobId: job.id });
  }
);

export default router;


// jobs/splitProcessor.js
import ytdl from "ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs-extra";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import cleanUp from "../utils/cleanUp.js";

const TEMP_DIR = path.join(process.cwd(), "temp");
const OUTPUT_DIR = path.join(process.cwd(), "output");

export default async function (job) {
  const { youtubeUrl, duration } = job.data;
  const videoId = uuidv4();
  const videoPath = `${TEMP_DIR}/${videoId}.mp4`;

  await fs.ensureDir(TEMP_DIR);
  await fs.ensureDir(OUTPUT_DIR);

  // 1. Download video
  await new Promise((resolve, reject) => {
    ytdl(youtubeUrl, { quality: "highest" })
      .pipe(fs.createWriteStream(videoPath))
      .on("finish", resolve)
      .on("error", reject);
  });

  // 2. Get video duration
  const videoDuration = await new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration);
    });
  });

  const numParts = Math.ceil(videoDuration / duration);
  const localFilePaths = [];

  // 3. Split video
  for (let i = 0; i < numParts; i++) {
    const outputFile = `${OUTPUT_DIR}/${videoId}_part_${i}.mp4`;
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .setStartTime(i * duration)
        .duration(duration)
        .output(outputFile)
        .on("end", resolve)
        .on("error", reject)
        .run();
    });
    localFilePaths.push(`/videos/${videoId}_part_${i}.mp4`);
  }

  // 4. Cleanup
  await cleanUp(TEMP_DIR, videoId);

  return { localFiles: localFilePaths };
}


// utils/cleanUp.js
import fs from "fs-extra";
import path from "path";

const cleanUp = async (tempDir, baseName) => {
  const files = await fs.readdir(tempDir);
  for (const file of files) {
    if (file.startsWith(baseName)) {
      await fs.remove(path.join(tempDir, file));
    }
  }
};

export default cleanUp;

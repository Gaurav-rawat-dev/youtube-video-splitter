import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';

const TMP_DIR = path.join(__dirname, '../../tmp');
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath!);

export async function processVideo(youtubeUrl: string, duration: number) {
  const id = uuid();
  const outputDir = path.join(UPLOAD_DIR, id);
  const videoPath = path.join(TMP_DIR, `${id}-video.mp4`);
  const audioPath = path.join(TMP_DIR, `${id}-audio.mp4`);
  const mergedPath = path.join(TMP_DIR, `${id}-merged.mp4`);

  fs.mkdirSync(outputDir, { recursive: true });

  // Step 1: Download video stream
  await new Promise<void>((resolve, reject) => {

    const stream = ytdl(youtubeUrl, { quality: 'highestvideo' });
    const write = fs.createWriteStream(videoPath);
    stream.pipe(write);
    stream.on('end', resolve);
    stream.on('error', reject);
  });

  // Step 2: Download audio stream
  await new Promise<void>((resolve, reject) => {
    const stream = ytdl(youtubeUrl, { quality: 'highestaudio' });
    const write = fs.createWriteStream(audioPath);
    stream.pipe(write);
    stream.on('end', resolve);
    stream.on('error', reject);
  });

  // Step 3: Merge audio + video
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .videoCodec('copy')
      .audioCodec('aac')
      .outputOptions('-shortest')
      .on('start', (cmd) => console.log('🎬 Merging:', cmd))
      .on('end', () => {
        console.log('✅ Merge complete');
        resolve();
      })
      .on('error', (err) => {
        console.error('❌ Merge error:', err);
        reject(err);
      })
      .save(mergedPath);
  });

  // Step 4: Split video
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(mergedPath)
      .outputOptions([
        // this can be used when we have to make some encoding, so this is cpu intendice and will take some time
        // '-c:v libx264',
        // '-c:a aac',
        // '-f segment',
        // `-segment_time ${duration}`,
        // '-reset_timestamps 1'

        '-c copy',
        '-f segment',
        `-segment_time ${duration}`,
        '-reset_timestamps 1'
      ])
      .output(path.join(outputDir, 'chunk-%03d.mp4'))
      .on('start', cmd => console.log('🎬 Splitting:', cmd))
      .on('end', () => {
        console.log('✅ Splitting done');
        resolve();
      })
      .on('error', reject)
      .run();
  });

  // Cleanup
  fs.unlinkSync(videoPath);
  fs.unlinkSync(audioPath);
  fs.unlinkSync(mergedPath);

  return { message: 'Splitting done', folder: id };
}

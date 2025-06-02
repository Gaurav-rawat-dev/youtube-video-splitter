import { Request, Response } from 'express';
import { splitSchema } from '../utils/validator'
import { splitQueue } from '../config/bullmq';

import path from 'path';
import fs from 'fs/promises';
import archiver from 'archiver'

export async function handleSplit(req: Request, res: Response) {
  try {
    const data = splitSchema.parse(req.body);

    const job = await splitQueue.add('split-task', data);
    res.status(202).json({ message: 'Processing started', jobId: job.id });
  } catch (error) {
    // @ts-ignore
    res.status(400).json({ message: error.errors?.[0]?.message || 'Invalid input' });
  }
}


export async function downloadClipsZip(req: Request, res: Response) {
  const { jobId } = req.params;
  const clipsDir = path.resolve(__dirname, `../videos/splits/${jobId}`);

  try {
    const files = await fs.readdir(clipsDir);

    if (files.length === 0) {
      return res.status(404).json({ message: 'No clips found for this job' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=clips_${jobId}.zip`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const file of files) {
      const filePath = path.join(clipsDir, file);
      archive.file(filePath, { name: file });
    }

    await archive.finalize();
  } catch (error) {
    res.status(500).json({ message: 'Error creating zip', error });
  }
}



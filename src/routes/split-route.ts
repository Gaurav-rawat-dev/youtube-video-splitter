import { Router } from 'express';
import { downloadClipsZip, handleSplit } from '../controller/split-controller';

const router = Router();
router.post('/split', handleSplit);
// @ts-ignore
// router.get('/download-clips/:jobId', downloadClipsZip);
// app.get('/clip-links/:jobId', getClipLinks);



export default router;

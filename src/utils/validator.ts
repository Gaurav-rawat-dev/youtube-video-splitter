import { z } from 'zod';

export const splitSchema = z.object({
  youtubeUrl: z.string().url().refine((url) => url.includes('youtube.com') || url.includes('youtu.be'), {
    message: 'Must be a valid YouTube URL',
  }),
  duration: z.number().int().positive().max(600),
});

export type SplitInput = z.infer<typeof splitSchema>;

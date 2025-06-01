1. Download the YouTube Video : npm install ytdl-core
2. Split Video into Parts
Use fluent-ffmpeg with ffmpeg installed in your system : npm install fluent-ffmpeg


Steps : ===========
POST /split-video
Request Body:
{
  "youtubeUrl": "https://www.youtube.com/watch?v=xyz",
  "splitDuration": 60
}


Process:
== > Download the video

== > Get duration

== > Split using ffmpeg into chunks of 60 seconds

== > Return links to all the parts (or stream them)

===============Folder Structure ==========
video-splitter-api/
├── jobs/
│   └── splitProcessor.js
├── queue/
│   └── videoQueue.js
├── routes/
│   └── splitRoute.js
├── utils/
│   ├── s3.js
│   └── cleanUp.js
├── temp/
├── app.js
└── .env

=================tech stack ================
Node.js + Express (REST API)
BullMQ (Redis-backed job queue)
FFmpeg (video processing)
ytdl-core (download YouTube video)
Rate-limiter-flexible (rate limiting)
Zod (validation)
dotenv (environment variables)
Redis (BullMQ backend)









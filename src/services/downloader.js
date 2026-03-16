const ytDlp = require("yt-dlp-exec");
const path = require("path");

async function downloadMusic(url) {
  const output = path.join(__dirname, "../downloads/%(title)s.%(ext)s");

  await ytDlp(url, {
    extractAudio: true,
    audioFormat: "mp3",
    audioQuality: 0,
    addMetadata: true,
    writeThumbnail: true,
    embedThumbnail: true,
    output,
  });

  return "Download finalizado";
}

module.exports = downloadMusic;

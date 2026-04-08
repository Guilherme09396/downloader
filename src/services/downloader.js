const ytDlp = require("yt-dlp-exec");
const path = require("path");
const { getProxyUrl } = require("../utils/proxy");

async function downloadMusic(url, sessionId = "default") {
  const output = path.join(__dirname, "../downloads/%(title)s.%(ext)s");

  await ytDlp(url, {
    extractAudio: true,
    audioFormat: "mp3",
    proxy: getProxyUrl(sessionId),
    output,
  });

  return "Download finalizado";
}

module.exports = downloadMusic;
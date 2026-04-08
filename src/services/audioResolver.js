const ytDlp = require("yt-dlp-exec");
const axios = require("axios");
const { getProxyAgent, getProxyUrl } = require("../utils/proxy");

const AUDIO_FORMAT = "140";

const BASE_HEADERS = {
  "user-agent": "Mozilla/5.0",
};

// =======================
// YT-DLP
// =======================
async function getFromYtDlp(url, sessionId) {
  const result = await ytDlp(url, {
    format: AUDIO_FORMAT,
    getUrl: true,
    proxy: getProxyUrl(sessionId),
  });

  const audioUrl = result.trim().split("\n")[0];

  return { source: "yt-dlp", url: audioUrl };
}

// =======================
// PIPED
// =======================
async function getFromPiped(videoId, sessionId) {
  const agent = getProxyAgent(sessionId);

  const { data } = await axios.get(
    `https://piped.video/api/v1/streams/${videoId}`,
    {
      httpAgent: agent,
      httpsAgent: agent,
      headers: BASE_HEADERS,
    }
  );

  return { source: "piped", url: data.audioStreams[0].url };
}

// =======================
// MAIN
// =======================
function extractVideoId(url) {
  const match =
    url.match(/v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);

  return match ? match[1] : null;
}

async function getAudioSource(url, sessionId) {
  const videoId = extractVideoId(url);

  try {
    return await getFromPiped(videoId, sessionId);
  } catch {
    return await getFromYtDlp(url, sessionId);
  }
}

module.exports = { getAudioSource };
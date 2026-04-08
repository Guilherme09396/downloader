const express = require("express");
const ytDlp = require("yt-dlp-exec");
const axios = require("axios");
const path = require("path");
const { getAudioSource } = require("../services/audioResolver");
const { getProxyAgent, getProxyUrl } = require("../utils/proxy");

const router = express.Router();

const COOKIES_PATH = path.join(__dirname, "../../cookies.txt");

// =======================
// AXIOS COM PROXY
// =======================
function createAxios(sessionId) {
  const agent = getProxyAgent(sessionId);

  return axios.create({
    httpAgent: agent,
    httpsAgent: agent,
    timeout: 15000,
  });
}

// =======================
// CACHE
// =======================
const streamCache = new Map();
const STREAM_TTL = 1000 * 60 * 60;

function getCachedStream(url) {
  const item = streamCache.get(url);
  if (!item) return null;
  if (Date.now() > item.expire) {
    streamCache.delete(url);
    return null;
  }
  return item.audioUrl;
}

function setCachedStream(url, audioUrl) {
  streamCache.set(url, { audioUrl, expire: Date.now() + STREAM_TTL });
}

// =======================
// CONFIG YT-DLP
// =======================
const BASE_HEADERS = [
  "user-agent: Mozilla/5.0",
  "accept-language: en-US,en;q=0.9",
];

const AUDIO_FORMAT_PREFERENCE = "bestaudio/best";

// =======================
// HELPER YT-DLP COM PROXY
// =======================
async function runYtDlp(url, opts = {}, sessionId) {
  return ytDlp(url, {
    ...opts,
    proxy: getProxyUrl(sessionId),
  });
}

// =======================
// DOWNLOAD
// =======================
router.get("/download", async (req, res) => {
  const fs = require("fs");
  const os = require("os");
  const crypto = require("crypto");

  try {
    const { url, title } = req.query;
    if (!url) return res.status(400).json({ error: "URL não fornecida" });

    const sessionId = req.ip;

    const filename = title ? `${title}.mp3` : "music.mp3";

    const tmpDir = path.join(
      os.tmpdir(),
      `music-${crypto.randomBytes(6).toString("hex")}`
    );

    fs.mkdirSync(tmpDir, { recursive: true });

    await runYtDlp(
      url,
      {
        format: AUDIO_FORMAT_PREFERENCE,
        extractAudio: true,
        audioFormat: "mp3",
        audioQuality: 0,
        addMetadata: true,
        embedThumbnail: true,
        output: path.join(tmpDir, "audio.%(ext)s"),
      },
      sessionId
    );

    const file = fs.readdirSync(tmpDir).find((f) => f.endsWith(".mp3"));

    if (!file) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      return res.status(500).json({ error: "MP3 não encontrado" });
    }

    const filePath = path.join(tmpDir, file);
    const stat = fs.statSync(filePath);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", stat.size);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(filename)}"`
    );

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    stream.on("end", () => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// =======================
// STREAM
// =======================
router.get("/stream", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "URL não fornecida" });

    const sessionId = req.ip;
    const axiosInstance = createAxios(sessionId);

    let audioUrl = getCachedStream(url);

    if (!audioUrl) {
      const result = await getAudioSource(url, sessionId);
      audioUrl = result.url;
      setCachedStream(url, audioUrl);
    }

    const response = await axiosInstance({
      method: "GET",
      url: audioUrl,
      responseType: "stream",
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    res.setHeader("Content-Type", response.headers["content-type"]);
    response.data.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no stream" });
  }
});

module.exports = router;
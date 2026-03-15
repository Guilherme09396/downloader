const express = require("express");
const ytDlp = require("yt-dlp-exec");

const router = express.Router();

router.get("/", (req, res) => {
  return res.send("Olá");
});

router.get("/download", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: "URL não fornecida",
      });
    }

    const userAgent = req.headers["user-agent"] || "";
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Accept-Ranges", "bytes");

    // Força download
    res.setHeader("Content-Disposition", "attachment; filename=music.mp3");

    const stream = ytDlp.exec(url, {
      extractAudio: true,
      audioFormat: "mp3",
      output: "-",
      noWarnings: true,
      noCallHome: true,
    });

    stream.stdout.pipe(res);

    stream.stderr.on("data", (data) => {
      console.log(data.toString());
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Erro no download",
    });
  }
});

router.post("/info", async (req, res) => {
  const { url } = req.body;

  try {
    const info = await ytDlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
    });

    res.json({
      id: info.id,
      title: info.title,
      artist: info.uploader,
      duration: info.duration,
      thumbnail: info.thumbnail,
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar vídeo" });
  }
});

router.post("/search", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "É necessário informar o query" });
  }

  try {
    const results = await ytDlp(`ytsearch5:${query}`, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
    });

    const tracks = results.entries.map((item) => ({
      id: item.id,
      title: item.title,
      artist: item.uploader,
      duration: item.duration,
      thumbnail: item.thumbnail,
      url: item.webpage_url,
    }));

    res.json(tracks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar músicas" });
  }
});

module.exports = router;

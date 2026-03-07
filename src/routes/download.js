const express = require("express");
const downloadMusic = require("../services/downloader");
const ytDlp = require("yt-dlp-exec");


const router = express.Router();
router.get("/", (req, res) => { return res.send("Olá") })

router.post("/download", async (req, res) => {
  try {
    const { url } = req.body
    res.setHeader("Content-Disposition", "attachment; filename=music.mp3");
    res.setHeader("Content-Type", "audio/mpeg");

    const stream = ytDlp.exec(url, {
      extractAudio: true,
      audioFormat: "mp3",
      output: "-",
    });

    stream.stdout.pipe(res);
    /* res.json({
      success: true,
      message: "Download realizado"
    }); */
  } catch (error) {
    console.log(error)
    res.status(500).json({
      error: "Erro no download"
    });
  }
});

router.post("/info", async (req, res) => {
  const { url } = req.body;

  const ytDlp = require("yt-dlp-exec");

  try {
    const info = await ytDlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true
    });

    res.json({
      id: info.id,
      title: info.title,
      artist: info.uploader,
      duration: info.duration,
      thumbnail: info.thumbnail
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
    // Busca vídeos no YouTube
    const results = await ytDlp(`ytsearch5:${query}`, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
    });

    // ytDlp retorna { entries: [...] }
    const tracks = results.entries.map((item) => ({
      id: item.id,
      title: item.title,
      artist: item.uploader,
      duration: item.duration,
      thumbnail: item.thumbnail,
      url: item.webpage_url, // URL do YouTube
    }));

    res.json(tracks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar músicas" });
  }
});

module.exports = router;
import express from "express";
import File from "../models/File.js";
import Visitor from "../models/Visitor.js";
import { listSftpDirectory } from "../utils/sftpClient.js";

const router = express.Router();

// Liste les fichiers + met à jour le cache Mongo
router.get("/list", async (req, res) => {
  const path = req.query.path || "/";
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"];

  try {
    // Log visiteur
    await Visitor.create({ ip, userAgent, pathViewed: path });

    // Vérifie si on a déjà un cache récent (moins de 5 min)
    const recent = await File.findOne({ path }).sort({ syncDate: -1 });
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

    if (recent && recent.syncDate > fiveMinAgo) {
      const cachedFiles = await File.find({ path: new RegExp(`^${path}`) });
      return res.json({ source: "cache", files: cachedFiles });
    }

    // Sinon, fetch depuis le SFTP
    const files = await listSftpDirectory(path);

    // Supprime ancien cache
    await File.deleteMany({ path: new RegExp(`^${path}`) });
    await File.insertMany(files);

    res.json({ source: "sftp", files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

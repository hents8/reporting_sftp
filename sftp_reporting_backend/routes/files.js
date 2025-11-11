// routes/files.js
import express from "express";
import FileModel from "../models/File.js";

const router = express.Router();

router.get("/", async (req, res) => {
  let { path = "/" } = req.query;
  if (!path.startsWith("/")) path = "/" + path;
  if (path !== "/" && path.endsWith("/")) path = path.slice(0, -1);

  try {
    // Regex pour ne récupérer que les éléments directement sous `path`
    const regex = new RegExp(`^${path === "/" ? "" : path}/[^/]+$`);
    const files = await FileModel.find({ path: regex })
      .sort({ type: -1, name: 1 })
      .lean();

    console.log("🔹 Files pour path", path, files.map(f => f.path));
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

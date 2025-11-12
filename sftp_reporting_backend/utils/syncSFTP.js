// utils/syncSFTP.js
import fileSchema from "../models/File.js";
import { listRemoteFiles, downloadRemoteFile } from "../services/sftpService.js";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";


/**
 * Génère une miniature base64 pour les images
 */
async function generateImageThumbnail(buffer) {
  try {
    const thumbnailBuffer = await sharp(buffer)
      .resize(200, 200, { fit: "cover" })
      .jpeg({ quality: 70 })
      .toBuffer();
    return `data:image/jpeg;base64,${thumbnailBuffer.toString("base64")}`;
  } catch (err) {
    console.error("⚠️ Erreur génération miniature image :", err.message);
    return null;
  }
}

/**
 * Synchronise récursivement un dossier SFTP dans MongoDB
 */
export async function syncFolder(remotePath = "/POUR CLIENT") {
  if (!remotePath.startsWith("/")) remotePath = "/" + remotePath;
  if (remotePath !== "/" && remotePath.endsWith("/")) remotePath = remotePath.slice(0, -1);

  console.log(`📁 Lecture du dossier distant : ${remotePath}`);

  let files;
  try {
    files = await listRemoteFiles(remotePath);
  } catch (err) {
    console.error("❌ Erreur lecture SFTP :", err.message);
    return;
  }

  for (const f of files) {
    // extension pour fichiers seulement
    const rawExt = f.name.includes(".") && !f.name.startsWith(".")
      ? f.name.split(".").pop().toLowerCase()
      : "";

		// Détection fiable des dossiers
		let isDirectory = false;

		// 1️⃣ Si f.type est fourni par la lib SSH2
		if (f.type && f.type.toLowerCase() === "d") {
		  isDirectory = true;

		// 2️⃣ Sinon, si f.longname commence par "d" (ex: drwxr-xr-x)
		} else if (f.longname && f.longname.startsWith("d")) {
		  isDirectory = true;

		// 3️⃣ Si l’objet contient un flag ou un champ spécial (certains SFTP clients font ça)
		} else if (typeof f.attrs?.isDirectory === "function" && f.attrs.isDirectory()) {
		  isDirectory = true;

		// 4️⃣ Fallback final — mais uniquement si on est sûr que f.size === 4096 (souvent dossier Linux)
		} else if (!rawExt && f.size === 4096) {
		  isDirectory = true;
		}


    const extension = isDirectory ? "" : rawExt;
    const filePath = remotePath === "/" ? `/${f.name}` : `${remotePath}/${f.name}`;

    const file = {
      name: f.name,
      path: filePath,
      type: isDirectory ? "directory" : "file",
      size: isDirectory ? 0 : f.size || 0,
      extension,
      modified: isDirectory ? null : f.modifyTime,
      syncDate: new Date(),
      thumbnail: null // inutile si tu ne veux pas les thumbnails
    };

    // Génération miniature image (optionnel)
    if (!isDirectory && ["jpg","jpeg","png","gif","webp"].includes(extension)) {
      try {
        const buffer = await downloadRemoteFile(file.path);
        file.thumbnail = await generateImageThumbnail(buffer);
      } catch (err) {
        console.warn(`⚠️ Thumbnail failed for ${file.path}:`, err.message);
      }
    }

    // Sauvegarde dans MongoDB
    await fileSchema.updateOne({ path: file.path }, { $set: file }, { upsert: true });

    // Récursion pour dossiers
    if (isDirectory) {
      await syncFolder(file.path);
    }
  }

  console.log(`✅ Synchronisation terminée (${files.length} éléments) : ${remotePath}`);
}

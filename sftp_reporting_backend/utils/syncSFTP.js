// utils/syncSFTP.js
import FileModel from "../models/File.js";
import { listRemoteFiles } from "../services/sftpService.js";

/**
 * Synchronise récursivement un dossier SFTP dans MongoDB
 * @param {string} remotePath - chemin du dossier distant SFTP
 */
export async function syncFolder(remotePath = "/POUR CLIENT") {
  // Normalisation du chemin
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
    // Normalisation des propriétés
    const file = {
      name: f.name,
      path: remotePath === "/" ? `/${f.name}` : `${remotePath}/${f.name}`,
      type: f.type === "d" ? "directory" : "file",
      size: f.size,
      extension: f.type === "d" ? "" : f.name.split(".").pop().toLowerCase(),
      modified: f.modifyTime,
      syncDate: new Date()
    };

    // 🔄 Upsert dans MongoDB
    await FileModel.updateOne(
      { path: file.path },
      { $set: file },
      { upsert: true }
    );

    console.log(`✅ Synchronisé : ${file.path} [${file.type}]`);

    // 🔄 Récursion si dossier
    if (file.type === "directory") {
      await syncFolder(file.path);
    }
  }

  console.log(`✅ Synchronisation terminée pour ${files.length} éléments dans ${remotePath}`);
}

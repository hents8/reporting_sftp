import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import fileRoutes from "./routes/files.js";
import { connectSFTP } from "./services/sftpService.js";
import { syncFolder } from "./utils/syncSFTP.js"; // ✅ ajoute cette ligne

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connecté"))
  .catch(err => console.error("❌ Erreur MongoDB :", err));

// Connect SFTP au démarrage puis sync
connectSFTP()
  .then(async () => {
    console.log("📡 SFTP connecté");
    console.log("🚀 Lancement de la synchronisation SFTP...");
    await syncFolder("/sam_bebe/POUR_CLIENT"); // ✅ appel ici
  })
  .catch(err => console.error("❌ Erreur SFTP :", err));

// Routes API
app.use("/api/files", fileRoutes);

// Lancer serveur
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 Backend sur http://localhost:${port}`));

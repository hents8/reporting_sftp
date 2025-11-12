import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import fileSchema from "./models/File.js"; // adapte le chemin

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connecté");

    const result = await fileSchema.updateMany(
      { type: "file", extension: "" }, // pas d'extension → probable dossier
      { $set: { type: "directory", size: 0, modified: null } }
    );

    console.log(`✅ Documents mis à jour : ${result.modifiedCount}`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

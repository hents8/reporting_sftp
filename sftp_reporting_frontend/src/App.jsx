import React from "react";
import FileBrowser from "./components/FileBrowser";
import "./styles/App.css";

export default function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">📁 SFTP File Viewer</h1>
        <p className="app-subtitle">
          Visualisez et vérifiez les fichiers présents sur le serveur SFTP
        </p>
      </header>

      <main className="app-content">
        <FileBrowser />
      </main>

      <footer className="app-footer">
        <small>
          © {new Date().getFullYear()} - SFTP Reporting Dashboard
        </small>
      </footer>
    </div>
  );
}

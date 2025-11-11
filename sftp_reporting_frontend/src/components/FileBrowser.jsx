import React, { useEffect, useState, useMemo } from "react";
import "../styles/FileBrowser.css";

export default function FileBrowser() {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState("/sam_bebe/POUR_CLIENT");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [filter, setFilter] = useState({ name: "", type: "" });
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

const handleSort = (field) => {
  if (sortField === field) {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  } else {
    setSortField(field);
    setSortOrder("asc");
  }
};

const sortedFiles = [...files].sort((a, b) => {
  let valA, valB;

  if (sortField === "name") {
    valA = a.name.toLowerCase();
    valB = b.name.toLowerCase();
  } else if (sortField === "type") {
    valA = a.isDirectory ? "dossier" : (a.name.split('.').pop() || "").toLowerCase();
    valB = b.isDirectory ? "dossier" : (b.name.split('.').pop() || "").toLowerCase();
  } else if (sortField === "size") {
    valA = a.size || 0;
    valB = b.size || 0;
  } else if (sortField === "modified") {
    valA = new Date(a.modified);
    valB = new Date(b.modified);
  }

  if (valA < valB) return sortOrder === "asc" ? -1 : 1;
  if (valA > valB) return sortOrder === "asc" ? 1 : -1;
  return 0;
});


  // 🔁 Charger les fichiers depuis le backend
  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/files?path=${encodeURIComponent(currentPath)}`)
      .then((res) => res.json())
      .then((data) => {
        setFiles(data);
        setLoading(false);
        setSelected([]);
        setPage(1);
      })
      .catch((err) => {
        console.error("Erreur chargement fichiers :", err);
        setLoading(false);
      });
  }, [currentPath]);

  // 🧮 Conversion taille auto
  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return "—";
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const openFolder = (file) => {
    if (file.type === "directory") {
      setCurrentPath(file.path);
    }
  };

  const goBack = () => {
    if (currentPath === "/sam_bebe/POUR_CLIENT") return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    const parentPath = "/" + parts.join("/");
    setCurrentPath(parentPath || "/sam_bebe/POUR_CLIENT");
  };

  const toggleSelect = (path) => {
    setSelected((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const downloadZip = () => {
    if (selected.length === 0) return alert("Aucun fichier sélectionné !");
    alert(`📦 Téléchargement ZIP lancé pour ${selected.length} élément(s)`);
  };

  // 🔍 Filtres appliqués
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesName = f.name.toLowerCase().includes(filter.name.toLowerCase());
      const matchesType =
        !filter.type || f.type === filter.type || f.extension === filter.type;
      return matchesName && matchesType;
    });
  }, [files, filter]);

  // 📄 Pagination
  const totalPages = Math.ceil(filteredFiles.length / pageSize);
  const paginatedFiles = filteredFiles.slice((page - 1) * pageSize, page * pageSize);

  const changePage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  return (
    <div className="file-browser">
      {/* 🧭 Barre fixe en haut */}
      <div className="toolbar-header">
        <div className="toolbar-left">
          <button
            onClick={goBack}
            disabled={currentPath === "/sam_bebe/POUR_CLIENT"}
            className={`toolbar-button ${currentPath === "/sam_bebe/POUR_CLIENT" ? "disabled" : ""}`}
          >
            ⬅️ Retour
          </button>
          <h2 className="toolbar-title">{currentPath}</h2>
        </div>
        <div className="toolbar-right">
          <input
            type="text"
            placeholder="🔎 Filtrer par nom..."
            value={filter.name}
            onChange={(e) => setFilter({ ...filter, name: e.target.value })}
            className="filter-input"
          />
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="filter-select"
          >
            <option value="">Tous</option>
            <option value="directory">Dossier</option>
            <option value="file">Fichier</option>
            <option value="pdf">PDF</option>
            <option value="jpg">Image JPG</option>
            <option value="xlsx">Excel</option>
          </select>
          <button
            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
            className="toolbar-button"
          >
            {viewMode === "list" ? "🗂️ Vue grille" : "📋 Vue liste"}
          </button>
          <button onClick={downloadZip} className="toolbar-button">
            ⬇️ ZIP
          </button>
        </div>
      </div>

      {/* 🧾 Contenu */}
      <div className="content">
        {loading ? (
          <p className="loading-message">Chargement...</p>
        ) : paginatedFiles.length === 0 ? (
          <p className="empty-message">Aucun fichier trouvé</p>
        ) : viewMode === "list" ? (
          <table className="table">
            <thead>
              <tr className="table-header">
                <th>Sélection</th>
                <th>Nom</th>
                <th>Type</th>
                <th>Taille</th>
                <th>Modifié</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFiles.map((file) => (
                <tr
                  key={file.path}
                  onDoubleClick={() => openFolder(file)}
                  className="table-row"
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(file.path)}
                      onChange={() => toggleSelect(file.path)}
                    />
                  </td>
                  <td>{file.type === "directory" ? "📁" : "📄"} {file.name}</td>
                  <td>{file.type === "directory" ? "Dossier" : (file.extension || "—")}</td>
                  <td>{formatSize(file.size)}</td>
                  <td>
                    {file.modified
                      ? new Date(file.modified).toLocaleString("fr-FR")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="grid">
            {paginatedFiles.map((file) => (
              <div
                key={file.path}
                onDoubleClick={() => openFolder(file)}
                className="grid-item"
              >
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={selected.includes(file.path)}
                  onChange={() => toggleSelect(file.path)}
                />
                <div className="icon">{file.type === "directory" ? "📁" : "📄"}</div>
                <div className="name">{file.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📄 Pagination */}
      <div className="pagination">
        <button onClick={() => changePage(page - 1)} disabled={page <= 1}>
          ⬅️ Précédent
        </button>
        <span>Page {page} / {totalPages || 1}</span>
        <button onClick={() => changePage(page + 1)} disabled={page >= totalPages}>
          Suivant ➡️
        </button>
      </div>
    </div>
  );
}

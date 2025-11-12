import React, { useEffect, useState, useMemo } from "react";
import "../styles/FileBrowser.css";

export default function FileBrowser() {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState("/sam_bebe/POUR_CLIENT");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [filter, setFilter] = useState({ name: "" });
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const pageSize = 50;

  // 📡 Charger les fichiers
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

  // 🧮 Conversion taille lisible
  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return "—";
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const openFolder = (file) => {
    if (file.type === "directory") setCurrentPath(file.path);
  };

  const goBack = () => {
    if (currentPath === "/sam_bebe/POUR_CLIENT") return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    setCurrentPath("/" + parts.join("/") || "/sam_bebe/POUR_CLIENT");
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

  // 🔍 Filtrage
  const filteredFiles = useMemo(() => {
    return files.filter((f) =>
      f.name.toLowerCase().includes(filter.name.toLowerCase())
    );
  }, [files, filter]);

  // 🔽 Tri
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let valA, valB;
    if (sortField === "name") {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
    } else if (sortField === "type") {
      valA = a.type === "directory" ? "dossier" : (a.extension || "").toLowerCase();
      valB = b.type === "directory" ? "dossier" : (b.extension || "").toLowerCase();
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

  // 📄 Pagination
  const totalPages = Math.ceil(sortedFiles.length / pageSize);
  const paginatedFiles = sortedFiles.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="file-browser">
      {/* 🧭 Header fixe */}
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
          <button
            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
            className="toolbar-button"
          >
            {viewMode === "list" ? "🗂️ Grille" : "📋 Liste"}
          </button>
          <button onClick={downloadZip} className="toolbar-button">⬇️ ZIP</button>
        </div>
      </div>

      {/* 📁 Contenu */}
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
                <th onClick={() => handleSort("name")} className="sortable">
                  Nom {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => handleSort("type")} className="sortable">
                  Type {sortField === "type" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => handleSort("size")} className="sortable">
                  Taille {sortField === "size" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => handleSort("modified")} className="sortable">
                  Modifié {sortField === "modified" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
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
          <div className="grid-view">
  {files.map((file) => {
    const isSelected = selected.includes(file.path);
    return (
			 <div
				  key={file.path}
				  onDoubleClick={() => openFolder(file)}
				  className={`grid-item ${isSelected ? "selected" : ""}`}
				>
				  <div className="grid-icon">
					{file.thumbnail ? (
					  <img
						src={file.thumbnail}
						alt={file.name}
						className="thumbnail-img"
					  />
					) : file.type === "directory" ? (
					  "📁"
					) : (
					  "📄"
					)}
				  </div>

				  <div className="grid-info">
					<div className="file-name">{file.name}</div>
					<div className="file-meta">
					  {file.type === "directory"
						? "Dossier"
						: file.extension
						? file.extension?.toUpperCase()
					    :"-"}
					  {file.size
						? file.size > 1048576
						  ? `${(file.size / 1048576).toFixed(1)} Mo`
						  : `${(file.size / 1024).toFixed(0)} Ko`
						: "—"}
					</div>
				  </div>

				  <input
					type="checkbox"
					className="checkbox-overlay"
					checked={isSelected}
					onChange={() => toggleSelect(file.path)}
				  />
				</div>
			);
		  })}
		</div>
        )}
      </div>

      {/* 📄 Pagination */}
      <div className="pagination">
        <button onClick={() => setPage(page - 1)} disabled={page <= 1}>
          ⬅️ Précédent
        </button>
        <span>Page {page} / {totalPages || 1}</span>
        <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
          Suivant ➡️
        </button>
      </div>
    </div>
  );
}

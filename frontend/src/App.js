import React, { useEffect, useState } from "react";
import { uploadImage, fetchDetections, API_BASE } from "./api";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  async function loadHistory() {
    try {
      const rows = await fetchDetections();
      setHistory([...rows].reverse()); // newest first
    } catch (err) {
      console.error(err);
      setError("Failed to load history");
    }
  }

  useEffect(() => { loadHistory(); }, []);

  async function handleUpload(e) {
    e.preventDefault();
    setError("");
    if (!file) return;
    setUploading(true);
    try {
      const data = await uploadImage(file);
      setLatest(data);
      await loadHistory();
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const annotatedUrl = (row) =>
    row.annotated_image_url
      ? row.annotated_image_url
      : `${API_BASE}/${(row.annotated_image || "").replace(/\\/g, "/")}`;

  return (
    <div className="container">
      <div className="header">
        <h1>Object Detection</h1>
        <span className="small">API: {API_BASE}</span>
      </div>

      <div className="card">
        <form onSubmit={handleUpload} className="grid" style={{ gridTemplateColumns: "1fr auto" }}>
          <input
            className="input"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button className="btn" disabled={!file || uploading}>
            {uploading ? "Uploading..." : "Upload & Detect"}
          </button>
        </form>
        {error && <div className="error">{error}</div>}
      </div>

      {latest && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>Latest Result</h2>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <div><b>Filename:</b> {latest.filename}</div>
              <div style={{ marginTop: 8 }}>
                <b>Detections:</b>
                <pre>{JSON.stringify(latest.detections, null, 2)}</pre>
              </div>
            </div>
            <div>
              {latest.annotated_image && (
                <>
                  <div className="small">Annotated Image</div>
                  <img className="img" src={annotatedUrl(latest)} alt="annotated" />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>History</h2>
        {history.length === 0 && <div className="small">No records yet.</div>}
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {history.map((row) => (
            <div key={row.id} className="history-card">
              <div><b>#{row.id}</b></div>
              <div className="small">{row.filename}</div>
              {row.annotated_image && (
                <img className="img thumb" src={annotatedUrl(row)} alt={`annotated-${row.id}`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;

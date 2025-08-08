import React, { useRef, useState } from "react";
import "./upload.css";

export default function UploadBox({ onUpload }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const go = async () => {
    if (!file || !onUpload) return;
    setBusy(true); setError("");
    try {
      await onUpload(file);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      setError(e.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="upload">
      <div
        className={`drop ${dragOver ? "drag" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={(e) => {
          if (!e.target.closest("button")) inputRef.current?.click();
        }}
      >
        <div className="icon">⬆️</div>
        <div className="title">Upload Image</div>
        <div className="sub">Drag & drop an image here, or click to select</div>
        <div className="sub small">Supports JPG, PNG</div>

        <button
          className="ghost"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          type="button"
        >
          {file ? `Selected: ${file.name}` : "Choose Image"}
        </button>
        <input
          ref={inputRef}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          type="file"
          accept="image/*"
          hidden
        />

        <button className="primary" onClick={go} disabled={!file || busy}>
          {busy ? "Uploading..." : "Upload & Detect"}
        </button>

        {error && <div className="error">{error}</div>}
      </div>
    </section>
  );
}

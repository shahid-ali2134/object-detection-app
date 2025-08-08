import React, { useEffect, useState } from "react";
import { uploadImage, fetchDetections, API_BASE } from "./api";
import BackgroundFX from "./components/BackgroundFX";
import Hero from "./components/Hero";
import Features from "./components/Features";
import UploadBox from "./components/UploadBox";
import ResultsPanel from "./components/ResultsPanel";
import HistoryGrid from "./components/HistoryGrid";
import "./App.css";

export default function App() {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);

  async function loadHistory() {
    try {
      const rows = await fetchDetections();
      setHistory(rows.slice().reverse());
    } catch {
      setHistory([]);
    }
  }

  useEffect(() => { loadHistory(); }, []);

  async function handleUpload(file) {
    const data = await uploadImage(file);
    setLatest(data);
    await loadHistory();
  }

  return (
    <div className="page">
      <BackgroundFX />
      <Hero />
      <Features />
      <UploadBox onUpload={handleUpload} />
      <ResultsPanel latest={latest} />
      <HistoryGrid rows={history} />
      <footer className="footer"><span className="muted small">API: {API_BASE}</span></footer>
    </div>
  );
}

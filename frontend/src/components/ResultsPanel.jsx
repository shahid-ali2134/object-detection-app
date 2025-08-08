import React from "react";
import { API_BASE } from "../api";
import "./result.css";

export default function ResultsPanel({ latest }) {
  if (!latest) return null;

  const annotatedUrl = latest.annotated_image_url
    ? latest.annotated_image_url
    : `${API_BASE}/${(latest.annotated_image || "").replace(/\\/g, "/")}`;

  return (
    <section className="result">
      <div className="panels">
        <div className="left">
          <h3>Latest Result</h3>
          <div className="muted">Filename: {latest.filename}</div>
          <pre className="json">{JSON.stringify(latest.detections, null, 2)}</pre>
        </div>
        <div className="right">
          <div className="right-title">Annotated Image</div>
          {latest.annotated_image && (
            <img className="image" src={annotatedUrl} alt="annotated" />
          )}
        </div>
      </div>
    </section>
  );
}

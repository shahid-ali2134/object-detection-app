import React from "react";
import { API_BASE } from "../api";
import "./history.css";

export default function HistoryGrid({ rows }) {
  return (
    <section className="history">
      <h3>History</h3>
      <div className="grid">
        {rows?.length ? (
          rows.map((row) => {
            const url = row.annotated_image_url
              ? row.annotated_image_url
              : `${API_BASE}/${(row.annotated_image || "").replace(/\\/g, "/")}`;
            return (
              <div key={row.id} className="card">
                <div className="muted">#{row.id}</div>
                <div className="muted small">{row.filename}</div>
                {row.annotated_image && <img className="thumb" src={url} alt={`annotated-${row.id}`} />}
              </div>
            );
          })
        ) : (
          <div className="muted">No records yet.</div>
        )}
      </div>
    </section>
  );
}

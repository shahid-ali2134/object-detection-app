import React from "react";
import "./features.css";

const items = [
  { icon: "👁️", title: "Real-time Detection", text: "Fast and accurate object detection using state-of-the-art models." },
  { icon: "⚡", title: "Lightning Fast", text: "Process images in seconds with an optimized inference pipeline." },
  { icon: "🧩", title: "Smart Analysis", text: "Detailed annotations with confidence scores and classes." },
];

export default function Features() {
  return (
    <section className="features">
      {items.map((it) => (
        <div key={it.title} className="feature-card">
          <div className="feature-icon">{it.icon}</div>
          <div className="feature-title">{it.title}</div>
          <div className="feature-text">{it.text}</div>
        </div>
      ))}
    </section>
  );
}

import React from "react";
import "./hero.css";

export default function Hero() {
  return (
    <header className="hero">
      <div className="hero-wrap">
        <div className="title-row">
          <div className="badge pulse">
            {/* replace /brain.png with your own icon file in /public if you like */}
            <img src="/brain.png" alt="AI" />
          </div>
          <h1 className="hero-title">
            <span>AI Object Detection</span>
          </h1>
        </div>

        <p className="hero-tag">
          Advanced computer vision powered by deep learning. Upload any image and
          let our AI identify and annotate objects with precision.
        </p>

        <div className="hero-image">
          {/* hero banner at the top (put your file at /public/hero.jpg) */}
          <img src="/hero.jpg" alt="AI visualization" />
        </div>
      </div>
    </header>
  );
}

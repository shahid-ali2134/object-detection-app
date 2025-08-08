import React, { useEffect, useRef } from "react";
import "./bgfx.css";

export default function BackgroundFX() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    let w = (c.width = window.innerWidth);
    let h = (c.height = 1000); // tall enough for page
    const dots = Array.from({ length: 40 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2 + 0.6,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    }));

    function draw() {
      ctx.clearRect(0, 0, w, h);
      // soft gradient wash
      const grad = ctx.createRadialGradient(w * 0.2, 120, 60, w * 0.8, 300, 800);
      grad.addColorStop(0, "rgba(0, 200, 255, 0.06)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "rgba(120, 200, 255, 0.35)";
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    draw();

    const onResize = () => { w = c.width = window.innerWidth; h = c.height = 1000; };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return <canvas ref={canvasRef} className="bgfx-canvas" aria-hidden />;
}

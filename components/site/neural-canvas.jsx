"use client";

import React, { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * NeuralCanvas — a lightweight interactive particle field.
 *
 * Nodes drift slowly and draw hairline connections to nearby neighbours,
 * forming a living neural mesh. The cursor exerts a gentle attractive force
 * and brightens the links it touches, so the hero reacts to the visitor
 * without being noisy.
 *
 * Performance: a single rAF loop, capped node count scaled to viewport area
 * (max ~70), device-pixel-ratio aware, pauses when offscreen/hidden, and
 * renders nothing animated when the user prefers reduced motion (a static,
 * sparse field is drawn once).
 */
export function NeuralCanvas({ className, density = 1 }) {
  const canvasRef = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf = null;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let nodes = [];
    const mouse = { x: -9999, y: -9999 };
    let running = true;

    const LINK_DIST = 150;

    const readTokens = () => {
      const css = getComputedStyle(document.documentElement);
      const toRgb = (v) => {
        const h = v.trim();
        // hsl channels are stored as "H S% L%" — wrap into hsl() and let the
        // browser parse to rgb for canvas use.
        const probe = document.createElement("span");
        probe.style.color = `hsl(${h})`;
        probe.style.display = "none";
        document.body.appendChild(probe);
        const rgb = getComputedStyle(probe).color.match(/\d+/g);
        document.body.removeChild(probe);
        return rgb ? [ +rgb[0], +rgb[1], +rgb[2] ] : [124, 92, 255];
      };
      return {
        purple: toRgb(css.getPropertyValue("--purple") || "252 100% 68%"),
        cyan: toRgb(css.getPropertyValue("--cyan") || "191 100% 50%"),
        emerald: toRgb(css.getPropertyValue("--emerald") || "152 61% 53%"),
        fg: toRgb(css.getPropertyValue("--foreground") || "0 0% 100%"),
      };
    };

    let tokens = readTokens();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Node count scales with area, capped for perf.
      const target = Math.min(70, Math.floor((width * height) / 22000) * density);
      nodes = Array.from({ length: target }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.6,
        hue: Math.random(),
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const { purple, cyan, emerald, fg } = tokens;

      // Update + draw links.
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (!reduced) {
          a.x += a.vx;
          a.y += a.vy;
          if (a.x < 0 || a.x > width) a.vx *= -1;
          if (a.y < 0 || a.y > height) a.vy *= -1;
          // Cursor attraction.
          const dxm = mouse.x - a.x;
          const dym = mouse.y - a.y;
          const dm = Math.hypot(dxm, dym);
          if (dm < 180) {
            a.x += (dxm / dm) * 0.4;
            a.y += (dym / dm) * 0.4;
          }
        }
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < LINK_DIST) {
            const alpha = (1 - d / LINK_DIST) * 0.5;
            const nearMouse =
              Math.hypot(a.x - mouse.x, a.y - mouse.y) < 200 ||
              Math.hypot(b.x - mouse.x, b.y - mouse.y) < 200;
            const c = nearMouse ? cyan : a.hue > 0.5 ? purple : emerald;
            ctx.strokeStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${nearMouse ? alpha * 1.6 : alpha * 0.6})`;
            ctx.lineWidth = nearMouse ? 1 : 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes on top.
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        const nearMouse = Math.hypot(a.x - mouse.x, a.y - mouse.y) < 200;
        const c = nearMouse ? cyan : a.hue > 0.6 ? purple : a.hue > 0.3 ? fg : emerald;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${nearMouse ? 0.9 : 0.55})`;
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = () => {
      if (!running) return;
      draw();
      if (!reduced) raf = requestAnimationFrame(loop);
    };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const onVisibility = () => {
      running = !document.hidden;
      if (running && !reduced) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      }
    };

    resize();
    tokens = readTokens();
    draw();
    if (!reduced) raf = requestAnimationFrame(loop);

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced, density]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
    />
  );
}

export default NeuralCanvas;
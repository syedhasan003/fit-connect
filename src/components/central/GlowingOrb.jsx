import { useEffect, useRef } from "react";

export default function GlowingOrb({ loading = false }) {
  const canvasRef = useRef(null);
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    let t = 0;
    let id;

    // Particle ring — tight, dark, orbiting
    const PARTICLES = 60;
    const particles = Array.from({ length: PARTICLES }, (_, i) => ({
      angle: (i / PARTICLES) * Math.PI * 2,
      radius: 38 + Math.random() * 24, // tight band 38-62
      speed: 0.3 + Math.random() * 0.4,
      size: 1.2 + Math.random() * 1.8,
      opacity: 0.4 + Math.random() * 0.4,
    }));

    function draw() {
      ctx.clearRect(0, 0, W, H);

      const pulse = Math.sin(t * 1.8) * 0.08 + 1; // subtle breathing
      const isThinking = loadingRef.current;
      const coreSize = isThinking ? 52 * pulse : 46 * pulse;
      const coreGlow = isThinking ? 72 : 64;

      // ─── 1. OUTER AMBIENT (very subtle, dark) ───
      const amb = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90);
      amb.addColorStop(0, "rgba(120, 140, 255, 0.06)");
      amb.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = amb;
      ctx.fillRect(0, 0, W, H);

      // ─── 2. PARTICLE RING ───
      particles.forEach((p) => {
        p.angle += p.speed * 0.012 * (isThinking ? 1.6 : 1);
        const wobble = Math.sin(t * 2 + p.angle * 3) * 4;
        const x = cx + (p.radius + wobble) * Math.cos(p.angle);
        const y = cy + (p.radius + wobble) * Math.sin(p.angle);
        const flicker = p.opacity + Math.sin(t * 3 + p.angle) * 0.12;

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = isThinking
          ? `rgba(140, 160, 255, ${flicker})`
          : `rgba(180, 190, 255, ${flicker})`;
        ctx.fill();
      });

      // ─── 3. CORE GLOW (mid layer — the visible mass) ───
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreGlow);
      core.addColorStop(0, isThinking
        ? `rgba(160, 180, 255, ${0.55 + Math.sin(t * 2.5) * 0.1})`
        : `rgba(200, 210, 255, 0.45)`);
      core.addColorStop(0.4, isThinking
        ? "rgba(100, 130, 255, 0.3)"
        : "rgba(140, 160, 255, 0.22)");
      core.addColorStop(0.75, "rgba(60, 80, 200, 0.08)");
      core.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, coreGlow, 0, Math.PI * 2);
      ctx.fillStyle = core;
      ctx.fill();

      // ─── 4. BRIGHT CENTRE (the hot point) ───
      const hot = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize);
      hot.addColorStop(0, isThinking
        ? `rgba(230, 235, 255, ${0.85 + Math.sin(t * 3) * 0.1})`
        : "rgba(220, 225, 255, 0.75)");
      hot.addColorStop(0.35, isThinking
        ? "rgba(150, 170, 255, 0.5)"
        : "rgba(170, 185, 255, 0.35)");
      hot.addColorStop(1, "rgba(80, 100, 200, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, coreSize, 0, Math.PI * 2);
      ctx.fillStyle = hot;
      ctx.fill();

      // ─── 5. SPECULAR HIGHLIGHT (top-left, like a sphere) ───
      const spec = ctx.createRadialGradient(cx - 10, cy - 12, 0, cx - 10, cy - 12, 18);
      spec.addColorStop(0, "rgba(255, 255, 255, 0.28)");
      spec.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.beginPath();
      ctx.arc(cx - 10, cy - 12, 18, 0, Math.PI * 2);
      ctx.fillStyle = spec;
      ctx.fill();

      t += 0.016;
      id = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        style={{ display: "block" }}
      />
    </div>
  );
}
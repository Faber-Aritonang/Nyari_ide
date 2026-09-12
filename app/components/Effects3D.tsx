"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/* ============================================================
   AURORA BACKGROUND — fixed animated gradient blobs + grid
   ============================================================ */

export function AuroraBackground({ grid = true }: { grid?: boolean }) {
  return (
    <>
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
      </div>
      {grid && <div className="grid-overlay" aria-hidden="true" />}
    </>
  );
}

/* ============================================================
   HERO BACKDROP — global subtle image background layer.
   Renders nothing if /images/bg-hero.webp is not present.
   ============================================================ */

let heroImageChecked = false;
let heroImageExists = false;

export function HeroBackdrop() {
  const [available, setAvailable] = useState<boolean | null>(
    heroImageChecked ? heroImageExists : null
  );

  useEffect(() => {
    if (heroImageChecked) return;
    const img = new Image();
    img.onload = () => {
      heroImageExists = true;
      heroImageChecked = true;
      setAvailable(true);
    };
    img.onerror = () => {
      heroImageExists = false;
      heroImageChecked = true;
      setAvailable(false);
    };
    img.src = "/images/bg-hero.webp";
  }, []);

  if (available === null) return null; // avoid flash while probing
  if (!available) return null; // image not added yet
  return <div className="bg-hero-image" aria-hidden="true" />;
}

/* ============================================================
   PARTICLES — lightweight CSS-animated floating dots
   ============================================================ */

interface ParticleSpec {
  left: string;
  size: number;
  duration: string;
  delay: string;
  drift: string;
}

export function ParticleField({ count = 24 }: { count?: number }) {
  const particles = useMemo<ParticleSpec[]>(
    () =>
      Array.from({ length: count }, (_, i) => {
        const seed = (i * 2654435761) % 1000;
        const rand = (n: number) => ((seed * (n + 3)) % 97) / 97;
        return {
          left: `${rand(1) * 100}%`,
          size: 2 + rand(2) * 4,
          duration: `${14 + rand(3) * 18}s`,
          delay: `${-rand(4) * 24}s`,
          drift: `${(rand(5) - 0.5) * 160}px`,
        };
      }),
    [count]
  );

  return (
    <div className="particles" aria-hidden="true">
      {particles.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={
            {
              left: p.left,
              width: p.size,
              height: p.size,
              animationDuration: p.duration,
              animationDelay: p.delay,
              "--drift": p.drift,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* ============================================================
   TILT CARD — interactive 3D tilt that follows the cursor,
   with a mouse-tracked glass shine. Falls back to flat on touch.
   ============================================================ */

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number; // degrees
  glare?: boolean;
}

export function TiltCard({
  children,
  className = "",
  maxTilt = 10,
  glare = true,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});
  const [shine, setShine] = useState<CSSProperties>({});

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1
    const rotateY = (px - 0.5) * 2 * maxTilt;
    const rotateX = (0.5 - py) * 2 * maxTilt;
    setStyle({
      transform: `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`,
    });
    if (glare) {
      setShine({ "--shine-x": `${px * 100}%`, "--shine-y": `${py * 100}%` } as CSSProperties);
    }
  }

  function handleLeave() {
    setStyle({ transform: "rotateX(0deg) rotateY(0deg)" });
  }

  return (
    <div className="scene-3d">
      <div
        ref={ref}
        className={`tilt-3d relative ${className}`}
        style={style}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        {children}
        {glare && <div className="tilt-shine" style={shine} />}
      </div>
    </div>
  );
}

/* ============================================================
   HOLO CUBE — slowly rotating 3D wireframe cube (pure CSS 3D)
   ============================================================ */

export function HoloCube({ size = 72 }: { size?: number }) {
  const faces = ["front", "back", "right", "left", "top", "bottom"] as const;
  const half = size / 2;
  const transforms: Record<(typeof faces)[number], string> = {
    front: `translateZ(${half}px)`,
    back: `rotateY(180deg) translateZ(${half}px)`,
    right: `rotateY(90deg) translateZ(${half}px)`,
    left: `rotateY(-90deg) translateZ(${half}px)`,
    top: `rotateX(90deg) translateZ(${half}px)`,
    bottom: `rotateX(-90deg) translateZ(${half}px)`,
  };

  return (
    <div
      className="scene-3d float-3d"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div
        style={
          {
            width: size,
            height: size,
            position: "relative",
            transformStyle: "preserve-3d",
            animation: "holo-spin 14s linear infinite",
          } as CSSProperties
        }
      >
        {faces.map((face) => (
          <div
            key={face}
            className="absolute inset-0 border border-neon-3/40 bg-neon-1/5 backdrop-blur-[2px]"
            style={{ transform: transforms[face] }}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   CURSOR GLOW — neon dot + trailing ring that follows the mouse
   (desktop only, respects prefers-reduced-motion)
   ============================================================ */

export function CursorGlow() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let tx = -100;
    let ty = -100;
    let rx = -100;
    let ry = -100;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${tx}px, ${ty}px)`;
      }
    };

    const loop = () => {
      rx += (tx - rx) * 0.16;
      ry += (ty - ry) * 0.16;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${rx}px, ${ry}px)`;
      }
      raf = requestAnimationFrame(loop);
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const interactive = !!target?.closest(
        "a, button, input, textarea, select, label, [role=\"button\"]"
      );
      layerRef.current?.classList.toggle("is-hovering", interactive);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={layerRef} className="cursor-glow-layer" aria-hidden="true">
      <div ref={ringRef} className="cursor-glow-ring" />
      <div ref={dotRef} className="cursor-glow-dot" />
    </div>
  );
}

/* ============================================================
   TYPING INDICATOR — animated neon dots while AI streams
   ============================================================ */

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5" aria-label="AI is thinking">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}

/* ============================================================
   COUNTER — animated number count-up for stats
   ============================================================ */

export function CountUp({
  value,
  duration = 900,
  suffix = "",
}: {
  value: number;
  duration?: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span>
      {display.toLocaleString("id-ID")}
      {suffix}
    </span>
  );
}

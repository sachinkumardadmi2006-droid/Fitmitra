"use client";

import { useRef } from "react";
import { Leaf, Zap } from "lucide-react";

export default function HeroScene() {
  const sceneRef = useRef(null);

  function handleMove(e) {
    if (e.pointerType === "touch") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = sceneRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${x * 12}deg`);
    el.style.setProperty("--rx", `${-y * 12}deg`);
  }

  function handleLeave() {
    const el = sceneRef.current;
    if (!el) return;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
  }

  return (
    <div className="scene-wrap" onPointerMove={handleMove} onPointerLeave={handleLeave}>
      <div className="scene food-showcase" ref={sceneRef}>
        {/* Ambient Ring / Aura Glow */}
        <div className="scene-ring" aria-hidden="true" />
        <div className="food-showcase-glow" aria-hidden="true" />

        {/* Centerpiece Showcase: Chocolate Protein Oats Bowl */}
        <div className="scene-card food-showcase-main">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero_showcase.jpg"
            alt="Chocolate Protein Oats Bowl with fresh bananas, nuts, and chia seeds"
            className="food-main-img"
          />

          {/* Top Pill on Main Photo */}
          <div className="food-main-badge">
            <span className="food-main-badge-dot" />
            <span>Stall Bestseller</span>
          </div>

          {/* Bottom Card Caption */}
          <div className="food-main-caption">
            <div className="food-main-caption-head">
              <h3>Chocolate Protein Oats Bowl</h3>
              <span className="food-main-price">?89</span>
            </div>
            <p>Creamy oats ? Sliced bananas ? Almonds ? Dark chocolate</p>
          </div>
        </div>

        {/* Floating Mini Card 1: Nightfuel Protein Bowl */}
        <div className="food-mini-card food-mini-top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/nightout_protein_meal.png"
            alt="Nightfuel Protein Bowl"
            className="food-mini-img"
          />
          <div className="food-mini-info">
            <span className="food-mini-tag">Evening Bowl</span>
            <h4>Nightfuel Protein Bowl</h4>
            <span className="food-mini-price">?79</span>
          </div>
        </div>

        {/* Floating Mini Card 2: Fresh Sandwiches */}
        <div className="food-mini-card food-mini-bottom">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/peanut_banana_sandwich.png"
            alt="Fresh Whole-Wheat Sandwiches"
            className="food-mini-img"
          />
          <div className="food-mini-info">
            <span className="food-mini-tag">Fresh Sandwich</span>
            <h4>Whole-Wheat Sandwiches</h4>
            <span className="food-mini-sub">PB &amp; Banana ? Fruit</span>
          </div>
        </div>

        {/* Floating Label 1: Freshly Prepared */}
        <div className="food-floating-chip chip-fresh">
          <Leaf size={16} />
          <span>Freshly Prepared</span>
        </div>

        {/* Floating Label 2: Protein Packed */}
        <div className="food-floating-chip chip-protein">
          <Zap size={16} />
          <span>Protein Packed</span>
        </div>
      </div>
    </div>
  );
}

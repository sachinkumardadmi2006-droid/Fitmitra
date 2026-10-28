"use client";

import { useRef } from "react";
import { Phone, Clock, MapPin } from "lucide-react";
import siteData from "@/data/siteData";
import ShakeIllustration from "./ShakeIllustration";

const ICONS = { Phone, Clock, MapPin };

export default function HeroScene() {
  const sceneRef = useRef(null);
  const { hero } = siteData;
  const usePhoto = !hero.image.includes("placeholder");

  function handleMove(e) {
    if (e.pointerType === "touch") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = sceneRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${x * 14}deg`);
    el.style.setProperty("--rx", `${-y * 14}deg`);
  }

  function handleLeave() {
    const el = sceneRef.current;
    if (!el) return;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
  }

  return (
    <div className="scene-wrap" onPointerMove={handleMove} onPointerLeave={handleLeave}>
      <div className="scene" ref={sceneRef}>
        <div className="scene-ring" aria-hidden="true" />
        <div className="scene-card">
          {usePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero.image} alt="Fresh protein meals and shakes from Nexvyro Fitness" />
          ) : (
            <ShakeIllustration />
          )}
        </div>
        {hero.chips.map((chip, i) => {
          const Icon = ICONS[chip.icon];
          return (
            <div key={chip.text} className={`scene-chip chip-${i + 1}`}>
              {Icon ? <Icon size={18} /> : null}
              <span>{chip.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

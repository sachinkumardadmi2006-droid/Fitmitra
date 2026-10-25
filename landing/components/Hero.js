import { Phone } from "lucide-react";
import siteData from "@/data/siteData";
import HeroScene from "./HeroScene";

export default function Hero() {
  const { hero, location, contact } = siteData;
  return (
    <section id="top" className="hero">
      <div className="hero-bg" aria-hidden="true">
        {hero.backgroundImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="hero-bg-img" src={hero.backgroundImage} alt="" />
        ) : null}
        {hero.videoUrl ? (
          <video
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={hero.videoPoster || undefined}
          >
            <source src={hero.videoUrl} type="video/mp4" />
          </video>
        ) : null}
        <span className="blob blob-1" />
        <span className="blob blob-2" />
        <span className="blob blob-3" />
        <span className="hero-dots" />
      </div>

      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">{`Now open opposite ${location.gymName}, Mangalore`}</span>
          <h1 className="hero-title">
            {hero.headlineStart} <span className="gradient-text">{hero.headlineHighlight}</span>
          </h1>
          <p className="hero-sub">{hero.subtext}</p>
          <div className="hero-actions">
            <a className="btn btn-accent" href={`tel:${contact.phoneRaw}`}>
              <Phone size={20} />
              Call to Pre-order
            </a>
            <a className="btn btn-tonal" href="#menu">
              View Menu
            </a>
          </div>
          <ul className="hero-badges">
            {hero.badges.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
        <HeroScene />
      </div>
    </section>
  );
}

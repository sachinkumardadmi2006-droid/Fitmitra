import Link from "next/link";
import Reveal from "@/components/Reveal";
import siteData from "@/data/siteData";
import {
  Dumbbell,
  Bot,
  Zap,
  PieChart,
  ShoppingBag,
  TrendingUp,
  Smartphone,
  Sparkles,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

const iconMap = {
  Dumbbell,
  Bot,
  Zap,
  PieChart,
  ShoppingBag,
  TrendingUp,
};

export default function FitnessApp() {
  const { app } = siteData;
  if (!app) return null;

  return (
    <section id="app" className="section section-app">
      <div className="container">
        {/* Section Header */}
        <Reveal className="section-header">
          <p className="eyebrow">{app.badge}</p>
          <h2 className="section-title">{app.name}</h2>
          <p className="section-sub">{app.tagline}</p>
        </Reveal>

        {/* Showcase Banner with Image & Stats */}
        <Reveal delay={60}>
          <div className="app-showcase-panel">
            <div className="app-preview-visual">
              <div className="app-image-wrap">
                <img
                  src={app.image || "/images/app-preview.jpg"}
                  alt="FitMitra Mobile Fitness App interface preview"
                  className="app-mockup-img"
                  loading="lazy"
                />
                <div className="app-floating-badge badge-points">
                  <Zap size={16} />
                  <span>+5 ⚡ Reward Points</span>
                </div>
                <div className="app-floating-badge badge-ai">
                  <Bot size={16} />
                  <span>AI Coach: ಕನ್ನಡ + English</span>
                </div>
              </div>
            </div>

            <div className="app-overview-content">
              <span className="app-pill-tag">
                <Smartphone size={14} /> Mobile Companion App
              </span>
              <h3 className="app-overview-title">
                Everything you need to train, track, and fuel up — all in one native app.
              </h3>
              <p className="app-overview-text">{app.description}</p>

              <div className="app-stats-row">
                {app.stats.map((s, idx) => (
                  <div key={idx} className="app-stat-card">
                    <span className="app-stat-value">{s.value}</span>
                    <span className="app-stat-label">{s.label}</span>
                  </div>
                ))}
              </div>

              <div className="app-perks-list">
                <div className="app-perk-item">
                  <CheckCircle size={16} />
                  <span>Direct sync with our gym stall pickup queue</span>
                </div>
                <div className="app-perk-item">
                  <CheckCircle size={16} />
                  <span>Redeem workout points for meal &amp; shake discounts</span>
                </div>
                <div className="app-perk-item">
                  <CheckCircle size={16} />
                  <span>Built-in Shiprocket live courier tracking for supplements</span>
                </div>
              </div>

              <div className="app-cta-row">
                <Link href="/app" className="btn btn-primary app-explore-btn">
                  <span>Explore Now</span>
                  <ArrowRight size={18} />
                </Link>
                <a href="#supplements" className="btn btn-outline app-waitlist-btn">
                  <span>Join Early Access</span>
                </a>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Detailed 6-Feature Grid */}
        <div className="app-features-grid">
          {app.features.map((feat, idx) => {
            const Icon = iconMap[feat.icon] || Dumbbell;
            return (
              <Reveal key={idx} delay={idx * 60}>
                <div className="app-feature-card card">
                  <div className="app-feature-icon-box">
                    <Icon size={24} />
                  </div>
                  <h4 className="app-feature-title">{feat.title}</h4>
                  <p className="app-feature-desc">{feat.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Dedicated Page Callout Banner */}
        <Reveal delay={120}>
          <div className="app-banner-card">
            <div className="app-banner-info">
              <span className="app-banner-tag">Native App Deep Dive</span>
              <h3 className="app-banner-title">Want to see all screens, interactive flows &amp; tech specs?</h3>
              <p className="app-banner-sub">
                Explore our full mobile companion experience — workout logger, bilingual Kannada coach, points wallet, and live order tracking.
              </p>
            </div>
            <Link href="/app" className="btn btn-primary app-banner-btn">
              <span>Explore FitMitra App</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

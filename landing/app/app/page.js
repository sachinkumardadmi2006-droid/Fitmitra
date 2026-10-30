import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StickyCallBar from "@/components/StickyCallBar";
import Reveal from "@/components/Reveal";
import siteData from "@/data/siteData";
import Link from "next/link";
import {
  Dumbbell,
  Bot,
  Zap,
  PieChart,
  ShoppingBag,
  TrendingUp,
  Smartphone,
  CheckCircle,
  ArrowRight,
  Download,
  Sparkles,
  Globe,
  Trophy,
  Timer,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: `FitMitra App | ${siteData.brand.name} - Your Bilingual Fitness Companion`,
  description:
    "Explore the FitMitra mobile app — interactive workout player, bilingual Kannada & English AI coach, reward points, nutrition tracker, supplements store with Shiprocket live tracking, and transformation analytics.",
};

const iconMap = {
  Dumbbell,
  Bot,
  Zap,
  PieChart,
  ShoppingBag,
  TrendingUp,
};

const featureDetails = [
  {
    icon: Dumbbell,
    title: "Interactive Workout Player",
    subtitle: "Step-by-step guided training with real-time tracking",
    desc: "Log every set, rep, and rest period with our interactive workout player. Visual exercise guides walk you through proper form while automatic rest timers keep your sessions efficient and focused.",
    highlights: [
      "Live set counter with progressive overload suggestions",
      "Animated exercise form guides for safe technique",
      "Automatic rest timer with customisable intervals",
      "+5 Reward Points awarded on every completed session",
    ],
  },
  {
    icon: Bot,
    title: "Bilingual AI Fitness Coach",
    subtitle: "Instant guidance in Kannada and English",
    desc: "Powered by LangChain and Gemini, our AI coach answers your questions about workout splits, nutrition macros, supplement timing, and recovery — all in your preferred language.",
    highlights: [
      "Conversational AI with fitness-specific knowledge base",
      "Kannada support for local gym-goers and beginners",
      "Personalised recommendations based on your goals",
      "Automatic offline fallback for uninterrupted coaching",
    ],
  },
  {
    icon: Zap,
    title: "Reward Points & Gym Stall Synergy",
    subtitle: "Train at the gym, earn points, redeem at the stall",
    desc: "Every completed workout earns you Reward Points. Walk across to the Nexvyro stall and redeem your points for discounted shakes, meals, and supplements — creating a seamless fitness-to-fuel loop.",
    highlights: [
      "+5 points per workout with celebration animation",
      "Redeem points for stall meal and shake discounts",
      "Dual checkout: pay with cash or points in-app",
      "Points balance synced in real-time across devices",
    ],
  },
  {
    icon: PieChart,
    title: "Nutrition & Macro Tracker",
    subtitle: "Daily energy balance at your fingertips",
    desc: "Track your Calories, Protein, Carbs, and Fats with our intuitive meal logger. Our recipe database is calibrated with the actual menu from our gym stall, so logging is instant and accurate.",
    highlights: [
      "Daily macro breakdown with progress visualisation",
      "Pre-loaded stall menu items for one-tap logging",
      "Meal creation and deletion with instant updates",
      "Date-based history for reviewing past intake",
    ],
  },
  {
    icon: ShoppingBag,
    title: "Supplements Store & Live Tracking",
    subtitle: "Order, pay, and track — all inside the app",
    desc: "Browse certified Whey Protein, Creatine, and accessories. Check out with cash or Reward Points, then track your shipment in real-time via our integrated Shiprocket courier timeline.",
    highlights: [
      "Curated supplement catalogue with detailed info",
      "Dual checkout: Cash and Reward Points",
      "Shiprocket AWB live tracking with stepper timeline",
      "Order history with status updates and receipts",
    ],
  },
  {
    icon: TrendingUp,
    title: "Weight & Progress Analytics",
    subtitle: "Visualise your transformation over time",
    desc: "Record weight entries, track personal records, and view your workout consistency streaks. Clean charts and graphs make it easy to see how far you have come and stay motivated.",
    highlights: [
      "Weight transformation chart with trend lines",
      "Personal record tracking for key lifts",
      "Workout consistency streaks and calendar view",
      "Comprehensive session history with details",
    ],
  },
];

const appFlow = [
  {
    num: "1",
    title: "Download & Sign Up",
    desc: "Install FitMitra from TestFlight (iOS) or APK (Android). Create your account with phone OTP or email.",
  },
  {
    num: "2",
    title: "Set Your Goals",
    desc: "Complete the 3-step onboarding wizard — enter your biometrics, fitness goals, and training preferences.",
  },
  {
    num: "3",
    title: "Train & Earn",
    desc: "Use the workout player for guided sessions. Earn +5 Reward Points on every completed workout.",
  },
  {
    num: "4",
    title: "Fuel & Track",
    desc: "Redeem points at the gym stall, order supplements, and track nutrition — all from one app.",
  },
];

const techStack = [
  "React Native",
  "Expo Router",
  "LangChain + Gemini AI",
  "Shiprocket API",
  "Razorpay Payments",
  "MongoDB + Express",
  "Bilingual i18n",
  "Secure JWT Auth",
];

export default function AppPage() {
  const { app } = siteData;

  return (
    <>
      <Navbar forceScrolled />
      <main>
        {/* HERO */}
        <section className="apppage-hero">
          <div className="container apppage-hero-inner">
            <Reveal className="apppage-hero-text">
              <span className="apppage-hero-badge">
                <Smartphone size={14} />
                <span>Native Mobile App</span>
              </span>

              <h1>
                Your Complete <span>Fitness Companion</span> — in Kannada & English
              </h1>

              <p className="apppage-hero-desc">
                {app.description}
              </p>

              <div className="apppage-hero-stats">
                {app.stats.map((s, idx) => (
                  <div key={idx} className="apppage-hero-stat">
                    <strong>{s.value}</strong>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>

              <div className="apppage-hero-actions">
                <a href="#early-access" className="btn btn-primary apppage-beta-btn">
                  <Download size={18} />
                  <span>Get Early Access</span>
                </a>
                <a href="#features" className="btn btn-outline apppage-beta-btn-outline">
                  <span>View All Features</span>
                  <ArrowRight size={16} />
                </a>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="apppage-hero-img-wrap">
                <img
                  src={app.image || "/images/app-preview.jpg"}
                  alt="FitMitra Mobile App interface showing workout player and AI coach"
                  loading="eager"
                />
                <div className="apppage-hero-float apppage-float-points">
                  <Zap size={14} />
                  <span>+5 Reward Points</span>
                </div>
                <div className="apppage-hero-float apppage-float-ai">
                  <Bot size={14} />
                  <span>AI Coach: English + Kannada</span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FEATURE DEEP DIVES */}
        <section id="features" className="apppage-section">
          <div className="container">
            <Reveal>
              <div className="apppage-section-header">
                <span className="eyebrow">Feature Deep Dive</span>
                <h2>Everything Inside FitMitra</h2>
                <p>
                  Six core modules designed to take you from workout to fuel-up, all within one native experience.
                </p>
              </div>
            </Reveal>

            {featureDetails.map((feat, idx) => {
              const Icon = feat.icon;
              const isReverse = idx % 2 === 1;
              return (
                <Reveal key={idx} delay={idx * 40}>
                  <div className={`apppage-feature-detail ${isReverse ? "reverse" : ""}`}>
                    <div className="apppage-detail-visual">
                      <div className="apppage-detail-card">
                        <div className="apppage-detail-icon">
                          <Icon size={30} />
                        </div>
                        <h3>{feat.title}</h3>
                        <p>{feat.subtitle}</p>
                      </div>
                    </div>
                    <div className="apppage-detail-info">
                      <h3>{feat.title}</h3>
                      <p>{feat.desc}</p>
                      <div className="apppage-detail-highlights">
                        {feat.highlights.map((h, hIdx) => (
                          <div key={hIdx} className="apppage-highlight">
                            <CheckCircle size={16} />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* HOW IT WORKS FLOW */}
        <section className="apppage-section apppage-section-alt">
          <div className="container">
            <Reveal>
              <div className="apppage-section-header">
                <span className="eyebrow">How It Works</span>
                <h2>From Download to Daily Gains</h2>
                <p>Get started in four simple steps and build your fitness routine from day one.</p>
              </div>
            </Reveal>

            <div className="apppage-flow-grid">
              {appFlow.map((step, idx) => (
                <Reveal key={idx} delay={idx * 60}>
                  <div className="apppage-flow-step">
                    <div className="apppage-flow-num">{step.num}</div>
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* TECH & PLATFORM */}
        <section className="apppage-section">
          <div className="container">
            <Reveal>
              <div className="apppage-section-header">
                <span className="eyebrow">Built With</span>
                <h2>Modern Tech, Native Performance</h2>
                <p>FitMitra is built on production-grade technologies for a fast, secure, and reliable experience.</p>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <div className="apppage-tech-strip">
                {techStack.map((tech, idx) => (
                  <span key={idx} className="apppage-tech-tag">
                    <ShieldCheck size={14} />
                    {tech}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* EARLY ACCESS / BETA DOWNLOAD */}
        <section id="early-access" className="apppage-section apppage-section-alt">
          <div className="container">
            <Reveal>
              <div className="apppage-beta-card">
                <div className="apppage-beta-icon">
                  <Sparkles size={30} />
                </div>
                <h3>Get Early Access to FitMitra</h3>
                <p>
                  We are currently in closed beta. Join our priority waitlist to receive early access to iOS TestFlight and Android APK builds along with exclusive founding-member benefits.
                </p>
                <div className="apppage-beta-actions">
                  <Link href="/#supplements" className="btn btn-primary apppage-beta-btn">
                    <Trophy size={18} />
                    <span>Join Priority Waitlist</span>
                  </Link>
                  <Link href="/" className="btn btn-outline apppage-beta-btn-outline">
                    <ArrowRight size={16} />
                    <span>Back to Home</span>
                  </Link>
                </div>
                <p className="apppage-beta-note">
                  Available on iOS (TestFlight) and Android (APK) during beta. Public launch coming soon.
                </p>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
      <StickyCallBar />
    </>
  );
}

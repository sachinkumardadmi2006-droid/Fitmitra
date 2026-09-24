import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Dumbbell, Flame, TrendingUp, ArrowRight, Award, Shield,
  CheckCircle, Zap, Target, BarChart3, Apple, Heart, Star,
  ChevronLeft, ChevronRight, Play, Users, Clock, Trophy, Sparkles, Menu, X,
  Download, Monitor, QrCode, ArrowLeftRight, Maximize2,
  Check, Eye
} from 'lucide-react';

/* ─── Intersection Observer hook for scroll-triggered animations ─── */
function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.unobserve(el); }
    }, { threshold: 0.15, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

/* ─── Animated counter ─── */
function AnimatedNumber({ target, suffix = '', duration = 2000 }) {
  const [val, setVal] = useState(0);
  const [ref, inView] = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(id); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [inView, target, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ─── Floating particle background ─── */
function ParticleField() {
  return (
    <div className="lp-particles" aria-hidden="true">
      {Array.from({ length: 24 }).map((_, i) => (
        <span key={i} className="lp-particle" style={{
          '--x': `${Math.random() * 100}%`,
          '--y': `${Math.random() * 100}%`,
          '--size': `${2 + Math.random() * 3}px`,
          '--dur': `${6 + Math.random() * 10}s`,
          '--delay': `${Math.random() * 5}s`,
        }} />
      ))}
    </div>
  );
}

/* ─── Client Transformations Data ─── */
const clientTransformations = [
  {
    id: 'vikram',
    name: 'Vikram Malhotra',
    role: 'Software Architect, 29',
    category: 'fat-loss',
    categoryLabel: 'Fat Loss & Shred',
    duration: '12 Weeks',
    firstPhoto: '/transformations/client_1_before.jpg',
    transformedPhoto: '/transformations/client_1_after.jpg',
    combinedPhoto: '/transformations/client_1.jpg',
    startingState: { weight: '88 kg', bodyFat: '28%', label: 'Day 1' },
    transformedState: { weight: '73 kg', bodyFat: '13%', label: 'Week 12' },
    netChange: { weight: '-15 kg', bodyFat: '-15%', waist: '-6.5 in' },
    quote: "FitMitra's nutrition logger and progressive splits kept me honest. Losing 15kg in 12 weeks while having peak energy at my desk job was life-changing.",
    program: '12-Week Lean Shred Protocol',
    rating: 5,
    verified: true,
  },
  {
    id: 'ananya',
    name: 'Ananya Deshmukh',
    role: 'Marketing Director, 27',
    category: 'recomp',
    categoryLabel: 'Body Recomposition',
    duration: '14 Weeks',
    firstPhoto: '/transformations/client_2_before.jpg',
    transformedPhoto: '/transformations/client_2_after.jpg',
    combinedPhoto: '/transformations/client_2.jpg',
    startingState: { weight: '64 kg', bodyFat: '30%', label: 'Day 1' },
    transformedState: { weight: '54 kg', bodyFat: '18%', label: 'Week 14' },
    netChange: { weight: '-10 kg', bodyFat: '-12%', waist: '-5.0 in' },
    quote: "I stopped doing mindless cardio and followed FitMitra's structured strength workouts and protein goals. My core and energy are completely transformed.",
    program: '14-Week Core & Athletic Tone',
    rating: 5,
    verified: true,
  },
  {
    id: 'uday',
    name: 'uday k.s',
    role: 'CSE 2nd year student, 20',
    category: 'muscle',
    categoryLabel: 'Muscle & Hypertrophy',
    duration: '16 Weeks',
    firstPhoto: '/transformations/client_3_before.jpg',
    transformedPhoto: '/transformations/client_3_after.jpg',
    combinedPhoto: '/transformations/client_3.jpg',
    startingState: { weight: '58 kg', bodyFat: '11%', label: 'Day 1' },
    transformedState: { weight: '62 kg', bodyFat: '7%', label: 'Week 16' },
    netChange: { weight: '+4 kg Lean', bodyFat: '-4%', chest: '+3 in' },
    quote: "I was a classic hardgainer who couldn't gain an ounce. Tracking progressive overload with FitMitra's logs helped me put on 4kg of solid muscle.",
    program: '16-Week Mass Hypertrophy',
    rating: 5,
    verified: true,
  },
  {
    id: 'sneha',
    name: 'Sneha Kapoor',
    role: 'Financial Analyst, 28',
    category: 'fat-loss',
    categoryLabel: 'Fat Loss & Strength',
    duration: '12 Weeks',
    firstPhoto: '/transformations/client_4_before.jpg',
    transformedPhoto: '/transformations/client_4_after.jpg',
    combinedPhoto: '/transformations/client_4.jpg',
    startingState: { weight: '71 kg', bodyFat: '32%', label: 'Day 1' },
    transformedState: { weight: '59 kg', bodyFat: '19%', label: 'Week 12' },
    netChange: { weight: '-12 kg', bodyFat: '-13%', waist: '-5.5 in' },
    quote: "Long hours at work wrecked my fitness. FitMitra made workouts flexible and gave me simple meal targets that fit my busy schedule.",
    program: '12-Week Athletic Rebuild',
    rating: 5,
    verified: true,
  },
];

/* ─── Transformation Carousel Component ─── */
function TransformationCarousel({ clients, onInspect }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const count = clients.length;

  useEffect(() => {
    if (isPaused || count <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, 2000);
    return () => clearInterval(timer);
  }, [isPaused, count]);

  const goTo = (idx) => setActiveIndex(((idx % count) + count) % count);

  const getPosition = (index) => {
    let diff = index - activeIndex;
    if (diff > Math.floor(count / 2)) diff -= count;
    if (diff < -Math.floor(count / 2)) diff += count;
    if (diff === 0) return 'center';
    if (diff === 1) return 'right';
    if (diff === -1) return 'left';
    if (diff === 2) return 'far-right';
    if (diff === -2) return 'far-left';
    return 'hidden';
  };

  return (
    <div
      className="lp-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="lp-carousel-viewport">
        {clients.map((client, i) => {
          const pos = getPosition(i);
          return (
            <div
              key={client.id}
              className={`lp-carousel-slide lp-carousel-slide--${pos}`}
              onClick={() => pos === 'center' && onInspect(client)}
            >
              <img src={client.combinedPhoto} alt={`${client.name} transformation`} loading="lazy" />
              <div className="lp-carousel-slide__overlay">
                <span className="lp-carousel-slide__badge">{client.categoryLabel}</span>
                <span className="lp-carousel-slide__name">{client.name}</span>
                <span className="lp-carousel-slide__stat">{client.netChange.weight} · {client.duration}</span>
              </div>
            </div>
          );
        })}
      </div>

      <button className="lp-carousel-arrow lp-carousel-arrow--left" onClick={() => goTo(activeIndex - 1)} aria-label="Previous">
        <ChevronLeft size={20} />
      </button>
      <button className="lp-carousel-arrow lp-carousel-arrow--right" onClick={() => goTo(activeIndex + 1)} aria-label="Next">
        <ChevronRight size={20} />
      </button>

      <div className="lp-carousel-dots">
        {clients.map((_, i) => (
          <button
            key={i}
            className={`lp-carousel-dot${i === activeIndex ? ' active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}


/* ─── Client Transformation Modal / Inspection Lightbox ─── */
function TransformationModal({ client, onClose, onSignUp }) {
  const [modalSliderPos, setModalSliderPos] = useState(50);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="lp-modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="lp-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="lp-modal-close" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="lp-modal-grid">
          {/* Visual comparison area */}
          <div className="lp-modal-visual">
            <div className="lp-modal-slider-wrap">
              <img
                src={client.transformedPhoto}
                alt={`${client.name} Transformed Photo`}
                className="lp-modal-img lp-modal-img--after"
              />
              <div className="lp-modal-tag lp-modal-tag--after">
                TRANSFORMED • {client.transformedState.label} ({client.transformedState.weight})
              </div>

              <div className="lp-modal-clip" style={{ width: `${modalSliderPos}%` }}>
                <img
                  src={client.firstPhoto}
                  alt={`${client.name} First Photo`}
                  className="lp-modal-img lp-modal-img--before"
                />
                <div className="lp-modal-tag lp-modal-tag--before">
                  FIRST PHOTO • {client.startingState.label} ({client.startingState.weight})
                </div>
              </div>

              <div className="lp-modal-handle" style={{ left: `${modalSliderPos}%` }}>
                <div className="lp-modal-knob">
                  <ArrowLeftRight size={14} />
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={modalSliderPos}
                onChange={(e) => setModalSliderPos(Number(e.target.value))}
                className="lp-modal-range"
              />
            </div>
            <p className="lp-modal-hint">↔ Drag slider to compare First Photo vs Transformed Result</p>
          </div>

          {/* Details & Stats */}
          <div className="lp-modal-info">
            <span className="lp-chip"><Trophy size={14} /> {client.categoryLabel.toUpperCase()}</span>
            <h2>{client.name}'s Transformation</h2>
            <p className="lp-modal-sub">{client.role} • <strong>{client.duration}</strong> on FitMitra</p>

            <div className="lp-modal-stats-table">
              <div className="lp-stats-row lp-stats-row--head">
                <span>Metric</span>
                <span>First Photo</span>
                <span>Transformed</span>
                <span>Net Change</span>
              </div>
              <div className="lp-stats-row">
                <span>Body Weight</span>
                <span>{client.startingState.weight}</span>
                <span className="lp-c-neon font-bold">{client.transformedState.weight}</span>
                <span className="lp-c-neon font-bold">{client.netChange.weight}</span>
              </div>
              <div className="lp-stats-row">
                <span>Body Fat</span>
                <span>{client.startingState.bodyFat}</span>
                <span className="lp-c-cyan font-bold">{client.transformedState.bodyFat}</span>
                <span className="lp-c-cyan font-bold">{client.netChange.bodyFat}</span>
              </div>
              <div className="lp-stats-row">
                <span>Timeline</span>
                <span>{client.startingState.label}</span>
                <span>{client.transformedState.label}</span>
                <span className="lp-c-neon">{client.duration}</span>
              </div>
              <div className="lp-stats-row">
                <span>Program</span>
                <span colSpan={3} className="lp-stats-span">{client.program}</span>
              </div>
            </div>

            <div className="lp-modal-story">
              <h4>Transformation Journey</h4>
              <p>"{client.quote}"</p>
            </div>

            <div className="lp-modal-cta">
              <button className="lp-btn lp-btn--neon lp-btn--block" onClick={onSignUp}>
                Start Your Own Transformation <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*                 LANDING PAGE                */
/* ═══════════════════════════════════════════ */
function Landing() {
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [inspectClient, setInspectClient] = useState(null);

  /* Scroll-triggered refs */
  const [statsRef, statsInView] = useInView();
  const [featRef, featInView] = useInView();
  const [howRef, howInView] = useInView();
  const [testRef, testInView] = useInView();
  const [pricingRef, pricingInView] = useInView();
  const [downloadRef, downloadInView] = useInView();
  const [ctaRef, ctaInView] = useInView();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    { icon: <Dumbbell size={28} />, title: 'Smart Workouts', desc: 'Follow guided workout sessions with real-time timers, rep tracking, and automatic calorie burn calculations.' },
    { icon: <Apple size={28} />, title: 'Nutrition Logger', desc: 'Log meals, track macros, and hit your protein targets with our comprehensive Indian food database.' },
    { icon: <BarChart3 size={28} />, title: 'Visual Progress', desc: 'Track body weight changes over time with beautiful interactive SVG charts and milestone markers.' },
    { icon: <Sparkles size={28} />, title: 'AI Coach', desc: 'Get instant personalised workout tips, diet advice, and motivation from our built-in AI fitness assistant.' },
    { icon: <Target size={28} />, title: 'Training Programs', desc: 'Choose from curated 4, 8, and 12-week programs tailored to muscle building, fat loss, or strength goals.' },
    { icon: <Heart size={28} />, title: 'Wellness Focus', desc: 'Track rest days, water intake prompts, and recovery suggestions to keep you performing at your peak.' },
  ];

  const steps = [
    { num: '01', title: 'Create Your Profile', desc: 'Sign up and tell us your age, weight, goal, and experience level.' },
    { num: '02', title: 'Get Your Plan', desc: 'We build a personalised workout split and daily calorie target just for you.' },
    { num: '03', title: 'Train & Track', desc: 'Hit the gym, log every set, track every meal — all from one dashboard.' },
    { num: '04', title: 'See Results', desc: 'Watch your weight graph change, crush milestones, and celebrate PRs.' },
  ];


  const plans = [
    { name: 'Starter', price: 'Free', period: '', features: ['5 Workout Routines', 'Basic Meal Logging', 'Weight Tracking', 'Community Access'], highlighted: false },
    { name: 'Pro', price: '₹299', period: '/mo', features: ['Unlimited Workouts', 'Full Nutrition Database', 'AI Coach Access', 'Progress Analytics', 'Training Programs', 'Priority Support'], highlighted: true },
    { name: 'Elite', price: '₹799', period: '/mo', features: ['Everything in Pro', '1-on-1 Coaching Calls', 'Custom Meal Plans', 'Advanced Body Metrics', 'Video Form Checks', 'Exclusive Challenges'], highlighted: false },
  ];

  return (
    <div className="lp">
      <ParticleField />

      {/* ───────── NAVBAR ───────── */}
      <nav className={`lp-nav${scrolled ? ' lp-nav--scrolled' : ''}`}>
        <div className="lp-nav__inner container">
          <Link to="/" className="lp-brand">
            <Dumbbell size={26} />
            <span>FIT<em>MITRA</em></span>
          </Link>

          <div className="lp-nav__links lp-desktop-only">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#results">Results</a>
            <a href="#pricing">Pricing</a>
            <a href="#download">Download</a>
          </div>

          <div className="lp-nav__actions lp-desktop-only">
            <Link to="/login" className="lp-btn lp-btn--ghost">Log In</Link>
            <Link to="/signup" className="lp-btn lp-btn--neon">Get Started Free</Link>
          </div>

          <button className="lp-burger lp-mobile-only" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileMenu && (
          <div className="lp-mobile-drawer animate-fade-in">
            <a href="#features" onClick={() => setMobileMenu(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenu(false)}>How It Works</a>
            <a href="#results" onClick={() => setMobileMenu(false)}>Results</a>
            <a href="#pricing" onClick={() => setMobileMenu(false)}>Pricing</a>
            <a href="#download" onClick={() => setMobileMenu(false)}>Download</a>
            <hr />
            <Link to="/login" onClick={() => setMobileMenu(false)}>Log In</Link>
            <Link to="/signup" className="lp-btn lp-btn--neon" onClick={() => setMobileMenu(false)}>Get Started Free</Link>
          </div>
        )}
      </nav>

      {/* ───────── HERO ───────── */}
      <section className="lp-hero">
        <div className="lp-hero__glow" aria-hidden="true" />
        <div className="lp-hero__content container">
          <div className="lp-hero__text">
            <span className="lp-chip">
              <Zap size={14} /> #1 FITNESS COMPANION
            </span>
            <h1>
              TRANSFORM<br />
              YOUR <span className="lp-neon">BODY.</span><br />
              <span className="lp-cyan">ELEVATE</span> YOUR LIFE.
            </h1>
            <p>Train smarter, eat better, and track every rep of your transformation. FitMitra is the all-in-one fitness platform built for real results.</p>
            <div className="lp-hero__btns">
              <button className="lp-btn lp-btn--neon lp-btn--lg" onClick={() => navigate('/signup')}>
                Start Free Today <ArrowRight size={18} />
              </button>
              <button className="lp-btn lp-btn--glass lp-btn--lg" onClick={() => navigate('/login')}>
                <Play size={16} /> Watch Demo
              </button>
            </div>
            <div className="lp-hero__trust">
              <div className="lp-avatar-stack">
                {['R', 'P', 'A', 'S'].map((l, i) => <span key={i} className="lp-mini-avatar" style={{ '--i': i }}>{l}</span>)}
              </div>
              <p><strong>2,500+</strong> athletes already training</p>
            </div>
          </div>

          <div className="lp-hero__visual">
            <div className="lp-orb lp-orb--1" />
            <div className="lp-orb lp-orb--2" />
            <div className="lp-hero-card lp-hero-card--main">
              <Dumbbell size={40} className="lp-hero-card__icon" />
              <div className="lp-hero-card__stat">
                <span className="lp-hero-card__val">1,248</span>
                <span className="lp-hero-card__lbl">Calories Burned</span>
              </div>
              <div className="lp-hero-card__bar"><div className="lp-hero-card__fill" /></div>
            </div>
            <div className="lp-hero-card lp-hero-card--float lp-hero-card--top">
              <Flame size={20} className="lp-c-rose" />
              <div>
                <span className="lp-hero-card__val lp-small">156g</span>
                <span className="lp-hero-card__lbl">Protein Today</span>
              </div>
            </div>
            <div className="lp-hero-card lp-hero-card--float lp-hero-card--bot">
              <TrendingUp size={20} className="lp-c-neon" />
              <div>
                <span className="lp-hero-card__val lp-small">-4.2 kg</span>
                <span className="lp-hero-card__lbl">This Month</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── STATS BAR ───────── */}
      <section className={`lp-stats${statsInView ? ' lp-reveal' : ''}`} ref={statsRef}>
        <div className="container lp-stats__inner">
          {[
            { val: 24, suf: '+', label: 'Workout Routines', icon: <Dumbbell size={22} /> },
            { val: 500, suf: '+', label: 'Exercises Library', icon: <Zap size={22} /> },
            { val: 2500, suf: '+', label: 'Active Users', icon: <Users size={22} /> },
            { val: 98, suf: '%', label: 'Satisfaction', icon: <Trophy size={22} /> },
          ].map((s, i) => (
            <div key={i} className="lp-stat-item" style={{ '--delay': `${i * 0.12}s` }}>
              <div className="lp-stat-icon">{s.icon}</div>
              <h3><AnimatedNumber target={s.val} suffix={s.suf} /></h3>
              <p>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── FEATURES ───────── */}
      <section id="features" className={`lp-section${featInView ? ' lp-reveal' : ''}`} ref={featRef}>
        <div className="container">
          <div className="lp-section__header">
            <span className="lp-chip"><Target size={14} /> CORE FEATURES</span>
            <h2>Everything You Need to <span className="lp-neon">Crush It</span></h2>
            <p>One platform to replace your workout tracker, calorie counter, and fitness coach.</p>
          </div>
          <div className="lp-features-grid">
            {features.map((f, i) => (
              <div key={i} className="lp-feat-card" style={{ '--delay': `${i * 0.08}s` }}>
                <div className="lp-feat-card__icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── HOW IT WORKS ───────── */}
      <section id="how-it-works" className={`lp-section lp-section--alt${howInView ? ' lp-reveal' : ''}`} ref={howRef}>
        <div className="container">
          <div className="lp-section__header">
            <span className="lp-chip"><Clock size={14} /> HOW IT WORKS</span>
            <h2>From Sign-Up to <span className="lp-cyan">Results</span> in 4 Steps</h2>
            <p>Getting started with FitMitra takes less than 2 minutes.</p>
          </div>
          <div className="lp-steps">
            {steps.map((s, i) => (
              <div key={i} className="lp-step" style={{ '--delay': `${i * 0.1}s` }}>
                <div className="lp-step__num">{s.num}</div>
                <div className="lp-step__connector" />
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CLIENT RESULTS & TRANSFORMATIONS ───────── */}
      <section id="results" className={`lp-section${testInView ? ' lp-reveal' : ''}`} ref={testRef}>
        <div className="container">
          <div className="lp-section__header">
            <span className="lp-chip"><Trophy size={14} /> CLIENT TRANSFORMATIONS</span>
            <h2>Real People. Real Effort. <span className="lp-neon">Real Results.</span></h2>
            <p>Every transformation begins with Day 1. Explore authentic first photo to transformed photo journeys of our clients.</p>
          </div>

          {/* Highlights ticker */}
          <div className="lp-results-ticker">
            <div className="lp-ticker-item">
              <Sparkles size={16} className="lp-c-neon" />
              <span><strong>500+</strong> Verified Client Transformations</span>
            </div>
            <div className="lp-ticker-item">
              <TrendingUp size={16} className="lp-c-cyan" />
              <span><strong>-8.4 kg</strong> Average Fat Lost in 12 Weeks</span>
            </div>
            <div className="lp-ticker-item">
              <Award size={16} className="lp-c-neon" />
              <span><strong>94%</strong> Completed Their Target Program</span>
            </div>
          </div>


          {/* Transformation Carousel */}
          <TransformationCarousel
            clients={clientTransformations}
            onInspect={setInspectClient}
          />


          {/* Bottom Trust & CTA Banner */}
          <div className="lp-results-cta-card">
            <div className="lp-results-cta-text">
              <h3>Ready to be our next <span className="lp-neon">Transformation Story?</span></h3>
              <p>Get your customized daily workout split, nutrition targets, and 1-on-1 progress check-ins.</p>
            </div>
            <button
              className="lp-btn lp-btn--neon lp-btn--lg"
              onClick={() => navigate('/signup')}
            >
              Start Your Transformation <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Lightbox / Full Inspection Modal */}
      {inspectClient && (
        <TransformationModal
          client={inspectClient}
          onClose={() => setInspectClient(null)}
          onSignUp={() => {
            setInspectClient(null);
            navigate('/signup');
          }}
        />
      )}

      {/* ───────── PRICING ───────── */}
      <section id="pricing" className={`lp-section lp-section--alt${pricingInView ? ' lp-reveal' : ''}`} ref={pricingRef}>
        <div className="container">
          <div className="lp-section__header">
            <span className="lp-chip"><Award size={14} /> PRICING</span>
            <h2>Plans That Fit <span className="lp-cyan">Your Journey</span></h2>
            <p>Start free, upgrade when you're ready.</p>
          </div>
          <div className="lp-pricing-grid">
            {plans.map((p, i) => (
              <div key={i} className={`lp-price-card${p.highlighted ? ' lp-price-card--glow' : ''}`} style={{ '--delay': `${i * 0.1}s` }}>
                {p.highlighted && <span className="lp-price-badge">MOST POPULAR</span>}
                <h3>{p.name}</h3>
                <div className="lp-price-amount">
                  <span className="lp-price-val">{p.price}</span>
                  {p.period && <span className="lp-price-period">{p.period}</span>}
                </div>
                <ul>
                  {p.features.map((f, j) => (
                    <li key={j}><CheckCircle size={16} className="lp-c-neon" /> {f}</li>
                  ))}
                </ul>
                <button
                  className={`lp-btn lp-btn--block ${p.highlighted ? 'lp-btn--neon' : 'lp-btn--glass'}`}
                  onClick={() => navigate('/signup')}
                >
                  {p.price === 'Free' ? 'Get Started' : 'Choose Plan'} <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── DOWNLOAD APP ───────── */}
      <section id="download" className={`lp-section${downloadInView ? ' lp-reveal' : ''}`} ref={downloadRef}>
        <div className="lp-download__glow" aria-hidden="true" />
        <div className="container">
          <div className="lp-download">
            <div className="lp-download__text">
              <span className="lp-chip"><Download size={14} /> DOWNLOAD THE APP</span>
              <h2>Take FitMitra <span className="lp-neon">Everywhere</span> You Go</h2>
              <p>Track workouts at the gym, log meals on the go, and check your progress anytime. Available on all platforms — completely free to download.</p>

              <div className="lp-download__btns">
                <a href="#download" className="lp-store-btn" aria-label="Download on Google Play">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302-2.302 2.302-2.652-2.302 2.652-2.302zM5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z" /></svg>
                  <div>
                    <span className="lp-store-btn__label">GET IT ON</span>
                    <span className="lp-store-btn__name">Google Play</span>
                  </div>
                </a>
                <a href="#download" className="lp-store-btn" aria-label="Download on App Store">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
                  <div>
                    <span className="lp-store-btn__label">DOWNLOAD ON THE</span>
                    <span className="lp-store-btn__name">App Store</span>
                  </div>
                </a>
                <a href="#download" className="lp-store-btn" aria-label="Download for Windows">
                  <Monitor size={24} />
                  <div>
                    <span className="lp-store-btn__label">AVAILABLE ON</span>
                    <span className="lp-store-btn__name">Windows</span>
                  </div>
                </a>
              </div>

              <div className="lp-download__meta">
                <div className="lp-download__meta-item">
                  <Star size={16} fill="var(--primary-neon)" stroke="var(--primary-neon)" />
                  <span><strong>4.9</strong> Rating</span>
                </div>
                <div className="lp-download__meta-item">
                  <Download size={16} />
                  <span><strong>50K+</strong> Downloads</span>
                </div>
                <div className="lp-download__meta-item">
                  <Shield size={16} />
                  <span><strong>100%</strong> Secure</span>
                </div>
              </div>
            </div>

            <div className="lp-download__visual">
              <div className="lp-phone">
                <div className="lp-phone__notch" />
                <div className="lp-phone__screen">
                  <div className="lp-phone__header">
                    <Dumbbell size={18} className="lp-c-neon" />
                    <span>FitMitra</span>
                  </div>
                  <div className="lp-phone__stat-row">
                    <div className="lp-phone__stat">
                      <Flame size={16} className="lp-c-rose" />
                      <div><strong>1,248</strong><span>kcal burned</span></div>
                    </div>
                    <div className="lp-phone__stat">
                      <TrendingUp size={16} className="lp-c-neon" />
                      <div><strong>-4.2 kg</strong><span>this month</span></div>
                    </div>
                  </div>
                  <div className="lp-phone__progress">
                    <span>Daily Goal</span>
                    <div className="lp-phone__bar"><div className="lp-phone__bar-fill" style={{ width: '78%' }} /></div>
                    <span className="lp-phone__pct">78%</span>
                  </div>
                  <div className="lp-phone__workout">
                    <Dumbbell size={14} />
                    <span>Chest & Triceps</span>
                    <span className="lp-phone__badge">Active</span>
                  </div>
                  <div className="lp-phone__workout">
                    <Target size={14} />
                    <span>Leg Destroyer</span>
                    <span className="lp-phone__time">Tomorrow</span>
                  </div>
                </div>
              </div>
              <div className="lp-phone-glow" aria-hidden="true" />
            </div>
          </div>

          <div className="lp-download__qr">
            <div className="lp-qr-card">
              <QrCode size={28} className="lp-c-neon" />
              <div>
                <strong>Scan to Download</strong>
                <span>Point your camera at the QR code</span>
              </div>
              <div className="lp-qr-box">
                <div className="lp-qr-placeholder">
                  <div className="lp-qr-grid">
                    {Array.from({ length: 49 }).map((_, i) => (
                      <span key={i} className="lp-qr-cell" style={{ opacity: Math.random() > 0.4 ? 1 : 0.15 }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── FINAL CTA ───────── */}
      <section className={`lp-cta${ctaInView ? ' lp-reveal' : ''}`} ref={ctaRef}>
        <div className="lp-cta__glow" aria-hidden="true" />
        <div className="container lp-cta__inner">
          <h2>Ready to Start Your <span className="lp-neon">Transformation?</span></h2>
          <p>Join thousands of athletes who are already training smarter with FitMitra.</p>
          <div className="lp-cta__btns">
            <button className="lp-btn lp-btn--neon lp-btn--lg" onClick={() => navigate('/signup')}>
              Create Free Account <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ───────── FOOTER ───────── */}
      <footer className="lp-footer">
        <div className="container lp-footer__inner">
          <div className="lp-footer__brand">
            <Dumbbell size={24} />
            <span>FIT<em>MITRA</em></span>
            <p>Your Fitness. Your Transformation.</p>
          </div>
          <div className="lp-footer__links">
            <div>
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#results">Results</a>
              <a href="#pricing">Pricing</a>
              <a href="#how-it-works">How It Works</a>
            </div>
            <div>
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
            </div>
            <div>
              <h4>Support</h4>
              <a href="#">Help Center</a>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
        <div className="container lp-footer__bottom">
          <p>© {new Date().getFullYear()} FitMitra. Built with 💪 in India.</p>
        </div>
      </footer>

      {/* ─────────────── STYLES ─────────────── */}
      <style>{`
/* ═════ RESETS & GLOBAL ═════ */
.lp {
  position: relative;
  overflow-x: hidden;
  background: var(--bg-dark-base);
  scroll-behavior: smooth;
}
html {
  scroll-behavior: smooth;
}

/* ═════ PARTICLES ═════ */
.lp-particles {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
}
.lp-particle {
  position: absolute;
  left: var(--x); top: var(--y);
  width: var(--size); height: var(--size);
  border-radius: 50%;
  background: var(--primary-neon);
  opacity: 0.12;
  animation: lp-float var(--dur) ease-in-out var(--delay) infinite alternate;
}
@keyframes lp-float {
  0% { transform: translateY(0) scale(1); opacity: 0.08; }
  100% { transform: translateY(-60px) scale(1.4); opacity: 0.2; }
}

/* ═════ SCROLL REVEAL ═════ */
.lp-section, .lp-stats, .lp-cta {
  opacity: 0; transform: translateY(30px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.lp-reveal { opacity: 1; transform: translateY(0); }

/* ═════ NAVBAR ═════ */
.lp-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 200;
  background: transparent;
  transition: background 0.35s, backdrop-filter 0.35s, box-shadow 0.35s;
}
.lp-nav--scrolled {
  background: rgba(6, 9, 19, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 2px 20px rgba(0,0,0,0.4);
  border-bottom: 1px solid var(--border-glass);
}
.lp-nav__inner {
  display: flex; align-items: center; justify-content: space-between;
  height: 72px;
}
.lp-brand {
  display: flex; align-items: center; gap: 10px;
  font-family: var(--font-heading); font-weight: 800; font-size: 1.4rem;
  color: var(--text-primary); letter-spacing: 0.04em;
}
.lp-brand svg { color: var(--primary-neon); filter: drop-shadow(0 0 8px var(--primary-neon-glow)); }
.lp-brand em { font-style: normal; color: var(--primary-neon); }
.lp-nav__links { display: flex; gap: 32px; }
.lp-nav__links a {
  color: var(--text-secondary); font-weight: 500; font-size: 0.9rem;
  transition: color 0.2s;
}
.lp-nav__links a:hover { color: var(--primary-neon); }
.lp-nav__actions { display: flex; gap: 12px; align-items: center; }
.lp-burger {
  background: none; border: none; color: var(--text-primary); cursor: pointer;
}
.lp-mobile-drawer {
  display: flex; flex-direction: column; gap: 16px;
  padding: 20px 24px 28px;
  background: rgba(6, 9, 19, 0.97);
  border-bottom: 1px solid var(--border-glass);
}
.lp-mobile-drawer a {
  color: var(--text-secondary); font-weight: 500; font-size: 1rem;
}
.lp-mobile-drawer hr {
  border: none; border-top: 1px solid var(--border-glass);
}
.lp-desktop-only { display: none; }
@media (min-width: 900px) {
  .lp-desktop-only { display: flex; }
  .lp-mobile-only { display: none; }
}

/* ═════ BUTTONS ═════ */
.lp-btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--font-heading); font-weight: 600; font-size: 0.9rem;
  padding: 10px 22px; border-radius: var(--border-radius-md);
  border: none; cursor: pointer; transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  text-decoration: none; white-space: nowrap;
}
.lp-btn--neon {
  background: var(--primary-neon); color: #000;
}
.lp-btn--neon:hover {
  background: #d8ff33; transform: translateY(-2px);
  box-shadow: 0 0 24px var(--primary-neon-glow), 0 4px 16px rgba(0,0,0,0.3);
}
.lp-btn--ghost {
  background: transparent; color: var(--text-secondary);
  border: 1px solid var(--border-glass-bright);
}
.lp-btn--ghost:hover {
  color: var(--text-primary); border-color: var(--text-secondary);
  transform: translateY(-2px);
}
.lp-btn--glass {
  background: var(--bg-glass); color: var(--text-primary);
  border: 1px solid var(--border-glass-bright);
  backdrop-filter: blur(8px);
}
.lp-btn--glass:hover {
  background: var(--bg-glass-hover); border-color: var(--text-secondary);
  transform: translateY(-2px);
}
.lp-btn--lg { padding: 14px 30px; font-size: 1rem; }
.lp-btn--block { width: 100%; justify-content: center; }

/* ═════ CHIP ═════ */
.lp-chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--primary-neon-dim); color: var(--primary-neon);
  border: 1px solid rgba(204,255,0,0.2); border-radius: 9999px;
  padding: 6px 14px; font-size: 0.72rem; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase;
}

/* ═════ UTILITY ═════ */
.lp-neon { color: var(--primary-neon); }
.lp-cyan { color: var(--secondary-cyan); }
.lp-c-neon { color: var(--primary-neon); }
.lp-c-rose { color: var(--accent-rose); }

/* ═════ HERO ═════ */
.lp-hero {
  position: relative; padding: 140px 0 80px; overflow: hidden;
}
.lp-hero__glow {
  position: absolute; top: -200px; right: -200px;
  width: 700px; height: 700px; border-radius: 50%;
  background: radial-gradient(circle, rgba(204,255,0,0.06) 0%, rgba(0,240,255,0.04) 40%, transparent 70%);
  pointer-events: none;
}
.lp-hero__content {
  display: grid; grid-template-columns: 1fr; gap: 60px; align-items: center;
  position: relative; z-index: 1;
}
@media (min-width: 1024px) {
  .lp-hero__content { grid-template-columns: 1.1fr 1fr; }
}
.lp-hero__text { display: flex; flex-direction: column; gap: 20px; }
.lp-hero__text h1 {
  font-family: var(--font-heading); font-size: clamp(2.4rem, 5vw, 4.2rem);
  font-weight: 800; line-height: 1.05; letter-spacing: -0.02em;
  color: var(--text-primary);
}
.lp-hero__text > p {
  font-size: 1.05rem; color: var(--text-secondary); max-width: 500px; line-height: 1.6;
}
.lp-hero__btns { display: flex; gap: 14px; flex-wrap: wrap; }
.lp-hero__trust {
  display: flex; align-items: center; gap: 14px; margin-top: 8px;
}
.lp-hero__trust p { font-size: 0.85rem; color: var(--text-secondary); }
.lp-hero__trust strong { color: var(--primary-neon); }
.lp-avatar-stack { display: flex; }
.lp-mini-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, var(--secondary-cyan), var(--primary-neon));
  color: #000; font-weight: 700; font-size: 0.75rem;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--bg-dark-base);
  margin-left: calc(var(--i) * -8px);
  position: relative; z-index: calc(10 - var(--i));
}

/* Hero visual */
.lp-hero__visual {
  position: relative; display: flex; justify-content: center;
  align-items: center; min-height: 340px;
}
.lp-orb {
  position: absolute; border-radius: 50%; pointer-events: none;
}
.lp-orb--1 {
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(204,255,0,0.08), transparent 70%);
  top: 50%; left: 50%; transform: translate(-50%,-50%);
  animation: lp-pulse 4s ease-in-out infinite;
}
.lp-orb--2 {
  width: 200px; height: 200px;
  background: radial-gradient(circle, rgba(0,240,255,0.06), transparent 70%);
  top: 30%; left: 30%; transform: translate(-50%,-50%);
  animation: lp-pulse 5s ease-in-out 1s infinite;
}
@keyframes lp-pulse {
  0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.6; }
  50% { transform: translate(-50%,-50%) scale(1.15); opacity: 1; }
}

.lp-hero-card {
  background: var(--bg-glass); backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-glass); border-radius: var(--border-radius-lg);
  padding: 28px; box-shadow: var(--shadow-dark);
}
.lp-hero-card--main {
  width: 260px; text-align: center; z-index: 2;
  animation: lp-cardFloat 6s ease-in-out infinite;
}
@keyframes lp-cardFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
.lp-hero-card__icon { color: var(--primary-neon); margin-bottom: 12px; }
.lp-hero-card__stat { margin-bottom: 16px; }
.lp-hero-card__val {
  display: block; font-family: var(--font-heading); font-size: 2rem;
  font-weight: 800; color: var(--primary-neon);
}
.lp-hero-card__val.lp-small { font-size: 1.2rem; }
.lp-hero-card__lbl {
  display: block; font-size: 0.75rem; color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;
}
.lp-hero-card__bar {
  height: 6px; border-radius: 9999px; background: var(--border-glass);
  overflow: hidden;
}
.lp-hero-card__fill {
  width: 72%; height: 100%; border-radius: 9999px;
  background: linear-gradient(90deg, var(--secondary-cyan), var(--primary-neon));
}

.lp-hero-card--float {
  position: absolute; display: flex; align-items: center; gap: 12px;
  padding: 14px 18px; z-index: 3; width: auto;
  animation: lp-floatCard 5s ease-in-out infinite;
}
.lp-hero-card--top { top: 10%; right: 0; animation-delay: 0.5s; }
.lp-hero-card--bot { bottom: 10%; left: -10px; animation-delay: 1.5s; }
@keyframes lp-floatCard {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* ═════ STATS BAR ═════ */
.lp-stats {
  position: relative; z-index: 1;
  padding: 48px 0;
  background: linear-gradient(180deg, rgba(204,255,0,0.02), transparent);
  border-top: 1px solid var(--border-glass);
  border-bottom: 1px solid var(--border-glass);
}
.lp-stats__inner {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px;
}
@media (min-width: 768px) {
  .lp-stats__inner { grid-template-columns: repeat(4, 1fr); }
}
.lp-stat-item {
  text-align: center;
  opacity: 0; transform: translateY(20px);
  transition: opacity 0.5s ease var(--delay), transform 0.5s ease var(--delay);
}
.lp-reveal .lp-stat-item { opacity: 1; transform: translateY(0); }
.lp-stat-icon {
  color: var(--primary-neon); margin-bottom: 8px;
  display: flex; justify-content: center;
}
.lp-stat-item h3 {
  font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800;
  color: var(--text-primary);
}
.lp-stat-item p {
  font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;
  letter-spacing: 0.06em; margin-top: 4px;
}

/* ═════ SECTIONS ═════ */
.lp-section { padding: 90px 0; position: relative; z-index: 1; }
.lp-section--alt {
  background: linear-gradient(180deg, rgba(13,18,34,0.5) 0%, transparent 100%);
}
.lp-section__header {
  text-align: center; margin-bottom: 52px;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.lp-section__header h2 {
  font-family: var(--font-heading); font-size: clamp(1.6rem, 3.5vw, 2.4rem);
  font-weight: 800; color: var(--text-primary);
}
.lp-section__header > p {
  font-size: 1rem; color: var(--text-secondary); max-width: 520px;
}

/* ═════ FEATURES GRID ═════ */
.lp-features-grid {
  display: grid; grid-template-columns: 1fr; gap: 20px;
}
@media (min-width: 640px) { .lp-features-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .lp-features-grid { grid-template-columns: repeat(3, 1fr); } }

.lp-feat-card {
  background: var(--bg-glass); border: 1px solid var(--border-glass);
  border-radius: var(--border-radius-lg); padding: 28px;
  transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
  opacity: 0; transform: translateY(24px);
  transition: opacity 0.5s ease var(--delay), transform 0.5s ease var(--delay),
              background 0.3s, border-color 0.3s, box-shadow 0.3s;
}
.lp-reveal .lp-feat-card { opacity: 1; transform: translateY(0); }
.lp-feat-card:hover {
  background: var(--bg-glass-hover); border-color: var(--border-glass-bright);
  transform: translateY(-6px) !important;
  box-shadow: 0 14px 40px rgba(0,0,0,0.4), 0 0 0 1px var(--border-glass-bright);
}
.lp-feat-card__icon {
  color: var(--primary-neon); margin-bottom: 16px;
  width: 52px; height: 52px; display: flex; align-items: center; justify-content: center;
  background: var(--primary-neon-dim); border: 1px solid rgba(204,255,0,0.15);
  border-radius: var(--border-radius-md);
}
.lp-feat-card h3 {
  font-size: 1.1rem; margin-bottom: 8px; color: var(--text-primary);
}
.lp-feat-card p {
  font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;
}

/* ═════ HOW IT WORKS ═════ */
.lp-steps {
  display: grid; grid-template-columns: 1fr; gap: 24px;
}
@media (min-width: 768px) { .lp-steps { grid-template-columns: repeat(4, 1fr); } }
.lp-step {
  text-align: center; position: relative;
  opacity: 0; transform: translateY(20px);
  transition: opacity 0.5s ease var(--delay), transform 0.5s ease var(--delay);
}
.lp-reveal .lp-step { opacity: 1; transform: translateY(0); }
.lp-step__num {
  font-family: var(--font-heading); font-size: 2.4rem; font-weight: 800;
  color: var(--primary-neon); opacity: 0.25; margin-bottom: 8px;
}
.lp-step__connector {
  display: none;
}
@media (min-width: 768px) {
  .lp-step__connector {
    display: block; position: absolute; top: 30px; right: -12px;
    width: 24px; height: 2px;
    background: linear-gradient(90deg, rgba(204,255,0,0.3), transparent);
  }
  .lp-step:last-child .lp-step__connector { display: none; }
}
.lp-step h3 { font-size: 1.05rem; margin-bottom: 8px; }
.lp-step p { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.45; }

/* ═════ CLIENT RESULTS & TRANSFORMATIONS ═════ */
.lp-results-ticker {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 16px 28px;
  margin-bottom: 28px;
}
.lp-ticker-item {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9999px; padding: 8px 18px; font-size: 0.85rem; color: var(--text-secondary);
}
.lp-ticker-item strong { color: var(--text-primary); }

/* Transformation Carousel */
.lp-carousel {
  position: relative; width: 100%; max-width: 860px;
  margin: 0 auto 40px; padding: 10px 0;
}
.lp-carousel-viewport {
  position: relative; height: 460px; perspective: 1200px;
}
.lp-carousel-slide {
  position: absolute; top: 50%; left: 50%;
  width: 280px; height: 400px; border-radius: 18px;
  overflow: hidden; cursor: pointer;
  transition: all 0.65s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.08);
  will-change: transform, opacity;
}
.lp-carousel-slide img {
  width: 100%; height: 100%; object-fit: cover; display: block;
}
.lp-carousel-slide--center {
  transform: translate(-50%, -50%) scale(1); z-index: 5; opacity: 1;
  border-color: rgba(204, 255, 0, 0.25);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(204, 255, 0, 0.08);
}
.lp-carousel-slide--center:hover {
  border-color: rgba(204, 255, 0, 0.5);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 50px rgba(204, 255, 0, 0.15);
}
.lp-carousel-slide--left {
  transform: translate(calc(-50% - 240px), -50%) scale(0.78); z-index: 3; opacity: 0.5;
}
.lp-carousel-slide--right {
  transform: translate(calc(-50% + 240px), -50%) scale(0.78); z-index: 3; opacity: 0.5;
}
.lp-carousel-slide--far-left {
  transform: translate(calc(-50% - 400px), -50%) scale(0.6); z-index: 1; opacity: 0; pointer-events: none;
}
.lp-carousel-slide--far-right {
  transform: translate(calc(-50% + 400px), -50%) scale(0.6); z-index: 1; opacity: 0; pointer-events: none;
}
.lp-carousel-slide--hidden {
  transform: translate(-50%, -50%) scale(0.4); z-index: 0; opacity: 0; pointer-events: none;
}
.lp-carousel-slide__overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 50px 16px 18px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.4) 55%, transparent 100%);
  display: flex; flex-direction: column; gap: 4px;
}
.lp-carousel-slide__badge {
  font-size: 0.62rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--secondary-cyan); background: rgba(0, 240, 255, 0.15);
  padding: 3px 8px; border-radius: 4px; width: fit-content;
}
.lp-carousel-slide__name {
  font-size: 1rem; font-weight: 700; color: #fff;
}
.lp-carousel-slide__stat {
  font-size: 0.82rem; color: var(--primary-neon); font-weight: 600;
}
.lp-carousel-arrow {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 42px; height: 42px; border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(10, 14, 28, 0.6); backdrop-filter: blur(10px);
  color: var(--text-primary); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  z-index: 10; transition: all 0.25s;
}
.lp-carousel-arrow:hover {
  background: rgba(204, 255, 0, 0.12); border-color: var(--primary-neon);
  color: var(--primary-neon); box-shadow: 0 0 16px rgba(204, 255, 0, 0.2);
}
.lp-carousel-arrow--left { left: 8px; }
.lp-carousel-arrow--right { right: 8px; }
.lp-carousel-dots {
  display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 24px;
}
.lp-carousel-dot {
  width: 10px; height: 10px; border-radius: 50%; border: none;
  background: rgba(255, 255, 255, 0.2); cursor: pointer;
  transition: all 0.3s; padding: 0;
}
.lp-carousel-dot.active {
  background: var(--primary-neon); box-shadow: 0 0 12px rgba(204, 255, 0, 0.5);
  transform: scale(1.3);
}
.lp-carousel-dot:hover:not(.active) {
  background: rgba(255, 255, 255, 0.45);
}
@media (max-width: 768px) {
  .lp-carousel-viewport { height: 380px; }
  .lp-carousel-slide { width: 220px; height: 320px; border-radius: 14px; }
  .lp-carousel-slide--left { transform: translate(calc(-50% - 170px), -50%) scale(0.72); }
  .lp-carousel-slide--right { transform: translate(calc(-50% + 170px), -50%) scale(0.72); }
  .lp-carousel-arrow { width: 36px; height: 36px; }
}
@media (max-width: 480px) {
  .lp-carousel-viewport { height: 340px; }
  .lp-carousel-slide { width: 200px; height: 280px; }
  .lp-carousel-slide--left { transform: translate(calc(-50% - 140px), -50%) scale(0.68); opacity: 0.35; }
  .lp-carousel-slide--right { transform: translate(calc(-50% + 140px), -50%) scale(0.68); opacity: 0.35; }
}


/* Results Bottom CTA Card */
.lp-results-cta-card {
  margin-top: 48px; background: linear-gradient(135deg, rgba(204, 255, 0, 0.07), rgba(0, 240, 255, 0.05));
  border: 1px solid rgba(204, 255, 0, 0.25); border-radius: var(--border-radius-lg);
  padding: 36px 32px; display: flex; flex-direction: column; gap: 20px;
  align-items: center; text-align: center;
}
@media (min-width: 768px) {
  .lp-results-cta-card { flex-direction: row; justify-content: space-between; text-align: left; }
}
.lp-results-cta-text h3 {
  font-size: 1.4rem; color: var(--text-primary); margin-bottom: 6px;
}
.lp-results-cta-text p {
  font-size: 0.92rem; color: var(--text-secondary); max-width: 520px; margin: 0;
}

/* Modal Lightbox */
.lp-modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(4, 7, 15, 0.85); backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.lp-modal-content {
  background: #0d1222; border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px; max-width: 980px; width: 100%; max-height: 90vh;
  overflow-y: auto; position: relative; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8);
  padding: 28px;
}
.lp-modal-close {
  position: absolute; top: 18px; right: 18px; background: rgba(255, 255, 255, 0.08);
  border: none; color: var(--text-secondary); border-radius: 50%;
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; z-index: 10; transition: all 0.2s;
}
.lp-modal-close:hover {
  background: rgba(255, 255, 255, 0.18); color: #fff;
}

.lp-modal-grid {
  display: grid; grid-template-columns: 1fr; gap: 28px;
}
@media (min-width: 860px) {
  .lp-modal-grid { grid-template-columns: 1.1fr 1fr; align-items: center; }
}

.lp-modal-visual {
  display: flex; flex-direction: column; gap: 8px;
}
.lp-modal-slider-wrap {
  position: relative; width: 100%; height: 420px; border-radius: 14px;
  overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1); background: #050811;
}
.lp-modal-img {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
}
.lp-modal-clip {
  position: absolute; top: 0; left: 0; bottom: 0; overflow: hidden;
  border-right: 2px solid var(--primary-neon);
  box-shadow: 3px 0 16px rgba(204, 255, 0, 0.6);
}
.lp-modal-handle {
  position: absolute; top: 0; bottom: 0; width: 40px; transform: translateX(-50%);
  display: flex; align-items: center; justify-content: center; z-index: 5; pointer-events: none;
}
.lp-modal-knob {
  width: 32px; height: 32px; border-radius: 50%; background: var(--primary-neon);
  color: #000; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 16px rgba(204, 255, 0, 0.9); pointer-events: auto;
}
.lp-modal-range {
  position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0;
  cursor: ew-resize; z-index: 8; margin: 0;
}
.lp-modal-tag {
  position: absolute; bottom: 14px; z-index: 4; font-size: 0.72rem; font-weight: 700;
  padding: 5px 12px; border-radius: 6px;
}
.lp-modal-tag--before {
  left: 14px; background: rgba(0, 0, 0, 0.75); color: #fff; border: 1px solid rgba(255, 255, 255, 0.2);
}
.lp-modal-tag--after {
  right: 14px; background: var(--primary-neon); color: #000;
}
.lp-modal-hint {
  font-size: 0.78rem; color: var(--text-muted); text-align: center; margin: 0;
}

.lp-modal-info {
  display: flex; flex-direction: column; gap: 16px;
}
.lp-modal-info h2 {
  font-size: 1.6rem; color: var(--text-primary); margin: 4px 0 0;
}
.lp-modal-sub {
  font-size: 0.88rem; color: var(--text-secondary); margin: 0;
}
.lp-modal-stats-table {
  background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px; overflow: hidden;
}
.lp-stats-row {
  display: grid; grid-template-columns: 1.2fr 1fr 1fr 1fr; padding: 10px 14px;
  font-size: 0.82rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.lp-stats-row:last-child { border-bottom: none; }
.lp-stats-row--head {
  background: rgba(255, 255, 255, 0.05); font-weight: 700; color: var(--text-muted); font-size: 0.72rem;
  letter-spacing: 0.06em; text-transform: uppercase;
}
.lp-stats-span {
  grid-column: span 3; font-weight: 600; color: var(--secondary-cyan);
}
.lp-modal-story {
  background: rgba(255, 255, 255, 0.02); border-left: 3px solid var(--primary-neon);
  padding: 12px 16px; border-radius: 0 8px 8px 0;
}
.lp-modal-story h4 {
  font-size: 0.82rem; color: var(--primary-neon); margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.06em;
}
.lp-modal-story p {
  font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; margin: 0; font-style: italic;
}
.lp-modal-cta { margin-top: 8px; }

/* ═════ PRICING ═════ */
.lp-pricing-grid {
  display: grid; grid-template-columns: 1fr; gap: 24px; align-items: stretch;
}
@media (min-width: 768px) { .lp-pricing-grid { grid-template-columns: repeat(3, 1fr); } }
.lp-price-card {
  background: var(--bg-glass); border: 1px solid var(--border-glass);
  border-radius: var(--border-radius-lg); padding: 32px;
  display: flex; flex-direction: column; gap: 20px; position: relative;
  opacity: 0; transform: translateY(20px);
  transition: opacity 0.5s ease var(--delay), transform 0.5s ease var(--delay),
              background 0.3s, border-color 0.3s, box-shadow 0.3s;
}
.lp-reveal .lp-price-card { opacity: 1; transform: translateY(0); }
.lp-price-card:hover {
  background: var(--bg-glass-hover); transform: translateY(-4px) !important;
}
.lp-price-card--glow {
  border-color: rgba(204,255,0,0.3);
  box-shadow: 0 0 30px rgba(204,255,0,0.06);
}
.lp-price-badge {
  position: absolute; top: -1px; left: 50%; transform: translateX(-50%);
  background: var(--primary-neon); color: #000; font-size: 0.65rem;
  font-weight: 700; letter-spacing: 0.1em; padding: 4px 14px;
  border-radius: 0 0 8px 8px;
}
.lp-price-card h3 {
  font-size: 1.2rem; color: var(--text-primary);
}
.lp-price-amount { display: flex; align-items: baseline; gap: 4px; }
.lp-price-val {
  font-family: var(--font-heading); font-size: 2.4rem; font-weight: 800;
  color: var(--text-primary);
}
.lp-price-period { font-size: 0.9rem; color: var(--text-muted); }
.lp-price-card ul {
  list-style: none; display: flex; flex-direction: column; gap: 10px;
  flex: 1;
}
.lp-price-card li {
  display: flex; align-items: center; gap: 10px;
  font-size: 0.88rem; color: var(--text-secondary);
}

/* ═════ CTA ═════ */
.lp-cta {
  position: relative; z-index: 1; text-align: center; padding: 100px 0;
  overflow: hidden;
}
.lp-cta__glow {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  width: 600px; height: 600px; border-radius: 50%;
  background: radial-gradient(circle, rgba(204,255,0,0.06) 0%, rgba(0,240,255,0.03) 40%, transparent 70%);
  pointer-events: none;
}
.lp-cta__inner {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center; gap: 20px;
}
.lp-cta__inner h2 {
  font-family: var(--font-heading); font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 800; color: var(--text-primary);
}
.lp-cta__inner p {
  font-size: 1.05rem; color: var(--text-secondary); max-width: 500px;
}
.lp-cta__btns { margin-top: 12px; }

/* ═════ FOOTER ═════ */
.lp-footer {
  border-top: 1px solid var(--border-glass); padding: 60px 0 30px;
  position: relative; z-index: 1;
}
.lp-footer__inner {
  display: grid; grid-template-columns: 1fr; gap: 40px;
}
@media (min-width: 768px) {
  .lp-footer__inner { grid-template-columns: 1.5fr 1fr 1fr 1fr; }
}
.lp-footer__brand {
  display: flex; flex-direction: column; gap: 10px;
}
.lp-footer__brand > span {
  display: flex; align-items: center; gap: 8px;
  font-family: var(--font-heading); font-weight: 800; font-size: 1.2rem;
  color: var(--text-primary);
}
.lp-footer__brand svg { color: var(--primary-neon); }
.lp-footer__brand em { font-style: normal; color: var(--primary-neon); }
.lp-footer__brand p { font-size: 0.85rem; color: var(--text-muted); }
.lp-footer__links {
  display: contents;
}
.lp-footer__links > div {
  display: flex; flex-direction: column; gap: 10px;
}
.lp-footer__links h4 {
  font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--text-secondary); margin-bottom: 4px; font-weight: 600;
}
.lp-footer__links a {
  font-size: 0.88rem; color: var(--text-muted); transition: color 0.2s;
}
.lp-footer__links a:hover { color: var(--primary-neon); }
.lp-footer__bottom {
  margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--border-glass);
}
.lp-footer__bottom p {
  font-size: 0.8rem; color: var(--text-muted); text-align: center;
}

/* ═════ DOWNLOAD SECTION ═════ */
.lp-download__glow {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 700px; height: 700px; border-radius: 50%;
  background: radial-gradient(circle, rgba(204,255,0,0.04) 0%, rgba(0,240,255,0.03) 40%, transparent 70%);
  pointer-events: none;
}
.lp-download {
  display: grid; grid-template-columns: 1fr; gap: 60px; align-items: center;
}
@media (min-width: 1024px) {
  .lp-download { grid-template-columns: 1.2fr 1fr; }
}
.lp-download__text {
  display: flex; flex-direction: column; gap: 18px;
}
.lp-download__text h2 {
  font-family: var(--font-heading); font-size: clamp(1.6rem, 3.5vw, 2.4rem);
  font-weight: 800; color: var(--text-primary);
}
.lp-download__text > p {
  font-size: 1rem; color: var(--text-secondary); line-height: 1.6; max-width: 500px;
}

/* Store Buttons */
.lp-download__btns {
  display: flex; flex-wrap: wrap; gap: 12px; margin-top: 4px;
}
.lp-store-btn {
  display: flex; align-items: center; gap: 12px;
  background: var(--bg-glass); border: 1px solid var(--border-glass-bright);
  border-radius: var(--border-radius-md); padding: 12px 20px;
  text-decoration: none; color: var(--text-primary);
  transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
  backdrop-filter: blur(8px);
}
.lp-store-btn:hover {
  background: var(--bg-glass-hover); border-color: var(--primary-neon);
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(204,255,0,0.15);
}
.lp-store-btn svg { flex-shrink: 0; color: var(--text-primary); }
.lp-store-btn__label {
  display: block; font-size: 0.6rem; font-weight: 600;
  color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase;
}
.lp-store-btn__name {
  display: block; font-family: var(--font-heading); font-size: 1.05rem;
  font-weight: 700; color: var(--text-primary); line-height: 1.2;
}

/* Meta badges */
.lp-download__meta {
  display: flex; flex-wrap: wrap; gap: 20px; margin-top: 8px;
}
.lp-download__meta-item {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.85rem; color: var(--text-secondary);
}
.lp-download__meta-item svg { color: var(--primary-neon); }
.lp-download__meta-item strong { color: var(--text-primary); }

/* Phone Mockup */
.lp-download__visual {
  display: flex; justify-content: center; align-items: center;
  position: relative;
}
.lp-phone {
  width: 260px; min-height: 440px;
  background: var(--bg-dark-card);
  border: 2px solid var(--border-glass-bright);
  border-radius: 32px; padding: 12px;
  position: relative; z-index: 2;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
  animation: lp-phoneFloat 6s ease-in-out infinite;
}
@keyframes lp-phoneFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-14px) rotate(1deg); }
}
.lp-phone__notch {
  width: 100px; height: 22px; margin: 0 auto 12px;
  background: var(--bg-dark-base); border-radius: 0 0 14px 14px;
}
.lp-phone__screen {
  background: rgba(6,9,19,0.8); border-radius: 20px;
  padding: 16px; display: flex; flex-direction: column; gap: 14px;
  border: 1px solid var(--border-glass);
}
.lp-phone__header {
  display: flex; align-items: center; gap: 8px;
  font-family: var(--font-heading); font-weight: 700; font-size: 0.95rem;
  padding-bottom: 10px; border-bottom: 1px solid var(--border-glass);
}
.lp-phone__stat-row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.lp-phone__stat {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass);
  border-radius: 10px; padding: 10px;
}
.lp-phone__stat strong {
  display: block; font-family: var(--font-heading); font-size: 0.85rem; font-weight: 700;
  color: var(--text-primary);
}
.lp-phone__stat span {
  display: block; font-size: 0.6rem; color: var(--text-muted);
}
.lp-phone__progress {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.75rem; color: var(--text-secondary);
}
.lp-phone__bar {
  flex: 1; height: 6px; border-radius: 9999px;
  background: var(--border-glass); overflow: hidden;
}
.lp-phone__bar-fill {
  height: 100%; border-radius: 9999px;
  background: linear-gradient(90deg, var(--secondary-cyan), var(--primary-neon));
  transition: width 1s ease;
}
.lp-phone__pct {
  font-weight: 700; color: var(--primary-neon); font-size: 0.75rem;
}
.lp-phone__workout {
  display: flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,0.02); border: 1px solid var(--border-glass);
  border-radius: 10px; padding: 10px 12px; font-size: 0.8rem;
}
.lp-phone__workout svg { color: var(--text-muted); flex-shrink: 0; }
.lp-phone__workout span:nth-child(2) { flex: 1; font-weight: 500; }
.lp-phone__badge {
  font-size: 0.6rem; font-weight: 700; text-transform: uppercase;
  background: var(--primary-neon-dim); color: var(--primary-neon);
  border: 1px solid rgba(204,255,0,0.2); padding: 2px 8px; border-radius: 6px;
  letter-spacing: 0.05em;
}
.lp-phone__time {
  font-size: 0.65rem; color: var(--text-muted); font-weight: 500;
}
.lp-phone-glow {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 320px; height: 320px; border-radius: 50%;
  background: radial-gradient(circle, rgba(204,255,0,0.08) 0%, rgba(0,240,255,0.04) 50%, transparent 70%);
  pointer-events: none; z-index: 1;
  animation: lp-pulse 4s ease-in-out infinite;
}

/* QR card */
.lp-download__qr {
  display: flex; justify-content: center; margin-top: 48px;
}
.lp-qr-card {
  display: flex; align-items: center; gap: 20px;
  background: var(--bg-glass); border: 1px solid var(--border-glass);
  border-radius: var(--border-radius-lg); padding: 20px 28px;
  backdrop-filter: blur(12px);
}
.lp-qr-card strong {
  display: block; font-size: 0.95rem; color: var(--text-primary);
}
.lp-qr-card > div:nth-child(2) span {
  font-size: 0.78rem; color: var(--text-muted);
}
.lp-qr-box {
  width: 64px; height: 64px; border-radius: 8px; overflow: hidden;
  border: 1px solid var(--border-glass-bright);
}
.lp-qr-placeholder {
  width: 100%; height: 100%; padding: 4px;
  background: var(--bg-dark-card);
}
.lp-qr-grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px;
  width: 100%; height: 100%;
}
.lp-qr-cell {
  background: var(--primary-neon); border-radius: 1px;
}

/* ═════ MOBILE POLISH ═════ */
@media (max-width: 640px) {
  .lp-hero { padding-top: 110px; }
  .lp-hero__visual { min-height: 260px; }
  .lp-hero-card--main { width: 220px; padding: 20px; }
  .lp-hero-card--float { display: none; }
  .lp-section { padding: 60px 0; }
  .lp-cta { padding: 70px 0; }
  .lp-download__btns { flex-direction: column; }
  .lp-store-btn { width: 100%; }
  .lp-phone { width: 220px; min-height: 370px; }
  .lp-qr-card { flex-direction: column; text-align: center; }
}
      `}</style>
    </div>
  );
}

export default Landing;

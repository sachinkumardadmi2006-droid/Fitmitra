"use client";

import { useEffect, useState } from "react";
import { Menu as MenuIcon, X, Phone } from "lucide-react";
import siteData from "@/data/siteData";

const links = [
  { href: "#menu", label: "Menu" },
  { href: "#why", label: "Why Us" },
  { href: "#how", label: "How It Works" },
  { href: "#team", label: "Team" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const tel = `tel:${siteData.contact.phoneRaw}`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`navbar ${scrolled ? "is-scrolled" : ""}`}>
      <div className="container navbar-inner">
        <a href="#top" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={siteData.brand.logo} width="40" height="40" alt="Nexvyro Fitness logo" />
          <span>{siteData.brand.name}</span>
        </a>

        <nav className="nav-links" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <a className="btn btn-accent nav-call" href={tel}>
            <Phone size={18} />
            <span>Call Now</span>
          </a>
          <button
            className="nav-toggle"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      <div className={`mobile-panel ${open ? "open" : ""}`}>
        {links.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <a className="btn btn-accent" href={tel} onClick={() => setOpen(false)}>
          <Phone size={18} />
          Call to Pre-order
        </a>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu as MenuIcon, X, Phone } from "lucide-react";
import siteData from "@/data/siteData";
import { WhatsAppIcon } from "./SocialIcons";

const links = [
  { href: "/#menu", label: "Menu" },
  { href: "/#why", label: "Why Us" },
  { href: "/#how", label: "How It Works" },
  { href: "/#supplements", label: "Supplements" },
  { href: "/#app", label: "App" },
  { href: "/#team", label: "Team" },
  { href: "/#contact", label: "Contact" },
  { href: "/refund", label: "Refund Policy", badge: "New" },
];

export default function Navbar({ forceScrolled = false }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(forceScrolled);
  const tel = `tel:${siteData.contact.phoneRaw}`;

  useEffect(() => {
    if (forceScrolled) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [forceScrolled]);

  return (
    <header className={`navbar ${scrolled ? "is-scrolled" : ""}`}>
      <div className="container navbar-inner">
        <Link href="/" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={siteData.brand.logo} width="40" height="40" alt={`${siteData.brand.name} logo`} />
          <span>{siteData.brand.name}</span>
        </Link>

        <nav className="nav-links" aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="nav-item-link">
              <span>{l.label}</span>
              {l.badge && <span className="nav-badge">{l.badge}</span>}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <a
            className="btn btn-outline nav-whatsapp-btn"
            href={siteData.socials.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Pre-order on WhatsApp"
          >
            <WhatsAppIcon size={18} />
            <span>WhatsApp</span>
          </a>
          <a className="btn btn-accent nav-call" href={tel} aria-label="Call to pre-order">
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
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="mobile-nav-link">
            <span>{l.label}</span>
            {l.badge && <span className="nav-badge">{l.badge}</span>}
          </Link>
        ))}
        <div className="mobile-panel-actions">
          <a
            className="btn btn-outline mobile-whatsapp-btn"
            href={siteData.socials.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
          >
            <WhatsAppIcon size={19} />
            WhatsApp Pre-order
          </a>
          <a className="btn btn-accent" href={tel} onClick={() => setOpen(false)}>
            <Phone size={18} />
            Call to Pre-order
          </a>
        </div>
      </div>
    </header>
  );
}

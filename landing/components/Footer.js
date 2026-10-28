import Link from "next/link";
import { Phone, MapPin, Clock, Mail } from "lucide-react";
import siteData from "@/data/siteData";
import { SocialLinks } from "./SocialIcons";

export default function Footer() {
  const year = 2026;

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <Link href="/" className="footer-brand-header">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={siteData.brand.logo}
                width="40"
                height="40"
                alt={`${siteData.brand.name} logo`}
              />
              <span className="footer-brand-name">{siteData.brand.name}</span>
            </Link>
            <p className="footer-tagline">{siteData.brand.tagline}</p>

            <div className="footer-stall-pill">
              <MapPin size={16} />
              <span>Opposite {siteData.location.gymName}, Mangalore</span>
            </div>

            <div className="footer-hours">
              <Clock size={16} />
              <span>
                {siteData.location.timings.map((t) => `${t.label}: ${t.time}`).join(" • ")}
              </span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="footer-links">
            <h4 className="footer-heading">Explore</h4>
            <ul>
              <li>
                <Link href="/#menu">Our Menu</Link>
              </li>
              <li>
                <Link href="/#why">Why Us</Link>
              </li>
              <li>
                <Link href="/#how">How It Works</Link>
              </li>
              <li>
                <Link href="/#supplements">Supplements Range</Link>
              </li>
              <li>
                <Link href="/#app">FitMitra Mobile App</Link>
              </li>
              <li>
                <Link href="/#team">Meet the Team</Link>
              </li>
              <li>
                <Link href="/#contact">Stall Location &amp; Map</Link>
              </li>
            </ul>
          </div>

          {/* Legal Pages Column */}
          <div className="footer-links footer-legal-col">
            <h4 className="footer-heading">Legal &amp; Policies</h4>
            <ul>
              <li>
                <Link href="/refund" className="footer-highlight-link">
                  <span>Refund &amp; Cancellation</span>
                  <span className="badge-tag">Important</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms">Terms &amp; Conditions</Link>
              </li>
              <li>
                <Link href="/shipping-policy">Pickup &amp; Shipping</Link>
              </li>
              <li>
                <Link href="/disclaimer">Health &amp; Nutritional Disclaimer</Link>
              </li>
            </ul>
          </div>

          {/* Connect & Socials Column */}
          <div className="footer-socials">
            <h4 className="footer-heading">Connect &amp; Community</h4>
            <p className="footer-social-desc">
              Follow our journey, get daily workout nutrition tips, and chat directly with our stall team:
            </p>
            <SocialLinks variant="round" showAll={true} />

            <div className="footer-direct-contact">
              <a href={`tel:${siteData.contact.phoneRaw}`} className="footer-contact-item">
                <Phone size={16} />
                <span>Call: {siteData.contact.phoneDisplay}</span>
              </a>
              <a href={`mailto:${siteData.contact.email}`} className="footer-contact-item">
                <Mail size={16} />
                <span>{siteData.contact.email}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-flex">
            <p className="footer-copyright">
              © {year} {siteData.brand.name}. All rights reserved. Made fresh in Mangalore.
            </p>
            <div className="footer-bottom-links">
              <Link href="/refund">Refund Policy</Link>
              <span className="sep">•</span>
              <Link href="/privacy">Privacy</Link>
              <span className="sep">•</span>
              <Link href="/terms">Terms</Link>
              <span className="sep">•</span>
              <Link href="/shipping-policy">Shipping</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

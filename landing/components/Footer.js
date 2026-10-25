"use client";

import { useState, useEffect } from "react";
import siteData from "@/data/siteData";
import { SocialLinks } from "./SocialIcons";

export default function Footer() {
  const [year, setYear] = useState(2025);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-brand-header">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={siteData.brand.logo}
                width="36"
                height="36"
                alt={`${siteData.brand.name} logo`}
              />
              <span className="footer-brand-name">{siteData.brand.name}</span>
            </div>
            <p className="footer-tagline">{siteData.brand.tagline}</p>
          </div>

          <div className="footer-links">
            <h4 className="footer-heading">Quick Links</h4>
            <ul>
              <li>
                <a href="#menu">Menu</a>
              </li>
              <li>
                <a href="#why">Why Us</a>
              </li>
              <li>
                <a href="#how">How It Works</a>
              </li>
              <li>
                <a href="#team">Team</a>
              </li>
              <li>
                <a href="#contact">Contact</a>
              </li>
            </ul>
          </div>

          <div className="footer-socials">
            <h4 className="footer-heading">Connect</h4>
            <SocialLinks variant="round" />
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {year} {siteData.brand.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import siteData from "@/data/siteData";

export default function StickyCallBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Only show when scrolled past the top hero section
      setShow(window.scrollY > 280);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`sticky-call ${show ? "is-visible" : ""}`} aria-hidden={!show}>
      <div className="container">
        <a
          href={`tel:${siteData.contact.phoneRaw}`}
          className="btn btn-accent sticky-call-btn"
          tabIndex={show ? 0 : -1}
          aria-label="Call to pre-order"
        >
          <Phone size={18} />
          <span>Call to Pre-order</span>
        </a>
      </div>
    </div>
  );
}

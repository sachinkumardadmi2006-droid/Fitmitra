"use client";

import Link from "next/link";
import { ArrowLeft, Clock, ShieldCheck, Mail, Phone, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StickyCallBar from "@/components/StickyCallBar";
import siteData from "@/data/siteData";
import { WhatsAppIcon } from "./SocialIcons";

export default function LegalLayout({
  title,
  subtitle,
  category = "Legal Policy",
  lastUpdated = siteData.legal?.lastUpdated || "October 2026",
  toc = [],
  quickSummary,
  children,
}) {
  return (
    <>
      <Navbar />
      <main className="legal-page">
        {/* Header Hero */}
        <div className="legal-hero">
          <div className="container">
            <nav className="legal-breadcrumbs" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <ChevronRight size={14} />
              <span>Legal</span>
              <ChevronRight size={14} />
              <span className="current">{title}</span>
            </nav>

            <div className="legal-hero-content">
              <div className="legal-badge-row">
                <span className="eyebrow">{category}</span>
                <span className="legal-updated">
                  <Clock size={14} /> Last updated: {lastUpdated}
                </span>
              </div>
              <h1 className="legal-hero-title">{title}</h1>
              {subtitle && <p className="legal-hero-sub">{subtitle}</p>}
              {quickSummary && (
                <div className="legal-hero-summary">
                  {quickSummary}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="container legal-body-container">
          <div className="legal-layout-grid">
            {/* Sidebar Table of Contents */}
            <aside className="legal-sidebar">
              <div className="legal-sidebar-sticky">
                <Link href="/" className="btn-back-home">
                  <ArrowLeft size={16} />
                  <span>Back to Home</span>
                </Link>

                {toc && toc.length > 0 && (
                  <div className="legal-toc-card">
                    <h3 className="legal-toc-heading">Table of Contents</h3>
                    <ul className="legal-toc-list">
                      {toc.map((item, i) => (
                        <li key={i}>
                          <a href={`#${item.id}`} className="legal-toc-link">
                            <span className="toc-num">{i + 1}.</span>
                            <span>{item.label}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Desktop-only extras (Need Assistance & Other Policies in sidebar) */}
                <div className="desktop-sidebar-extras">
                  <div className="legal-help-card">
                    <div className="help-icon-wrap">
                      <ShieldCheck size={26} />
                    </div>
                    <h4>Need assistance?</h4>
                    <p>Our customer care team is available during gym stall hours.</p>
                    <div className="help-links">
                      <a href={`tel:${siteData.contact.phoneRaw}`} className="help-link-row">
                        <Phone size={15} />
                        <span>{siteData.contact.phoneDisplay}</span>
                      </a>
                      <a href={`mailto:${siteData.contact.email}`} className="help-link-row">
                        <Mail size={15} />
                        <span>{siteData.contact.email}</span>
                      </a>
                      <a
                        href={siteData.socials.whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="help-link-row highlight"
                      >
                        <WhatsAppIcon size={15} />
                        <span>WhatsApp Support</span>
                      </a>
                    </div>
                  </div>

                  <div className="legal-other-links">
                    <span className="legal-other-title">Other Policies</span>
                    <div className="legal-chips">
                      <Link href="/refund">Refund Policy</Link>
                      <Link href="/privacy">Privacy Policy</Link>
                      <Link href="/terms">Terms of Service</Link>
                      <Link href="/shipping-policy">Pickup & Shipping</Link>
                      <Link href="/disclaimer">Health Disclaimer</Link>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Document Content */}
            <article className="legal-article">
              <div className="legal-content-card">
                {children}

                {/* Bottom Grievance / Contact Box */}
                <div className="legal-contact-footer">
                  <h3>Customer Grievance & Contact Information</h3>
                  <p>
                    For questions, feedback, or refund claims regarding this policy, please reach out to our team:
                  </p>
                  <div className="legal-info-table">
                    <div className="info-row">
                      <span className="info-key">Brand / Entity:</span>
                      <span className="info-val">{siteData.legal?.companyName || siteData.brand.name}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-key">Stall Address:</span>
                      <span className="info-val">{siteData.location.addressLine}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-key">Direct Helpline:</span>
                      <span className="info-val">
                        <a href={`tel:${siteData.contact.phoneRaw}`}>{siteData.contact.phoneDisplay}</a>
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-key">Support Email:</span>
                      <span className="info-val">
                        <a href={`mailto:${siteData.contact.email}`}>{siteData.contact.email}</a>
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-key">Operating Timings:</span>
                      <span className="info-val">
                        {siteData.location.timings.map((t) => `${t.label}: ${t.time}`).join(" | ")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile-only extras at the end of the policy */}
              <div className="mobile-bottom-extras">
                <div className="legal-other-links">
                  <span className="legal-other-title">Other Policies</span>
                  <div className="legal-chips">
                    <Link href="/refund">Refund Policy</Link>
                    <Link href="/privacy">Privacy Policy</Link>
                    <Link href="/terms">Terms of Service</Link>
                    <Link href="/shipping-policy">Pickup & Shipping</Link>
                    <Link href="/disclaimer">Health Disclaimer</Link>
                  </div>
                </div>

                <div className="legal-help-card">
                  <div className="help-icon-wrap">
                    <ShieldCheck size={26} />
                  </div>
                  <h4>Need assistance?</h4>
                  <p>Our customer care team is available during gym stall hours.</p>
                  <div className="help-links">
                    <a href={`tel:${siteData.contact.phoneRaw}`} className="help-link-row">
                      <Phone size={15} />
                      <span>{siteData.contact.phoneDisplay}</span>
                    </a>
                    <a href={`mailto:${siteData.contact.email}`} className="help-link-row">
                      <Mail size={15} />
                      <span>{siteData.contact.email}</span>
                    </a>
                    <a
                      href={siteData.socials.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="help-link-row highlight"
                    >
                      <WhatsAppIcon size={15} />
                      <span>WhatsApp Support</span>
                    </a>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </main>
      <Footer />
      <StickyCallBar />
    </>
  );
}

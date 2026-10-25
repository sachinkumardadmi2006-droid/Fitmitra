import { Phone, Mail, Clock, MapPin } from "lucide-react";
import siteData from "@/data/siteData";
import Reveal from "@/components/Reveal";
import { SocialLinks } from "./SocialIcons";

export default function Location() {
  const hasEmbed =
    typeof siteData.location.mapsEmbedUrl === "string" &&
    siteData.location.mapsEmbedUrl.trim().length > 0;

  return (
    <section id="contact" className="section">
      <div className="container">
        <Reveal className="section-header">
          <p className="eyebrow">Find us</p>
          <h2 className="section-title">Visit the stall</h2>
          <p className="section-sub">{siteData.location.addressLine}</p>
        </Reveal>

        <div className="contact-grid">
          <Reveal delay={0}>
            <div className="contact-card card">
              <h3 className="contact-gym-name">Opposite {siteData.location.gymName}</h3>
              <p className="contact-address">{siteData.location.addressLine}</p>

              <div className="contact-timings">
                <div className="timings-header">
                  <Clock size={20} />
                  <span>Timings</span>
                </div>
                <ul className="timings-list">
                  {siteData.location.timings.map((t, idx) => (
                    <li key={idx} className="timing-item">
                      <span className="timing-label">{t.label}:</span>
                      <span className="timing-value">{t.time}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="contact-details">
                <a
                  href={`tel:${siteData.contact.phoneRaw}`}
                  className="contact-row"
                >
                  <Phone size={20} />
                  <span>{siteData.contact.phoneDisplay}</span>
                </a>
                <a
                  href={`mailto:${siteData.contact.email}`}
                  className="contact-row"
                >
                  <Mail size={20} />
                  <span>{siteData.contact.email}</span>
                </a>
              </div>

              <div className="contact-actions">
                <a
                  href={`tel:${siteData.contact.phoneRaw}`}
                  className="btn btn-accent"
                >
                  <Phone size={18} />
                  <span>Call to Pre-order</span>
                </a>
                <a
                  href={siteData.location.mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  Open in Google Maps
                </a>
              </div>

              <SocialLinks variant="pill" />
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="map-card card">
              {hasEmbed ? (
                <iframe
                  src={siteData.location.mapsEmbedUrl}
                  loading="lazy"
                  title="Nexvyro Fitness location map"
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: "360px",
                    border: 0,
                    borderRadius: "var(--radius-lg)",
                  }}
                />
              ) : (
                <div className="map-placeholder">
                  <div className="map-pin-icon-wrap">
                    <MapPin size={48} />
                  </div>
                  <h3>Find us opposite {siteData.location.gymName}</h3>
                  <p>{siteData.location.addressLine}</p>
                  <a
                    href={siteData.location.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                  >
                    Open in Google Maps
                  </a>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

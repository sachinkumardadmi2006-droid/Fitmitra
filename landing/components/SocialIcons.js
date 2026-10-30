import siteData from "@/data/siteData";

export function WhatsAppIcon({ size = 20, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      style={{ flexShrink: 0, display: "block" }}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}



const strokeBase = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
};

export function InstagramIcon({ size = 20, className = "" }) {
  return (
    <svg
      {...strokeBase}
      width={size}
      height={size}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      style={{ flexShrink: 0, display: "block" }}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function YouTubeIcon({ size = 20, className = "" }) {
  return (
    <svg
      {...strokeBase}
      width={size}
      height={size}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      style={{ flexShrink: 0, display: "block" }}
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.56 49.56 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

export function XIcon({ size = 18, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      style={{ flexShrink: 0, display: "block" }}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function FacebookIcon({ size = 20, className = "" }) {
  return (
    <svg
      {...strokeBase}
      width={size}
      height={size}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      style={{ flexShrink: 0, display: "block" }}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function GoogleMapsIcon({ size = 20, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 92.3 132.3"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      style={{ flexShrink: 0, display: "block" }}
    >
      <path fill="#1a73e8" d="M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z" />
      <path fill="#ea4335" d="M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-33.3-21.8-18.3z" />
      <path fill="#4285f4" d="M46.2 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.6 27.5-32.7-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.3-3.8 8.1-6.3 13.6-6.3" />
      <path fill="#fbbc04" d="M46.2 63.8c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.5-8.3 4.1-11.3l-28 33.3c4.8 10.6 12.8 19.2 21 29.9l34.1-40.5c-3.3 3.9-8.1 6.3-13.5 6.3" />
      <path fill="#34a853" d="M59.1 109.2c15.4-24.1 33.3-35 33.3-63 0-7.7-1.9-14.9-5.2-21.3L25.6 98c2.6 3.4 5.3 7.3 7.9 11.3 9.4 14.5 6.8 23.1 12.8 23.1s3.4-8.7 12.8-23.2" />
    </svg>
  );
}

export function SocialLinks({ variant = "round", showAll = true }) {
  const { socials } = siteData;

  const items = [
    { key: "whatsapp", label: "WhatsApp", href: socials.whatsapp, Icon: WhatsAppIcon, handle: "Chat & Pre-order" },
    { key: "instagram", label: "Instagram", href: socials.instagram, Icon: InstagramIcon, handle: "@fitmitra_fitness" },
    { key: "youtube", label: "YouTube", href: socials.youtube, Icon: YouTubeIcon, handle: "Fitmitra Fitness" },
    { key: "twitter", label: "X (Twitter)", href: socials.twitter, Icon: XIcon, handle: "@fitmitra" },
    { key: "facebook", label: "Facebook", href: socials.facebook, Icon: FacebookIcon, handle: "Fitmitra Official" },
  ];

  const displayedItems = showAll ? items : items.slice(0, 4);

  return (
    <div className={`social-links social-${variant}`}>
      {displayedItems.map(({ key, label, href, Icon, handle }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="social-btn"
          data-network={key}
          aria-label={`Connect with us on ${label}`}
        >
          <Icon size={variant === "pill" ? 18 : 20} />
          <span className="social-label">{label}</span>
          {variant === "cards" && <span className="social-handle">{handle}</span>}
        </a>
      ))}
    </div>
  );
}

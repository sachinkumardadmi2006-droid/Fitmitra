export default function ShakeIllustration() {
  return (
    <svg
      viewBox="0 0 360 440"
      className="shake-svg"
      role="img"
      aria-label="Illustration of a Nexvyro protein shake bottle"
    >
      <defs>
        <linearGradient id="shBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4E9457" />
          <stop offset="0.45" stopColor="#8FD594" />
          <stop offset="1" stopColor="#3F8248" />
        </linearGradient>
        <linearGradient id="shLid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD54F" />
          <stop offset="1" stopColor="#E0A800" />
        </linearGradient>
        <linearGradient id="shLiquid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF0B8" />
          <stop offset="1" stopColor="#FBC02D" />
        </linearGradient>
        <radialGradient id="shShadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#0B3D1A" stopOpacity="0.35" />
          <stop offset="1" stopColor="#0B3D1A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="180" cy="412" rx="120" ry="16" fill="url(#shShadow)" />
      <rect x="95" y="112" width="170" height="292" rx="44" fill="url(#shBody)" />
      <rect x="113" y="140" width="14" height="215" rx="7" fill="#FFFFFF" opacity="0.35" />
      <rect x="126" y="258" width="108" height="100" rx="26" fill="url(#shLiquid)" opacity="0.95" />
      <rect x="120" y="170" width="120" height="78" rx="20" fill="#FFFFFF" opacity="0.95" />
      <text x="180" y="216" textAnchor="middle" fontSize="38" fontWeight="800" fill="#0B3D1A" fontFamily="inherit">N</text>
      <text x="180" y="236" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="2" fill="#00897B" fontFamily="inherit">PROTEIN</text>
      <rect x="105" y="72" width="150" height="48" rx="16" fill="url(#shLid)" />
      <rect x="150" y="38" width="60" height="42" rx="14" fill="#0B3D1A" />
      <circle cx="82" cy="190" r="9" fill="#FBC02D" opacity="0.9" />
      <circle cx="288" cy="150" r="13" fill="#00897B" opacity="0.8" />
      <circle cx="300" cy="300" r="7" fill="#71BC75" />
      <circle cx="68" cy="330" r="12" fill="#B2DFDB" />
    </svg>
  );
}

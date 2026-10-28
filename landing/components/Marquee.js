import { Sparkles } from "lucide-react";
import siteData from "@/data/siteData";

export default function Marquee() {
  const half = [...siteData.marquee, ...siteData.marquee];
  const row = [...half, ...half];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {row.map((text, i) => (
          <span key={i} className="marquee-item">
            <Sparkles size={18} />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

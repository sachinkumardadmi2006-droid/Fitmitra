import { Phone } from "lucide-react";
import siteData from "@/data/siteData";

export default function StickyCallBar() {
  return (
    <div className="sticky-call">
      <div className="container">
        <a
          href={`tel:${siteData.contact.phoneRaw}`}
          className="btn btn-accent sticky-call-btn"
        >
          <Phone size={18} />
          <span>Call to Pre-order</span>
        </a>
      </div>
    </div>
  );
}

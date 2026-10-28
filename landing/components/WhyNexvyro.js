import { Leaf, Dumbbell, MapPin, Phone } from "lucide-react";
import siteData from "@/data/siteData";
import Reveal from "@/components/Reveal";

const iconMap = {
  Leaf,
  Dumbbell,
  MapPin,
  Phone,
};

export default function WhyNexvyro() {
  return (
    <section id="why" className="section">
      <div className="container">
        <Reveal className="section-header">
          <p className="eyebrow">Why Us</p>
          <h2 className="section-title">{siteData.why.title}</h2>
          <p className="section-sub">{siteData.why.subtitle}</p>
        </Reveal>

        <div className="why-grid">
          {siteData.why.points.map((point, index) => {
            const IconComponent = iconMap[point.icon] || Leaf;
            return (
              <Reveal key={index} delay={index * 80}>
                <article className="why-card card">
                  <div className="why-icon-circle">
                    <IconComponent size={24} />
                  </div>
                  <h3>{point.title}</h3>
                  <p>{point.text}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

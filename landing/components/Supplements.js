import siteData from "@/data/siteData";
import Reveal from "@/components/Reveal";
import Waitlist from "@/components/Waitlist";

export default function Supplements() {
  return (
    <section id="supplements" className="section section-supp">
      <div className="container">
        <Reveal>
          <div className="supp-panel">
            <span className="supp-orb orb-1" aria-hidden="true" />
            <span className="supp-orb orb-2" aria-hidden="true" />
            <div className="supp-content">
              <span className="eyebrow supp-badge">{siteData.supplements.badge}</span>
              <h2 className="section-title supp-title">{siteData.supplements.title}</h2>
              <p className="section-sub supp-text">{siteData.supplements.text}</p>
            </div>
            <div className="supp-form-card card">
              <Waitlist />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

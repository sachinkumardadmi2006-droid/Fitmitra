import siteData from "@/data/siteData";
import Reveal from "@/components/Reveal";

export default function HowItWorks() {
  return (
    <section id="how" className="section">
      <div className="container">
        <Reveal className="section-header">
          <p className="eyebrow">How It Works</p>
          <h2 className="section-title">{siteData.how.title}</h2>
          <p className="section-sub">{siteData.how.subtitle}</p>
        </Reveal>

        <div className="steps">
          {siteData.how.steps.map((step, index) => (
            <Reveal key={index} delay={index * 80}>
              <div className="step">
                <div className="step-number">{index + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

import siteData from "@/data/siteData";
import Reveal from "@/components/Reveal";

export default function Team() {
  return (
    <section id="team" className="section">
      <div className="container">
        <Reveal className="section-header">
          <p className="eyebrow">Our Team</p>
          <h2 className="section-title">{siteData.team.title}</h2>
          <p className="section-sub">{siteData.team.subtitle}</p>
        </Reveal>

        <div className="team-grid">
          {siteData.team.members.map((member, index) => (
            <Reveal key={index} delay={index * 80}>
              <article className="team-card card">
                <div className="team-photo-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="team-photo"
                  />
                </div>
                <h3>{member.name}</h3>
                <p className="team-role">{member.role}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

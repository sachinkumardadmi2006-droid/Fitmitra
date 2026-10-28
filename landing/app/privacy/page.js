import LegalLayout from "@/components/LegalLayout";
import siteData from "@/data/siteData";
import { Lock, Utensils, Headphones, BellRing } from "lucide-react";

export const metadata = {
  title: `Privacy Policy | ${siteData.brand.name}`,
  description: `Learn how ${siteData.brand.name} collects, uses, and safeguards your personal data when ordering fresh meals or joining our supplements waitlist.`,
};

const toc = [
  { id: "intro", label: "Introduction" },
  { id: "information-collected", label: "Information We Collect" },
  { id: "how-we-use", label: "How We Use Your Data" },
  { id: "sharing", label: "Data Sharing & Security" },
  { id: "cookies", label: "Cookies & Analytics" },
  { id: "your-rights", label: "Your Rights & Control" },
  { id: "contact-privacy", label: "Grievance Officer" },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle={`We value your trust and safeguard your personal details when you interact with ${siteData.brand.name}.`}
      category="Data Protection"
      toc={toc}
      quickSummary={
        <div className="legal-callout callout-neutral">
          <h4>
            <Lock size={20} />
            <span>Our Privacy Commitment in Plain English</span>
          </h4>
          <p>
            We only collect the minimum details needed to take your pre-order, have your fresh protein ready when you walk out of the gym, or notify you when our supplements launch. We never sell or spam your phone number or email.
          </p>
        </div>
      }
    >
      <div className="legal-prose">
        <section id="intro" className="legal-section">
          <h2>1. Introduction</h2>
          <p>
            {siteData.brand.name} (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the stall opposite {siteData.location.gymName} in Mangalore, along with our landing page and upcoming mobile applications. This Privacy Policy details how we handle information collected across all our service touchpoints.
          </p>
          <p>
            By placing an order, contacting us via call/WhatsApp, or submitting our waitlist form, you consent to the practices described in this policy.
          </p>
        </section>

        <section id="information-collected" className="legal-section">
          <h2>2. Information We Collect</h2>
          <p>We collect information in the following ways:</p>
          <ul>
            <li>
              <strong>Direct Contact &amp; Pre-orders:</strong> When you call or WhatsApp us to pre-order food, we may record your name, phone number, and specific dietary preference or order items to fulfill your request.
            </li>
            <li>
              <strong>Waitlist Sign-up:</strong> When you subscribe for early access to our supplements and app, we collect your email address and optional fitness interests.
            </li>
            <li>
              <strong>In-Stall Payments:</strong> Payment transaction references (UPI transaction IDs or receipt numbers). We do NOT store your bank account passwords, UPI PINs, or raw credit/debit card numbers.
            </li>
            <li>
              <strong>Technical Logs:</strong> Anonymized browser information, device type, IP address, and interaction metrics to improve web loading speeds and responsiveness.
            </li>
          </ul>
        </section>

        <section id="how-we-use" className="legal-section">
          <h2>3. How We Use Your Data</h2>
          <p>Your information is used strictly for legitimate business and customer service purposes:</p>
          <div className="legal-cards-grid">
            <div className="policy-card">
              <span className="policy-badge">
                <Utensils size={13} />
                <span>Kitchen</span>
              </span>
              <h4>Order Fulfillment</h4>
              <p>Preparing your meal or shake accurately and notifying you when it is ready for counter pickup.</p>
            </div>
            <div className="policy-card">
              <span className="policy-badge">
                <Headphones size={13} />
                <span>Support</span>
              </span>
              <h4>Customer Support</h4>
              <p>Resolving any order questions, refund requests, or dietary customization inquiries.</p>
            </div>
            <div className="policy-card">
              <span className="policy-badge">
                <BellRing size={13} />
                <span>Alerts</span>
              </span>
              <h4>Product Updates</h4>
              <p>Sending timely email alerts when supplements and app features go live (you can unsubscribe anytime).</p>
            </div>
          </div>
        </section>

        <section id="sharing" className="legal-section">
          <h2>4. Data Sharing &amp; Security</h2>
          <p>
            <strong>Zero Data Selling:</strong> We do NOT sell, rent, or trade your personal data to marketing third parties.
          </p>
          <p>
            We may share minimal required data with trusted service providers who assist our operations under strict confidentiality agreements:
          </p>
          <ul>
            <li>Licensed Indian payment gateways and UPI service providers to execute transactions.</li>
            <li>Cloud hosting providers and transactional email/SMS delivery partners.</li>
            <li>Law enforcement agencies only when strictly mandated under applicable Indian statutory laws.</li>
          </ul>
          <p>
            We employ modern encryption protocols (HTTPS/TLS) and secure database access controls to prevent unauthorized access or disclosure.
          </p>
        </section>

        <section id="cookies" className="legal-section">
          <h2>5. Cookies &amp; Analytics</h2>
          <p>
            Our website uses minimal, functional cookies to remember user preferences (such as animation preferences and session states) and non-invasive privacy-friendly analytics to track page visits and improve mobile responsiveness.
          </p>
          <p>
            You can configure your browser to reject all cookies or notify you when a cookie is set. Disabling cookies will not restrict your access to our menu or location details.
          </p>
        </section>

        <section id="your-rights" className="legal-section">
          <h2>6. Your Rights &amp; Control</h2>
          <p>
            Under the Digital Personal Data Protection Act (DPDP Act) and relevant consumer regulations, you have the right to:
          </p>
          <ul>
            <li>Request a copy of the personal data we hold about you.</li>
            <li>Request correction or updating of any inaccurate contact details.</li>
            <li>Request permanent deletion of your phone number or email from our waitlist/records.</li>
            <li>Opt out of marketing communications by clicking &quot;Unsubscribe&quot; or texting STOP.</li>
          </ul>
        </section>

        <section id="contact-privacy" className="legal-section">
          <h2>7. Grievance Officer</h2>
          <p>
            In accordance with Indian Information Technology Act, 2000 and DPDP rules, any privacy grievances or data deletion requests should be addressed to our designated officer:
          </p>
          <div className="legal-callout callout-accent">
            <p><strong>Grievance Officer:</strong> Data Protection Lead</p>
            <p><strong>Entity:</strong> {siteData.legal?.companyName || siteData.brand.name}</p>
            <p><strong>Email:</strong> <a href={`mailto:${siteData.contact.email}`}>{siteData.contact.email}</a></p>
            <p><strong>Phone:</strong> <a href={`tel:${siteData.contact.phoneRaw}`}>{siteData.contact.phoneDisplay}</a></p>
            <p><strong>Address:</strong> {siteData.location.addressLine}</p>
          </div>
        </section>
      </div>
    </LegalLayout>
  );
}

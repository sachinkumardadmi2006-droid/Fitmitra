import LegalLayout from "@/components/LegalLayout";
import siteData from "@/data/siteData";
import { FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: `Terms & Conditions | ${siteData.brand.name}`,
  description: `Review the terms and conditions governing pre-orders, stall pickup, website use, and supplements at ${siteData.brand.name}.`,
};

const toc = [
  { id: "acceptance", label: "Acceptance of Terms" },
  { id: "services", label: "Description of Services" },
  { id: "orders-pricing", label: "Orders, Pricing & Payments" },
  { id: "allergens", label: "Allergen & Health Responsibility" },
  { id: "intellectual-property", label: "Intellectual Property" },
  { id: "limitation", label: "Limitation of Liability" },
  { id: "jurisdiction", label: "Governing Law & Jurisdiction" },
];

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      subtitle={`Rules and agreements governing your interactions, orders, and services with ${siteData.brand.name}.`}
      category="User Agreement"
      toc={toc}
      quickSummary={
        <div className="legal-callout callout-accent">
          <h4>
            <FileText size={20} />
            <span>Quick Terms Summary</span>
          </h4>
          <p>
            By using this website, calling or messaging to pre-order, or collecting orders from our stall opposite {siteData.location.gymName}, you agree to these transparent terms designed to ensure top quality and safety for our fitness community.
          </p>
        </div>
      }
    >
      <div className="legal-prose">
        <section id="acceptance" className="legal-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            These Terms &amp; Conditions (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User&quot;, &quot;Customer&quot;) and {siteData.legal?.companyName || siteData.brand.name} (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;).
          </p>
          <p>
            If you do not agree to all terms stated herein, you must refrain from placing orders or utilizing our online services.
          </p>
        </section>

        <section id="services" className="legal-section">
          <h2>2. Description of Services</h2>
          <p>
            {siteData.brand.name} provides:
          </p>
          <ul>
            <li>Fresh, protein-dense meals, customized protein shakes, and milk beverages prepared at our physical counter opposite {siteData.location.gymName}, Mangalore.</li>
            <li>Phone-based and messaging-based pre-ordering to reduce waiting times after fitness workouts.</li>
            <li>Information on nutrition, fitness tips, and waitlist registration for our upcoming branded dietary supplements.</li>
          </ul>
        </section>

        <section id="orders-pricing" className="legal-section">
          <h2>3. Orders, Pricing &amp; Payments</h2>
          <ul>
            <li>
              <strong>Menu Accuracy:</strong> Prices shown on our menu boards or website are in Indian Rupees (₹) and include applicable local taxes unless explicitly stated otherwise.
            </li>
            <li>
              <strong>Order Confirmation:</strong> A pre-order is confirmed once acknowledged by our counter staff via phone, message, or automated system.
            </li>
            <li>
              <strong>Counter Pickup:</strong> Orders are prepared to be collected at the stall during designated operating hours ({siteData.location.timings.map(t => `${t.label}: ${t.time}`).join(" & ")}).
            </li>
            <li>
              <strong>Payment Settlement:</strong> Payment must be made at pickup or via digital prepay (UPI/Cards). Unpaid orders will not be released.
            </li>
          </ul>
        </section>

        <section id="allergens" className="legal-section">
          <h2>4. Allergen &amp; Health Responsibility</h2>
          <p>
            Our kitchen handles dairy (milk, whey concentrate/isolate), soy, nuts, gluten, and eggs.
          </p>
          <ul>
            <li>
              <strong>Customer Duty to Disclose:</strong> You MUST explicitly notify our staff of any food allergies or intolerances prior to placing an order.
            </li>
            <li>
              <strong>Cross-Contamination:</strong> While we exercise diligent cleanliness, we cannot guarantee 100% absence of airborne allergen traces in an active food stall environment.
            </li>
          </ul>
        </section>

        <section id="intellectual-property" className="legal-section">
          <h2>5. Intellectual Property</h2>
          <p>
            All logos, brand names, visual styling, custom 3D assets, website code, and content are the proprietary intellectual property of {siteData.brand.name}. You may not reproduce, copy, or redistribute any materials without our prior written consent.
          </p>
        </section>

        <section id="limitation" className="legal-section">
          <h2>6. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted under Indian law:
          </p>
          <ul>
            <li>
              Our maximum financial liability for any dispute or order claim shall never exceed the actual amount paid by you for the specific item in question.
            </li>
            <li>
              We are not liable for delayed pickups resulting from user tardiness, power outages, extreme weather, or force majeure events.
            </li>
          </ul>
        </section>

        <section id="jurisdiction" className="legal-section">
          <h2>7. Governing Law &amp; Jurisdiction</h2>
          <p>
            These Terms shall be interpreted and governed by the laws of India. Any legal dispute or controversy arising out of these Terms shall be subject to the exclusive jurisdiction of the competent courts in Mangalore, Karnataka, India.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}

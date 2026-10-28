import LegalLayout from "@/components/LegalLayout";
import siteData from "@/data/siteData";
import { Sparkles, RefreshCw, ShieldCheck, PackageCheck, Phone, Mail, MessageSquare } from "lucide-react";

export const metadata = {
  title: `Refund & Cancellation Policy | ${siteData.brand.name}`,
  description: `Understand our refund, return, and cancellation policies for fresh protein meals, shakes, and upcoming packaged supplements at ${siteData.brand.name}.`,
};

const toc = [
  { id: "overview", label: "Policy Overview" },
  { id: "cancellations", label: "Pre-order Cancellations" },
  { id: "fresh-orders", label: "Stall Pickup & Quality Guarantee" },
  { id: "supplements", label: "Packaged Supplements & Merch" },
  { id: "refund-process", label: "Refund Methods & Timelines" },
  { id: "exceptions", label: "Non-Refundable Items" },
  { id: "claims", label: "How to File a Claim" },
];

export default function RefundPage() {
  return (
    <LegalLayout
      title="Refund & Cancellation Policy"
      subtitle={`Our commitment to fresh quality, transparency, and customer satisfaction at ${siteData.brand.name}.`}
      category="Customer Guarantee"
      toc={toc}
      quickSummary={
        <div className="legal-callout callout-accent">
          <h4>
            <Sparkles size={20} />
            <span>Our Freshness &amp; Satisfaction Guarantee</span>
          </h4>
          <p>
            At <strong>{siteData.brand.name}</strong>, we prepare every protein meal, shake, and drink fresh right opposite your gym. If there is ever an issue with taste, freshness, or accuracy, we will remake your order on the spot or refund your payment with zero hassle.
          </p>
        </div>
      }
    >
      <div className="legal-prose">
        {/* Section 1 */}
        <section id="overview" className="legal-section">
          <h2>1. Policy Overview</h2>
          <p>
            This Refund and Cancellation Policy governs orders placed through our stall, phone calls, WhatsApp pre-orders, and upcoming online web/mobile purchases with {siteData.brand.name} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;).
          </p>
          <p>
            Because we specialize in freshly prepared perishable fitness nutrition alongside packaged supplements, our policies are tailored to maintain the highest food safety and hygiene standards while protecting our customers.
          </p>
        </section>

        {/* Section 2 */}
        <section id="cancellations" className="legal-section">
          <h2>2. Pre-order Cancellations</h2>
          <p>
            When you call or message to pre-order food or beverages:
          </p>
          <ul>
            <li>
              <strong>Before preparation starts:</strong> You may cancel or amend your pre-order free of charge if you notify us at least 10 minutes before your requested pickup time.
            </li>
            <li>
              <strong>After preparation starts:</strong> Once ingredients have been blended, cooked, or unsealed specifically for your order, cancellations are not permitted for change of mind.
            </li>
            <li>
              <strong>Delayed pickup:</strong> If you are running late, please notify our team via call or WhatsApp. We will do our best to keep your meal warm or refrigerate your shake for up to 30 minutes. Uncollected orders after 45 minutes cannot be refunded due to perishable food safety rules.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section id="fresh-orders" className="legal-section">
          <h2>3. Stall Pickup &amp; Quality Guarantee</h2>
          <p>
            We take pride in our recipes and hygiene. If your order falls short of our standards, here is how we make it right:
          </p>
          <div className="legal-cards-grid">
            <div className="policy-card">
              <span className="policy-badge">
                <RefreshCw size={13} />
                <span>Instant Remake</span>
              </span>
              <h4>Taste or Temperature Issue</h4>
              <p>Notify our stall barista immediately upon pickup. We will remake your shake or meal fresh on the spot at no extra cost.</p>
            </div>
            <div className="policy-card">
              <span className="policy-badge">
                <ShieldCheck size={13} />
                <span>Full Refund</span>
              </span>
              <h4>Incorrect or Missing Item</h4>
              <p>If we fail to fulfill your specified dietary preference or item, you are eligible for an immediate full refund or exchange.</p>
            </div>
            <div className="policy-card">
              <span className="policy-badge">
                <PackageCheck size={13} />
                <span>Food Safety</span>
              </span>
              <h4>Hygiene Assurance</h4>
              <p>All ingredients are sourced fresh daily and prepared in food-grade compliant kitchen counters opposite the gym.</p>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section id="supplements" className="legal-section">
          <h2>4. Packaged Supplements &amp; Products</h2>
          <p>
            For upcoming packaged supplements (such as whey protein tubs, creatine, multivitamins, and shakers) sold at our counter or through our website/app:
          </p>
          <ul>
            <li>
              <strong>14-Day Return Window:</strong> You may return eligible products within 14 days of delivery or in-store purchase.
            </li>
            <li>
              <strong>Condition of Return:</strong> The product must be completely unopened, with original seal intact, in original packaging, and accompanied by the invoice or order ID.
            </li>
            <li>
              <strong>Damaged in Transit:</strong> If a supplement tub arrives damaged, cracked, or leaking, notify us within 24 hours of delivery with photos for an immediate replacement.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section id="refund-process" className="legal-section">
          <h2>5. Refund Methods &amp; Timelines</h2>
          <p>
            Refunds will be processed back to the original method of payment:
          </p>
          <div className="table-responsive">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>Payment Method</th>
                  <th>Processing Mode</th>
                  <th>Estimated Timeline</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Cash at Stall</strong></td>
                  <td>Instant cash handed over at the counter</td>
                  <td>Immediate (0 business days)</td>
                </tr>
                <tr>
                  <td><strong>UPI (GPay / PhonePe / Paytm)</strong></td>
                  <td>Direct reversal to same UPI ID / VPA</td>
                  <td>Within 2 to 24 hours</td>
                </tr>
                <tr>
                  <td><strong>Credit / Debit Card</strong></td>
                  <td>Bank gateway chargeback / refund</td>
                  <td>3 to 5 business days</td>
                </tr>
                <tr>
                  <td><strong>Store Credit / Wallet</strong></td>
                  <td>Nexvyro fitness wallet balance</td>
                  <td>Instantaneous</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 6 */}
        <section id="exceptions" className="legal-section">
          <h2>6. Non-Refundable Items</h2>
          <p>Under Indian food safety standards, the following items are strictly non-refundable:</p>
          <ul>
            <li>Fresh meals, shakes, or milk that have been accepted and consumed beyond 25% of the portion.</li>
            <li>Packaged supplements where the outer seal, hologram, or vacuum seal has been torn or broken.</li>
            <li>Orders abandoned at the stall after 45 minutes of scheduled pickup time without prior communication.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section id="claims" className="legal-section">
          <h2>7. How to File a Claim or Request a Refund</h2>
          <p>
            We believe resolving any issue should be as quick as grabbing your shake after a heavy workout:
          </p>
          <ol className="legal-steps">
            <li>
              <strong>In-person:</strong> Speak with our team member at the counter opposite {siteData.location.gymName}.
            </li>
            <li>
              <strong>WhatsApp / Call:</strong> Contact our helpline at <a href={`tel:${siteData.contact.phoneRaw}`}>{siteData.contact.phoneDisplay}</a> with your order details and brief explanation.
            </li>
            <li>
              <strong>Email:</strong> Send an email to <a href={`mailto:${siteData.contact.email}`}>{siteData.contact.email}</a> with subject line &quot;Refund Request - [Order / Phone Number]&quot;.
            </li>
          </ol>
          <p>
            All refund claims are acknowledged within 2 hours and resolved within 24 business hours.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}

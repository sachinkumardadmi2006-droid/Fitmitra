import LegalLayout from "@/components/LegalLayout";
import siteData from "@/data/siteData";
import { MapPin, Truck, Clock } from "lucide-react";

export const metadata = {
  title: `Order Pickup & Shipping Policy | ${siteData.brand.name}`,
  description: `Guidelines for counter pickup opposite ${siteData.location.gymName} in Mangalore and pan-India shipping for upcoming supplements.`,
};

const toc = [
  { id: "stall-pickup", label: "Stall Counter Pickup" },
  { id: "timings-slots", label: "Pickup Slots & Prep Time" },
  { id: "delays-retention", label: "Order Retention Policy" },
  { id: "supplements-shipping", label: "Upcoming Supplement Shipping" },
  { id: "shipping-charges", label: "Rates & Delivery Timelines" },
  { id: "contact-shipping", label: "Pickup & Dispatch Assistance" },
];

export default function ShippingPolicyPage() {
  return (
    <LegalLayout
      title="Order Pickup & Shipping Policy"
      subtitle={`Everything you need to know about collecting your fresh orders and our upcoming nationwide supplement deliveries.`}
      category="Fulfillment Policy"
      toc={toc}
      quickSummary={
        <div className="legal-callout callout-accent">
          <h4>
            <MapPin size={20} />
            <span>Fast Pickup Right Outside Your Gym</span>
          </h4>
          <p>
            Our flagship model is built on convenience: call or message ahead while finishing your last workout sets, and walk across the street to collect your fresh, piping hot or chilled shake within 3 to 7 minutes!
          </p>
        </div>
      }
    >
      <div className="legal-prose">
        <section id="stall-pickup" className="legal-section">
          <h2>1. Stall Counter Pickup Guidelines</h2>
          <p>
            All fresh protein meals, freshly blended shakes, and milk beverages are fulfilled exclusively via counter pickup at our stall opposite <strong>{siteData.location.gymName}</strong>, Mangalore.
          </p>
          <ul>
            <li>
              <strong>Pre-order by Call/WhatsApp:</strong> Contact <a href={`tel:${siteData.contact.phoneRaw}`}>{siteData.contact.phoneDisplay}</a> with your chosen items and anticipated pickup time.
            </li>
            <li>
              <strong>Counter Verification:</strong> Provide your name or last 4 digits of your phone number at the collection counter.
            </li>
            <li>
              <strong>Freshness Check:</strong> Our barista will hand over your order sealed in eco-friendly, food-grade thermal containers or tamper-evident shake cups.
            </li>
          </ul>
        </section>

        <section id="timings-slots" className="legal-section">
          <h2>2. Operating Hours &amp; Preparation Timelines</h2>
          <p>We are open during peak fitness hours 7 days a week:</p>
          <div className="table-responsive">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Counter Timings</th>
                  <th>Average Prep Time</th>
                </tr>
              </thead>
              <tbody>
                {siteData.location.timings.map((t, idx) => (
                  <tr key={idx}>
                    <td><strong>{t.label} Session</strong></td>
                    <td>{t.time}</td>
                    <td>3 - 8 minutes</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="delays-retention" className="legal-section">
          <h2>3. Delayed Pickup &amp; Order Retention Policy</h2>
          <p>
            Because we prepare fresh, nutrient-dense natural food without artificial stabilizers:
          </p>
          <ul>
            <li>
              <strong>First 15 minutes:</strong> Cold shakes are kept refrigerated in our commercial chiller; warm meals are stored in insulated warmers.
            </li>
            <li>
              <strong>15 to 30 minutes:</strong> Quality is monitored. Please message us if you are delayed.
            </li>
            <li>
              <strong>Beyond 45 minutes:</strong> Perishable items past 45 minutes must be disposed of for health safety and cannot be re-served or refunded.
            </li>
          </ul>
        </section>

        <section id="supplements-shipping" className="legal-section">
          <h2>4. Upcoming Supplement Shipping (Pan-India)</h2>
          <p>
            We are currently rolling out pan-India fulfillment for our premium branded supplements (Whey Isolate, Creatine Monohydrate, Electrolytes, and Gym Accessories) on our website and mobile app.
          </p>
          <ul>
            <li>
              <strong>Dispatch Time:</strong> Supplement orders will be dispatched within 24 to 48 hours from our central warehouse.
            </li>
            <li>
              <strong>Courier Partners:</strong> Deliveries will be handled by leading courier networks (Bluedart, Delhivery, DTDC, India Post) with end-to-end tracking.
            </li>
            <li>
              <strong>Tracking Alerts:</strong> You will receive real-time SMS and WhatsApp tracking links upon dispatch.
            </li>
          </ul>
        </section>

        <section id="shipping-charges" className="legal-section">
          <h2>5. Estimated Transit Timelines &amp; Rates</h2>
          <div className="table-responsive">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>Destination Region</th>
                  <th>Estimated Transit</th>
                  <th>Shipping Fee</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Mangalore &amp; Udupi District</strong></td>
                  <td>Same day / Next day</td>
                  <td>FREE on orders ₹499+</td>
                </tr>
                <tr>
                  <td><strong>Karnataka &amp; South India Metro</strong></td>
                  <td>2 to 3 Business Days</td>
                  <td>FREE on orders ₹999+</td>
                </tr>
                <tr>
                  <td><strong>Rest of India</strong></td>
                  <td>3 to 6 Business Days</td>
                  <td>Standard flat rate / Free ₹1499+</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="contact-shipping" className="legal-section">
          <h2>6. Pickup &amp; Dispatch Assistance</h2>
          <p>
            Need help finding our stall counter or checking the status of an order? Speak with our team directly:
          </p>
          <div className="legal-callout callout-neutral">
            <p><strong>Stall Location:</strong> {siteData.location.addressLine}</p>
            <p><strong>Helpline:</strong> <a href={`tel:${siteData.contact.phoneRaw}`}>{siteData.contact.phoneDisplay}</a></p>
            <p><strong>Maps Directions:</strong> <a href={siteData.location.mapsLink} target="_blank" rel="noopener noreferrer">Open Google Maps Navigation</a></p>
          </div>
        </section>
      </div>
    </LegalLayout>
  );
}

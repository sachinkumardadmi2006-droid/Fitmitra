import LegalLayout from "@/components/LegalLayout";
import siteData from "@/data/siteData";
import { AlertTriangle, HeartPulse, Activity } from "lucide-react";

export const metadata = {
  title: `Health & Nutritional Disclaimer | ${siteData.brand.name}`,
  description: `Important health, allergen, and dietary disclaimers regarding fitness nutrition, shakes, and supplements at ${siteData.brand.name}.`,
};

const toc = [
  { id: "general", label: "General Nutritional Advisory" },
  { id: "not-medical", label: "Not Medical or Dietetic Advice" },
  { id: "supplements-advisory", label: "Dietary Supplement Guidance" },
  { id: "allergens", label: "Allergen & Sensitivity Notice" },
  { id: "results-disclaimer", label: "Fitness & Muscle Growth Results" },
];

export default function DisclaimerPage() {
  return (
    <LegalLayout
      title="Health & Nutritional Disclaimer"
      subtitle={`Essential nutritional context, allergen notices, and health advisories for our fitness community.`}
      category="Health Advisory"
      toc={toc}
      quickSummary={
        <div className="legal-callout callout-accent">
          <h4>
            <AlertTriangle size={20} />
            <span>Important Health Notice</span>
          </h4>
          <p>
            The meals, shakes, and nutritional content provided by {siteData.brand.name} are designed to support active lifestyles and general sports nutrition. They are not intended to diagnose, treat, cure, or prevent any medical condition or disease.
          </p>
        </div>
      }
    >
      <div className="legal-prose">
        <section id="general" className="legal-section">
          <h2>1. General Nutritional Advisory</h2>
          <p>
            Nutrient macros (protein grams, caloric estimates, fats, and carbohydrates) displayed on our menu or marketing collateral are calculated based on standardized recipe formulations and standard Indian nutritional databases.
          </p>
          <p>
            Because our food is handcrafted fresh with natural agricultural ingredients, minor variations in portion weight, macronutrient density, or moisture content may naturally occur.
          </p>
        </section>

        <section id="not-medical" className="legal-section">
          <h2>2. Not Medical or Dietetic Advice</h2>
          <p>
            None of the information published on our website, social media, or provided verbally by counter staff should be interpreted as personalized medical, dietetic, or healthcare advice.
          </p>
          <p>
            Always consult a licensed medical physician, certified sports dietitian, or healthcare professional before making substantial changes to your dietary regimen, starting intense bodybuilding programs, or introducing concentrated protein supplements.
          </p>
        </section>

        <section id="supplements-advisory" className="legal-section">
          <h2>3. Dietary Supplement Guidance</h2>
          <p>
            For current and upcoming packaged dietary supplements (such as whey protein, plant protein, creatine, and pre-workouts):
          </p>
          <ul>
            <li>Supplements are intended solely as nutritional adjuncts to a balanced whole-food diet, never as a total replacement for wholesome meals.</li>
            <li>Do not exceed the recommended daily serving stated on product labels.</li>
            <li>Not recommended for children under 18 years of age, pregnant women, nursing mothers, or individuals with pre-existing renal (kidney) or hepatic (liver) conditions without prior medical clearance.</li>
          </ul>
        </section>

        <section id="allergens" className="legal-section">
          <h2>4. Allergen &amp; Sensitivity Notice</h2>
          <p>
            Our preparation facility handles ingredients containing <strong>dairy (cow milk, whey), tree nuts, peanuts, soy, oats, and gluten</strong>.
          </p>
          <p>
            If you have severe allergies or lactose intolerance, please inform our team before ordering so we can accommodate you with dairy-free or plant-based alternatives whenever available.
          </p>
        </section>

        <section id="results-disclaimer" className="legal-section">
          <h2>5. Fitness &amp; Muscle Growth Results</h2>
          <p>
            Testimonials, fitness milestones, and muscle-building progress shared by customers or athletes are individual experiences. Athletic progression depends on consistent resistance training, genetics, sleep quality, overall caloric intake, and lifestyle factors. We make no guarantees of specific physical outcomes.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}

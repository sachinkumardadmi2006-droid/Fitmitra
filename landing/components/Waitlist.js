"use client";

import { useState } from "react";
import siteData from "@/data/siteData";

export default function Waitlist() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const message = `Hi Nexvyro Fitness! Please add me to the supplements waitlist. Name: ${name}, Phone: ${phone}`;

    const rawWhatsapp = siteData.contact.whatsappNumber || "";
    const isDigitsOnly = /^\d+$/.test(rawWhatsapp);
    const isNotAllZeros = !/^0+$/.test(rawWhatsapp);

    if (isDigitsOnly && isNotAllZeros) {
      window.open(
        `https://wa.me/${rawWhatsapp}?text=${encodeURIComponent(message)}`,
        "_blank"
      );
    } else {
      window.location.href = `mailto:${siteData.contact.email}?subject=${encodeURIComponent(
        "Supplements waitlist"
      )}&body=${encodeURIComponent(message)}`;
    }

    setSubmitted(true);
  };

  return (
    <form className="waitlist-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="waitlist-name">Your Name</label>
        <input
          id="waitlist-name"
          type="text"
          placeholder="e.g. Rahul Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="waitlist-phone">Phone Number</label>
        <input
          id="waitlist-phone"
          type="tel"
          placeholder="e.g. 9876543210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn btn-primary waitlist-submit-btn">
        {siteData.supplements.formButton}
      </button>

      {submitted && (
        <p className="waitlist-confirmation">
          Thanks! We will reach out when supplements go live.
        </p>
      )}
    </form>
  );
}

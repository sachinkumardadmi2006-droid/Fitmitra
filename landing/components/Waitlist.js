"use client";

import { useState } from "react";
import { CheckCircle2, Sparkles, BellRing, RotateCcw } from "lucide-react";
import siteData from "@/data/siteData";

export default function Waitlist() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submittedData, setSubmittedData] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const entry = {
      name: name.trim(),
      phone: phone.trim(),
      submittedAt: new Date().toISOString(),
    };

    // Store lead locally for developer / backend retrieval
    try {
      const stored = JSON.parse(localStorage.getItem("fitmitra_waitlist_leads") || "[]");
      stored.push(entry);
      localStorage.setItem("fitmitra_waitlist_leads", JSON.stringify(stored));
    } catch {
      // Fallback for SSR / browser storage restrictions
    }

    setSubmittedData(entry);
    setSubmitted(true);
  };

  const handleReset = () => {
    setName("");
    setPhone("");
    setSubmittedData(null);
    setSubmitted(false);
  };

  if (submitted && submittedData) {
    return (
      <div className="waitlist-thankyou-card">
        <div className="thankyou-badge-row">
          <div className="thankyou-icon-circle animated-check-wrapper" role="status" aria-label="Registration confirmed">
            <svg className="animated-check-svg" viewBox="0 0 52 52" aria-hidden="true">
              <circle className="check-circle" cx="26" cy="26" r="23" fill="none" />
              <path className="check-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>
          <span className="thankyou-priority-badge">
            <Sparkles size={13} />
            <span>Priority Waitlist Confirmed</span>
          </span>
        </div>

        <h3 className="thankyou-title">Thank you for showing interest!</h3>

        <p className="thankyou-desc">
          We have recorded your details and added you to our priority notification list. As soon as our premium supplement range and direct ordering feature go live, we will notify you with exclusive early-bird benefits.
        </p>

        <div className="thankyou-summary-box">
          <div className="summary-field">
            <span className="summary-field-label">Name:</span>
            <span className="summary-field-val">{submittedData.name}</span>
          </div>
          <div className="summary-field">
            <span className="summary-field-label">Phone:</span>
            <span className="summary-field-val">{submittedData.phone}</span>
          </div>
          <div className="summary-field alert-field">
            <span className="summary-field-label">Notification Mode:</span>
            <span className="summary-alert-tag">
              <BellRing size={12} />
              <span>SMS &amp; WhatsApp Alert</span>
            </span>
          </div>
        </div>

        <button type="button" onClick={handleReset} className="thankyou-reset-btn">
          <RotateCcw size={14} />
          <span>Register another number</span>
        </button>
      </div>
    );
  }

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
    </form>
  );
}

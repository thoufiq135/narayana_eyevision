import { useState } from "react";
import { Link } from "react-router-dom";
import "./landing.css";

const FEATURES = [
  {
    icon: "\u25C9",
    title: "Real-Time Face Recognition",
    desc: "Every frame from every connected camera is matched against your enrolled directory in under a second.",
  },
  {
    icon: "\u2713",
    title: "Known vs. Unknown Detection",
    desc: "Employees are recognized and logged automatically. Anyone else is flagged as an unknown visitor for review.",
  },
  {
    icon: "\u25A6",
    title: "Multi-Camera Live View",
    desc: "Monitor every entrance from one screen, with a live status indicator for each connected camera.",
  },
  {
    icon: "\u26A1",
    title: "Instant Alerts",
    desc: "The moment someone is detected, a notification appears — no need to sit and watch a feed all day.",
  },
  {
    icon: "\u25A4",
    title: "Day-Wise History",
    desc: "Every sighting is grouped by day, so you can review this morning or last Tuesday with the same click.",
  },
  {
    icon: "\u25CE",
    title: "Employee Directory",
    desc: "A live, deduplicated grid of everyone detected today — one card per person, always up to date.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Connect your cameras",
    desc: "Point Canteen Watch at your existing RTSP cameras or USB webcams. No new hardware required.",
  },
  {
    number: "02",
    title: "Enroll your people",
    desc: "Add your staff directory once. Every future detection is matched against it automatically.",
  },
  {
    number: "03",
    title: "Watch it work",
    desc: "Known faces are logged silently. Unknown visitors raise an alert. You get a clean daily record either way.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "We used to review hours of footage after every incident. Now we just open the dashboard and filter by day.",
    name: "Priya M.",
    role: "Hostel Warden, Residential Campus",
  },
  {
    quote:
      "The unknown-visitor alerts caught someone tailgating through our staff entrance on day one. Paid for itself immediately.",
    name: "Rohit K.",
    role: "Facilities Manager",
  },
  {
    quote:
      "Our security team finally has one screen instead of four. The day-wise history makes audits painless.",
    name: "Ananya S.",
    role: "Campus Security Lead",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    desc: "For a single entrance and a small team getting started.",
    features: ["1 camera", "Up to 25 enrolled employees", "24-hour history", "Email support"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$49",
    period: "/ month",
    desc: "For canteens, hostels, and campuses with multiple entrances.",
    features: [
      "Up to 8 cameras",
      "Unlimited enrolled employees",
      "90-day day-wise history",
      "Instant alerts & notifications",
      "Priority support",
    ],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For multi-site facilities with dedicated security operations.",
    features: [
      "Unlimited cameras & sites",
      "Unlimited history retention",
      "SSO & role-based access",
      "Dedicated onboarding",
      "24/7 support with SLA",
    ],
    cta: "Talk to sales",
    highlight: false,
  },
];

const FAQS = [
  {
    q: "Do I need special cameras?",
    a: "No. Canteen Watch works with standard RTSP-capable CCTV cameras and USB webcams you likely already have installed.",
  },
  {
    q: "What happens to unrecognized people?",
    a: "They're logged as an unknown visitor with a timestamp, camera, and confidence score, and raise an instant alert so your team can review it.",
  },
  {
    q: "Can I see history from a specific day?",
    a: "Yes. Every sighting — known or unknown — is grouped day by day, so you can jump back to any previous day in one click.",
  },
  {
    q: "Is my data stored securely?",
    a: "Detections are stored on your own backend. Canteen Watch is the monitoring layer on top of infrastructure you control.",
  },
];

function ScanlineHero() {
  return (
    <div className="lp-hero-visual" aria-hidden="true">
      <div className="lp-hero-glow" />
      <div className="lp-mock-frame">
        <div className="lp-mock-titlebar">
          <span />
          <span />
          <span />
        </div>
        <div className="lp-mock-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="lp-mock-tile">
              <div className="lp-mock-scanline" />
              <span className="lp-mock-tile-badge">CAM {String(i + 1).padStart(2, "0")}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="lp-floating-card lp-floating-known">
        <span className="lp-floating-dot" /> Employee verified
      </div>
      <div className="lp-floating-card lp-floating-unknown">
        <span className="lp-floating-dot" /> Unknown visitor
      </div>
    </div>
  );
}

function FaqItem({ q, a }) {
  return (
    <details className="lp-faq-item">
      <summary>{q}</summary>
      <p>{a}</p>
    </details>
  );
}

export default function LandingPage() {
  const [year] = useState(() => new Date().getFullYear());

  return (
    <div className="lp">
      <nav className="lp-nav">
        <a href="#top" className="lp-brand">
          <span className="lp-brand-mark">CW</span>
          <span>Canteen Watch</span>
        </a>
        <div className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="lp-nav-actions">
          <Link to="/login" className="lp-btn lp-btn-ghost">Log in</Link>
          <Link to="/dashboard" className="lp-btn lp-btn-primary">View Dashboard</Link>
        </div>
      </nav>

      <header className="lp-hero" id="top">
        <div className="lp-hero-copy">
          <span className="lp-eyebrow">AI-powered facility monitoring</span>
          <h1>See who's really coming and going.</h1>
          <p className="lp-hero-sub">
            Canteen Watch recognizes your employees automatically and flags anyone it doesn't
            know — across every camera, every entrance, every day.
          </p>
          <div className="lp-hero-actions">
            <Link to="/dashboard" className="lp-btn lp-btn-primary lp-btn-lg">Get started free</Link>
            <a href="#product-preview" className="lp-btn lp-btn-ghost lp-btn-lg">See it in action</a>
          </div>
          <div className="lp-hero-stats">
            <div>
              <strong>&lt;1s</strong>
              <span>Recognition latency</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>Continuous monitoring</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>Your own infrastructure</span>
            </div>
          </div>
        </div>
        <ScanlineHero />
      </header>

      <section className="lp-section lp-features" id="features">
        <div className="lp-section-head">
          <span className="lp-eyebrow">Features</span>
          <h2>Everything you need to know who's on site</h2>
          <p>No extra hardware. No manual review. Just a clean, live record of every entrance.</p>
        </div>
        <div className="lp-feature-grid">
          {FEATURES.map((f) => (
            <div className="lp-feature-card" key={f.title}>
              <div className="lp-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section lp-how" id="how-it-works">
        <div className="lp-section-head">
          <span className="lp-eyebrow">How it works</span>
          <h2>Live in three steps</h2>
        </div>
        <div className="lp-steps">
          {STEPS.map((s) => (
            <div className="lp-step" key={s.number}>
              <div className="lp-step-number">{s.number}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section lp-preview" id="product-preview">
        <div className="lp-section-head">
          <span className="lp-eyebrow">Product preview</span>
          <h2>The dashboard your team will actually use</h2>
          <p>A live look at the same interface you get after signing in.</p>
        </div>

        <div className="lp-browser-frame">
          <div className="lp-browser-bar">
            <span className="lp-browser-dot red" />
            <span className="lp-browser-dot yellow" />
            <span className="lp-browser-dot green" />
            <span className="lp-browser-url">app.canteenwatch.io/dashboard</span>
          </div>
          <div className="lp-preview-body">
            <div className="lp-preview-summary">
              <div className="lp-preview-stat">
                <span>Total Events</span>
                <strong>128</strong>
              </div>
              <div className="lp-preview-stat known">
                <span>Employees Seen</span>
                <strong>34</strong>
              </div>
              <div className="lp-preview-stat unknown">
                <span>Unknown</span>
                <strong>6</strong>
              </div>
              <div className="lp-preview-stat critical">
                <span>Unacknowledged</span>
                <strong>2</strong>
              </div>
            </div>
            <div className="lp-preview-grid">
              {["Aditi S.", "Rohit V.", "Karan M.", "Sana I."].map((name) => (
                <div className="lp-preview-employee" key={name}>
                  <div className="lp-preview-avatar">{name.split(" ").map((p) => p[0]).join("")}</div>
                  <strong>{name}</strong>
                  <span>Main Gate Cam</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-testimonials">
        <div className="lp-section-head">
          <span className="lp-eyebrow">Trusted on the ground</span>
          <h2>Built for the people watching the gate</h2>
        </div>
        <div className="lp-testimonial-grid">
          {TESTIMONIALS.map((t) => (
            <div className="lp-testimonial-card" key={t.name}>
              <p>&ldquo;{t.quote}&rdquo;</p>
              <div className="lp-testimonial-author">
                <div className="lp-testimonial-avatar">{t.name.split(" ").map((p) => p[0]).join("")}</div>
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section lp-pricing" id="pricing">
        <div className="lp-section-head">
          <span className="lp-eyebrow">Pricing</span>
          <h2>Simple plans that scale with your entrances</h2>
        </div>
        <div className="lp-pricing-grid">
          {PLANS.map((plan) => (
            <div className={`lp-pricing-card ${plan.highlight ? "lp-pricing-highlight" : ""}`} key={plan.name}>
              {plan.highlight && <span className="lp-pricing-tag">Most popular</span>}
              <h3>{plan.name}</h3>
              <div className="lp-pricing-price">
                <strong>{plan.price}</strong>
                <span>{plan.period}</span>
              </div>
              <p className="lp-pricing-desc">{plan.desc}</p>
              <ul>
                {plan.features.map((f) => (
                  <li key={f}>
                    <span className="lp-check">&#10003;</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/dashboard"
                className={`lp-btn ${plan.highlight ? "lp-btn-primary" : "lp-btn-ghost"} lp-btn-full`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section lp-faq" id="faq">
        <div className="lp-section-head">
          <span className="lp-eyebrow">FAQ</span>
          <h2>Questions, answered</h2>
        </div>
        <div className="lp-faq-list">
          {FAQS.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      <section className="lp-cta">
        <h2>Ready to see who's really in your building?</h2>
        <p>Connect your first camera in minutes. No credit card required to start.</p>
        <Link to="/dashboard" className="lp-btn lp-btn-primary lp-btn-lg">Get started free</Link>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <span className="lp-brand-mark">CW</span>
            <span>Canteen Watch</span>
            <p>AI-powered recognition for canteens, campuses, and facilities.</p>
          </div>
          <div className="lp-footer-cols">
            <div>
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#faq">FAQ</a>
            </div>
            <div>
              <h4>Company</h4>
              <a href="#top">About</a>
              <a href="#top">Contact</a>
              <a href="#top">Careers</a>
            </div>
            <div>
              <h4>Legal</h4>
              <a href="#top">Privacy</a>
              <a href="#top">Terms</a>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>&copy; {year} Canteen Watch. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./landing.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    // No auth backend is wired up yet -- this is a placeholder screen so the
    // product feels complete. Wire this up to your real auth endpoint when
    // it's ready; for now it just takes you into the dashboard.
    navigate("/dashboard");
  }

  return (
    <div className="lp lp-auth-page">
      <nav className="lp-nav">
        <Link to="/" className="lp-brand">
          <span className="lp-brand-mark">CW</span>
          <span>Canteen Watch</span>
        </Link>
        <div className="lp-nav-actions">
          <Link to="/" className="lp-btn lp-btn-ghost">Back to website</Link>
        </div>
      </nav>

      <div className="lp-auth-wrap">
        <form className="lp-auth-card" onSubmit={handleSubmit}>
          <span className="lp-eyebrow">Demo mode</span>
          <h1>Welcome back</h1>
          <p className="lp-auth-sub">
            Authentication isn't wired up to a backend yet — submitting this form takes you
            straight into the dashboard.
          </p>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourcompany.com"
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
              autoComplete="current-password"
            />
          </label>

          <button type="submit" className="lp-btn lp-btn-primary lp-btn-full lp-btn-lg">
            Sign in
          </button>

          <p className="lp-auth-footer">
            Don&rsquo;t have an account? <Link to="/dashboard">Start your free trial</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

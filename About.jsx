import React from 'react';

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>About – RouteNet</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Merriweather:wght@700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --ink: #111827; --muted: #4b5563; --light: #9ca3af;
      --rule: #e5e7eb; --green: #166534; --green-mid: #15803d;
      --green-soft: #f0fdf4; --green-border: #bbf7d0;
      --yellow: #f5a800; --yellow-soft: #fffbeb; --yellow-border: #fde68a;
      --bg: #f9fafb; --white: #ffffff;
    }
    html { scroll-behavior: smooth; }
    html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }
    html, body { -ms-overflow-style: none; scrollbar-width: none; }
    body { font-family: 'Inter', sans-serif; font-weight: 400; background: var(--bg); color: var(--ink); line-height: 1.7; -webkit-font-smoothing: antialiased; }

    .hero { background: var(--white); border-bottom: 1px solid var(--rule); padding: clamp(2.5rem,5vw,4rem) clamp(1.5rem,5vw,4rem); text-align: center; }
    .hero img { display: none; }
    .hero h1 { font-family: 'Merriweather', serif; font-size: clamp(1.8rem,4vw,2.8rem); color: var(--ink); margin-bottom: .75rem; line-height: 1.2; }
    .hero p { font-size: 1rem; color: var(--muted); max-width: 520px; margin: 0 auto .5rem; }
    .hero-disclaimer { display: inline-block; margin-top: 1rem; font-size: .82rem; background: var(--yellow-soft); border: 1px solid var(--yellow-border); color: #92400e; border-radius: 8px; padding: 6px 16px; }

    .layout { max-width: 820px; margin: 0 auto; padding: 2.5rem clamp(1rem,4vw,2rem); }

    .section { background: var(--white); border: 1px solid var(--rule); border-radius: 12px; padding: clamp(1.5rem,3vw,2rem); margin-bottom: 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,.04); animation: fadeUp .35s ease both; }
    .section:nth-child(1) { animation-delay: .05s; }
    .section:nth-child(2) { animation-delay: .10s; }
    .section:nth-child(3) { animation-delay: .15s; }
    .section:nth-child(4) { animation-delay: .20s; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

    .section h2 { font-size: 1.05rem; font-weight: 600; color: var(--ink); margin-bottom: 1rem; padding-bottom: .75rem; border-bottom: 1px solid var(--rule); display: flex; align-items: center; gap: 10px; }
    .section h2 .icon { width: 30px; height: 30px; border-radius: 7px; background: var(--green-soft); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .section h2 .icon svg { width: 16px; height: 16px; stroke: var(--green-mid); fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .section p { font-size: .9rem; color: var(--muted); margin-bottom: .75rem; }
    .section p:last-child { margin-bottom: 0; }
    .section a { color: var(--green-mid); text-decoration: none; }
    .section a:hover { text-decoration: underline; }

    /* FEATURES GRID */
    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: .85rem; margin-top: .75rem; }
    .feature-card { background: var(--green-soft); border: 1px solid var(--green-border); border-radius: 10px; padding: 1rem 1.1rem; display: flex; align-items: flex-start; gap: 10px; }
    .feature-card svg { width: 18px; height: 18px; stroke: var(--green-mid); fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; margin-top: 2px; }
    .feature-card span { font-size: .86rem; font-weight: 500; color: var(--green); }

    /* BUILT FOR */
    .built-for { display: flex; flex-wrap: wrap; gap: .6rem; margin-top: .75rem; }
    .tag { background: var(--bg); border: 1px solid var(--rule); border-radius: 99px; padding: 5px 14px; font-size: .82rem; font-weight: 500; color: var(--muted); }

    /* VERSION BADGE */
    .version { display: inline-flex; align-items: center; gap: 8px; background: var(--bg); border: 1px solid var(--rule); border-radius: 8px; padding: .6rem 1rem; font-size: .85rem; color: var(--muted); margin-top: .5rem; }
    .version strong { color: var(--ink); }

    footer { text-align: center; padding: 2rem 1.5rem; font-size: .78rem; color: var(--light); border-top: 1px solid var(--rule); margin-top: .5rem; }
    footer a { color: var(--green-mid); text-decoration: none; }

    @media (max-width: 600px) { .features-grid { grid-template-columns: 1fr 1fr; } }
  </style>
</head>
<body>

<div class="hero">
  <img src="" alt="RouteNet" />
  <h1>About RouteNet</h1>
  <p>RouteNet helps delivery riders, drivers, and gig workers track income, expenses, and real profit — all in one place.</p>
  <span class="hero-disclaimer">&#x1F512; RouteNet is a tracking tool only. It does not hold, store, or move money.</span>
</div>

<div class="layout">

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></span>Key Features</h2>
    <div class="features-grid">
      <div class="feature-card">
        <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <span>Income &amp; Expense Tracking</span>
      </div>
      <div class="feature-card">
        <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        <span>Savings Goals</span>
      </div>
      <div class="feature-card">
        <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        <span>Maintenance &amp; Renewal Tracking</span>
      </div>
      <div class="feature-card">
        <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>Exportable Reports</span>
      </div>
    </div>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/></svg></span>Built For</h2>
    <p>Designed specifically for gig workers in the Philippines.</p>
    <div class="built-for">
      <span class="tag">&#x1F6F5; Delivery Riders</span>
      <span class="tag">&#x1F697; Drivers</span>
      <span class="tag">&#x1F6B2; Bicycle Couriers</span>
      <span class="tag">&#x1F4BC; Gig Workers</span>
    </div>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></span>Version</h2>
    <div class="version"><strong>RouteNet</strong> v3.0.0</div>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>Contact</h2>
    <p>Have questions or need support?</p>
    <p>Email: <a href="mailto:support&#64;routenetapp&#46;com">support&#64;routenetapp&#46;com</a><br>
    Website: <a href="https://routenetapp.com" target="_blank">routenetapp.com</a><br>
    App: <a href="https://myroutenet.com" target="_blank">myroutenet.com</a></p>
  </div>

</div>

<footer>
  <p>&copy; 2026 Aureon Apps &nbsp;&middot;&nbsp; RouteNet &nbsp;&middot;&nbsp; <a href="mailto:support&#64;routenetapp&#46;com">support&#64;routenetapp&#46;com</a></p>
</footer>

</body>
</html>`;

export default function About() {
  return (
    <iframe
      srcDoc={htmlContent}
      style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }}
      title="About RouteNet"
    />
  );
}
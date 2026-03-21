import React from 'react';

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Terms of Use – RouteNet</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Merriweather:wght@700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --ink: #111827; --muted: #4b5563; --light: #9ca3af;
      --rule: #e5e7eb; --green: #166534; --green-mid: #15803d;
      --green-soft: #f0fdf4; --green-border: #bbf7d0;
      --bg: #f9fafb; --white: #ffffff;
    }
    html { scroll-behavior: smooth; }
    body { font-family: 'Inter', sans-serif; font-weight: 400; background: var(--bg); color: var(--ink); line-height: 1.7; -webkit-font-smoothing: antialiased; }
    .hero { background: var(--white); border-bottom: 1px solid var(--rule); padding: clamp(2.5rem,5vw,4rem) clamp(1.5rem,5vw,4rem); text-align: center; }
    .hero h1 { font-family: 'Merriweather', serif; font-size: clamp(1.8rem,4vw,2.8rem); color: var(--ink); margin-bottom: .75rem; line-height: 1.2; }
    .hero p { font-size: .95rem; color: var(--muted); max-width: 500px; margin: 0 auto .5rem; }
    .hero-meta { font-size: .8rem; color: var(--light); margin-top: .5rem; }
    .layout { max-width: 820px; margin: 0 auto; padding: 2.5rem clamp(1rem,4vw,2rem); }
    .section { background: var(--white); border: 1px solid var(--rule); border-radius: 12px; padding: clamp(1.5rem,3vw,2rem); margin-bottom: 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,.04); animation: fadeUp .35s ease both; }
    .section:nth-child(1) { animation-delay:.05s; } .section:nth-child(2) { animation-delay:.10s; } .section:nth-child(3) { animation-delay:.15s; } .section:nth-child(4) { animation-delay:.20s; } .section:nth-child(5) { animation-delay:.25s; } .section:nth-child(6) { animation-delay:.30s; } .section:nth-child(7) { animation-delay:.35s; } .section:nth-child(8) { animation-delay:.40s; } .section:nth-child(9) { animation-delay:.45s; } .section:nth-child(10) { animation-delay:.50s; } .section:nth-child(11) { animation-delay:.55s; } .section:nth-child(12) { animation-delay:.60s; } .section:nth-child(13) { animation-delay:.65s; } .section:nth-child(14) { animation-delay:.70s; } .section:nth-child(15) { animation-delay:.75s; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    .section h2 { font-size: 1.05rem; font-weight: 600; color: var(--ink); margin-bottom: 1rem; padding-bottom: .75rem; border-bottom: 1px solid var(--rule); display: flex; align-items: center; gap: 10px; }
    .section h2 .icon { width: 30px; height: 30px; border-radius: 7px; background: var(--green-soft); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .section h2 .icon svg { width: 16px; height: 16px; stroke: var(--green-mid); fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .section p { font-size: .9rem; color: var(--muted); margin-bottom: .75rem; }
    .section p:last-child { margin-bottom: 0; }
    .section a { color: var(--green-mid); text-decoration: none; }
    .section a:hover { text-decoration: underline; }
    ul.clean { list-style: none; padding: 0; margin: .5rem 0 .75rem; }
    ul.clean li { font-size: .88rem; color: var(--muted); padding: 5px 0 5px 18px; position: relative; }
    ul.clean li::before { content: ''; position: absolute; left: 0; top: 12px; width: 6px; height: 6px; border-radius: 50%; background: var(--green-mid); }
    footer { text-align: center; padding: 2rem 1.5rem; font-size: .78rem; color: var(--light); border-top: 1px solid var(--rule); margin-top: .5rem; }
    footer a { color: var(--green-mid); text-decoration: none; }
  </style>
</head>
<body>

<div class="hero">
  <h1>Terms of Use</h1>
  <p>Welcome to RouteNet. By using this app or website, you agree to these terms.</p>
  <p class="hero-meta">Last updated: March 6, 2026 &nbsp;·&nbsp; Effective immediately upon posting</p>
</div>

<div class="layout">

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></span>1. Acceptance of Terms</h2>
    <p>By downloading, accessing, or using RouteNet ("the App") or <a href="https://myroutenet.com" target="_blank">myroutenet.com</a>, you agree to be bound by these Terms of Use. If you do not agree, please do not use the App.</p>
    <p>By using RouteNet, you confirm that you are at least 18 years old and capable of agreeing to these Terms.</p>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></span>2. Scope of Service</h2>
    <p>RouteNet is a simple income and expense tracker for delivery riders, drivers, and gig workers. The App is provided on an "as is" and "as available" basis.</p>
    <p><strong>No Financial Advice:</strong> RouteNet is a tracking tool only. We do not provide financial, tax, or investment advice.</p>
    <p><strong>Accuracy:</strong> You are responsible for the accuracy of the data you enter. We are not responsible for errors in data entry or calculations.</p>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg></span>3. No Affiliation</h2>
    <p>RouteNet is an independent product of Aureon Apps. RouteNet is not affiliated with, endorsed by, or sponsored by any delivery, ride-hailing, food delivery, courier, or logistics platform.</p>
    <p>All trademarks and brand names of third-party platforms belong to their respective owners.</p>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span>4. Free Trial and Subscription</h2>
    <p>RouteNet offers a 30-day free trial with full access to all features. After the trial period, a subscription is required to continue using the service.</p>
    <p>Pricing, billing terms, and subscription options will be clearly disclosed within the app before any purchase. Subscriptions are managed through the Google Play Store and are subject to Google Play's terms and policies.</p>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg></span>5. Internet Connection</h2>
    <p>Certain functions of the App require an active internet connection via Wi-Fi or mobile data. Aureon Apps cannot be held responsible for the App not functioning if you do not have access to an internet connection.</p>
    <p>If you use the App outside of a Wi-Fi area, your mobile network provider's terms still apply. You may be charged for data usage, including roaming charges if you use the App outside your home territory. By using the App, you accept responsibility for any such charges.</p>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>6. Data Privacy and Security</h2>
    <p>Your privacy is important to us. Please review our <a href="/privacypolicy">Privacy Policy</a> to understand how we collect, use, and protect your data.</p>
    <p><strong>Security:</strong> You are responsible for maintaining the confidentiality of your account credentials. Do not share your login details with anyone.</p>
    <p><strong>Data Loss:</strong> We are not liable for any loss of data. We recommend keeping your own records of important entries.</p>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>7. User Accounts</h2>
    <p>To use RouteNet, you must create an account. You are responsible for:</p>
    <ul class="clean">
      <li>Keeping your account credentials secure</li>
      <li>All activity that occurs under your account</li>
      <li>Notifying us immediately of any unauthorized use</li>
    </ul>
    <p>We reserve the right to suspend or terminate accounts that violate these Terms.</p>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span>8. No Financial Advice</h2>
    <p>RouteNet is a tracking tool only. Nothing in the App constitutes financial, legal, tax, or investment advice. Always consult a qualified professional for financial decisions.</p>
    <p>RouteNet does <strong>not</strong> hold, store, or move money. It is a record-keeping tool only.</p>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg></span>9. User Restrictions</h2>
    <p>You must <strong>not</strong>:</p>
    <ul class="clean">
      <li>Use the App for any illegal or unauthorized purpose</li>
      <li>Attempt to reverse engineer, decompile, or hack the App</li>
      <li>Input fraudulent, malicious, or false data</li>
      <li>Share your account with others</li>
      <li>Use the App to harm, deceive, or defraud others</li>
    </ul>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>10. Intellectual Property</h2>
    <p>The RouteNet app, logo, name, design, and all related content are owned by <strong>Aureon Apps</strong> and are protected by copyright and trademark laws. You may not copy, reproduce, or distribute any part of the App without written permission.</p>
    <p>You retain ownership of all data you enter into the App.</p>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></span>11. Third-Party Services</h2>
    <p>RouteNet uses third-party services including Base44, OneSignal, and Google Play Services. By using RouteNet, you also agree to their respective terms and privacy policies. We are not responsible for the practices of any third-party services.</p>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></span>12. Termination</h2>
    <p>We reserve the right to terminate or suspend your access to the App immediately, without prior notice, if you breach these Terms. Upon termination, your right to use the App ceases immediately.</p>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>13. Limitation of Liability</h2>
    <p>To the maximum extent permitted by law, Aureon Apps shall not be liable for any indirect, incidental, special, or consequential damages, including loss of data or financial loss, arising from your use of the App.</p>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></span>14. Changes to These Terms</h2>
    <p>We may update these Terms at any time. Changes will be posted on this page. Continued use of the App after changes are posted means you accept the updated Terms.</p>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>15. Contact Us</h2>
    <p>If you have any questions about these Terms, please contact:</p>
    <p><strong>Aureon Apps</strong><br>
    Email: <a href="mailto:support&#64;routenetapp&#46;com">support&#64;routenetapp&#46;com</a><br>
    Website: <a href="https://routenetapp.com" target="_blank">routenetapp.com</a><br>
    App: <a href="https://myroutenet.com" target="_blank">myroutenet.com</a></p>
  </div>

</div>

<footer>
  <p>&copy; 2026 Aureon Apps &nbsp;·&nbsp; RouteNet &nbsp;·&nbsp; <a href="mailto:support&#64;routenetapp&#46;com">support&#64;routenetapp&#46;com</a></p>
</footer>

</body>
</html>`;

export default function TermsOfUse() {
  return (
    <iframe
      srcDoc={htmlContent}
      style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }}
      title="Terms of Use"
    />
  );
}
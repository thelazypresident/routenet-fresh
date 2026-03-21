import React from 'react';

const privacyHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Privacy Policy – RouteNet</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Merriweather:wght@700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --ink: #111827; --muted: #4b5563; --light: #9ca3af;
      --rule: #e5e7eb; --green: #166534; --green-mid: #15803d;
      --green-soft: #f0fdf4; --green-border: #bbf7d0;
      --red-soft: #fef2f2; --red-border: #fecaca; --red-text: #991b1b;
      --bg: #f9fafb; --white: #ffffff;
    }
    html { scroll-behavior: smooth; }
    html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }
    html, body { -ms-overflow-style: none; scrollbar-width: none; }
    body { font-family: 'Inter', sans-serif; font-weight: 400; background: var(--bg); color: var(--ink); line-height: 1.7; -webkit-font-smoothing: antialiased; }
    .hero { background: var(--white); border-bottom: 1px solid var(--rule); padding: clamp(2.5rem,5vw,4rem) clamp(1.5rem,5vw,4rem); text-align: center; }
    .hero img { display: none; }
    .hero h1 { font-family: 'Merriweather', serif; font-size: clamp(1.8rem,4vw,2.8rem); color: var(--ink); margin-bottom: .75rem; line-height: 1.2; }
    .hero p { font-size: .95rem; color: var(--muted); max-width: 500px; margin: 0 auto .5rem; }
    .hero-meta { font-size: .8rem; color: var(--light); margin-top: .5rem; }
    .layout { max-width: 820px; margin: 0 auto; padding: 2.5rem clamp(1rem,4vw,2rem); }
    .section { background: var(--white); border: 1px solid var(--rule); border-radius: 12px; padding: clamp(1.5rem,3vw,2rem); margin-bottom: 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,.04); animation: fadeUp .35s ease both; }
    .section:nth-child(1) { animation-delay:.05s; } .section:nth-child(2) { animation-delay:.10s; } .section:nth-child(3) { animation-delay:.15s; } .section:nth-child(4) { animation-delay:.20s; } .section:nth-child(5) { animation-delay:.25s; } .section:nth-child(6) { animation-delay:.30s; } .section:nth-child(7) { animation-delay:.35s; } .section:nth-child(8) { animation-delay:.40s; } .section:nth-child(9) { animation-delay:.45s; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    .section h2 { font-size: 1.05rem; font-weight: 600; color: var(--ink); margin-bottom: 1rem; padding-bottom: .75rem; border-bottom: 1px solid var(--rule); display: flex; align-items: center; gap: 10px; }
    .section h2 .icon { width: 30px; height: 30px; border-radius: 7px; background: var(--green-soft); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .section h2 .icon svg { width: 16px; height: 16px; stroke: var(--green-mid); fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .section h3 { font-size: .9rem; font-weight: 600; color: var(--ink); margin: 1.1rem 0 .4rem; }
    .section p { font-size: .9rem; color: var(--muted); margin-bottom: .75rem; }
    .section p:last-child { margin-bottom: 0; }
    .section a { color: var(--green-mid); text-decoration: none; }
    .section a:hover { text-decoration: underline; }
    ul.clean { list-style: none; padding: 0; margin: .5rem 0 .75rem; }
    ul.clean li { font-size: .88rem; color: var(--muted); padding: 5px 0 5px 18px; position: relative; }
    ul.clean li::before { content: ''; position: absolute; left: 0; top: 12px; width: 6px; height: 6px; border-radius: 50%; background: var(--green-mid); }
    .service-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: .85rem; margin-top: .75rem; }
    .service-card { border: 1px solid var(--rule); border-radius: 10px; padding: 1.1rem 1.15rem; background: var(--bg); }
    .service-card-name { font-size: .88rem; font-weight: 600; color: var(--ink); margin-bottom: .4rem; display: flex; align-items: center; gap: 7px; }
    .service-card-name::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--green-mid); flex-shrink: 0; }
    .service-card p { font-size: .82rem; color: var(--muted); margin: 0; }
    .callout { border-radius: 8px; padding: .9rem 1.1rem; margin: .75rem 0; font-size: .87rem; }
    .callout-green { background: var(--green-soft); border: 1px solid var(--green-border); color: var(--green); }
    .callout-red { background: var(--red-soft); border: 1px solid var(--red-border); color: var(--red-text); }
    .callout strong { font-weight: 600; display: block; margin-bottom: .4rem; }
    .callout ul { list-style: none; padding: 0; }
    .callout ul li { padding: 2px 0 2px 14px; position: relative; font-size: .85rem; }
    .callout ul li::before { content: ''; position: absolute; left: 0; top: 9px; width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
    footer { text-align: center; padding: 2rem 1.5rem; font-size: .78rem; color: var(--light); border-top: 1px solid var(--rule); margin-top: .5rem; }
    footer a { color: var(--green-mid); text-decoration: none; }
    @media (max-width: 600px) { .service-grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>

<div class="hero">
  <img src="data:image/png;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QBMRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAEAKADAAQAAAABAAAEAAAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/8AAEQgEAAQAAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/bAEMAAQEBAQEBAgEBAgMCAgIDBAMDAwMEBgQEBAQEBgcGBgYGBgYHBwcHBwcHBwgICAgICAkJCQkJCwsLCwsLCwsLC//bAEMBAgICAwMDBQMDBQsIBggLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLC//dAAQAQP/aAAwDAQACEQMRAD8A/vwooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/9D+/CiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/0P78KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/0P78KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/0P78KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/0P78KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/Q/vwooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/0P78KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/0P78KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/0P78KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/0P78KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/0P78KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//Q/vwooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//Q/vwooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//Q/vwooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//Q/vwooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//Q/vwooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/2Q==" alt="RouteNet" />
  <h1>Privacy Policy</h1>
  <p>RouteNet is developed and operated by <strong>Aureon Apps</strong>. This policy explains how your information is collected and used.</p>
  <p class="hero-meta">Last updated: March 6, 2026 &nbsp;·&nbsp; Effective immediately upon posting</p>
</div>

<div class="layout">

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></span>Overview</h2>
    <p>RouteNet ("the App") is a personal income and expense tracker for delivery riders, drivers, and gig workers, available as a mobile application and at <a href="https://myroutenet.com" target="_blank">myroutenet.com</a>.</p>
    <p>Users may record income and expenses they choose to enter into the app.</p>
    <p>By using the App, you agree to the collection and use of information in accordance with this Privacy Policy.</p>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>Information We Collect</h2>
    <p>RouteNet collects only the information necessary for the app to function.</p>
    <h3>Account Information</h3>
    <p>You can create an account and log in using:</p>
    <ul class="clean">
      <li>Email address and password</li>
      <li>Google account</li>
      <li>Facebook account</li>
    </ul>
    <p>When you sign in through Google or Facebook, we may collect your name and email address associated with that account. This information is used only for account login and user identification.</p>
    <h3>Data Entered by Users</h3>
    <p>Users may manually enter information such as:</p>
    <ul class="clean">
      <li>Income</li>
      <li>Expenses</li>
    </ul>
    <p>This information is stored securely and used only to provide the RouteNet service.</p>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>App Permissions</h2>
    <p>RouteNet requests minimal device permissions.</p>
    <div class="callout callout-green">
      <strong>✅ Camera Permission</strong>
      <ul>
        <li>Allows users to take or upload a profile picture only</li>
        <li>RouteNet does not collect camera data or record images without user action</li>
      </ul>
    </div>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></span>Third-Party Services</h2>
    <p>RouteNet uses the following third-party services to operate. Each is used only for its stated purpose.</p>
    <div class="service-grid">
      <div class="service-card">
        <div class="service-card-name">Base44</div>
        <p>Provides backend infrastructure. Stores user data, manages accounts, and hosts the web app at myroutenet.com.</p>
      </div>
      <div class="service-card">
        <div class="service-card-name">OneSignal</div>
        <p>Used to send push notifications such as reminders and alerts. Users can disable notifications anytime in device settings.</p>
        <p><a href="https://onesignal.com/privacy_policy" target="_blank" rel="noopener">Privacy Policy →</a></p>
      </div>
      <div class="service-card">
        <div class="service-card-name">Google Play Services</div>
        <p>Required for the app to operate on Android devices and to distribute through the Google Play Store.</p>
        <p><a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Privacy Policy →</a></p>
      </div>
    </div>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></span>Cookies</h2>
    <p>RouteNet does not use "cookies" explicitly. However, the app may use third-party code and libraries that use "cookies" to collect information and improve their services.</p>
    <p>You have the option to either accept or refuse these cookies and know when a cookie is being sent to your device.</p>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></span>Information We Do NOT Collect</h2>
    <div class="callout callout-red">
      <strong>❌ RouteNet does not collect or access any of the following:</strong>
      <ul>
        <li>Location data</li>
        <li>Contacts</li>
        <li>Phone numbers</li>
        <li>SMS or call logs</li>
        <li>Payment information</li>
        <li>Advertising identifiers</li>
        <li>Ads tracking data</li>
        <li>Third-party analytics tracking</li>
      </ul>
    </div>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></span>Log Data</h2>
    <p>When you use the app, our backend provider (Base44) may automatically collect log data in the event of errors or technical issues. This may include your device IP address, device name, operating system version, and timestamps.</p>
    <p>This data is used only for diagnosing and fixing technical issues.</p>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>Data Security</h2>
    <p>We take the security of your data seriously. Your information is stored securely and is only accessible through your account.</p>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>Children's Privacy</h2>
    <p>RouteNet is not intended for children under the age of 18. The App does not knowingly collect personal information from children. If we discover such data has been provided, we will immediately delete it.</p>
    <p>If you are a parent or guardian and believe your child has submitted personal information, please contact us at <a href="mailto:support&#64;routenetapp&#46;com">support&#64;routenetapp&#46;com</a>.</p>
  </div>

  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></span>Changes to This Privacy Policy</h2>
    <p>This Privacy Policy may be updated from time to time. Any updates will be posted on this page. Continued use of the App after changes are posted constitutes your acceptance of the updated policy.</p>
  </div>

<div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><path d="M21 4H8l-5 5v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg></span>Account Deletion</h2>
    <p>Users may request deletion of their RouteNet account and associated personal data by contacting <a href="mailto:support&#64;routenetapp&#46;com">support&#64;routenetapp&#46;com</a>.</p>
    <p>We will review and process eligible deletion requests within a reasonable time, subject to any legal, security, or fraud-prevention obligations.</p>
  </div>
  
  <div class="section">
    <h2><span class="icon"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>Contact Us</h2>
    <p>If you have any questions about this Privacy Policy, please contact:</p>
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

export default function privacypolicy() {
  return (
    <div style={{ all: 'initial', display: 'block' }}>
      <iframe
        srcDoc={privacyHTML}
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
          display: 'block',
        }}
        title="Privacy Policy"
      />
    </div>
  );
}
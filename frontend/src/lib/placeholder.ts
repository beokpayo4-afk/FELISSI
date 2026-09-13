/** Local SVG data URLs so catalog images never depend on a third-party host. */
export function localPlaceholder(
  label: string,
  from = "#0f172a",
  to = "#0284c7",
): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" fill="none">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <rect x="88" y="88" width="624" height="624" rx="48" fill="rgba(248,250,252,0.08)"/>
  <circle cx="400" cy="330" r="78" fill="rgba(248,250,252,0.92)"/>
  <rect x="260" y="460" width="280" height="18" rx="9" fill="rgba(248,250,252,0.88)"/>
  <text x="400" y="560" text-anchor="middle" fill="#F8FAFC" font-family="system-ui,Segoe UI,sans-serif" font-size="34" font-weight="600">${escapeXml(label)}</text>
</svg>`.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

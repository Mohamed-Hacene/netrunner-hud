// Night City skyline backdrop: neon sun, skyline silhouettes, perspective grid, scanline.
const towers = (() => {
  // deterministic pseudo-random skyline
  let seed = 2077
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
  const parts: string[] = []
  let x = 0
  while (x < 1600) {
    const w = 30 + Math.floor(rnd() * 70)
    const h = 120 + Math.floor(rnd() * 320)
    parts.push(`<rect x="${x}" y="${560 - h}" width="${w}" height="${h}" fill="#07070F"/>`)
    // lit windows
    for (let i = 0; i < 6; i++) {
      if (rnd() > 0.55) {
        const wx = x + 6 + Math.floor(rnd() * (w - 12))
        const wy = 560 - h + 10 + Math.floor(rnd() * (h - 20))
        const c = rnd() > 0.5 ? '#00F0FF' : '#FCEE0A'
        parts.push(`<rect x="${wx}" y="${wy}" width="3" height="5" fill="${c}" opacity="0.7"/>`)
      }
    }
    if (rnd() > 0.8) parts.push(`<rect x="${x + w / 2 - 1}" y="${560 - h - 40}" width="2" height="40" fill="#FF003C"/>`)
    x += w + Math.floor(rnd() * 8)
  }
  return parts.join('')
})()

const grid = (() => {
  const lines: string[] = []
  for (let i = -20; i <= 20; i++) {
    lines.push(`<line x1="800" y1="560" x2="${800 + i * 160}" y2="1000" />`)
  }
  for (let k = 1; k <= 10; k++) {
    const y = 560 + Math.pow(k / 10, 2) * 440
    lines.push(`<line x1="0" y1="${y}" x2="1600" y2="${y}" />`)
  }
  return lines.join('')
})()

export const NIGHT_CITY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#05050C"/>
    <stop offset="0.45" stop-color="#1A0420"/>
    <stop offset="0.56" stop-color="#4A0630"/>
    <stop offset="0.57" stop-color="#05050C"/>
    <stop offset="1" stop-color="#0A0014"/>
  </linearGradient>
  <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FCEE0A"/>
    <stop offset="1" stop-color="#FF003C"/>
  </linearGradient>
  <linearGradient id="scan" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#00F0FF" stop-opacity="0"/>
    <stop offset="0.5" stop-color="#00F0FF" stop-opacity="0.12"/>
    <stop offset="1" stop-color="#00F0FF" stop-opacity="0"/>
  </linearGradient>
  <pattern id="lines" width="4" height="4" patternUnits="userSpaceOnUse">
    <rect width="4" height="1" fill="#000" opacity="0.35"/>
  </pattern>
</defs>
<rect width="1600" height="1000" fill="url(#sky)"/>
<circle cx="800" cy="440" r="190" fill="url(#sun)" opacity="0.85"/>
<g fill="#1A0420">
  <rect x="600" y="470" width="400" height="8"/><rect x="600" y="500" width="400" height="12"/><rect x="600" y="535" width="400" height="16"/>
</g>
${towers}
<g stroke="#FF003C" stroke-width="1.2" opacity="0.55">${grid}</g>
<rect y="560" width="1600" height="2" fill="#00F0FF" opacity="0.8"/>
<text x="40" y="70" font-family="monospace" font-size="22" fill="#FCEE0A" opacity="0.5" letter-spacing="6">NIGHT CITY // NETRUNNER UPLINK</text>
<rect width="1600" height="160" fill="url(#scan)">
  <animate attributeName="y" from="-160" to="1000" dur="7s" repeatCount="indefinite"/>
</rect>
<rect width="1600" height="1000" fill="url(#lines)"/>
</svg>`

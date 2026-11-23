// GIN²CO — small SVG/HTML chart helpers (donut, bars, histogram, stacked bars, KPI tiles)
// All charts print their values; colour never carries meaning alone.

const e = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function kpis(items) {
  return `<div class="ck-row">${items.map((k) => `<div class="ck${k.tone ? ` ck-${k.tone}` : ''}">
    <div class="ck-v">${e(k.v)}</div><div class="ck-l">${e(k.l)}</div>${k.s ? `<div class="ck-s">${e(k.s)}</div>` : ''}</div>`).join('')}</div>`;
}

// segs: [{label, value, color, display}] — display = formatted value
export function donut(title, segs, { center = '', centerSub = '', pctFmt } = {}) {
  const tot = segs.reduce((s, x) => s + x.value, 0) || 1;
  const R = 52, r = 34, cx = 64, cy = 64;
  let a0 = -Math.PI / 2;
  const gap = segs.filter((x) => x.value > 0).length > 1 ? 0.025 : 0;
  const arcs = segs.filter((x) => x.value > 0).map((x) => {
    const frac = x.value / tot;
    const a1 = a0 + frac * 2 * Math.PI;
    const s = a0 + gap / 2, en = Math.max(s + 0.001, a1 - gap / 2);
    const large = en - s > Math.PI ? 1 : 0;
    const p = (ang, rad) => `${(cx + rad * Math.cos(ang)).toFixed(2)} ${(cy + rad * Math.sin(ang)).toFixed(2)}`;
    const d = frac >= 0.999
      ? `M ${cx - R} ${cy} a ${R} ${R} 0 1 0 ${2 * R} 0 a ${R} ${R} 0 1 0 ${-2 * R} 0 Z M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`
      : `M ${p(s, R)} A ${R} ${R} 0 ${large} 1 ${p(en, R)} L ${p(en, r)} A ${r} ${r} 0 ${large} 0 ${p(s, r)} Z`;
    a0 = a1;
    return `<path d="${d}" fill="${x.color}" fill-rule="evenodd"><title>${e(`${x.label} : ${x.display ?? x.value} (${pctFmt(frac)})`)}</title></path>`;
  }).join('');
  const leg = segs.map((x) => `<li><span class="bv-sw" style="background:${x.color}"></span><span class="cd-ll">${e(x.label)}</span>
    <span class="cd-lv mono">${e(x.display ?? x.value)}</span><span class="cd-lp mono">${pctFmt(x.value / tot)}</span></li>`).join('');
  return `<figure class="cc cd"><figcaption class="bv-h">${e(title)}</figcaption><div class="cd-body">
    <svg viewBox="0 0 128 128" class="cd-svg" role="img" aria-label="${e(title)}">${arcs}
      <text x="64" y="${centerSub ? 62 : 68}" text-anchor="middle" class="cd-c">${e(center)}</text>
      ${centerSub ? `<text x="64" y="78" text-anchor="middle" class="cd-cs">${e(centerSub)}</text>` : ''}</svg>
    <ul class="cd-leg">${leg}</ul></div></figure>`;
}

// rows: [{label, value, color, display, sub}]
export function hbars(title, rows, { note = '' } = {}) {
  const mx = Math.max(1e-9, ...rows.map((x) => x.value));
  return `<figure class="cc"><figcaption class="bv-h">${e(title)}</figcaption>${rows.map((x) => `
    <div class="cb" title="${e(`${x.label} : ${x.display ?? x.value}`)}"><span class="cb-l">${e(x.label)}${x.sub ? `<small>${e(x.sub)}</small>` : ''}</span>
      <span class="cb-t"><i style="width:${Math.max(0.5, x.value / mx * 100).toFixed(1)}%;background:${x.color}"></i></span>
      <span class="cb-v mono">${e(x.display ?? x.value)}</span></div>`).join('')}${note ? `<p class="cc-note">${e(note)}</p>` : ''}</figure>`;
}

// bins: [{label, parts:[{value,color,label}]}] — vertical stacked histogram
export function histogram(title, bins, { legend = [], note = '', unit = '' } = {}) {
  const tot = (b) => b.parts.reduce((s, p) => s + p.value, 0);
  const mx = Math.max(1, ...bins.map(tot));
  const cols = bins.map((b) => {
    const n = tot(b);
    const segs = b.parts.filter((p) => p.value > 0).map((p) => `<i style="height:${(p.value / mx * 100).toFixed(1)}%;background:${p.color}" title="${e(`${b.label} — ${p.label} : ${p.value}${unit}`)}"></i>`).join('');
    return `<div class="ch-col"><span class="ch-n mono">${n || ''}</span><div class="ch-bar">${segs}</div><span class="ch-x">${e(b.label)}</span></div>`;
  }).join('');
  const leg = legend.length ? `<ul class="sd-leg ch-leg">${legend.map((l) => `<li><span class="bv-sw" style="background:${l.color}"></span>${e(l.label)}</li>`).join('')}</ul>` : '';
  return `<figure class="cc"><figcaption class="bv-h">${e(title)}</figcaption><div class="ch">${cols}</div>${leg}${note ? `<p class="cc-note">${e(note)}</p>` : ''}</figure>`;
}

// rows: [{label, parts:[{value,color,label,display}], display}] — horizontal stacked bars, shared scale
export function stacked(title, rows, legend, { note = '' } = {}) {
  const tot = (r) => r.parts.reduce((s, p) => s + p.value, 0);
  const mx = Math.max(1e-9, ...rows.map(tot));
  return `<figure class="cc"><figcaption class="bv-h">${e(title)}</figcaption>${rows.map((r) => `
    <div class="cb"><span class="cb-l">${e(r.label)}</span>
      <span class="cb-t cs" style="width:${(tot(r) / mx * 100).toFixed(1)}%">${r.parts.filter((p) => p.value > 0).map((p) => `<i style="flex:${p.value};background:${p.color}" title="${e(`${r.label} — ${p.label} : ${p.display ?? p.value}`)}"></i>`).join('')}</span>
      <span class="cb-v mono">${e(r.display ?? tot(r))}</span></div>`).join('')}
    <ul class="sd-leg">${legend.map((l) => `<li><span class="bv-sw" style="background:${l.color}"></span>${e(l.label)}</li>`).join('')}</ul>${note ? `<p class="cc-note">${e(note)}</p>` : ''}</figure>`;
}

/* Rabbit Tarot — card art system.
   One frame for all 78 cards (spec: "Tỷ lệ và hệ khung phải thống nhất"):
   ink frame + Antique Gold hairline, rabbit-ear mark, numeral, one focal motif, name.
   Major Arcana get one geometric glyph each; Minor Arcana use suit pips / court marks.
   Until illustrations exist, these glyphs stand in. To use real artwork for a card,
   add its id to window.RABBIT_ART, e.g. RABBIT_ART['major-00'] = 'assets/cards/major-00.webp'. */
(function(){
  window.RABBIT_ART = window.RABBIT_ART || {};

  const C = {ink:'#171614', ivory:'#F6F2EA', paper:'#EAE2D6', stone:'#CFC3B5', muted:'#6F6860', gold:'#B99A61', red:'#A92824'};
  // Majors the spec places on an Ink Black ground
  const DARK = new Set([0, 2, 4, 8, 9, 13, 16, 18]);

  /* ---------- primitives (motif space: -50..50) ---------- */
  const star = (x, y, R, n = 4, ri = R * .24, cls = 'gf') => {
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 ? ri : R, a = Math.PI * i / n - Math.PI / 2;
      d += (i ? 'L' : 'M') + (x + r * Math.cos(a)).toFixed(2) + ' ' + (y + r * Math.sin(a)).toFixed(2);
    }
    return `<path class="${cls}" d="${d}Z"/>`;
  };
  const infinity = (y, cls = 'g') => `<path class="${cls}" d="M0 ${y} C-6 ${y-8} -18 ${y-8} -18 ${y} C-18 ${y+8} -6 ${y+8} 0 ${y} C6 ${y-8} 18 ${y-8} 18 ${y} C18 ${y+8} 6 ${y+8} 0 ${y}Z"/>`;
  const rays = (cx, cy, r1, r2, n, cls = 'g', skip = 0) => {
    let s = '';
    for (let i = 0; i < n; i++) { const a = 2 * Math.PI * i / n + skip;
      s += `<line class="${cls}" x1="${(cx + r1 * Math.cos(a)).toFixed(2)}" y1="${(cy + r1 * Math.sin(a)).toFixed(2)}" x2="${(cx + r2 * Math.cos(a)).toFixed(2)}" y2="${(cy + r2 * Math.sin(a)).toFixed(2)}"/>`; }
    return s;
  };
  const at = (x, y, s, inner) => `<g transform="translate(${x} ${y}) scale(${s})">${inner}</g>`;

  /* ---------- suit symbols (box -10..10) ---------- */
  const SUIT = {
    wands: acc => `<line class="k" x1="0" y1="10" x2="0" y2="-7"/><path class="k" d="M0 0 L-3.5 -3"/><path class="${acc ? 'r' : 'gf'}" d="M0 -7 C2 -12 6 -12 5 -8 C4 -6 1.5 -6 0 -7Z"/>`,
    cups: acc => `${acc ? '<path class="r" d="M-6 -5.5 H6 C5.4 -1.5 2.5 1 0 1.8 C-2.5 1 -5.4 -1.5 -6 -5.5Z"/>' : ''}<path class="k" d="M-7 -9 H7 C7 -1 3.5 2.6 0 3.4 C-3.5 2.6 -7 -1 -7 -9Z M0 3.4 V8.5 M-5 9.2 H5"/>`,
    swords: acc => `<path class="k" d="M0 -11 L1.8 -7.5 V5 H-1.8 V-7.5Z M-5.5 5 H5.5 M0 5 V8.6"/><circle class="${acc ? 'r' : 'gf'}" cx="0" cy="9.8" r="1.5"/>`,
    pentacles: acc => `<circle class="k" r="9"/>${star(0, 0.6, 7, 5, 2.8, acc ? 'r' : 'g')}`
  };
  const SUIT_VI = {wands: 'Gậy', cups: 'Cốc', swords: 'Kiếm', pentacles: 'Tiền'};
  const allSuits = (y, s, dx) => ['wands', 'cups', 'swords', 'pentacles'].map((k, i) => at((i - 1.5) * dx, y, s, SUIT[k](false))).join('');

  /* ---------- 22 Major Arcana glyphs, one focal metaphor each ---------- */
  const MAJOR = [
    /* 0 Fool — crescent cliff edge, young sun on the horizon */
    () => `<path class="k" d="M-48 20 C-30 18 -14 12 -6 -4 L-6 46"/><line class="g" x1="-6" y1="20" x2="48" y2="20"/><path class="r" d="M14 20 A14 14 0 0 1 42 20Z"/>${star(-26, -26, 8)}<circle class="kf" cx="-20" cy="8" r="2"/>`,
    /* I Magician — infinity, vertical axis, the four suit tools */
    () => `${infinity(-36)}<line class="k" x1="0" y1="-24" x2="0" y2="20"/><line class="rs" x1="0" y1="-24" x2="0" y2="-8"/><line class="k" x1="-40" y1="26" x2="40" y2="26"/>${allSuits(38, .55, 20)}`,
    /* II High Priestess — black and ivory pillars, crescent, sealed scroll */
    () => `<rect class="kf" x="-38" y="-40" width="12" height="80"/><rect class="k" x="26" y="-40" width="12" height="80"/><path class="g" d="M-26 -30 Q0 -20 26 -30"/><path class="gf" d="M4 -16 A16 16 0 1 0 4 16 A22 22 0 0 1 4 -16Z"/><rect class="k" x="-7" y="24" width="14" height="6" rx="1"/><circle class="r" cx="0" cy="27" r="1.6"/>`,
    /* III Empress — garden circle, crown of stars, one vermilion flower */
    () => `<circle class="g" r="30"/>${star(-10, -40, 4)}${star(0, -43, 5)}${star(10, -40, 4)}${[0,1,2,3,4].map(i => { const a = i * 1.2566 - 1.5708; return `<circle class="k" cx="${(7 * Math.cos(a)).toFixed(2)}" cy="${(7 * Math.sin(a)).toFixed(2)}" r="4.2"/>`; }).join('')}<circle class="r" r="3.4"/><path class="k" d="M-22 44 C-20 30 -16 22 -10 14 M22 44 C20 30 16 22 10 14"/>`,
    /* IV Emperor — stone throne, ears upright as pillars, four squares */
    () => `<path class="g" d="M-48 30 L-24 2 L-8 16 L12 -6 L48 30"/><rect class="k" x="-24" y="-4" width="48" height="38"/><rect class="k" x="-24" y="-44" width="8" height="40"/><rect class="k" x="16" y="-44" width="8" height="40"/>${[[-34,-30],[28,-30],[-34,38],[28,38]].map(([x, y]) => `<rect class="gf" x="${x}" y="${y}" width="6" height="6"/>`).join('')}<rect class="r" x="-4" y="10" width="8" height="8"/>`,
    /* V Hierophant — crossed keys over three steps */
    () => `<path class="g" d="M-30 14 V-20 A30 30 0 0 1 30 -20 V14"/><path class="k" d="M-22 -30 L14 6 M22 -30 L-14 6"/><circle class="k" cx="-25" cy="-33" r="5"/><circle class="k" cx="25" cy="-33" r="5"/><path class="k" d="M10 2 l4 -4 M-10 2 l-4 -4"/><circle class="r" cx="0" cy="-8" r="2.6"/><path class="k" d="M-36 42 H36 M-26 32 H26 M-16 22 H16"/>`,
    /* VI Lovers — two figures, light and dark, ribbons crossing into a gate, twin stars */
    () => `<path class="rs" d="M-28 40 C-28 -6 28 -10 28 -36"/><path class="rs" d="M28 40 C28 -6 -28 -10 -28 -36"/>${star(-6, -44, 5)}${star(6, -44, 5)}<circle class="kf" cx="-38" cy="12" r="6"/><circle class="k" cx="38" cy="12" r="6"/><path class="kf" d="M-44 40 Q-38 22 -32 40Z"/><path class="k" d="M32 40 Q38 22 44 40Z"/>`,
    /* VII Chariot — canopy star, two opposing forces moving as one */
    () => `${star(0, -40, 6)}<path class="k" d="M-28 -20 Q0 -36 28 -20"/><rect class="k" x="-22" y="-16" width="44" height="26"/><circle class="k" cx="-18" cy="22" r="10"/><circle class="k" cx="18" cy="22" r="10"/><circle class="r" cx="18" cy="22" r="3.2"/><circle class="kf" cx="-18" cy="22" r="2"/><path class="g" d="M-48 44 L-30 36 M48 44 L30 36"/>`,
    /* VIII Strength — infinity above a calm maned creature, small flower */
    () => `${infinity(-38)}<circle class="k" cx="0" cy="8" r="16"/>${rays(0, 8, 21, 30, 16)}<path class="k" d="M-6 6 Q0 12 6 6"/><circle class="r" cx="0" cy="-2" r="2.6"/><path class="k" d="M-30 44 C-14 36 14 36 30 44"/>`,
    /* IX Hermit — lone peak, lantern with a small star */
    () => `<path class="k" d="M-48 44 L-12 -6 L6 16 L18 4 L48 44"/><line class="k" x1="-12" y1="-6" x2="-12" y2="-22"/><rect class="g" x="-19" y="-38" width="14" height="16" rx="2"/>${star(-12, -30, 5, 4, 1.4, 'r')}<circle class="gf" cx="20" cy="30" r="1.2"/><circle class="gf" cx="26" cy="36" r="1.2"/><circle class="gf" cx="32" cy="42" r="1.2"/>`,
    /* X Wheel of Fortune — celestial wheel, one vermilion phase point */
    () => `<circle class="k" r="38"/><circle class="g" r="27"/><circle class="k" r="8"/>${rays(0, 0, 8, 38, 8)}<circle class="r" cx="0" cy="-38" r="4"/>${[0,1,2,3].map(i => star(46 * Math.cos(i * 1.5708 + .785), 46 * Math.sin(i * 1.5708 + .785), 3)).join('')}`,
    /* XI Justice — upright sword dividing the field, feather against metal */
    () => `<line class="k" x1="0" y1="-46" x2="0" y2="40"/><line class="k" x1="-8" y1="-32" x2="8" y2="-32"/><line class="g" x1="-36" y1="-12" x2="36" y2="-12"/><path class="g" d="M-36 -12 L-44 10 M-36 -12 L-28 10 M36 -12 L28 10 M36 -12 L44 10"/><path class="k" d="M-46 10 Q-36 20 -26 10Z M26 10 Q36 20 46 10Z"/><ellipse class="gf" cx="-36" cy="4" rx="1.6" ry="6" transform="rotate(20 -36 4)"/><circle class="r" cx="36" cy="6" r="4"/>`,
    /* XII Hanged Man — inverted rabbit under an arched branch, halo, droplet */
    () => `<path class="k" d="M-40 -40 Q0 -54 40 -40"/><line class="k" x1="0" y1="-46" x2="0" y2="-26"/><circle class="g" cx="0" cy="6" r="15"/><ellipse class="k" cx="0" cy="-16" rx="7" ry="10"/><circle class="k" cx="0" cy="4" r="6"/><ellipse class="kf" cx="-3.5" cy="19" rx="2" ry="9"/><ellipse class="kf" cx="3.5" cy="19" rx="2" ry="9"/><path class="r" d="M0 34 C4 40 4 44 0 46 C-4 44 -4 40 0 34Z"/>`,
    /* XIII Death — dissolving doorway, sprout, sun rising at the threshold */
    () => `<rect class="k" x="-22" y="-42" width="44" height="78" stroke-dasharray="5 4"/><line class="g" x1="-48" y1="36" x2="48" y2="36"/><path class="r" d="M18 36 A11 11 0 0 1 40 36Z"/><path class="k" d="M0 36 V20 M0 26 C-8 22 -10 16 -10 14 M0 24 C8 20 10 14 10 12"/><rect class="gf" x="28" y="-34" width="5" height="5" transform="rotate(20 30 -31)"/><rect class="gf" x="34" y="-22" width="4" height="4" transform="rotate(-15 36 -20)"/>`,
    /* XIV Temperance — two vessels, the flow between them forms infinity */
    () => `${at(-24, -24, 1.4, SUIT.cups(false))}${at(24, 18, 1.4, SUIT.cups(false))}<path class="g" d="M-16 -18 C10 -18 -10 12 16 12"/><circle class="r" cx="0" cy="-3" r="2.2"/><path class="g" d="M-46 42 Q-34 38 -23 42 T0 42 T23 42 T46 42"/><line class="k" x1="-46" y1="34" x2="-8" y2="34"/>`,
    /* XV Devil — vast rabbit shadow, two small figures, a loose red cord */
    () => `<path class="kf" d="M-12 -48 C-28 -18 -22 12 0 16 C22 12 28 -18 12 -48 C6 -22 -6 -22 -12 -48Z"/>${star(0, -6, 9, 5, 3.8, 'g')}<circle class="k" cx="-22" cy="30" r="6"/><circle class="k" cx="22" cy="30" r="6"/><path class="rs" d="M-18 34 C-8 46 8 46 18 34"/><path class="r" d="M0 22 C3 26 2 30 0 31 C-2 30 -3 26 0 22Z"/>`,
    /* XVI Tower — geometric tower split by vermilion lightning, fragments */
    () => `<path class="k" d="M-14 44 V-26 L0 -40 L14 -26 V44"/><path class="r" d="M22 -50 L-2 -14 L8 -14 L-10 20 L16 -20 L5 -20 L28 -50Z"/><rect class="k" x="22" y="-6" width="7" height="7" transform="rotate(25 25 -2)"/><rect class="k" x="30" y="10" width="5" height="5" transform="rotate(-20 32 12)"/><rect class="k" x="-34" y="0" width="6" height="6" transform="rotate(15 -31 3)"/>`,
    /* XVII Star — eight-pointed star over still water, two vessels */
    () => `${star(0, -16, 28, 8, 9)}${star(-34, -36, 4)}${star(34, -40, 3)}${star(30, 2, 3)}<circle class="r" cx="0" cy="-16" r="2"/><path class="g" d="M-46 32 Q-34 28 -23 32 T0 32 T23 32 T46 32"/>${at(-22, 42, .7, SUIT.cups(false))}${at(22, 42, .7, SUIT.cups(false))}`,
    /* XVIII Moon — red moon between two pillars, winding path to the lake */
    () => `<circle class="r" cx="0" cy="-28" r="14"/>${rays(0, -28, 18, 23, 12, 'g')}<rect class="k" x="-42" y="-6" width="10" height="40"/><rect class="k" x="32" y="-6" width="10" height="40"/><path class="k" d="M0 44 C-14 34 14 24 0 14 C-10 6 6 0 0 -6"/><ellipse class="g" cx="0" cy="44" rx="30" ry="4"/>`,
    /* XIX Sun — great disc with warm vermilion core, open field */
    () => `<circle class="k" cx="0" cy="-8" r="22"/><circle class="r" cx="0" cy="-8" r="13"/>${rays(0, -8, 27, 40, 16)}<path class="k" d="M-48 36 Q0 24 48 36 M-40 46 Q0 36 40 46"/>`,
    /* XX Judgement — crescent horn sounding, figures rising from open boxes */
    () => `<path class="k" d="M-40 -34 Q-4 -50 28 -26 L34 -32 L36 -18 L22 -20 L28 -26"/><circle class="r" cx="33" cy="-25" r="2.6"/>${rays(30, -24, 10, 24, 5, 'g', 1.2)}<path class="k" d="M-34 44 V28 H-14 V44 M-34 28 L-30 18 M14 44 V28 H34 V44 M34 28 L30 18"/><circle class="k" cx="-24" cy="22" r="4"/><circle class="k" cx="24" cy="22" r="4"/>`,
    /* XXI World — laurel orbit with a small opening, four suits at the corners */
    () => `<path class="k" d="M6 -38 A26 38 0 1 1 -6 -38"/>${[...Array(10)].map((_, i) => { const a = -1.2 + i * .62; return `<line class="g" x1="${(26 * Math.cos(a)).toFixed(1)}" y1="${(38 * Math.sin(a)).toFixed(1)}" x2="${(31 * Math.cos(a)).toFixed(1)}" y2="${(43 * Math.sin(a)).toFixed(1)}"/>`; }).join('')}<circle class="r" r="5"/>${star(0, -14, 5)}${at(-42, -42, .6, SUIT.wands(false))}${at(42, -42, .6, SUIT.cups(false))}${at(-42, 44, .6, SUIT.swords(false))}${at(42, 44, .6, SUIT.pentacles(false))}`
  ];

  /* ---------- Minor Arcana ---------- */
  const PIPS = {
    2: [[0,-28],[0,28]],
    3: [[0,-38],[0,0],[0,38]],
    4: [[-18,-24],[18,-24],[-18,24],[18,24]],
    5: [[-18,-26],[18,-26],[0,0],[-18,26],[18,26]],
    6: [[-18,-32],[18,-32],[-18,0],[18,0],[-18,32],[18,32]],
    7: [[-18,-34],[18,-34],[0,-17],[-18,0],[18,0],[-18,34],[18,34]],
    8: [[-18,-36],[18,-36],[0,-18],[-18,0],[18,0],[0,18],[-18,36],[18,36]],
    9: [[-18,-40],[18,-40],[-18,-13.5],[18,-13.5],[0,0],[-18,13.5],[18,13.5],[-18,40],[18,40]],
    10: [[-18,-39],[18,-39],[0,-26],[-18,-13],[18,-13],[-18,13],[18,13],[0,26],[-18,39],[18,39]]
  };
  const COURT_MARK = {
    11: `<path class="k" d="M0 -30 V-40 M0 -34 C-5 -36 -7 -40 -6 -43 M0 -36 C5 -38 7 -42 6 -45"/><circle class="r" cx="0" cy="-28" r="2"/>`,                                   // Page: a sprout of curiosity
    12: `<path class="g" d="M-30 -36 L-14 -42 M-32 -28 L-12 -34 M-30 -20 L-14 -26"/><path class="k" d="M10 -44 L22 -36 L10 -28"/><circle class="r" cx="0" cy="-36" r="2"/>`,   // Knight: motion
    13: `<path class="g" d="M-16 -32 A16 10 0 0 1 16 -32"/>${'-12,0,12'.split(',').map(x => `<circle class="gf" cx="${x}" cy="${x === '0' ? -45 : -41}" r="2"/>`).join('')}<circle class="r" cx="0" cy="-32" r="2.2"/>`, // Queen: rounded crown
    14: `<path class="g" d="M-16 -30 V-44 L-8 -36 L0 -46 L8 -36 L16 -44 V-30Z"/><circle class="r" cx="0" cy="-34" r="2.2"/>`                                                    // King: square crown
  };
  function minorMotif(card){
    const sym = SUIT[card.suit];
    if (card.rank === 1) return `<circle class="g" r="36"/><circle class="g" r="40" stroke-dasharray="1 4"/>${at(0, 0, 3, sym(true))}`;
    // cups and pentacles are wider than wands/swords, so dense layouts shrink them further
    const wide = card.suit === 'cups' || card.suit === 'pentacles';
    const pipScale = (card.rank <= 3 ? 1.6 : card.rank <= 6 ? 1.4 : 1.15) * (wide && card.rank >= 7 ? .8 : 1);
    if (card.rank <= 10) return PIPS[card.rank].map(([x, y]) => at(x, y, pipScale, sym(false))).join('');
    return `${COURT_MARK[card.rank]}${at(0, 8, 2.6, sym(false))}<path class="g" d="M-30 44 H30"/>`;
  }

  /* ---------- frame ---------- */
  const esc = s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const ears = (y, flip) => `<g transform="translate(150 ${y})${flip ? ' rotate(180)' : ''}"><ellipse class="g" cx="-5" cy="0" rx="3" ry="11" transform="rotate(-14 -5 0)"/><ellipse class="g" cx="5" cy="0" rx="3" ry="11" transform="rotate(14 5 0)"/></g>`;

  function face(card){
    const dark = card.arcana === 'major' && DARK.has(card.n);
    const fg = dark ? C.ivory : C.ink, bg = dark ? C.ink : (card.arcana === 'major' ? C.ivory : C.paper), muted = dark ? C.stone : C.muted;
    const art = window.RABBIT_ART[card.id];
    const motif = art
      ? `<image href="${esc(art)}" x="34" y="112" width="232" height="244" preserveAspectRatio="xMidYMid slice"/>`
      : `<g class="rt-motif" transform="translate(150 236) scale(2.05)">${card.arcana === 'major' ? MAJOR[card.n]() : minorMotif(card)}</g>`;
    const nameSize = card.name.length > 17 ? 21 : card.name.length > 13 ? 24 : 28;
    const suitTag = card.arcana === 'minor' ? at(150, 104, .75, SUIT[card.suit](false)) : '';
    return `<svg class="rt-card" viewBox="0 0 300 500" role="img" aria-label="${esc(card.vi)} — ${esc(card.name)}" style="--fg:${fg};--bg:${bg};--mt:${muted}">
      <rect class="bf" width="300" height="500" rx="8"/>
      <rect class="k" x="12" y="12" width="276" height="476" rx="5"/>
      <rect class="g" x="21" y="21" width="258" height="458" rx="3"/>
      ${ears(46)}
      <text class="rt-num" x="150" y="${card.arcana === 'minor' ? 86 : 92}">${esc(card.label)}</text>
      ${suitTag}
      ${motif}
      <line class="g" x1="96" y1="374" x2="204" y2="374"/><circle class="gf" cx="150" cy="374" r="2"/>
      <text class="rt-name" x="150" y="414" style="font-size:${nameSize}px">${esc(card.name)}</text>
      <text class="rt-vi" x="150" y="442">${esc(card.vi)}</text>
    </svg>`;
  }

  /* Card back: symmetric, reads the same rotated 180°; celestial rings, rabbit emblem, Ink/Ivory/Antique Gold */
  function back(){
    return `<svg class="rt-card" viewBox="0 0 300 500" aria-hidden="true" style="--fg:${C.ivory};--bg:${C.ink};--mt:${C.stone}">
      <rect class="bf" width="300" height="500" rx="8"/>
      <rect class="g" x="12" y="12" width="276" height="476" rx="5"/>
      <rect class="g" x="21" y="21" width="258" height="458" rx="3"/>
      ${ears(56)}${ears(444, true)}
      <circle class="g" cx="150" cy="250" r="104" stroke-dasharray="1 5"/>
      <circle class="g" cx="150" cy="250" r="92"/>
      <circle class="g" cx="150" cy="250" r="70"/>
      ${star(150, 132, 7)}${star(150, 368, 7)}${star(44, 250, 5)}${star(256, 250, 5)}
      <circle style="fill:${C.ivory}" cx="150" cy="250" r="60"/>
      <image href="assets/emblem-144.png" x="104" y="204" width="92" height="92"/>
    </svg>`;
  }

  window.RabbitCard = {face, back, SUIT_VI};
})();

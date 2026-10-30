/* Rabbit Tarot CMS — content schema and page renderer.
   One source of markup for the public page: /admin uses it for Preview and to build index.html on Publish,
   from cms/template.html + content/site.json. Section types are data-driven: add a type here and both the
   admin form and the page pick it up. Every piece of content text is escaped; URLs go through safeUrl(). */
(function (root) {
  'use strict';

  /* ---------- helpers ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[m]));
  // *text* → <em>text</em>, after escaping
  const emph = s => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // blank line = new paragraph, single newline = line break
  const paras = s => String(s || '').trim().split(/\n\s*\n/).filter(Boolean).map(p => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('');
  const SAFE_URL = /^(#[\w\-:.]*|\/(?!\/)[^\s]*|https?:\/\/[^\s]+|mailto:[^\s]+|tel:[+\d\s.-]+|assets\/[\w\-./]+)$/i;
  const safeUrl = u => { u = String(u || '').trim(); return SAFE_URL.test(u) ? u : '#'; };
  const safeSrc = u => { u = String(u || '').trim(); return /^(assets\/[\w\-./]+|https:\/\/[^\s"']+)$/i.test(u) ? u : ''; };
  const fmtPrice = v => Number(v || 0).toLocaleString('vi-VN') + 'đ';
  const zaloUrl = r => { const d = String(r.phone || '').replace(/\D/g, ''); return d ? `https://zalo.me/${d}` : ''; };
  // audience: shown always, only while booking goes through Zalo (online booking closed), or only when online booking is open
  const aud = a => a === 'zalo' ? ' data-soon' : a === 'online' ? ' data-booking' : '';
  const showOn = s => {
    const d = s.showOn || {};
    return d.desktop === false ? ' hide-desktop' : d.mobile === false ? ' hide-mobile' : '';
  };
  const arrow = ' <span aria-hidden="true">→</span>';

  /* ---------- schema ----------
     field types: text, textarea, number, url, image, link {label, href}, select, toggle, list (of item fields),
     strings (list of short texts), bio (paragraphs / "- " list / "> " quote), days (weekdays off), card (tarot card id) */
  const AUD = {k: 'audience', t: 'select', label: 'Hiển thị', options: [['all', 'Luôn hiện'], ['zalo', 'Chỉ khi đặt qua Zalo'], ['online', 'Chỉ khi mở đặt lịch online']]};
  const HEAD = [
    {k: 'eyebrow', t: 'text', label: 'Nhãn nhỏ', help: 'Dòng chữ in hoa nhỏ phía trên tiêu đề.', max: 60},
    {k: 'heading', t: 'text', label: 'Tiêu đề', req: true, max: 120},
    {k: 'lead', t: 'textarea', label: 'Đoạn giới thiệu', max: 400}
  ];
  const TYPES = {
    hero: {label: 'Hero (đầu trang)', singleton: true, fields: [
      {k: 'eyebrow', t: 'text', label: 'Nhãn nhỏ', max: 60},
      {k: 'heading', t: 'text', label: 'Tiêu đề lớn', help: 'Đặt chữ trong *dấu sao* để in nghiêng màu đỏ son.', req: true, max: 120},
      {k: 'lead', t: 'textarea', label: 'Đoạn mô tả', max: 400},
      {k: 'cta', t: 'link', label: 'Nút chính'},
      {k: 'link', t: 'link', label: 'Liên kết phụ'},
      {k: 'image', t: 'image', label: 'Hình minh hoạ', help: 'Hình vuông, nền trong suốt hoặc trùng màu nền.'},
      {k: 'imageAlt', t: 'text', label: 'Mô tả hình (alt)', help: 'Cho người dùng trình đọc màn hình và SEO.', max: 160},
      {k: 'notes', t: 'list', label: 'Ghi chú dưới hero', item: [{k: 'title', t: 'text', label: 'Tiêu đề', req: true, max: 60}, {k: 'text', t: 'text', label: 'Mô tả', max: 120}, AUD]}
    ]},
    services: {label: 'Gói trải bài', singleton: true, anchor: 'services', fields: [...HEAD,
      {k: 'zaloCta', t: 'text', label: 'Nhãn nút đặt qua Zalo ở mỗi gói', max: 40},
      {k: 'items', t: 'list', label: 'Các gói', help: 'Mã gói dùng cho đặt lịch online; giữ nguyên mã của gói đang có.', item: [
        {k: 'id', t: 'text', label: 'Mã gói', req: true, pattern: '^[a-z0-9-]{2,24}$', help: 'Chữ thường không dấu, ví dụ: deep', max: 24},
        {k: 'name', t: 'text', label: 'Tên gói', req: true, max: 60},
        {k: 'tag', t: 'text', label: 'Nhãn nổi bật', help: 'Để trống nếu không cần.', max: 30},
        {k: 'dur', t: 'number', label: 'Thời lượng (phút)', req: true, min: 10, max: 300},
        {k: 'price', t: 'number', label: 'Giá (đồng)', req: true, min: 0, max: 100000000},
        {k: 'desc', t: 'textarea', label: 'Mô tả', max: 300}]}
    ]},
    process: {label: 'Cách đặt lịch online', singleton: true, anchor: 'process', onlineOnly: true, fields: [...HEAD,
      {k: 'steps', t: 'list', label: 'Các bước', item: [{k: 'n', t: 'text', label: 'Số', max: 6}, {k: 'title', t: 'text', label: 'Tiêu đề', req: true, max: 40}, {k: 'text', t: 'text', label: 'Mô tả', max: 120}]}
    ]},
    readers: {label: 'Reader', singleton: true, anchor: 'readers', fields: [...HEAD,
      {k: 'items', t: 'list', label: 'Reader', item: [
        {k: 'id', t: 'text', label: 'Mã reader', req: true, pattern: '^[a-z0-9-]{2,24}$', help: 'Chữ thường không dấu. Giữ nguyên sau khi đã có lịch đặt.', max: 24},
        {k: 'name', t: 'text', label: 'Tên', req: true, max: 40},
        {k: 'alias', t: 'text', label: 'Biệt danh', max: 60},
        {k: 'card', t: 'card', label: 'Lá bài đại diện'},
        {k: 'title', t: 'text', label: 'Câu châm ngôn', max: 160},
        {k: 'bio', t: 'bio', label: 'Giới thiệu', help: 'Cách một dòng trống để sang đoạn mới. Dòng bắt đầu bằng "- " là gạch đầu dòng, "> " là trích dẫn.', max: 4000},
        {k: 'photo', t: 'image', label: 'Ảnh chân dung', help: 'Tỉ lệ 3:4, khoảng 720 × 960 px.', req: true},
        {k: 'avatar', t: 'image', label: 'Ảnh đại diện nhỏ', help: 'Ảnh cận mặt, vuông. Để trống sẽ dùng ảnh chân dung.'},
        {k: 'qr', t: 'image', label: 'Mã QR Zalo'},
        {k: 'phone', t: 'text', label: 'Số điện thoại Zalo', pattern: '^[0-9+ .]{0,16}$', help: 'Nút “Mở Zalo” mở thẳng zalo.me/<số>. Số này hiển thị công khai.', max: 16},
        {k: 'off', t: 'days', label: 'Ngày nghỉ hằng tuần (đặt lịch online)'}]}
    ]},
    booking: {label: 'Đặt lịch', singleton: true, anchor: 'booking', fields: [
      {k: 'eyebrow', t: 'text', label: 'Nhãn nhỏ', max: 60},
      {k: 'heading', t: 'text', label: 'Tiêu đề (đặt qua Zalo)', req: true, max: 120},
      {k: 'lead', t: 'textarea', label: 'Đoạn giới thiệu (đặt qua Zalo)', max: 400},
      {k: 'stepsTitle', t: 'text', label: 'Tiêu đề các bước', max: 60},
      {k: 'steps', t: 'strings', label: 'Các bước giữ lịch', max: 160},
      {k: 'pickCta', t: 'text', label: 'Nhãn nút ở mỗi reader', max: 30},
      {k: 'popupNote', t: 'textarea', label: 'Ghi chú cuối popup Zalo', max: 300},
      {k: 'headingOnline', t: 'text', label: 'Tiêu đề (khi mở đặt lịch online)', max: 120},
      {k: 'leadOnline', t: 'textarea', label: 'Đoạn giới thiệu (khi mở đặt lịch online)', max: 400}
    ]},
    daily: {label: 'Lá bài hôm nay', singleton: true, anchor: 'daily', fields: [...HEAD,
      {k: 'flipLabel', t: 'text', label: 'Nhãn nút lật bài', max: 30},
      {k: 'ctaLabel', t: 'text', label: 'Nhãn nút sau khi lật', max: 40},
      {k: 'disclaimer', t: 'text', label: 'Ghi chú cuối', max: 200}
    ]},
    faq: {label: 'Hỏi đáp', singleton: true, anchor: 'faq', fields: [
      {k: 'eyebrow', t: 'text', label: 'Nhãn nhỏ', max: 60},
      {k: 'heading', t: 'text', label: 'Tiêu đề', req: true, max: 120},
      {k: 'asideText', t: 'textarea', label: 'Dòng gợi ý dưới tiêu đề', max: 200},
      {k: 'asideLink', t: 'link', label: 'Liên kết gợi ý'},
      {k: 'items', t: 'list', label: 'Câu hỏi', item: [{k: 'q', t: 'text', label: 'Câu hỏi', req: true, max: 160}, {k: 'a', t: 'textarea', label: 'Trả lời', req: true, max: 1000}, AUD]}
    ]},
    lookup: {label: 'Tra cứu lịch', singleton: true, anchor: 'lookup', onlineOnly: true, fields: [
      {k: 'eyebrow', t: 'text', label: 'Nhãn nhỏ', max: 60},
      {k: 'heading', t: 'text', label: 'Tiêu đề', req: true, max: 120}
    ]},
    text: {label: 'Nội dung tự do (chữ + hình)', fields: [
      {k: 'eyebrow', t: 'text', label: 'Nhãn nhỏ', max: 60},
      {k: 'heading', t: 'text', label: 'Tiêu đề', req: true, max: 120},
      {k: 'body', t: 'textarea', label: 'Nội dung', help: 'Cách một dòng trống để sang đoạn mới.', max: 3000},
      {k: 'image', t: 'image', label: 'Hình'},
      {k: 'imageAlt', t: 'text', label: 'Mô tả hình (alt)', max: 160},
      {k: 'layout', t: 'select', label: 'Bố cục', options: [['image-right', 'Hình bên phải'], ['image-left', 'Hình bên trái'], ['no-image', 'Chỉ có chữ']]},
      {k: 'tone', t: 'select', label: 'Nền', options: [['ivory', 'Ngà (mặc định)'], ['paper', 'Giấy'], ['ink', 'Mực (tối)']]},
      {k: 'cta', t: 'link', label: 'Nút'}
    ]},
    banner: {label: 'Banner hình', fields: [
      {k: 'image', t: 'image', label: 'Hình trên máy tính', req: true, help: 'Khuyên dùng 2400 × 1000 px.'},
      {k: 'imageMobile', t: 'image', label: 'Hình trên điện thoại', help: 'Tuỳ chọn. Khuyên dùng 1080 × 1350 px.'},
      {k: 'alt', t: 'text', label: 'Mô tả hình (alt)', req: true, max: 160},
      {k: 'caption', t: 'text', label: 'Chú thích dưới hình', max: 160},
      {k: 'href', t: 'url', label: 'Liên kết khi bấm vào hình'}
    ]}
  };

  /* ---------- sections ---------- */
  const R = {};
  const head2 = (d, id) => `<div class="section-head reveal">
      <div>${d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : ''}<h2${id ? ` id="${id}"` : ''}>${emph(d.heading)}</h2></div>
      ${d.lead ? `<p class="lead">${esc(d.lead)}</p>` : ''}
    </div>`;

  R.hero = (d) => `<section class="hero">
  <div class="container">
    <div class="hero-grid">
      <div class="reveal">
        ${d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : ''}
        <h1>${emph(d.heading)}</h1>
        ${d.lead ? `<p class="lead">${esc(d.lead)}</p>` : ''}
        <div class="hero-cta">
          ${d.cta && d.cta.label ? `<a href="${esc(safeUrl(d.cta.href))}" class="btn btn-primary">${esc(d.cta.label)}</a>` : ''}
          ${d.link && d.link.label ? `<a href="${esc(safeUrl(d.link.href))}" class="link">${esc(d.link.label)}${arrow}</a>` : ''}
        </div>
      </div>
      ${safeSrc(d.image) ? `<div class="emblem reveal"><img src="${esc(safeSrc(d.image))}" alt="${esc(d.imageAlt)}" width="440" height="440" fetchpriority="high"></div>` : ''}
    </div>
    ${(d.notes || []).length ? `<div class="hero-notes reveal">
      ${d.notes.map(n => `<div${aud(n.audience)}><b>${esc(n.title)}</b>${esc(n.text)}</div>`).join('\n      ')}
    </div>` : ''}
  </div>
</section>`;

  R.services = (d) => `<section id="services">
  <div class="container">
    ${head2(d)}
    <ol class="svc-list">${(d.items || []).map((s, i) => `
      <li class="svc reveal">
        <span class="svc-no">${String(i + 1).padStart(2, '0')}</span>
        <div><h3>${esc(s.name)}${s.tag ? ` <span class="tag">${esc(s.tag)}</span>` : ''}</h3>${s.desc ? `<p>${esc(s.desc)}</p>` : ''}</div>
        <span class="svc-dur">${esc(s.dur)} phút</span>
        <span class="svc-price">${fmtPrice(s.price)}</span>
        <button type="button" class="link" data-booking data-pick-svc="${esc(s.id)}">Chọn gói${arrow}</button>
        <a class="link" href="#zalo" data-soon>${esc(d.zaloCta || 'Đặt qua Zalo')}${arrow}</a>
      </li>`).join('')}
    </ol>
  </div>
</section>`;

  R.process = (d) => `<section id="process" data-booking>
  <div class="container">
    ${head2(d)}
    <ol class="steps">${(d.steps || []).map(s => `
      <li class="step reveal"><span class="n">${esc(s.n)}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('')}
    </ol>
  </div>
</section>`;

  const bioHtml = b => (Array.isArray(b) ? b : [b]).map(x =>
    typeof x === 'string' ? `<p>${esc(x)}</p>`
    : x && x.list ? `<ul>${x.list.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`
    : x && x.quote ? `<blockquote>“${esc(x.quote)}”</blockquote>` : '').join('');

  R.readers = (d, ctx) => `<section id="readers">
  <div class="container">
    ${head2(d)}
    <div class="readers">${(d.items || []).map(r => {
      const card = ctx.card(r.card);
      const url = zaloUrl(r);
      return `
      <article class="reader-profile reveal" id="reader-${esc(r.id)}">
        <figure class="rp-photo"><img src="${esc(safeSrc(r.photo))}" alt="Reader ${esc(r.name)} đang trải bài Tarot" width="720" height="960" loading="lazy"></figure>
        <div class="rp-body">
          <span class="eyebrow">Reader${r.alias ? ` · ${esc(r.alias)}` : ''}</span>
          <h3>${esc(r.name)}</h3>
          ${r.title ? `<p class="rp-title">“${esc(r.title)}”</p>` : ''}
          <div class="rp-bio">${bioHtml(r.bio)}</div>
          <div class="rp-foot">
            ${card ? `<div class="rp-card"><div class="mini" data-card="${esc(card.id)}"></div><div class="rp-meta"><span class="label">Lá bài đại diện</span><b>${esc(card.vi)}</b><span>${esc(card.name)}</span></div></div>` : ''}
            ${(r.qr || url) ? `<a class="btn btn-primary" href="${esc(url || '#zalo')}" data-zalo="${esc(r.id)}">Nhắn Zalo cho ${esc(r.name)}</a>` : ''}
          </div>
          <button type="button" class="link" data-booking data-pick-reader="${esc(r.id)}">Đặt lịch với ${esc(r.name)}${arrow}</button>
        </div>
      </article>`;
    }).join('')}
    </div>
  </div>
</section>`;

  R.booking = (d, ctx) => {
    const readers = ctx.readers.filter(r => r.qr || r.phone);
    return `<section id="booking" aria-labelledby="bookingTitle">
  <div class="container">
    <div class="section-head reveal">
      <div>${d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : ''}<h2 id="bookingTitle"><span data-booking>${emph(d.headingOnline || 'Giữ chỗ cho buổi trải bài')}</span><span data-soon>${emph(d.heading)}</span></h2></div>
      ${d.leadOnline ? `<p class="lead" data-booking>${esc(d.leadOnline)}</p>` : ''}
      ${d.lead ? `<p class="lead" data-soon>${esc(d.lead)}</p>` : ''}
    </div>
    <div class="zalo-box reveal" id="zalo" data-soon>
      <div>
        ${d.stepsTitle ? `<h3 class="label">${esc(d.stepsTitle)}</h3>` : ''}
        <ol class="zalo-steps">
          ${(d.steps || []).map((s, i) => `<li><b>${i + 1}</b><span>${esc(s)}</span></li>`).join('\n          ')}
        </ol>
      </div>
      <ul class="reader-pick" id="readerPick" aria-label="Chọn reader">${readers.length ? readers.map(r => {
        const c = ctx.card(r.card);
        return `
        <li class="pick">
          <img src="${esc(safeSrc(r.avatar || r.photo))}" alt="" width="72" height="96" loading="lazy">
          <div>
            <div class="pick-name">${esc(r.name)}</div>
            ${c ? `<div class="label pick-card">${esc(c.name)}</div>` : ''}
            ${r.title ? `<p class="pick-title">${esc(r.title)}</p>` : ''}
            <a class="pick-more" href="#reader-${esc(r.id)}">Xem hồ sơ</a>
          </div>
          <a class="btn btn-secondary" href="#zalo" data-zalo="${esc(r.id)}" aria-label="${esc(d.pickCta || 'Nhắn Zalo')} cho ${esc(r.name)}">${esc(d.pickCta || 'Nhắn Zalo')}</a>
        </li>`;
      }).join('') : `
        <li class="pick-empty">Thông tin reader đang được cập nhật</li>`}
      </ul>
    </div>
    ${ctx.wizard}
  </div>
</section>`;
  };

  R.daily = (d) => `<section id="daily" class="on-dark" aria-labelledby="dailyTitle">
  <div class="container daily">
    <div class="reveal stack-head">
      ${d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : ''}
      <h2 id="dailyTitle">${emph(d.heading)}</h2>
      <div class="reading" id="reading" aria-live="polite">
        ${d.lead ? `<p class="lead">${esc(d.lead)}</p>` : ''}
      </div>
      <div class="daily-actions">
        <button type="button" class="btn btn-primary" id="flipBtn">${esc(d.flipLabel || 'Lật lá bài')}</button>
        <button type="button" class="btn btn-secondary" id="redraw" hidden>Rút lá khác</button>
        <a href="#booking" class="btn btn-primary" id="readMore" data-booking hidden>Đặt lịch trải bài đầy đủ</a>
        <a href="#zalo" class="btn btn-primary" id="readMoreZalo" data-soon hidden>${esc(d.ctaLabel || 'Đặt lịch trải bài qua Zalo')}</a>
      </div>
      ${d.disclaimer ? `<p class="disclaimer">${esc(d.disclaimer)}</p>` : ''}
    </div>
    <div class="deck reveal">
      <div class="flip" id="flip" role="button" tabindex="0" aria-label="Lật lá bài hôm nay">
        <div class="face front" id="cardBack" aria-hidden="true"></div>
        <div class="face back" id="cardFace"></div>
      </div>
    </div>
  </div>
</section>`;

  R.faq = (d) => `<section id="faq">
  <div class="container faq-grid">
    <div class="reveal stack-head faq-aside">
      ${d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : ''}
      <h2>${emph(d.heading)}</h2>
      ${d.asideText ? `<p data-soon>${esc(d.asideText)}</p>` : ''}
      ${d.asideLink && d.asideLink.label ? `<a href="${esc(safeUrl(d.asideLink.href))}" class="link" data-soon>${esc(d.asideLink.label)}${arrow}</a>` : ''}
    </div>
    <div class="reveal">
      ${(d.items || []).map(f => `<details${aud(f.audience)}><summary>${esc(f.q)}</summary>${paras(f.a)}</details>`).join('\n      ')}
    </div>
  </div>
</section>`;

  R.lookup = (d) => `<section id="lookup" aria-labelledby="lookupTitle" data-booking>
  <div class="container lookup-grid">
    <div class="reveal stack-head">
      ${d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : ''}
      <h2 id="lookupTitle">${emph(d.heading)}</h2>
    </div>
    <div class="reveal">
      <form class="lookup-form" id="lkForm">
        <label for="lkInput" class="sr-only">Mã đặt lịch</label>
        <input id="lkInput" placeholder="Mã đặt lịch, ví dụ RT-7K2QX" autocomplete="off">
        <button class="btn btn-primary" type="submit">Tra cứu</button>
      </form>
      <div id="lookupResult" aria-live="polite"></div>
    </div>
  </div>
</section>`;

  R.text = (d, ctx, s) => {
    const img = d.layout !== 'no-image' && safeSrc(d.image);
    const tone = d.tone === 'ink' ? ' class="cms-text on-dark tone-ink"' : d.tone === 'paper' ? ' class="cms-text tone-paper"' : ' class="cms-text"';
    return `<section id="${esc(s.anchor)}"${tone}>
  <div class="container cms-text-grid${img ? (d.layout === 'image-left' ? ' img-left' : '') : ' no-img'}">
    <div class="reveal stack-head">
      ${d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : ''}
      <h2>${emph(d.heading)}</h2>
      <div class="cms-body">${paras(d.body)}</div>
      ${d.cta && d.cta.label ? `<a href="${esc(safeUrl(d.cta.href))}" class="btn btn-primary">${esc(d.cta.label)}</a>` : ''}
    </div>
    ${img ? `<figure class="cms-figure reveal"><img src="${esc(img)}" alt="${esc(d.imageAlt)}" loading="lazy"></figure>` : ''}
  </div>
</section>`;
  };

  R.banner = (d, ctx, s) => {
    const src = safeSrc(d.image); if (!src) return '';
    const mob = safeSrc(d.imageMobile);
    const pic = `<picture>${mob ? `<source media="(max-width:600px)" srcset="${esc(mob)}">` : ''}<img src="${esc(src)}" alt="${esc(d.alt)}" loading="lazy"></picture>`;
    return `<section id="${esc(s.anchor)}" class="cms-banner">
  <div class="container reveal">
    ${d.href ? `<a href="${esc(safeUrl(d.href))}">${pic}</a>` : pic}
    ${d.caption ? `<p class="cms-caption">${esc(d.caption)}</p>` : ''}
  </div>
</section>`;
  };

  /* ---------- page ---------- */
  function sectionHtml(s, ctx) {
    const fn = R[s.type];
    if (!fn) return '';
    let html = fn(s.data || {}, ctx, s);
    const extra = showOn(s);
    if (extra) html = html.replace(/^<section( class="([^"]*)")?/, (m, a, cls) => `<section class="${((cls || '') + extra).trim()}"`);
    return html;
  }

  const navLinks = sections => sections
    .map(s => ({s, anchor: TYPES[s.type].anchor || s.anchor}))
    .filter(x => x.s.navLabel && x.anchor)
    .map(x => ({label: x.s.navLabel, href: '#' + x.anchor, online: !!TYPES[x.s.type].onlineOnly}));

  // the online booking wizard is fixed markup kept in the template between these markers
  const WIZARD = /<!--CMS:WIZARD-->([\s\S]*?)<!--\/CMS:WIZARD-->/;

  function render(template, content, opts) {
    opts = opts || {};
    const wiz = template.match(WIZARD);
    template = template.replace(WIZARD, '');
    const st = content.settings || {};
    const sections = (content.sections || []).filter(s => s.visible !== false && TYPES[s.type]);
    const readersSec = sections.find(s => s.type === 'readers') || (content.sections || []).find(s => s.type === 'readers');
    const readers = ((readersSec && readersSec.data.items) || []);
    const servicesSec = (content.sections || []).find(s => s.type === 'services');
    const deck = opts.deck || [];
    const ctx = {
      readers,
      card: id => deck.find(c => c.id === id),
      wizard: wiz ? wiz[1].trim() : ''
    };
    const nav = navLinks(sections);
    const h = st.header || {};
    const f = st.footer || {};
    const seo = st.seo || {};
    const base = (seo.canonical || '').replace(/\/+$/, '');
    const abs = u => /^https?:/.test(u) ? u : base ? `${base}/${u}` : u;

    const headHtml = `<title>${esc(seo.title || st.siteTitle)}</title>
<meta name="description" content="${esc(seo.description)}">
${seo.canonical ? `<link rel="canonical" href="${esc(safeUrl(seo.canonical))}">` : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(st.siteTitle)}">
<meta property="og:title" content="${esc(seo.ogTitle || seo.title || st.siteTitle)}">
<meta property="og:description" content="${esc(seo.ogDescription || seo.description)}">
${seo.canonical ? `<meta property="og:url" content="${esc(safeUrl(seo.canonical))}">` : ''}
${safeSrc(seo.ogImage) ? `<meta property="og:image" content="${esc(abs(safeSrc(seo.ogImage)))}">\n<meta name="twitter:card" content="summary_large_image">` : ''}
<link rel="icon" href="${esc(safeSrc(st.favicon) || 'assets/emblem-144.png')}">`;

    const ctaHref = esc(safeUrl(h.ctaHref || '#zalo'));
    const headerHtml = `<header id="top">
  <nav class="nav container" id="nav" aria-label="Điều hướng chính">
    <a href="#" class="brand" aria-label="${esc(st.siteTitle)} — về đầu trang">
      <img src="${esc(safeSrc(h.logo) || 'assets/emblem-144.png')}" alt="" width="52" height="52">
      <span>${esc(h.brandName || st.siteTitle)}</span>
    </a>
    <ul id="navList">
      ${nav.map(n => `<li${n.online ? ' data-booking' : ''}><a href="${esc(n.href)}">${esc(n.label)}</a></li>`).join('\n      ')}
      <li class="nav-cta" data-booking><a href="#booking" class="btn btn-primary">Đặt lịch</a></li>
      <li class="nav-cta" data-soon><a href="${ctaHref}" class="btn btn-primary">${esc(h.ctaLabelMobile || h.ctaLabel || 'Đặt lịch')}</a></li>
    </ul>
    <a href="#booking" class="btn btn-primary" data-booking>Đặt lịch</a>
    <a href="${ctaHref}" class="btn btn-primary" data-soon>${esc(h.ctaLabel || 'Đặt lịch')}</a>
    <button class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="navList">Menu</button>
  </nav>
</header>`;

    const mainHtml = sections.map(s => sectionHtml(s, ctx)).join('\n\n');

    const zaloReaders = readers.filter(r => r.qr || r.phone);
    const contact = f.contact || {};
    const footerHtml = `<footer>
  <div class="container">
    <div class="foot-grid">
      <div class="foot-brand">
        <a href="#" class="brand" aria-label="${esc(st.siteTitle)} — về đầu trang"><img src="${esc(safeSrc(h.logo) || 'assets/emblem-144.png')}" alt="" width="48" height="48"><span>${esc(h.brandName || st.siteTitle)}</span></a>
        ${f.tagline ? `<p>${esc(f.tagline)}</p>` : ''}
      </div>
      <div><h2 class="label">${esc(f.hoursTitle || 'Giờ nhận lịch')}</h2><ul>${(f.hours || []).map(x => `<li>${esc(x)}</li>`).join('')}${f.showZalo !== false && zaloReaders.length ? `<li id="footZalo">Zalo: ${zaloReaders.map(r => `<a href="#zalo" data-zalo="${esc(r.id)}">${esc(r.name)}</a>`).join(', ')}</li>` : ''}${contact.phone ? `<li><a href="tel:${esc(String(contact.phone).replace(/[^\d+]/g, ''))}">${esc(contact.phone)}</a></li>` : ''}${contact.email ? `<li><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></li>` : ''}${contact.address ? `<li>${esc(contact.address)}</li>` : ''}</ul></div>
      <div><h2 class="label">${esc(f.pagesTitle || 'Trang')}</h2><ul>${nav.map(n => `<li${n.online ? ' data-booking' : ''}><a href="${esc(n.href)}">${esc(n.label)}</a></li>`).join('')}</ul></div>
      ${(f.social || []).length ? `<div><h2 class="label">${esc(f.socialTitle || 'Theo dõi')}</h2><ul>${f.social.map(x => `<li><a href="${esc(safeUrl(x.href))}" target="_blank" rel="noopener">${esc(x.label)}</a></li>`).join('')}</ul></div>` : ''}
    </div>
    <div class="copy"><span>${esc(f.copyright)}</span><span>${esc(f.disclaimer)}</span></div>
  </div>
</footer>`;

    const bookingSec = (content.sections || []).find(s => s.type === 'booking');
    const dialogNote = bookingSec && bookingSec.data.popupNote;
    // only what the page script needs; "<" escaped so content can never close the script tag
    const data = {
      services: ((servicesSec && servicesSec.data.items) || []).map(s => ({id: s.id, name: s.name, dur: +s.dur, price: +s.price})),
      readers: readers.map(r => ({id: r.id, name: r.name, card: r.card, photo: r.photo, avatar: r.avatar, qr: r.qr, phone: r.phone, off: r.off || []}))
    };
    const dataHtml = `<script>window.RT_CONTENT=${JSON.stringify(data).replace(/</g, '\\u003c')};</script>`;

    return template
      .replace('<!--CMS:HEAD-->', () => headHtml)
      .replace('<!--CMS:HEADER-->', () => headerHtml)
      .replace('<!--CMS:MAIN-->', () => mainHtml)
      .replace('<!--CMS:FOOTER-->', () => footerHtml)
      .replace('<!--CMS:DIALOG_NOTE-->', () => dialogNote ? `<p class="zd-note">${esc(dialogNote)}</p>` : '')
      .replace('<!--CMS:DATA-->', () => dataHtml);
  }

  /* ---------- validation (also used by /admin before Save and Publish) ---------- */
  function validate(content) {
    const errs = [];
    const check = (fields, data, where) => fields.forEach(f => {
      const v = data ? data[f.k] : undefined;
      const name = `${where} › ${f.label}`;
      const empty = v == null || v === '' || (Array.isArray(v) && !v.length);
      if (f.req && empty && f.t !== 'list') errs.push(`${name}: bắt buộc`);
      if (empty) return;
      if (f.max && typeof v === 'string' && v.length > f.max) errs.push(`${name}: tối đa ${f.max} ký tự`);
      if (f.pattern && typeof v === 'string' && !new RegExp(f.pattern).test(v)) errs.push(`${name}: sai định dạng`);
      if (f.t === 'number' && (isNaN(+v) || (f.min != null && +v < f.min) || (f.max != null && +v > f.max))) errs.push(`${name}: số không hợp lệ`);
      if (f.t === 'url' && safeUrl(v) === '#' && v !== '#') errs.push(`${name}: liên kết không hợp lệ`);
      if (f.t === 'link' && v.href && safeUrl(v.href) === '#' && v.href !== '#') errs.push(`${name}: liên kết không hợp lệ`);
      if (f.t === 'image' && !safeSrc(v)) errs.push(`${name}: đường dẫn hình không hợp lệ`);
      if (f.t === 'list') {
        v.forEach((it, i) => check(f.item, it, `${name} #${i + 1}`));
        const ids = v.map(it => it.id).filter(Boolean);
        if (new Set(ids).size !== ids.length) errs.push(`${name}: mã bị trùng`);
      }
    });
    const secs = content.sections || [];
    secs.forEach(s => {
      const T = TYPES[s.type];
      if (!T) return errs.push(`Section không rõ loại: ${s.type}`);
      check(T.fields, s.data, s.title || T.label);
    });
    const anchors = secs.map(s => (TYPES[s.type] || {}).anchor || s.anchor).filter(Boolean);
    if (new Set(anchors).size !== anchors.length) errs.push('Có hai section trùng mã neo (anchor)');
    const st = content.settings || {};
    if (!st.siteTitle) errs.push('Cài đặt › Tên website: bắt buộc');
    if (st.seo && st.seo.canonical && !/^https:\/\/[^\s]+$/.test(st.seo.canonical)) errs.push('SEO › Canonical URL phải bắt đầu bằng https://');
    return errs;
  }

  root.RTRender = {TYPES, render, validate, esc, safeUrl, safeSrc, paras};
})(typeof window !== 'undefined' ? window : globalThis);

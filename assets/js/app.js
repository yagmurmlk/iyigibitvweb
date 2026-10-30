/* İyi Gibi TV — site uygulaması.
   Veri: assets/js/data.js (scripts/build_data.py), harita: assets/js/map.js (scripts/build_map.py).
   Sayfalar hash ile açılır: #anasayfa, #videolar, #kesifler, #radyoloji, #hakkimizda, #isbirligi */
(function () {
  "use strict";

  // ---- Ayarlar ----
  const CONFIG = {
    email: "",                 // İş birliği e-postası. Boşsa form Instagram'a yönlendirir.
    instagram: "iyigibitv",
    youtube: "https://www.youtube.com/@iyigibitv",
  };

  const D = window.IGTV_DATA;
  const MAP = window.IGTV_MAP;
  const THUMB_BASE = window.IGTV_THUMB_BASE || "";   // önizlemede yerel kapaklar
  const V = D.videos;                                   // en yeniden en eskiye
  const byId = Object.fromEntries(V.map((v) => [v.id, v]));
  const app = document.getElementById("app");

  const ROUTES = [
    ["anasayfa", "Ana Sayfa"],
    ["videolar", "Videolar"],
    ["kesifler", "Keşifler"],
    ["radyoloji", "Radyoloji & MR"],
    ["hakkimizda", "Hakkımızda"],
    ["isbirligi", "İş Birliği"],
  ];
  const TOPICS = { gezi: "Gezi", mutfak: "Mutfak", radyoloji: "Radyoloji & MR", unutmadik: "Unutmadık", gunluk: "Günlük anlar" };

  // ---- Biçimlendirme ----
  const nf = new Intl.NumberFormat("tr-TR");
  const num = (n) => nf.format(n);
  function compact(n) {
    if (n >= 1e6) return (n / 1e6).toLocaleString("tr-TR", { maximumFractionDigits: 2 }) + " milyon";
    if (n >= 1e4) return Math.round(n / 1e3).toLocaleString("tr-TR") + " bin";
    if (n >= 1e3) return (n / 1e3).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + " bin";
    return num(n);
  }
  function dur(s) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = String(s % 60).padStart(2, "0");
    return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
  }
  const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  function date(iso) { const [y, m, d] = iso.split("-").map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function cleanTitle(t) {
    const c = t.replace(/#[^\s#]+/g, "").replace(/\s{2,}/g, " ").replace(/[\s|\-–]+$/, "").trim();
    return c || t.replace(/#/g, "").split(" ").slice(0, 4).join(" ");
  }
  const watchUrl = (v) => (v.short ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`);
  const placeOf = (id) => D.places.find((p) => p.id === id);
  const meta = (v) => `${date(v.date)}, ${compact(v.views)} izlenme`;
  function where(v) { const p = placeOf(v.place); return p ? `${p.name}, ${p.countryName}` : TOPICS[v.topic]; }

  function src(v, kind) {
    if (THUMB_BASE) return THUMB_BASE + v.id + ".jpg";
    const q = kind === "big" ? "maxresdefault" : v.short ? "hqdefault" : "mqdefault";
    return `https://i.ytimg.com/vi/${v.id}/${q}.jpg`;
  }
  const fb = (v, kind) => (kind === "big" && !THUMB_BASE ? ` data-fallback="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg"` : "");

  // ---- Türetilmiş veriler ----
  const longs = V.filter((v) => !v.short);
  const shorts = V.filter((v) => v.short);
  const byViews = (a, b) => b.views - a.views;
  const placesUsed = D.places.map((p) => {
    const vids = V.filter((v) => v.place === p.id);
    const dates = vids.map((v) => v.date).sort();
    return { ...p, vids, count: vids.length, views: vids.reduce((s, v) => s + v.views, 0), first: dates[0], last: dates[dates.length - 1] };
  }).filter((p) => p.count > 0);
  const countries = [...new Set(placesUsed.map((p) => p.country))];
  const longAvg = Math.round(longs.reduce((s, v) => s + v.views, 0) / longs.length);
  const totalLikes = V.reduce((s, v) => s + v.likes, 0);
  const totalComments = V.reduce((s, v) => s + v.comments, 0);
  const chrono = [...V].reverse();                       // kanal numarası: ilk video = 1
  const channelNo = (id) => chrono.findIndex((v) => v.id === id) + 1;

  // ---- İkonlar ----
  const I = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    yt: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.7 15.1V8.9l5.8 3.1-5.8 3.1Z"/></svg>',
    dice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.3" fill="currentColor"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  };

  // ---- Bileşenler ----
  function thumb(v, { kind = "card", pin = false } = {}) {
    const p = placeOf(v.place);
    return `<div class="thumb">
      <span class="fallback">${esc(cleanTitle(v.title))}</span>
      <img class="yt" loading="lazy" alt="" src="${src(v, kind)}"${fb(v, kind)}>
      ${pin && p ? `<span class="pin">${esc(p.name)}</span>` : ""}
      <span class="dur">${v.short ? "Shorts" : dur(v.sec)}</span>
    </div>`;
  }
  function card(v, opts = {}) {
    return `<button class="card" data-play="${v.id}">
      ${thumb(v, opts)}
      <span class="card-title">${esc(cleanTitle(v.title))}</span>
      <span class="card-meta">${meta(v)}</span>
    </button>`;
  }

  // ---- Kişiler ----
  const PEOPLE = [
    {
      id: "huseyin", name: "Hüseyin Çıtak", short: "Hüseyin", initials: "HÇ", photo: "assets/img/huseyin.jpg", tilt: "-3deg",
      role: "Yol arkadaşı, rota bulucu",
      text: [
        "Merhaba, ben Hüseyin. 36 yaşındayım. Videolardan da anlaşılacağı üzere gezmeyi çok seviyorum. Yeni şeyler keşfetmek benim için bir hobiden fazlası, hayat amacım gibi bir şey.",
        "Hatta şöyle söyleyeyim: bence hayat, keşfetmenin başka bir yolu. Bir pazarda fiyat sormak, köy yolunda mola verip dut toplamak, hiç tanımadığım biriyle sohbete dalmak... Her biri bana yeni bir şey öğretiyor.",
        "Kamerayı da bu yüzden açıyorum. Gördüğümü sizinle paylaşınca keşif tamamlanmış oluyor.",
      ],
      skills: ["Rota planlama", "Yol hikâyeleri", "Sohbet ve röportaj", "Kamp"],
    },
    {
      id: "melike", name: "Melike Yağmur", short: "Melike", initials: "MY", photo: "assets/img/melike.jpg", tilt: "2.5deg",
      role: "Radyoloji teknikeri, sofra kâşifi",
      text: [
        "Merhaba, ben Melike. Kanalın ilk videoları benim kıvırcık saçlarımla ve radyoloji hakkında bize sorduğunuz sorularla başladı. Mesleğim radyoloji teknikerliği; yıllarca MR ve açık MR çekimi yaptım, bir dönem de mesleğimi Azerbaycan'da sürdürdüm.",
        "Hüseyin yeni bir rota bulduğunda ben de o rotada oturulacak en güzel sofrayı ararım. Mutfakta denemeler yapmayı, hayvanlarla vakit geçirmeyi ve hayatın küçük komik anlarını kaydetmeyi seviyorum.",
        "MR hakkında merak edilenleri anlatmak da benim için ayrı bir keyif. Doğru bilgi, insanın içini rahatlatıyor.",
      ],
      skills: ["MR ve açık MR", "Bilim anlatımı", "Seslendirme", "Mutfak denemeleri"],
    },
  ];
  // ---- Harita ----
  function px(lon, lat) { return [(lon - MAP.lon0) * MAP.cos * MAP.k, (MAP.latTop - lat) * MAP.k]; }
  const LABEL = { baku: "t", qobustan: "b", lenkeran: "l", seki: "t", goygol: "l", tiflis: "t", ayvalik: "r", ankara: "t", sakarya: "l", duzce: "r", kayseri: "r", deprem: "r" };
  let mapSel = "baku";
  function mapSvg() {
    const r = (p) => 5 + Math.sqrt(p.count) * 1.8;
    const route = [...placesUsed].sort((a, b) => a.first.localeCompare(b.first)).map((p) => px(p.lon, p.lat));
    let d = `M${route[0][0].toFixed(1)},${route[0][1].toFixed(1)}`;
    for (let i = 1; i < route.length; i++) {
      const [x0, y0] = route[i - 1], [x1, y1] = route[i];
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 - Math.abs(x1 - x0) * 0.18 - 10;
      d += ` Q${mx.toFixed(1)},${my.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
    }
    const label = (t, lon, lat, cls, anchor = "middle") => { const [x, y] = px(lon, lat); return `<text class="${cls}" x="${x.toFixed(0)}" y="${y.toFixed(0)}" text-anchor="${anchor}">${t}</text>`; };
    const pins = [...placesUsed].sort((a, b) => b.count - a.count).map((p) => {
      const [x, y] = px(p.lon, p.lat), rr = r(p), pos = LABEL[p.id] || "r";
      const lx = pos === "r" ? x + rr + 5 : pos === "l" ? x - rr - 5 : x;
      const ly = pos === "t" ? y - rr - 6 : pos === "b" ? y + rr + 15 : y + 4;
      const anchor = pos === "r" ? "start" : pos === "l" ? "end" : "middle";
      return `<g class="map-pin" role="button" tabindex="0" data-pin="${p.id}" data-c="${p.country}" aria-pressed="${p.id === mapSel}" aria-label="${esc(p.name)}, ${p.count} video">
        <circle class="ring" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rr + 5).toFixed(1)}"/>
        <circle class="dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(1)}"/>
        <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}">${esc(p.name.replace(" & çevresi", "").replace(" & kamp rotaları", ""))}</text>
      </g>`;
    }).join("");
    return `<svg class="map-svg" viewBox="0 0 ${MAP.w} ${MAP.h}" role="group" aria-label="Gittiğimiz yerlerin haritası">
      ${MAP.countries.map((c) => `<path class="land${c.code ? " visited" : ""}" d="${c.d}"/>`).join("")}
      ${label("Karadeniz", 34.5, 42.5, "sea-label")}${label("Hazar Denizi", 50.6, 42.6, "sea-label", "end")}${label("Akdeniz", 31, 36.1, "sea-label")}
      ${label("Türkiye", 30.4, 38.1, "country-label")}${label("Azerbaycan", 46.6, 39.3, "country-label")}${label("Gürcistan", 43.6, 42.45, "country-label")}
      <path class="route" d="${d}"/>
      ${pins}
    </svg>`;
  }
  function mapPanel() {
    const p = placesUsed.find((x) => x.id === mapSel);
    const vids = [...p.vids].sort((a, b) => (a.short - b.short) || b.views - a.views);
    return `<div class="map-panel-head"><h3>${esc(p.name)}</h3><span>${esc(p.countryName)}, ${p.count} video, ${compact(p.views)} izlenme</span>
        <a class="more" href="#videolar" data-place="${p.id}" style="margin-left:auto">Buradaki tüm videolar</a></div>
      <div class="strip">${vids.slice(0, 10).map((v) => card(v)).join("")}</div>`;
  }
  function mapBlock() {
    return `<div class="map-card">
      <div class="map-scroll">${mapSvg()}</div>
      <p class="map-hint">kesik çizgi, bu yerlere gidiş sıramız</p>
      <div class="map-panel" id="map-panel" aria-live="polite">${mapPanel()}</div>
    </div>`;
  }
  function selectPin(id) {
    mapSel = id;
    document.querySelectorAll("[data-pin]").forEach((g) => g.setAttribute("aria-pressed", String(g.dataset.pin === id)));
    const panel = document.getElementById("map-panel");
    if (panel) panel.innerHTML = mapPanel();
  }

  // ---- Rota çizgisi: ana sayfada durakları birbirine bağlar, kaydırdıkça çizilir ----
  let routeCleanup = null;
  function drawRoute() {
    if (routeCleanup) { routeCleanup(); routeCleanup = null; }
    const j = document.querySelector(".journey");
    if (!j) return;
    const svg = j.querySelector(".route-svg");
    const main = svg.querySelector(".main"), ghost = svg.querySelector(".ghost");
    let len = 0;
    const layout = () => {
      const jr = j.getBoundingClientRect();
      const pts = [...j.querySelectorAll(".stop-dot")].map((d) => { const r = d.getBoundingClientRect(); return [r.left - jr.left + r.width / 2, r.top - jr.top + r.height / 2]; });
      if (pts.length < 2) return;
      svg.setAttribute("viewBox", `0 0 ${jr.width} ${jr.height}`);
      let d = `M${pts[0][0]},${pts[0][1] - 60} L${pts[0][0]},${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], s = i % 2 ? 1 : -1, w = Math.min(26, x0 - 4);
        d += ` C${x0 + s * w},${y0 + (y1 - y0) * 0.35} ${x1 - s * w},${y0 + (y1 - y0) * 0.65} ${x1},${y1}`;
      }
      main.setAttribute("d", d); ghost.setAttribute("d", d);
      len = main.getTotalLength();
      main.style.strokeDasharray = `${len} ${len}`;
      progress();
    };
    const progress = () => {
      if (!len) return;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const r = j.getBoundingClientRect();
      const f = reduce ? 1 : Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / r.height));
      main.style.strokeDashoffset = String(len * (1 - f));
    };
    const ro = new ResizeObserver(layout);
    ro.observe(j);
    addEventListener("scroll", progress, { passive: true });
    layout();
    routeCleanup = () => { ro.disconnect(); removeEventListener("scroll", progress); };
  }

  // ---- Sayfalar ----
  const stopHead = (note, title, text) => `<div class="stop-head"><span class="stop-dot" aria-hidden="true"></span><span class="note">${note}</span><h2>${title}</h2>${text ? `<p class="lead">${text}</p>` : ""}</div>`;

  function pageHome() {
    const latest = longs[0];
    const top = [...longs].sort(byViews).slice(0, 6);
    const topShorts = [...shorts].sort(byViews).slice(0, 12);
    const route = [...placesUsed].sort((a, b) => a.first.localeCompare(b.first));
    const short = (n) => n.replace(" & çevresi", "").replace(" & kamp rotaları", "").replace(" & Cunda", "").replace(" & Hatay", "").replace(" → Antalya", "");
    const why = (id, tilt, h, t) => `<article><h3>${h}</h3><p>${t}</p>
      <button class="peek" style="--tilt:${tilt}" data-play="${id}" aria-label="Örnek video: ${esc(cleanTitle(byId[id].title))}"><img loading="lazy" alt="" src="${src(byId[id])}"></button></article>`;
    return `
    <section class="hero wrap">
      <div class="hero-grid">
        <div class="hero-copy">
          <h1>Gittiğimiz yerlerden getirdiğimiz hikâyeler.</h1>
          <p class="lead">Biz Hüseyin ve Melike. Bakü'nün pazarlarından Anadolu'nun köylerine kadar gittiğimiz her yeri birlikte keşfediyor, kameramızla size getiriyoruz.</p>
          <div class="hero-actions">
            <a class="btn btn-route" href="#videolar">${I.play.replace("<svg", '<svg fill="currentColor"')}Yolculuklara başla</a>
            <a class="btn btn-line" href="${CONFIG.youtube}?sub_confirmation=1" target="_blank" rel="noopener">${I.yt}Abone ol</a>
          </div>
        </div>
        <figure class="hero-photo">
          <div class="frame"><img src="assets/img/birlikte-baku.jpg" alt="Hüseyin ve Melike Bakü'de el ele yürüyor"></div>
          <figcaption class="note">Bakü, 2024</figcaption>
          <button class="latest" data-play="${latest.id}"><img alt="" src="${src(latest)}"><span><small>Yeni video</small><b>${esc(cleanTitle(latest.title))}</b></span></button>
        </figure>
      </div>
      <p class="places-line" aria-label="Gittiğimiz yerler, sırasıyla">${route.map((p, i) => `<span${i === route.length - 1 ? ' class="now"' : ""}>${esc(short(p.name))}</span>`).join("")}</p>
    </section>

    <div class="journey">
      <svg class="route-svg" aria-hidden="true"><path class="ghost"/><path class="main"/></svg>

      <section class="stop wrap">
        ${stopHead("en son buradaydık", "Son yolculuk")}
        <div class="feature">
          ${card(latest, { kind: "big" }).replace('<span class="card-title">', '<span class="card-title" hidden>').replace('<span class="card-meta">', '<span class="card-meta" hidden>')}
          <div class="feature-text">
            <h3>${esc(cleanTitle(latest.title))}</h3>
            <p>${esc(latest.desc)}</p>
            <span class="feature-meta">${esc(where(latest))}. ${meta(latest)}, ${dur(latest.sec)}</span>
            <button class="btn btn-ink" data-play="${latest.id}" style="justify-self:start">${I.play.replace("<svg", '<svg fill="currentColor"')}Videoyu izle</button>
          </div>
        </div>
      </section>

      <section class="stop wrap">
        <div class="stop-row">${stopHead("hangisi sizi çağırıyor?", "Haritada iyi gibi", `${countries.length} ülke, ${placesUsed.length} durak. Bir noktaya dokunun, o yolculuğun videoları açılsın.`)}<a class="more" href="#kesifler">Bütün yolculuklar</a></div>
        ${mapBlock()}
      </section>

      <section class="stop wrap">
        <div class="stop-row">${stopHead("en çok bunları sevdiniz", "En çok izlenenler", "Çoğu, bir ülkeyi pazar tezgâhından tanımaya çalıştığımız günler.")}<a class="more" href="#videolar" data-sort="views">Hepsini sırala</a></div>
        <ol class="ranked" style="margin:0;padding:8px 4px 18px">${top.map((v, i) => `<li><span class="rank" aria-hidden="true">${i + 1}</span>${card(v)}</li>`).join("")}</ol>
      </section>

      <section class="stop wrap">
        ${stopHead("bizim üç kuralımız", "Neden birlikte keşfediyoruz?")}
        <div class="why">
          ${why("mV9hZFSvZtc", "3deg", "Yerinde görmek", "Bir ülkenin hayat pahalılığını haberlerden değil, pazar tezgâhından öğreniyoruz. Fiyatı soruyor, ürünü elimize alıyor, satıcıyla sohbet ediyoruz.")}
          ${why("PRAJ84uGhDU", "-3deg", "Merakla sormak", "Yolda aklımıza takılan soruları saklamıyoruz. Cevabı birlikte arıyoruz; bazen bir müzede, bazen bir bilgi yarışmasında, bazen gece yürüyüşünde.")}
          ${why("Wvp6fkVAUwQ", "2deg", "Sofrada buluşmak", "Bir yolculuğun en güzel anı çoğu zaman plansız olanıdır: bir bazlama, bir tereyağı ve hiç tanımadığımız amcalarla edilen bir sohbet.")}
        </div>
      </section>

      <section class="stop wrap">
        <div class="stop-row">${stopHead("yoldan kalanlar", "Bir dakikadan kısa")}<a class="more" href="#videolar" data-format="short">Tüm kısa videolar</a></div>
        <div class="strip">${topShorts.map((v) => card(v)).join("")}</div>
      </section>

      <section class="stop wrap">
        ${stopHead("kameranın arkası", "İki kişi, tek rota")}
        <div class="us">
          <div class="us-photos">
            <figure class="a" data-play="yuQKZdQADeE"><img loading="lazy" src="assets/img/birlikte-kar.jpg" alt="Hüseyin ve Melike karda, kardan adamın yanında"><figcaption>Bakü'ye kar yağdı</figcaption></figure>
            <figure class="b" data-play="Wvp6fkVAUwQ"><img loading="lazy" src="assets/img/birlikte-kizilcahamam.jpg" alt="Hüseyin ve Melike Kızılcahamam'da"><figcaption>Kızılcahamam, 2026</figcaption></figure>
          </div>
          <div class="us-text">
            <p class="lead" style="font-size:var(--t-md)">Hüseyin rotayı bulur, Melike o rotadaki en güzel sofrayı. Biri gezmeden duramaz, diğeri MR cihazlarını herkesin anlayacağı dille anlatır. Kanalı da, yolu da birlikte büyütüyoruz.</p>
            <a class="btn btn-line" href="#hakkimizda" style="justify-self:start">Hikâyemizi okuyun</a>
          </div>
        </div>
      </section>

      <section class="stop wrap">
        <div class="band">
          <div style="display:grid;gap:18px;min-width:0">
            <span class="stop-dot" aria-hidden="true" style="position:absolute;opacity:0"></span>
            <span class="note">markalar için</span>
            <h2>Markanızı birlikte keşfedelim</h2>
            <p class="lead">Bir mekânı, ürünü ya da etkinliği izleyicimize kendi gözümüzden anlatıyoruz. Reklam gibi değil, yol arkadaşının tavsiyesi gibi.</p>
            <a class="btn btn-route" href="#isbirligi">İş birliği için yazın</a>
          </div>
          <ul class="band-nums">
            <li><b>${num(D.channel.subscribers)}</b><span>abone</span></li>
            <li><b>${compact(D.channel.views).replace(" milyon", " Mn")}</b><span>toplam izlenme</span></li>
            <li><b>${compact([...longs].sort(byViews)[0].views)}</b><span>en çok izlenen videomuz</span></li>
          </ul>
        </div>
      </section>
    </div>`;
  }
  function bindHome() { bindMap(); drawRoute(); }
  function bindMap() {
    app.querySelectorAll("[data-pin]").forEach((g) => {
      g.addEventListener("click", () => selectPin(g.dataset.pin));
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectPin(g.dataset.pin); } });
    });
  }

  // Videolar sayfası durumu
  const vstate = { q: "", topic: "all", format: "all", sort: "new", place: null, playlist: null, limit: 24 };
  function titleCase(s) { return s.toLocaleLowerCase("tr-TR").replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toLocaleUpperCase("tr-TR")); }

  function pageVideos() {
    const counts = Object.fromEntries(Object.keys(TOPICS).map((t) => [t, V.filter((v) => v.topic === t).length]));
    const lists = D.playlists.filter((p) => p.videoIds.length && byId[p.videoIds[0]]);
    return `
    <section class="wrap page-head">
      <h1>${V.length} video, bir sürü yol</h1>
      <p class="lead">Gezi, mutfak, radyoloji ve hayatın küçük anları. Aradığınız yeri yazın ya da bir seriden başlayın.</p>
    </section>
    <section class="wrap">
      <div class="series">
        ${lists.map((p) => `<button class="serie" data-playlist="${p.id}" aria-pressed="${vstate.playlist === p.id}">${thumb(byId[p.videoIds[0]])}<span><b>${esc(titleCase(p.title))}</b><span>${p.videoIds.length} video</span></span></button>`).join("")}
      </div>
      <div class="toolbar">
        <div class="toolbar-row">
          <label class="search">${I.search}<input id="v-search" type="search" placeholder="Bakü, MR, kamp, tarif..." value="${esc(vstate.q)}" aria-label="Video ara"></label>
          <select class="chip-btn" id="v-format" aria-label="Video türü"><option value="all">Tüm videolar</option><option value="long">Uzun videolar</option><option value="short">Shorts</option></select>
          <select class="chip-btn" id="v-sort" aria-label="Sıralama"><option value="new">En yeni</option><option value="views">En çok izlenen</option><option value="old">En eski</option></select>
        </div>
        <div class="toolbar-row" role="group" aria-label="Konu">
          <button class="chip-btn" data-topic="all" aria-pressed="${vstate.topic === "all"}">Tümü <span>${V.length}</span></button>
          ${Object.entries(TOPICS).map(([k, l]) => `<button class="chip-btn" data-topic="${k}" aria-pressed="${vstate.topic === k}">${l} <span>${counts[k]}</span></button>`).join("")}
          <span class="result-count" id="v-count"></span>
        </div>
      </div>
      <div id="v-active"></div>
      <div class="grid" id="v-grid"></div>
      <div style="display:flex;justify-content:center;margin-top:36px"><button class="btn btn-line" id="v-more">Daha fazla göster</button></div>
    </section>`;
  }
  function filterVideos() {
    const q = vstate.q.trim().toLocaleLowerCase("tr-TR");
    const pl = vstate.playlist && D.playlists.find((p) => p.id === vstate.playlist);
    const list = V.filter((v) => {
      if (vstate.topic !== "all" && v.topic !== vstate.topic) return false;
      if (vstate.format === "long" && v.short) return false;
      if (vstate.format === "short" && !v.short) return false;
      if (vstate.place && v.place !== vstate.place) return false;
      if (pl && !pl.videoIds.includes(v.id)) return false;
      if (q) {
        const p = placeOf(v.place);
        const hay = (v.title + " " + v.desc + " " + (p ? p.name + " " + p.countryName : "")).toLocaleLowerCase("tr-TR");
        if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    if (vstate.sort === "views") list.sort(byViews);
    else if (vstate.sort === "old") list.sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }
  function renderVideoGrid() {
    const grid = document.getElementById("v-grid");
    if (!grid) return;
    const list = filterVideos();
    grid.innerHTML = list.length ? list.slice(0, vstate.limit).map((v) => card(v, { pin: true })).join("")
      : `<p class="empty">Bu aramaya uyan video yok. Başka bir kelime deneyin ya da filtreleri kaldırın.</p>`;
    document.getElementById("v-count").textContent = `${list.length} video`;
    document.getElementById("v-more").hidden = list.length <= vstate.limit;
    const act = [];
    if (vstate.place) act.push(placeOf(vstate.place).name);
    if (vstate.playlist) act.push(titleCase(D.playlists.find((p) => p.id === vstate.playlist).title));
    document.getElementById("v-active").innerHTML = act.length
      ? `<div class="active-filters">${act.map((a) => `<span class="tag">${esc(a)}</span>`).join("")}<button class="chip-btn" id="v-clear">Filtreyi kaldır</button></div>` : "";
    document.querySelectorAll("[data-playlist]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.playlist === vstate.playlist)));
    document.querySelectorAll("[data-topic]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.topic === vstate.topic)));
  }
  function bindVideos() {
    document.getElementById("v-format").value = vstate.format;
    document.getElementById("v-sort").value = vstate.sort;
    document.getElementById("v-search").addEventListener("input", (e) => { vstate.q = e.target.value; vstate.limit = 24; renderVideoGrid(); });
    document.getElementById("v-format").addEventListener("change", (e) => { vstate.format = e.target.value; vstate.limit = 24; renderVideoGrid(); });
    document.getElementById("v-sort").addEventListener("change", (e) => { vstate.sort = e.target.value; renderVideoGrid(); });
    document.getElementById("v-more").addEventListener("click", () => { vstate.limit += 24; renderVideoGrid(); });
    renderVideoGrid();
  }
  function videosClick(e) {
    if (!document.getElementById("v-grid")) return;
    const t = e.target.closest("[data-topic],[data-playlist],#v-clear");
    if (!t) return;
    if (t.id === "v-clear") { vstate.place = null; vstate.playlist = null; }
    else if (t.dataset.topic) vstate.topic = t.dataset.topic;
    else if (t.dataset.playlist) vstate.playlist = vstate.playlist === t.dataset.playlist ? null : t.dataset.playlist;
    vstate.limit = 24;
    renderVideoGrid();
  }
  app.addEventListener("click", videosClick);

  const FLAG = { AZ: "var(--sky)", TR: "var(--tomato)", GE: "#e0a400" };
  function pagePlaces() {
    const groups = ["AZ", "TR", "GE"].map((c) => ({ c, places: placesUsed.filter((p) => p.country === c).sort((a, b) => b.count - a.count) })).filter((g) => g.places.length);
    return `
    <section class="wrap page-head">
      <h1>Nereye gidelim?</h1>
      <p class="lead">${countries.length} ülkede ${placesUsed.length} yer gezdik. Haritada bir noktaya dokunun ya da aşağıda ülke ülke dolaşın.</p>
    </section>
    <section class="wrap">${mapBlock()}</section>
    <section class="wrap">
      ${groups.map((g) => `
        <div class="country">
          <div class="country-head"><span class="flag" style="background:${FLAG[g.c]}"></span><h2>${esc(g.places[0].countryName)}</h2>
            <span>${g.places.reduce((s, p) => s + p.count, 0)} video, ${compact(g.places.reduce((s, p) => s + p.views, 0))} izlenme</span></div>
          ${g.places.map((p) => {
            const vids = [...p.vids].sort((a, b) => (a.short - b.short) || b.views - a.views);
            return `<div class="place" id="yer-${p.id}">
              <div class="place-head"><h3>${esc(p.name)}</h3><span>${p.count} video, ilk ziyaret ${date(p.first)}</span>
                ${vids.length > 8 ? `<a class="more" href="#videolar" data-place="${p.id}" style="margin-left:auto">${vids.length} videonun hepsi</a>` : ""}</div>
              <div class="grid">${vids.slice(0, 8).map((v) => card(v)).join("")}</div>
            </div>`;
          }).join("")}
        </div>`).join("")}
    </section>`;
  }

  const RADIO = [
    ["Açık MR", "Kapalı alan korkusu olanlar için açık MR nasıl bir cihaz, çekime nasıl gelinir?", ["TqRXEbNQe_M", "Z4T0NWuKwsY", "x-k9W2TiMFA"]],
    ["MR'ı anlamak", "MR vücudumuza ne yapıyor, güvenli mi, nelere dikkat etmeli?", ["_mpbUlQtyHU", "vmb9iwSnLYA", "ZThtfvSnWWk"]],
    ["Bilim tarihi", "MR'ı kim buldu? Tomografinin The Beatles ile ne ilgisi var?", ["US8TaXJ8ZLU", "rQrRP72A874"]],
    ["Meslek", "Radyoloji teknikerliği üzerine sorularınız ve yurt dışında çalışmak.", ["j5cqbBKCzJg", "mBT6HYNxPh8"]],
  ];
  function pageRadiology() {
    const rv = V.filter((v) => v.topic === "radyoloji");
    const hero = byId.mBT6HYNxPh8;
    return `
    <section class="wrap page-head">
      <div class="split">
        <div style="display:grid;gap:18px;min-width:0">
          <h1>Kameranın arkasında bir de önlük var</h1>
          <p class="lead">Melike yıllardır radyoloji teknikeri. MR'ı, açık MR'ı ve MR güvenliğini en çok sorulan sorular üzerinden, herkesin anlayacağı bir dille anlatıyoruz. Bu konuda ${rv.length} video, ${compact(rv.reduce((s, v) => s + v.views, 0))} izlenme.</p>
        </div>
        ${card(hero, { kind: "big" })}
      </div>
    </section>
    <section class="wrap">
      ${RADIO.map(([t, d, ids]) => `
        <div class="topic">
          <div><h2>${t}</h2><p>${d}</p></div>
          <div class="grid">${ids.filter((id) => byId[id] && id !== hero.id).map((id) => card(byId[id])).join("")}</div>
        </div>`).join("")}
      <p class="disclaimer">Bu videolar genel bilgilendirme amaçlıdır. Tanı, tedavi ve size özel durumlar için doktorunuza danışın.</p>
    </section>`;
  }

  const STORY = [
    ["Şubat 2013", "Kanal açıldı. İsmi o gün koyduk: güzel değil belki, ama iyi gibi."],
    ["Ağustos 2017", "İlk video: makarna süzgeciyle kıvırcık saç kurutma. 54 bin kişi izledi, biz hâlâ şaşırıyoruz."],
    ["Ağustos 2018", "Radyoloji hakkında sorularınızı cevapladık. Bugün bile en çok izlenen videolarımızdan biri."],
    ["Kasım 2022", "Ayvalık ve Cunda'da sobalı ev, karavan hayatı, gün batımları. Kısa videolarla yeniden başladık."],
    ["Mart 2023", "Kahramanmaraş Pazarcık ve Hatay. Deprem bölgesinde gördüklerimizi unutmamak için kaydettik."],
    ["Eylül 2023", "Azerbaycan dönemi başladı: Bakü'nün pazarları, Qobustan, Lənkəran, Şəki ve kamp serisi."],
    ["Aralık 2023", "Azerbaycan'da Hayat Pahalı Mı? videomuz 234 bin izlenmeyle kanalın en çok izlenen videosu oldu."],
    ["Ocak 2026", "Ankara'ya döndük. Daha gerçek, daha sakin, daha biz videolarla yeniden buradayız."],
    ["2026", "Beypazarı, Hendek'te bir köy, Kayseri'den Antalya'ya bir yol. Türkiye rotaları yeni başlıyor."],
  ];
  // İki kişi, tek hikâye: her satırda ikimiz yan yana
  const DUET = [
    ["yolda", "Rotayı o bulur. Haritayı açar, köy yollarına sapar, karşısına çıkan herkesle sohbete dalar.", "Sofrayı o bulur. Hangi pazarda ne yenir, hangi tezgâhta ne pişer, ilk o fark eder."],
    ["kanala kattığı", "Yolun hikâyesini: Kayseri'den Antalya'ya, Bakü'den Göygöl'e uzanan yolculukları.", "Kanalın ilk videolarını ve radyoloji köşesini. MR'ı herkesin anlayacağı dille anlatan o."],
    ["sözü", "<q>Hayat, keşfetmenin başka bir yolu.</q>", "<q>Buklelerinizi özgür bırakın!</q>"],
  ];
  const ALBUM = [
    ["p1", "assets/img/birlikte-kar.jpg", "Bakü'ye kar yağdı, Ocak 2024", "yuQKZdQADeE", "Hüseyin ve Melike karda"],
    ["p2", "assets/img/birlikte-baku.jpg", "Bakü'de turist gibi, Nisan 2024", "QNPH1XS7bCM", "Hüseyin ve Melike Bakü'de yürüyor"],
    ["p3", "assets/img/birlikte-kizilcahamam.jpg", "Kızılcahamam, Ocak 2026", "Wvp6fkVAUwQ", "Hüseyin ve Melike Kızılcahamam'da"],
    ["p4", "assets/img/birlikte-nevruz.jpg", "Bakü'de Nevruz, Mart 2024", "8BHEpNX4omo", "Hüseyin ve Melike Nevruz kutlamasında"],
  ];
  const SKILLS = ["Rota planlama", "Yerinde röportaj", "Çekim ve anlatım", "MR ve sağlık anlatımı", "Seslendirme", "Mutfak denemeleri", "Kamp", "Türkçe, Azerbaycan Türkçesi ve Rusça içerik"];

  function pageAbout() {
    const [H, M] = PEOPLE;
    return `
    <section class="wrap about-hero">
      <div class="copy">
        <span class="note">biz</span>
        <h1>Biri rotayı bulur, diğeri sofrayı.</h1>
        <p class="lead">Biz Hüseyin ve Melike. İyi Gibi TV'yi birlikte büyütüyoruz. Bakü'nün pazarlarından Anadolu'nun köylerine kadar gittiğimiz her yeri birlikte keşfediyor, birlikte anlatıyoruz. Bize göre bir yeri gerçekten tanımanın yolu, onu iki kişi yaşamak ve sizinle paylaşmak.</p>
      </div>
      <figure>
        <div class="frame"><img src="assets/img/birlikte-baku.jpg" alt="Hüseyin ve Melike Bakü'de el ele yürüyor"></div>
        <figcaption class="note">el ele, Bakü</figcaption>
      </figure>
    </section>

    <section class="wrap">
      <div class="duet">
        <div class="who h"><span><b>${esc(H.name)}</b><span>36 yaşında, yol arkadaşı</span></span><img src="${H.photo}" alt="${esc(H.name)}" data-hide-on-error></div>
        <div class="knot" aria-hidden="true"><span></span></div>
        <div class="who m"><img src="${M.photo}" alt="${esc(M.name)}" data-hide-on-error><span><b>${esc(M.name)}</b><span>Radyoloji teknikeri</span></span></div>
        ${DUET.map(([label, h, m]) => `
          <div class="row-label"><span>${label}</span></div>
          <div class="cell h"><p>${h}</p></div><div></div><div class="cell m"><p>${m}</p></div>`).join("")}
        <div class="together"><p>İkimiz birlikte: güzel değil belki, ama iyi gibi.</p></div>
      </div>
    </section>

    <section class="wrap section">
      <div class="section-head"><div><span class="note">birlikte biriktirdiklerimiz</span><h2>Yoldan birkaç kare</h2><p>Fotoğrafa dokunun, o günün videosu açılsın.</p></div></div>
      <div class="album">${ALBUM.map(([c, img, cap, id, alt]) => `<figure class="${c}" data-play="${id}" role="button" tabindex="0" aria-label="${esc(cap)} videosunu oynat"><img loading="lazy" src="${img}" alt="${esc(alt)}"><figcaption>${esc(cap)}</figcaption></figure>`).join("")}</div>
    </section>

    <section class="wrap section">
      <div class="duo">
        <div class="section-head" style="margin:0"><div><span class="note">ortak çantamız</span><h2>Birlikte neler yapıyoruz</h2><p>Bir videonun arkasında ikimizin de yetenekleri var. Bunları markalar ve projeler için de kullanıyoruz.</p></div></div>
        <ul class="skills">${SKILLS.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
      </div>
    </section>

    <section class="wrap section">
      <div class="section-head"><div><span class="note">2013'ten bugüne</span><h2>Hikâyemiz</h2></div></div>
      <ol class="timeline">${STORY.map(([d, t]) => `<li><b>${d}</b><p>${esc(t)}</p></li>`).join("")}</ol>
    </section>

    <section class="wrap section">
      <div class="band">
        <div style="display:grid;gap:16px;min-width:0"><span class="note">sıradaki durak</span><h2>Bir sonraki yeri birlikte seçelim</h2><p class="lead">Gitmemizi istediğiniz bir yer ya da birlikte anlatmak istediğiniz bir hikâye varsa yazın.</p></div>
        <div style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn-route" href="#isbirligi">Bize yazın</a><a class="btn btn-line" style="color:inherit" href="https://instagram.com/${CONFIG.instagram}" target="_blank" rel="noopener">Instagram'da takip edin</a></div>
      </div>
    </section>`;
  }

  const OFFERS = [
    ["Mekân ve şehir tanıtımı", "Bir şehri, otelinizi, restoranınızı ya da alışveriş merkezinizi gezerek, yaşayarak anlatıyoruz.", ["zQqYVhczytI", "noCjfivVk_4", "ikP1eUaUwYo"]],
    ["Etkinlik ve festival", "Fuar, maraton, bayram ve şehir etkinliklerini izleyicinin oradaymış gibi hissettiği vloglara dönüştürüyoruz.", ["uco80SPFpIc", "ibvpqVA1orY", "Snq_LjE2xpM"]],
    ["Ürün deneyimi", "Ürününüzü günlük hayatımızda kullanıyor, beğendiğimizi ve beğenmediğimizi açıkça söylüyoruz.", ["sPFEiB9KpBo", "QaKc06kt6Aw", "82yYXFIBT38"]],
    ["Sağlık ve bilim", "Radyoloji uzmanlığımızla tıbbi görüntüleme konularını doğru ve sade bir dille anlatıyoruz.", ["Z4T0NWuKwsY", "mBT6HYNxPh8", "US8TaXJ8ZLU"]],
  ];
  const FEATURED_PLACES = ["Port Baku Mall", "Bakü Crescent Mall", "Baku Auto Mall", "Şeki Qala Restoran", "Tarık Usta", "Azerbaijan Honey Expo 2024", "Bakü Maratonu 2024", "Cars & Coffee Azerbaijan", "Sederek Ticaret Merkezi", "Mir Teymur Mammadov Müzesi", "Beliga Parfüm", "Binef At Çiftliği"];

  function pageCollab() {
    return `
    <section class="wrap page-head">
      <h1>Markanızı birlikte keşfedelim</h1>
      <p class="lead">İzleyicilerimiz bize bir yol arkadaşı gibi güveniyor. Biz de tanıttığımız her yeri ve ürünü önce kendimiz deniyoruz.</p>
    </section>
    <section class="wrap">
      <div class="numbers">
        <div><b>${num(D.channel.subscribers)}</b><span>abone</span></div>
        <div><b>${compact(D.channel.views).replace(" milyon", " Mn")}</b><span>toplam izlenme</span></div>
        <div><b>${compact(longAvg)}</b><span>uzun videolarda ortalama izlenme</span></div>
        <div><b>${compact(totalLikes + totalComments)}</b><span>beğeni ve yorum</span></div>
      </div>
      <p class="feature-meta" style="margin-top:10px;display:block">YouTube verileri, ${date(D.channel.updated)}.</p>
    </section>
    <section class="section wrap">
      <div class="section-head"><div><h2>Neler yapabiliriz</h2><p>Her birinin altında kanaldan bir örnek var.</p></div></div>
      <div class="offers">
        ${OFFERS.map(([t, d, ids]) => `<article class="offer"><h3>${t}</h3><p>${d}</p><div class="examples">${ids.filter((id) => byId[id]).map((id) => card(byId[id])).join("")}</div></article>`).join("")}
      </div>
    </section>
    <section class="section wrap">
      <div class="section-head"><div><h2>Kanalımızda yer alanlar</h2><p>Bugüne kadar gezip anlattığımız mekânlar ve etkinlikler.</p></div></div>
      <ul class="tags">${FEATURED_PLACES.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    </section>
    <section class="section wrap" id="iletisim">
      <div class="duo" style="align-items:start">
        <div class="contact">
          <h2>Bize yazın</h2>
          <p class="lead">Formu doldurun, mesajınızı hazırlayalım. Genellikle birkaç gün içinde dönüş yapıyoruz.</p>
          <dl>
            <div><dt>Instagram</dt><dd><a href="https://instagram.com/${CONFIG.instagram}" target="_blank" rel="noopener">@${CONFIG.instagram}</a></dd></div>
            <div><dt>E-posta</dt><dd>${CONFIG.email ? `<a href="mailto:${CONFIG.email}">${CONFIG.email}</a>` : `<span style="color:var(--muted);font-weight:500">Yakında eklenecek. Şimdilik Instagram'dan yazabilirsiniz.</span>`}</dd></div>
            <div><dt>YouTube</dt><dd><a href="${CONFIG.youtube}" target="_blank" rel="noopener">youtube.com/@iyigibitv</a></dd></div>
          </dl>
        </div>
        <form class="form" id="collab-form" novalidate>
          <div class="row">
            <label for="f-name">Adınız<input id="f-name" name="name" required autocomplete="name"></label>
            <label for="f-brand">Marka ya da şirket<input id="f-brand" name="brand" autocomplete="organization"></label>
          </div>
          <div class="row">
            <label for="f-mail">E-posta<input id="f-mail" name="mail" type="email" required autocomplete="email"></label>
            <label for="f-type">İş birliği türü<select id="f-type" name="type">${OFFERS.map(([t]) => `<option>${t}</option>`).join("")}<option>Diğer</option></select></label>
          </div>
          <label for="f-msg">Mesajınız<textarea id="f-msg" name="msg" required placeholder="Markanızdan ve aklınızdaki fikirden kısaca bahsedin."></textarea></label>
          <p id="f-error" style="color:var(--tomato);font-weight:600" hidden>Adınızı, e-postanızı ve mesajınızı yazın.</p>
          <button class="btn btn-route" type="submit" style="justify-self:start">Mesajı hazırla</button>
          <div class="form-out" id="f-out" hidden>
            <pre id="f-text"></pre>
            <div style="display:flex;gap:12px;flex-wrap:wrap">
              <button class="btn btn-line" type="button" id="f-copy">Metni kopyala</button>
              ${CONFIG.email ? `<a class="btn btn-route" id="f-mailto" href="#">E-postayla gönder</a>` : `<a class="btn btn-route" href="https://instagram.com/${CONFIG.instagram}" target="_blank" rel="noopener">Instagram'dan gönder</a>`}
            </div>
          </div>
        </form>
      </div>
    </section>`;
  }
  function bindCollab() {
    const f = document.getElementById("collab-form");
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const g = (n) => f.elements[n].value.trim();
      const ok = g("name") && g("mail") && g("msg");
      document.getElementById("f-error").hidden = !!ok;
      if (!ok) return;
      const text = `Merhaba İyi Gibi TV,\n\n${g("msg")}\n\nİş birliği türü: ${g("type")}\n${g("name")}${g("brand") ? ", " + g("brand") : ""}\n${g("mail")}`;
      document.getElementById("f-text").textContent = text;
      document.getElementById("f-out").hidden = false;
      const m = document.getElementById("f-mailto");
      if (m) m.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("İş birliği: " + (g("brand") || g("name")))}&body=${encodeURIComponent(text)}`;
    });
    document.getElementById("f-copy").addEventListener("click", (e) => {
      const btn = e.currentTarget, pre = document.getElementById("f-text");
      const done = () => { btn.textContent = "Kopyalandı"; setTimeout(() => (btn.textContent = "Metni kopyala"), 2000); };
      const fallback = () => { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = "Metin seçildi, kopyalayın"; };
      try { navigator.clipboard.writeText(pre.textContent).then(done, fallback); } catch (_) { fallback(); }
    });
  }

  // ---- Oynatıcı ----
  const dlg = document.getElementById("player");
  const frame = document.getElementById("player-frame");
  function play(id) {
    const v = byId[id];
    if (!v) return;
    frame.classList.toggle("vertical", v.short);
    frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="${esc(v.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    document.getElementById("player-link").href = watchUrl(v);
    if (typeof dlg.showModal === "function") dlg.showModal();
    else window.open(watchUrl(v), "_blank", "noopener");
  }
  function closePlayer() { frame.innerHTML = ""; if (dlg.open) dlg.close(); }
  document.getElementById("player-close").addEventListener("click", closePlayer);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) closePlayer(); });
  dlg.addEventListener("close", () => (frame.innerHTML = ""));

  // ---- Yönlendirme ----
  const PAGES = { anasayfa: pageHome, videolar: pageVideos, kesifler: pagePlaces, radyoloji: pageRadiology, hakkimizda: pageAbout, isbirligi: pageCollab };
  const BINDS = { anasayfa: bindHome, videolar: bindVideos, kesifler: bindMap, isbirligi: bindCollab };
  const TITLES = Object.fromEntries(ROUTES);
  const navHtml = () => ROUTES.map(([k, l]) => `<a href="#${k}" data-route="${k}">${l}</a>`).join("");
  document.getElementById("nav").innerHTML = navHtml();
  document.getElementById("footer-nav").innerHTML = navHtml() + `<a href="https://instagram.com/${CONFIG.instagram}" target="_blank" rel="noopener">Instagram</a><a href="${CONFIG.youtube}" target="_blank" rel="noopener">YouTube</a>`;
  document.getElementById("footer-data").textContent = `Kanal verileri YouTube'dan alınmıştır, ${date(D.channel.updated)}.`;

  let current = null;
  function render() {
    const route = (location.hash || "#anasayfa").slice(1);
    const key = PAGES[route] ? route : "anasayfa";
    if (routeCleanup) { routeCleanup(); routeCleanup = null; }
    app.innerHTML = `<div class="page">${PAGES[key]()}</div>`;
    (BINDS[key] || (() => {}))();
    document.querySelectorAll("[data-route]").forEach((a) => (a.dataset.route === key ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    document.title = key === "anasayfa" ? "İyi Gibi TV" : `${TITLES[key]} | İyi Gibi TV`;
    document.getElementById("nav").classList.remove("open");
    document.getElementById("menu-btn").setAttribute("aria-expanded", "false");
    if (current !== null) window.scrollTo(0, 0);
    current = key;
  }

  document.addEventListener("click", (e) => {
    const p = e.target.closest("[data-play]");
    if (p) { e.preventDefault(); play(p.dataset.play); return; }
    const a = e.target.closest("a[href^='#']");
    if (!a) return;
    if (a.getAttribute("href") === "#videolar") {
      Object.assign(vstate, { place: a.dataset.place || null, playlist: null, topic: "all", q: "", limit: 24, format: a.dataset.format || "all", sort: a.dataset.sort || "new" });
    }
    if (a.getAttribute("href") === location.hash) { e.preventDefault(); render(); }
  });

  // Görsel yüklenmezse: yedeği dene, o da yoksa kaldır
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    if (img.dataset.fallback) { const f = img.dataset.fallback; delete img.dataset.fallback; img.src = f; return; }
    if (img.classList.contains("yt") || "hideOnError" in img.dataset) img.remove();
  }, true);
  // maxresdefault olmayan videolarda YouTube 120px gri görsel döndürür
  document.addEventListener("load", (e) => {
    const img = e.target;
    if (img instanceof HTMLImageElement && img.dataset.fallback && img.naturalWidth <= 120) { const f = img.dataset.fallback; delete img.dataset.fallback; img.src = f; }
  }, true);

  document.addEventListener("keydown", (e) => { const f = e.target.closest && e.target.closest("figure[data-play]"); if (f && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); play(f.dataset.play); } });
  document.getElementById("menu-btn").addEventListener("click", (e) => {
    const open = document.getElementById("nav").classList.toggle("open");
    e.currentTarget.setAttribute("aria-expanded", String(open));
  });
  window.addEventListener("hashchange", render);
  render();
})();

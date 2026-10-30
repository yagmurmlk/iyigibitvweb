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
  function polaroid(p, { caption = true } = {}) {
    return `<figure class="polaroid" style="--tilt:${p.tilt};margin:0">
      <div class="pic">${p.initials}<img src="${p.photo}" alt="${esc(p.name)}" data-hide-on-error></div>
      <span class="sticker">${esc(p.short)}</span>
      ${caption ? `<figcaption>${esc(p.role)}</figcaption>` : ""}
    </figure>`;
  }

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
      <p class="map-hint">Kesik çizgi, bu yerlere gittiğimiz sırayı gösteriyor. Bir noktaya dokunun.</p>
      <div class="map-panel" id="map-panel" aria-live="polite">${mapPanel()}</div>
    </div>`;
  }
  function selectPin(id) {
    mapSel = id;
    document.querySelectorAll("[data-pin]").forEach((g) => g.setAttribute("aria-pressed", String(g.dataset.pin === id)));
    const panel = document.getElementById("map-panel");
    if (panel) panel.innerHTML = mapPanel();
  }

  // ---- TV ----
  let tvId = longs[0].id;
  let noiseUrl = "";
  function noise() {
    if (noiseUrl) return noiseUrl;
    try {
      const c = document.createElement("canvas"); c.width = c.height = 160;
      const g = c.getContext("2d"), img = g.createImageData(160, 160);
      for (let i = 0; i < img.data.length; i += 4) { const n = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = n; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0); noiseUrl = c.toDataURL();
    } catch (_) { noiseUrl = ""; }
    return noiseUrl;
  }
  function tvCaption(v) {
    return `<div><b>${esc(cleanTitle(v.title))}</b><span>${esc(where(v))}. ${meta(v)}</span></div>
      <button class="btn btn-red" data-play="${v.id}">${I.play.replace("<svg", '<svg fill="currentColor"')}İzle</button>`;
  }
  function tvBlock() {
    const v = byId[tvId];
    return `<div class="tv-wrap">
      <div class="tv">
        <button class="tv-screen on" id="tv-screen" data-play="${v.id}" aria-label="Videoyu oynat: ${esc(cleanTitle(v.title))}" style="border:0;padding:0;cursor:pointer">
          <img id="tv-img" alt="" src="${src(v, "big")}"${fb(v, "big")}>
          <span class="static" style="background-image:url(${noise()})"></span>
          <span class="play-big">${I.play}</span>
        </button>
        <div class="tv-panel">
          <div class="tv-channel" aria-live="polite"><small>kanal</small><span id="tv-no">${String(channelNo(v.id)).padStart(3, "0")}</span></div>
          <button class="knob" id="tv-knob" aria-label="Kanal değiştir"></button>
          <span class="knob small" aria-hidden="true"></span>
          <span class="tv-speaker" aria-hidden="true">${"<span></span>".repeat(9)}</span>
        </div>
      </div>
      <div class="tv-caption" id="tv-caption">${tvCaption(v)}</div>
    </div>`;
  }
  function switchChannel() {
    const pool = longs.filter((v) => v.id !== tvId && v.place);
    const v = pool[Math.floor(Math.random() * pool.length)];
    tvId = v.id;
    const screen = document.getElementById("tv-screen");
    if (!screen) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const apply = () => {
      const img = document.getElementById("tv-img");
      if (!THUMB_BASE) img.dataset.fallback = `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
      img.src = src(v, "big");
      screen.dataset.play = v.id;
      screen.setAttribute("aria-label", "Videoyu oynat: " + cleanTitle(v.title));
      document.getElementById("tv-no").textContent = String(channelNo(v.id)).padStart(3, "0");
      document.getElementById("tv-caption").innerHTML = tvCaption(v);
      screen.classList.remove("switching");
    };
    if (reduce) return apply();
    screen.classList.add("switching");
    setTimeout(apply, 320);
  }

  // ---- Sayfalar ----
  function pageHome() {
    const top = [...longs].sort(byViews).slice(0, 5);
    const latest = V.slice(0, 8);
    const topShorts = [...shorts].sort(byViews).slice(0, 12);
    const wallVids = longs.slice(0, 44);
    const rowA = wallVids.filter((_, i) => i % 2 === 0), rowB = wallVids.filter((_, i) => i % 2 === 1);
    const wallRow = (list, rev) => `<div class="wall-row${rev ? " rev" : ""}">${[...list, ...list].map((v, i) => `<button data-play="${v.id}" ${i >= list.length ? 'tabindex="-1" aria-hidden="true"' : `aria-label="${esc(cleanTitle(v.title))}"`}><img loading="lazy" alt="" src="${src(v)}"></button>`).join("")}</div>`;
    const why = (id, tilt, h, t, link) => {
      const v = byId[id];
      return `<article>
        <button class="photo-tilt" style="--tilt:${tilt}" data-play="${id}" aria-label="${esc(cleanTitle(v.title))}"><img loading="lazy" alt="" src="${src(v)}"></button>
        <h3>${h}</h3><p>${t}</p>
        <button class="card-link" data-play="${id}">${link}</button>
      </article>`;
    };
    return `
    <section class="hero">
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <h1>Güzel değil belki, ama iyi gibi.</h1>
          <p class="lead">Biz Hüseyin ve Melike. Bakü'nün pazarlarından Anadolu'nun köylerine kadar gittiğimiz her yeri kameramızla birlikte keşfediyoruz. Siz de kanalı çevirin, bakalım bugün nereye gidiyoruz.</p>
          <div class="hero-actions">
            <button class="btn btn-sun" id="tv-random">${I.dice}Rastgele bir yer keşfet</button>
            <a class="btn" href="${CONFIG.youtube}?sub_confirmation=1" target="_blank" rel="noopener">${I.yt}Abone ol</a>
          </div>
          <p class="hero-note">${num(D.channel.subscribers)} abone, ${compact(D.channel.views)} izlenme, ${num(D.channel.videoCount)} video</p>
        </div>
        ${tvBlock()}
      </div>
    </section>

    <section class="wall" aria-label="Kanaldaki videolar">${wallRow(rowA)}${wallRow(rowB, true)}</section>
    <p class="wall-caption wrap"><b>${num(D.channel.videoCount)} video, ${placesUsed.length} yer, ${countries.length} ülke.</b> Birine dokunun, oradan başlayın.</p>

    <section class="block wrap">
      <div class="head"><div><h2>Haritada iyi gibi</h2><p>Ayvalık'tan Lənkəran'a kadar gittiğimiz her yer haritada bir nokta. Hangisi daha çok ilginizi çekiyor?</p></div>
        <a class="more" href="#kesifler">Bütün yolculuklar</a></div>
      ${mapBlock()}
    </section>

    <section class="block wrap">
      <div class="head"><div><h2>En çok izlenenler</h2><p>Sizin en çok izlediğiniz yolculuklar. Çoğu, bir ülkeyi pazar tezgâhından tanımaya çalıştığımız günler.</p></div>
        <a class="more" href="#videolar" data-sort="views">Hepsini sırala</a></div>
      <div class="feature-grid">${top.map((v, i) => card(v, { kind: i === 0 ? "big" : "card", pin: true })).join("")}</div>
    </section>

    <section class="block wrap">
      <div class="head"><div><h2>Neden birlikte keşfediyoruz?</h2><p>Bir yeri gerçekten tanımak için üç kuralımız var.</p></div></div>
      <div class="why">
        ${why("mV9hZFSvZtc", "-2deg", "Yerinde görmek", "Bir ülkenin hayat pahalılığını haberlerden değil, pazar tezgâhından öğreniyoruz. Fiyatı soruyor, ürünü elimize alıyor, satıcıyla sohbet ediyoruz.", "Azerbaycan'da hayat pahalı mı?")}
        ${why("PRAJ84uGhDU", "1.5deg", "Merakla sormak", "Yolda aklımıza takılan soruları saklamıyoruz. Cevabı birlikte arıyoruz; bazen bir müzede, bazen bir bilgi yarışmasında, bazen gece yürüyüşünde.", "Bakü'de akşam yürüyüşü")}
        ${why("Wvp6fkVAUwQ", "-1deg", "Sofrada buluşmak", "Bir yolculuğun en güzel anı çoğu zaman plansız olanıdır: bir bazlama, bir tereyağı ve hiç tanımadığımız amcalarla edilen bir sohbet.", "Kızılcahamam'da bir gün")}
      </div>
    </section>

    <section class="block wrap">
      <div class="head"><div><h2>Kanalda yeni</h2><p>Son yüklediklerimiz.</p></div><a class="more" href="#videolar">Tüm videolar</a></div>
      <div class="grid">${latest.map((v) => card(v)).join("")}</div>
    </section>

    <section class="block wrap">
      <div class="head"><div><h2>Bir dakikadan kısa</h2><p>Yoldan kalan küçük anlar.</p></div><a class="more" href="#videolar" data-format="short">Tüm Shorts videoları</a></div>
      <div class="strip">${topShorts.map((v) => card(v)).join("")}</div>
    </section>

    <section class="block wrap">
      <div class="band">
        <div style="display:grid;gap:18px;min-width:0">
          <h2>Markanızı birlikte keşfedelim</h2>
          <p class="lead">Bir mekânı, ürünü ya da etkinliği izleyicimize kendi gözümüzden anlatıyoruz. Reklam gibi değil, yol arkadaşının tavsiyesi gibi.</p>
          <a class="btn" href="#isbirligi" style="justify-self:start">İş birliği için yazın</a>
        </div>
        <ul class="band-nums">
          <li><b>${compact([...longs].sort(byViews)[0].views)}</b><span>en çok izlenen videomuzun izlenmesi</span></li>
          <li><b>${compact(longAvg)}</b><span>uzun videolarda ortalama izlenme</span></li>
          <li><b>3 dil</b><span>Türkçe, Azerbaycan Türkçesi ve Rusça açıklamalar</span></li>
        </ul>
      </div>
    </section>

    <section class="block wrap">
      <div class="duo">
        <div class="polaroids">${PEOPLE.map((p) => polaroid(p)).join("")}</div>
        <div style="display:grid;gap:18px;min-width:0">
          <h2>Kameranın arkasında biz varız</h2>
          <p class="lead">Hüseyin rotayı bulur, Melike o rotadaki en güzel sofrayı. Biri gezmeden duramaz, diğeri MR cihazlarını herkesin anlayacağı dille anlatır. Gerisini birlikte keşfederiz.</p>
          <a class="more" href="#hakkimizda" style="justify-self:start">Bizi tanıyın</a>
        </div>
      </div>
    </section>`;
  }
  function bindHome() {
    document.getElementById("tv-knob").addEventListener("click", switchChannel);
    document.getElementById("tv-random").addEventListener("click", switchChannel);
    bindMap();
  }
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
      <div style="display:flex;justify-content:center;margin-top:36px"><button class="btn" id="v-more">Daha fazla göster</button></div>
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
      ? `<div class="active-filters">${act.map((a) => `<span class="sticker">${esc(a)}</span>`).join("")}<button class="chip-btn" id="v-clear">Filtreyi kaldır</button></div>` : "";
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
      <p class="note">Bu videolar genel bilgilendirme amaçlıdır. Tanı, tedavi ve size özel durumlar için doktorunuza danışın.</p>
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
  function pageAbout() {
    return `
    <section class="wrap page-head">
      <h1>İki kişi, bir kamera, bitmeyen bir merak</h1>
    </section>
    <section class="wrap">
      ${PEOPLE.map((p) => `
        <article class="bio" id="${p.id}">
          ${polaroid(p, { caption: false })}
          <div class="bio-text">
            <h2>${esc(p.name)}</h2>
            <span class="role">${esc(p.role)}</span>
            ${p.text.map((t) => `<p>${esc(t)}</p>`).join("")}
            <ul class="chips" aria-label="${esc(p.short)} neler yapıyor">${p.skills.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
          </div>
        </article>`).join("")}
    </section>
    <section class="block wrap">
      <div class="head"><div><h2>Hikâyemiz</h2><p>2013'ten bugüne kanalın yolculuğu.</p></div></div>
      <ol class="timeline">${STORY.map(([d, t]) => `<li><b>${d}</b><p>${esc(t)}</p></li>`).join("")}</ol>
    </section>
    <section class="block wrap">
      <div class="band">
        <div style="display:grid;gap:16px;min-width:0"><h2>Bir sonraki durağı birlikte seçelim</h2><p class="lead">Gitmemizi istediğiniz bir yer ya da birlikte anlatmak istediğiniz bir hikâye varsa yazın.</p></div>
        <div style="display:flex;gap:14px;flex-wrap:wrap"><a class="btn" href="#isbirligi">Bize yazın</a><a class="btn" href="https://instagram.com/${CONFIG.instagram}" target="_blank" rel="noopener">Instagram'da takip edin</a></div>
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
      <p class="hero-note" style="margin-top:10px">YouTube verileri, ${date(D.channel.updated)}.</p>
    </section>
    <section class="block wrap">
      <div class="head"><div><h2>Neler yapabiliriz</h2><p>Her birinin altında kanaldan bir örnek var.</p></div></div>
      <div class="offers">
        ${OFFERS.map(([t, d, ids]) => `<article class="offer"><h3>${t}</h3><p>${d}</p><div class="examples">${ids.filter((id) => byId[id]).map((id) => card(byId[id])).join("")}</div></article>`).join("")}
      </div>
    </section>
    <section class="block wrap">
      <div class="head"><div><h2>Kanalımızda yer alanlar</h2><p>Bugüne kadar gezip anlattığımız mekânlar ve etkinlikler.</p></div></div>
      <ul class="tags">${FEATURED_PLACES.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    </section>
    <section class="block wrap" id="iletisim">
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
          <button class="btn btn-sun" type="submit" style="justify-self:start">Mesajı hazırla</button>
          <div class="form-out" id="f-out" hidden>
            <pre id="f-text"></pre>
            <div style="display:flex;gap:12px;flex-wrap:wrap">
              <button class="btn" type="button" id="f-copy">Metni kopyala</button>
              ${CONFIG.email ? `<a class="btn btn-red" id="f-mailto" href="#">E-postayla gönder</a>` : `<a class="btn btn-red" href="https://instagram.com/${CONFIG.instagram}" target="_blank" rel="noopener">Instagram'dan gönder</a>`}
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

  document.getElementById("menu-btn").addEventListener("click", (e) => {
    const open = document.getElementById("nav").classList.toggle("open");
    e.currentTarget.setAttribute("aria-expanded", String(open));
  });
  window.addEventListener("hashchange", render);
  render();
})();

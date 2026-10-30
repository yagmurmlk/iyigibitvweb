/* İyi Gibi TV — site uygulaması.
   Veri: assets/js/data.js (scripts/build_data.py ile üretilir).
   Sayfalar hash ile açılır: #anasayfa, #videolar, #kesifler, #radyoloji, #hakkimizda, #isbirligi */
(function () {
  "use strict";

  // ---- Ayarlar: iletişim bilgileri ----
  const CONFIG = {
    email: "",                 // İş birliği e-postası. Boşsa formda Instagram yönlendirmesi gösterilir.
    instagram: "iyigibitv",
    youtube: "https://www.youtube.com/@iyigibitv",
  };

  const D = window.IGTV_DATA;
  const V = D.videos;
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

  const TOPICS = {
    gezi: "Gezi",
    mutfak: "Mutfak",
    radyoloji: "Radyoloji & MR",
    unutmadik: "Unutmadık",
    gunluk: "Günlük anlar",
  };
  const COVER = {
    AZ: "linear-gradient(135deg,#1d6b74,#0f3a44)",
    TR: "linear-gradient(135deg,#c22b4b,#6e1430)",
    GE: "linear-gradient(135deg,#d99a12,#8a5a06)",
    radyoloji: "linear-gradient(135deg,#2d4d8a,#162749)",
    mutfak: "linear-gradient(135deg,#d7752a,#7d3a0e)",
    unutmadik: "linear-gradient(135deg,#55666c,#26343a)",
    gunluk: "linear-gradient(135deg,#3f8a6b,#1b4637)",
    gezi: "linear-gradient(135deg,#1d6b74,#0f3a44)",
  };

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
  const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  function date(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return `${d} ${MONTHS[m - 1]} ${y}`;
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Başlıktaki hashtag'leri kart başlığından temizler
  function cleanTitle(t) {
    const c = t.replace(/#[^\s#]+/g, "").replace(/\s{2,}/g, " ").replace(/[\s|\-–]+$/, "").trim();
    return c || t.replace(/#/g, "").split(" ").slice(0, 4).join(" ");
  }
  const watchUrl = (v) => (v.short ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`);
  const placeOf = (id) => D.places.find((p) => p.id === id);

  // ---- Türetilmiş veriler ----
  const longs = V.filter((v) => !v.short);
  const shorts = V.filter((v) => v.short);
  const byViews = (a, b) => b.views - a.views;
  const placesUsed = D.places
    .map((p) => {
      const vids = V.filter((v) => v.place === p.id);
      const dates = vids.map((v) => v.date).sort();
      return { ...p, vids, count: vids.length, views: vids.reduce((s, v) => s + v.views, 0), first: dates[0], last: dates[dates.length - 1] };
    })
    .filter((p) => p.count > 0);
  const countries = [...new Set(placesUsed.map((p) => p.country))];
  const longAvg = Math.round(longs.reduce((s, v) => s + v.views, 0) / longs.length);
  const totalLikes = V.reduce((s, v) => s + v.likes, 0);
  const totalComments = V.reduce((s, v) => s + v.comments, 0);

  // ---- Bileşenler ----
  const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  const ICON_YT = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.7 15.1V8.9l5.8 3.1-5.8 3.1Z"/></svg>';
  const ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

  function thumb(v, { big = false } = {}) {
    const p = placeOf(v.place);
    const cover = COVER[v.topic === "gezi" ? v.country || "gezi" : v.topic];
    const label = p ? `${p.name} · ${p.countryName}` : TOPICS[v.topic];
    const img = big ? "maxresdefault" : v.short ? "hqdefault" : "mqdefault";
    const fb = big ? ` data-fallback="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg"` : "";
    return `<div class="thumb" style="--cover:${cover}">
      <div class="cover"><i>${esc(label)}</i><b>${esc(cleanTitle(v.title))}</b></div>
      <img class="yt" loading="lazy" alt="" src="https://i.ytimg.com/vi/${v.id}/${img}.jpg"${fb}>
      <span class="play">${ICON_PLAY}</span>
      <span class="dur">${v.short ? "Shorts" : dur(v.sec)}</span>
    </div>`;
  }

  function card(v) {
    return `<button class="card" data-play="${v.id}" aria-label="${esc(cleanTitle(v.title))} videosunu oynat">
      ${thumb(v)}
      <span class="card-title">${esc(cleanTitle(v.title))}</span>
      <span class="card-meta mono"><span>${date(v.date)}</span><span>${compact(v.views)} izlenme</span></span>
    </button>`;
  }

  function stamp(p, i) {
    const r = [-2.5, 1.8, -1.2, 2.4, -1.8, 1.1][i % 6];
    return `<a class="stamp" href="#kesifler" data-place-jump="${p.id}" data-country="${p.country}" style="--r:${r}deg">
      <span class="s-country">${esc(p.countryName)}</span>
      <span class="s-name">${esc(p.name)}</span>
      <span class="s-meta mono"><span>${esc(p.coord)}</span></span>
      <span class="s-meta mono"><span>${p.count} video</span><span>${p.first.slice(0, 4)}${p.last.slice(0, 4) !== p.first.slice(0, 4) ? "–" + p.last.slice(2, 4) : ""}</span></span>
    </a>`;
  }

  function ticket(items) {
    return `<div class="ticket">${items.map(([n, l]) => `<div><strong>${n}</strong><span>${l}</span></div>`).join("")}</div>`;
  }

  function avatar(person) {
    return `<span class="avatar">${person.initials}<img src="${person.photo}" alt="" data-hide-on-error></span>`;
  }

  // ---- Kişiler ----
  const PEOPLE = [
    {
      id: "huseyin",
      name: "Hüseyin Çıtak",
      initials: "HÇ",
      photo: "assets/img/huseyin.jpg",
      role: "Yol arkadaşı, rota bulucu",
      hello: "Selam, ben Hüseyin.",
      text: [
        "36 yaşındayım. Videolardan da anlaşılacağı üzere gezmeyi çok seviyorum. Yeni şeyler keşfetmek benim için bir hobiden fazlası, hayat amacım gibi bir şey.",
        "Hatta şöyle söyleyeyim: bence hayat, keşfetmenin başka bir yolu. Bir pazarda fiyat sormak, bir köy yolunda mola verip dut toplamak, hiç tanımadığım biriyle sohbete dalmak... Her biri bana yeni bir şey öğretiyor.",
        "Kamerayı da bu yüzden açıyorum. Gördüğümü sizinle paylaşınca keşif tamamlanmış oluyor.",
      ],
      skills: ["Rota planlama", "Yol hikâyeleri", "Sohbet ve röportaj", "Kamp"],
    },
    {
      id: "melike",
      name: "Melike Yağmur",
      initials: "MY",
      photo: "assets/img/melike.jpg",
      role: "Radyoloji teknikeri, sofra kâşifi",
      hello: "Merhaba, ben Melike.",
      text: [
        "Kanalın ilk videoları benim kıvırcık saçlarımla ve radyoloji hakkında bize sorduğunuz sorularla başladı. Mesleğim radyoloji teknikerliği; yıllarca MR ve açık MR çekimi yaptım, bir dönem de mesleğimi Azerbaycan'da sürdürdüm.",
        "Hüseyin yeni bir rota bulduğunda ben de o rotada oturulacak en güzel sofrayı ararım. Mutfakta denemeler yapmayı, hayvanlarla vakit geçirmeyi ve hayatın küçük komik anlarını kaydetmeyi seviyorum.",
        "MR hakkında merak edilenleri anlatmak da benim için ayrı bir keyif. Doğru bilgi, insanın içini rahatlatıyor.",
      ],
      skills: ["MR & açık MR", "Bilim anlatımı", "Seslendirme", "Mutfak denemeleri"],
    },
  ];

  // ---- Sayfalar ----
  function pageHome() {
    const featured = longs[0]; // en yeni uzun video
    const top = [...longs].sort(byViews).slice(0, 6);
    const latest = V.filter((v) => v.id !== featured.id).slice(0, 6);
    const topShorts = [...shorts].sort(byViews).slice(0, 10);
    const ex = (id, text) => (byId[id] ? `<button class="card-link" data-play="${id}">${text}</button>` : "");
    return `
    <section class="hero">
      <svg class="route-line" viewBox="0 0 1200 600" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-20 520 C 200 430, 260 560, 420 470 S 640 300, 760 360 S 980 180, 1220 90"/>
      </svg>
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <span class="eyebrow"><span style="text-transform:none">@iyigibitv</span> · 2013'ten beri</span>
          <h1>Güzel değil belki, ama <em>iyi gibi.</em></h1>
          <p class="lead">Biz Hüseyin ve Melike. Bakü'nün pazarlarından Anadolu'nun köylerine kadar gittiğimiz her yeri kameramızla birlikte keşfediyoruz. Bir yeri tanımanın en güzel yolu, onu birlikte yaşamak.</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="#videolar">${ICON_PLAY.replace('aria-hidden="true"', 'aria-hidden="true" fill="currentColor"')}Videoları izle</a>
            <a class="btn btn-ghost" href="${CONFIG.youtube}?sub_confirmation=1" target="_blank" rel="noopener">${ICON_YT}YouTube'da abone ol</a>
          </div>
        </div>
        <button class="featured card" data-play="${featured.id}" aria-label="Son video: ${esc(cleanTitle(featured.title))}">
          ${thumb(featured, { big: true })}
          <span class="featured-meta"><span class="tag-new">Son video</span><span class="mono">${date(featured.date)} · ${dur(featured.sec)}</span></span>
          <span class="featured-title">${esc(cleanTitle(featured.title))}</span>
        </button>
      </div>
    </section>

    <section class="section" style="padding-top:0">
      <div class="wrap">
        ${ticket([
          [num(D.channel.subscribers), "abone"],
          [compact(D.channel.views).replace(" milyon", " Mn"), "toplam izlenme"],
          [num(D.channel.videoCount), "video"],
          [`${placesUsed.length}`, `durak, ${countries.length} ülke`],
        ])}
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head"><div><span class="eyebrow">Yolculuk felsefemiz</span><h2>Neden birlikte keşfediyoruz?</h2></div></div>
        <div class="manifesto">
          <article>
            <h3>Yerinde görmek</h3>
            <p>Bir ülkenin hayat pahalılığını haberlerden değil, pazar tezgâhından öğreniyoruz. Fiyatı soruyor, ürünü elimize alıyor, satıcıyla sohbet ediyoruz.</p>
            <p>${ex("mV9hZFSvZtc", "Azerbaycan'da Hayat Pahalı Mı? →")}</p>
          </article>
          <article>
            <h3>Merakla sormak</h3>
            <p>Yolda aklımıza takılan soruları saklamıyoruz. Cevabı birlikte arıyoruz; bazen bir müzede, bazen bir bilgi yarışmasında, bazen gece yürüyüşünde.</p>
            <p>${ex("PRAJ84uGhDU", "Bakü'de Akşam Yürüyüşü →")}</p>
          </article>
          <article>
            <h3>Sofrada buluşmak</h3>
            <p>Bir yolculuğun en güzel anı çoğu zaman plansız olanıdır: bir bazlama, bir tereyağı ve hiç tanımadığımız amcalarla edilen bir sohbet.</p>
            <p>${ex("Wvp6fkVAUwQ", "Kızılcahamam'da Bir Gün →")}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head">
          <div><span class="eyebrow">En çok izlenenler</span><h2>Sizin en sevdikleriniz</h2></div>
          <a class="link-more" href="#videolar" data-sort="views">Tümünü gör</a>
        </div>
        <div class="grid grid-3">${top.map(card).join("")}</div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head">
          <div><span class="eyebrow">Keşif defteri</span><h2>Damga vurduğumuz yerler</h2></div>
          <a class="link-more" href="#kesifler">Haritayı aç</a>
        </div>
        <div class="stamps">${placesUsed.filter((p) => p.id !== "deprem").map(stamp).join("")}</div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head">
          <div><span class="eyebrow">Kanalda yeni</span><h2>Son yüklenenler</h2></div>
          <a class="link-more" href="#videolar">Tüm videolar</a>
        </div>
        <div class="grid grid-3">${latest.map(card).join("")}</div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head">
          <div><span class="eyebrow">Kısa anlar</span><h2>Bir dakikadan kısa keşifler</h2></div>
          <a class="link-more" href="#videolar" data-format="short">Tüm Shorts</a>
        </div>
        <div class="strip">${topShorts.map(card).join("")}</div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="band">
          <div style="display:grid;gap:18px;min-width:0">
            <span class="eyebrow" style="color:inherit;opacity:.7">Markalar için</span>
            <h2>Markanızı birlikte keşfedelim</h2>
            <p class="lead">Bir mekânı, ürünü ya da etkinliği izleyicimize kendi gözümüzden ve samimi bir dille anlatıyoruz. Reklam gibi değil, yol arkadaşı tavsiyesi gibi.</p>
            <a class="btn btn-primary" href="#isbirligi">İş birliği yapalım</a>
          </div>
          <ul class="band-list">
            <li><b>${compact(longs.slice().sort(byViews)[0].views)}</b><span>en çok izlenen videomuzun izlenmesi</span></li>
            <li><b>${compact(longAvg)}</b><span>uzun videolarda ortalama izlenme</span></li>
            <li><b>3 dil</b><span>Türkçe, Azerbaycan Türkçesi ve Rusça açıklamalar</span></li>
          </ul>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head">
          <div><span class="eyebrow">Kameranın arkası</span><h2>Biz kimiz?</h2></div>
          <a class="link-more" href="#hakkimizda">Hikâyemizi oku</a>
        </div>
        <div class="people">
          ${PEOPLE.map((p) => `<a class="person-mini" href="#hakkimizda">${avatar(p)}<span style="display:grid;gap:2px;min-width:0"><b style="font:700 1.15rem/1.2 var(--f-display)">${esc(p.name)}</b><span style="color:var(--muted)">${esc(p.role)}</span></span></a>`).join("")}
        </div>
      </div>
    </section>`;
  }

  // Videolar sayfası durumu
  const vstate = { q: "", topic: "all", format: "all", sort: "new", place: null, playlist: null, limit: 24 };

  function pageVideos() {
    const counts = Object.fromEntries(Object.keys(TOPICS).map((t) => [t, V.filter((v) => v.topic === t).length]));
    const lists = D.playlists.filter((p) => p.videoIds.length);
    return `
    <section class="wrap page-head">
      <span class="eyebrow">Video arşivi · ${V.length} video</span>
      <h1>Tüm videolar</h1>
      <p class="lead">Gezi, mutfak, radyoloji ve hayatın küçük anları. Aradığınızı yazın ya da konuya göre süzün.</p>
    </section>
    <section class="wrap">
      <h2 class="eyebrow" style="margin-bottom:12px">Seriler</h2>
      <div class="series">
        ${lists.map((p) => `<button class="serie" data-playlist="${p.id}" aria-pressed="${vstate.playlist === p.id}"><b>${esc(titleCase(p.title))}</b><span class="mono">${p.videoIds.length} video</span></button>`).join("")}
      </div>
      <div class="toolbar">
        <div class="toolbar-row">
          <label class="search">${ICON_SEARCH}<input id="v-search" type="search" placeholder="Video ara: Bakü, MR, kamp, tarif..." value="${esc(vstate.q)}" aria-label="Video ara"></label>
          <select class="filter" id="v-format" aria-label="Format">
            <option value="all">Tüm formatlar</option><option value="long">Uzun videolar</option><option value="short">Shorts</option>
          </select>
          <select class="filter" id="v-sort" aria-label="Sıralama">
            <option value="new">En yeni</option><option value="views">En çok izlenen</option><option value="old">En eski</option>
          </select>
        </div>
        <div class="toolbar-row" role="group" aria-label="Konu">
          <button class="filter" data-topic="all" aria-pressed="${vstate.topic === "all"}">Tümü <span class="mono">${V.length}</span></button>
          ${Object.entries(TOPICS).map(([k, l]) => `<button class="filter" data-topic="${k}" aria-pressed="${vstate.topic === k}">${l} <span class="mono">${counts[k]}</span></button>`).join("")}
          <span class="result-count mono" id="v-count"></span>
        </div>
      </div>
      <div id="v-active"></div>
      <div class="grid" id="v-grid"></div>
      <div style="display:flex;justify-content:center;margin-top:32px"><button class="btn btn-ghost" id="v-more">Daha fazla göster</button></div>
    </section>`;
  }

  function titleCase(s) {
    return s.toLocaleLowerCase("tr-TR").replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toLocaleUpperCase("tr-TR"));
  }

  function filterVideos() {
    const q = vstate.q.trim().toLocaleLowerCase("tr-TR");
    let list = V.filter((v) => {
      if (vstate.topic !== "all" && v.topic !== vstate.topic) return false;
      if (vstate.format === "long" && v.short) return false;
      if (vstate.format === "short" && !v.short) return false;
      if (vstate.place && v.place !== vstate.place) return false;
      if (vstate.playlist) {
        const pl = D.playlists.find((p) => p.id === vstate.playlist);
        if (!pl || !pl.videoIds.includes(v.id)) return false;
      }
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
    const list = filterVideos();
    const grid = document.getElementById("v-grid");
    if (!grid) return;
    grid.innerHTML = list.length ? list.slice(0, vstate.limit).map(card).join("") : `<p class="empty">Bu aramaya uyan video bulamadık. Farklı bir kelime deneyin ya da filtreleri temizleyin.</p>`;
    document.getElementById("v-count").textContent = `${list.length} sonuç`;
    document.getElementById("v-more").hidden = list.length <= vstate.limit;
    const act = [];
    if (vstate.place) act.push(`Yer: ${placeOf(vstate.place).name}`);
    if (vstate.playlist) act.push(`Seri: ${titleCase(D.playlists.find((p) => p.id === vstate.playlist).title)}`);
    document.getElementById("v-active").innerHTML = act.length
      ? `<p style="margin-bottom:20px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">${act.map((a) => `<span class="chip">${esc(a)}</span>`).join("")}<button class="filter" id="v-clear">Filtreyi kaldır ✕</button></p>`
      : "";
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
    app.addEventListener("click", videosClick);
    renderVideoGrid();
  }
  function videosClick(e) {
    const t = e.target.closest("[data-topic],[data-playlist],#v-clear");
    if (!t || !document.getElementById("v-grid")) return;
    if (t.id === "v-clear") { vstate.place = null; vstate.playlist = null; }
    else if (t.dataset.topic) vstate.topic = t.dataset.topic;
    else if (t.dataset.playlist) vstate.playlist = vstate.playlist === t.dataset.playlist ? null : t.dataset.playlist;
    vstate.limit = 24;
    renderVideoGrid();
  }

  function pagePlaces() {
    const groups = ["AZ", "TR", "GE"].map((c) => ({ c, places: placesUsed.filter((p) => p.country === c) })).filter((g) => g.places.length);
    let i = 0;
    return `
    <section class="wrap page-head">
      <span class="eyebrow">Keşif defteri · ${placesUsed.length} durak · ${countries.length} ülke</span>
      <h1>Gittiğimiz yerler</h1>
      <p class="lead">Her damga bir yolculuk. Bir yere tıklayın, orada çektiğimiz videoları görün.</p>
      <div class="stamps" style="margin-top:20px">${placesUsed.map((p) => stamp(p, i++)).join("")}</div>
    </section>
    <section class="wrap">
      ${groups.map((g) => `
        <div class="country-head"><h2>${esc(g.places[0].countryName)}</h2><span class="mono" style="color:var(--muted)">${g.places.reduce((s, p) => s + p.count, 0)} video · ${compact(g.places.reduce((s, p) => s + p.views, 0))} izlenme</span></div>
        ${g.places.map((p, j) => {
          const vids = [...p.vids].sort((a, b) => (a.short - b.short) || b.views - a.views);
          return `<div class="place" id="yer-${p.id}">
            ${stamp(p, j)}
            <div style="display:grid;gap:18px;min-width:0">
              <div class="grid">${vids.slice(0, 6).map(card).join("")}</div>
              ${vids.length > 6 ? `<a class="link-more" href="#videolar" data-place="${p.id}" style="justify-self:start">${p.name}: ${vids.length} videonun tümü</a>` : ""}
            </div>
          </div>`;
        }).join("")}`).join("")}
    </section>`;
  }

  const RADIO_GROUPS = [
    ["Açık MR", "Kapalı alan korkusu olanlar için açık MR nasıl bir cihaz, çekime nasıl gelinir?", ["TqRXEbNQe_M", "Z4T0NWuKwsY", "x-k9W2TiMFA"]],
    ["MR'ı anlamak", "MR vücudumuza ne yapıyor, güvenli mi, nelere dikkat etmeli?", ["_mpbUlQtyHU", "vmb9iwSnLYA", "ZThtfvSnWWk"]],
    ["Bilim tarihi", "MR'ı kim buldu? Tomografinin The Beatles ile ne ilgisi var?", ["US8TaXJ8ZLU", "rQrRP72A874"]],
    ["Meslek", "Radyoloji teknikerliği: sorularınız ve yurt dışında çalışmak.", ["j5cqbBKCzJg", "mBT6HYNxPh8"]],
  ];
  function pageRadiology() {
    const rv = V.filter((v) => v.topic === "radyoloji");
    const views = rv.reduce((s, v) => s + v.views, 0);
    return `
    <section class="wrap page-head">
      <span class="eyebrow">Önlüğün arkasında · ${rv.length} video · ${compact(views)} izlenme</span>
      <h1>Radyoloji & MR</h1>
      <p class="lead">Kameranın arkasında bir de meslek var. Melike yıllardır radyoloji teknikeri. MR'ı, açık MR'ı ve MR güvenliğini en çok sorulan sorular üzerinden, herkesin anlayacağı bir dille anlatıyoruz.</p>
    </section>
    <section class="wrap" style="display:grid;gap:48px">
      ${RADIO_GROUPS.map(([t, d, ids]) => `
        <div style="display:grid;gap:16px">
          <div style="display:grid;gap:6px"><h2 style="font-size:var(--step-2)">${t}</h2><p style="color:var(--muted)">${d}</p></div>
          <div class="qa">${ids.filter((id) => byId[id]).map((id) => {
            const v = byId[id];
            return `<button class="qa-item" data-play="${id}">${thumb(v)}<span style="display:grid;gap:4px;min-width:0"><b style="line-height:1.35">${esc(cleanTitle(v.title))}</b><span class="mono" style="color:var(--muted)">${v.short ? "Shorts" : dur(v.sec)} · ${compact(v.views)} izlenme</span></span></button>`;
          }).join("")}</div>
        </div>`).join("")}
      <p class="note">Bu sayfadaki videolar genel bilgilendirme amaçlıdır. Tanı, tedavi ve size özel durumlar için doktorunuza danışın.</p>
    </section>`;
  }

  const STORY = [
    ["Şubat 2013", "Kanal açıldı. İsmi o gün koyduk: güzel değil belki, ama iyi gibi."],
    ["Ağustos 2017", "İlk video: makarna süzgeciyle kıvırcık saç kurutma. 54 bin kişi izledi, biz hâlâ şaşırıyoruz."],
    ["Ağustos 2018", "Radyoloji hakkında sorularınızı cevapladık. Bugün bile en çok izlenen videolarımızdan biri."],
    ["Kasım 2022", "Ayvalık ve Cunda'da sobalı ev, karavan hayatı, gün batımları. Kısa videolarla yeniden başladık."],
    ["Mart 2023", "Kahramanmaraş Pazarcık ve Hatay. Deprem bölgesinde gördüklerimizi unutmamak için kaydettik."],
    ["Eylül 2023", "Azerbaycan dönemi başladı. Bakü'nün pazarları, Qobustan, Lənkəran, Şəki ve kamp serisi."],
    ["Aralık 2023", "\"Azerbaycan'da Hayat Pahalı Mı?\" 234 bin izlenmeyle kanalın en çok izlenen videosu oldu."],
    ["Ocak 2026", "Ankara'ya döndük. Daha gerçek, daha sakin, daha biz videolarla yeniden buradayız."],
    ["2026", "Beypazarı, Hendek'te bir köy, Kayseri'den Antalya'ya bir yol. Türkiye rotaları yeni başlıyor."],
  ];
  function pageAbout() {
    return `
    <section class="wrap page-head">
      <span class="eyebrow">Hakkımızda</span>
      <h1>İki kişi, bir kamera, bitmeyen bir merak.</h1>
    </section>
    <section class="wrap section" style="padding-top:24px">
      ${PEOPLE.map((p, i) => `
        <article class="bio${i % 2 ? " flip" : ""}" id="${p.id}">
          <figure class="photo" style="margin:0">
            <span class="initials">${p.initials}</span>
            <img src="${p.photo}" alt="${esc(p.name)}" data-hide-on-error>
            <figcaption class="mono">${esc(p.name)}</figcaption>
          </figure>
          <div class="bio-text">
            <span class="eyebrow">${esc(p.role)}</span>
            <p class="hello">${esc(p.hello)}</p>
            ${p.text.map((t) => `<p>${esc(t)}</p>`).join("")}
            <ul class="chips" aria-label="Neler yapıyor">${p.skills.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
          </div>
        </article>`).join("")}
    </section>
    <section class="wrap section">
      <div class="section-head"><div><span class="eyebrow">Zaman çizelgesi</span><h2>Hikâyemiz</h2></div></div>
      <ol class="timeline">${STORY.map(([d, t]) => `<li><span class="mono">${d}</span><p>${esc(t)}</p></li>`).join("")}</ol>
    </section>
    <section class="wrap section">
      <div class="band">
        <div style="display:grid;gap:16px;min-width:0"><h2>Bir sonraki durağı birlikte seçelim</h2><p class="lead">Gitmemizi istediğiniz bir yer ya da birlikte anlatmak istediğiniz bir hikâye varsa yazın.</p></div>
        <div style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn-primary" href="#isbirligi">Bize yazın</a><a class="btn btn-ghost" style="border-color:currentColor;color:inherit" href="https://instagram.com/${CONFIG.instagram}" target="_blank" rel="noopener">Instagram</a></div>
      </div>
    </section>`;
  }

  const OFFERS = [
    ["Mekân ve destinasyon tanıtımı", "Bir şehri, otelinizi, restoranınızı ya da AVM'nizi gezerek, yaşayarak anlatıyoruz.", ["zQqYVhczytI", "noCjfivVk_4", "ikP1eUaUwYo"]],
    ["Etkinlik ve festival çekimi", "Fuar, maraton, bayram ve şehir etkinliklerini izleyiciyi oradaymış gibi hissettiren vloglara dönüştürüyoruz.", ["uco80SPFpIc", "ibvpqVA1orY", "Snq_LjE2xpM"]],
    ["Ürün deneyimi", "Ürününüzü günlük hayatımızda kullanıyor, beğendiğimizi ve beğenmediğimizi açıkça söylüyoruz.", ["sPFEiB9KpBo"]],
    ["Sağlık ve bilim içeriği", "Radyoloji alanındaki uzmanlığımızla tıbbi görüntüleme konularını doğru ve sade bir dille anlatıyoruz.", ["Z4T0NWuKwsY", "mBT6HYNxPh8"]],
  ];
  const FEATURED_PLACES = ["Port Baku Mall", "Bakü Crescent Mall", "Baku Auto Mall", "Şeki Qala Restoran", "Tarık Usta", "Azerbaijan Honey Expo 2024", "Bakü Maratonu 2024", "Cars & Coffee Azerbaijan", "Sederek Ticaret Merkezi", "Mir Teymur Mammadov Müzesi", "Beliga Parfüm", "Binef At Çiftliği"];

  function pageCollab() {
    const emailLine = CONFIG.email
      ? `<a href="mailto:${CONFIG.email}">${CONFIG.email}</a>`
      : `<span style="color:var(--muted)">E-posta adresi yakında eklenecek. Şimdilik Instagram'dan yazabilirsiniz.</span>`;
    return `
    <section class="wrap page-head">
      <span class="eyebrow">Markalar ve ajanslar için</span>
      <h1>Markanızı birlikte keşfedelim</h1>
      <p class="lead">İzleyicilerimiz bize bir yol arkadaşı gibi güveniyor. Biz de tanıttığımız her yeri ve ürünü önce kendimiz deniyoruz.</p>
    </section>
    <section class="wrap">
      ${ticket([
        [num(D.channel.subscribers), "abone"],
        [compact(D.channel.views).replace(" milyon", " Mn"), "toplam izlenme"],
        [compact(longAvg), "uzun video ort. izlenme"],
        [compact(totalLikes + totalComments), "beğeni ve yorum"],
      ])}
      <p class="mono" style="color:var(--muted);margin-top:10px">YouTube verileri, ${date(D.channel.updated)}</p>
    </section>
    <section class="wrap section">
      <div class="section-head"><div><span class="eyebrow">Neler yapabiliriz</span><h2>İş birliği biçimleri</h2></div></div>
      <div class="offer">
        ${OFFERS.map(([t, d, ids]) => `<article><h3>${t}</h3><p>${d}</p><div class="examples"><span class="mono" style="color:var(--muted)">Örnek:</span>${ids.filter((id) => byId[id]).map((id) => `<button data-play="${id}">${esc(cleanTitle(byId[id].title).split("|")[0].trim())}</button>`).join("")}</div></article>`).join("")}
      </div>
    </section>
    <section class="wrap section">
      <div class="section-head"><div><span class="eyebrow">Kanalımızda yer alanlar</span><h2>Gezdiğimiz mekânlar ve etkinlikler</h2></div></div>
      <ul class="chips">${FEATURED_PLACES.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    </section>
    <section class="wrap section" id="iletisim">
      <div class="bio" style="align-items:start">
        <div style="display:grid;gap:16px;min-width:0">
          <span class="eyebrow">İletişim</span>
          <h2>Bize yazın</h2>
          <p class="lead">Formu doldurun, mesajınızı hazırlayalım. Genellikle birkaç gün içinde dönüş yapıyoruz.</p>
          <div class="contact-lines">
            <div><span class="eyebrow">Instagram</span><br><a href="https://instagram.com/${CONFIG.instagram}" target="_blank" rel="noopener">@${CONFIG.instagram}</a></div>
            <div><span class="eyebrow">E-posta</span><br>${emailLine}</div>
            <div><span class="eyebrow">YouTube</span><br><a href="${CONFIG.youtube}" target="_blank" rel="noopener">youtube.com/@iyigibitv</a></div>
          </div>
        </div>
        <form class="form" id="collab-form" novalidate>
          <div class="row">
            <label for="f-name">Adınız<input id="f-name" name="name" required autocomplete="name"></label>
            <label for="f-brand">Marka / şirket<input id="f-brand" name="brand" autocomplete="organization"></label>
          </div>
          <div class="row">
            <label for="f-mail">E-posta<input id="f-mail" name="mail" type="email" required autocomplete="email"></label>
            <label for="f-type">İş birliği türü
              <select id="f-type" name="type">${OFFERS.map(([t]) => `<option>${t}</option>`).join("")}<option>Diğer</option></select>
            </label>
          </div>
          <label for="f-msg">Mesajınız<textarea id="f-msg" name="msg" required placeholder="Kısaca markanızdan ve aklınızdaki fikirden bahsedin."></textarea></label>
          <p id="f-error" style="color:var(--nar)" hidden>Lütfen adınızı, e-postanızı ve mesajınızı yazın.</p>
          <button class="btn btn-primary" type="submit" style="justify-self:start">Mesajı hazırla</button>
          <div class="form-out" id="f-out" hidden>
            <pre id="f-text"></pre>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <button class="btn btn-ghost" type="button" id="f-copy">Metni kopyala</button>
              ${CONFIG.email ? `<a class="btn btn-primary" id="f-mailto" href="#">E-posta ile gönder</a>` : `<a class="btn btn-primary" href="https://instagram.com/${CONFIG.instagram}" target="_blank" rel="noopener">Instagram'dan gönder</a>`}
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
      const text = `Merhaba İyi Gibi TV,\n\n${g("msg")}\n\nİş birliği türü: ${g("type")}\n${g("name")}${g("brand") ? " · " + g("brand") : ""}\n${g("mail")}`;
      document.getElementById("f-text").textContent = text;
      document.getElementById("f-out").hidden = false;
      const m = document.getElementById("f-mailto");
      if (m) m.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("İş birliği: " + (g("brand") || g("name")))}&body=${encodeURIComponent(text)}`;
    });
    document.getElementById("f-copy").addEventListener("click", (e) => {
      const btn = e.currentTarget;
      const text = document.getElementById("f-text").textContent;
      const done = () => { btn.textContent = "Kopyalandı"; setTimeout(() => (btn.textContent = "Metni kopyala"), 2000); };
      const fallback = () => { const r = document.createRange(); r.selectNodeContents(document.getElementById("f-text")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = "Metin seçildi, kopyalayın"; };
      try { navigator.clipboard.writeText(text).then(done, fallback); } catch (_) { fallback(); }
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
  const BINDS = { videolar: bindVideos, isbirligi: bindCollab };
  const TITLES = Object.fromEntries(ROUTES);

  function navHtml() {
    return ROUTES.map(([k, l]) => `<a href="#${k}" data-route="${k}">${l}</a>`).join("");
  }
  document.getElementById("nav").innerHTML = navHtml();
  document.getElementById("footer-nav").innerHTML = navHtml() + `<a href="https://instagram.com/${CONFIG.instagram}" target="_blank" rel="noopener">Instagram</a><a href="${CONFIG.youtube}" target="_blank" rel="noopener">YouTube</a>`;
  document.getElementById("footer-data").textContent = `Kanal verileri YouTube'dan alınmıştır · ${date(D.channel.updated)} · ${num(D.channel.videoCount)} video`;

  let current = null;
  let pendingScroll = null;
  function render() {
    const route = (location.hash || "#anasayfa").slice(1);
    const key = PAGES[route] ? route : "anasayfa";
    app.removeEventListener("click", videosClick);
    if (key !== "videolar" && current === "videolar") { /* filtreler hafızada kalır */ }
    app.innerHTML = `<div class="page">${PAGES[key]()}</div>`;
    (BINDS[key] || (() => {}))();
    document.querySelectorAll("[data-route]").forEach((a) => (a.dataset.route === key ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    document.title = key === "anasayfa" ? "İyi Gibi TV" : `${TITLES[key]} · İyi Gibi TV`;
    document.getElementById("nav").classList.remove("open");
    document.getElementById("menu-btn").setAttribute("aria-expanded", "false");
    if (pendingScroll) {
      const el = document.getElementById(pendingScroll);
      pendingScroll = null;
      if (el) { requestAnimationFrame(() => el.scrollIntoView({ block: "start" })); }
    } else if (current !== null) window.scrollTo(0, 0);
    current = key;
  }

  // Genel tıklama: oynatma ve filtreli geçişler
  document.addEventListener("click", (e) => {
    const p = e.target.closest("[data-play]");
    if (p) { e.preventDefault(); play(p.dataset.play); return; }
    const a = e.target.closest("a[href^='#']");
    if (!a) return;
    if (a.dataset.placeJump) pendingScroll = "yer-" + a.dataset.placeJump;
    if (a.getAttribute("href") === "#videolar") {
      vstate.place = a.dataset.place || null;
      vstate.playlist = null;
      vstate.topic = "all";
      vstate.q = "";
      vstate.limit = 24;
      vstate.format = a.dataset.format || "all";
      vstate.sort = a.dataset.sort || "new";
    }
    if (a.getAttribute("href") === location.hash) { e.preventDefault(); render(); }
  });

  // Kapak görseli yüklenmezse: yedeği dene, o da yoksa kaldır (tasarlanmış kapak görünür)
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    if (img.dataset.fallback) { const f = img.dataset.fallback; delete img.dataset.fallback; img.src = f; return; }
    if (img.classList.contains("yt") || "hideOnError" in img.dataset) img.remove();
  }, true);
  // maxresdefault bulunmayınca YouTube 120px gri görsel döndürür; onu da yedekle değiştir
  document.addEventListener("load", (e) => {
    const img = e.target;
    if (img instanceof HTMLImageElement && img.dataset.fallback && img.naturalWidth <= 120) { const f = img.dataset.fallback; delete img.dataset.fallback; img.src = f; }
  }, true);

  document.getElementById("menu-btn").addEventListener("click", (e) => {
    const nav = document.getElementById("nav");
    const open = nav.classList.toggle("open");
    e.currentTarget.setAttribute("aria-expanded", String(open));
  });

  window.addEventListener("hashchange", render);
  render();
})();

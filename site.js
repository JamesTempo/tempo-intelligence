// ===== Settings: change this =====
const BOOKING_URL = "https://cal.com/james-elalouf-jhoqaf/discovery";

// Shared behaviour for every Tempo Labs page.
// Each page sets window.FR = {...} (French text) before loading this file,
// and can set Site.update = fn to re-render numbers when the language changes.
const Site = {
  lang: "en",
  update: null,
  money(n){
    return this.lang === "fr"
      ? Math.round(n).toLocaleString("fr-CA") + " $"
      : "$" + Math.round(n).toLocaleString("en-CA");
  },
  num(n, d = 0){ return n.toLocaleString(this.lang === "fr" ? "fr-CA" : "en-CA", {maximumFractionDigits: d}); },
  t(en, fr){ return this.lang === "fr" ? fr : en; }
};

(() => {
  const FR = window.FR || {};
  const EN = {};
  const textEls = document.querySelectorAll("[data-i18n]");
  const htmlEls = document.querySelectorAll("[data-i18n-html]");
  const phEls = document.querySelectorAll("[data-i18n-ph]");
  textEls.forEach(el => EN[el.dataset.i18n] = el.textContent);
  htmlEls.forEach(el => EN[el.dataset.i18nHtml] = el.innerHTML);
  phEls.forEach(el => EN[el.dataset.i18nPh] = el.placeholder);
  const titleEN = document.title, titleFR = document.documentElement.dataset.titleFr || titleEN;

  function setLang(l){
    Site.lang = l;
    const d = l === "fr" ? FR : EN;
    document.documentElement.lang = l;
    textEls.forEach(el => { const v = d[el.dataset.i18n]; if (v != null) el.textContent = v; });
    htmlEls.forEach(el => { const v = d[el.dataset.i18nHtml]; if (v != null) el.innerHTML = v; });
    phEls.forEach(el => { const v = d[el.dataset.i18nPh]; if (v != null) el.placeholder = v; });
    document.querySelectorAll(".lang button").forEach(b => b.classList.toggle("on", b.dataset.lang === l));
    document.title = l === "fr" ? titleFR : titleEN;
    try { localStorage.setItem("tempo-lang", l); } catch(e){}
    if (Site.update) Site.update();
  }
  document.querySelectorAll(".lang button").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));

  document.querySelectorAll("[data-calendly]").forEach(a => a.href = BOOKING_URL);

  // reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting){ x.target.classList.add("in"); io.unobserve(x.target); } }), {threshold: .1});
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  document.querySelectorAll(".yr").forEach(el => el.textContent = new Date().getFullYear());

  Site.init = () => {
    let saved = null; try { saved = localStorage.getItem("tempo-lang"); } catch(e){}
    setLang(saved || "fr");
  };
})();

// ===== Settings: change this =====
const CONTACT_EMAIL = "hello@yourdomain.com"; // where audit requests go

// Shared behaviour for every Tempo Labs page.
// Each page sets window.FR = {...} (French text) before loading this file,
// and can set Site.update = fn to re-render numbers when the language changes.
const Site = {
  lang: "en",
  update: null,
  money(n){
    return this.lang === "fr"
      ? Math.round(n).toLocaleString("fr-CA") + " $"
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

  // form → email draft (swap for Calendly / Formspree when live)
  const form = document.getElementById("form");
  if (form) form.addEventListener("submit", e => {
    e.preventDefault();
    const d = new FormData(form);
    const body = [...d.entries()].map(([k, v]) => `${k}: ${v}`).join("\n");
    const subj = Site.t("Free call: ", "Appel gratuit : ") + (d.get("company") || "");
    location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
  });

  // reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting){ x.target.classList.add("in"); io.unobserve(x.target); } }), {threshold: .1});
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  document.querySelectorAll(".yr").forEach(el => el.textContent = new Date().getFullYear());

  // missed-call calculator (Examples section)
  const calc = document.getElementById("calc");
  if (calc){
    const DEF = {calls: 40, miss: 27, book: 20, job: 400};
    const $ = id => document.getElementById(id);
    const inputs = {calls: $("c-calls"), miss: $("c-miss"), book: $("c-book"), job: $("c-job")};
    const panel = $("c-panel"), toggle = $("c-toggle"), reset = $("c-reset"), asm = $("c-asm");
    const swap = (el, showSecond) => { el.children[0].hidden = showSecond; el.children[1].hidden = !showSecond; };

    const read = () => {
      const v = {};
      for (const k in inputs){
        let n = parseFloat(String(inputs[k].value).replace(",", "."));
        if (!isFinite(n) || n < 0) n = 0;
        if (k === "miss" || k === "book") n = Math.min(n, 100);
        v[k] = n;
      }
      return v;
    };
    // round dollars to a sensible precision
    const roundMoney = n => n >= 10000 ? Math.round(n / 1000) * 1000 : n >= 1000 ? Math.round(n / 100) * 100 : Math.round(n / 10) * 10;
    const pct = n => Site.num(n, 1) + Site.t("%", " %");

    function render(){
      const v = read();
      const isDef = Object.keys(DEF).every(k => v[k] === DEF[k]);
      const yr = Math.round(v.calls * 52);
      const missed = Math.round(yr * v.miss / 100);
      const jobs = Math.round(missed * v.book / 100);
      $("c-yr").textContent = Site.num(yr);
      $("c-missed").textContent = Site.num(missed);
      $("c-jobs").textContent = Site.num(jobs);
      $("c-total").textContent = Site.money(roundMoney(jobs * v.job));
      calc.querySelector('[data-c="calls"]').textContent = Site.num(v.calls, 1);
      calc.querySelector('[data-c="miss"]').textContent = pct(v.miss);
      calc.querySelector('[data-c="book"]').textContent = pct(v.book);
      calc.querySelector('[data-c="job"]').textContent = Site.money(v.job);
      swap(calc.querySelector(".pill"), !isDef);
      swap(calc.querySelector("h3"), !isDef);
      reset.hidden = isDef;
    }

    function setOpen(open){
      panel.hidden = !open;
      asm.hidden = open;
      toggle.setAttribute("aria-expanded", String(open));
      swap(toggle, open);
      if (open) inputs.calls.focus();
    }

    toggle.addEventListener("click", () => setOpen(panel.hidden));
    reset.addEventListener("click", () => { for (const k in DEF) inputs[k].value = DEF[k]; render(); });
    for (const k in inputs) inputs[k].addEventListener("input", render);

    const prev = Site.update;
    Site.update = () => { if (prev) prev(); render(); };
    for (const k in DEF) inputs[k].value = DEF[k]; // ignore values the browser restores on reload
    render();
  }

  Site.init = () => {
    let saved = null; try { saved = localStorage.getItem("tempo-lang"); } catch(e){}
    const browserFR = (navigator.language || "").toLowerCase().startsWith("fr");
    setLang(saved || (browserFR ? "fr" : "en"));
  };
})();

(() => {
  "use strict";

  const { wa, langRoute, defects, models, products, i18n } = window.CC;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const storage = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } },
  };

  const OTHER = "__other";
  const CATEGORIES = ["protect", "power", "audio", "mount"];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    lang: "pt",
    brand: "",
    model: "",
    other: "",
    defects: new Set(),
    route: "br",
    routeTouched: false,
    filter: "all",
    errors: {},
  };

  const t = (k) => i18n[state.lang][k] ?? i18n.pt[k] ?? k;

  const PLATES = {
    case: '<svg viewBox="0 0 200 150"><rect x="62" y="12" width="76" height="126" rx="16"/><rect class="nf" x="68" y="18" width="64" height="114" rx="11"/><rect class="nf" x="74" y="24" width="28" height="28" rx="8"/><circle class="nf" cx="83" cy="33" r="4.5"/><circle class="nf" cx="93" cy="43" r="4.5"/></svg>',
    silicone: '<svg viewBox="0 0 200 150"><rect x="62" y="12" width="76" height="126" rx="16"/><rect class="nf" x="72" y="22" width="26" height="26" rx="8"/><circle class="nf" cx="81" cy="31" r="4.5"/><circle class="nf" cx="100" cy="92" r="13"/></svg>',
    glass: '<svg viewBox="0 0 200 150"><rect class="nf" x="76" y="26" width="60" height="112" rx="10"/><rect x="70" y="20" width="60" height="112" rx="10"/><rect class="nf" x="90" y="27" width="20" height="5" rx="2.5"/><path class="nf" d="M82 104 108 58M92 120 120 70"/></svg>',
    charger: '<svg viewBox="0 0 200 150"><rect x="82" y="16" width="8" height="24" rx="2"/><rect x="110" y="16" width="8" height="24" rx="2"/><rect x="68" y="38" width="64" height="76" rx="10"/><rect class="nf" x="86" y="98" width="28" height="9" rx="4.5"/><path class="sf" d="M104 50 90 76h11l-4 17 15-27h-11z"/></svg>',
    cable: '<svg viewBox="0 0 200 150"><path class="nf" d="M44 112C40 44 124 40 126 86s48 30 34-34" stroke-width="4"/><rect x="32" y="108" width="22" height="18" rx="4"/><rect x="150" y="26" width="22" height="22" rx="4" transform="rotate(14 161 37)"/></svg>',
    bank: '<svg viewBox="0 0 200 150"><rect x="54" y="26" width="92" height="96" rx="14"/><rect class="nf" x="116" y="20" width="22" height="10" rx="5"/><path class="nf" d="M72 52h56M72 66h34"/><circle class="sf" cx="74" cy="102" r="4"/><circle class="sf" cx="90" cy="102" r="4"/><circle class="sf" cx="106" cy="102" r="4"/><circle class="nf" cx="122" cy="102" r="4"/></svg>',
    tws: '<svg viewBox="0 0 200 150"><path d="M78 16a11 11 0 0 1 22 0v26a9 9 0 0 1-18 0z" transform="rotate(-8 90 30)"/><path d="M110 16a11 11 0 0 1 22 0v26a9 9 0 0 1-18 0z" transform="rotate(8 120 30)"/><rect x="54" y="76" width="92" height="56" rx="28"/><path class="nf" d="M54 100h92"/><circle class="sf" cx="100" cy="116" r="4"/></svg>',
    wired: '<svg viewBox="0 0 200 150"><path class="nf" d="M50 98V82a50 50 0 0 1 100 0v16" stroke-width="6"/><rect x="36" y="90" width="26" height="44" rx="11"/><rect x="138" y="90" width="26" height="44" rx="11"/></svg>',
    speaker: '<svg viewBox="0 0 200 150"><rect x="38" y="40" width="124" height="68" rx="34"/><path class="nf" d="M66 60v28M80 54v40M94 60v28"/><circle class="sf" cx="130" cy="74" r="5"/><path class="nf" d="M118 90h24"/></svg>',
    carmount: '<svg viewBox="0 0 200 150"><rect x="58" y="12" width="84" height="56" rx="8"/><rect class="nf" x="66" y="20" width="68" height="40" rx="4"/><rect x="44" y="28" width="14" height="24" rx="5"/><rect x="142" y="28" width="14" height="24" rx="5"/><path class="nf" d="M100 68v46" stroke-width="6"/><ellipse cx="100" cy="124" rx="28" ry="10"/></svg>',
    ring: '<svg viewBox="0 0 200 150"><circle cx="100" cy="62" r="36"/><circle class="nf" cx="100" cy="62" r="20"/><rect x="62" y="110" width="76" height="22" rx="11"/><path class="nf" d="M100 98v12"/></svg>',
    tripod: '<svg viewBox="0 0 200 150"><rect x="78" y="6" width="44" height="58" rx="8"/><rect x="90" y="64" width="20" height="14" rx="3"/><path class="nf" d="M100 78 62 142M100 78v64M100 78l38 64"/></svg>',
  };

  const waUrl = (route, text) => `https://wa.me/${wa[route].number}?text=${encodeURIComponent(text)}`;

  function pickLang() {
    const param = new URLSearchParams(location.search).get("lang");
    if (param === "es" || param === "pt") return param;
    const saved = storage.get("cc-lang");
    if (saved === "es" || saved === "pt") return saved;
    return (navigator.language || "").toLowerCase().startsWith("es") ? "es" : "pt";
  }

  /* ---------- i18n ---------- */

  function applyI18n() {
    document.documentElement.lang = state.lang === "es" ? "es" : "pt-BR";
    document.title = t("doc.title");
    $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$("[data-i18n-attr]").forEach((el) => {
      el.dataset.i18nAttr.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":");
        el.setAttribute(attr, t(key));
      });
    });
    $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)));
    if (!state.routeTouched) {
      state.route = langRoute[state.lang];
      syncRouteRadios();
    }
    renderModels();
    renderErrors();
    renderSummary();
    updateWaLinks();
    hideStatus();
  }

  function setLang(lang) {
    state.lang = lang;
    storage.set("cc-lang", lang);
    applyI18n();
  }

  /* ---------- quote form ---------- */

  const form = $("#quote-form");
  const modelSel = $("#model");

  function buildChips() {
    $("#chips").innerHTML = defects
      .map((k) => `<label class="chip"><input type="checkbox" name="defect" value="${k}"><span data-i18n="d.${k}.n"></span></label>`)
      .join("");
  }

  function renderModels() {
    const prev = state.model;
    modelSel.innerHTML = "";
    if (!state.brand) {
      modelSel.append(new Option(t("q.model.first"), ""));
      modelSel.disabled = true;
      return;
    }
    modelSel.disabled = false;
    modelSel.append(new Option(t("q.model.ph"), ""));
    for (const [group, list] of models[state.brand]) {
      const og = document.createElement("optgroup");
      og.label = group;
      list.forEach((m) => og.append(new Option(m, m)));
      modelSel.append(og);
    }
    modelSel.append(new Option(t("q.model.other"), OTHER));
    modelSel.value = prev;
  }

  function syncRouteRadios() {
    $$('input[name="route"]').forEach((r) => { r.checked = r.value === state.route; });
  }

  function deviceLabel() {
    if (!state.brand) return "";
    const m = state.model === OTHER ? state.other.trim() : state.model;
    if (!m) return state.brand;
    return m.toLowerCase().includes(state.brand.toLowerCase()) ? m : `${m} (${state.brand})`;
  }

  function defectsLabel() {
    return defects.filter((k) => state.defects.has(k)).map((k) => t(`d.${k}.n`)).join(", ");
  }

  function setSummary(el, text) {
    el.textContent = text || t("q.sum.empty");
    el.classList.toggle("is-empty", !text);
  }

  function renderSummary() {
    setSummary($("#sum-device"), deviceLabel());
    setSummary($("#sum-defects"), defectsLabel());
  }

  function validate() {
    const errors = {};
    if (!state.brand) errors.brand = "q.err.brand";
    else if (!state.model) errors.model = "q.err.model";
    else if (state.model === OTHER && !state.other.trim()) errors.model = "q.err.other";
    if (!state.defects.size) errors.defects = "q.err.defects";
    return errors;
  }

  function renderErrors() {
    for (const field of ["brand", "model", "defects"]) {
      const el = $(`#err-${field}`);
      const key = state.errors[field];
      el.hidden = !key;
      el.textContent = key ? t(key) : "";
    }
    $("#step-brand").classList.toggle("has-error", Boolean(state.errors.brand));
    $("#step-defects").classList.toggle("has-error", Boolean(state.errors.defects));
    modelSel.setAttribute("aria-invalid", String(Boolean(state.errors.model)));
    $("#other-model").setAttribute("aria-invalid", String(state.errors.model === "q.err.other"));
  }

  function clearError(field) {
    if (!state.errors[field]) return;
    delete state.errors[field];
    renderErrors();
  }

  function syncOtherField() {
    const show = state.model === OTHER;
    $("#other-wrap").hidden = !show;
    return show;
  }

  function focusFirstError() {
    const target = state.errors.brand ? $('input[name="brand"]')
      : state.errors.model ? (state.model === OTHER ? $("#other-model") : modelSel)
      : $('input[name="defect"]');
    target.scrollIntoView({ block: "center", behavior: reducedMotion ? "auto" : "smooth" });
    target.focus({ preventScroll: true });
  }

  function quoteMessage() {
    const details = $("#details").value.trim();
    const name = $("#name").value.trim();
    const lines = [t("q.msg.hi"), "", `${t("q.msg.device")}: ${deviceLabel()}`, `${t("q.msg.defects")}: ${defectsLabel()}`];
    if (details) lines.push(`${t("q.msg.details")}: ${details}`);
    if (name) lines.push(`${t("q.msg.name")}: ${name}`);
    lines.push("", t("q.msg.foot"));
    return lines.join("\n");
  }

  function showStatus(url) {
    const box = $("#status");
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = t("q.fallback");
    box.replaceChildren(`${t("q.opening")} `, link);
    box.hidden = false;
  }

  function hideStatus() {
    $("#status").hidden = true;
  }

  function bindForm() {
    $$('input[name="brand"]').forEach((r) => r.addEventListener("change", () => {
      state.brand = r.value;
      state.model = "";
      state.other = "";
      $("#other-model").value = "";
      renderModels();
      syncOtherField();
      clearError("brand");
      clearError("model");
      renderSummary();
    }));

    modelSel.addEventListener("change", () => {
      state.model = modelSel.value;
      if (syncOtherField()) $("#other-model").focus();
      clearError("model");
      renderSummary();
    });

    $("#other-model").addEventListener("input", (e) => {
      state.other = e.target.value;
      clearError("model");
      renderSummary();
    });

    $("#chips").addEventListener("change", (e) => {
      const { value, checked } = e.target;
      if (checked) state.defects.add(value); else state.defects.delete(value);
      clearError("defects");
      renderSummary();
    });

    $$('input[name="route"]').forEach((r) => r.addEventListener("change", () => {
      state.route = r.value;
      state.routeTouched = true;
      updateWaLinks();
      hideStatus();
    }));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      state.errors = validate();
      renderErrors();
      if (Object.keys(state.errors).length) { focusFirstError(); return; }
      const url = waUrl(state.route, quoteMessage());
      window.open(url, "_blank", "noopener");
      showStatus(url);
    });

    $$(".svc").forEach((btn) => btn.addEventListener("click", () => startQuoteWith(btn.dataset.defect)));
  }

  function startQuoteWith(defect) {
    const chip = $(`input[name="defect"][value="${defect}"]`);
    chip.checked = true;
    state.defects.add(defect);
    clearError("defects");
    renderSummary();
    $("#orcamento").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    const next = !state.brand ? $('input[name="brand"]') : !state.model ? modelSel : $('button[type="submit"]', form);
    setTimeout(() => next.focus({ preventScroll: true }), reducedMotion ? 0 : 500);
  }

  /* ---------- showcase ---------- */

  function buildShop() {
    $("#filters").innerHTML = ["all", ...CATEGORIES]
      .map((c) => `<button type="button" data-cat="${c}" aria-pressed="${c === "all"}" data-i18n="${c === "all" ? "shop.all" : `cat.${c}`}"></button>`)
      .join("");

    $("#grid").innerHTML = products.map((p) => `
      <li class="tile${p.featured ? " is-featured" : ""}" data-cat="${p.cat}">
        <div class="plate plate--${p.cat}" aria-hidden="true">${PLATES[p.id]}</div>
        <span class="tile-cat" data-i18n="cat.${p.cat}"></span>
        <h3 data-i18n="p.${p.id}"></h3>
        <p class="price"><span data-i18n="shop.from"></span><b>US$ ${p.price}</b></p>
        <a class="btn btn--ghost-ink btn--sm btn--block" data-product="${p.id}" href="#" target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="#i-wa"/></svg><span data-i18n="shop.ask"></span></a>
      </li>`).join("");

    $("#filters").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-cat]");
      if (!btn) return;
      state.filter = btn.dataset.cat;
      $$("#filters button").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      $$("#grid .tile").forEach((tile) => { tile.hidden = state.filter !== "all" && tile.dataset.cat !== state.filter; });
    });
  }

  function updateWaLinks() {
    $$('[data-wa="generic"]').forEach((a) => { a.href = waUrl(state.route, t("wa.generic")); });
    $$("[data-product]").forEach((a) => {
      const name = t(`p.${a.dataset.product}`);
      a.href = waUrl(state.route, t("p.msg").replace("{name}", name));
      a.setAttribute("aria-label", `${t("shop.ask")}: ${name}`);
    });
  }

  /* ---------- motion + chrome ---------- */

  function observeReveals() {
    const items = $$(".reveal");
    if (!("IntersectionObserver" in window)) { items.forEach((el) => el.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach((el) => io.observe(el));
  }

  function observeDock() {
    const dock = $("#dock");
    if (!("IntersectionObserver" in window)) return;
    const covering = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? covering.add(en.target) : covering.delete(en.target)));
      dock.classList.toggle("is-hidden", covering.size > 0);
    }, { threshold: 0.12 });
    [$("#top .hero-actions"), $("#orcamento")].forEach((el) => io.observe(el));
  }

  function openDiagram() {
    const dg = $(".diagram");
    requestAnimationFrame(() => requestAnimationFrame(() => dg.classList.add("is-open")));
  }

  /* ---------- init ---------- */

  state.lang = pickLang();
  state.route = langRoute[state.lang];
  buildChips();
  buildShop();
  bindForm();
  $$(".lang button").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
  applyI18n();
  observeReveals();
  observeDock();
  openDiagram();
})();

/**
 * Glass styling injector for the Home Assistant tablet dashboard.
 * Hosted publicly so HA Container can load it as a Lovelace module resource.
 */
(function () {
  const STYLE_ID = "kliqer-glass-dashboard-style";
  const KIOSK_STYLE_ID = "kliqer-tablet-kiosk-style";

  const css = `
    :root,
    home-assistant,
    hui-root {
      --primary-text-color: rgba(255,255,255,.94);
      --secondary-text-color: rgba(255,255,255,.68);
      --disabled-text-color: rgba(255,255,255,.36);
      --divider-color: rgba(255,255,255,.10);
      --card-background-color: rgba(12,12,30,.48);
      --ha-card-background: rgba(12,12,30,.48);
      --ha-card-border-color: rgba(255,255,255,.12);
      --ha-card-border-radius: 18px;
      --state-icon-color: rgba(255,255,255,.76);
      --state-icon-active-color: rgba(132,195,255,.96);
      --tile-color: rgba(132,195,255,.92);
      --tile-icon-color: rgba(255,255,255,.82);
      --tile-on-icon-color: rgba(132,195,255,.96);
      --tile-name-text-color: rgba(255,255,255,.96);
      --tile-state-text-color: rgba(255,255,255,.72);
      --app-header-background-color: rgba(7,10,22,.72);
      --app-header-text-color: rgba(255,255,255,.90);
      --app-header-selection-bar-color: rgba(132,195,255,.96);
      --sidebar-background-color: rgba(8,8,20,.82);
      --sidebar-icon-color: rgba(255,255,255,.58);
      --sidebar-text-color: rgba(255,255,255,.76);
      --sidebar-selected-icon-color: rgba(132,195,255,.96);
      --sidebar-selected-text-color: rgba(132,195,255,.96);
    }

    body,
    home-assistant,
    home-assistant-main,
    ha-panel-lovelace,
    hui-root,
    hui-view,
    hui-sections-view,
    .ha-scrollbar {
      background:
        radial-gradient(circle at 18% 16%, rgba(44,122,172,.64), transparent 36%),
        radial-gradient(circle at 82% 15%, rgba(124,55,190,.66), transparent 34%),
        radial-gradient(circle at 26% 80%, rgba(24,104,154,.54), transparent 36%),
        linear-gradient(135deg, #030615 0%, #13082f 48%, #030512 100%) !important;
      background-attachment: fixed !important;
    }

    ha-card {
      background: rgba(12,12,30,.48) !important;
      border: 1px solid rgba(255,255,255,.12) !important;
      border-radius: 18px !important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.08),
        0 14px 36px rgba(0,0,0,.24) !important;
      color: rgba(255,255,255,.94) !important;
      backdrop-filter: blur(22px) saturate(180%) !important;
      -webkit-backdrop-filter: blur(22px) saturate(180%) !important;
      overflow: hidden;
    }

    ha-card h1,
    ha-card h2,
    ha-card h3,
    ha-card p {
      color: rgba(255,255,255,.94) !important;
    }

    ha-card .primary,
    ha-card .name,
    ha-card ha-tile-info,
    ha-card ha-tile-info * {
      color: rgba(255,255,255,.94) !important;
    }

    ha-card .secondary,
    ha-card .state {
      color: rgba(255,255,255,.70) !important;
    }

    ha-tabs,
    paper-tabs,
    .mdc-tab-bar {
      background: rgba(9,10,25,.45) !important;
      border-bottom: 1px solid rgba(255,255,255,.10) !important;
      backdrop-filter: blur(18px) saturate(160%) !important;
      -webkit-backdrop-filter: blur(18px) saturate(160%) !important;
    }

    .section-header,
    hui-section > .header,
    .hui-view-section-title {
      color: rgba(255,255,255,.56) !important;
      font-size: 11px !important;
      font-weight: 650 !important;
      letter-spacing: .10em !important;
      text-transform: uppercase !important;
    }

    .ha-scrollbar {
      background: transparent !important;
    }

    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,.22);
      border-radius: 999px;
    }
  `;

  function inject() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function isTabletDashboard() {
    return (
      location.pathname.includes("/lovelace-apple") &&
      !location.search.includes("disable_km")
    );
  }

  const kioskCss = `
    app-header,
    app-toolbar,
    app-header-layout > app-header,
    app-header-layout app-toolbar,
    ha-menu-button,
    ha-button-menu,
    ha-icon-button[slot="actionItems"],
    app-toolbar ha-icon-button,
    app-toolbar ha-button-menu,
    app-toolbar [slot="actionItems"],
    app-toolbar .action-items,
    app-toolbar .toolbar-actions,
    ha-sidebar,
    home-assistant-sidebar,
    app-drawer,
    wa-drawer,
    .sidebar-shell,
    [drawer] {
      display: none !important;
      width: 0 !important;
      min-width: 0 !important;
      height: 0 !important;
      min-height: 0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }

    app-header-layout {
      padding-top: 0 !important;
    }

    app-drawer-layout {
      --app-drawer-width: 0px !important;
    }

    .app-content {
      padding-inline-start: 0 !important;
      width: 100% !important;
      max-width: none !important;
    }

    home-assistant-main {
      --ha-sidebar-width: 0px !important;
      --mdc-top-app-bar-width: 100% !important;
      --safe-area-content-inset-left: 0px !important;
      margin-left: 0 !important;
      padding-left: 0 !important;
    }

    app-drawer-layout [main],
    #drawerLayout > [main],
    #main,
    #content,
    .content,
    partial-panel-resolver,
    ha-panel-lovelace {
      margin-left: 0 !important;
      left: 0 !important;
      width: 100% !important;
      max-width: none !important;
    }
  `;

  function injectKioskStyle(root) {
    const target = root.head || root;
    if (
      !target ||
      root.getElementById?.(KIOSK_STYLE_ID) ||
      target.querySelector?.(`#${KIOSK_STYLE_ID}`)
    ) {
      return;
    }

    const style = document.createElement("style");
    style.id = KIOSK_STYLE_ID;
    style.textContent = kioskCss;
    target.appendChild(style);
  }

  function visitShadowRoots(root, seen = new Set()) {
    if (!root || seen.has(root)) return;
    seen.add(root);
    injectKioskStyle(root);

    root.querySelectorAll?.("*").forEach((el) => {
      applyKioskElementFixes(el);
      if (el.shadowRoot) visitShadowRoots(el.shadowRoot, seen);
    });
  }

  function applyKioskElementFixes(el) {
    const tag = el.localName;

    if (tag === "app-drawer-layout") {
      el.setAttribute("force-narrow", "");
      el.setAttribute("narrow", "");
      el.forceNarrow = true;
      el.narrow = true;
      el.style.setProperty("--app-drawer-width", "0px", "important");
      el.style.setProperty("margin-left", "0", "important");
      el.style.setProperty("padding-left", "0", "important");
    }

    if (tag === "ha-drawer") {
      el.type = "modal";
      el.open = false;
      el.setAttribute("type", "modal");
      el.removeAttribute("open");
      el.style.setProperty("pointer-events", "auto", "important");
    }

    if (
      tag === "app-header" ||
      tag === "app-toolbar" ||
      tag === "app-drawer" ||
      tag === "wa-drawer" ||
      tag === "ha-sidebar" ||
      tag === "home-assistant-sidebar" ||
      el.hasAttribute("drawer")
    ) {
      el.style.setProperty("display", "none", "important");
      el.style.setProperty("width", "0", "important");
      el.style.setProperty("min-width", "0", "important");
      el.style.setProperty("max-width", "0", "important");
    }

    if (
      tag === "ha-button-menu" ||
      (tag === "ha-icon-button" && el.getAttribute("slot") === "actionItems")
    ) {
      el.style.setProperty("display", "none", "important");
      el.style.setProperty("pointer-events", "none", "important");
    }

    if (
      tag === "home-assistant-main" ||
      tag === "partial-panel-resolver" ||
      tag === "ha-panel-lovelace" ||
      tag === "hui-root" ||
      tag === "hui-view"
    ) {
      if (tag === "home-assistant-main") {
        el.setAttribute("modal", "");
        el.removeAttribute("expanded");
        el.style.setProperty("--ha-sidebar-width", "0px", "important");
        el.style.setProperty("--mdc-top-app-bar-width", "100%", "important");
        el.style.setProperty("--safe-area-content-inset-left", "0px", "important");
        if (el.hass) {
          el.hass.kioskMode = true;
          el.hass.dockedSidebar = "always_hidden";
          el.requestUpdate?.();
        }
      }
      el.style.setProperty("margin-left", "0", "important");
      el.style.setProperty("left", "0", "important");
      el.style.setProperty("width", "100%", "important");
      el.style.setProperty("max-width", "none", "important");
    }
  }

  function removeKioskStyles(root = document, seen = new Set()) {
    if (!root || seen.has(root)) return;
    seen.add(root);

    root.getElementById?.(KIOSK_STYLE_ID)?.remove();
    root.querySelector?.(`#${KIOSK_STYLE_ID}`)?.remove();
    root.querySelectorAll?.("*").forEach((el) => {
      if (el.shadowRoot) removeKioskStyles(el.shadowRoot, seen);
    });
  }

  function forceKioskLayout() {
    if (!isTabletDashboard()) {
      document.documentElement.classList.remove("kliqer-tablet-kiosk");
      removeKioskStyles();
      return;
    }

    document.documentElement.classList.add("kliqer-tablet-kiosk");
    visitShadowRoots(document);
  }

  if (document.head) inject();
  else document.addEventListener("DOMContentLoaded", inject);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", forceKioskLayout);
  } else {
    forceKioskLayout();
  }

  const observer = new MutationObserver(forceKioskLayout);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  let tries = 0;
  const kioskTimer = window.setInterval(() => {
    forceKioskLayout();
    tries += 1;
    if (tries > 24) window.clearInterval(kioskTimer);
  }, 500);

  window.addEventListener("location-changed", () => {
    inject();
    forceKioskLayout();
  });
})();

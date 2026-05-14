/**
 * Glass styling injector for the Home Assistant tablet dashboard.
 * Hosted publicly so HA Container can load it as a Lovelace module resource.
 */
(function () {
  const STYLE_ID = "kliqer-glass-dashboard-style";

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

  if (document.head) inject();
  else document.addEventListener("DOMContentLoaded", inject);

  window.addEventListener("location-changed", inject);
})();

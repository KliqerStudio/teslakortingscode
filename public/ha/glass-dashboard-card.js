class GlassDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._tab = "ov";
    this._timer = null;
    this._config = {};
    this.entities = {
      mainLights: [
        "light.lounge_light",
        "light.living_room",
        "light.reading_light",
        "light.dining_room",
        "light.led_keuken_boven",
        "light.led_keuken_onder",
        "light.led_strip_4",
        "light.govee_tv_left",
        "light.govee_tv_right",
        "light.rgbic_tv_backlight",
        "light.tv_left",
        "light.tv_right",
      ],
      bedroomLights: ["light.bed", "light.marylin", "switch.night_light", "light.kast", "light.closet"],
      gameLights: ["light.plafond", "light.desk_lamp", "light.desk_led_strip", "light.battletron_smart_desk_light_strip", "light.battletron_smart_desk_light_strip_2"],
      utilityLights: ["light.toilet", "light.hallway_door", "light.ants_closet", "light.watch_light"],
      livingTemp: "sensor.living_room_sensor_temperature",
      livingHumidity: "sensor.living_room_sensor_humidity",
      livingAir: "sensor.living_room_sensor_air_quality",
      bedTemp: "sensor.bedroom_sensor_temperature",
      bedHumidity: "sensor.bedroom_sensor_humidity",
      bedAir: "sensor.bedroom_sensor_air_quality",
      weather: "weather.forecast_home",
      teslaClimate: "climate.model_3_climate",
      teslaBattery: "sensor.model_3_battery_level",
      teslaRange: "sensor.model_3_battery_range",
      teslaLocation: "device_tracker.model_3_location",
      teslaDefrost: "switch.model_3_defrost",
      teslaSentry: "switch.model_3_sentry_mode",
      teslaCharge: "switch.model_3_charge",
      teslaLock: "lock.model_3_lock",
      spotify: "media_player.spotify_tristan_pahud_de_mortanges",
    };
  }

  setConfig(config) {
    this._config = config || {};
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
    if (!this._timer) {
      this._timer = window.setInterval(() => this.updateClock(), 10000);
    }
  }

  disconnectedCallback() {
    if (this._timer) window.clearInterval(this._timer);
    this._timer = null;
  }

  getCardSize() {
    return 12;
  }

  st(entity, fallback = "Unknown") {
    const state = this._hass?.states?.[entity]?.state;
    if (!state || state === "unavailable" || state === "unknown") return fallback;
    return state;
  }

  attr(entity, key, fallback = undefined) {
    return this._hass?.states?.[entity]?.attributes?.[key] ?? fallback;
  }

  fmt(entity, suffix = "", fallback = "Unknown", digits = 0) {
    const raw = this.st(entity, fallback);
    const n = Number(raw);
    if (!Number.isFinite(n)) return raw;
    return `${n.toFixed(digits)}${suffix}`;
  }

  isOn(entity) {
    return ["on", "heat", "cool", "playing", "home"].includes(this._hass?.states?.[entity]?.state);
  }

  anyOn(entities) {
    return entities.some((entity) => this.isOn(entity));
  }

  countOn(entities) {
    return entities.filter((entity) => this.isOn(entity)).length;
  }

  service(domain, service, data) {
    return this._hass?.callService(domain, service, data);
  }

  toggleEntity(entity) {
    const domain = entity.split(".")[0];
    this.service(domain, "toggle", { entity_id: entity });
  }

  toggleGroup(entities) {
    this.service("homeassistant", "toggle", { entity_id: entities });
  }

  turnOffAll() {
    this.service("homeassistant", "turn_off", {
      entity_id: [
        ...this.entities.mainLights,
        ...this.entities.bedroomLights,
        ...this.entities.gameLights,
        ...this.entities.utilityLights,
      ],
    });
  }

  toggleClimate() {
    const current = this._hass?.states?.[this.entities.teslaClimate]?.state;
    this.service("climate", current === "off" ? "turn_on" : "turn_off", { entity_id: this.entities.teslaClimate });
  }

  weatherIcon(state) {
    const icons = {
      rainy: "mdi:weather-rainy",
      pouring: "mdi:weather-pouring",
      cloudy: "mdi:weather-cloudy",
      "partlycloudy": "mdi:weather-partly-cloudy",
      sunny: "mdi:weather-sunny",
      clear: "mdi:weather-night",
      fog: "mdi:weather-fog",
      snowy: "mdi:weather-snowy",
    };
    return icons[state] || "mdi:weather-partly-cloudy";
  }

  updateClock() {
    const time = this.shadowRoot.getElementById("clk-t");
    const date = this.shadowRoot.getElementById("clk-d");
    if (!time || !date) return;
    const now = new Date();
    time.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    date.textContent = now.toLocaleDateString([], { weekday: "short", day: "numeric", month: "long" });
  }

  render() {
    if (!this._hass) return;

    const e = this.entities;
    const livingOn = this.anyOn(e.mainLights);
    const bedroomOn = this.anyOn(e.bedroomLights);
    const gameOn = this.anyOn(e.gameLights);
    const utilityOn = this.anyOn(e.utilityLights);
    const battery = this.fmt(e.teslaBattery, "%", "Unknown");
    const batteryRaw = Number(this.st(e.teslaBattery, "0"));
    const range = this.fmt(e.teslaRange, " km", "Unknown", 0);
    const teslaPlace = this.st(e.teslaLocation, "Away");
    const weatherState = this.st(e.weather, "rainy");
    const weatherTemp = this.attr(e.weather, "temperature", "11.6");
    const spotifyTitle = this.attr(e.spotify, "media_title", "De Mortanges");
    const spotifyArtist = this.attr(e.spotify, "media_artist", "Spotify · Tristan Pahud");

    this.shadowRoot.innerHTML = `
      <style>${this.css()}</style>
      <ha-card>
        <div class="dash">
          <div class="bg"></div>
          <div class="topbar z1">
            <div class="home-lbl">Home</div>
            <div class="clock-wrap">
              <div class="clk-time" id="clk-t">00:00</div>
              <div class="clk-date" id="clk-d">Thu, 14 May</div>
            </div>
          </div>
          <div class="tabs z1">
            ${this.tab("ov", "mdi:view-dashboard-outline", "Overview")}
            ${this.tab("liv", "mdi:sofa-outline", "Living Room")}
            ${this.tab("bed", "mdi:bed-king-outline", "Master Bedroom")}
            ${this.tab("game", "mdi:gamepad-variant-outline", "Game Room")}
            ${this.tab("util", "mdi:home-floor-1", "Utility")}
          </div>
          <div class="divider z1"></div>
          <div class="page ${this._tab === "ov" ? "active" : ""} z1">
            <div class="g2">
              <div class="col">
                <section class="gl block">
                  <div class="slbl">Lights</div>
                  <div class="rooms5">
                    ${this.room("Main Room", "mdi:sofa-outline", livingOn, "main")}
                    ${this.room("Master Bed", "mdi:bed-king-outline", bedroomOn, "bedroom")}
                    ${this.room("Game Room", "mdi:gamepad-variant-outline", gameOn, "game")}
                    ${this.room("Utility", "mdi:home-floor-1", utilityOn, "utility")}
                    <button class="gl room alloff" data-action="all-off"><div class="rdot"></div><ha-icon class="ri" icon="mdi:power"></ha-icon><div class="rn">All Off</div></button>
                  </div>
                </section>
                ${this.climateSummary("Living Room · Climate", e.livingTemp, e.livingHumidity, e.livingAir)}
                ${this.climateSummary("Master Bedroom · Climate", e.bedTemp, e.bedHumidity, e.bedAir)}
                <section class="gl block weather">
                  <div class="slbl">Weather · De Mortanges</div>
                  <div class="wx-main">
                    <ha-icon class="wx-ico" icon="${this.weatherIcon(weatherState)}"></ha-icon>
                    <div><div class="wx-tmp">${weatherTemp}<span>°C</span></div><div class="wx-cond">${weatherState}</div></div>
                  </div>
                  <div class="wx-days">
                    ${this.day("Thu", weatherState, "11.6°", "6.8°")}
                    ${this.day("Fri", weatherState, "10.9°", "5.9°")}
                    ${this.day("Sat", weatherState, "12.1°", "5.5°")}
                  </div>
                </section>
              </div>
              <div class="col">
                <section class="gl tesla-card">
                  <div class="car-area">
                    <div class="car-glow"></div>
                    ${this.carSvg()}
                  </div>
                  <div class="tesla-stats">
                    <div class="tesla-hdr"><div class="tesla-name">Model 3</div><div class="tag">${teslaPlace}</div></div>
                    <div class="batt-row"><div class="bpct">${battery.replace("%", "")}<span>%</span></div><div class="bkm">${range}</div></div>
                    <div class="bbar"><div class="bfill" style="width:${Number.isFinite(batteryRaw) ? batteryRaw : 0}%"></div></div>
                    <div class="tbtns">
                      ${this.teslaButton("climate", "mdi:fan", "Climate", this.isOn(e.teslaClimate))}
                      ${this.teslaButton("defrost", "mdi:car-defrost-front", "Defrost", this.isOn(e.teslaDefrost))}
                      ${this.teslaButton("sentry", "mdi:shield-check-outline", "Sentry", this.isOn(e.teslaSentry))}
                      ${this.teslaButton("charge", "mdi:lightning-bolt-outline", "Charge", this.isOn(e.teslaCharge))}
                    </div>
                  </div>
                </section>
                <section class="gl sp">
                  <div class="sp-ico"><ha-icon icon="mdi:spotify"></ha-icon></div>
                  <div class="sp-info"><div class="sp-t">${spotifyTitle}</div><div class="sp-a">${spotifyArtist}</div></div>
                  <div class="bars"><div class="bar"></div><div class="bar"></div><div class="bar"></div></div>
                </section>
              </div>
            </div>
          </div>
          ${this.roomPage("liv", "Living Room", "Kitchen · Dining · TV area", e.mainLights, e.livingTemp, e.livingHumidity, e.livingAir)}
          ${this.roomPage("bed", "Master Bedroom", "Sleep environment", e.bedroomLights, e.bedTemp, e.bedHumidity, e.bedAir)}
          ${this.roomPage("game", "Game Room", "Office · Gaming", e.gameLights)}
          ${this.roomPage("util", "Utility", "Hallway · Bathroom · Storage", e.utilityLights)}
        </div>
      </ha-card>
    `;

    this.updateClock();
    this.bindEvents();
  }

  bindEvents() {
    this.shadowRoot.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        this._tab = button.dataset.tab;
        this.render();
      });
    });
    this.shadowRoot.querySelectorAll("[data-room]").forEach((button) => {
      const map = {
        main: this.entities.mainLights,
        bedroom: this.entities.bedroomLights,
        game: this.entities.gameLights,
        utility: this.entities.utilityLights,
      };
      button.addEventListener("click", () => this.toggleGroup(map[button.dataset.room]));
    });
    this.shadowRoot.querySelectorAll("[data-entity]").forEach((button) => {
      button.addEventListener("click", () => this.toggleEntity(button.dataset.entity));
    });
    this.shadowRoot.querySelector("[data-action='all-off']")?.addEventListener("click", () => this.turnOffAll());
    this.shadowRoot.querySelector("[data-tesla='climate']")?.addEventListener("click", () => this.toggleClimate());
    this.shadowRoot.querySelector("[data-tesla='defrost']")?.addEventListener("click", () => this.toggleEntity(this.entities.teslaDefrost));
    this.shadowRoot.querySelector("[data-tesla='sentry']")?.addEventListener("click", () => this.toggleEntity(this.entities.teslaSentry));
    this.shadowRoot.querySelector("[data-tesla='charge']")?.addEventListener("click", () => this.toggleEntity(this.entities.teslaCharge));
  }

  tab(id, icon, label) {
    return `<button class="tab ${this._tab === id ? "active" : ""}" data-tab="${id}"><ha-icon icon="${icon}"></ha-icon>${label}</button>`;
  }

  room(label, icon, on, group) {
    return `<button class="gl room ${on ? "on" : ""}" data-room="${group}"><div class="rdot"></div><ha-icon class="ri" icon="${icon}"></ha-icon><div class="rn">${label}</div></button>`;
  }

  climateSummary(title, temp, humidity, air) {
    return `<section class="gl block">
      <div class="slbl">${title}</div>
      <div class="clim3">
        <div class="glsm ci"><div class="cv">${this.fmt(temp, "", "--", 0)}<span class="cu">°</span></div><div class="cl">Temp</div></div>
        <div class="glsm ci"><div class="cv">${this.fmt(humidity, "", "--", 0)}<span class="cu">%</span></div><div class="cl">Humidity</div></div>
        <div class="glsm ci"><div class="cgood">${this.st(air, "Good")}</div><div class="cl">Air Quality</div></div>
      </div>
    </section>`;
  }

  day(label, state, high, low) {
    return `<div class="glsm wxd"><div class="wxdn">${label}</div><ha-icon class="wxdi" icon="${this.weatherIcon(state)}"></ha-icon><div class="wxdh">${high}</div><div class="wxdl">${low}</div></div>`;
  }

  teslaButton(action, icon, label, on) {
    return `<button class="tb ${on ? "on" : ""}" data-tesla="${action}"><ha-icon icon="${icon}"></ha-icon><span>${label}</span></button>`;
  }

  roomPage(id, title, sub, entities, temp, humidity, air) {
    const climate = temp ? `<div class="col">${this.climateDetail(temp, humidity, air)}</div>` : `<div class="col">${this.sceneList(title)}</div>`;
    return `<div class="page ${this._tab === id ? "active" : ""} z1">
      <div class="g2">
        <div class="col">
          <section class="gl rp-hero">
            <div class="slbl">${title}</div>
            <div class="rp-title">${title}</div>
            <div class="rp-sub">${sub}</div>
            <button class="big-toggle ${this.anyOn(entities) ? "on" : ""}" data-room="${id === "liv" ? "main" : id === "bed" ? "bedroom" : id === "game" ? "game" : "utility"}"><div class="bt-label">All Lights · ${this.countOn(entities)} on</div><div class="sw"></div></button>
          </section>
          <section class="gl block">
            <div class="slbl">Lights</div>
            <div class="light-list">${entities.map((entity) => this.lightItem(entity)).join("")}</div>
          </section>
        </div>
        ${climate}
      </div>
    </div>`;
  }

  lightItem(entity) {
    const name = this.attr(entity, "friendly_name", entity);
    const on = this.isOn(entity);
    return `<button class="light-item ${on ? "on" : ""}" data-entity="${entity}">
      <div class="li-left"><ha-icon class="li-ico" icon="mdi:lightbulb-outline"></ha-icon><div><div class="li-name">${name}</div><div class="li-sub">${on ? "On" : "Off"}</div></div></div><div class="lisw"></div>
    </button>`;
  }

  climateDetail(temp, humidity, air) {
    return `<section class="gl block">
      <div class="slbl">Climate</div>
      <div class="clim-detail">
        <div class="glsm cd"><div class="cd-val">${this.fmt(temp, "", "--", 0)}<span class="cd-unit">°C</span></div><div class="cd-lbl">Temperature</div></div>
        <div class="glsm cd"><div class="cd-val">${this.fmt(humidity, "", "--", 0)}<span class="cd-unit">%</span></div><div class="cd-lbl">Humidity</div></div>
        <div class="glsm cd-full"><div>Air Quality</div><div class="cd-aq-val">${this.st(air, "Good")}</div></div>
      </div>
    </section>`;
  }

  sceneList(title) {
    return `<section class="gl block">
      <div class="slbl">${title} · Scenes</div>
      <button class="scene-item"><div class="sc-left"><ha-icon class="sc-ico" icon="mdi:weather-night"></ha-icon><div><div class="sc-name">Calm</div><div class="sc-sub">Dim warm ambient</div></div></div><ha-icon class="chev" icon="mdi:chevron-right"></ha-icon></button>
      <button class="scene-item"><div class="sc-left"><ha-icon class="sc-ico" icon="mdi:white-balance-sunny"></ha-icon><div><div class="sc-name">Bright</div><div class="sc-sub">Clear working light</div></div></div><ha-icon class="chev" icon="mdi:chevron-right"></ha-icon></button>
    </section>`;
  }

  carSvg() {
    return `<svg class="car-svg" viewBox="0 0 500 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="bd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e8eaf0"/><stop offset="100%" stop-color="#b0b4c0"/></linearGradient>
        <linearGradient id="rf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f0f2f8"/><stop offset="100%" stop-color="#d0d4e0"/></linearGradient>
        <radialGradient id="wh" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#4a4e5a"/><stop offset="100%" stop-color="#1a1c22"/></radialGradient>
        <linearGradient id="wn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6080c0" stop-opacity=".7"/><stop offset="100%" stop-color="#304080" stop-opacity=".5"/></linearGradient>
      </defs>
      <ellipse cx="250" cy="195" rx="200" ry="8" fill="rgba(0,0,0,.3)"/>
      <path d="M50,120 Q52,155 60,155 L440,155 Q448,155 450,120 Q445,100 420,100 L80,100 Q55,100 50,120Z" fill="url(#bd)"/>
      <path d="M160,100 Q170,68 190,58 L260,52 Q310,50 330,58 Q350,68 360,100Z" fill="url(#rf)"/>
      <path d="M168,100 Q176,72 194,63 L258,58 L255,100Z" fill="url(#wn)"/>
      <path d="M265,58 Q308,52 328,62 Q346,72 352,100 L270,100Z" fill="url(#wn)" opacity=".8"/>
      <line x1="260" y1="100" x2="258" y2="155" stroke="rgba(0,0,0,.1)" stroke-width="1"/>
      <rect x="215" y="122" width="28" height="5" rx="2.5" fill="rgba(255,255,255,.55)"/>
      <rect x="340" y="122" width="28" height="5" rx="2.5" fill="rgba(255,255,255,.55)"/>
      <path d="M60,120 Q58,112 70,110 L100,110 L98,122 L62,122Z" fill="rgba(220,235,255,.85)"/>
      <circle cx="140" cy="162" r="28" fill="url(#wh)"/><circle cx="140" cy="162" r="14" fill="#2a2c34"/><circle cx="140" cy="162" r="6" fill="#3a3c44"/>
      <circle cx="360" cy="162" r="28" fill="url(#wh)"/><circle cx="360" cy="162" r="14" fill="#2a2c34"/><circle cx="360" cy="162" r="6" fill="#3a3c44"/>
      <circle cx="140" cy="162" r="19" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="2"/>
      <circle cx="360" cy="162" r="19" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="2"/>
      <path d="M200,105 Q250,100 300,105" stroke="rgba(255,255,255,.13)" stroke-width="1.5" fill="none"/>
    </svg>`;
  }

  css() {
    return `
      :host{display:block} ha-card{background:transparent;border:0;box-shadow:none;overflow:visible}
      *{box-sizing:border-box;margin:0;padding:0} button{font:inherit;color:inherit;border:0;text-align:inherit}
      .dash{width:100%;min-height:calc(100vh - 98px);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",system-ui,sans-serif;position:relative;background:#060818}
      .bg{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 15% 85%,rgba(0,180,255,.42) 0%,transparent 55%),radial-gradient(ellipse 60% 50% at 80% 10%,rgba(130,60,255,.38) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 50% 50%,rgba(30,10,80,.8) 0%,transparent 70%),linear-gradient(160deg,#06091c 0%,#0b0630 40%,#050c1e 100%);pointer-events:none}
      .bg::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 30% 20% at 10% 70%,rgba(0,220,255,.22) 0%,transparent 50%)}
      .z1{position:relative;z-index:1}.gl{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:16px}.glsm{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-radius:11px}
      .slbl{font-size:8.5px;font-weight:700;color:rgba(255,255,255,.34);letter-spacing:1.1px;text-transform:uppercase;margin-bottom:9px}.block{padding:12px}
      .topbar{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 10px}.home-lbl{font-size:11px;font-weight:700;color:rgba(255,255,255,.45);letter-spacing:1.5px;text-transform:uppercase}.clock-wrap{text-align:right}.clk-time{font-size:22px;font-weight:200;color:rgba(255,255,255,.92);letter-spacing:-1px;line-height:1}.clk-date{font-size:11px;color:rgba(255,255,255,.5);margin-top:2px}
      .tabs{display:flex;gap:4px;padding:0 14px 10px;overflow-x:auto;scrollbar-width:none}.tabs::-webkit-scrollbar{display:none}.tab{flex-shrink:0;display:flex;align-items:center;gap:6px;padding:7px 13px;border-radius:22px;font-size:11px;font-weight:600;color:rgba(255,255,255,.38);cursor:pointer;border:1px solid transparent;background:rgba(255,255,255,.04);transition:all .18s;white-space:nowrap}.tab ha-icon{--mdc-icon-size:14px;opacity:.7}.tab:hover{color:rgba(255,255,255,.65);background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.1)}.tab.active{background:rgba(255,255,255,.13);border-color:rgba(255,255,255,.2);color:rgba(255,255,255,.92)}.tab.active ha-icon{opacity:1}.divider{height:1px;background:rgba(255,255,255,.07);margin:0 14px}
      .page{display:none;flex:1;padding:11px 13px 13px}.page.active{display:flex}.g2{display:grid;grid-template-columns:1fr 1fr;gap:11px;width:100%}.col{display:flex;flex-direction:column;gap:10px;min-width:0}
      .rooms5{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.room{padding:11px 6px 9px;cursor:pointer;transition:all .18s;position:relative;border-radius:13px;text-align:center}.room:hover{background:rgba(255,255,255,.09)}.room.on{background:rgba(255,255,255,.11);border-color:rgba(200,180,255,.2)}.ri{--mdc-icon-size:18px;color:rgba(255,255,255,.22);margin:0 auto 5px;transition:color .18s;display:block}.room.on .ri{color:rgba(215,200,255,.9)}.rn{font-size:8.5px;font-weight:600;color:rgba(255,255,255,.34);line-height:1.25}.room.on .rn{color:rgba(255,255,255,.85)}.rdot{position:absolute;top:7px;right:7px;width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.1)}.room.on .rdot{background:#a78bfa}.alloff .rdot{background:rgba(248,113,113,.35)}.alloff .ri{color:rgba(248,113,113,.5)}
      .clim3{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.ci{text-align:center;padding:9px 4px;border-radius:10px}.cv{font-size:17px;font-weight:200;color:rgba(255,255,255,.85);letter-spacing:-1px;line-height:1}.cu{font-size:9px;color:rgba(255,255,255,.28)}.cl{font-size:7.5px;color:rgba(255,255,255,.24);margin-top:4px;text-transform:uppercase;letter-spacing:.5px}.cgood{font-size:12px;font-weight:500;color:#6ee7b7;padding-top:2px;text-transform:capitalize}
      .car-area{width:100%;height:145px;position:relative;overflow:hidden;background:radial-gradient(ellipse 90% 70% at 50% 60%,rgba(25,25,55,.95) 0%,rgba(8,8,25,.98) 100%);border-radius:14px 14px 0 0}.car-glow{position:absolute;bottom:0;left:0;right:0;height:35px;background:radial-gradient(ellipse 80% 100% at 50% 100%,rgba(80,100,220,.15) 0%,transparent 70%)}.car-svg{position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:90%;max-width:470px}.tesla-card{overflow:hidden}.tesla-stats{padding:10px 13px 12px}.tesla-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.tesla-name{font-size:13px;font-weight:400;color:rgba(255,255,255,.8)}.tag{font-size:8.5px;color:rgba(255,255,255,.28);background:rgba(255,255,255,.07);padding:3px 8px;border-radius:10px;border:1px solid rgba(255,255,255,.08);text-transform:capitalize}.batt-row{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px}.bpct{font-size:26px;font-weight:200;color:#fff;letter-spacing:-2px}.bpct span{font-size:14px;color:rgba(255,255,255,.25)}.bkm{font-size:11px;font-weight:300;color:rgba(255,255,255,.35)}.bbar{height:2px;background:rgba(255,255,255,.1);border-radius:2px;margin-bottom:11px}.bfill{height:100%;border-radius:2px;background:linear-gradient(90deg,#34d399,#86efac)}.tbtns{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.tb{padding:8px 3px;text-align:center;cursor:pointer;transition:all .18s;border-radius:9px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.04)}.tb:hover{background:rgba(255,255,255,.08)}.tb.on{background:rgba(167,139,250,.15);border-color:rgba(167,139,250,.28)}.tb ha-icon{display:block;--mdc-icon-size:15px;color:rgba(255,255,255,.28);margin:0 auto 2px}.tb.on ha-icon{color:#c4b5fd}.tb span{font-size:7.5px;color:rgba(255,255,255,.24);text-transform:uppercase;letter-spacing:.3px}
      .wx-main{display:flex;align-items:center;gap:10px;margin-bottom:10px}.wx-ico{--mdc-icon-size:24px;color:rgba(255,255,255,.42)}.wx-tmp{font-size:22px;font-weight:200;color:rgba(255,255,255,.8);letter-spacing:-1px}.wx-tmp span{font-size:12px;color:rgba(255,255,255,.25)}.wx-cond{font-size:8.5px;color:rgba(255,255,255,.25);margin-top:2px;text-transform:uppercase;letter-spacing:.5px}.wx-days{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.wxd{text-align:center;padding:7px 3px;border-radius:9px}.wxdn{font-size:7.5px;color:rgba(255,255,255,.23);text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px}.wxdi{--mdc-icon-size:14px;color:rgba(255,255,255,.34);margin-bottom:3px}.wxdh{font-size:10px;color:rgba(255,255,255,.52)}.wxdl{font-size:8px;color:rgba(255,255,255,.22);margin-top:1px}
      .sp{padding:11px 13px;display:flex;align-items:center;gap:10px}.sp-ico{width:30px;height:30px;border-radius:50%;background:rgba(29,185,84,.12);border:1px solid rgba(29,185,84,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0}.sp-ico ha-icon{--mdc-icon-size:15px;color:#1DB954}.sp-info{min-width:0;flex:1}.sp-t{font-size:11px;font-weight:600;color:rgba(255,255,255,.66);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sp-a{font-size:8.5px;color:rgba(255,255,255,.25);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bars{display:flex;gap:2px;align-items:flex-end;height:11px;flex-shrink:0}.bar{width:2px;border-radius:1px;background:#1DB954;animation:eq .9s ease-in-out infinite alternate}.bar:nth-child(2){animation-delay:.3s}.bar:nth-child(3){animation-delay:.6s}@keyframes eq{from{height:3px}to{height:10px}}
      .rp-hero{padding:15px}.rp-title{font-size:20px;font-weight:200;color:rgba(255,255,255,.85);margin-bottom:3px;letter-spacing:-.5px}.rp-sub{font-size:9.5px;color:rgba(255,255,255,.25)}.big-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;margin-top:13px;padding:11px 13px;border-radius:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);cursor:pointer;transition:all .18s}.big-toggle:hover{background:rgba(255,255,255,.09)}.big-toggle.on{background:rgba(167,139,250,.13);border-color:rgba(167,139,250,.24)}.bt-label{font-size:11px;font-weight:600;color:rgba(255,255,255,.48)}.big-toggle.on .bt-label{color:rgba(200,185,255,.85)}.sw{width:36px;height:20px;border-radius:10px;background:rgba(255,255,255,.12);position:relative;transition:background .2s}.sw::after{content:"";position:absolute;top:3px;left:3px;width:14px;height:14px;border-radius:50%;background:rgba(255,255,255,.45);transition:all .2s}.big-toggle.on .sw{background:#7c3aed}.big-toggle.on .sw::after{left:19px;background:#fff}
      .light-list{display:flex;flex-direction:column;gap:6px}.light-item{width:100%;display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:11px;cursor:pointer;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.04);transition:all .18s}.light-item:hover{background:rgba(255,255,255,.07)}.light-item.on{background:rgba(167,139,250,.1);border-color:rgba(167,139,250,.2)}.li-left{display:flex;align-items:center;gap:9px;min-width:0}.li-ico{--mdc-icon-size:15px;color:rgba(255,255,255,.22)}.light-item.on .li-ico{color:rgba(220,205,255,.8)}.li-name{font-size:10.5px;font-weight:500;color:rgba(255,255,255,.42);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px}.light-item.on .li-name{color:rgba(255,255,255,.78)}.li-sub{font-size:8px;color:rgba(255,255,255,.18);margin-top:1px}.lisw{width:30px;height:17px;border-radius:9px;background:rgba(255,255,255,.1);position:relative;flex-shrink:0}.lisw::after{content:"";position:absolute;top:2.5px;left:2.5px;width:12px;height:12px;border-radius:50%;background:rgba(255,255,255,.35);transition:all .2s}.light-item.on .lisw{background:#7c3aed}.light-item.on .lisw::after{left:16px;background:#fff}
      .clim-detail{display:grid;grid-template-columns:1fr 1fr;gap:7px}.cd{padding:12px;border-radius:11px;text-align:center}.cd-val{font-size:24px;font-weight:200;color:rgba(255,255,255,.85);letter-spacing:-1.5px;line-height:1}.cd-unit{font-size:10px;color:rgba(255,255,255,.28)}.cd-lbl{font-size:7.5px;color:rgba(255,255,255,.24);margin-top:4px;text-transform:uppercase;letter-spacing:.6px}.cd-full{grid-column:span 2;padding:10px 12px;border-radius:11px;display:flex;align-items:center;justify-content:space-between;color:rgba(255,255,255,.38);font-size:10px}.cd-aq-val{font-size:13px;font-weight:500;color:#6ee7b7;text-transform:capitalize}.scene-item{width:100%;display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:11px;cursor:pointer;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.04);transition:all .18s;margin-bottom:6px}.scene-item:hover{background:rgba(255,255,255,.07)}.sc-left{display:flex;align-items:center;gap:9px}.sc-ico{--mdc-icon-size:15px;color:rgba(255,255,255,.24)}.sc-name{font-size:10.5px;font-weight:500;color:rgba(255,255,255,.42)}.sc-sub{font-size:8px;color:rgba(255,255,255,.18);margin-top:1px}.chev{--mdc-icon-size:13px;color:rgba(255,255,255,.16)}
      @media (max-width: 820px){.dash{min-height:calc(100vh - 80px)}.g2{grid-template-columns:1fr}.rooms5{grid-template-columns:repeat(3,1fr)}.car-area{height:135px}.page{padding:10px}.tab{padding:7px 10px}.weather{order:10}}
    `;
  }
}

customElements.define("glass-dashboard-card", GlassDashboardCard);

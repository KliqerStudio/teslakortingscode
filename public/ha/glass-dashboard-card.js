class GlassDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._tab = "ov";
    this._timer = null;
    this._camTimer = null;
    this._config = {};
    this._history = {};
    this._forecast = [];
    this._forecastLoading = false;
    this._forecastLoadedAt = 0;
    this._historyLoading = false;
    this._historyLoadedAt = 0;
    this._lastCamUrl = "";
    this._camFetching = false;
    this.entities = {
      mainLights: [
        "light.lounge_light","light.living_room","light.reading_light",
        "light.dining_room","light.led_keuken_boven","light.led_keuken_onder",
        "light.led_strip_4","light.govee_tv_left","light.govee_tv_right",
        "light.rgbic_tv_backlight","light.tv_left","light.tv_right","light.marylin",
      ],
      bedroomLights: ["light.bed","switch.night_light","light.kast","light.closet"],
      gameLights: [
        "light.plafond","light.desk_lamp","light.desk_led_strip",
        "light.battletron_smart_desk_light_strip","light.battletron_smart_desk_light_strip_2",
      ],
      utilityLights: ["light.toilet","light.hallway_door"],
      livingTemp:     "sensor.living_room_sensor_temperature",
      livingHumidity: "sensor.living_room_sensor_humidity",
      livingAir:      "sensor.living_room_sensor_air_quality",
      bedTemp:        "sensor.bedroom_sensor_temperature",
      bedHumidity:    "sensor.bedroom_sensor_humidity",
      bedAir:         "sensor.bedroom_sensor_air_quality",
      weather:        "weather.forecast_home",
      teslaClimate:   "climate.model_3_climate",
      teslaBattery:   "sensor.model_3_battery_level",
      teslaRange:     "sensor.model_3_battery_range",
      teslaLocation:  "device_tracker.model_3_location",
      teslaDefrost:   "switch.model_3_defrost",
      teslaSentry:    "switch.model_3_sentry_mode",
      teslaCharge:    "switch.model_3_charge",
      teslaLock:      "lock.model_3_lock",
      teslaChargePort:"cover.model_3_charge_port_door",
      teslaFrunk:     "cover.model_3_froot",
      teslaBoot:      "cover.model_3_boot",
      spotify:        "media_player.spotify_tristan_pahud_de_mortanges",
      spotifySpeaker: "media_player.dining_room",
      tv:             "media_player.lg_webos_tv_oled65c54la_2",
      toonDevices:    ["light.pet_feeder_indicator_light","switch.pet_feeder_motion_alarm","switch.pet_feeder_motion_recording","switch.pet_feeder_time_watermark"],
      toonSensors:    ["sensor.poopas_poops_cat_weight","sensor.poopas_poops_excretion_duration","sensor.poopas_poops_excretion_times_day"],
      petFeederCamera:"camera.pet_feeder",
    };
  }

  setConfig(config) { this._config = config || {}; }

  connectedCallback() {
    if (!this._camTimer) {
      this._camTimer = window.setInterval(() => this.updateCamera(), 5000);
    }
  }

  disconnectedCallback() {
    if (this._timer)    { window.clearInterval(this._timer);    this._timer    = null; }
    if (this._camTimer) { window.clearInterval(this._camTimer); this._camTimer = null; }
  }

  set hass(hass) {
    this._hass = hass;
    this.loadForecast();
    this.loadHistory();
    this.render();
    if (!this._timer) this._timer = window.setInterval(() => this.updateClock(), 10000);
  }

  getCardSize() { return 14; }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  st(entity, fallback = "Unknown") {
    const s = this._hass?.states?.[entity]?.state;
    if (!s || s === "unavailable" || s === "unknown") return fallback;
    return s;
  }
  attr(entity, key, fallback = undefined) {
    return this._hass?.states?.[entity]?.attributes?.[key] ?? fallback;
  }
  fmt(entity, suffix = "", fallback = "--", digits = 0) {
    const raw = this.st(entity, fallback);
    const n = Number(raw);
    if (!Number.isFinite(n)) return raw;
    return `${n.toFixed(digits)}${suffix}`;
  }
  niceState(entity, fallback = "Unknown") {
    const s = this.st(entity, fallback);
    if (s === fallback) return fallback;
    return s.replaceAll("_"," ").replace(/\b\w/g, c => c.toUpperCase());
  }
  isOn(entity) {
    return ["on","heat","cool","playing","home","open"].includes(
      this._hass?.states?.[entity]?.state
    );
  }
  anyOn(entities)   { return entities.some(e => this.isOn(e)); }
  countOn(entities) { return entities.filter(e => this.isOn(e)).length; }
  service(domain, svc, data) { return this._hass?.callService(domain, svc, data); }
  toggleEntity(entity) { this.service(entity.split(".")[0], "toggle", { entity_id: entity }); }
  toggleGroup(entities) { this.service("homeassistant","toggle",{ entity_id: entities }); }
  turnOffAll() {
    this.service("homeassistant","turn_off",{ entity_id:[
      ...this.entities.mainLights,...this.entities.bedroomLights,
      ...this.entities.gameLights,...this.entities.utilityLights,
    ]});
  }
  toggleClimate() {
    const cur = this._hass?.states?.[this.entities.teslaClimate]?.state;
    this.service("climate", cur === "off" ? "turn_on" : "turn_off", { entity_id: this.entities.teslaClimate });
  }
  setClimateTemp(delta) {
    const cur = Number(this.attr(this.entities.teslaClimate,"temperature",22));
    this.service("climate","set_temperature",{
      entity_id: this.entities.teslaClimate,
      temperature: Math.round((cur + delta) * 2) / 2,
    });
  }
  mediaControlTarget() {
    const s = this.st(this.entities.spotifySpeaker,"idle");
    return ["playing","paused","on"].includes(s) ? this.entities.spotifySpeaker : this.entities.spotify;
  }

  // ── Data Loading ─────────────────────────────────────────────────────────────
  async loadForecast() {
    if (this._forecastLoading) return;
    // If we have data, cache for 30 min. If empty, retry every 30 seconds.
    if (this._forecast?.length && Date.now() - this._forecastLoadedAt < 1800000) return;
    if (!this._forecast?.length && this._forecastLoadedAt && Date.now() - this._forecastLoadedAt < 30000) return;
    this._forecastLoading = true;
    try {
      if (this._hass?.callWS) {
        const data = await this._hass.callWS({
          type: "weather/get_forecasts",
          entity_id: this.entities.weather,
          forecast_type: "daily",
        });
        // Handle both response shapes
        this._forecast = data?.[this.entities.weather]?.forecast
          || data?.response?.[this.entities.weather]?.forecast
          || [];
      }
      // Fallback: read forecast attribute directly from entity state
      if (!this._forecast?.length) {
        const raw = this.attr(this.entities.weather, "forecast", null);
        if (Array.isArray(raw) && raw.length) this._forecast = raw;
      }
      this._forecastLoadedAt = Date.now();
      if (this._forecast.length) this.render();
    } catch(err) {
      console.warn("[GlassDash] Forecast error:", err);
      const raw = this.attr(this.entities.weather, "forecast", null);
      if (Array.isArray(raw) && raw.length) {
        this._forecast = raw;
        this._forecastLoadedAt = Date.now();
        this.render();
      } else {
        this._forecastLoadedAt = Date.now(); // still stamp so we throttle retries
      }
    } finally {
      this._forecastLoading = false;
    }
  }

  async loadHistory() {
    if (this._historyLoading) return;
    if (this._historyLoadedAt && Date.now() - this._historyLoadedAt < 300000) return;
    if (!this._hass?.callWS) return;
    this._historyLoading = true;
    const sensors = [
      this.entities.livingTemp, this.entities.livingHumidity, this.entities.livingAir,
      this.entities.bedTemp,    this.entities.bedHumidity,    this.entities.bedAir,
    ];
    try {
      const start = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
      const data = await this._hass.callWS({
        type: "history/history_during_period",
        entity_ids: sensors,
        start_time: start,
        significant_changes_only: false,
        minimal_response: true,
        no_attributes: true,
      });
      if (data) {
        this._history = data;
        this._historyLoadedAt = Date.now();
        this.render();
      }
    } catch { /* sparklines silently skipped */ }
    finally { this._historyLoading = false; }
  }

  // ── Camera (stable refresh, no flicker) ──────────────────────────────────────
  updateCamera() {
    if (!this._hass) return;
    const camState = this._hass?.states?.[this.entities.petFeederCamera];
    const ep = camState?.attributes?.entity_picture;
    if (!ep) return;
    const url = ep + (ep.includes("?") ? "&" : "?") + "t=" + Date.now();
    this._lastCamUrl = url;
    const img = this.shadowRoot?.querySelector(".cam-feed");
    if (img) {
      img.onerror = () => {
        img.style.display = "none";
        const err = img.nextElementSibling;
        if (err) err.style.display = "flex";
      };
      img.onload = () => {
        img.style.display = "block";
        const err = img.nextElementSibling;
        if (err) err.style.display = "none";
      };
      img.src = url;
    }
  }

  // ── Utilities ─────────────────────────────────────────────────────────────────
  weatherIcon(state) {
    const m = {
      rainy:"mdi:weather-rainy", pouring:"mdi:weather-pouring",
      cloudy:"mdi:weather-cloudy", partlycloudy:"mdi:weather-partly-cloudy",
      sunny:"mdi:weather-sunny", clear:"mdi:weather-night",
      "clear-night":"mdi:weather-night", fog:"mdi:weather-fog",
      snowy:"mdi:weather-snowy", windy:"mdi:weather-windy", hail:"mdi:weather-hail",
    };
    return m[state] || "mdi:weather-partly-cloudy";
  }
  fmtTime(secs) {
    if (!secs || secs < 0) return "0:00";
    const s = Math.round(secs), m = Math.floor(s/60);
    return `${m}:${String(s%60).padStart(2,"0")}`;
  }
  aqLabel(val) {
    const n = Number(val);
    if (Number.isFinite(n)) {
      if (n <= 12)  return "Good";
      if (n <= 35)  return "Moderate";
      if (n <= 55)  return "Sensitive";
      if (n <= 150) return "Unhealthy";
      return "Hazardous";
    }
    const v = String(val).toLowerCase();
    if (v.includes("good") || v.includes("excellent")) return "Good";
    if (v.includes("fair") || v.includes("moderate"))  return "Moderate";
    if (v.includes("poor") || v.includes("unhealthy")) return "Unhealthy";
    return String(val);
  }
  aqColor(val) {
    const l = this.aqLabel(val).toLowerCase();
    if (l.includes("good"))      return "#34d399";
    if (l.includes("moderate"))  return "#fbbf24";
    if (l.includes("sensitive")) return "#fb923c";
    if (l.includes("unhealthy")) return "#f87171";
    if (l.includes("hazardous")) return "#c084fc";
    return "#34d399";
  }

  sparkline(entity, color = "rgba(255,170,50,.85)") {
    const raw = this._history?.[entity];
    if (!raw || raw.length < 3) return `<div class="spark-empty"></div>`;
    const pts = raw.map(s => ({
      v: Number(s.state ?? s.s),
      t: s.last_changed ? new Date(s.last_changed).getTime() : (s.lu ? s.lu * 1000 : 0),
    })).filter(p => Number.isFinite(p.v) && p.t > 0);
    if (pts.length < 3) return `<div class="spark-empty"></div>`;
    const step = Math.max(1, Math.floor(pts.length / 50));
    const dp = pts.filter((_,i) => i % step === 0 || i === pts.length-1);
    const W = 200, H = 32;
    const minV = Math.min(...dp.map(p=>p.v)), maxV = Math.max(...dp.map(p=>p.v));
    // Add 10% padding so flat lines show in the middle, not squished to edge
    const pad = Math.max((maxV - minV) * 0.15, 0.2);
    const lo = minV - pad, hi = maxV + pad, rng = hi - lo;
    const minT = dp[0].t, maxT = dp[dp.length-1].t;
    const tRng = maxT - minT || 1;
    const coords = dp.map(p => [
      ((p.t - minT) / tRng * W).toFixed(1),
      (H - 2 - (p.v - lo) / rng * (H - 6)).toFixed(1),
    ]);
    const line = coords.map(c=>c.join(",")).join(" ");
    const area = `M${coords[0].join(",")} ${coords.slice(1).map(c=>`L${c.join(",")}`).join(" ")} L${W},${H} L0,${H} Z`;
    const gid = `sg${entity.replace(/[^a-z0-9]/gi,"")}`;
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient></defs>
      <path d="${area}" fill="url(#${gid})"/>
      <polyline points="${line}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  playClick() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const t = ctx.currentTime;
      [{freq:[1100,450],gain:[0.07,0.001],dur:0.07},{freq:[2200,900],gain:[0.035,0.001],dur:0.045}]
        .forEach(({freq,gain,dur}) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = "sine";
          o.frequency.setValueAtTime(freq[0],t);
          o.frequency.exponentialRampToValueAtTime(freq[1],t+dur);
          g.gain.setValueAtTime(gain[0],t);
          g.gain.exponentialRampToValueAtTime(gain[1],t+dur);
          o.start(t); o.stop(t+dur);
        });
      setTimeout(() => ctx.close(), 400);
    } catch {}
  }

  updateClock() {
    const ti = this.shadowRoot.getElementById("clk-t");
    const da = this.shadowRoot.getElementById("clk-d");
    if (!ti||!da) return;
    const now = new Date();
    ti.textContent = now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    da.textContent = now.toLocaleDateString([],{weekday:"short",day:"numeric",month:"long"});
  }
  greeting() {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  }

  // ── Main Render ───────────────────────────────────────────────────────────────
  render() {
    if (!this._hass) return;
    const e = this.entities;

    const livingOn  = this.anyOn(e.mainLights);
    const bedroomOn = this.anyOn(e.bedroomLights);
    const gameOn    = this.anyOn(e.gameLights);
    const utilityOn = this.anyOn(e.utilityLights);

    const batteryRaw  = Number(this.st(e.teslaBattery,"0")) || 0;
    const range       = this.fmt(e.teslaRange," km","--",0);
    const teslaPlace  = this.niceState(e.teslaLocation,"Away");
    const climOn      = this.isOn(e.teslaClimate);
    const targetTemp  = this.attr(e.teslaClimate,"temperature",22);

    const weatherState    = this.st(e.weather,"clear-night");
    const weatherTemp     = this.attr(e.weather,"temperature","--");
    const weatherHumidity = this.attr(e.weather,"humidity","--");
    const weatherWind     = this.attr(e.weather,"wind_speed","--");
    const weatherFeels    = this.attr(e.weather,"apparent_temperature",null);
    const weatherUV       = this.attr(e.weather,"uv_index",null);
    const weatherVis      = this.attr(e.weather,"visibility",null);

    const spotifyTitle  = this.attr(e.spotify,"media_title","");
    const spotifyArtist = this.attr(e.spotify,"media_artist","");
    const spotifyAlbum  = this.attr(e.spotify,"media_album_name","");
    const spotifyPic    = this.attr(e.spotify,"entity_picture","") || this.attr(e.spotifySpeaker,"entity_picture","");
    const spotifyState  = this.st(e.spotify,"idle");
    const spkState      = this.st(e.spotifySpeaker,"idle");
    const spotifyPlaying= spotifyState==="playing"||spkState==="playing";
    const spotifyActive = ["playing","paused"].includes(spotifyState)||["playing","paused"].includes(spkState);
    const durSec  = Number(this.attr(e.spotify,"media_duration",0))||0;
    const posSec  = Number(this.attr(e.spotify,"media_position",0))||0;
    const posUpAt = this.attr(e.spotify,"media_position_updated_at",null);
    const elapsed = posUpAt && spotifyPlaying ? (Date.now()-new Date(posUpAt).getTime())/1000 : 0;
    const curPos  = Math.min(posSec+elapsed, durSec||1);
    const spProg  = durSec>0 ? Math.min((curPos/durSec)*100,100) : 0;
    const volPct  = Math.round(Number(this.attr(e.spotifySpeaker,"volume_level",0)||0)*100);
    const tvState = this.niceState(e.tv,"Off");
    const spkNice = this.niceState(e.spotifySpeaker,"Idle");

    const camSrc = this._lastCamUrl || (this._hass?.states?.[e.petFeederCamera]?.attributes?.entity_picture || "");

    this.shadowRoot.innerHTML = `<style>${this.css()}</style><ha-card><div class="dash">
  <div class="bg"></div>

  <div class="topbar z1">
    <div>
      <div class="home-lbl">${this.greeting()}</div>
      <div class="home-sub">Home overview</div>
    </div>
    <div class="clock-wrap">
      <div class="clk-time" id="clk-t">00:00</div>
      <div class="clk-date" id="clk-d">Thu, 14 May</div>
    </div>
  </div>

  <div class="tabs z1">
    ${this.tab("ov",   "mdi:view-dashboard-outline","Overview")}
    ${this.tab("liv",  "mdi:sofa-outline",          "Living Room")}
    ${this.tab("bed",  "mdi:bed-king-outline",       "Bedroom")}
    ${this.tab("game", "mdi:gamepad-variant-outline","Game Room")}
    ${this.tab("toon", "mdi:cat",                   "Toon's Room")}
    ${this.tab("util", "mdi:home-floor-1",          "Utility")}
  </div>
  <div class="divider z1"></div>

  <!-- OVERVIEW -->
  <div class="page page-ov ${this._tab==="ov"?"active":""} z1">
    <div class="ov-main">

      <!-- LEFT: lights + climate + spotify + media -->
      <div class="col">
        <section class="gl block">
          <div class="slbl">Lights</div>
          <div class="rooms5">
            ${this.room("Living Room","mdi:sofa-outline",           livingOn, "main")}
            ${this.room("Bedroom",    "mdi:bed-king-outline",        bedroomOn,"bedroom")}
            ${this.room("Game Room",  "mdi:gamepad-variant-outline", gameOn,   "game")}
            ${this.room("Utility",    "mdi:home-floor-1",           utilityOn,"utility")}
            <button class="gl room alloff" data-action="all-off">
              <div class="rdot"></div>
              <ha-icon class="ri" icon="mdi:power"></ha-icon>
              <div class="rn">All Off</div>
            </button>
          </div>
        </section>
        ${this.climateSummary("Living Room · Climate",e.livingTemp,e.livingHumidity,e.livingAir)}
        ${this.climateSummary("Bedroom · Climate",e.bedTemp,e.bedHumidity,e.bedAir)}
        ${this.spotifySection(spotifyPic,spotifyTitle,spotifyArtist,spotifyAlbum,spotifyActive,spotifyPlaying,curPos,durSec,spProg,volPct)}
        <section class="gl media-strip">
          <div class="media-item">
            <ha-icon icon="mdi:television"></ha-icon>
            <div><b>Living Room TV</b><span>${tvState}</span></div>
          </div>
          <div class="media-item">
            <ha-icon icon="mdi:speaker"></ha-icon>
            <div><b>Dining Room</b><span>${spkNice}</span></div>
          </div>
        </section>
      </div>

      <!-- RIGHT: Tesla only -->
      <div class="col">
        ${this.teslaCard(batteryRaw,range,teslaPlace,climOn,targetTemp)}
      </div>
    </div>
    ${this.weatherSection(weatherState,weatherTemp,weatherHumidity,weatherWind,weatherFeels,weatherUV,weatherVis)}
  </div>

  ${this.roomPage("liv","Living Room","Kitchen · Dining · TV area",e.mainLights,e.livingTemp,e.livingHumidity,e.livingAir)}
  ${this.roomPage("bed","Bedroom","Sleep environment",e.bedroomLights,e.bedTemp,e.bedHumidity,e.bedAir)}
  ${this.roomPage("game","Game Room","Office · Gaming",e.gameLights)}
  ${this.toonPage(camSrc)}
  ${this.roomPage("util","Utility","Toilet · Hallway/Door",e.utilityLights)}
</div></ha-card>`;

    this.updateClock();
    this.bindEvents();
    if (this._tab === "toon") setTimeout(() => this.updateCamera(), 80);
  }

  // ── Events ────────────────────────────────────────────────────────────────────
  bindEvents() {
    this.shadowRoot.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("pointerdown", () => {
        this.playClick();
        btn.classList.add("is-pressed");
        btn.closest(".light-item")?.classList.add("item-pressed");
        setTimeout(() => {
          btn.classList.remove("is-pressed");
          btn.closest(".light-item")?.classList.remove("item-pressed");
        }, 180);
      });
    });

    this.shadowRoot.querySelectorAll("[data-tab]").forEach(btn =>
      btn.addEventListener("click", () => { this._tab = btn.dataset.tab; this.render(); }));

    this.shadowRoot.querySelectorAll("[data-room]").forEach(btn => {
      const map = { main:this.entities.mainLights, bedroom:this.entities.bedroomLights, game:this.entities.gameLights, utility:this.entities.utilityLights };
      btn.addEventListener("click", () => this.toggleGroup(map[btn.dataset.room]||[]));
    });

    this.shadowRoot.querySelectorAll("[data-entity]").forEach(btn =>
      btn.addEventListener("click", () => this.toggleEntity(btn.dataset.entity)));

    this.shadowRoot.querySelector("[data-action='all-off']")?.addEventListener("click", () => this.turnOffAll());

    // Brightness sliders — debounced, stop propagation so toggle doesn't fire
    const slideTimers = {};
    this.shadowRoot.querySelectorAll("[data-brightness-entity]").forEach(slider => {
      slider.addEventListener("pointerdown", e => e.stopPropagation());
      slider.addEventListener("click",       e => e.stopPropagation());
      slider.addEventListener("input", () => {
        const entity = slider.dataset.brightnessEntity;
        clearTimeout(slideTimers[entity]);
        slideTimers[entity] = setTimeout(() => {
          const brightness = Math.round(Number(slider.value) / 100 * 255);
          this.service("light","turn_on",{ entity_id: entity, brightness });
        }, 200);
      });
    });

    // Tesla
    this.shadowRoot.querySelector("[data-tesla='climate']")  ?.addEventListener("click", () => this.toggleClimate());
    this.shadowRoot.querySelector("[data-tesla='defrost']")  ?.addEventListener("click", () => this.toggleEntity(this.entities.teslaDefrost));
    this.shadowRoot.querySelector("[data-tesla='sentry']")   ?.addEventListener("click", () => this.toggleEntity(this.entities.teslaSentry));
    this.shadowRoot.querySelector("[data-tesla='charge']")   ?.addEventListener("click", () => this.toggleEntity(this.entities.teslaCharge));
    this.shadowRoot.querySelector("[data-tesla='wake']")     ?.addEventListener("click", () => this.service("button","press",{ entity_id:"button.model_3_wake" }));
    this.shadowRoot.querySelector("[data-tesla='temp-up']")  ?.addEventListener("click", () => this.setClimateTemp(0.5));
    this.shadowRoot.querySelector("[data-tesla='temp-down']")?.addEventListener("click", () => this.setClimateTemp(-0.5));

    // Spotify
    const tgt = () => this.mediaControlTarget();
    this.shadowRoot.querySelector("[data-sp='play-pause']")?.addEventListener("click", () => this.service("media_player","media_play_pause",{ entity_id:tgt() }));
    this.shadowRoot.querySelector("[data-sp='prev']")      ?.addEventListener("click", () => this.service("media_player","media_previous_track",{ entity_id:tgt() }));
    this.shadowRoot.querySelector("[data-sp='next']")      ?.addEventListener("click", () => this.service("media_player","media_next_track",{ entity_id:tgt() }));
    this.shadowRoot.querySelector("[data-sp='vol-up']")    ?.addEventListener("click", () => {
      const cur = Number(this.attr(this.entities.spotifySpeaker,"volume_level",0))||0;
      this.service("media_player","volume_set",{ entity_id:this.entities.spotifySpeaker, volume_level:Math.min(1,cur+0.05) });
    });
    this.shadowRoot.querySelector("[data-sp='vol-down']")  ?.addEventListener("click", () => {
      const cur = Number(this.attr(this.entities.spotifySpeaker,"volume_level",0))||0;
      this.service("media_player","volume_set",{ entity_id:this.entities.spotifySpeaker, volume_level:Math.max(0,cur-0.05) });
    });

    this.shadowRoot.querySelector("[data-action='cam-refresh']")?.addEventListener("click", () => this.updateCamera());
  }

  // ── Component Builders ────────────────────────────────────────────────────────
  tab(id, icon, label) {
    return `<button class="tab ${this._tab===id?"active":""}" data-tab="${id}">
      <ha-icon icon="${icon}"></ha-icon>${label}
    </button>`;
  }

  room(label, icon, on, group) {
    return `<button class="gl room ${on?"on":""}" data-room="${group}">
      <div class="rdot"></div>
      <ha-icon class="ri" icon="${icon}"></ha-icon>
      <div class="rn">${label}</div>
    </button>`;
  }

  aqDisplay(rawAq) {
    const aqLbl = this.aqLabel(rawAq);
    const aqc   = this.aqColor(rawAq);
    const n     = Number(rawAq);
    const isNum = Number.isFinite(n);
    const valHtml = isNum
      ? `<div class="cv" style="color:${aqc}">${n.toFixed(0)}<span class="cu" style="color:${aqc}99"> µg/m³</span></div>`
      : `<div class="cv aq-text" style="color:${aqc}">${aqLbl}</div>`;
    return { aqLbl, aqc, valHtml };
  }

  climateSummary(title, temp, humidity, air) {
    const rawAq = this.st(air, "--");
    const { aqLbl, aqc, valHtml } = this.aqDisplay(rawAq);
    return `<section class="gl block">
      <div class="slbl">${title}</div>
      <div class="clim-row">
        <div class="clim-col">
          <div class="cv">${this.fmt(temp,"","--",1)}<span class="cu">°</span></div>
          <div class="cl">Temperature</div>
          <div class="spark-wrap">${this.sparkline(temp)}</div>
        </div>
        <div class="clim-sep"></div>
        <div class="clim-col">
          <div class="cv">${this.fmt(humidity,"","--",0)}<span class="cu">%</span></div>
          <div class="cl">Humidity</div>
          <div class="spark-wrap">${this.sparkline(humidity,"rgba(100,180,255,.8)")}</div>
        </div>
        <div class="clim-sep"></div>
        <div class="clim-col aq-col">
          <div class="aq-dot" style="background:${aqc};box-shadow:0 0 9px ${aqc}99"></div>
          ${valHtml}
          <div class="cl" style="color:${aqc}bb">${aqLbl} · Air</div>
        </div>
      </div>
    </section>`;
  }

  teslaCard(pct, range, place, climOn, targetTemp) {
    const battColor = pct > 50 ? "#34d399" : pct > 20 ? "#fbbf24" : "#f87171";
    const climLabel = climOn ? `On · ${targetTemp}°C` : `Off · ${targetTemp}°C`;
    return `<section class="gl tc">
      <div class="tc-top">
        <div>
          <div class="tc-name">Model 3</div>
          <div class="tc-sub">Tesla</div>
        </div>
        <div class="tag">${place}</div>
      </div>
      <div class="tc-img-wrap">
        <div class="tc-glow"></div>
        <img class="tc-car" src="https://teslakortingscode.com/ha/tesla-model-3.png" alt="Model 3" draggable="false">
      </div>
      <div class="tc-stats">
        <div class="tc-batt-row">
          <div class="tc-pct" style="color:${battColor}">${Math.round(pct)}<span>%</span></div>
          <div class="tc-range">${range}</div>
        </div>
        <div class="tc-bar"><div class="tc-fill" style="width:${pct}%;background:${battColor}"></div></div>
        <div class="tc-clim-row">
          <div class="tc-clim-left">
            <ha-icon icon="mdi:fan" style="--mdc-icon-size:18px;color:rgba(255,255,255,.55)"></ha-icon>
            <div>
              <div class="tc-clim-lbl">Climate</div>
              <div class="tc-clim-val ${climOn?"climon":""}">${climLabel}</div>
            </div>
          </div>
          <div class="tc-temp-ctrl">
            <button class="tc-tbtn" data-tesla="temp-down">−</button>
            <span class="tc-tval">${targetTemp}°</span>
            <button class="tc-tbtn" data-tesla="temp-up">+</button>
          </div>
        </div>
      </div>
      <div class="tc-btns">
        ${this.teslaButton("climate","mdi:fan",                   "AC",      climOn)}
        ${this.teslaButton("defrost","mdi:car-defrost-front",     "Defrost", this.isOn(this.entities.teslaDefrost))}
        ${this.teslaButton("sentry", "mdi:shield-check-outline",  "Sentry",  this.isOn(this.entities.teslaSentry))}
        ${this.teslaButton("charge", "mdi:lightning-bolt-outline","Charge",  this.isOn(this.entities.teslaCharge))}
        ${this.teslaButton("wake",   "mdi:power-cycle",           "Wake",    false)}
      </div>
    </section>`;
  }

  teslaButton(action, icon, label, on) {
    return `<button class="tb ${on?"on":""}" data-tesla="${action}">
      <ha-icon icon="${icon}"></ha-icon><span>${label}</span>
    </button>`;
  }

  spotifySection(pic, title, artist, album, active, playing, curPos, durSec, progress, vol) {
    return `<section class="gl sp2">
      ${pic ? `<img class="sp-art" src="${pic}" alt="album">` : `<div class="sp-art sp-art-empty"><ha-icon icon="mdi:spotify"></ha-icon></div>`}
      <div class="sp-body">
        <div class="sp-track">${title||(active?"Playing":"Spotify")}</div>
        <div class="sp-artist">${artist||(active?"Unknown artist":"Nothing playing")}</div>
        ${album?`<div class="sp-album">${album}</div>`:""}
        <div class="sp-prog-wrap">
          <div class="sp-prog-bar"><div class="sp-prog-fill" style="width:${progress}%"></div></div>
          <div class="sp-times"><span>${this.fmtTime(curPos)}</span><span>${this.fmtTime(durSec)}</span></div>
        </div>
        <div class="sp-ctrl-row">
          <button class="sp-btn" data-sp="prev"><ha-icon icon="mdi:skip-previous"></ha-icon></button>
          <button class="sp-btn sp-play" data-sp="play-pause"><ha-icon icon="mdi:${playing?"pause":"play"}"></ha-icon></button>
          <button class="sp-btn" data-sp="next"><ha-icon icon="mdi:skip-next"></ha-icon></button>
          <div class="sp-vol-group">
            <button class="sp-btn sp-sm" data-sp="vol-down"><ha-icon icon="mdi:volume-minus"></ha-icon></button>
            <span class="sp-vol-lbl">${vol}%</span>
            <button class="sp-btn sp-sm" data-sp="vol-up"><ha-icon icon="mdi:volume-plus"></ha-icon></button>
          </div>
        </div>
      </div>
    </section>`;
  }

  weatherSection(state, temp, humidity, wind, feels, uv, vis) {
    const days = (this._forecast||[]).slice(0,5);
    const forecastHTML = days.length
      ? days.map(d => {
          const dt = new Date(d.datetime);
          const lbl = dt.toLocaleDateString([],{weekday:"short"});
          const hi = Math.round(d.temperature);
          const lo = d.templow!=null ? Math.round(d.templow) : Math.round(d.temperature-4);
          return `<div class="glsm wx-day">
            <div class="wxdn">${lbl}</div>
            <ha-icon class="wxdi" icon="${this.weatherIcon(d.condition||state)}"></ha-icon>
            <div class="wxdh">${hi}°</div>
            <div class="wxdl">${lo}°</div>
          </div>`;
        }).join("")
      : `<div class="wx-nof">Loading forecast…</div>`;

    const extras = [
      feels!=null ? {icon:"mdi:thermometer-lines",val:`${Math.round(feels)}°`,lbl:"Feels like"} : null,
      uv!=null    ? {icon:"mdi:white-balance-sunny",val:String(uv),lbl:"UV index"} : null,
      vis!=null   ? {icon:"mdi:eye-outline",val:`${Math.round(vis)} km`,lbl:"Visibility"} : null,
    ].filter(Boolean);

    return `<section class="gl wx-big">
      <div class="slbl">Weather · Outside</div>
      <div class="wx-hero">
        <div class="wx-hero-left">
          <ha-icon class="wx-ico-big" icon="${this.weatherIcon(state)}"></ha-icon>
          <div>
            <div class="wx-tmp-big">${temp}<span>°C</span></div>
            <div class="wx-cond-big">${state.replace(/-/g," ")}</div>
          </div>
        </div>
        <div class="wx-details">
          <div class="wx-det"><ha-icon icon="mdi:water-percent"></ha-icon><div class="wx-det-val">${humidity}%</div><div class="wx-det-lbl">Humidity</div></div>
          <div class="wx-det"><ha-icon icon="mdi:weather-windy"></ha-icon><div class="wx-det-val">${wind}</div><div class="wx-det-lbl">Wind km/h</div></div>
          ${extras.map(x=>`<div class="wx-det"><ha-icon icon="${x.icon}"></ha-icon><div class="wx-det-val">${x.val}</div><div class="wx-det-lbl">${x.lbl}</div></div>`).join("")}
        </div>
      </div>
      <div class="wx-sep"></div>
      <div class="wx-forecast">${forecastHTML}</div>
    </section>`;
  }

  lightItem(entity) {
    const name = (this.attr(entity,"friendly_name",null) || entity.split(".")[1]?.replace(/_/g," ") || entity);
    const on   = this.isOn(entity);
    const isLt = entity.startsWith("light.");
    const braw = isLt ? this.attr(entity,"brightness",null) : null;
    const bPct = braw !== null ? Math.round(braw / 255 * 100) : null;
    const icon = isLt ? (on?"mdi:lightbulb":"mdi:lightbulb-outline")
               : entity.includes("feeder") ? "mdi:food-drumstick-outline"
               : "mdi:toggle-switch-outline";
    return `<div class="light-item ${on?"on":""}">
      <button class="li-toggle" data-entity="${entity}">
        <div class="li-left">
          <ha-icon class="li-ico" icon="${icon}"></ha-icon>
          <div>
            <div class="li-name">${name}</div>
            <div class="li-sub">${on?(bPct!=null?bPct+"%":"On"):"Off"}</div>
          </div>
        </div>
        <div class="lisw"></div>
      </button>
      ${on && bPct !== null ? `<div class="li-slider-wrap">
        <ha-icon icon="mdi:brightness-4" style="--mdc-icon-size:12px;opacity:.35;color:#fff;flex-shrink:0"></ha-icon>
        <input type="range" class="li-slider" min="1" max="100" value="${bPct}" data-brightness-entity="${entity}">
        <ha-icon icon="mdi:brightness-7" style="--mdc-icon-size:12px;opacity:.7;color:#fff;flex-shrink:0"></ha-icon>
      </div>` : ""}
    </div>`;
  }

  climateDetail(temp, humidity, air) {
    const rawAq = this.st(air, "--");
    const { aqLbl, aqc, valHtml } = this.aqDisplay(rawAq);
    return `<section class="gl block">
      <div class="slbl">Climate</div>
      <div class="clim-row">
        <div class="clim-col">
          <div class="cv">${this.fmt(temp,"","--",1)}<span class="cu">°C</span></div>
          <div class="cl">Temperature</div>
          <div class="spark-wrap">${this.sparkline(temp)}</div>
        </div>
        <div class="clim-sep"></div>
        <div class="clim-col">
          <div class="cv">${this.fmt(humidity,"","--",0)}<span class="cu">%</span></div>
          <div class="cl">Humidity</div>
          <div class="spark-wrap">${this.sparkline(humidity,"rgba(100,180,255,.8)")}</div>
        </div>
        <div class="clim-sep"></div>
        <div class="clim-col aq-col">
          <div class="aq-dot" style="background:${aqc};box-shadow:0 0 9px ${aqc}99"></div>
          ${valHtml}
          <div class="cl" style="color:${aqc}bb">${aqLbl} · Air</div>
        </div>
      </div>
    </section>`;
  }

  roomPage(id, title, sub, entities, temp, humidity, air) {
    const rk = id==="liv"?"main":id==="bed"?"bedroom":id==="game"?"game":"utility";
    const climate = temp
      ? `<div class="col">${this.climateDetail(temp,humidity,air)}</div>`
      : `<div class="col">${this.sceneList(title)}</div>`;
    return `<div class="page ${this._tab===id?"active":""} z1">
      <div class="g2">
        <div class="col">
          <section class="gl rp-hero">
            <div class="slbl">${title}</div>
            <div class="rp-title">${title}</div>
            <div class="rp-sub">${sub}</div>
            <button class="big-toggle ${this.anyOn(entities)?"on":""}" data-room="${rk}">
              <div class="bt-label">All Lights · ${this.countOn(entities)} on</div>
              <div class="sw"></div>
            </button>
          </section>
          <section class="gl block">
            <div class="slbl">Lights</div>
            <div class="light-list">${entities.map(en=>this.lightItem(en)).join("")}</div>
          </section>
        </div>
        ${climate}
      </div>
    </div>`;
  }

  sceneList(title) {
    return `<section class="gl block">
      <div class="slbl">${title} · Scenes</div>
      <button class="scene-item"><div class="sc-left"><ha-icon class="sc-ico" icon="mdi:weather-night"></ha-icon><div><div class="sc-name">Calm</div><div class="sc-sub">Dim warm ambient</div></div></div><ha-icon class="chev" icon="mdi:chevron-right"></ha-icon></button>
      <button class="scene-item"><div class="sc-left"><ha-icon class="sc-ico" icon="mdi:white-balance-sunny"></ha-icon><div><div class="sc-name">Bright</div><div class="sc-sub">Clear working light</div></div></div><ha-icon class="chev" icon="mdi:chevron-right"></ha-icon></button>
    </section>`;
  }

  toonPage(camSrc) {
    const e = this.entities;
    const feederOn = this.anyOn(e.toonDevices);
    return `<div class="page ${this._tab==="toon"?"active":""} z1">
      <div class="g2">
        <div class="col">
          <section class="gl rp-hero">
            <div class="slbl">Toon's Room</div>
            <div class="rp-title">Toon's Room</div>
            <div class="rp-sub">Pet feeder · Litter box</div>
            <div class="pet-status ${feederOn?"on":""}">
              <ha-icon icon="mdi:food-drumstick-outline"></ha-icon>
              <div><b>${feederOn?"Active":"Standby"}</b><span>Feeder controls</span></div>
            </div>
          </section>
          <section class="gl block">
            <div class="slbl">Pet Feeder</div>
            <div class="light-list">${e.toonDevices.map(en=>this.lightItem(en)).join("")}</div>
          </section>
          <section class="gl block">
            <div class="slbl">Litter Box</div>
            <div class="clim-row">
              <div class="clim-col">
                <div class="cv">${this.fmt(e.toonSensors[0],"","--",0)}<span class="cu">g</span></div>
                <div class="cl">Cat Weight</div>
              </div>
              <div class="clim-sep"></div>
              <div class="clim-col">
                <div class="cv">${this.fmt(e.toonSensors[2],"","--",0)}</div>
                <div class="cl">Visits Today</div>
              </div>
              <div class="clim-sep"></div>
              <div class="clim-col">
                <div class="cv">${this.fmt(e.toonSensors[1],"","--",0)}<span class="cu">s</span></div>
                <div class="cl">Duration</div>
              </div>
            </div>
          </section>
        </div>
        <div class="col">
          <section class="gl block cam-section">
            <div class="slbl-row">
              <div class="slbl" style="margin:0">Pet Feeder Camera</div>
              <button class="cam-btn" data-action="cam-refresh"><ha-icon icon="mdi:refresh"></ha-icon> Refresh</button>
            </div>
            <div class="cam-wrap">
              <img class="cam-feed" ${camSrc?`src="${camSrc}"`:""}  alt="Pet Feeder Camera"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
              <div class="cam-err" style="${camSrc?"display:none":"display:flex"}">
                <ha-icon icon="mdi:cctv-off"></ha-icon>
                <span>Camera unavailable<br><small>${e.petFeederCamera}</small></span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>`;
  }

  // ── CSS ───────────────────────────────────────────────────────────────────────
  css() { return `
:host{display:block;width:100%}
ha-card{background:transparent;border:0;box-shadow:none;overflow:visible;min-height:100vh}
*{box-sizing:border-box;margin:0;padding:0}
button{font:inherit;color:inherit;border:0;text-align:inherit;cursor:pointer;background:none}

/* Shell — full viewport, no max-width */
.dash{width:100%;min-height:100vh;max-width:none;border-radius:0;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",system-ui,sans-serif;position:relative;background:#060818;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 15% 85%,rgba(0,180,255,.42),transparent 55%),radial-gradient(ellipse 60% 50% at 80% 10%,rgba(130,60,255,.38),transparent 55%),radial-gradient(ellipse 50% 40% at 50% 50%,rgba(30,10,80,.8),transparent 70%),linear-gradient(160deg,#06091c 0%,#0b0630 40%,#050c1e 100%);pointer-events:none}
.bg::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 30% 20% at 10% 70%,rgba(0,220,255,.22),transparent 50%)}
.z1{position:relative;z-index:1}

/* Glass */
.gl{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:14px}
.glsm{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-radius:10px}
.slbl{font-size:9px;font-weight:700;color:rgba(255,255,255,.38);letter-spacing:1.1px;text-transform:uppercase;margin-bottom:7px}
.block{padding:10px}

/* Topbar */
.topbar{display:flex;align-items:center;justify-content:space-between;padding:10px 16px 6px}
.home-lbl{font-size:12px;font-weight:700;color:rgba(255,255,255,.55);letter-spacing:1.4px;text-transform:uppercase}
.home-sub{font-size:9px;color:rgba(255,255,255,.32);margin-top:1px}
.clock-wrap{text-align:right}
.clk-time{font-size:22px;font-weight:200;color:rgba(255,255,255,.92);letter-spacing:-1px;line-height:1}
.clk-date{font-size:10px;color:rgba(255,255,255,.5);margin-top:1px}

/* Tabs */
.tabs{display:flex;gap:4px;padding:0 12px 7px;overflow-x:auto;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{flex-shrink:0;display:flex;align-items:center;gap:5px;padding:6px 11px;border-radius:20px;font-size:11px;font-weight:700;color:rgba(255,255,255,.48);border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.05);transition:all .18s,transform .08s;white-space:nowrap}
.tab ha-icon{--mdc-icon-size:13px;opacity:.7}
.tab:hover{color:rgba(255,255,255,.70);background:rgba(255,255,255,.09)}
.tab.active{background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.28);color:rgba(255,255,255,.96)}
.tab.active ha-icon{opacity:1}
.divider{height:1px;background:rgba(255,255,255,.07);margin:0 12px}

/* Page layout */
.page{display:none;flex:1;padding:8px 10px 10px;flex-direction:column;overflow-y:auto;scrollbar-width:none}
.page::-webkit-scrollbar{display:none}
.page.active{display:flex}
.page-ov{gap:8px}
.ov-main{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}
.col{display:flex;flex-direction:column;gap:7px;min-width:0}

/* Press/active */
button{transition:transform .08s ease,filter .08s ease,box-shadow .1s}
button.is-pressed{transform:scale(.93)!important;filter:brightness(1.2)}
.light-item.item-pressed{transform:scale(.99)!important}
.tb.is-pressed{box-shadow:0 0 14px rgba(167,139,250,.5)!important}
.tb.on.is-pressed{box-shadow:0 0 20px rgba(167,139,250,.7)!important}
.room.is-pressed{box-shadow:0 0 12px rgba(167,139,250,.35)!important}
.sp-play.is-pressed{box-shadow:0 0 16px rgba(29,185,84,.6)!important}
.tc-tbtn.is-pressed{background:rgba(255,255,255,.25)!important}

/* Rooms */
.rooms5{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}
.room{padding:9px 4px 8px;transition:all .18s,transform .08s;position:relative;border-radius:12px;text-align:center}
.room:hover{background:rgba(255,255,255,.09)}
.room.on{background:rgba(255,255,255,.11);border-color:rgba(200,180,255,.22)}
.ri{--mdc-icon-size:17px;color:rgba(255,255,255,.42);margin:0 auto 3px;display:block;transition:color .18s}
.room.on .ri{color:rgba(225,215,255,.98)}
.rn{font-size:9px;font-weight:700;color:rgba(255,255,255,.52);line-height:1.25}
.room.on .rn{color:rgba(255,255,255,.94)}
.rdot{position:absolute;top:5px;right:5px;width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.1)}
.room.on .rdot{background:#a78bfa}
.alloff .rdot{background:rgba(248,113,113,.35)}
.alloff .ri{color:rgba(248,113,113,.55)}
.tag{font-size:9px;color:rgba(255,255,255,.6);background:rgba(255,255,255,.1);padding:3px 8px;border-radius:9px;border:1px solid rgba(255,255,255,.13);text-transform:capitalize}

/* Climate summary — 3-col with sparklines */
.clim-row{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:start;gap:0}
.clim-sep{width:1px;height:100%;min-height:60px;background:rgba(255,255,255,.09);margin:0 4px;align-self:stretch}
.clim-col{padding:2px 6px;text-align:center;display:flex;flex-direction:column;align-items:center}
.aq-col{justify-content:center;padding-top:4px}
.cv{font-size:20px;font-weight:300;color:rgba(255,255,255,.95);letter-spacing:-0.8px;line-height:1}
.cu{font-size:10px;color:rgba(255,255,255,.48)}
.cl{font-size:8px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.5px;margin-top:3px;white-space:nowrap}
.spark-wrap{width:100%;height:32px;margin-top:6px;overflow:hidden}
.spark{width:100%;height:32px;display:block}
.spark-empty{width:100%;height:32px;border-bottom:1px solid rgba(255,255,255,.06)}
.aq-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;animation:aq-breathe 2.5s ease-in-out infinite;margin-bottom:4px}
.aq-text{font-size:17px!important;font-weight:700!important;text-transform:capitalize}
@keyframes aq-breathe{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.82)}}

/* Tesla card — Tesla-app style */
.tc{overflow:hidden;padding:0}
.tc-top{display:flex;justify-content:space-between;align-items:center;padding:11px 13px 5px}
.tc-brand{display:flex;align-items:center;gap:8px}
.tc-name{font-size:17px;font-weight:700;color:rgba(255,255,255,.92);letter-spacing:-.3px}
.tc-sub{font-size:9px;color:rgba(255,255,255,.38);letter-spacing:.8px;text-transform:uppercase;margin-top:1px}
.tc-img-wrap{width:100%;height:165px;position:relative;background:radial-gradient(ellipse 90% 80% at 50% 65%,rgba(18,18,45,.98),rgba(6,6,20,.99) 100%);display:flex;align-items:center;justify-content:center;overflow:hidden}
.tc-glow{position:absolute;bottom:0;left:0;right:0;height:50px;background:radial-gradient(ellipse 90% 100% at 50% 100%,rgba(60,90,220,.2),transparent 70%);pointer-events:none}
.tc-car{width:96%;height:100%;object-fit:contain;object-position:center 60%;filter:drop-shadow(0 14px 22px rgba(0,0,0,.65));pointer-events:none;user-select:none;position:relative;z-index:1}
.tc-stats{padding:9px 13px 6px}
.tc-batt-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px}
.tc-pct{font-size:42px;font-weight:800;letter-spacing:-2.5px;line-height:1}
.tc-pct span{font-size:16px;font-weight:400;color:rgba(255,255,255,.45);margin-left:2px}
.tc-range{font-size:14px;font-weight:600;color:rgba(255,255,255,.58)}
.tc-bar{height:4px;background:rgba(255,255,255,.12);border-radius:2px;margin-bottom:10px;overflow:hidden}
.tc-fill{height:100%;border-radius:2px;transition:width .4s}
.tc-clim-row{display:flex;justify-content:space-between;align-items:center}
.tc-clim-left{display:flex;align-items:center;gap:9px}
.tc-clim-lbl{font-size:9px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.5px}
.tc-clim-val{font-size:12px;font-weight:600;color:rgba(255,255,255,.68);margin-top:1px}
.tc-clim-val.climon{color:#34d399}
.tc-temp-ctrl{display:flex;align-items:center;gap:9px}
.tc-tbtn{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18)!important;display:flex;align-items:center;justify-content:center;font-size:20px;line-height:1;color:rgba(255,255,255,.82);transition:all .15s;flex-shrink:0}
.tc-tbtn:hover{background:rgba(255,255,255,.17)}
.tc-tval{font-size:15px;font-weight:600;color:rgba(255,255,255,.82);min-width:36px;text-align:center}
.tc-btns{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;padding:8px 10px;border-top:1px solid rgba(255,255,255,.07)}
.tb{padding:7px 3px;text-align:center;transition:all .18s,transform .08s;border-radius:9px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06)}
.tb:hover{background:rgba(255,255,255,.1)}
.tb.on{background:rgba(167,139,250,.16);border-color:rgba(167,139,250,.42);box-shadow:0 0 9px rgba(167,139,250,.22)}
.tb ha-icon{display:block;--mdc-icon-size:14px;color:rgba(255,255,255,.5);margin:0 auto 3px}
.tb.on ha-icon{color:#c4b5fd}
.tb span{font-size:8px;color:rgba(255,255,255,.44);text-transform:uppercase;letter-spacing:.3px;font-weight:700}
.tb.on span{color:rgba(200,185,255,.82)}

/* Weather */
.wx-big{padding:11px 13px}
.wx-hero{display:flex;align-items:center;gap:16px;margin-bottom:10px}
.wx-hero-left{display:flex;align-items:center;gap:11px;flex-shrink:0}
.wx-ico-big{--mdc-icon-size:42px;color:rgba(255,255,255,.75)}
.wx-tmp-big{font-size:34px;font-weight:200;color:rgba(255,255,255,.96);letter-spacing:-1.5px;line-height:1}
.wx-tmp-big span{font-size:15px;color:rgba(255,255,255,.48)}
.wx-cond-big{font-size:10px;color:rgba(255,255,255,.5);margin-top:3px;text-transform:capitalize;letter-spacing:.3px}
.wx-details{display:flex;gap:6px;flex-wrap:wrap;flex:1}
.wx-det{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:55px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:7px 9px;flex:1}
.wx-det ha-icon{--mdc-icon-size:15px;color:rgba(255,255,255,.5)}
.wx-det-val{font-size:13px;font-weight:600;color:rgba(255,255,255,.86)}
.wx-det-lbl{font-size:8px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.4px;text-align:center}
.wx-sep{height:1px;background:rgba(255,255,255,.08);margin:9px 0}
.wx-forecast{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.wx-nof{color:rgba(255,255,255,.28);font-size:10px;padding:10px;text-align:center}
.wx-day{text-align:center;padding:8px 4px}
.wxdn{font-size:8px;color:rgba(255,255,255,.46);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
.wxdi{--mdc-icon-size:18px;color:rgba(255,255,255,.62);margin-bottom:4px;display:block}
.wxdh{font-size:13px;font-weight:600;color:rgba(255,255,255,.82)}
.wxdl{font-size:10px;color:rgba(255,255,255,.4);margin-top:2px}

/* Spotify */
.sp2{padding:10px 11px;display:flex;gap:11px;align-items:flex-start}
.sp-art{width:78px;height:78px;border-radius:9px;object-fit:cover;flex-shrink:0;border:1px solid rgba(255,255,255,.12)}
.sp-art-empty{width:78px;height:78px;border-radius:9px;flex-shrink:0;background:linear-gradient(145deg,rgba(29,185,84,.25),rgba(29,185,84,.06));border:1px solid rgba(29,185,84,.3);display:flex;align-items:center;justify-content:center}
.sp-art-empty ha-icon{--mdc-icon-size:32px;color:#1DB954}
.sp-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.sp-track{font-size:13px;font-weight:800;color:rgba(255,255,255,.92);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2}
.sp-artist{font-size:10px;color:rgba(255,255,255,.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sp-album{font-size:8px;color:rgba(255,255,255,.3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sp-prog-wrap{margin-top:6px}
.sp-prog-bar{height:3px;border-radius:3px;background:rgba(255,255,255,.12);overflow:hidden}
.sp-prog-fill{height:100%;border-radius:3px;background:#1DB954;transition:width .5s linear}
.sp-times{display:flex;justify-content:space-between;font-size:8px;color:rgba(255,255,255,.32);margin-top:2px}
.sp-ctrl-row{display:flex;align-items:center;gap:5px;margin-top:6px}
.sp-btn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1)!important;border-radius:8px;padding:5px 8px;display:flex;align-items:center;justify-content:center;transition:all .15s,transform .08s}
.sp-btn:hover{background:rgba(255,255,255,.14)}
.sp-btn ha-icon{--mdc-icon-size:15px;color:rgba(255,255,255,.72)}
.sp-play{background:rgba(29,185,84,.18);border-color:rgba(29,185,84,.38)!important;padding:6px 11px}
.sp-play:hover{background:rgba(29,185,84,.28)}
.sp-play ha-icon{--mdc-icon-size:16px;color:#1DB954}
.sp-sm ha-icon{--mdc-icon-size:12px}
.sp-vol-group{display:flex;align-items:center;gap:3px;margin-left:auto}
.sp-vol-lbl{font-size:9px;color:rgba(255,255,255,.42);min-width:26px;text-align:center}

/* Media strip */
.media-strip{padding:8px 11px;display:grid;grid-template-columns:1fr 1fr;gap:7px}
.media-item{display:flex;align-items:center;gap:7px;min-width:0}
.media-item ha-icon{--mdc-icon-size:17px;color:rgba(255,255,255,.68)}
.media-item b{display:block;font-size:10px;color:rgba(255,255,255,.86);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.media-item span{display:block;font-size:8px;color:rgba(255,255,255,.52);margin-top:1px}

/* Room pages */
.rp-hero{padding:12px}
.rp-title{font-size:18px;font-weight:200;color:rgba(255,255,255,.85);margin-bottom:2px;letter-spacing:-.5px}
.rp-sub{font-size:9px;color:rgba(255,255,255,.25)}
.big-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;margin-top:9px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09)!important;transition:all .18s,transform .08s}
.big-toggle:hover{background:rgba(255,255,255,.09)}
.big-toggle.on{background:rgba(167,139,250,.13);border-color:rgba(167,139,250,.3)!important;box-shadow:0 0 14px rgba(167,139,250,.16)}
.bt-label{font-size:11px;font-weight:600;color:rgba(255,255,255,.5)}
.big-toggle.on .bt-label{color:rgba(200,185,255,.87)}
.sw{width:34px;height:18px;border-radius:9px;background:rgba(255,255,255,.12);position:relative;transition:background .2s}
.sw::after{content:"";position:absolute;top:3px;left:3px;width:12px;height:12px;border-radius:50%;background:rgba(255,255,255,.42);transition:all .2s}
.big-toggle.on .sw{background:#7c3aed}
.big-toggle.on .sw::after{left:19px;background:#fff}

/* Light list + brightness slider */
.light-list{display:flex;flex-direction:column;gap:5px}
.light-item{border-radius:11px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);transition:background .18s,border-color .18s,box-shadow .18s,transform .08s;overflow:hidden}
.light-item:hover{background:rgba(255,255,255,.09)}
.light-item.on{background:rgba(167,139,250,.13);border-color:rgba(167,139,250,.3);box-shadow:0 0 7px rgba(167,139,250,.13)}
.li-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;padding:8px 11px;background:none;border:0!important;cursor:pointer;gap:8px;min-width:0}
.li-left{display:flex;align-items:center;gap:8px;min-width:0;flex:1}
.li-ico{--mdc-icon-size:15px;color:rgba(255,255,255,.5);flex-shrink:0}
.light-item.on .li-ico{color:rgba(220,210,255,.94)}
.li-name{font-size:11px;font-weight:700;color:rgba(255,255,255,.72);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left}
.light-item.on .li-name{color:rgba(255,255,255,.94)}
.li-sub{font-size:8px;color:rgba(255,255,255,.4);margin-top:1px;text-align:left}
.lisw{width:28px;height:15px;border-radius:8px;background:rgba(255,255,255,.1);position:relative;flex-shrink:0;transition:background .2s}
.lisw::after{content:"";position:absolute;top:2.5px;left:2.5px;width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.35);transition:all .2s}
.light-item.on .lisw{background:#7c3aed}
.light-item.on .lisw::after{left:15px;background:#fff}
.li-slider-wrap{display:flex;align-items:center;gap:5px;padding:0 11px 8px}
.li-slider{-webkit-appearance:none;appearance:none;flex:1;height:3px;border-radius:3px;background:rgba(167,139,250,.25);outline:none;cursor:pointer}
.li-slider::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;border-radius:50%;background:rgba(200,185,255,.92);cursor:pointer;box-shadow:0 1px 5px rgba(0,0,0,.35)}
.li-slider::-moz-range-thumb{width:15px;height:15px;border-radius:50%;background:rgba(200,185,255,.92);cursor:pointer;border:0}

/* Climate detail */
.cd-full{grid-column:span 2;padding:7px 10px;display:flex;align-items:center;justify-content:space-between;color:rgba(255,255,255,.38);font-size:10px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07)}
.cd-aq-val{font-size:13px;font-weight:700;text-transform:capitalize}

/* Scenes */
.scene-item{width:100%;display:flex;align-items:center;justify-content:space-between;padding:8px 11px;border-radius:10px;border:1px solid rgba(255,255,255,.07)!important;background:rgba(255,255,255,.04);transition:all .18s;margin-bottom:5px}
.scene-item:hover{background:rgba(255,255,255,.07)}
.sc-left{display:flex;align-items:center;gap:8px}
.sc-ico{--mdc-icon-size:14px;color:rgba(255,255,255,.26)}
.sc-name{font-size:10px;font-weight:500;color:rgba(255,255,255,.44)}
.sc-sub{font-size:8px;color:rgba(255,255,255,.2);margin-top:1px}
.chev{--mdc-icon-size:13px;color:rgba(255,255,255,.18)}

/* Toon / Camera */
.pet-status{display:flex;align-items:center;gap:10px;margin-top:9px;padding:9px 11px;border-radius:11px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}
.pet-status.on{background:rgba(167,139,250,.13);border-color:rgba(167,139,250,.28)}
.pet-status ha-icon{--mdc-icon-size:22px;color:rgba(255,255,255,.68)}
.pet-status b{display:block;font-size:11px;color:rgba(255,255,255,.88)}
.pet-status span{display:block;font-size:9px;color:rgba(255,255,255,.5);margin-top:1px}
.cam-section{overflow:hidden}
.slbl-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.cam-btn{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12)!important;border-radius:8px;padding:5px 9px;display:flex;align-items:center;gap:4px;font-size:9px;color:rgba(255,255,255,.6);font-weight:700}
.cam-btn ha-icon{--mdc-icon-size:13px;color:rgba(255,255,255,.5)}
.cam-btn:hover{background:rgba(255,255,255,.12)}
.cam-wrap{border-radius:10px;overflow:hidden;background:rgba(0,0,0,.4);min-height:150px;display:flex;align-items:center;justify-content:center}
.cam-feed{width:100%;height:auto;display:block;border-radius:10px}
.cam-err{flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:24px;color:rgba(255,255,255,.3);font-size:10px;text-align:center;min-height:150px}
.cam-err ha-icon{--mdc-icon-size:28px}
.cam-err small{font-size:8px;opacity:.7}

/* Responsive */
@media(max-width:840px){
  .ov-main,.g2{grid-template-columns:1fr}
  .rooms5{grid-template-columns:repeat(3,1fr)}
  .tc-img-wrap{height:140px}
  .wx-forecast{grid-template-columns:repeat(3,1fr)}
  .media-strip{grid-template-columns:1fr}
  .sp2{flex-direction:column}
  .sp-art,.sp-art-empty{width:100%;height:100px}
  .clim-row{grid-template-columns:1fr auto 1fr}
  .clim-row .clim-sep:last-of-type,.clim-row .aq-col{display:none}
}
`; }
}

customElements.define("glass-dashboard-card", GlassDashboardCard);

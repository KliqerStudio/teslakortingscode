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
    this._lastSig = "";
    this._renderDebounce = null;
    this._optimistic = new Map();
    this._notice = null;
    this._noticeTimer = null;
    this._audioCtx = null;
    this._lastClickSound = 0;
    this._energy = { prefs: null, stats: {}, period: "day", loadedAt: {}, loading: false, loadingPeriods: new Set() };
    this._energyRate = 0.29; // €/kWh — change to match your contract
    this.entities = {
      mainLights: [
        "light.lounge_light","light.living_room","light.reading_light",
        "light.dining_room","light.led_keuken_boven","light.led_keuken_onder",
        "light.led_strip_4","light.govee_tv_left","light.govee_tv_right",
        "light.rgbic_tv_backlight","light.tv_left","light.tv_right","light.marylin",
      ],
      bedroomLights: ["light.bed","light.kast","light.closet","light.ants_closet","switch.night_light"],
      gameLights: [
        "light.plafond","light.desk_lamp","light.desk_led_strip",
        "light.battletron_smart_desk_light_strip","light.battletron_smart_desk_light_strip_2",
        "light.watch_light",
      ],
      utilityLights: ["light.toilet","light.hallway_door"],
      livingTemp:     "sensor.living_room_sensor_temperature",
      livingHumidity: "sensor.living_room_sensor_humidity",
      livingAir:      "sensor.living_room_sensor_air_quality",
      bedTemp:        "sensor.bedroom_sensor_temperature",
      bedHumidity:    "sensor.bedroom_sensor_humidity",
      bedAir:         "sensor.bedroom_sensor_air_quality",
      weather:        "weather.buienradar",
      teslaClimate:   "climate.model_3_climate",
      teslaBattery:   "sensor.model_3_battery_level",
      teslaRange:     "sensor.model_3_battery_range",
      teslaLocation:  "device_tracker.model_3_location",
      teslaSentry:    "switch.model_3_sentry_mode",
      teslaInsideTemp:"sensor.model_3_inside_temperature",
      p1Power:        "sensor.p1_meter_power",
      p1Return:       "",
      p1Gas:          "",
      p1EnergyToday:  "sensor.p1_meter_energy_import",
      vattenfallElectricityPrice: "sensor.stroom_all_in_huidig",
      vattenfallGasPrice:         "sensor.gas_all_in_huidig",
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
    if (this._noticeTimer) window.clearTimeout(this._noticeTimer);
    this._audioCtx?.close?.();
    this._audioCtx = null;
  }

  set hass(hass) {
    this._hass = hass;
    this.loadForecast();
    this.loadHistory();
    this.loadEnergy();
    // Only re-render when relevant entity states actually changed.
    // This prevents the Tesla image (and everything else) from flickering
    // every time HA sends ANY state update (which can be every few seconds).
    const sig = this._stateSig();
    if (sig !== this._lastSig) {
      this._lastSig = sig;
      clearTimeout(this._renderDebounce);
      this._renderDebounce = setTimeout(() => this.render(), 100);
    }
    if (!this._timer) this._timer = window.setInterval(() => this.updateClock(), 10000);
  }

  _stateSig() {
    if (!this._hass) return "";
    const e = this.entities;
    const watch = [
      ...e.mainLights, ...e.bedroomLights, ...e.gameLights, ...e.utilityLights, ...e.toonDevices,
      e.livingTemp, e.livingHumidity, e.livingAir,
      e.bedTemp, e.bedHumidity, e.bedAir, e.weather,
      e.teslaClimate, e.teslaBattery, e.teslaRange, e.teslaLocation,
      e.teslaSentry, e.teslaInsideTemp,
      e.spotify, e.spotifySpeaker, e.tv, e.petFeederCamera,
      e.p1Power, e.p1Return, e.p1EnergyToday,
      e.vattenfallElectricityPrice, e.vattenfallGasPrice,
    ];
    return watch.filter(Boolean).map(k => {
      const s = this._hass.states?.[k];
      return s ? `${s.state}|${s.last_changed}` : "";
    }).join("~");
  }

  getCardSize() { return 14; }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  st(entity, fallback = "Unknown") {
    const opt = this.optimisticState(entity);
    if (opt) return opt;
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
    const opt = this.optimisticState(entity);
    return ["on","heat","cool","heat_cool","playing","home","open","charging"].includes(
      opt || this._hass?.states?.[entity]?.state
    );
  }
  isAvailable(entity) {
    const s = this._hass?.states?.[entity]?.state;
    return Boolean(s && s !== "unavailable" && s !== "unknown");
  }
  actionable(entities) {
    return entities.filter(entity => this._hass?.states?.[entity] && this.isAvailable(entity));
  }
  optimisticState(entity) {
    const opt = this._optimistic.get(entity);
    if (!opt) return null;
    if (opt.until < Date.now()) {
      this._optimistic.delete(entity);
      return null;
    }
    return opt.state;
  }
  setOptimistic(entities, state, ttl = 3000) {
    const until = Date.now() + ttl;
    entities.forEach(entity => this._optimistic.set(entity, { state, until }));
  }
  showNotice(title, body, action = null) {
    this._notice = { title, body, action };
    if (this._noticeTimer) window.clearTimeout(this._noticeTimer);
    this._noticeTimer = window.setTimeout(() => {
      this._notice = null;
      this.render();
    }, 12000);
    this.render();
  }
  handleTeslaCommandError(err) {
    const msg = String(err?.message || err || "");
    if (/key|paired|signed command|whitelist/i.test(msg)) {
      this.showNotice(
        "Tesla key not paired",
        "Open the Tesla app or vehicle Locks screen and confirm Home Assistant is still paired for commands."
      );
      return true;
    }
    this.showNotice("Tesla command failed", msg || "Home Assistant could not send the command.");
    return true;
  }
  anyOn(entities)   { return this.actionable(entities).some(e => this.isOn(e)); }
  countOn(entities) { return this.actionable(entities).filter(e => this.isOn(e)).length; }
  service(domain, svc, data) { return this._hass?.callService(domain, svc, data); }
  async toggleEntity(entity) {
    if (!this._hass?.states?.[entity] || !this.isAvailable(entity)) return;
    const domain = entity.split(".")[0];
    const turnable = ["light","switch","input_boolean","fan"].includes(domain);
    const targetOn = !this.isOn(entity);
    if (turnable) {
      this.setOptimistic([entity], targetOn ? "on" : "off");
      this.render();
      try {
        await this.service(domain, targetOn ? "turn_on" : "turn_off", { entity_id: entity });
      } catch (err) {
        this._optimistic.delete(entity);
        if (entity.includes("model_3")) this.handleTeslaCommandError(err);
        else this.render();
        console.warn("[GlassDash] toggle entity failed:", entity, err);
      }
      return;
    }
    try {
      await this.service(domain, "toggle", { entity_id: entity });
    } catch (err) {
      if (entity.includes("model_3")) this.handleTeslaCommandError(err);
      console.warn("[GlassDash] generic toggle failed:", entity, err);
    }
  }
  async toggleGroup(entities) {
    const targets = this.actionable(entities);
    if (!targets.length) return;
    const targetOn = !targets.some(e => this.isOn(e));
    this.setOptimistic(targets, targetOn ? "on" : "off");
    this.render();
    try {
      await this.service("homeassistant", targetOn ? "turn_on" : "turn_off", { entity_id: targets });
    } catch (err) {
      targets.forEach(entity => this._optimistic.delete(entity));
      this.render();
      console.warn("[GlassDash] toggle group failed:", err);
    }
  }
  turnOffAll() {
    const targets = this.actionable([
      ...this.entities.mainLights,...this.entities.bedroomLights,
      ...this.entities.gameLights,...this.entities.utilityLights,
    ]);
    this.setOptimistic(targets, "off");
    this.render();
    this.service("homeassistant","turn_off",{ entity_id: targets });
  }
  async toggleClimate() {
    const cur = this._hass?.states?.[this.entities.teslaClimate]?.state;
    const targetOn = cur === "off";
    this.setOptimistic([this.entities.teslaClimate], targetOn ? "heat_cool" : "off");
    this.render();
    try {
      await this.service("climate", targetOn ? "turn_on" : "turn_off", { entity_id: this.entities.teslaClimate });
    } catch (err) {
      this._optimistic.delete(this.entities.teslaClimate);
      this.handleTeslaCommandError(err);
      console.warn("[GlassDash] Tesla climate failed:", err);
    }
  }
  async setClimateTemp(delta) {
    const cur = Number(this.attr(this.entities.teslaClimate,"temperature",22));
    try {
      await this.service("climate","set_temperature",{
        entity_id: this.entities.teslaClimate,
        temperature: Math.round((cur + delta) * 2) / 2,
      });
    } catch (err) {
      this.handleTeslaCommandError(err);
      console.warn("[GlassDash] Tesla temp failed:", err);
    }
  }
  mediaState(entity, fallback = "idle") {
    if (!entity) return fallback;
    const s = this._hass?.states?.[entity]?.state;
    if (!s) return fallback;
    if (s === "unavailable" || s === "unknown") return "unavailable";
    return s;
  }
  mediaControlTarget() {
    const choices = [this.entities.spotify, this.entities.spotifySpeaker, this.entities.tv];
    return (
      choices.find(en => ["playing","paused"].includes(this.mediaState(en))) ||
      [this.entities.spotifySpeaker, this.entities.tv, this.entities.spotify].find(en => ["on","idle"].includes(this.mediaState(en))) ||
      this.entities.tv
    );
  }
  mediaInfoEntity() {
    const choices = [this.entities.spotify, this.entities.spotifySpeaker, this.entities.tv];
    return (
      choices.find(en => ["playing","paused"].includes(this.mediaState(en))) ||
      [this.entities.tv, this.entities.spotifySpeaker].find(en => this.mediaState(en) === "on") ||
      this.entities.spotify
    );
  }
  async mediaPlayPause() {
    const target = this.mediaControlTarget();
    const isPlaying = this.mediaState(target) === "playing";
    try {
      await this.service("media_player", isPlaying ? "media_pause" : "media_play", { entity_id: target });
    } catch (err) {
      console.warn("[GlassDash] media play/pause fallback:", err);
      try {
        await this.service("media_player", "media_play_pause", { entity_id: target });
      } catch (fallbackErr) {
        console.warn("[GlassDash] media_play_pause failed:", fallbackErr);
      }
    }
  }

  // ── Data Loading ─────────────────────────────────────────────────────────────
  async loadForecast() {
    if (this._forecastLoading) return;
    if (this._forecast?.length && Date.now() - this._forecastLoadedAt < 1800000) return;
    if (!this._forecast?.length && this._forecastLoadedAt && Date.now() - this._forecastLoadedAt < 30000) return;
    this._forecastLoading = true;
    // Safety timeout — ensure flag never gets stuck
    const safetyTimer = setTimeout(() => { this._forecastLoading = false; }, 12000);
    try {
      // Attempt 1: WebSocket API
      if (this._hass?.callWS) {
        try {
          const data = await this._hass.callWS({
            type: "weather/get_forecasts",
            entity_id: this.entities.weather,
            forecast_type: "daily",
          });
          this._forecast = data?.[this.entities.weather]?.forecast
            || data?.response?.[this.entities.weather]?.forecast
            || [];
        } catch(wsErr) { console.warn("[GlassDash] Forecast WS failed:", wsErr); }
      }

      // Attempt 2: REST service call (HA 2023.9+)
      if (!this._forecast?.length && this._hass?.fetchWithAuth) {
        try {
          const resp = await this._hass.fetchWithAuth(
            "/api/services/weather/get_forecasts?return_response=true",
            { method:"POST", headers:{"Content-Type":"application/json"},
              body: JSON.stringify({ entity_id: this.entities.weather, type: "daily" }) }
          );
          if (resp.ok) {
            const json = await resp.json();
            this._forecast = json?.service_response?.[this.entities.weather]?.forecast || [];
          }
        } catch(restErr) { console.warn("[GlassDash] Forecast REST failed:", restErr); }
      }

      // Attempt 3: state attribute fallback
      if (!this._forecast?.length) {
        const raw = this.attr(this.entities.weather, "forecast", null);
        if (Array.isArray(raw) && raw.length) this._forecast = raw;
      }

      this._forecastLoadedAt = Date.now();
      if (this._forecast.length) this.render();
      else this.render(); // still re-render to show retry button
    } catch(err) {
      console.warn("[GlassDash] Forecast error:", err);
      this._forecastLoadedAt = Date.now();
    } finally {
      clearTimeout(safetyTimer);
      this._forecastLoading = false;
    }
  }

  async loadHistory() {
    if (this._historyLoading) return;
    if (this._historyLoadedAt && Date.now() - this._historyLoadedAt < 360000) return;
    if (!this._hass) return;
    this._historyLoading = true;
    const sensors = [
      this.entities.livingTemp, this.entities.livingHumidity, this.entities.livingAir,
      this.entities.bedTemp,    this.entities.bedHumidity,    this.entities.bedAir,
      this.entities.p1Power,    this.entities.p1Return,      this.entities.p1EnergyToday,
    ].filter(Boolean);
    try {
      // Primary: REST API — full response (no minimal_response) so stable sensors
      // that barely change still get their history entries recorded properly.
      const start = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
      const url = `/api/history/period/${encodeURIComponent(start)}?filter_entity_id=${sensors.join(",")}&no_attributes=true`;
      const resp = await this._hass.fetchWithAuth(url);
      if (resp.ok) {
        const data = await resp.json(); // array of arrays, in same order as filter_entity_id
        if (Array.isArray(data)) {
          // Map each array back to its entity by position
          data.forEach((entityHistory, idx) => {
            if (Array.isArray(entityHistory) && entityHistory.length > 0) {
              const entityId = entityHistory[0]?.entity_id || sensors[idx];
              if (entityId) this._history[entityId] = entityHistory;
            }
          });
          this._historyLoadedAt = Date.now();
          this.render();
          return;
        }
      }
    } catch(e) { console.warn("[GlassDash] History REST failed:", e); }

    // Fallback: WebSocket API
    try {
      const start = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
      const data = await this._hass.callWS({
        type: "history/history_during_period",
        entity_ids: sensors,
        start_time: start,
        significant_changes_only: false,
        minimal_response: false,
        no_attributes: true,
      });
      if (data && typeof data === "object") {
        // WebSocket returns {entity_id: [...states]}
        Object.assign(this._history, data);
        this._historyLoadedAt = Date.now();
        this.render();
      }
    } catch(e) { console.warn("[GlassDash] History WS failed:", e); }
    finally { this._historyLoading = false; }
  }

  async loadEnergy(requestedPeriod = this._energy.period) {
    if (!this._hass?.callWS) return;
    const period = requestedPeriod || "day";
    if (this._energy.loadingPeriods?.has(period)) return;
    this._energy.loadingPeriods ??= new Set();
    this._energy.loadingPeriods.add(period);
    this._energy.loading = true;
    this.render();
    try {
      // Step 1: Discover which entities HA Energy dashboard is configured to track
      if (!this._energy.prefs) {
        try { this._energy.prefs = await this._hass.callWS({ type: "energy/get_prefs" }); }
        catch(e) { console.warn("[GlassDash] Energy prefs:", e); }
      }
      const prefs = this._energy.prefs;
      let consumptionIds = [], costIds = [];
      if (prefs?.energy_sources) {
        for (const src of prefs.energy_sources) {
          if (src.type === "grid" && src.flow_from) {
            src.flow_from.forEach(f => {
              if (f.stat_energy_from) consumptionIds.push(f.stat_energy_from);
              if (f.stat_cost)        costIds.push(f.stat_cost);
            });
          }
        }
      }
      if (!consumptionIds.length && this.entities.p1EnergyToday) {
        consumptionIds = [this.entities.p1EnergyToday];
      }
      this._energy.consumptionIds = consumptionIds;
      this._energy.costIds        = costIds;
      if (!consumptionIds.length) {
        this.render();
        return; // Energy not configured in HA; live P1 still renders from entity state/history.
      }

      const now      = Date.now();
      const cacheTtl = period === "day" ? 300000 : 900000;
      const dayStale = !this._energy.loadedAt["day"] || now - this._energy.loadedAt["day"] > 300000;
      const periodStale = !this._energy.loadedAt[period] || now - this._energy.loadedAt[period] > cacheTtl;
      if (!dayStale && !periodStale && this._energy.stats[period]) return;

      const end = new Date();

      // Always keep today's hourly data fresh (for live kWh + cost totals)
      if (dayStale || !this._energy.stats["day"]) {
        const todayStart = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        const dayData = await this._hass.callWS({
          type: "recorder/statistics_during_period",
          start_time: todayStart.toISOString(),
          end_time:   end.toISOString(),
          statistic_ids: [...consumptionIds, ...costIds],
          period: "hour",
          units: { energy: "kWh" },
          types: ["change"],
        });
        this._energy.stats["day"]        = { data: dayData, statPeriod: "hour" };
        this._energy.loadedAt["day"]     = now;
      }

      // Fetch the selected period if it differs from day
      if (period !== "day" && periodStale) {
        let start, statPeriod;
        switch (period) {
          case "week":  start = new Date(now - 6*86400000); start.setHours(0,0,0,0); statPeriod = "day";   break;
          case "month": start = new Date(end.getFullYear(), end.getMonth(), 1);       statPeriod = "day";   break;
          default:      start = new Date(end.getFullYear(), 0, 1);                    statPeriod = "month"; break;
        }
        const periodData = await this._hass.callWS({
          type: "recorder/statistics_during_period",
          start_time: start.toISOString(),
          end_time:   end.toISOString(),
          statistic_ids: [...consumptionIds, ...costIds],
          period: statPeriod,
          units: { energy: "kWh" },
          types: ["change"],
        });
        this._energy.stats[period]       = { data: periodData, statPeriod };
        this._energy.loadedAt[period]    = now;
      }
      this.render();
    } catch(e) { console.warn("[GlassDash] Energy stats failed:", e); }
    finally    {
      this._energy.loadingPeriods?.delete(period);
      this._energy.loading = (this._energy.loadingPeriods?.size || 0) > 0;
      this.render();
    }
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
    if (!raw || raw.length < 1) return `<div class="spark-empty"></div>`;

    // Parse all valid numeric state entries (handles full and minimal_response format)
    let pts = raw.map(s => ({
      v: Number(s.state ?? s.s),
      t: s.last_changed
        ? new Date(s.last_changed).getTime()
        : (s.lu ? s.lu * 1000 : 0),
    })).filter(p => Number.isFinite(p.v) && p.t > 0);

    if (pts.length < 1) return `<div class="spark-empty"></div>`;

    // IQR outlier filter — prevents sensor glitches from blowing the Y axis
    if (pts.length >= 6) {
      const sorted = [...pts].sort((a, b) => a.v - b.v);
      const q1 = sorted[Math.floor(sorted.length * 0.25)].v;
      const q3 = sorted[Math.floor(sorted.length * 0.75)].v;
      const iqr = q3 - q1;
      if (iqr > 0) {
        const lo = q1 - 3 * iqr, hi = q3 + 3 * iqr;
        pts = pts.filter(p => p.v >= lo && p.v <= hi);
      }
    }
    if (pts.length < 1) return `<div class="spark-empty"></div>`;

    const lname = String(entity).toLowerCase();
    if (lname.includes("temperature")) pts = pts.filter(p => p.v > -20 && p.v < 55);
    if (lname.includes("humidity")) pts = pts.filter(p => p.v >= 0 && p.v <= 100);
    if (lname.includes("power")) pts = pts.filter(p => p.v >= 0 && p.v < 20000);
    if (pts.length < 1) return `<div class="spark-empty"></div>`;

    // Time-bucket averaging: divide 6h window into 60 buckets (6-min each).
    // Average all values within each bucket → eliminates noise, fills gaps.
    const minT = pts[0].t, maxT = pts[pts.length - 1].t;
    const tRng = maxT - minT || 1;
    const BUCKETS = 42;
    const bucketMs = tRng / BUCKETS;
    const dp = [];
    for (let i = 0; i < BUCKETS; i++) {
      const t0 = minT + i * bucketMs;
      const t1 = t0 + bucketMs;
      const inB = pts.filter(p => p.t >= t0 && p.t < t1);
      if (inB.length > 0) {
        const avg = inB.reduce((s, p) => s + p.v, 0) / inB.length;
        dp.push({ v: avg, t: t0 + bucketMs / 2 });
      }
    }
    // If stable sensor with 0–1 changes: make a flat line across the window
    if (dp.length < 2) {
      const v = pts[Math.floor(pts.length / 2)].v;
      dp.push({ v, t: minT }, { v, t: maxT });
    }

    const smoothed = dp.map((p, i) => {
      const local = dp.slice(Math.max(0, i - 2), Math.min(dp.length, i + 3)).map(x => x.v).sort((a,b) => a-b);
      const median = local[Math.floor(local.length / 2)];
      return { ...p, v: (p.v * 0.35) + (median * 0.65) };
    });

    const W = 200, H = 32;
    const minV = Math.min(...smoothed.map(p => p.v));
    const maxV = Math.max(...smoothed.map(p => p.v));
    const pad = Math.max((maxV - minV) * 0.2, 0.3);
    const lo = minV - pad, hi = maxV + pad, rng = hi - lo;
    const dMinT = smoothed[0].t, dMaxT = smoothed[smoothed.length - 1].t, dTRng = dMaxT - dMinT || 1;

    const coords = smoothed.map(p => [
      (p.t - dMinT) / dTRng * W,
      H - 2 - (p.v - lo) / rng * (H - 6),
    ]);

    const linePath = coords.map((p, i) =>
      `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`
    ).join(" ");
    const areaPath = `${linePath} L${W},${H} L0,${H} Z`;
    const gid = `sg${entity.replace(/[^a-z0-9]/gi, "")}`;
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient></defs>
      <path d="${areaPath}" fill="url(#${gid})"/>
      <path d="${linePath}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${coords[coords.length-1][0].toFixed(1)}" cy="${coords[coords.length-1][1].toFixed(1)}" r="2.2" fill="${color}"/>
    </svg>`;
  }

  playClick() {
    try {
      const now = performance.now();
      if (now - this._lastClickSound < 45) return;
      this._lastClickSound = now;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = this._audioCtx || new AudioCtx();
      this._audioCtx = ctx;
      if (ctx.state === "suspended") ctx.resume?.();
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
    } catch {}
  }

  updateClock() {
    const ti = this.shadowRoot.getElementById("clk-t");
    const da = this.shadowRoot.getElementById("clk-d");
    const gr = this.shadowRoot.getElementById("greeting");
    if (!ti||!da) return;
    const now = new Date();
    ti.textContent = now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Amsterdam"});
    da.textContent = now.toLocaleDateString([],{weekday:"short",day:"numeric",month:"long",timeZone:"Europe/Amsterdam"});
    if (gr) gr.textContent = this.greeting();
  }
  greeting() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: "Europe/Amsterdam",
    }).formatToParts(new Date());
    const h = Number(parts.find(part => part.type === "hour")?.value ?? new Date().getHours());
    return h >= 5 && h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  }
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)
        ?.call(document.documentElement)?.catch(() => {});
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document)?.catch(() => {});
    }
    // Re-render after a tick so the icon updates
    setTimeout(() => this.render(), 120);
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

    const mediaEntity   = this.mediaInfoEntity();
    const spotifyTitle  = this.attr(mediaEntity,"media_title","")
      || this.attr(mediaEntity,"source","")
      || (mediaEntity === e.tv ? "TV" : "Spotify");
    const spotifyArtist = this.attr(mediaEntity,"media_artist","")
      || (mediaEntity === e.tv ? "LG webOS TV" : mediaEntity === e.spotifySpeaker ? "Dining Room" : "Ready");
    const spotifyAlbum  = this.attr(mediaEntity,"media_album_name","");
    const spotifyPic    = this.attr(mediaEntity,"entity_picture","") || this.attr(e.spotifySpeaker,"entity_picture","") || this.attr(e.tv,"entity_picture","");
    const spotifyState  = this.mediaState(e.spotify,"idle");
    const spkState      = this.mediaState(e.spotifySpeaker,"idle");
    const mediaState    = this.mediaState(mediaEntity,"idle");
    const spotifyPlaying= mediaState==="playing";
    const spotifyActive = ["playing","paused"].includes(mediaState) || ["playing","paused"].includes(spotifyState)||["playing","paused"].includes(spkState);
    const durSec  = Number(this.attr(mediaEntity,"media_duration",0))||0;
    const posSec  = Number(this.attr(mediaEntity,"media_position",0))||0;
    const posUpAt = this.attr(mediaEntity,"media_position_updated_at",null);
    const elapsed = posUpAt && spotifyPlaying ? (Date.now()-new Date(posUpAt).getTime())/1000 : 0;
    const curPos  = Math.min(posSec+elapsed, durSec||1);
    const spProg  = durSec>0 ? Math.min((curPos/durSec)*100,100) : 0;
    const volPct  = Math.round(Number(this.attr(mediaEntity,"volume_level",0)||0)*100);

    const camSrc = this._lastCamUrl || (this._hass?.states?.[e.petFeederCamera]?.attributes?.entity_picture || "");

    this.shadowRoot.innerHTML = `<style>${this.css()}</style><ha-card><div class="dash">
  <div class="bg"></div>

  <div class="topbar z1">
    <div>
      <div class="home-lbl" id="greeting">${this.greeting()}</div>
      <div class="home-sub">Home overview</div>
    </div>
    <div class="topbar-right">
      <button class="fs-btn" data-action="fullscreen" title="Toggle fullscreen">
        <ha-icon icon="mdi:${document.fullscreenElement ? 'fullscreen-exit' : 'fullscreen'}"></ha-icon>
      </button>
      <div class="clock-wrap">
        <div class="clk-time" id="clk-t">00:00</div>
        <div class="clk-date" id="clk-d">Thu, 14 May</div>
      </div>
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

      <!-- LEFT: lights + climate + P1 meter + media -->
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
        ${this.energySection()}
      </div>

      <!-- RIGHT: Tesla + Spotify -->
      <div class="col">
        ${this.teslaCard(batteryRaw,range,teslaPlace,climOn,targetTemp)}
        ${this.spotifySection(spotifyPic,spotifyTitle,spotifyArtist,spotifyAlbum,spotifyActive,spotifyPlaying,curPos,durSec,spProg,volPct)}
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
    this.shadowRoot.querySelector("[data-tesla='sentry']")   ?.addEventListener("click", () => this.toggleEntity(this.entities.teslaSentry));
    this.shadowRoot.querySelector("[data-tesla='temp-up']")  ?.addEventListener("click", () => this.setClimateTemp(0.5));
    this.shadowRoot.querySelector("[data-tesla='temp-down']")?.addEventListener("click", () => this.setClimateTemp(-0.5));
    this.shadowRoot.querySelector("[data-notice-url]")       ?.addEventListener("click", e => window.open(e.currentTarget.dataset.noticeUrl, "_blank", "noopener,noreferrer"));

    // Spotify
    const tgt = () => this.mediaControlTarget();
    this.shadowRoot.querySelector("[data-sp='play-pause']")?.addEventListener("click", () => this.mediaPlayPause());
    this.shadowRoot.querySelector("[data-sp='prev']")      ?.addEventListener("click", () => this.service("media_player","media_previous_track",{ entity_id:tgt() }));
    this.shadowRoot.querySelector("[data-sp='next']")      ?.addEventListener("click", () => this.service("media_player","media_next_track",{ entity_id:tgt() }));
    this.shadowRoot.querySelector("[data-sp='vol-up']")    ?.addEventListener("click", () => {
      const target = tgt();
      const cur = Number(this.attr(target,"volume_level",0))||0;
      this.service("media_player","volume_set",{ entity_id:target, volume_level:Math.min(1,cur+0.05) });
    });
    this.shadowRoot.querySelector("[data-sp='vol-down']")  ?.addEventListener("click", () => {
      const target = tgt();
      const cur = Number(this.attr(target,"volume_level",0))||0;
      this.service("media_player","volume_set",{ entity_id:target, volume_level:Math.max(0,cur-0.05) });
    });

    this.shadowRoot.querySelector("[data-action='cam-refresh']")?.addEventListener("click", () => this.updateCamera());

    this.shadowRoot.querySelector("[data-action='fullscreen']")?.addEventListener("click", () => this.toggleFullscreen());

    this.shadowRoot.querySelector("[data-action='forecast-retry']")?.addEventListener("click", () => {
      this._forecastLoadedAt = 0;
      this._forecast = [];
      this.loadForecast();
      this.render();
    });

    // Energy period tabs
    this.shadowRoot.querySelectorAll("[data-energy-period]").forEach(btn =>
      btn.addEventListener("click", () => {
        const p = btn.dataset.energyPeriod;
        if (p === this._energy.period) return;
        this._energy.period = p;
        this.render();            // show new tab selection immediately
        this.loadEnergy(p);       // fetch data for new period (may be cached)
      })
    );
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

  energySection() {
    const e = this.entities;
    // Live W from real-time P1 sensor
    const rawPower  = this.st(e.p1Power, "--");
    const rawReturn = this.st(e.p1Return, "0");
    const powerW    = Number(rawPower);
    const returnW   = Number(rawReturn);
    const isLive    = Number.isFinite(powerW);
    const returning = Number.isFinite(returnW) && returnW > 0;
    const powerColor = returning      ? "#34d399"
      : isLive && powerW < 500  ? "#34d399"
      : isLive && powerW < 2000 ? "#fbbf24"
      : "#f87171";
    const liveLabel = returning ? "Solar return" : "Live grid";
    const liveVal   = isLive
      ? (powerW >= 1000 ? (powerW/1000).toFixed(2)+" kW" : Math.round(powerW)+" W")
      : "--";
    const priceNowRaw = Number(this.st(e.vattenfallElectricityPrice, NaN));
    const priceNow    = Number.isFinite(priceNowRaw) && priceNowRaw > 0 ? priceNowRaw : this._energyRate;
    const liveCost    = isLive ? Math.max(0, (powerW / 1000) * priceNow) : NaN;
    const liveCostTxt = Number.isFinite(liveCost) ? `€${liveCost.toFixed(2)}/h` : "€--/h";
    const priceTxt    = Number.isFinite(priceNow) ? `€${priceNow.toFixed(2)}/kWh` : "€--/kWh";

    // Today kWh + cost from HA Energy stats
    const consumptionIds = this._energy.consumptionIds || [];
    const costIds        = this._energy.costIds        || [];
    const dayStats       = this._energy.stats["day"];
    let todayKwh = 0, todayCostStat = 0, hasCostStat = false;
    if (dayStats?.data) {
      for (const id of consumptionIds) {
        (dayStats.data[id] || []).forEach(b => { todayKwh += (b.change ?? 0); });
      }
      for (const id of costIds) {
        const arr = dayStats.data[id] || [];
        arr.forEach(b => { todayCostStat += (b.change ?? 0); });
        if (arr.length) hasCostStat = true;
      }
    }
    const todayCost = hasCostStat
      ? todayCostStat.toFixed(2)
      : (todayKwh * priceNow).toFixed(2);

    // Chart buckets for selected period
    const period      = this._energy.period;
    const periodStats = this._energy.stats[period];
    const buckets     = this._buildEnergyBuckets(periodStats, consumptionIds);
    const periodLoading = this._energy.loadingPeriods?.has(period);

    const hasEnergyConfig = consumptionIds.length > 0;
    const tabs = ["day","week","month","year"].map(p =>
      `<button class="en-tab ${p===period?"active":""} ${this._energy.loadingPeriods?.has(p) ? "loading" : ""}" data-energy-period="${p}">${p.charAt(0).toUpperCase()+p.slice(1)}</button>`
    ).join("");

    return `<section class="gl block en-section">
      <div class="slbl">Energy</div>
      <div class="en-live-row">
        <div class="en-live-block">
          <div class="en-live-val" style="color:${powerColor}">${liveVal}</div>
          <div class="en-live-lbl">${liveLabel}</div>
          <div class="en-cost-now">${liveCostTxt} · ${priceTxt}</div>
          <div class="spark-wrap" style="margin-top:4px">${this.sparkline(e.p1Power, powerColor)}</div>
        </div>
        <div class="en-divider"></div>
        <div class="en-today-block">
          <div class="en-today-val">${todayKwh > 0 ? todayKwh.toFixed(2) : "--"}<span class="en-unit"> kWh</span></div>
          <div class="en-today-cost">${todayKwh > 0 ? "€"+todayCost+" today" : this._energy.loadingPeriods?.has("day") ? "Loading…" : "Waiting for data"}</div>
        </div>
      </div>
      ${hasEnergyConfig ? `<div class="en-tabs">${tabs}</div>
      <div class="en-chart">${buckets.length ? this._energyBars(buckets) : `<div class="en-loading">${periodLoading ? "Loading…" : "No usage data yet"}</div>`}</div>` : ""}
    </section>`;
  }

  _buildEnergyBuckets(periodStats, consumptionIds) {
    if (!periodStats?.data || !consumptionIds?.length) return [];
    const map = {};
    for (const id of consumptionIds) {
      (periodStats.data[id] || []).forEach(entry => {
        const key = entry.start;
        if (!map[key]) map[key] = { start: entry.start, kwh: 0 };
        map[key].kwh += (entry.change ?? 0);
      });
    }
    return Object.values(map).sort((a,b) => this._bucketTime(a.start) - this._bucketTime(b.start));
  }

  _bucketTime(value) {
    if (typeof value === "number") return value;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  _bucketHourKey(value) {
    const t = this._bucketTime(value);
    return t ? new Date(t).toISOString().slice(0, 13) : "";
  }

  _bucketLabel(dt, period) {
    const d = new Date(dt);
    const h = d.getHours();
    if (period === "day")   return h % 4 === 0 ? d.toLocaleTimeString([], { hour: "numeric", hour12: false }) : "";
    if (period === "week")  return d.toLocaleDateString([], { weekday: "short" });
    if (period === "month") { const day = d.getDate(); return (day === 1 || day % 5 === 0) ? String(day) : ""; }
    return d.toLocaleDateString([], { month: "short" });
  }

  _energyBars(buckets) {
    if (!buckets.length) return "";
    const maxV = Math.max(...buckets.map(b => b.kwh), 0.001);
    const W = 280, H = 60, labelH = 10, chartH = H - labelH;
    const n = buckets.length;
    const step = W / n;
    const barW = Math.max(1.5, step * 0.72);
    const nowIso = new Date().toISOString().slice(0, 13);
    const bars = buckets.map((b, i) => {
      const bh  = Math.max(1.5, (b.kwh / maxV) * chartH);
      const x   = i * step + (step - barW) / 2;
      const y   = chartH - bh;
      const cur = this._bucketHourKey(b.start) === nowIso || i === buckets.length - 1;
      const fill = cur ? "rgba(251,191,36,.95)" : "rgba(167,139,250,.52)";
      const lbl  = this._bucketLabel(b.start, this._energy.period);
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="2" fill="${fill}"/>` +
        (lbl ? `<text x="${(x+barW/2).toFixed(1)}" y="${H-1}" font-size="6" fill="rgba(255,255,255,.3)" text-anchor="middle" font-family="system-ui,sans-serif">${lbl}</text>` : "");
    }).join("");
    return `<svg class="en-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${bars}</svg>`;
  }

  teslaClimateState(climOn, targetTemp) {
    if (!climOn) {
      return {
        mode: "off",
        label: "AC",
        icon: "mdi:fan",
        detail: `Off · ${targetTemp}°C`,
        rowLabel: "Climate",
        active: false,
      };
    }
    const cabin = Number(this.st(this.entities.teslaInsideTemp, NaN));
    const target = Number(targetTemp);
    if (Number.isFinite(cabin) && Number.isFinite(target)) {
      if (target > cabin + 0.4) {
        return {
          mode: "heating",
          label: "Heat",
          icon: "mdi:fire",
          detail: `Heating · ${cabin.toFixed(1)}° → ${target}°C`,
          rowLabel: "Cabin heating",
          active: true,
        };
      }
      if (target < cabin - 0.4) {
        return {
          mode: "cooling",
          label: "Cool",
          icon: "mdi:snowflake",
          detail: `Cooling · ${cabin.toFixed(1)}° → ${target}°C`,
          rowLabel: "Cabin cooling",
          active: true,
        };
      }
    }
    return {
      mode: "climate",
      label: "Climate",
      icon: "mdi:fan",
      detail: `On · ${targetTemp}°C`,
      rowLabel: "Climate active",
      active: true,
    };
  }

  teslaCard(pct, range, place, climOn, targetTemp) {
    const battColor = pct > 50 ? "#34d399" : pct > 20 ? "#fbbf24" : "#f87171";
    const clim = this.teslaClimateState(climOn, targetTemp);
    const sentryOn = this.isOn(this.entities.teslaSentry);
    return `<section class="gl tc">
      <div class="tc-hero">
        <div class="tc-top">
          <div>
            <div class="tc-name">Model 3</div>
            <div class="tc-sub">Tesla</div>
          </div>
          <div class="tag">${place}</div>
        </div>
        <div class="tc-img-wrap">
          <div class="tc-glow"></div>
          <img class="tc-car" src="https://teslakortingscode.com/ha/tesla-model-3-with-toon.png" alt="Model 3 with Toon" draggable="false">
        </div>
      </div>
      <div class="tc-stats">
        <div class="tc-batt-row">
          <div class="tc-pct" style="color:${battColor}">${Math.round(pct)}<span>%</span></div>
          <div class="tc-range">${range}</div>
        </div>
        <div class="tc-bar"><div class="tc-fill" style="width:${pct}%;background:${battColor}"></div></div>
        <div class="tc-clim-row">
          <div class="tc-clim-left">
            <ha-icon class="tc-clim-icon ${clim.mode}" icon="${clim.icon}"></ha-icon>
            <div>
              <div class="tc-clim-lbl">${clim.rowLabel}</div>
              <div class="tc-clim-val ${clim.active ? "climon" : ""} ${clim.mode}">${clim.detail}</div>
            </div>
          </div>
          <div class="tc-temp-ctrl">
            <button class="tc-tbtn" data-tesla="temp-down">−</button>
            <span class="tc-tval">${targetTemp}°</span>
            <button class="tc-tbtn" data-tesla="temp-up">+</button>
          </div>
        </div>
      </div>
      ${this._notice ? `<div class="tc-notice">
        <div>
          <b>${this._notice.title}</b>
          <span>${this._notice.body}</span>
        </div>
        ${this._notice.action ? `<button class="tc-notice-action" data-notice-url="${this._notice.action.url}">${this._notice.action.label}</button>` : ""}
      </div>` : ""}
      <div class="tc-btns">
        ${this.teslaButton("climate", clim.icon,                  clim.label, clim.active, clim.mode)}
        ${this.teslaButton("sentry", "mdi:shield-check-outline",  "Sentry",  sentryOn, "sentry")}
      </div>
    </section>`;
  }

  teslaButton(action, icon, label, on, mode = "") {
    return `<button class="tb ${on?"on":""} ${mode ? `tb-${mode}` : ""}" data-tesla="${action}">
      <ha-icon icon="${icon}"></ha-icon><span>${label}</span>
    </button>`;
  }

  spotifySection(pic, title, artist, album, active, playing, curPos, durSec, progress, vol) {
    const e      = this.entities;
    const tvSt   = this.st(e.tv, "off");
    const tvOn   = ["on","playing"].includes(tvSt);
    const tvLbl  = this.niceState(e.tv, "Off");
    const spkSt  = this.st(e.spotifySpeaker, "idle");
    const spkOn  = ["playing","paused","on"].includes(spkSt);
    const spkLbl = this.niceState(e.spotifySpeaker, "Idle");
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
        <div class="sp-devices">
          <div class="sp-device ${tvOn?"on":""}">
            <div class="sp-dev-dot"></div>
            <ha-icon icon="mdi:television" style="--mdc-icon-size:11px"></ha-icon>
            <span>TV · ${tvLbl}</span>
          </div>
          <div class="sp-device ${spkOn?"on":""}">
            <div class="sp-dev-dot"></div>
            <ha-icon icon="mdi:speaker" style="--mdc-icon-size:11px"></ha-icon>
            <span>Dining · ${spkLbl}</span>
          </div>
        </div>
      </div>
    </section>`;
  }

  weatherSection(state, temp, humidity, wind, feels, uv, vis) {
    // Per-condition accent colours for icon and glass tint
    const condAccent = {
      sunny:         { bg:"rgba(251,191,36,.16)",  border:"rgba(251,191,36,.26)",  ico:"#fbbf24" },
      "clear-night": { bg:"rgba(99,102,241,.16)",  border:"rgba(99,102,241,.26)",  ico:"#818cf8" },
      clear:         { bg:"rgba(99,102,241,.14)",  border:"rgba(99,102,241,.22)",  ico:"#818cf8" },
      partlycloudy:  { bg:"rgba(148,163,184,.11)", border:"rgba(148,163,184,.18)", ico:"rgba(255,255,255,.62)" },
      cloudy:        { bg:"rgba(100,116,139,.14)", border:"rgba(100,116,139,.2)",  ico:"rgba(255,255,255,.5)" },
      rainy:         { bg:"rgba(59,130,246,.16)",  border:"rgba(59,130,246,.26)",  ico:"#60a5fa" },
      pouring:       { bg:"rgba(37,99,235,.2)",    border:"rgba(37,99,235,.32)",   ico:"#3b82f6" },
      snowy:         { bg:"rgba(186,230,253,.14)", border:"rgba(186,230,253,.22)", ico:"#bae6fd" },
      fog:           { bg:"rgba(148,163,184,.12)", border:"rgba(148,163,184,.18)", ico:"rgba(255,255,255,.45)" },
      windy:         { bg:"rgba(167,139,250,.14)", border:"rgba(167,139,250,.24)", ico:"#a78bfa" },
      hail:          { bg:"rgba(100,116,139,.14)", border:"rgba(100,116,139,.2)",  ico:"rgba(255,255,255,.55)" },
    };
    const acc = condAccent[state] || condAccent.partlycloudy;

    const days = (this._forecast||[]).slice(0,5);
    const forecastHTML = days.length
      ? days.map(d => {
          const dt     = new Date(d.datetime);
          const lbl    = dt.toLocaleDateString([],{weekday:"short"});
          const hi     = Math.round(d.temperature);
          const lo     = d.templow!=null ? Math.round(d.templow) : Math.round(d.temperature-4);
          const cond   = d.condition || state;
          const precip = d.precipitation_probability != null ? Math.round(d.precipitation_probability) : null;
          const ca     = condAccent[cond] || condAccent.partlycloudy;
          return `<div class="glsm wx-day">
            <div class="wxdn">${lbl}</div>
            <ha-icon class="wxdi" icon="${this.weatherIcon(cond)}" style="color:${ca.ico}"></ha-icon>
            <div class="wxdh">${hi}°</div>
            <div class="wxdl">${lo}°</div>
            ${precip!=null ? `<div class="wx-precip">${precip}%</div>` : ""}
          </div>`;
        }).join("")
      : `<div class="wx-nof"><span>${this._forecastLoading ? "Loading forecast…" : "Forecast unavailable"}</span>${!this._forecastLoading ? `<button class="wx-retry" data-action="forecast-retry"><ha-icon icon="mdi:refresh"></ha-icon> Retry</button>` : ""}</div>`;

    const extras = [
      feels!=null ? {icon:"mdi:thermometer-lines",  val:`${Math.round(feels)}°`, lbl:"Feels like"} : null,
      uv!=null    ? {icon:"mdi:white-balance-sunny", val:String(uv),              lbl:"UV index"}   : null,
      vis!=null   ? {icon:"mdi:eye-outline",         val:`${Math.round(vis)} km`, lbl:"Visibility"} : null,
    ].filter(Boolean);

    return `<section class="gl wx-big" style="background:${acc.bg};border-color:${acc.border}">
      <div class="slbl" style="color:rgba(255,255,255,.42)">Weather · Outside</div>
      <div class="wx-hero">
        <div class="wx-hero-left">
          <ha-icon class="wx-ico-big" icon="${this.weatherIcon(state)}" style="color:${acc.ico}"></ha-icon>
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
    const bPct = braw !== null ? Math.max(1, Math.round(braw / 255 * 100)) : (on ? 100 : null);
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
.dash{width:100%;height:100dvh;min-height:100vh;max-width:none;border-radius:0;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",system-ui,sans-serif;position:relative;background:#060818;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 15% 85%,rgba(0,180,255,.42),transparent 55%),radial-gradient(ellipse 60% 50% at 80% 10%,rgba(130,60,255,.38),transparent 55%),radial-gradient(ellipse 50% 40% at 50% 50%,rgba(30,10,80,.8),transparent 70%),linear-gradient(160deg,#06091c 0%,#0b0630 40%,#050c1e 100%);pointer-events:none}
.bg::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 30% 20% at 10% 70%,rgba(0,220,255,.22),transparent 50%)}
.z1{position:relative;z-index:1}

/* Glass */
.gl{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:14px}
.glsm{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-radius:10px}
.slbl{font-size:11px;font-weight:800;color:rgba(255,255,255,.44);letter-spacing:1.1px;text-transform:uppercase;margin-bottom:6px}
.block{padding:9px}

/* Topbar */
.topbar{display:flex;align-items:center;justify-content:space-between;padding:8px 14px 4px;z-index:30;isolation:isolate}
.home-lbl{font-size:15px;font-weight:800;color:rgba(255,255,255,.64);letter-spacing:1.2px;text-transform:uppercase}
.home-sub{font-size:11px;color:rgba(255,255,255,.38);margin-top:0}
.topbar-right{display:flex;align-items:center;gap:9px}
.clock-wrap{text-align:right}
.clk-time{font-size:25px;font-weight:200;color:rgba(255,255,255,.94);letter-spacing:-1px;line-height:1}
.clk-date{font-size:12px;color:rgba(255,255,255,.56);margin-top:0}
.fs-btn{display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12)!important;transition:all .15s,transform .08s;flex-shrink:0}
.fs-btn:hover{background:rgba(255,255,255,.13)}
.fs-btn ha-icon{--mdc-icon-size:16px;color:rgba(255,255,255,.6)}

/* Tabs */
.tabs{display:flex;gap:4px;padding:0 10px 5px;overflow-x:auto;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{flex-shrink:0;display:flex;align-items:center;gap:6px;padding:5px 11px;border-radius:18px;font-size:12px;font-weight:800;color:rgba(255,255,255,.52);border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.05);transition:all .18s,transform .08s;white-space:nowrap}
.tab ha-icon{--mdc-icon-size:15px;opacity:.7}
.tab:hover{color:rgba(255,255,255,.70);background:rgba(255,255,255,.09)}
.tab.active{background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.28);color:rgba(255,255,255,.96)}
.tab.active ha-icon{opacity:1}
.divider{height:1px;background:rgba(255,255,255,.07);margin:0 10px}

/* Page layout */
.page{display:none;flex:1;min-height:0;padding:5px 8px max(18px, env(safe-area-inset-bottom));flex-direction:column;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;-webkit-overflow-scrolling:touch;scroll-padding-bottom:18px}
.page::-webkit-scrollbar{display:none}
.page.active{display:flex}
.page-ov{gap:5px}
.ov-main{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:6px;width:100%}
.col{display:flex;flex-direction:column;gap:6px;min-width:0}

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
.rooms5{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}
.room{padding:7px 4px 6px;transition:all .18s,transform .08s;position:relative;border-radius:11px;text-align:center;min-height:61px}
.room:hover{background:rgba(255,255,255,.09)}
.room.on{background:rgba(255,255,255,.11);border-color:rgba(200,180,255,.22)}
.ri{--mdc-icon-size:19px;color:rgba(255,255,255,.46);margin:0 auto 3px;display:block;transition:color .18s}
.room.on .ri{color:rgba(225,215,255,.98)}
.rn{font-size:11px;font-weight:800;color:rgba(255,255,255,.58);line-height:1.15}
.room.on .rn{color:rgba(255,255,255,.94)}
.rdot{position:absolute;top:5px;right:5px;width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.1)}
.room.on .rdot{background:#a78bfa}
.alloff .rdot{background:rgba(248,113,113,.35)}
.alloff .ri{color:rgba(248,113,113,.55)}
.tag{font-size:11px;color:rgba(220,212,255,.86);background:rgba(167,139,250,.12);padding:3px 9px;border-radius:9px;border:1px solid rgba(167,139,250,.25);text-transform:capitalize}

/* Climate summary — 3-col with sparklines */
.clim-row{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:start;gap:0}
.clim-sep{width:1px;height:100%;min-height:56px;background:rgba(255,255,255,.09);margin:0 4px;align-self:stretch}
.clim-col{padding:2px 6px;text-align:center;display:flex;flex-direction:column;align-items:center}
.aq-col{justify-content:center;padding-top:4px}
.cv{font-size:25px;font-weight:300;color:rgba(255,255,255,.98);letter-spacing:-0.8px;line-height:1}
.cu{font-size:12px;color:rgba(255,255,255,.55)}
.cl{font-size:10px;color:rgba(255,255,255,.46);text-transform:uppercase;letter-spacing:.5px;margin-top:2px;white-space:nowrap}
.spark-wrap{width:100%;height:25px;margin-top:4px;overflow:hidden}
.spark{width:100%;height:25px;display:block}
.spark-empty{width:100%;height:25px;border-bottom:1px solid rgba(255,255,255,.06)}
.aq-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;animation:aq-breathe 2.5s ease-in-out infinite;margin-bottom:4px}
.aq-text{font-size:20px!important;font-weight:800!important;text-transform:capitalize}
@keyframes aq-breathe{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.82)}}

/* Tesla card — Tesla-app style */
.tc{overflow:hidden;padding:0}
/* Single wrapper gives header + car image one unified dark background */
.tc-hero{background:linear-gradient(180deg,rgba(16,10,38,.98) 0%,rgba(5,5,18,.99) 100%)}
.tc-top{display:flex;justify-content:space-between;align-items:center;padding:9px 12px 2px;background:transparent}
.tc-brand{display:flex;align-items:center;gap:8px}
.tc-name{font-size:21px;font-weight:800;color:rgba(255,255,255,.94);letter-spacing:-.4px}
.tc-sub{font-size:11px;color:rgba(255,255,255,.44);letter-spacing:.8px;text-transform:uppercase;margin-top:0}
.tc-img-wrap{width:100%;height:120px;position:relative;background:transparent;display:flex;align-items:center;justify-content:center;overflow:hidden}
.tc-glow{position:absolute;bottom:0;left:0;right:0;height:50px;background:radial-gradient(ellipse 90% 100% at 50% 100%,rgba(60,90,220,.2),transparent 70%);pointer-events:none}
.tc-car{width:98%;height:100%;object-fit:contain;object-position:center center;filter:drop-shadow(0 13px 19px rgba(0,0,0,.64));pointer-events:none;user-select:none;position:relative;z-index:1;transform:translateY(9px)}
.tc-stats{padding:7px 11px 5px}
.tc-batt-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px}
.tc-pct{font-size:40px;font-weight:800;letter-spacing:-2px;line-height:1}
.tc-pct span{font-size:18px;font-weight:400;color:rgba(255,255,255,.5);margin-left:2px}
.tc-range{font-size:18px;font-weight:700;color:rgba(255,255,255,.65)}
.tc-bar{height:3px;background:rgba(255,255,255,.12);border-radius:2px;margin-bottom:7px;overflow:hidden}
.tc-fill{height:100%;border-radius:2px;transition:width .4s}
.tc-clim-row{display:flex;justify-content:space-between;align-items:center}
.tc-clim-left{display:flex;align-items:center;gap:9px}
.tc-clim-icon{--mdc-icon-size:21px;color:rgba(255,255,255,.58)}
.tc-clim-icon.heating{color:#fb923c;filter:drop-shadow(0 0 8px rgba(251,146,60,.55))}
.tc-clim-icon.cooling{color:#60a5fa;filter:drop-shadow(0 0 8px rgba(96,165,250,.55))}
.tc-clim-icon.climate{color:#34d399;filter:drop-shadow(0 0 8px rgba(52,211,153,.45))}
.tc-clim-lbl{font-size:11px;color:rgba(255,255,255,.48);text-transform:uppercase;letter-spacing:.5px}
.tc-clim-val{font-size:15px;font-weight:700;color:rgba(255,255,255,.74);margin-top:0}
.tc-clim-val.climon{color:#34d399}
.tc-clim-val.heating{color:#fdba74}
.tc-clim-val.cooling{color:#93c5fd}
.tc-notice{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 10px 8px;padding:8px 9px;border-radius:10px;background:rgba(248,113,113,.12);border:1px solid rgba(248,113,113,.26);color:rgba(255,255,255,.86)}
.tc-notice b{display:block;font-size:10px;color:#fecaca;letter-spacing:.2px}
.tc-notice span{display:block;font-size:9px;color:rgba(255,255,255,.62);line-height:1.35;margin-top:1px}
.tc-notice-action{flex-shrink:0;padding:5px 8px;border-radius:8px;background:rgba(52,211,153,.16);border:1px solid rgba(52,211,153,.32)!important;color:rgba(167,243,208,.95);font-size:9px;font-weight:800}
.tc-temp-ctrl{display:flex;align-items:center;gap:9px}
.tc-tbtn{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18)!important;display:flex;align-items:center;justify-content:center;font-size:21px;line-height:1;color:rgba(255,255,255,.86);transition:all .15s;flex-shrink:0}
.tc-tbtn:hover{background:rgba(255,255,255,.17)}
.tc-tval{font-size:18px;font-weight:700;color:rgba(255,255,255,.86);min-width:39px;text-align:center}
.tc-btns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;padding:6px 10px 8px;border-top:1px solid rgba(255,255,255,.07)}
.tb{position:relative;display:flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:6px 9px;text-align:center;transition:all .18s,transform .08s;border-radius:11px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06)}
.tb:hover{background:rgba(255,255,255,.1)}
.tb.on{background:rgba(167,139,250,.16);border-color:rgba(167,139,250,.42);box-shadow:0 0 9px rgba(167,139,250,.22)}
.tb-heating.on{background:rgba(251,146,60,.17);border-color:rgba(251,146,60,.42);box-shadow:0 0 12px rgba(251,146,60,.25)}
.tb-cooling.on{background:rgba(96,165,250,.17);border-color:rgba(96,165,250,.44);box-shadow:0 0 12px rgba(96,165,250,.24)}
.tb-climate.on{background:rgba(52,211,153,.15);border-color:rgba(52,211,153,.38);box-shadow:0 0 12px rgba(52,211,153,.22)}
.tb-sentry{position:relative}
.tb-sentry.on{background:rgba(248,113,113,.14);border-color:rgba(248,113,113,.45);box-shadow:0 0 12px rgba(248,113,113,.25)}
.tb-sentry.on::after{content:"";position:absolute;top:8px;right:9px;width:8px;height:8px;border-radius:50%;background:#ef4444;box-shadow:0 0 10px rgba(239,68,68,.95);animation:sentry-pulse 1.35s ease-in-out infinite}
.tb ha-icon{display:block;--mdc-icon-size:20px;color:rgba(255,255,255,.55);margin:0}
.tb.on ha-icon{color:#c4b5fd}
.tb-heating.on ha-icon{color:#fdba74}
.tb-cooling.on ha-icon{color:#93c5fd}
.tb-climate.on ha-icon{color:#6ee7b7}
.tb-sentry.on ha-icon{color:#fca5a5}
.tb span{font-size:11px;color:rgba(255,255,255,.56);text-transform:uppercase;letter-spacing:.42px;font-weight:800}
.tb.on span{color:rgba(200,185,255,.82)}
.tb-heating.on span{color:#fed7aa}
.tb-cooling.on span{color:#bfdbfe}
.tb-climate.on span{color:#a7f3d0}
.tb-sentry.on span{color:#fecaca}
@keyframes sentry-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.72)}}

/* Weather */
.wx-big{padding:9px 12px;transition:background .4s,border-color .4s}
.wx-hero{display:flex;align-items:center;gap:14px;margin-bottom:7px}
.wx-hero-left{display:flex;align-items:center;gap:11px;flex-shrink:0}
.wx-ico-big{--mdc-icon-size:54px;transition:color .4s}
.wx-tmp-big{font-size:46px;font-weight:100;color:rgba(255,255,255,.96);letter-spacing:-2.5px;line-height:1}
.wx-tmp-big span{font-size:18px;color:rgba(255,255,255,.45);font-weight:300}
.wx-cond-big{font-size:12px;color:rgba(255,255,255,.55);margin-top:2px;text-transform:capitalize;letter-spacing:.4px}
.wx-details{display:flex;gap:6px;flex-wrap:wrap;flex:1}
.wx-det{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:55px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:6px 9px;flex:1}
.wx-det ha-icon{--mdc-icon-size:17px;color:rgba(255,255,255,.55)}
.wx-det-val{font-size:16px;font-weight:700;color:rgba(255,255,255,.9)}
.wx-det-lbl{font-size:10px;color:rgba(255,255,255,.43);text-transform:uppercase;letter-spacing:.4px;text-align:center}
.wx-sep{height:1px;background:rgba(255,255,255,.1);margin:7px 0}
.wx-forecast{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.wx-nof{display:flex;align-items:center;justify-content:center;gap:10px;color:rgba(255,255,255,.28);font-size:10px;padding:10px;text-align:center}
.wx-retry{display:flex;align-items:center;gap:4px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14)!important;border-radius:8px;padding:4px 9px;font-size:9px;font-weight:700;color:rgba(255,255,255,.55);cursor:pointer;transition:all .15s}
.wx-retry:hover{background:rgba(255,255,255,.13)}
.wx-retry ha-icon{--mdc-icon-size:11px}
.wx-day{text-align:center;padding:6px 4px}
.wxdn{font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
.wxdi{--mdc-icon-size:21px;margin-bottom:3px;display:block;transition:color .3s}
.wxdh{font-size:16px;font-weight:700;color:rgba(255,255,255,.88)}
.wxdl{font-size:12px;color:rgba(255,255,255,.47);margin-top:1px}
.wx-precip{font-size:10px;color:rgba(96,165,250,.8);margin-top:2px;font-weight:700}

/* Spotify */
.sp2{padding:7px 10px;display:flex;gap:10px;align-items:flex-start}
.sp-art{width:58px;height:58px;border-radius:8px;object-fit:cover;flex-shrink:0;border:1px solid rgba(255,255,255,.12)}
.sp-art-empty{width:58px;height:58px;border-radius:8px;flex-shrink:0;background:linear-gradient(145deg,rgba(29,185,84,.25),rgba(29,185,84,.06));border:1px solid rgba(29,185,84,.3);display:flex;align-items:center;justify-content:center}
.sp-art-empty ha-icon{--mdc-icon-size:32px;color:#1DB954}
.sp-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.sp-track{font-size:16px;font-weight:800;color:rgba(255,255,255,.94);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.15}
.sp-artist{font-size:12px;color:rgba(255,255,255,.62);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sp-album{font-size:10px;color:rgba(255,255,255,.38);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sp-prog-wrap{margin-top:4px}
.sp-prog-bar{height:3px;border-radius:3px;background:rgba(255,255,255,.12);overflow:hidden}
.sp-prog-fill{height:100%;border-radius:3px;background:#1DB954;transition:width .5s linear}
.sp-times{display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,.38);margin-top:1px}
.sp-ctrl-row{display:flex;align-items:center;gap:5px;margin-top:3px}
.sp-btn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1)!important;border-radius:8px;padding:5px 8px;display:flex;align-items:center;justify-content:center;transition:all .15s,transform .08s}
.sp-btn:hover{background:rgba(255,255,255,.14)}
.sp-btn ha-icon{--mdc-icon-size:15px;color:rgba(255,255,255,.72)}
.sp-play{background:rgba(29,185,84,.18);border-color:rgba(29,185,84,.38)!important;padding:6px 11px}
.sp-play:hover{background:rgba(29,185,84,.28)}
.sp-play ha-icon{--mdc-icon-size:16px;color:#1DB954}
.sp-sm ha-icon{--mdc-icon-size:12px}
.sp-vol-group{display:flex;align-items:center;gap:3px;margin-left:auto}
.sp-vol-lbl{font-size:9px;color:rgba(255,255,255,.42);min-width:26px;text-align:center}

/* Spotify device strip */
.sp-devices{display:flex;gap:8px;margin-top:5px;padding-top:5px;border-top:1px solid rgba(255,255,255,.07)}
.sp-device{display:flex;align-items:center;gap:4px;flex:1;font-size:11px;color:rgba(255,255,255,.42);overflow:hidden}
.sp-device ha-icon{flex-shrink:0;color:rgba(255,255,255,.35);transition:color .2s}
.sp-device.on ha-icon{color:rgba(200,185,255,.8)}
.sp-device span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .2s}
.sp-device.on span{color:rgba(200,185,255,.8)}
.sp-dev-dot{width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.15);flex-shrink:0;transition:background .2s}
.sp-device.on .sp-dev-dot{background:#a78bfa;box-shadow:0 0 6px rgba(167,139,250,.6)}

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

/* Energy section */
.en-section{padding:9px}
.en-nodata{display:flex;align-items:center;gap:7px;color:rgba(255,255,255,.42);font-size:11px;padding:2px 0 0;line-height:1.35}
.en-live-row{display:flex;align-items:stretch;gap:12px;margin-bottom:7px;width:100%}
.en-live-block{flex:1;min-width:0}
.en-live-val{font-size:36px;font-weight:300;letter-spacing:-1px;line-height:1.05;transition:color .3s}
.en-live-lbl{font-size:10px;color:rgba(255,255,255,.43);text-transform:uppercase;letter-spacing:.6px;margin-top:1px}
.en-cost-now{font-size:11px;color:rgba(255,255,255,.58);margin-top:2px;font-weight:700}
.en-divider{width:1px;height:38px;background:rgba(255,255,255,.1);flex-shrink:0}
.en-today-block{flex:1;min-width:0}
.en-today-val{font-size:24px;font-weight:300;color:rgba(255,255,255,.94);letter-spacing:-.6px;line-height:1}
.en-unit{font-size:12px;color:rgba(255,255,255,.47);font-weight:400}
.en-today-cost{font-size:11px;color:rgba(255,255,255,.48);margin-top:2px}
.en-tabs{display:flex;gap:4px;margin-bottom:8px}
.en-tab{flex:1;padding:4px 2px;border-radius:8px;font-size:9px;font-weight:700;color:rgba(255,255,255,.4);background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07)!important;transition:all .15s;text-transform:capitalize;text-align:center;cursor:pointer}
.en-tab:hover{background:rgba(255,255,255,.09);color:rgba(255,255,255,.65)}
.en-tab.active{background:rgba(167,139,250,.18);border-color:rgba(167,139,250,.35)!important;color:rgba(200,185,255,.92)}
.en-tab.loading{position:relative;color:rgba(255,255,255,.72)}
.en-tab.loading::after{content:"";position:absolute;right:7px;top:50%;width:5px;height:5px;margin-top:-2.5px;border-radius:50%;background:#a78bfa;box-shadow:0 0 8px rgba(167,139,250,.7);animation:sentry-pulse 1.15s ease-in-out infinite}
.en-chart{width:100%;height:48px;overflow:hidden}
.en-svg{width:100%;height:48px;display:block}
.en-loading{height:48px;display:flex;align-items:center;justify-content:center;font-size:11px;color:rgba(255,255,255,.28)}

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
.cam-wrap{border-radius:10px;overflow:hidden;background:rgba(0,0,0,.4);min-height:170px;display:flex;align-items:center;justify-content:center}
.cam-feed{width:100%;height:100%;min-height:170px;object-fit:cover;display:block;border-radius:10px}
.cam-err{flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:24px;color:rgba(255,255,255,.3);font-size:10px;text-align:center;min-height:150px}
.cam-err ha-icon{--mdc-icon-size:28px}
.cam-err small{font-size:8px;opacity:.7}

/* Responsive */
@media(max-width:840px){
  .ov-main,.g2{grid-template-columns:1fr}
  .rooms5{grid-template-columns:repeat(3,1fr)}
  .tc-img-wrap{height:124px}
  .tc-car{width:100%}
  .wx-forecast{grid-template-columns:repeat(3,1fr)}
  .media-strip{grid-template-columns:1fr}
  .sp2{flex-direction:column}
  .sp-art,.sp-art-empty{width:100%;height:84px}
  .clim-row{grid-template-columns:1fr auto 1fr}
  .clim-row .clim-sep:last-of-type,.clim-row .aq-col{display:none}
}
`; }
}

customElements.define("glass-dashboard-card", GlassDashboardCard);

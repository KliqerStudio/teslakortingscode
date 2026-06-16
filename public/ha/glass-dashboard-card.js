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
    this._scrollByTab = {};
    this._optimistic = new Map();
    this._notice = null;
    this._noticeTimer = null;
    this._audioCtx = null;
    this._lastClickSound = 0;
    this._colorPickerOpenUntil = 0;
    this._energy = { prefs: null, stats: {}, period: "day", loadedAt: {}, loading: false, loadingPeriods: new Set() };
    this._energyRate = 0.29; // €/kWh — change to match your contract
    this._agenda = { events: [], loading: false, loadedAt: 0, calendarsKey: "" };
    this._worldCup = { matches: [], groups: [], featured: null, loading: false, loadedAt: 0, error: "" };
    // Presence detection
    this._presence = {
      stream: null, video: null, canvas: null, ctx: null,
      lastPixels: null, lastMotion: Date.now(),
      dimmed: false, timer: null, started: false,
    };
    this.entities = {
      mainLights: [
        "light.lounge_light","light.living_room","light.reading_light",
        "light.dining_room","light.led_keuken_boven","light.led_keuken_onder",
        "light.marylin","light.govee_tv_left","light.govee_tv_right",
      ],
      bedroomLights: ["light.bed","light.kast","light.closet","light.ants_closet","light.watch_light"],
      gameLights: [
        "light.plafond","light.desk_lamp","light.desk_led_strip","light.led_strip_4",
      ],
      utilityLights: ["light.toilet","light.hallway_door","switch.night_light"],
      livingTemp:     "sensor.living_room_sensor_temperature",
      livingHumidity: "sensor.living_room_sensor_humidity",
      livingAir:      "sensor.living_room_sensor_air_quality",
      livingPm25:     "sensor.living_room_sensor_pm2_5",
      bedTemp:        "sensor.bedroom_sensor_temperature",
      bedHumidity:    "sensor.bedroom_sensor_humidity",
      bedAir:         "sensor.bedroom_sensor_air_quality",
      bedPm25:        "sensor.bedroom_sensor_pm2_5",
      weather:        "weather.buienradar",
      sun:            "sun.sun",
      teslaClimate:   "climate.model_3_climate",
      teslaBattery:   "sensor.model_3_battery_level",
      teslaRange:     "sensor.model_3_battery_range",
      teslaLocation:  "device_tracker.model_3_location",
      teslaSentry:    "switch.model_3_sentry_mode",
      teslaInsideTemp:"sensor.model_3_inside_temperature",
      teslaChargeCable:"binary_sensor.model_3_charge_cable",
      teslaChargeState:"sensor.model_3_charging",
      teslaChargeRate:"sensor.model_3_charge_rate",
      teslaChargePower:"sensor.model_3_charger_power",
      teslaChargeTime:"sensor.model_3_time_to_full_charge",
      teslaChargeSwitch:"switch.model_3_charge",
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
      archerDown:     "sensor.archer_ax55_download_speed",
      archerUp:       "sensor.archer_ax55_upload_speed",
      archerWan:      "binary_sensor.archer_ax55_wan_status",
    };
  }

  setConfig(config) { this._config = config || {}; }

  connectedCallback() {
    if (!this._camTimer) {
      this._camTimer = window.setInterval(() => this.updateCamera(), 5000);
    }
    if (!this._wcTimer) {
      this._wcTimer = window.setInterval(() => this.loadWorldCup(), 120000);
    }
  }

  disconnectedCallback() {
    if (this._timer)    { window.clearInterval(this._timer);    this._timer    = null; }
    if (this._camTimer) { window.clearInterval(this._camTimer); this._camTimer = null; }
    if (this._wcTimer)  { window.clearInterval(this._wcTimer);  this._wcTimer  = null; }
    if (this._noticeTimer) window.clearTimeout(this._noticeTimer);
    this._audioCtx?.close?.();
    this._audioCtx = null;
    this._stopPresence();
  }

  set hass(hass) {
    this._hass = hass;
    this.loadForecast();
    this.loadHistory();
    this.loadEnergy();
    this.loadAgenda();
    this.loadWorldCup();
    // Only re-render when relevant entity states actually changed.
    // This prevents the Tesla image (and everything else) from flickering
    // every time HA sends ANY state update (which can be every few seconds).
    const sig = this._stateSig();
    if (sig !== this._lastSig) {
      this._lastSig = sig;
      clearTimeout(this._renderDebounce);
      const pickerDelay = Math.max(0, this._colorPickerOpenUntil - Date.now());
      this._renderDebounce = setTimeout(() => this.render(), pickerDelay ? pickerDelay + 350 : 100);
    }
    if (!this._timer) this._timer = window.setInterval(() => this.updateClock(), 10000);
    if (!this._presence.started) this.startPresenceDetection();
  }

  _stateSig() {
    if (!this._hass) return "";
    const e = this.entities;
    const watch = [
      ...e.mainLights, ...e.bedroomLights, ...e.gameLights, ...e.utilityLights, ...e.toonDevices,
      e.livingTemp, e.livingHumidity, e.livingAir, e.livingPm25,
      e.bedTemp, e.bedHumidity, e.bedAir, e.bedPm25, e.weather, e.sun,
      e.teslaClimate, e.teslaBattery, e.teslaRange, e.teslaLocation,
      e.teslaSentry, e.teslaInsideTemp,
      e.teslaChargeCable, e.teslaChargeState, e.teslaChargeRate,
      e.teslaChargePower, e.teslaChargeTime, e.teslaChargeSwitch,
      e.spotify, e.spotifySpeaker, e.tv, e.petFeederCamera,
      e.p1Power, e.p1Return, e.p1EnergyToday,
      e.vattenfallElectricityPrice, e.vattenfallGasPrice,
      e.archerDown, e.archerUp, e.archerWan,
      ...this.calendarEntities(), ...this.fitEntities(), ...this.stockEntities(),
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
  clearOptimistic(entities = []) {
    entities.forEach(entity => this._optimistic.delete(entity));
  }
  reconcileSoon(entities = [], delay = 1200) {
    window.setTimeout(() => {
      this.clearOptimistic(entities);
      this.render();
    }, delay);
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
  async turnEntities(targets, targetOn) {
    const byDomain = targets.reduce((acc, entity) => {
      const domain = entity.split(".")[0];
      if (!acc[domain]) acc[domain] = [];
      acc[domain].push(entity);
      return acc;
    }, {});
    const calls = Object.entries(byDomain)
      .filter(([domain]) => ["light","switch","input_boolean","fan"].includes(domain))
      .map(([domain, entity_id]) => this.service(domain, targetOn ? "turn_on" : "turn_off", { entity_id }));
    const results = await Promise.allSettled(calls);
    const failed = results.filter(result => result.status === "rejected");
    if (failed.length) throw failed[0].reason;
  }
  async toggleEntity(entity) {
    if (!this._hass?.states?.[entity] || !this.isAvailable(entity)) return;
    const domain = entity.split(".")[0];
    const turnable = ["light","switch","input_boolean","fan"].includes(domain);
    const targetOn = !this.isOn(entity);
    if (turnable) {
      this.setOptimistic([entity], targetOn ? "on" : "off", 1800);
      this.render();
      try {
        await this.service(domain, targetOn ? "turn_on" : "turn_off", { entity_id: entity });
        this.reconcileSoon([entity], 900);
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
    this.setOptimistic(targets, targetOn ? "on" : "off", 1800);
    this.render();
    try {
      await this.turnEntities(targets, targetOn);
      this.reconcileSoon(targets, 1100);
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
    this.setOptimistic(targets, "off", 1800);
    this.render();
    this.turnEntities(targets, false).then(() => this.reconcileSoon(targets, 1100)).catch(err => {
      targets.forEach(entity => this._optimistic.delete(entity));
      this.render();
      console.warn("[GlassDash] all-off failed:", err);
    });
  }
  async toggleClimate() {
    const cur = this._hass?.states?.[this.entities.teslaClimate]?.state;
    const targetOn = cur === "off";
    this.setOptimistic([this.entities.teslaClimate], targetOn ? "heat_cool" : "off");
    this.render();
    try {
      await this.service("climate", "set_hvac_mode", {
        entity_id: this.entities.teslaClimate,
        hvac_mode: targetOn ? "heat_cool" : "off",
      });
      this.reconcileSoon([this.entities.teslaClimate], 1300);
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
      this.entities.livingTemp, this.entities.livingHumidity, this.entities.livingAir, this.entities.livingPm25,
      this.entities.bedTemp,    this.entities.bedHumidity,    this.entities.bedAir,    this.entities.bedPm25,
      this.entities.p1Power,    this.entities.p1Return,      this.entities.p1EnergyToday,
      this.entities.archerDown, this.entities.archerUp,
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

      this._energy.loadingPeriods ??= new Set();
      this._energy.loadingPeriods.add(period);
      this._energy.loading = true;
      this.render();

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

  async loadAgenda() {
    if (!this._hass?.callWS) return;
    const calendars = this.calendarEntities();
    const key = calendars.join("|");
    if (!calendars.length) {
      if (this._agenda.events.length || this._agenda.calendarsKey) {
        this._agenda = { ...this._agenda, events: [], calendarsKey: "", loadedAt: Date.now() };
        this.render();
      }
      return;
    }
    if (this._agenda.loading) return;
    if (this._agenda.calendarsKey === key && Date.now() - this._agenda.loadedAt < 300000) return;
    this._agenda.loading = true;
    try {
      const start = new Date();
      const end = new Date(Date.now() + 7 * 24 * 3600 * 1000);
      const results = await Promise.allSettled(calendars.map(entity_id =>
        this._hass.callWS({
          type: "calendar/get_events",
          entity_id,
          start: start.toISOString(),
          end: end.toISOString(),
        }).then(result => ({ entity_id, result }))
      ));
      const events = [];
      for (const item of results) {
        if (item.status !== "fulfilled") continue;
        const { entity_id, result } = item.value;
        const list = result?.events || result?.[entity_id]?.events || [];
        list.forEach(event => events.push({ ...event, calendar: entity_id }));
      }
      events.sort((a, b) => new Date(a.start?.dateTime || a.start?.date || 0) - new Date(b.start?.dateTime || b.start?.date || 0));
      this._agenda = { events: events.slice(0, 8), loading: false, loadedAt: Date.now(), calendarsKey: key };
      this.render();
    } catch (err) {
      console.warn("[GlassDash] Agenda load failed:", err);
      this._agenda = { ...this._agenda, loading: false, loadedAt: Date.now(), calendarsKey: key };
    }
  }

  async loadWorldCup(force = false) {
    if (this._worldCup.loading) return;
    if (!force && this._worldCup.loadedAt && Date.now() - this._worldCup.loadedAt < 120000) return;
    this._worldCup.loading = true;
    this._worldCup.error = "";
    try {
      const url = `${this.remoteBase()}/api/worldcup${force ? `?t=${Date.now()}` : ""}`;
      const resp = await fetch(url, {
        cache: "no-store",
        mode: "cors",
        headers: { Accept: "application/json" },
      });
      if (!resp.ok) throw new Error(`World Cup feed returned ${resp.status}`);
      const data = await resp.json();
      this._worldCup = {
        matches: Array.isArray(data?.matches) ? data.matches : [],
        groups: Array.isArray(data?.groups) ? data.groups : [],
        featured: data?.featured || null,
        loading: false,
        loadedAt: Date.now(),
        error: "",
      };
      this.render();
    } catch (err) {
      console.warn("[GlassDash] World Cup load failed:", err);
      this._worldCup = {
        ...this._worldCup,
        loading: false,
        loadedAt: Date.now(),
        error: String(err?.message || err || "Could not load World Cup data."),
      };
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
      "clear-night":"mdi:weather-night", "partlycloudy-night":"mdi:weather-night-partly-cloudy", fog:"mdi:weather-fog",
      snowy:"mdi:weather-snowy", windy:"mdi:weather-windy", hail:"mdi:weather-hail",
      lightning:"mdi:weather-lightning", "lightning-rainy":"mdi:weather-lightning-rainy",
      exceptional:"mdi:weather-cloudy-alert",
    };
    return m[state] || "mdi:weather-partly-cloudy";
  }
  isNightNow() {
    const now = new Date();
    const hour = Number(now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Europe/Amsterdam",
    }).slice(0, 2));
    if (!Number.isFinite(hour)) return false;
    if (hour >= 21 || hour < 6) return true;
    if (hour >= 7 && hour < 20) return false;
    const sun = this._hass?.states?.[this.entities.sun]?.state;
    if (sun === "below_horizon") return true;
    if (sun === "above_horizon") return false;
    return hour < 6 || hour >= 21;
  }
  displayWeatherState(state) {
    const raw = String(state || "partlycloudy").toLowerCase();
    if (!this.isNightNow()) return raw;
    if (raw === "sunny" || raw === "clear") return "clear-night";
    if (raw === "partlycloudy") return "partlycloudy-night";
    return raw;
  }
  weatherLabel(state) {
    const labels = {
      "clear-night": "Clear night",
      "partlycloudy-night": "Partly cloudy night",
    };
    return labels[state] || String(state || "Unknown").replace(/-/g, " ");
  }
  fmtTime(secs) {
    if (!secs || secs < 0) return "0:00";
    const s = Math.round(secs), m = Math.floor(s/60);
    return `${m}:${String(s%60).padStart(2,"0")}`;
  }
  esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
    }[ch]));
  }
  remoteBase() {
    return "https://teslakortingscode.com";
  }
  remoteAsset(path = "") {
    return `${this.remoteBase()}${path.startsWith("/") ? path : `/${path}`}`;
  }
  stateEntities() {
    return Object.values(this._hass?.states || {});
  }
  entityName(entity) {
    return this.attr(entity, "friendly_name", null) || entity.split(".")[1]?.replace(/_/g, " ") || entity;
  }
  calendarEntities() {
    return this.stateEntities()
      .filter(s => s.entity_id?.startsWith("calendar."))
      .map(s => s.entity_id)
      .sort();
  }
  fitEntities() {
    const include = /\b(google[_ ]?fit|fitbit|steps?|step_count|calor(?:ie|ies)|active[_ ]?minutes?|heart[_ ]?rate|sleep|body[_ ]?weight|distance[_ ]?walked|move[_ ]?minutes?)\b/i;
    return this.stateEntities()
      .filter(s => s.entity_id?.startsWith("sensor."))
      .filter(s => include.test(`${s.entity_id} ${s.attributes?.friendly_name || ""}`))
      .map(s => s.entity_id)
      .sort()
      .slice(0, 8);
  }
  stockEntities() {
    const include = /\b(etoro|portfolio|stock|stocks|ticker|share|shares|equity|nasdaq|nyse|sp500|s&p|crypto|investment)\b/i;
    const exclude = /\b(vattenfall|stroom|gas|p1|energy|electricity|charger|charge)\b/i;
    return this.stateEntities()
      .filter(s => s.entity_id?.startsWith("sensor."))
      .filter(s => {
        const text = `${s.entity_id} ${s.attributes?.friendly_name || ""}`;
        return include.test(text) && !exclude.test(text);
      })
      .map(s => s.entity_id)
      .sort()
      .slice(0, 8);
  }
  wcStatusLabel(match) {
    const state = String(match?.state || "");
    if (state === "in") return match?.clock || "Live";
    if (state === "post") return "Final";
    if (match?.kickoffLocal) {
      const dt = new Date(match.kickoffLocal);
      return dt.toLocaleString("en-GB", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Amsterdam",
      });
    }
    return match?.status || "Scheduled";
  }
  wcScore(match, side) {
    const team = match?.teams?.find(t => t.side === side) || match?.teams?.[side === "home" ? 0 : 1];
    return team?.score ?? "-";
  }
  wcTeam(match, side) {
    const team = match?.teams?.find(t => t.side === side) || match?.teams?.[side === "home" ? 0 : 1];
    return team?.short || team?.name || "--";
  }
  wcStatIcon(label) {
    const text = String(label || "").toLowerCase();
    if (text.includes("possession")) return "mdi:chart-donut";
    if (text.includes("shot")) return "mdi:target";
    if (text.includes("foul")) return "mdi:whistle";
    if (text.includes("corner")) return "mdi:flag-outline";
    if (text.includes("offside")) return "mdi:run-fast";
    if (text.includes("save")) return "mdi:hand-back-right-outline";
    if (text.includes("pass")) return "mdi:swap-horizontal";
    return "mdi:soccer";
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
  pmValue(entity) {
    const n = Number(this.st(entity, NaN));
    return Number.isFinite(n) ? n : NaN;
  }
  airStatus(labelEntity, pmEntity) {
    const pm = this.pmValue(pmEntity);
    const raw = Number.isFinite(pm) ? pm : this.st(labelEntity, "--");
    const labelRaw = this.st(labelEntity, raw);
    const aqLbl = this.aqLabel(labelRaw === "--" ? raw : labelRaw);
    const aqc = this.aqColor(Number.isFinite(pm) ? pm : aqLbl);
    const valHtml = Number.isFinite(pm)
      ? `<div class="cv" style="color:${aqc}">${pm.toFixed(0)}<span class="cu" style="color:${aqc}99"> µg/m³</span></div>`
      : `<div class="cv aq-text" style="color:${aqc}">${aqLbl}</div>`;
    return { pm, aqLbl, aqc, valHtml };
  }

  formatRate(entity) {
    const n = Number(this.st(entity, NaN));
    if (!Number.isFinite(n)) return "--";
    const unit = String(this.attr(entity, "unit_of_measurement", "KiB/s"));
    let mbps = n;
    if (/kib\/s/i.test(unit)) mbps = n * 8 / 1024;
    else if (/mib\/s/i.test(unit)) mbps = n * 8;
    else if (/kb\/s/i.test(unit)) mbps = n * 8 / 1000;
    else if (/mb\/s/i.test(unit)) mbps = n * 8;
    return mbps >= 10 ? `${mbps.toFixed(0)} Mbps` : `${mbps.toFixed(1)} Mbps`;
  }

  supportsColor(entity) {
    const modes = this.attr(entity, "supported_color_modes", []) || [];
    return entity?.startsWith("light.") && modes.some(m => ["hs","xy","rgb","rgbw","rgbww"].includes(m));
  }

  roomLightTargets(entities) {
    return this.actionable(entities).filter(entity => entity.startsWith("light."));
  }

  colorCapable(entities) {
    return this.actionable(entities).filter(entity => this.supportsColor(entity));
  }

  colorSwatches(target, compact = false) {
    const swatches = [
      ["Warm", 38, 68, "#ffb45f"],
      ["Pumpkin", 28, 82, "#f97316"],
      ["Red", 0, 82, "#ef4444"],
      ["Soft", 48, 22, "#ffe9b8"],
      ["Pink", 335, 58, "#f472b6"],
      ["Violet", 262, 60, "#a78bfa"],
      ["Blue", 210, 72, "#60a5fa"],
      ["Green", 145, 58, "#34d399"],
    ];
    return `<div class="swatches ${compact ? "compact" : ""}">
      ${swatches.map(([name,h,s,color]) => `<button class="c-swatch" title="${name}" data-color-target="${target}" data-hue="${h}" data-sat="${s}" style="--sw:${color}"></button>`).join("")}
      <label class="c-picker" title="Custom colour">
        <ha-icon icon="mdi:palette-outline"></ha-icon>
        <input type="color" value="#a78bfa" data-color-picker="${target}">
      </label>
    </div>`;
  }

  async setLightColor(target, h, s) {
    const entities = String(target).includes(",") ? String(target).split(",") : [target];
    const targets = this.colorCapable(entities);
    if (!targets.length) return;
    this.setOptimistic(targets, "on", 5000);
    this.render();
    try {
      await this.service("light", "turn_on", {
        entity_id: targets,
        hs_color: [Number(h), Number(s)],
        brightness_pct: 85,
      });
    } catch (err) {
      targets.forEach(entity => this._optimistic.delete(entity));
      this.render();
      console.warn("[GlassDash] set color failed:", err);
    }
  }

  async setLightRgb(target, hex) {
    const entities = String(target).includes(",") ? String(target).split(",") : [target];
    const targets = this.colorCapable(entities);
    if (!targets.length || !/^#[0-9a-f]{6}$/i.test(String(hex))) return;
    const rgb = [1,3,5].map(i => parseInt(hex.slice(i, i + 2), 16));
    this.setOptimistic(targets, "on", 5000);
    this._colorPickerOpenUntil = Date.now() + 1800;
    try {
      await this.service("light", "turn_on", {
        entity_id: targets,
        rgb_color: rgb,
        brightness_pct: 85,
      });
      window.setTimeout(() => this.render(), 1800);
    } catch (err) {
      targets.forEach(entity => this._optimistic.delete(entity));
      this.render();
      console.warn("[GlassDash] set RGB failed:", err);
    }
  }

  async setRoomBrightness(target, value) {
    const entities = String(target).split(",");
    const targets = this.roomLightTargets(entities);
    if (!targets.length) return;
    const brightness_pct = Math.max(1, Math.min(100, Math.round(Number(value) || 1)));
    this.setOptimistic(targets, "on", 5000);
    this.render();
    try {
      await this.service("light", "turn_on", { entity_id: targets, brightness_pct });
    } catch (err) {
      targets.forEach(entity => this._optimistic.delete(entity));
      this.render();
      console.warn("[GlassDash] room brightness failed:", err);
    }
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

  // ── Presence Detection ────────────────────────────────────────────────────────
  async startPresenceDetection() {
    this._presence.started = true;
    if (!navigator.mediaDevices?.getUserMedia) {
      console.warn("[GlassDash] getUserMedia not available");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 160 }, height: { ideal: 120 } },
        audio: false,
      });
      this._presence.stream = stream;

      // Video MUST be in the Shadow DOM — iOS won't decode frames for off-DOM video
      const video = document.createElement("video");
      video.srcObject = stream;
      video.setAttribute("playsinline", "");
      video.playsInline = true;
      video.muted = true;
      video.autoplay = true;
      video.style.cssText = "position:fixed;width:1px;height:1px;opacity:0.01;top:0;left:0;pointer-events:none;z-index:-1";
      this.shadowRoot.appendChild(video);
      this._presence.video = video;

      // Wait for metadata + first frame
      await new Promise((res, rej) => {
        video.onloadedmetadata = res;
        video.onerror = rej;
        setTimeout(res, 4000); // fallback
      });
      await video.play().catch(() => {});
      await new Promise(res => setTimeout(res, 800)); // let auto-exposure settle

      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 120;
      this._presence.canvas = canvas;
      this._presence.ctx = canvas.getContext("2d", { willReadFrequently: true });

      this._presence.timer = window.setInterval(() => this._checkMotion(), 1500);
      console.log("[GlassDash] Presence detection active — video:", video.videoWidth, "x", video.videoHeight);
    } catch (e) {
      console.warn("[GlassDash] Camera unavailable:", e.name, e.message);
    }
  }

  _checkMotion() {
    const p = this._presence;
    if (!p.video || !p.ctx) return;

    // iOS won't decode frames if video falls out of the DOM — re-attach if needed
    if (!p.video.parentNode) {
      p.video.style.cssText = "position:fixed;width:1px;height:1px;opacity:0.01;top:0;left:0;pointer-events:none;z-index:-1";
      this.shadowRoot.appendChild(p.video);
    }

    if (p.video.readyState < 2 || p.video.videoWidth === 0) return; // not ready yet

    p.ctx.drawImage(p.video, 0, 0, 160, 120);
    let imageData;
    try { imageData = p.ctx.getImageData(0, 0, 160, 120); }
    catch(e) { console.warn("[GlassDash] getImageData blocked:", e.message); return; }
    const { data } = imageData;

    if (p.lastPixels) {
      let diff = 0;
      // Sample every 8th pixel (red channel only) for speed
      const step = 32;
      for (let i = 0; i < data.length; i += step) {
        diff += Math.abs(data[i] - p.lastPixels[i]);
      }
      // Normalize to 0–1: diff / (numSamples * maxDiffPerSample)
      const numSamples = Math.floor(data.length / step);
      const score = diff / (numSamples * 255);

      // score > 0.08 = roughly 8% average channel change across sampled pixels
      if (score > 0.08) {
        p.lastMotion = Date.now();
        if (p.dimmed) this._wakeScreen();
      }
    }

    p.lastPixels = new Uint8Array(data);

    // Check idle timeout — dim after 3 minutes of no motion
    const idleMinutes = (this._config?.idle_minutes ?? 3);
    if (!p.dimmed && Date.now() - p.lastMotion > idleMinutes * 60 * 1000) {
      this._sleepScreen();
    }
  }

  _wakeScreen() {
    const p = this._presence;
    p.dimmed = false;
    const overlay = this.shadowRoot.querySelector(".presence-overlay");
    if (overlay) {
      overlay.classList.remove("dimmed");
      overlay.style.pointerEvents = "none";
    }
    // Optional: brighten via HA Companion app
    const notifyEntity = this._config?.idle_notify_entity;
    if (notifyEntity && this._hass) {
      this._hass.callService("notify", notifyEntity.replace("notify.", ""), {
        message: "command_screen_brightness_level",
        data: { command: "command_screen_brightness_level", level: 255 },
      }).catch(() => {});
    }
  }

  _sleepScreen() {
    const p = this._presence;
    p.dimmed = true;
    const overlay = this.shadowRoot.querySelector(".presence-overlay");
    if (overlay) {
      overlay.classList.add("dimmed");
      overlay.style.pointerEvents = "all";
      // Sync clock immediately so it's not blank when overlay appears
      const now = new Date();
      const pt = overlay.querySelector("#pres-t");
      const pd = overlay.querySelector("#pres-d");
      if (pt) pt.textContent = now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Amsterdam"});
      if (pd) pd.textContent = now.toLocaleDateString([],{weekday:"short",day:"numeric",month:"long",timeZone:"Europe/Amsterdam"});
    }
    // Optional: dim via HA Companion app
    const notifyEntity = this._config?.idle_notify_entity;
    if (notifyEntity && this._hass) {
      this._hass.callService("notify", notifyEntity.replace("notify.", ""), {
        message: "command_screen_brightness_level",
        data: { command: "command_screen_brightness_level", level: 10 },
      }).catch(() => {});
    }
  }

  _stopPresence() {
    const p = this._presence;
    if (p.timer) { window.clearInterval(p.timer); p.timer = null; }
    if (p.stream) { p.stream.getTracks().forEach(t => t.stop()); p.stream = null; }
    if (p.video?.parentNode) p.video.parentNode.removeChild(p.video);
    p.video = null; p.canvas = null; p.ctx = null; p.started = false;
  }

  updateClock() {
    const ti = this.shadowRoot.getElementById("clk-t");
    const da = this.shadowRoot.getElementById("clk-d");
    const gr = this.shadowRoot.getElementById("greeting");
    if (!ti||!da) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Amsterdam"});
    const dateStr = now.toLocaleDateString([],{weekday:"short",day:"numeric",month:"long",timeZone:"Europe/Amsterdam"});
    ti.textContent = timeStr;
    da.textContent = dateStr;
    if (gr) gr.textContent = this.greeting();
    // Keep presence screensaver clock in sync
    const pt = this.shadowRoot.getElementById("pres-t");
    const pd = this.shadowRoot.getElementById("pres-d");
    if (pt) pt.textContent = timeStr;
    if (pd) pd.textContent = dateStr;
  }
  greeting() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: "Europe/Amsterdam",
    }).formatToParts(new Date());
    const h = Number(parts.find(part => part.type === "hour")?.value ?? new Date().getHours());
    if (h >= 5 && h < 12) return "Good morning";
    if (h >= 12 && h < 17) return "Good afternoon";
    if (h >= 17 && h < 21) return "Good evening";
    return "Good night";
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

  _saveScroll() {
    const page = this.shadowRoot?.querySelector(".page.active");
    const dash = this.shadowRoot?.querySelector(".dash");
    if (page) this._scrollByTab[this._tab] = page.scrollTop || 0;
    if (dash) this._dashScrollTop = dash.scrollTop || 0;
  }

  _restoreScroll() {
    const top = this._scrollByTab[this._tab] || 0;
    const dashTop = this._dashScrollTop || 0;
    if (!top && !dashTop) return;
    requestAnimationFrame(() => {
      const page = this.shadowRoot?.querySelector(".page.active");
      const dash = this.shadowRoot?.querySelector(".dash");
      if (page) page.scrollTop = top;
      if (dash) dash.scrollTop = dashTop;
    });
  }

  selectTab(id) {
    if (!id || id === this._tab) return;
    this._saveScroll();
    this._tab = id;
    this._skipNextSave = true;
    this.render();
  }

  // ── Main Render ───────────────────────────────────────────────────────────────
  render() {
    if (!this._hass) return;
    if (this._skipNextSave) this._skipNextSave = false;
    else this._saveScroll();
    const e = this.entities;

    const livingOn  = this.anyOn(e.mainLights);
    const bedroomOn = this.anyOn(e.bedroomLights);
    const gameOn    = this.anyOn(e.gameLights);
    const utilityOn = this.anyOn(e.utilityLights);

    const batteryRaw  = Number(this.st(e.teslaBattery,"0")) || 0;
    const batteryPct  = this.teslaBatteryPercent(batteryRaw);
    const range       = this.fmt(e.teslaRange," km","--",0);
    const teslaPlace  = this.niceState(e.teslaLocation,"Away");
    const climOn      = this.isOn(e.teslaClimate);
    const targetTemp  = this.attr(e.teslaClimate,"temperature",22);
    const teslaCharge = this.teslaChargeInfo();

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

    this.shadowRoot.innerHTML = `<style>${this.css()}</style><ha-card><div class="dash ${this.isNightNow() ? "theme-night" : "theme-day"}">
  <div class="bg ${this.isNightNow() ? "night" : "day"}"></div>

  <div class="topbar z1">
    <div class="greeting-wrap">
      <div class="home-lbl" id="greeting">${this.greeting()}</div>
    </div>
  </div>

  <div class="tabs z1">
    <div class="tabs-scroll">
      ${this.tab("ov",   "mdi:view-dashboard-outline","Overview")}
      ${this.tab("liv",  "mdi:sofa-outline",          "Living Room")}
      ${this.tab("bed",  "mdi:bed-king-outline",       "Bedroom")}
      ${this.tab("game", "mdi:gamepad-variant-outline","Game Room")}
      ${this.tab("toon", "mdi:cat",                   "Toon's Room")}
      ${this.tab("util", "mdi:home-floor-1",          "Utility")}
      ${this.tab("me",   "mdi:account-circle-outline","Me")}
      ${this.tab("wc",   "mdi:soccer",                "World Cup")}
    </div>
    <div class="tabs-right">
      <button class="fs-btn" data-action="sleep" title="Sleep screen">
        <ha-icon icon="mdi:weather-night"></ha-icon>
      </button>
      <button class="fs-btn" data-action="fullscreen" title="Toggle fullscreen">
        <ha-icon icon="mdi:${document.fullscreenElement ? 'fullscreen-exit' : 'fullscreen'}"></ha-icon>
      </button>
      <div class="clock-wrap">
        <div class="clk-time" id="clk-t">00:00</div>
        <div class="clk-date" id="clk-d">Thu, 14 May</div>
      </div>
    </div>
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
        ${this.climateSummary("Living Room · Climate",e.livingTemp,e.livingHumidity,e.livingAir,e.livingPm25)}
        ${this.climateSummary("Bedroom · Climate",e.bedTemp,e.bedHumidity,e.bedAir,e.bedPm25)}
        ${this.energySection()}
      </div>

      <!-- RIGHT: Tesla + Spotify -->
      <div class="col">
        ${this.teslaCard(batteryPct,range,teslaPlace,climOn,targetTemp,teslaCharge)}
        ${this.spotifySection(spotifyPic,spotifyTitle,spotifyArtist,spotifyAlbum,spotifyActive,spotifyPlaying,curPos,durSec,spProg,volPct)}
        ${this.pulseSection()}
      </div>
    </div>
    ${this.weatherSection(weatherState,weatherTemp,weatherHumidity,weatherWind,weatherFeels,weatherUV,weatherVis)}
  </div>

  ${this.roomPage("liv","Living Room","Kitchen · Dining · TV area",e.mainLights,e.livingTemp,e.livingHumidity,e.livingAir,e.livingPm25)}
  ${this.roomPage("bed","Bedroom","Sleep environment",e.bedroomLights,e.bedTemp,e.bedHumidity,e.bedAir,e.bedPm25)}
  ${this.roomPage("game","Game Room","Office · Gaming",e.gameLights)}
  ${this.toonPage(camSrc)}
  ${this.roomPage("util","Utility","Toilet · Hallway/Door",e.utilityLights)}
  ${this.personalPage()}
  ${this.worldCupPage()}
</div>
<div class="presence-overlay ${this._presence.dimmed ? "dimmed" : ""}" data-action="presence-wake">
  <div class="presence-clock">
    <div class="presence-time" id="pres-t"></div>
    <div class="presence-date" id="pres-d"></div>
  </div>
</div>
</ha-card>`;

    // Re-attach presence video — innerHTML wipe removes it from the shadow DOM
    if (this._presence.video) {
      this._presence.video.style.cssText = "position:fixed;width:1px;height:1px;opacity:0.01;top:0;left:0;pointer-events:none;z-index:-1";
      this.shadowRoot.appendChild(this._presence.video);
    }

    this.updateClock();
    this.bindEvents();
    if (this._tab === "toon") setTimeout(() => this.updateCamera(), 80);
    this._restoreScroll();
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
      btn.addEventListener("click", () => this.selectTab(btn.dataset.tab)));

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

    this.shadowRoot.querySelectorAll("[data-color-target]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        this.setLightColor(btn.dataset.colorTarget, btn.dataset.hue, btn.dataset.sat);
      });
    });

    this.shadowRoot.querySelectorAll("[data-color-picker]").forEach(input => {
      const keepPickerOpen = () => {
        this._colorPickerOpenUntil = Date.now() + 12000;
        clearTimeout(this._renderDebounce);
      };
      ["pointerdown","touchstart","mousedown","click","focus","input"].forEach(evt =>
        input.addEventListener(evt, e => {
          e.stopPropagation();
          keepPickerOpen();
        }, { passive: evt === "touchstart" })
      );
      input.addEventListener("click", e => e.stopPropagation());
      input.addEventListener("change", e => {
        e.stopPropagation();
        this._colorPickerOpenUntil = Date.now() + 1800;
        this.setLightRgb(input.dataset.colorPicker, input.value);
      });
    });

    const roomBrightnessTimers = {};
    this.shadowRoot.querySelectorAll("[data-room-brightness]").forEach(slider => {
      slider.addEventListener("pointerdown", e => e.stopPropagation());
      slider.addEventListener("click", e => e.stopPropagation());
      slider.addEventListener("input", () => {
        const target = slider.dataset.roomBrightness;
        clearTimeout(roomBrightnessTimers[target]);
        roomBrightnessTimers[target] = setTimeout(() => this.setRoomBrightness(target, slider.value), 220);
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
    this.shadowRoot.querySelector("[data-action='sleep']")?.addEventListener("click", () => {
      this._presence.lastMotion = 0; // force idle
      this._sleepScreen();
    });

    this.shadowRoot.querySelector("[data-action='forecast-retry']")?.addEventListener("click", () => {
      this._forecastLoadedAt = 0;
      this._forecast = [];
      this.loadForecast();
      this.render();
    });
    this.shadowRoot.querySelector("[data-action='worldcup-refresh']")?.addEventListener("click", () => {
      this._worldCup.loadedAt = 0;
      this.loadWorldCup(true);
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

    // Presence overlay — tap to wake; restore pointer-events after re-render
    const overlay = this.shadowRoot.querySelector("[data-action='presence-wake']");
    if (overlay) {
      overlay.style.pointerEvents = this._presence.dimmed ? "all" : "none";
      overlay.addEventListener("click", () => {
        this._presence.lastMotion = Date.now();
        this._wakeScreen();
      });
    }
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

  climateSummary(title, temp, humidity, air, pm25) {
    const { aqLbl, aqc, valHtml } = this.airStatus(air, pm25);
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
          ${valHtml}
          <div class="cl" style="color:${aqc}bb">${aqLbl} · Air</div>
          <div class="spark-wrap aq-spark">${this.sparkline(pm25, aqc)}</div>
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
    const returning = (Number.isFinite(returnW) && returnW > 0) || (isLive && powerW < 0);
    const displayW  = returning
      ? Math.abs(Number.isFinite(returnW) && returnW > 0 ? returnW : powerW)
      : powerW;
    const powerColor = returning      ? "#34d399"
      : isLive && displayW < 500  ? "#34d399"
      : isLive && displayW < 2000 ? "#fbbf24"
      : "#f87171";
    const liveLabel = returning ? "Grid return" : "Live grid";
    const liveVal   = isLive
      ? (displayW >= 1000 ? (displayW/1000).toFixed(2)+" kW" : Math.round(displayW)+" W")
      : "--";
    const priceNowRaw = Number(this.st(e.vattenfallElectricityPrice, NaN));
    const priceNow    = Number.isFinite(priceNowRaw) && priceNowRaw > 0 ? priceNowRaw : this._energyRate;
    const liveCost    = isLive && !returning ? Math.max(0, (displayW / 1000) * priceNow) : NaN;
    const liveCostTxt = returning ? "No import cost" : Number.isFinite(liveCost) ? `€${liveCost.toFixed(2)}/h` : "€--/h";
    const priceTxt    = Number.isFinite(priceNow) ? `€${priceNow.toFixed(2)}/kWh` : "€--/kWh";

    // Today kWh + cost from HA Energy stats
    const consumptionIds = this._energy.consumptionIds || [];
    const costIds        = this._energy.costIds        || [];
    const dayStats       = this._energy.stats["day"];
    let todayKwh = 0, todayCostStat = 0, hasCostStat = false;
    if (dayStats?.data) {
      for (const id of consumptionIds) {
        (dayStats.data[id] || []).forEach(b => { todayKwh += this._cleanEnergyChange(b.change, dayStats.statPeriod); });
      }
      for (const id of costIds) {
        const arr = dayStats.data[id] || [];
        arr.forEach(b => { todayCostStat += this._cleanCostChange(b.change); });
        if (arr.length) hasCostStat = true;
      }
    }
    // Chart buckets for selected period
    const period      = this._energy.period;
    const periodStats = this._energy.stats[period];
    const buckets     = this._buildEnergyBuckets(periodStats, consumptionIds);
    const periodLoading = this._energy.loadingPeriods?.has(period);
    const periodKwh = buckets.reduce((sum, b) => sum + b.kwh, 0);
    const peakKwh = buckets.length ? Math.max(...buckets.map(b => b.kwh)) : 0;
    const avgKwh = buckets.length ? periodKwh / buckets.length : 0;
    const shownKwh = period === "day" ? todayKwh : periodKwh;
    const shownCost = (period === "day" && hasCostStat) ? todayCostStat : shownKwh * priceNow;
    const periodLabel = period === "day" ? "today" : period;

    const hasEnergyConfig = consumptionIds.length > 0;
    const tabs = ["day","week","month","year"].map(p =>
      `<button class="en-tab ${p===period?"active":""} ${this._energy.loadingPeriods?.has(p) ? "loading" : ""}" data-energy-period="${p}">${p.charAt(0).toUpperCase()+p.slice(1)}</button>`
    ).join("");

    return `<section class="gl block en-section">
      <div class="en-title-row">
        <div class="slbl">Energy</div>
        <div class="en-price">${priceTxt}</div>
      </div>
      <div class="en-metrics">
        <div class="en-pill live">
          <b style="color:${powerColor}">${liveVal}</b>
          <span>${liveLabel} · ${liveCostTxt}</span>
        </div>
        <div class="en-pill total">
          <b>${shownKwh > 0 ? shownKwh.toFixed(2) : "--"}<small> kWh</small> <em>${shownKwh > 0 ? "€"+shownCost.toFixed(2) : "€--"}</em></b>
          <span>${periodLabel} usage · spent</span>
        </div>
      </div>
      <div class="spark-wrap en-live-spark">${this.sparkline(e.p1Power, powerColor)}</div>
      ${hasEnergyConfig ? `<div class="en-tabs">${tabs}</div>
      <div class="en-chart">${buckets.length ? this._energyBars(buckets) : `<div class="en-loading">${periodLoading ? "Loading…" : "No usage data yet"}</div>`}</div>
      <div class="en-foot">
        <span>Avg ${avgKwh > 0 ? avgKwh.toFixed(2) : "--"} kWh</span>
        <span>Peak ${peakKwh > 0 ? peakKwh.toFixed(2) : "--"} kWh</span>
      </div>` : ""}
    </section>`;
  }

  _buildEnergyBuckets(periodStats, consumptionIds) {
    if (!periodStats?.data || !consumptionIds?.length) return [];
    const map = {};
    for (const id of consumptionIds) {
      (periodStats.data[id] || []).forEach(entry => {
        const key = this._bucketTime(entry.start);
        const kwh = this._cleanEnergyChange(entry.change, periodStats.statPeriod);
        if (!key || kwh <= 0) return;
        if (!map[key]) map[key] = { start: key, kwh: 0 };
        map[key].kwh += kwh;
      });
    }
    return Object.values(map).sort((a,b) => this._bucketTime(a.start) - this._bucketTime(b.start));
  }

  _cleanEnergyChange(value, statPeriod = "hour") {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return 0;
    const caps = { hour: 80, day: 300, month: 8000 };
    const cap = caps[statPeriod] || 300;
    return num <= cap ? num : 0;
  }

  _cleanCostChange(value) {
    const num = Number(value);
    return Number.isFinite(num) && num > 0 && num < 1000 ? num : 0;
  }

  _bucketTime(value) {
    if (typeof value === "number") return value < 1000000000000 ? value * 1000 : value;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  _bucketHourKey(value) {
    const t = this._bucketTime(value);
    return t ? new Date(t).toISOString().slice(0, 13) : "";
  }

  _bucketLabel(dt, period) {
    const d = new Date(this._bucketTime(dt));
    const h = d.getHours();
    if (period === "day")   return h % 6 === 0 ? d.toLocaleTimeString([], { hour: "2-digit", hour12: false }).replace(":00", "") : "";
    if (period === "week")  return d.toLocaleDateString([], { weekday: "short" });
    if (period === "month") { const day = d.getDate(); return (day === 1 || day % 5 === 0) ? String(day) : ""; }
    return d.toLocaleDateString([], { month: "short" });
  }

  _energyBars(buckets) {
    if (!buckets.length) return "";
    const maxV = this._robustEnergyMax(buckets.map(b => b.kwh));
    const clean = buckets.map(b => b.kwh).filter(v => Number.isFinite(v) && v > 0);
    const minV = clean.length > 3 ? Math.min(...clean) : 0;
    const spread = Math.max(maxV - minV, maxV * 0.2, 0.001);
    const W = 280, H = 54;
    const n = buckets.length;
    const step = W / n;
    const barW = Math.max(1.5, step * 0.72);
    const nowIso = new Date().toISOString().slice(0, 13);
    const bars = buckets.map((b, i) => {
      const norm = Math.max(0, Math.min(1, (Math.min(b.kwh, maxV) - minV) / spread));
      const bh  = Math.max(5, 10 + norm * (H - 10));
      const x   = i * step + (step - barW) / 2;
      const y   = H - bh;
      const cur = this._bucketHourKey(b.start) === nowIso || i === buckets.length - 1;
      const fill = cur ? "rgba(251,191,36,.95)" : "rgba(167,139,250,.52)";
      const outlier = b.kwh > maxV;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="2" fill="${fill}"/>` +
        (outlier ? `<circle cx="${(x+barW/2).toFixed(1)}" cy="3" r="1.6" fill="rgba(251,191,36,.95)"/>` : "");
    }).join("");
    const labels = buckets.map(b => `<span>${this._bucketLabel(b.start, this._energy.period)}</span>`).join("");
    return `<div class="en-bar-stack"><svg class="en-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${bars}</svg><div class="en-axis">${labels}</div></div>`;
  }

  _robustEnergyMax(values) {
    const clean = values.filter(v => Number.isFinite(v) && v > 0).sort((a,b) => a-b);
    if (!clean.length) return 0.001;
    if (clean.length < 5) return Math.max(...clean, 0.001);
    const q = p => clean[Math.min(clean.length - 1, Math.floor((clean.length - 1) * p))];
    const iqr = Math.max(q(.75) - q(.25), 0);
    const fence = iqr > 0 ? q(.75) + 1.5 * iqr : q(.95);
    let maxNormal = 0;
    for (const value of clean) {
      if (value <= fence) maxNormal = value;
    }
    return Math.max(maxNormal || q(.95), 0.001);
  }

  teslaClimateState(climOn, targetTemp) {
    const cabin = Number(this.st(this.entities.teslaInsideTemp, NaN));
    const cabinText = Number.isFinite(cabin) ? `${cabin.toFixed(1)}°C` : "--°C";
    if (!climOn) {
      return {
        mode: "off",
        label: "Climate",
        icon: "mdi:fan",
        detail: `Off · Cabin ${cabinText}`,
        rowLabel: "Climate",
        active: false,
      };
    }
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
      detail: `On · Cabin ${cabinText}`,
      rowLabel: "Climate active",
      active: true,
    };
  }

  teslaChargeInfo() {
    const e = this.entities;
    const state = String(this.st(e.teslaChargeState, "unknown")).toLowerCase();
    const cable = this.isOn(e.teslaChargeCable);
    const chargeSwitch = this.isOn(e.teslaChargeSwitch);
    const rateNum = Number(this.st(e.teslaChargeRate, NaN));
    const powerNum = Number(this.st(e.teslaChargePower, NaN));
    const active = state === "charging" || (Number.isFinite(rateNum) && rateNum > 0) || (Number.isFinite(powerNum) && powerNum > 0);
    const plugged = cable || ["starting","charging","stopped","complete","no_power"].includes(state);
    const stateLabel = active ? "Charging"
      : state === "no_power" ? "Plugged · no power"
      : state === "stopped" || (plugged && !chargeSwitch) ? "Plugged · paused"
      : state === "complete" ? "Charge complete"
      : state === "starting" ? "Starting"
      : plugged ? "Plugged in" : "Not plugged in";
    const rate = Number.isFinite(rateNum) ? `${Math.round(rateNum)} km/h` : "-- km/h";
    const power = Number.isFinite(powerNum) ? `${powerNum.toFixed(powerNum >= 10 ? 0 : 1)} kW` : "-- kW";
    const time = this.formatChargeTime(e.teslaChargeTime);
    return {
      active,
      plugged,
      state,
      stateLabel,
      rate,
      power,
      time,
      timeShort: time.split(" · ")[0] || time,
    };
  }

  teslaBatteryPercent(rawPct) {
    const raw = Number(rawPct);
    return Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0;
  }

  teslaBatteryDisplay(pct, charge) {
    const value = Math.max(0, Math.min(100, Number(pct) || 0));
    return charge?.active ? value.toFixed(1) : String(Math.round(value));
  }

  formatChargeTime(entity) {
    const raw = this.st(entity, "");
    if (!raw || raw === "unavailable" || raw === "unknown" || raw === "--") return "--";
    const ts = Date.parse(raw);
    if (!Number.isFinite(ts)) return String(raw);
    const mins = Math.max(0, Math.round((ts - Date.now()) / 60000));
    if (mins <= 0) return "Now";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const at = new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return h ? `${h}h ${m}m · ${at}` : `${m}m · ${at}`;
  }

  teslaCard(pct, range, place, climOn, targetTemp, charge) {
    const battColor = pct > 50 ? "#34d399" : pct > 20 ? "#fbbf24" : "#f87171";
    const clim = this.teslaClimateState(climOn, targetTemp);
    const sentryOn = this.isOn(this.entities.teslaSentry);
    const chargeClass = charge?.active ? "charging" : charge?.plugged ? "plugged" : "";
    const tag = charge?.active ? "Charging" : charge?.plugged ? "Plugged in" : (place || "Away");
    const phase = -((Date.now() % 3000) / 1000).toFixed(2);
    return `<section class="gl tc ${chargeClass}" style="--charge-phase:${phase}s">
      <div class="tc-hero">
        <div class="tc-top">
          <div>
            <div class="tc-name">Model 3</div>
            <div class="tc-sub">Tesla</div>
          </div>
          <div class="tag">${tag}</div>
        </div>
        <div class="tc-img-wrap">
          <div class="tc-glow"></div>
          <img class="tc-car" src="https://teslakortingscode.com/ha/tesla-model-3-with-toon-final.png" alt="Model 3 with Toon" draggable="false">
        </div>
      </div>
      <div class="tc-stats">
        <div class="tc-batt-row">
          <div class="tc-pct" style="color:${battColor}">${this.teslaBatteryDisplay(pct, charge)}<span>%</span></div>
          <div class="tc-range">${range}</div>
        </div>
        <div class="tc-bar"><div class="tc-fill" style="width:${pct}%;background:${battColor}"></div></div>
        ${charge?.active ? `<div class="tc-charge charging">
          <div class="tc-charge-head">
            <div class="tc-charge-title">
              <ha-icon icon="mdi:lightning-bolt"></ha-icon>
              <span>${charge.stateLabel || "Charging"}</span>
            </div>
            <div class="tc-charge-time">${charge.time || "--"}</div>
          </div>
          <div class="tc-charge-grid">
            <div><b>${charge.timeShort || "--"}</b><span>to 100%</span></div>
            <div><b>${charge.power || "-- kW"}</b><span>power</span></div>
          </div>
          <div class="tc-charge-track"><span></span><span></span><span></span></div>
        </div>` : ""}
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

  pulseSection() {
    const e = this.entities;
    const lightsOn = this.countOn([...e.mainLights, ...e.bedroomLights, ...e.gameLights, ...e.utilityLights]);
    const livingAir = this.airStatus(e.livingAir, e.livingPm25);
    const bedAir = this.airStatus(e.bedAir, e.bedPm25);
    const bestAir = [livingAir, bedAir].every(a => a.aqLbl === "Good") ? "Good" : `${livingAir.aqLbl} / ${bedAir.aqLbl}`;
    const feederActive = this.anyOn(e.toonDevices);
    return `<section class="gl pulse-card">
      <div class="slbl">Home pulse</div>
      <div class="pulse-grid">
        <div class="pulse-item"><ha-icon icon="mdi:lightbulb-group-outline"></ha-icon><b>${lightsOn}</b><span>lights on</span></div>
        <div class="pulse-item"><ha-icon icon="mdi:food-drumstick-outline"></ha-icon><b>${feederActive ? "Active" : "Standby"}</b><span>pet feeder</span></div>
        <div class="pulse-item"><ha-icon icon="mdi:download-network-outline"></ha-icon><b>${this.formatRate(e.archerDown)}</b><span>internet</span></div>
        <div class="pulse-item"><ha-icon icon="mdi:blur"></ha-icon><b>${bestAir}</b><span>air quality</span></div>
      </div>
    </section>`;
  }

  weatherSection(state, temp, humidity, wind, feels, uv, vis) {
    // Per-condition accent colours for icon and glass tint
    const condAccent = {
      sunny:         { bg:"rgba(251,191,36,.16)",  border:"rgba(251,191,36,.26)",  ico:"#fbbf24" },
      "clear-night": { bg:"rgba(99,102,241,.16)",  border:"rgba(99,102,241,.26)",  ico:"#818cf8" },
      clear:         { bg:"rgba(99,102,241,.14)",  border:"rgba(99,102,241,.22)",  ico:"#818cf8" },
      "partlycloudy-night": { bg:"rgba(79,70,229,.14)", border:"rgba(129,140,248,.22)", ico:"#a5b4fc" },
      partlycloudy:  { bg:"rgba(148,163,184,.11)", border:"rgba(148,163,184,.18)", ico:"rgba(255,255,255,.62)" },
      cloudy:        { bg:"rgba(100,116,139,.14)", border:"rgba(100,116,139,.2)",  ico:"rgba(255,255,255,.5)" },
      rainy:         { bg:"rgba(59,130,246,.16)",  border:"rgba(59,130,246,.26)",  ico:"#60a5fa" },
      pouring:       { bg:"rgba(37,99,235,.2)",    border:"rgba(37,99,235,.32)",   ico:"#3b82f6" },
      snowy:         { bg:"rgba(186,230,253,.14)", border:"rgba(186,230,253,.22)", ico:"#bae6fd" },
      fog:           { bg:"rgba(148,163,184,.12)", border:"rgba(148,163,184,.18)", ico:"rgba(255,255,255,.45)" },
      windy:         { bg:"rgba(167,139,250,.14)", border:"rgba(167,139,250,.24)", ico:"#a78bfa" },
      hail:          { bg:"rgba(100,116,139,.14)", border:"rgba(100,116,139,.2)",  ico:"rgba(255,255,255,.55)" },
      lightning:     { bg:"rgba(88,28,135,.2)",    border:"rgba(250,204,21,.26)",  ico:"#fde047" },
      "lightning-rainy": { bg:"rgba(30,64,175,.22)", border:"rgba(250,204,21,.28)", ico:"#fde047" },
    };
    const displayState = this.displayWeatherState(state);
    const acc = condAccent[displayState] || condAccent.partlycloudy;
    const mood = `wx-${String(displayState || "partlycloudy").replace(/[^a-z0-9-]/gi,"")}`;

    const days = (this._forecast||[]).slice(0,5);
    const forecastHTML = days.length
      ? this.weatherForecastGraph(days, state, condAccent)
      : `<div class="wx-nof"><span>${this._forecastLoading ? "Loading forecast…" : "Forecast unavailable"}</span>${!this._forecastLoading ? `<button class="wx-retry" data-action="forecast-retry"><ha-icon icon="mdi:refresh"></ha-icon> Retry</button>` : ""}</div>`;

    const extras = [
      feels!=null ? {icon:"mdi:thermometer-lines",  val:`${Math.round(feels)}°`, lbl:"Feels like"} : null,
      uv!=null    ? {icon:"mdi:white-balance-sunny", val:String(uv),              lbl:"UV index"}   : null,
      vis!=null   ? {icon:"mdi:eye-outline",         val:`${Math.round(vis)} km`, lbl:"Visibility"} : null,
    ].filter(Boolean);

    return `<section class="gl wx-big ${mood}" style="background:${acc.bg};border-color:${acc.border}">
      <div class="wx-sky"><span></span><span></span><span></span></div>
      <div class="slbl" style="color:rgba(255,255,255,.42)">Weather · Outside</div>
      <div class="wx-hero">
        <div class="wx-hero-left">
          <ha-icon class="wx-ico-big" icon="${this.weatherIcon(displayState)}" style="color:${acc.ico}"></ha-icon>
          <div>
            <div class="wx-tmp-big">${temp}<span>°C</span></div>
            <div class="wx-cond-big">${this.weatherLabel(displayState)}</div>
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

  weatherForecastGraph(days, fallbackState, condAccent) {
    const parsed = days.map(d => {
      const dt = new Date(d.datetime);
      const hi = Number(d.temperature);
      const lo = d.templow != null ? Number(d.templow) : hi - 4;
      return {
        label: dt.toLocaleDateString([], { weekday: "short" }),
        hi: Number.isFinite(hi) ? Math.round(hi) : null,
        lo: Number.isFinite(lo) ? Math.round(lo) : null,
        cond: d.condition || fallbackState,
        precip: d.precipitation_probability != null ? Math.round(d.precipitation_probability) : null,
      };
    }).filter(d => d.hi != null && d.lo != null);

    if (!parsed.length) return "";

    const W = 500, H = 76, top = 12, bottom = 64;
    const temps = parsed.flatMap(d => [d.hi, d.lo]);
    const minT = Math.min(...temps);
    const maxT = Math.max(...temps);
    const tempPad = Math.max(2, (maxT - minT) * 0.18);
    const loScale = minT - tempPad;
    const hiScale = maxT + tempPad;
    const rng = Math.max(1, hiScale - loScale);
    const x = i => parsed.length === 1 ? W / 2 : 42 + i * ((W - 84) / (parsed.length - 1));
    const y = v => bottom - ((v - loScale) / rng) * (bottom - top);
    const hiPts = parsed.map((d, i) => [x(i), y(d.hi), d.hi]);
    const loPts = parsed.map((d, i) => [x(i), y(d.lo), d.lo]);
    const path = pts => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    const bandPath = `${path(hiPts)} ${loPts.slice().reverse().map(p => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")} Z`;
    const segments = hiPts.slice(0, -1).map((p, i) => {
      const n = hiPts[i + 1];
      const delta = parsed[i + 1].hi - parsed[i].hi;
      const color = delta > 0 ? "#f59e0b" : delta < 0 ? "#60a5fa" : "#a78bfa";
      return `<path d="M${p[0].toFixed(1)},${p[1].toFixed(1)} L${n[0].toFixed(1)},${n[1].toFixed(1)}" stroke="${color}" stroke-width="3.2" stroke-linecap="round"/>`;
    }).join("");
    const lowSegments = loPts.slice(0, -1).map((p, i) => {
      const n = loPts[i + 1];
      const delta = parsed[i + 1].lo - parsed[i].lo;
      const color = delta > 0 ? "rgba(251,191,36,.78)" : delta < 0 ? "rgba(96,165,250,.78)" : "rgba(167,139,250,.68)";
      return `<path d="M${p[0].toFixed(1)},${p[1].toFixed(1)} L${n[0].toFixed(1)},${n[1].toFixed(1)}" stroke="${color}" stroke-width="2.1" stroke-linecap="round" stroke-dasharray="3 6"/>`;
    }).join("");
    const dayGuides = parsed.map((_, i) => {
      const gx = x(i);
      return `<path d="M${gx.toFixed(1)},${top} L${gx.toFixed(1)},${bottom}" stroke="rgba(255,255,255,.07)" stroke-width="1"/>`;
    }).join("");
    const points = parsed.map((d, i) => {
      const hx = hiPts[i][0], hy = hiPts[i][1], lx = loPts[i][0], ly = loPts[i][1];
      return `<div class="wx-dot hi" style="left:${(hx / W * 100).toFixed(2)}%;top:${(34 + hy).toFixed(1)}px"></div>
        <div class="wx-dot lo" style="left:${(lx / W * 100).toFixed(2)}%;top:${(34 + ly).toFixed(1)}px"></div>`;
    }).join("");
    // SVG is positioned at top:34px inside .wx-graph; viewBox H=76 maps 1:1 to 76px
    const tempLabels = parsed.map((d, i) => {
      const left = (x(i) / W * 100).toFixed(2);
      const hiTop = (34 + hiPts[i][1] - 18).toFixed(1); // above hi dot
      const loTop = (34 + loPts[i][1] + 5).toFixed(1);  // below lo dot
      return `<div class="wx-temp-label hi" style="left:${left}%;top:${hiTop}px">${d.hi}°</div>
        <div class="wx-temp-label lo" style="left:${left}%;top:${loTop}px">${d.lo}°</div>`;
    }).join("");
    const dayNodes = parsed.map((d, i) => {
      const ca = condAccent[d.cond] || condAccent.partlycloudy;
      return `<div class="wxg-day" style="left:${(x(i) / W * 100).toFixed(2)}%">
        <div class="wxg-label">${d.label}</div>
        <ha-icon class="wxg-icon" icon="${this.weatherIcon(d.cond)}" style="color:${ca.ico}"></ha-icon>
        ${d.precip != null ? `<div class="wxg-rain">${d.precip}%</div>` : ""}
      </div>`;
    }).join("");

    return `<div class="wx-graph">
      <div class="wxg-days">${dayNodes}</div>
      <svg class="wxg-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wxBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(251,191,36,.24)"/>
            <stop offset="100%" stop-color="rgba(96,165,250,.12)"/>
          </linearGradient>
        </defs>
        <path d="M28,${top} L${W-28},${top}" stroke="rgba(255,255,255,.055)" stroke-width="1"/>
        <path d="M28,${(top + bottom) / 2} L${W-28},${(top + bottom) / 2}" stroke="rgba(255,255,255,.045)" stroke-width="1"/>
        <path d="M28,${bottom} L${W-28},${bottom}" stroke="rgba(255,255,255,.055)" stroke-width="1"/>
        ${dayGuides}
        <path d="${bandPath}" fill="url(#wxBand)"/>
        ${lowSegments}
        ${segments}
      </svg>
      ${points}
      ${tempLabels}
    </div>`;
  }

  lightItem(entity) {
    const name = (this.attr(entity,"friendly_name",null) || entity.split(".")[1]?.replace(/_/g," ") || entity);
    const available = this.isAvailable(entity);
    const on   = this.isOn(entity);
    const isLt = entity.startsWith("light.");
    const canColor = available && this.supportsColor(entity);
    const braw = isLt ? this.attr(entity,"brightness",null) : null;
    const bPct = braw !== null ? Math.max(1, Math.round(braw / 255 * 100)) : (on ? 100 : null);
    const icon = isLt ? (on?"mdi:lightbulb":"mdi:lightbulb-outline")
               : entity.includes("feeder") ? "mdi:food-drumstick-outline"
               : "mdi:toggle-switch-outline";
    return `<div class="light-item ${on?"on":""} ${available?"":"unavailable"}">
      <button class="li-toggle" data-entity="${entity}">
        <div class="li-left">
          <ha-icon class="li-ico" icon="${icon}"></ha-icon>
          <div>
            <div class="li-name">${name}</div>
            <div class="li-sub">${available ? (on?(bPct!=null?bPct+"%":"On"):"Off") : "Unavailable"}</div>
          </div>
        </div>
        <div class="lisw"></div>
      </button>
      ${on && bPct !== null ? `<div class="li-slider-wrap">
        <ha-icon icon="mdi:brightness-4" style="--mdc-icon-size:12px;opacity:.35;color:#fff;flex-shrink:0"></ha-icon>
        <input type="range" class="li-slider" min="1" max="100" value="${bPct}" data-brightness-entity="${entity}">
        <ha-icon icon="mdi:brightness-7" style="--mdc-icon-size:12px;opacity:.7;color:#fff;flex-shrink:0"></ha-icon>
      </div>` : ""}
      ${canColor ? `<div class="li-color-wrap">${this.colorSwatches(entity, true)}</div>` : ""}
    </div>`;
  }

  climateDetail(temp, humidity, air, pm25) {
    const { aqLbl, aqc, valHtml } = this.airStatus(air, pm25);
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
          ${valHtml}
          <div class="cl" style="color:${aqc}bb">${aqLbl} · Air</div>
          <div class="spark-wrap aq-spark">${this.sparkline(pm25, aqc)}</div>
        </div>
      </div>
    </section>`;
  }

  roomPalette(entities) {
    const targets = this.colorCapable(entities);
    const lights = this.roomLightTargets(entities);
    if (!targets.length && !lights.length) return "";
    const avgBrightness = lights.length
      ? Math.round(lights.reduce((sum, entity) => {
          const b = Number(this.attr(entity, "brightness", this.isOn(entity) ? 255 : 0));
          return sum + (Number.isFinite(b) ? b : 0);
        }, 0) / lights.length / 255 * 100)
      : 0;
    return `<div class="room-palette">
      <div class="room-bright">
        <div class="rp-palette-label">Room brightness</div>
        <input type="range" class="room-slider" min="1" max="100" value="${Math.max(1, avgBrightness || 65)}" data-room-brightness="${lights.join(",")}">
      </div>
      ${targets.length ? `<div class="room-colors"><div class="rp-palette-label">Room colour</div>${this.colorSwatches(targets.join(","))}</div>` : ""}
    </div>`;
  }

  utilityNetwork() {
    const e = this.entities;
    const wan = this.isOn(e.archerWan);
    return `<section class="gl block net-card">
      <div class="slbl">Archer · Wi-Fi speed</div>
      <div class="net-head">
        <div class="net-status ${wan ? "on" : ""}"><span></span>${wan ? "WAN online" : "WAN offline"}</div>
      </div>
      <div class="net-grid">
        <div class="net-metric">
          <ha-icon icon="mdi:download"></ha-icon>
          <div><b>${this.formatRate(e.archerDown)}</b><span>Download</span></div>
          <div class="spark-wrap">${this.sparkline(e.archerDown, "rgba(96,165,250,.9)")}</div>
        </div>
        <div class="net-metric">
          <ha-icon icon="mdi:upload"></ha-icon>
          <div><b>${this.formatRate(e.archerUp)}</b><span>Upload</span></div>
          <div class="spark-wrap">${this.sparkline(e.archerUp, "rgba(52,211,153,.9)")}</div>
        </div>
      </div>
    </section>`;
  }

  personalPage() {
    return `<div class="page ${this._tab==="me"?"active":""} z1">
      <div class="g2 personal-grid">
        <div class="col">
          ${this.agendaSection()}
        </div>
        <div class="col">
          ${this.fitSection()}
          ${this.stocksSection()}
        </div>
      </div>
    </div>`;
  }

  worldCupPage() {
    const featured = this._worldCup.featured;
    const groups = this._worldCup.groups || [];
    const matches = this._worldCup.matches || [];
    return `<div class="page ${this._tab==="wc"?"active":""} z1">
      <div class="g2 personal-grid">
        <div class="col">
          <section class="gl wc-card wc-hero">
            <div class="wc-head">
              <div>
                <div class="slbl" style="margin:0">2026 FIFA World Cup</div>
                <div class="wc-title">${featured?.state === "in" ? "Live Now" : "Match Centre"}</div>
                <div class="wc-sub">${featured?.status || (this._worldCup.loading ? "Refreshing live data…" : "Live matches, scores, and group tables")}</div>
              </div>
              <button class="wc-refresh" data-action="worldcup-refresh" title="Refresh World Cup data">
                <ha-icon icon="mdi:refresh"></ha-icon>
              </button>
            </div>
            ${featured ? this.worldCupFeatured(featured) : `<div class="personal-empty compact"><ha-icon icon="mdi:soccer"></ha-icon><b>No World Cup match selected</b><span>${this._worldCup.loading ? "Loading the latest tournament feed…" : this.esc(this._worldCup.error || "Live match data is not available right now.")}</span></div>`}
          </section>
          <section class="gl wc-card">
            <div class="slbl">Matches</div>
            <div class="wc-match-list">
              ${matches.length
                ? matches.map(match => this.worldCupMatchRow(match)).join("")
                : `<div class="personal-empty compact"><ha-icon icon="mdi:calendar-clock-outline"></ha-icon><b>No fixtures loaded</b><span>${this._worldCup.loading ? "Fetching today's schedule…" : this.esc(this._worldCup.error || "Try refreshing again in a moment.")}</span></div>`}
            </div>
          </section>
        </div>
        <div class="col">
          <section class="gl wc-card">
            <div class="slbl">Group Tables</div>
            <div class="wc-groups">
              ${groups.length
                ? groups.map(group => this.worldCupGroup(group)).join("")
                : `<div class="personal-empty compact"><ha-icon icon="mdi:table-large"></ha-icon><b>Standings unavailable</b><span>${this._worldCup.loading ? "Loading group standings…" : this.esc(this._worldCup.error || "The standings feed did not respond.")}</span></div>`}
            </div>
          </section>
        </div>
      </div>
    </div>`;
  }

  worldCupFeatured(match) {
    const stats = Array.isArray(match?.stats) ? match.stats.slice(0, 6) : [];
    const home = match?.teams?.find(t => t.side === "home") || match?.teams?.[0];
    const away = match?.teams?.find(t => t.side === "away") || match?.teams?.[1];
    const stream = match?.stream;
    return `<div class="wc-featured">
      <div class="wc-scoreline">
        <div class="wc-team">
          ${home?.logo ? `<img class="wc-logo" src="${home.logo}" alt="${this.esc(home.name)}">` : `<div class="wc-logo ph">${this.esc((home?.short || "?").slice(0, 3))}</div>`}
          <div class="wc-team-name">${this.esc(home?.name || "--")}</div>
        </div>
        <div class="wc-score-mid">
          <div class="wc-score">${this.wcScore(match, "home")}<span>:</span>${this.wcScore(match, "away")}</div>
          <div class="wc-status ${match?.state === "in" ? "live" : ""}">${this.esc(this.wcStatusLabel(match))}</div>
        </div>
        <div class="wc-team right">
          ${away?.logo ? `<img class="wc-logo" src="${away.logo}" alt="${this.esc(away.name)}">` : `<div class="wc-logo ph">${this.esc((away?.short || "?").slice(0, 3))}</div>`}
          <div class="wc-team-name">${this.esc(away?.name || "--")}</div>
        </div>
      </div>
      <div class="wc-meta">
        <div><b>${this.esc(match?.phase || "World Cup")}</b><span>Stage</span></div>
        <div><b>${this.esc(match?.venue || "Venue TBC")}</b><span>Venue</span></div>
        <div><b>${this.esc(match?.status || "Scheduled")}</b><span>Match status</span></div>
      </div>
      ${match?.state === "in" ? `
        <div class="wc-video-card">
          <div class="wc-video-head">
            <div>
              <div class="wc-video-title">Live match stream</div>
              <div class="wc-video-sub">${this.esc(stream?.provider || "NOS")} ${stream?.title ? `· ${this.esc(stream.title)}` : ""}</div>
            </div>
            ${stream?.pageUrl ? `<a class="wc-watch-link" href="${stream.pageUrl}" target="_blank" rel="noreferrer">Open NOS</a>` : ""}
          </div>
          ${stream?.hlsUrl ? `
            <video class="wc-video" src="${stream.hlsUrl}" controls playsinline muted preload="metadata"></video>
            <div class="wc-video-note">Live stream availability depends on official Dutch rights and your current location in the Netherlands.</div>
          ` : `
            <div class="wc-empty-note">The official NOS stream page is available, but the direct video stream was not exposed yet. Use the NOS button to watch live.</div>
          `}
        </div>
      ` : ""}
      ${stats.length ? `<div class="wc-stats">${stats.map(stat => `
        <div class="wc-stat">
          <ha-icon icon="${this.wcStatIcon(stat.label)}"></ha-icon>
          <b>${this.esc(stat.home)}<span>${this.esc(stat.label)}</span>${this.esc(stat.away)}</b>
        </div>
      `).join("")}</div>` : `<div class="wc-empty-note">${match?.state === "in" ? "Live stats will appear as the match feed updates." : "Detailed match stats appear automatically once ESPN publishes them for a live game."}</div>`}
    </div>`;
  }

  worldCupMatchRow(match) {
    return `<div class="wc-row ${match?.state === "in" ? "live" : ""}">
      <div class="wc-row-teams">
        <div class="wc-row-team">${this.esc(this.wcTeam(match, "home"))}</div>
        <div class="wc-row-team">${this.esc(this.wcTeam(match, "away"))}</div>
      </div>
      <div class="wc-row-score">
        <b>${this.wcScore(match, "home")} - ${this.wcScore(match, "away")}</b>
        <span>${this.esc(this.wcStatusLabel(match))}</span>
      </div>
    </div>`;
  }

  worldCupGroup(group) {
    return `<section class="wc-group">
      <div class="wc-group-name">${this.esc(group?.name || "Group")}</div>
      <div class="wc-table">
        <div class="wc-table-head">
          <span>Team</span><span>P</span><span>GD</span><span>Pts</span>
        </div>
        ${(group?.entries || []).map(team => `
          <div class="wc-table-row">
            <span class="team">${this.esc(team.team || "--")}</span>
            <span>${this.esc(team.played ?? "-")}</span>
            <span>${this.esc(team.gd ?? "-")}</span>
            <span class="pts">${this.esc(team.points ?? "-")}</span>
          </div>
        `).join("")}
      </div>
    </section>`;
  }

  agendaSection() {
    const calendars = this.calendarEntities();
    const events = this._agenda.events || [];
    const body = calendars.length
      ? events.length
        ? `<div class="agenda-list">${events.map(event => this.agendaItem(event)).join("")}</div>`
        : `<div class="personal-empty"><ha-icon icon="mdi:calendar-check-outline"></ha-icon><b>${this._agenda.loading ? "Loading agenda" : "No agenda items"}</b><span>${this._agenda.loading ? "Checking Google Calendar..." : "Nothing scheduled in the next 7 days."}</span></div>`
      : `<div class="personal-empty"><ha-icon icon="mdi:calendar-plus"></ha-icon><b>Google Calendar not connected</b><span>Add the Google Calendar integration in Home Assistant; this tab will fill itself automatically.</span></div>`;
    return `<section class="gl block personal-card agenda-card">
      <div class="slbl">Google Calendar · Agenda</div>
      ${body}
    </section>`;
  }

  agendaItem(event) {
    const start = event.start?.dateTime || event.start?.date || event.start;
    const allDay = Boolean(event.start?.date && !event.start?.dateTime);
    const dt = start ? new Date(start) : null;
    const valid = dt && Number.isFinite(dt.getTime());
    const day = valid ? this.relativeDay(dt) : "--";
    const time = valid && !allDay
      ? dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" })
      : "All day";
    return `<div class="agenda-item">
      <div class="agenda-time"><b>${this.esc(time)}</b><span>${this.esc(day)}</span></div>
      <div class="agenda-main">
        <b>${this.esc(event.summary || event.title || "Calendar item")}</b>
        <span>${this.esc(this.entityName(event.calendar || ""))}</span>
      </div>
    </div>`;
  }

  relativeDay(date) {
    const now = new Date();
    const local = d => new Date(d.toLocaleDateString("en-US", { timeZone: "Europe/Amsterdam" }));
    const diff = Math.round((local(date) - local(now)) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return date.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Amsterdam" });
  }

  fitSection() {
    const entities = this.fitEntities();
    const body = entities.length
      ? `<div class="personal-metrics">${entities.map((entity, idx) => this.personalMetric(entity, this.fitIcon(entity), idx)).join("")}</div>`
      : `<div class="personal-empty compact"><ha-icon icon="mdi:heart-pulse"></ha-icon><b>Google Fit not connected</b><span>Expose steps, calories, sleep, or heart-rate sensors in Home Assistant.</span></div>`;
    return `<section class="gl block personal-card">
      <div class="slbl">Google Fit</div>
      ${body}
    </section>`;
  }

  stocksSection() {
    const entities = this.stockEntities();
    const body = entities.length
      ? `<div class="personal-metrics stocks">${entities.map((entity, idx) => this.personalMetric(entity, "mdi:chart-line", idx)).join("")}</div>`
      : `<div class="personal-empty compact"><ha-icon icon="mdi:chart-areaspline"></ha-icon><b>eToro stocks not connected</b><span>Add portfolio or stock price sensors in Home Assistant and they will appear here.</span></div>`;
    return `<section class="gl block personal-card">
      <div class="slbl">Stocks · eToro</div>
      ${body}
    </section>`;
  }

  fitIcon(entity) {
    const text = `${entity} ${this.entityName(entity)}`.toLowerCase();
    if (text.includes("step")) return "mdi:shoe-print";
    if (text.includes("calor")) return "mdi:fire";
    if (text.includes("heart")) return "mdi:heart-pulse";
    if (text.includes("sleep")) return "mdi:sleep";
    if (text.includes("distance")) return "mdi:map-marker-distance";
    if (text.includes("weight")) return "mdi:scale-bathroom";
    return "mdi:google-fit";
  }

  personalMetric(entity, icon, idx = 0) {
    const raw = this.st(entity, "--");
    const n = Number(raw);
    const unit = this.attr(entity, "unit_of_measurement", "");
    const value = Number.isFinite(n) ? (Math.abs(n) >= 100 ? Math.round(n).toLocaleString() : n.toFixed(Math.abs(n) >= 10 ? 1 : 2)) : raw;
    return `<div class="personal-metric m${idx % 4}">
      <ha-icon icon="${icon}"></ha-icon>
      <div><b>${this.esc(value)}${unit ? `<small> ${this.esc(unit)}</small>` : ""}</b><span>${this.esc(this.entityName(entity))}</span></div>
    </div>`;
  }

  roomPage(id, title, sub, entities, temp, humidity, air, pm25) {
    const rk = id==="liv"?"main":id==="bed"?"bedroom":id==="game"?"game":"utility";
    const sideContent = temp
      ? `<div class="col">${this.climateDetail(temp,humidity,air,pm25)}</div>`
      : id === "util"
        ? `<div class="col">${this.utilityNetwork()}${this.sceneList(title)}</div>`
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
            ${this.roomPalette(entities)}
          </section>
          <section class="gl block">
            <div class="slbl">Lights</div>
            <div class="light-list">${entities.map(en=>this.lightItem(en)).join("")}</div>
          </section>
        </div>
        ${sideContent}
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
.dash{width:100%;height:100dvh;min-height:100vh;max-width:none;border-radius:0;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",system-ui,sans-serif;position:relative;background:#060818;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.bg{position:fixed;top:-4vh;right:-4vw;bottom:-4vh;left:-4vw;pointer-events:none;transform:scale(1.02);transform-origin:center center;will-change:transform}
.bg.night{background:radial-gradient(ellipse 80% 60% at 15% 85%,rgba(0,180,255,.42),transparent 55%),radial-gradient(ellipse 60% 50% at 80% 10%,rgba(130,60,255,.38),transparent 55%),radial-gradient(ellipse 50% 40% at 50% 50%,rgba(30,10,80,.8),transparent 70%),linear-gradient(160deg,#06091c 0%,#0b0630 40%,#050c1e 100%)}
.bg.night::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 30% 20% at 10% 70%,rgba(0,220,255,.22),transparent 50%)}
.bg.day{background-image:linear-gradient(180deg,rgba(244,251,255,.08),rgba(3,8,23,.14)),linear-gradient(160deg,rgba(9,20,44,.18),rgba(9,20,44,.34)),url("https://teslakortingscode.com/ha/daytime-bg.png");background-size:cover;background-position:center center;background-repeat:no-repeat}
.bg.day::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(9,18,38,.14),rgba(9,18,38,.24) 32%,rgba(9,18,38,.52) 100%)}
.z1{position:relative;z-index:1}

/* Glass */
.gl{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:14px}
.glsm{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-radius:10px}
.slbl{font-size:11px;font-weight:800;color:rgba(255,255,255,.44);letter-spacing:1.1px;text-transform:uppercase;margin-bottom:6px}
.block{padding:9px}

/* Topbar */
.topbar{display:flex;align-items:flex-end;justify-content:space-between;padding:max(20px,calc(env(safe-area-inset-top) - 2px)) 14px 4px;z-index:50;isolation:isolate;flex-shrink:0;min-height:56px}
.greeting-wrap{display:flex;align-items:flex-end;min-height:34px;padding-bottom:2px}
.home-lbl{font-size:24px;font-weight:800;color:rgba(255,255,255,.68);letter-spacing:1.2px;text-transform:uppercase;line-height:1}
.home-sub{font-size:11px;color:rgba(255,255,255,.38);margin-top:0}
.tabs-right{display:flex;align-items:center;gap:9px;margin-left:auto;padding-left:10px;flex-shrink:0}
.clock-wrap{text-align:right;min-width:90px}
.clk-time{font-size:38px;font-weight:200;color:rgba(255,255,255,.94);letter-spacing:-1.5px;line-height:.92}
.clk-date{font-size:13px;color:rgba(255,255,255,.54);margin-top:2px}
.fs-btn{display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12)!important;transition:all .15s,transform .08s;flex-shrink:0}
.fs-btn:hover{background:rgba(255,255,255,.13)}
.fs-btn ha-icon{--mdc-icon-size:16px;color:rgba(255,255,255,.6)}

/* Tabs */
.tabs{display:flex;padding:0 10px 7px;position:relative;z-index:45;flex-shrink:0;background:transparent;align-items:center;gap:0}
.tabs-scroll{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;flex:1;align-items:center;min-width:0}
.tabs-scroll::-webkit-scrollbar{display:none}
.tab{flex-shrink:0;display:flex;align-items:center;gap:6px;padding:5px 11px;border-radius:18px;font-size:12px;font-weight:800;color:rgba(255,255,255,.52);border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.05);transition:all .18s,transform .08s;white-space:nowrap}
.tab ha-icon{--mdc-icon-size:15px;opacity:.7}
.tab:hover{color:rgba(255,255,255,.70);background:rgba(255,255,255,.09)}
.tab.active{background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.28);color:rgba(255,255,255,.96)}
.tab.active ha-icon{opacity:1}
.divider{height:1px;background:rgba(255,255,255,.07);margin:0 10px;position:relative;z-index:44;flex-shrink:0}

/* Page layout */
.page{display:none;flex:0 0 auto;min-height:calc(100dvh - 78px);padding:8px 8px max(58px, env(safe-area-inset-bottom));flex-direction:column;overflow:visible;scrollbar-width:none;-webkit-overflow-scrolling:touch;scroll-padding-bottom:58px}
.page::-webkit-scrollbar{display:none}
.page.active{display:flex}
.page-ov{gap:5px}
.ov-main{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:6px;width:100%}
.col{display:flex;flex-direction:column;gap:6px;min-width:0}
.personal-grid{align-items:start}
.personal-card{min-height:0}
.agenda-card{min-height:300px}
.agenda-list{display:flex;flex-direction:column;gap:7px}
.agenda-item{display:grid;grid-template-columns:82px 1fr;gap:9px;align-items:center;padding:9px;border-radius:12px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.09)}
.agenda-time{display:flex;flex-direction:column;gap:2px;align-items:flex-start}
.agenda-time b{font-size:16px;color:rgba(255,255,255,.94);line-height:1}
.agenda-time span{font-size:9px;color:rgba(167,139,250,.88);text-transform:uppercase;letter-spacing:.55px;font-weight:800;white-space:nowrap}
.agenda-main{min-width:0}
.agenda-main b{display:block;font-size:14px;color:rgba(255,255,255,.88);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.agenda-main span{display:block;font-size:10px;color:rgba(255,255,255,.38);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-transform:capitalize}
.personal-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
.personal-metrics.stocks{grid-template-columns:1fr}
.personal-metric{display:flex;align-items:center;gap:10px;min-height:66px;padding:10px;border-radius:12px;background:linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.035));border:1px solid rgba(255,255,255,.09)}
.personal-metric ha-icon{--mdc-icon-size:24px;color:#a78bfa;filter:drop-shadow(0 0 9px rgba(167,139,250,.35));flex-shrink:0}
.personal-metric.m1 ha-icon{color:#34d399;filter:drop-shadow(0 0 9px rgba(52,211,153,.35))}
.personal-metric.m2 ha-icon{color:#60a5fa;filter:drop-shadow(0 0 9px rgba(96,165,250,.35))}
.personal-metric.m3 ha-icon{color:#fbbf24;filter:drop-shadow(0 0 9px rgba(251,191,36,.30))}
.personal-metric b{display:block;font-size:19px;color:rgba(255,255,255,.94);letter-spacing:-.4px;line-height:1.05}
.personal-metric small{font-size:10px;color:rgba(255,255,255,.46);font-weight:600;letter-spacing:0}
.personal-metric span{display:block;font-size:9px;color:rgba(255,255,255,.42);margin-top:3px;text-transform:uppercase;letter-spacing:.35px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.personal-empty{min-height:190px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;text-align:center;padding:20px;border-radius:12px;background:rgba(255,255,255,.04);border:1px dashed rgba(255,255,255,.12)}
.personal-empty.compact{min-height:116px}
.personal-empty ha-icon{--mdc-icon-size:34px;color:rgba(167,139,250,.72)}
.personal-empty b{font-size:15px;color:rgba(255,255,255,.82)}
.personal-empty span{max-width:360px;font-size:11px;line-height:1.45;color:rgba(255,255,255,.45)}

/* World Cup */
.wc-card{padding:10px}
.wc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px}
.wc-title{font-size:22px;font-weight:800;color:rgba(255,255,255,.94);letter-spacing:-.5px;line-height:1.05}
.wc-sub{font-size:11px;color:rgba(255,255,255,.46);margin-top:3px}
.wc-refresh{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12)!important}
.wc-refresh ha-icon{--mdc-icon-size:15px;color:rgba(255,255,255,.68)}
.wc-featured{display:flex;flex-direction:column;gap:10px}
.wc-scoreline{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;padding:12px;border-radius:14px;background:linear-gradient(145deg,rgba(255,255,255,.085),rgba(255,255,255,.035));border:1px solid rgba(255,255,255,.08)}
.wc-team{display:flex;align-items:center;gap:9px;min-width:0}
.wc-team.right{justify-content:flex-end;text-align:right}
.wc-logo{width:42px;height:42px;border-radius:50%;object-fit:contain;background:rgba(255,255,255,.96);padding:3px;flex-shrink:0}
.wc-logo.ph{display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#111827}
.wc-team-name{font-size:15px;font-weight:700;color:rgba(255,255,255,.92);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wc-score-mid{text-align:center}
.wc-score{font-size:38px;font-weight:900;letter-spacing:-1.6px;line-height:1;color:rgba(255,255,255,.97)}
.wc-score span{font-size:24px;color:rgba(255,255,255,.36);margin:0 4px}
.wc-status{display:inline-flex;align-items:center;justify-content:center;margin-top:5px;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.10);font-size:10px;font-weight:800;color:rgba(255,255,255,.68);text-transform:uppercase;letter-spacing:.45px}
.wc-status.live{background:rgba(239,68,68,.14);border-color:rgba(239,68,68,.26);color:#fecaca}
.wc-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
.wc-meta div,.wc-stat{padding:8px 9px;border-radius:11px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}
.wc-meta b{display:block;font-size:14px;color:rgba(255,255,255,.90);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wc-meta span{display:block;margin-top:3px;font-size:9px;color:rgba(255,255,255,.40);text-transform:uppercase;letter-spacing:.42px}
.wc-video-card{padding:10px;border-radius:13px;background:linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.08)}
.wc-video-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px}
.wc-video-title{font-size:14px;font-weight:800;color:rgba(255,255,255,.92)}
.wc-video-sub{font-size:10px;color:rgba(255,255,255,.44);margin-top:2px}
.wc-watch-link{display:inline-flex;align-items:center;justify-content:center;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.12);font-size:10px;font-weight:800;color:rgba(255,255,255,.86);text-decoration:none;white-space:nowrap}
.wc-video{display:block;width:100%;aspect-ratio:16 / 9;border-radius:12px;background:#050816;object-fit:cover;border:1px solid rgba(255,255,255,.08)}
.wc-video-note{margin-top:7px;font-size:10px;line-height:1.4;color:rgba(255,255,255,.42)}
.wc-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
.wc-stat{display:flex;align-items:center;gap:8px}
.wc-stat ha-icon{--mdc-icon-size:18px;color:#a78bfa;flex-shrink:0}
.wc-stat b{display:flex;align-items:baseline;justify-content:space-between;gap:8px;width:100%;font-size:18px;color:rgba(255,255,255,.92)}
.wc-stat span{font-size:9px;font-weight:700;color:rgba(255,255,255,.42);text-transform:uppercase;letter-spacing:.42px}
.wc-empty-note{padding:9px 10px;border-radius:11px;background:rgba(255,255,255,.04);border:1px dashed rgba(255,255,255,.10);font-size:11px;line-height:1.45;color:rgba(255,255,255,.48)}
.wc-match-list{display:flex;flex-direction:column;gap:6px}
.wc-row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:9px 10px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}
.wc-row.live{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.18)}
.wc-row-teams{min-width:0}
.wc-row-team{font-size:13px;font-weight:700;color:rgba(255,255,255,.86);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wc-row-team + .wc-row-team{margin-top:3px;color:rgba(255,255,255,.62)}
.wc-row-score{text-align:right}
.wc-row-score b{display:block;font-size:17px;color:rgba(255,255,255,.94);line-height:1}
.wc-row-score span{display:block;margin-top:3px;font-size:10px;color:rgba(255,255,255,.44)}
.wc-groups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.wc-group{padding:9px;border-radius:12px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08)}
.wc-group-name{font-size:12px;font-weight:800;color:rgba(255,255,255,.86);letter-spacing:.3px;margin-bottom:7px}
.wc-table{display:flex;flex-direction:column;gap:3px}
.wc-table-head,.wc-table-row{display:grid;grid-template-columns:minmax(0,1fr) 26px 34px 28px;gap:8px;align-items:center}
.wc-table-head{font-size:8px;font-weight:900;color:rgba(255,255,255,.38);text-transform:uppercase;letter-spacing:.55px;padding:0 2px 3px}
.wc-table-row{padding:6px 8px;border-radius:9px;background:rgba(255,255,255,.045);font-size:11px;color:rgba(255,255,255,.72)}
.wc-table-row .team{font-weight:700;color:rgba(255,255,255,.9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wc-table-row .pts{font-weight:900;color:#fbbf24}

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
.cv{font-size:28px;font-weight:300;color:rgba(255,255,255,.98);letter-spacing:-0.8px;line-height:1}
.cu{font-size:12px;color:rgba(255,255,255,.55)}
.cl{font-size:10px;color:rgba(255,255,255,.46);text-transform:uppercase;letter-spacing:.5px;margin-top:2px;white-space:nowrap}
.spark-wrap{width:100%;height:25px;margin-top:4px;overflow:hidden}
.spark{width:100%;height:25px;display:block}
.spark-empty{width:100%;height:25px;border-bottom:1px solid rgba(255,255,255,.06)}
.aq-spark{height:24px;margin-top:5px}
.aq-spark .spark{height:24px}
.aq-text{font-size:22px!important;font-weight:800!important;text-transform:capitalize}

/* Tesla card — Tesla-app style */
.tc{overflow:hidden;padding:0}
/* Single wrapper gives header + car image one unified dark background */
.tc-hero{background:linear-gradient(180deg,rgba(16,10,38,.98) 0%,rgba(5,5,18,.99) 100%)}
.theme-day .tc-hero{
  background:
    radial-gradient(circle at 18% 22%,rgba(255,255,255,.16),transparent 28%),
    radial-gradient(circle at 82% 18%,rgba(110,231,255,.14),transparent 30%),
    linear-gradient(180deg,rgba(64,84,148,.62) 0%,rgba(33,45,95,.78) 56%,rgba(28,31,76,.88) 100%);
}
.tc-top{display:flex;justify-content:space-between;align-items:center;padding:9px 12px 2px;background:transparent}
.theme-day .tc-top{background:linear-gradient(180deg,rgba(255,255,255,.05),transparent)}
.tc-brand{display:flex;align-items:center;gap:8px}
.tc-name{font-size:21px;font-weight:800;color:rgba(255,255,255,.94);letter-spacing:-.4px}
.tc-sub{font-size:11px;color:rgba(255,255,255,.44);letter-spacing:.8px;text-transform:uppercase;margin-top:0}
.tc-img-wrap{width:100%;height:120px;position:relative;background:transparent;display:flex;align-items:center;justify-content:center;overflow:hidden}
.theme-day .tc-img-wrap{background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,0))}
.tc-glow{position:absolute;bottom:0;left:0;right:0;height:50px;background:radial-gradient(ellipse 90% 100% at 50% 100%,rgba(60,90,220,.2),transparent 70%);pointer-events:none}
.theme-day .tc-glow{background:radial-gradient(ellipse 90% 100% at 50% 100%,rgba(125,211,252,.26),transparent 70%)}
.tc-car{width:98%;height:100%;object-fit:contain;object-position:center center;filter:drop-shadow(0 13px 19px rgba(0,0,0,.64));pointer-events:none;user-select:none;position:relative;z-index:1;transform:translateY(0)}
.theme-day .tc-car{filter:drop-shadow(0 14px 18px rgba(10,18,42,.38))}
.tc.charging .tc-glow{background:radial-gradient(ellipse 90% 100% at 50% 100%,rgba(52,211,153,.30),transparent 70%);animation:charge-glow 2.8s ease-in-out infinite;animation-delay:var(--charge-phase)}
.tc-stats{padding:7px 11px 5px}
.tc-batt-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px}
.tc-pct{font-size:40px;font-weight:800;letter-spacing:-2px;line-height:1}
.tc-pct span{font-size:18px;font-weight:400;color:rgba(255,255,255,.5);margin-left:2px}
.tc-range{font-size:18px;font-weight:700;color:rgba(255,255,255,.65)}
.tc-bar{height:3px;background:rgba(255,255,255,.12);border-radius:2px;margin-bottom:7px;overflow:hidden}
.tc-fill{height:100%;border-radius:2px;transition:width .4s}
.tc.charging .tc-fill{position:relative;overflow:hidden}
.tc.charging .tc-fill::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);animation:charge-sweep 3s linear infinite;animation-delay:var(--charge-phase)}
.tc-charge{margin:0 0 7px;padding:7px 8px;border-radius:10px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.075);overflow:hidden;position:relative}
.tc-charge.plugged{background:rgba(96,165,250,.07);border-color:rgba(96,165,250,.16)}
.tc-charge.charging{background:rgba(52,211,153,.075);border-color:rgba(52,211,153,.22)}
.tc-charge-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
.tc-charge-title{display:flex;align-items:center;gap:6px;min-width:0;color:rgba(255,255,255,.78);font-size:11px;font-weight:800}
.tc-charge-title ha-icon{--mdc-icon-size:15px;color:rgba(255,255,255,.55);flex-shrink:0}
.tc-charge.charging .tc-charge-title ha-icon{color:#34d399;filter:drop-shadow(0 0 8px rgba(52,211,153,.65))}
.tc-charge.plugged .tc-charge-title ha-icon{color:#60a5fa}
.tc-charge-title span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tc-charge-time{font-size:10px;color:rgba(255,255,255,.48);font-weight:700;white-space:nowrap}
.tc-charge-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px}
.tc-charge-grid div{min-width:0;border-radius:8px;background:rgba(255,255,255,.045);padding:5px 7px}
.tc-charge-grid b{display:block;font-size:15px;color:rgba(255,255,255,.9);line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tc-charge-grid span{display:block;margin-top:2px;font-size:8px;letter-spacing:.45px;text-transform:uppercase;color:rgba(255,255,255,.38)}
.tc-charge-track{position:absolute;left:0;right:0;bottom:0;height:2px;overflow:hidden;background:rgba(255,255,255,.06)}
.tc-charge-track span{position:absolute;top:0;bottom:0;width:32%;border-radius:2px;background:linear-gradient(90deg,transparent,rgba(52,211,153,.85),transparent);opacity:0}
.tc-charge.charging .tc-charge-track span{opacity:1;animation:charge-track 3s linear infinite;animation-delay:var(--charge-phase)}
.tc-charge.charging .tc-charge-track span:nth-child(2){animation-delay:calc(var(--charge-phase) + .5s)}
.tc-charge.charging .tc-charge-track span:nth-child(3){animation-delay:calc(var(--charge-phase) + 1s)}
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
@keyframes charge-sweep{from{transform:translateX(-110%)}to{transform:translateX(110%)}}
@keyframes charge-track{from{left:-35%}to{left:103%}}
@keyframes charge-glow{0%,100%{opacity:.68}50%{opacity:1}}

/* Weather */
.wx-big{padding:9px 12px;transition:background .4s,border-color .4s;position:relative;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 16px 44px rgba(0,0,0,.20)}
.wx-big>*:not(.wx-sky){position:relative;z-index:1}
.wx-sky{position:absolute;inset:0;z-index:0;pointer-events:none;opacity:1;background:radial-gradient(circle at 12% 86%,rgba(239,68,68,.20),transparent 28%),radial-gradient(circle at 88% 20%,rgba(255,255,255,.08),transparent 32%)}
.wx-sky span{position:absolute;display:block}
.wx-cloudy .wx-sky span,.wx-partlycloudy .wx-sky span,.wx-partlycloudy-night .wx-sky span,.wx-rainy .wx-sky span,.wx-pouring .wx-sky span,.wx-lightning-rainy .wx-sky span{width:240px;height:92px;border-radius:999px;background:rgba(255,255,255,.16);filter:blur(14px)}
.wx-cloudy .wx-sky span:nth-child(1),.wx-partlycloudy .wx-sky span:nth-child(1),.wx-partlycloudy-night .wx-sky span:nth-child(1),.wx-rainy .wx-sky span:nth-child(1),.wx-pouring .wx-sky span:nth-child(1),.wx-lightning-rainy .wx-sky span:nth-child(1){top:2px;right:4%;transform:rotate(-8deg);animation:cloud-drift-1 20s ease-in-out infinite alternate}
.wx-cloudy .wx-sky span:nth-child(2),.wx-partlycloudy .wx-sky span:nth-child(2),.wx-partlycloudy-night .wx-sky span:nth-child(2),.wx-rainy .wx-sky span:nth-child(2),.wx-pouring .wx-sky span:nth-child(2),.wx-lightning-rainy .wx-sky span:nth-child(2){top:66px;left:18%;width:260px;opacity:.75;animation:cloud-drift-2 24s ease-in-out infinite alternate}
.wx-cloudy .wx-sky span:nth-child(3),.wx-partlycloudy .wx-sky span:nth-child(3),.wx-partlycloudy-night .wx-sky span:nth-child(3),.wx-rainy .wx-sky span:nth-child(3),.wx-pouring .wx-sky span:nth-child(3){bottom:8px;right:28%;width:210px;opacity:.45;animation:cloud-drift-3 28s ease-in-out infinite alternate}
.wx-sunny .wx-sky{background:linear-gradient(145deg,rgba(251,191,36,.18),rgba(59,130,246,.10)),radial-gradient(circle at 13% 80%,rgba(248,113,113,.32),transparent 30%)}
.wx-sunny .wx-sky::before{content:"";position:absolute;left:4%;top:6%;width:190px;height:190px;border-radius:50%;background:radial-gradient(circle,rgba(251,191,36,.55),rgba(251,191,36,.16) 46%,transparent 70%);filter:blur(2px);animation:sun-breathe 5s ease-in-out infinite}
.wx-clear-night .wx-sky,.wx-partlycloudy-night .wx-sky,.wx-clear .wx-sky{background:linear-gradient(145deg,rgba(30,27,75,.28),rgba(15,23,42,.12)),radial-gradient(circle at 82% 16%,rgba(129,140,248,.18),transparent 28%),radial-gradient(circle at 10% 84%,rgba(59,130,246,.12),transparent 32%)}
.wx-clear-night .wx-sky::before,.wx-partlycloudy-night .wx-sky::before,.wx-clear .wx-sky::before{content:"";position:absolute;right:8%;top:10%;width:95px;height:95px;border-radius:50%;background:radial-gradient(circle,rgba(199,210,254,.32),rgba(129,140,248,.08) 48%,transparent 72%)}
.wx-rainy .wx-sky,.wx-pouring .wx-sky,.wx-lightning-rainy .wx-sky{background:linear-gradient(145deg,rgba(37,99,235,.30),rgba(15,23,42,.08)),radial-gradient(circle at 10% 80%,rgba(37,99,235,.30),transparent 30%)}
.wx-rainy .wx-sky::after,.wx-pouring .wx-sky::after,.wx-lightning-rainy .wx-sky::after{content:"";position:absolute;inset:-80px 0 0;background:repeating-linear-gradient(105deg,transparent 0 14px,rgba(96,165,250,.38) 15px 17px,transparent 18px 28px);opacity:.48;transform:translateX(-20px);animation:rain-slide .85s linear infinite}
.wx-lightning .wx-sky::before,.wx-lightning-rainy .wx-sky::before{content:"";position:absolute;right:18%;top:10%;width:80px;height:120px;background:linear-gradient(140deg,transparent 0 38%,rgba(253,224,71,.55) 39% 43%,transparent 44% 100%);filter:drop-shadow(0 0 16px rgba(253,224,71,.55));animation:lightning-flash 4.5s steps(1,end) infinite}
.wx-fog .wx-sky::after{content:"";position:absolute;inset:12px;background:repeating-linear-gradient(0deg,transparent 0 17px,rgba(255,255,255,.10) 18px 21px);filter:blur(3px);opacity:.6;animation:fog-drift 16s ease-in-out infinite alternate}
.wx-hero{display:flex;align-items:center;gap:14px;margin-bottom:7px}
.wx-hero-left{display:flex;align-items:center;gap:11px;flex-shrink:0}
.wx-ico-big{--mdc-icon-size:54px;transition:color .4s}
.wx-tmp-big{font-size:46px;font-weight:100;color:rgba(255,255,255,.96);letter-spacing:-2.5px;line-height:1}
.wx-tmp-big span{font-size:18px;color:rgba(255,255,255,.45);font-weight:300}
.wx-cond-big{font-size:12px;color:rgba(255,255,255,.55);margin-top:2px;text-transform:capitalize;letter-spacing:.4px}
.wx-details{display:flex;gap:6px;flex-wrap:wrap;flex:1}
.wx-det{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:55px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:6px 9px;flex:1}
.wx-det ha-icon{--mdc-icon-size:17px;color:rgba(255,255,255,.55)}
.wx-det-val{font-size:18px;font-weight:700;color:rgba(255,255,255,.9)}
.wx-det-lbl{font-size:10px;color:rgba(255,255,255,.43);text-transform:uppercase;letter-spacing:.4px;text-align:center}
.wx-sep{height:1px;background:rgba(255,255,255,.1);margin:7px 0}
.wx-forecast{display:block}
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
.wx-graph{position:relative;height:130px;border-radius:11px;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.025));border:1px solid rgba(255,255,255,.075);padding-top:30px}
.wxg-days{position:absolute;left:0;right:0;top:7px;height:26px;z-index:4}
.wxg-day{position:absolute;top:0;transform:translateX(-50%);display:flex;align-items:center;gap:5px;min-width:62px;justify-content:center;white-space:nowrap}
.wxg-label{font-size:9px;color:rgba(255,255,255,.52);text-transform:uppercase;letter-spacing:.45px;font-weight:800}
.wxg-icon{--mdc-icon-size:17px;filter:drop-shadow(0 2px 5px rgba(0,0,0,.35))}
.wxg-rain{font-size:9px;color:rgba(96,165,250,.88);font-weight:800}
.wxg-svg{position:absolute;left:0;right:0;top:34px;width:100%;height:76px;display:block;overflow:visible}
.wx-dot{position:absolute;z-index:4;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;box-shadow:0 1px 5px rgba(0,0,0,.45)}
.wx-dot.hi{width:8px;height:8px;background:rgba(255,255,255,.92);border:1px solid rgba(5,8,24,.45)}
.wx-dot.lo{width:6px;height:6px;background:rgba(147,197,253,.9);border:1px solid rgba(5,8,24,.35)}
.wx-temp-label{position:absolute;z-index:5;transform:translateX(-50%) translateY(-50%);font-weight:800;line-height:1;letter-spacing:0;text-shadow:0 2px 6px rgba(5,8,24,.9),0 0 10px rgba(5,8,24,.7);white-space:nowrap;pointer-events:none}
.wx-temp-label.hi{font-size:17px;color:rgba(255,255,255,.96)}
.wx-temp-label.lo{font-size:13px;color:rgba(147,197,253,.9)}
@keyframes cloud-drift-1{from{transform:translateX(-10px) rotate(-8deg)}to{transform:translateX(18px) rotate(-6deg)}}
@keyframes cloud-drift-2{from{transform:translateX(16px)}to{transform:translateX(-20px)}}
@keyframes cloud-drift-3{from{transform:translateX(-14px)}to{transform:translateX(14px)}}
@keyframes rain-slide{from{background-position:0 0}to{background-position:-30px 80px}}
@keyframes sun-breathe{0%,100%{transform:scale(.96);opacity:.82}50%{transform:scale(1.05);opacity:1}}
@keyframes fog-drift{from{transform:translateX(-18px)}to{transform:translateX(18px)}}
@keyframes lightning-flash{0%,86%,100%{opacity:.18}88%,90%{opacity:1}92%{opacity:.25}94%{opacity:.9}}
@media(prefers-reduced-motion:reduce){
  .wx-sky span,.wx-sky::before,.wx-sky::after{animation:none!important}
}

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

/* Home pulse */
.pulse-card{padding:9px 10px}
.pulse-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}
.pulse-item{min-width:0;border-radius:10px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.08);padding:7px 6px;text-align:center}
.pulse-item ha-icon{--mdc-icon-size:17px;color:rgba(255,255,255,.5);margin-bottom:3px}
.pulse-item b{display:block;font-size:16px;line-height:1;color:rgba(255,255,255,.92);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pulse-item span{display:block;margin-top:3px;font-size:8px;text-transform:uppercase;letter-spacing:.35px;color:rgba(255,255,255,.38);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

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
.light-item.unavailable{opacity:.56}
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
.li-color-wrap{padding:0 11px 9px}
.room-palette{margin-top:9px;padding-top:8px;border-top:1px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.rp-palette-label{font-size:9px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:rgba(255,255,255,.34)}
.room-bright{display:flex;align-items:center;gap:8px;min-width:220px;flex:1}
.room-colors{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.room-slider{-webkit-appearance:none;appearance:none;flex:1;height:4px;border-radius:4px;background:linear-gradient(90deg,rgba(167,139,250,.85),rgba(255,255,255,.16));outline:none;cursor:pointer}
.room-slider::-webkit-slider-thumb{-webkit-appearance:none;width:17px;height:17px;border-radius:50%;background:#fff;box-shadow:0 1px 8px rgba(0,0,0,.35)}
.room-slider::-moz-range-thumb{width:17px;height:17px;border-radius:50%;background:#fff;border:0;box-shadow:0 1px 8px rgba(0,0,0,.35)}
.swatches{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.swatches.compact{gap:5px}
.c-swatch{width:22px;height:22px;border-radius:50%;background:var(--sw);border:2px solid rgba(255,255,255,.22)!important;box-shadow:0 0 0 1px rgba(0,0,0,.18),0 5px 12px rgba(0,0,0,.20);transition:transform .08s,filter .12s,box-shadow .12s}
.swatches.compact .c-swatch{width:18px;height:18px}
.c-swatch:hover{filter:brightness(1.12);box-shadow:0 0 0 1px rgba(255,255,255,.22),0 0 13px rgba(255,255,255,.22)}
.c-picker{position:relative;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:conic-gradient(#ef4444,#f97316,#facc15,#22c55e,#3b82f6,#a855f7,#ef4444);border:2px solid rgba(255,255,255,.24);overflow:hidden;box-shadow:0 5px 12px rgba(0,0,0,.2);cursor:pointer}
.swatches.compact .c-picker{width:18px;height:18px}
.c-picker ha-icon{--mdc-icon-size:12px;color:#fff;filter:drop-shadow(0 1px 2px rgba(0,0,0,.45));pointer-events:none}
.c-picker input{position:absolute;inset:0;opacity:0;cursor:pointer}

/* Energy section */
.en-section{padding:9px}
.en-nodata{display:flex;align-items:center;gap:7px;color:rgba(255,255,255,.42);font-size:11px;padding:2px 0 0;line-height:1.35}
.en-title-row{display:flex;align-items:center;justify-content:space-between}
.en-price{font-size:10px;color:rgba(255,255,255,.46);font-weight:800}
.en-metrics{display:grid;grid-template-columns:1.35fr 1fr;gap:5px;margin-bottom:5px}
.en-pill{min-width:0;padding:7px 8px;border-radius:10px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.08)}
.en-pill b{display:block;font-size:20px;line-height:1.05;font-weight:700;color:rgba(255,255,255,.94);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.en-pill.live b{font-size:34px;font-weight:600;letter-spacing:-1.4px}
.en-pill.total b{font-size:20px}
.en-pill em{font-style:normal;font-size:16px;color:rgba(255,255,255,.72);margin-left:7px}
.en-pill small{font-size:10px;color:rgba(255,255,255,.48);font-weight:500}
.en-pill span{display:block;font-size:9px;color:rgba(255,255,255,.42);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.en-live-spark{height:22px;margin-top:0;margin-bottom:5px}
.en-live-spark .spark{height:22px}
.en-unit{font-size:12px;color:rgba(255,255,255,.47);font-weight:400}
.en-tabs{display:flex;gap:4px;margin-bottom:6px}
.en-tab{flex:1;padding:4px 2px;border-radius:8px;font-size:9px;font-weight:700;color:rgba(255,255,255,.4);background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07)!important;transition:all .15s;text-transform:capitalize;text-align:center;cursor:pointer}
.en-tab:hover{background:rgba(255,255,255,.09);color:rgba(255,255,255,.65)}
.en-tab.active{background:rgba(167,139,250,.18);border-color:rgba(167,139,250,.35)!important;color:rgba(200,185,255,.92)}
.en-tab.loading{position:relative;color:rgba(255,255,255,.72)}
.en-tab.loading::after{content:"";position:absolute;right:7px;top:50%;width:5px;height:5px;margin-top:-2.5px;border-radius:50%;background:#a78bfa;box-shadow:0 0 8px rgba(167,139,250,.7);animation:sentry-pulse 1.15s ease-in-out infinite}
.en-chart{width:100%;height:62px;overflow:hidden}
.en-bar-stack{height:62px;display:flex;flex-direction:column;gap:3px}
.en-svg{width:100%;height:48px;display:block}
.en-axis{display:flex;width:100%;height:11px;align-items:flex-start;overflow:hidden}
.en-axis span{flex:1;min-width:0;text-align:center;font-size:9px;line-height:1;color:rgba(255,255,255,.52);font-weight:700;letter-spacing:0;white-space:nowrap}
.en-foot{display:flex;justify-content:space-between;margin-top:3px;font-size:9px;color:rgba(255,255,255,.38)}
.en-loading{height:62px;display:flex;align-items:center;justify-content:center;font-size:11px;color:rgba(255,255,255,.28)}

/* Network */
.net-card{position:relative;overflow:hidden}
.net-head{display:flex;justify-content:flex-end;margin-top:-22px;margin-bottom:6px}
.net-status{display:flex;align-items:center;gap:5px;font-size:9px;font-weight:800;color:rgba(255,255,255,.42);text-transform:uppercase;letter-spacing:.4px}
.net-status span{width:7px;height:7px;border-radius:50%;background:#f87171;box-shadow:0 0 8px rgba(248,113,113,.6)}
.net-status.on span{background:#34d399;box-shadow:0 0 8px rgba(52,211,153,.65)}
.net-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.net-metric{padding:8px;border-radius:11px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.08);min-width:0}
.net-metric ha-icon{--mdc-icon-size:17px;color:rgba(255,255,255,.55);float:right}
.net-metric b{display:block;font-size:20px;color:rgba(255,255,255,.92);line-height:1.05}
.net-metric span{display:block;font-size:9px;color:rgba(255,255,255,.42);text-transform:uppercase;letter-spacing:.5px;margin-top:2px}

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
  .wx-forecast{display:block}
  .media-strip{grid-template-columns:1fr}
  .sp2{flex-direction:column}
  .sp-art,.sp-art-empty{width:100%;height:84px}
  .clim-row{grid-template-columns:1fr auto 1fr}
  .clim-row .clim-sep:last-of-type,.clim-row .aq-col{display:none}
}

/* Presence / sleep overlay */
.presence-overlay{
  position:fixed;inset:0;z-index:9999;
  background:#000;
  opacity:0;pointer-events:none;
  transition:opacity 2s ease;
  display:flex;align-items:center;justify-content:center;
}
.presence-overlay.dimmed{
  opacity:1;pointer-events:all;
  transition:opacity 1.5s ease;
}
.presence-clock{
  text-align:center;
  animation:pres-drift 30s ease-in-out infinite alternate;
}
.presence-time{
  font-size:22vw;font-weight:100;letter-spacing:-.02em;
  color:rgba(255,255,255,.85);line-height:1;
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",system-ui,sans-serif;
}
.presence-date{
  font-size:3.5vw;font-weight:300;
  color:rgba(255,255,255,.4);margin-top:12px;letter-spacing:.5px;
}
@keyframes pres-drift{
  0%  { transform:translate(-18px,-12px); }
  33% { transform:translate(14px, 18px); }
  66% { transform:translate(-10px, 8px); }
  100%{ transform:translate(16px,-14px); }
}
`; }
}

customElements.define("glass-dashboard-card", GlassDashboardCard);

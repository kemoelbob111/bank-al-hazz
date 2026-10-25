(function () {
  "use strict";

  const STORAGE_KEY = "bankAlHazz_save_v1";
  const APPEARANCE_KEY = "bankAlHazz_appearance_v1";

  const ACCENT_SWATCHES = [
    { id: "gold", color: "#fbbf24" },
    { id: "emerald", color: "#34d399" },
    { id: "royal", color: "#818cf8" },
    { id: "sunset", color: "#fb923c" },
    { id: "rose", color: "#f472b6" },
  ];
  const BOARD_LEN = 28;
  const START_INDEX = 0;
  const JAIL_INDEX = 7;
  const GO_JAIL_INDEX = 21;
  const START_MONEY = 1500;
  const PASS_START_BONUS = 200;
  const JAIL_BAIL = 50;
  const MAX_DOUBLES = 3;

  const PLAYER_COLORS = ["#ef4444", "#3b82f6", "#eab308", "#a855f7"];
  const PLAYER_EMOJI = ["1", "2", "3", "4"];

  const MOVE_STEP_MS = 130;

  /** @type {typeof cells} */
  const cells = [
    { type: "start", name: "البداية", short: "🏁" },
    { type: "property", name: "سوق واقف", price: 60, rent: 6, color: "#7c3aed" },
    { type: "property", name: "حي الصفا", price: 60, rent: 6, color: "#7c3aed" },
    { type: "chance", name: "كرت الحظ", short: "❓" },
    { type: "property", name: "كورنيش جدة", price: 100, rent: 10, color: "#0284c7" },
    { type: "property", name: "برج المملكة", price: 100, rent: 10, color: "#0284c7" },
    { type: "property", name: "العلا", price: 120, rent: 12, color: "#0284c7" },
    { type: "jail", name: "السجن", short: "🔒" },
    { type: "property", name: "مارينا دبي", price: 140, rent: 14, color: "#dc2626" },
    { type: "property", name: "مسقط", price: 140, rent: 14, color: "#dc2626" },
    { type: "tax", name: "ضريبة", amount: 100, short: "💸" },
    { type: "property", name: "الكويت", price: 160, rent: 16, color: "#dc2626" },
    { type: "property", name: "الدوحة", price: 180, rent: 18, color: "#ea580c" },
    { type: "property", name: "المنامة", price: 180, rent: 18, color: "#ea580c" },
    { type: "free", name: "استراحة", short: "☕" },
    { type: "property", name: "القاهرة", price: 200, rent: 20, color: "#ea580c" },
    { type: "chance", name: "كرت الحظ", short: "❓" },
    { type: "property", name: "فاس", price: 220, rent: 22, color: "#0d9488" },
    { type: "property", name: "مراكش", price: 220, rent: 22, color: "#0d9488" },
    { type: "property", name: "تونس", price: 240, rent: 24, color: "#0d9488" },
    { type: "gojail", name: "اذهب للسجن", short: "👮" },
    { type: "property", name: "بيروت", price: 260, rent: 26, color: "#16a34a" },
    { type: "property", name: "عمان", price: 260, rent: 26, color: "#16a34a" },
    { type: "property", name: "دمشق", price: 280, rent: 28, color: "#16a34a" },
    { type: "property", name: "الرياض", price: 300, rent: 30, color: "#ca8a04" },
    { type: "property", name: "أبوظبي", price: 320, rent: 32, color: "#ca8a04" },
    { type: "tax", name: "ضريبة كبيرة", amount: 200, short: "💸" },
    { type: "property", name: "القدس", price: 350, rent: 35, color: "#ca8a04" },
  ];

  const chanceCards = [
    { text: "ارجع إلى البداية واستلم ٢٠٠ دينار.", effect: "goStart" },
    { text: "البنك يمنحك ١٠٠ دينار.", effect: "gain", amount: 100 },
    { text: "ادفع ٥٠ دينار للبنك.", effect: "pay", amount: 50 },
    { text: "اذهب إلى السجن مباشرة.", effect: "jail" },
    { text: "تقدّم ٣ مربعات.", effect: "move", steps: 3 },
    { text: "ارجع ٣ مربعات.", effect: "move", steps: -3 },
    { text: "ادفع ٧٥ دينار (رسوم إصلاح).", effect: "pay", amount: 75 },
    { text: "احصل على ٥٠ دينار من كل لاعب نشط.", effect: "collectAll", amount: 50 },
    { text: "تبرّع ٢٥ دينار للبنك.", effect: "pay", amount: 25 },
    { text: "تقدّم إلى أقرب مدينة (إن وُجدت) — أو ٢٠٠ دينار.", effect: "nearestOrMoney" },
  ];

  /** @type {GameState | null} */
  let state = null;
  let busy = false;
  let selectedCount = 3;
  let gameMode = "local";
  let cpuOpponents = 1;
  let cpuLoopActive = false;

  const CPU_NAMES = ["🤖 كمبيوتر ١", "🤖 كمبيوتر ٢", "🤖 كمبيوتر ٣"];

  const $ = (sel) => document.querySelector(sel);

  function defaultAppearance() {
    return { theme: "dark", accent: "gold", brightness: 100 };
  }

  function loadAppearance() {
    try {
      const raw = localStorage.getItem(APPEARANCE_KEY);
      if (!raw) return defaultAppearance();
      return { ...defaultAppearance(), ...JSON.parse(raw) };
    } catch {
      return defaultAppearance();
    }
  }

  function saveAppearance(prefs) {
    try {
      localStorage.setItem(APPEARANCE_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }

  function applyAppearance(prefs) {
    const root = document.documentElement;
    root.dataset.theme = prefs.theme;
    root.dataset.accent = prefs.accent;
    root.style.setProperty("--ui-bright", String(prefs.brightness / 100));
    document.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.theme === prefs.theme);
    });
    document.querySelectorAll(".swatch").forEach((sw) => {
      sw.classList.toggle("selected", sw.dataset.accent === prefs.accent);
    });
    document.querySelectorAll(".brightness-range").forEach((input) => {
      input.value = String(prefs.brightness);
    });
    document.querySelectorAll(".brightness-value").forEach((el) => {
      el.textContent = `${prefs.brightness}%`;
    });
  }

  function updateAppearance(patch) {
    const prefs = { ...loadAppearance(), ...patch };
    saveAppearance(prefs);
    applyAppearance(prefs);
  }

  function bindAppearanceControls() {
    document.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.addEventListener("click", () => updateAppearance({ theme: btn.dataset.theme }));
    });
    document.querySelectorAll(".swatch").forEach((sw) => {
      sw.addEventListener("click", () => updateAppearance({ accent: sw.dataset.accent }));
    });
    document.querySelectorAll(".brightness-range").forEach((input) => {
      input.addEventListener("input", () => {
        updateAppearance({ brightness: Number(input.value) });
      });
    });
    const reset = $("#btn-reset-appearance");
    if (reset) {
      reset.addEventListener("click", () => {
        const d = defaultAppearance();
        saveAppearance(d);
        applyAppearance(d);
      });
    }
  }

  function openAppearanceDialog() {
    const dlg = $("#appearance-dialog");
    if (dlg && typeof dlg.showModal === "function") dlg.showModal();
  }

  const screens = {
    setup: $("#screen-setup"),
    game: $("#screen-game"),
    win: $("#screen-win"),
  };

  function fmt(n) {
    return n.toLocaleString("ar-EG");
  }

  function log(msg) {
    if (!state) return;
    state.log.unshift(msg);
    if (state.log.length > 80) state.log.pop();
    const strip = document.querySelector("#event-strip");
    if (strip) {
      strip.textContent = msg;
      strip.classList.remove("flash");
      void strip.offsetWidth;
      strip.classList.add("flash");
    }
    saveGame();
    renderLog();
  }

  function createInitialState(configs) {
    const owners = new Array(BOARD_LEN).fill(null);
    const players = configs.map((cfg, i) => ({
      id: i,
      name: (cfg.name || `لاعب ${i + 1}`).trim(),
      isCpu: !!cfg.isCpu,
      money: START_MONEY,
      position: START_INDEX,
      inJail: false,
      jailTurns: 0,
      bankrupt: false,
      color: PLAYER_COLORS[i],
      emoji: cfg.isCpu ? "🤖" : PLAYER_EMOJI[i],
    }));
    return {
      players,
      owners,
      currentPlayerIndex: 0,
      phase: "roll",
      doublesStreak: 0,
      extraRollFromDoubles: false,
      log: ["— بدأت لعبة جديدة —"],
      winnerId: null,
      focusCell: null,
    };
  }

  function boardCellLabel(cell) {
    const compact = window.matchMedia("(max-width: 520px)").matches;
    if (cell.type === "property") {
      if (compact) {
        const w = cell.name.split(/\s+/)[0];
        return w.length > 5 ? w.slice(0, 4) + "…" : w;
      }
      return cell.name;
    }
    return cell.short || cell.name;
  }

  function activePlayers() {
    return state.players.filter((p) => !p.bankrupt);
  }

  function currentPlayer() {
    return state.players[state.currentPlayerIndex];
  }

  function nextPlayerIndex(from) {
    let i = from;
    for (let n = 0; n < state.players.length; n++) {
      i = (i + 1) % state.players.length;
      if (!state.players[i].bankrupt) return i;
    }
    return from;
  }

  function saveGame() {
    if (!state) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      $("#btn-resume").classList.remove("hidden");
    } catch (_) {
      /* ignore */
    }
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function clearSave() {
    localStorage.removeItem(STORAGE_KEY);
    $("#btn-resume").classList.add("hidden");
  }

  function showScreen(name) {
    Object.values(screens).forEach((el) => el.classList.remove("active"));
    screens[name].classList.add("active");
  }

  function propertiesOf(playerId) {
    const list = [];
    for (let i = 0; i < BOARD_LEN; i++) {
      if (cells[i].type === "property" && state.owners[i] === playerId) {
        list.push({ index: i, ...cells[i] });
      }
    }
    return list;
  }

  function sellPropertyToBank(cellIndex) {
    const cell = cells[cellIndex];
    if (cell.type !== "property") return 0;
    const ownerId = state.owners[cellIndex];
    if (ownerId == null) return 0;
    const refund = Math.floor(cell.price / 2);
    state.players[ownerId].money += refund;
    state.owners[cellIndex] = null;
    log(`${state.players[ownerId].name} باع ${cell.name} للبنك (+${fmt(refund)}).`);
    return refund;
  }

  function tryPay(player, amount, reason) {
    if (player.bankrupt) return false;
    if (player.money >= amount) {
      player.money -= amount;
      return true;
    }
    while (player.money < amount) {
      const owned = propertiesOf(player.id);
      if (owned.length === 0) {
        declareBankrupt(player, reason);
        return false;
      }
      sellPropertyToBank(owned[0].index);
    }
    if (player.money >= amount) {
      player.money -= amount;
      return true;
    }
    declareBankrupt(player, reason);
    return false;
  }

  function transferMoney(from, to, amount, reason) {
    if (!tryPay(from, amount, reason)) return false;
    if (to) to.money += amount;
    return true;
  }

  function declareBankrupt(player, reason) {
    player.bankrupt = true;
    player.inJail = false;
    log(`💀 ${player.name} أفلس (${reason}).`);
    for (let i = 0; i < BOARD_LEN; i++) {
      if (state.owners[i] === player.id) state.owners[i] = null;
    }
    player.money = 0;
    checkWinner();
    saveGame();
    renderAll();
  }

  function checkWinner() {
    const alive = activePlayers();
    if (alive.length === 1 && state.players.length > 1) {
      state.winnerId = alive[0].id;
      state.phase = "ended";
      saveGame();
      showWin(alive[0]);
    } else if (alive.length === 0) {
      state.phase = "ended";
      saveGame();
    }
  }

  function showWin(player) {
    $("#win-title").textContent = "🎉 فوز!";
    $("#win-message").textContent = `${player.name} هو آخر من بقي غير مفلس! الرصيد: ${fmt(player.money)} دينار.`;
    showScreen("win");
  }

  function syncSetupModeUi() {
    const localBlock = $("#local-player-count");
    const cpuOpts = $("#cpu-options");
    if (localBlock) localBlock.classList.toggle("hidden", gameMode === "cpu");
    if (cpuOpts) cpuOpts.classList.toggle("hidden", gameMode !== "cpu");
    renderNameFields();
  }

  function buildPlayerConfigs() {
    const inputs = [...$("#name-fields").querySelectorAll("input")];
    if (gameMode === "cpu") {
      const human = inputs[0]?.value.trim() || "لاعب";
      const configs = [{ name: human, isCpu: false }];
      for (let i = 0; i < cpuOpponents; i++) {
        configs.push({ name: CPU_NAMES[i], isCpu: true });
      }
      return configs;
    }
    return inputs.map((inp, i) => ({
      name: inp.value.trim() || inp.placeholder || `لاعب ${i + 1}`,
      isCpu: false,
    }));
  }

  function normalizeSavedState(st) {
    if (st?.players) {
      st.players.forEach((p) => {
        if (p.isCpu == null) p.isCpu = false;
      });
    }
    return st;
  }

  function cpuShouldBuy(player, cell) {
    const reserve = 220;
    if (player.money < cell.price + reserve) return false;
    if (player.money >= cell.price + 450) return true;
    return cell.rent / cell.price >= 0.11;
  }

  function cpuShouldPayJail(player) {
    if (player.money < JAIL_BAIL + 200) return false;
    if (player.jailTurns >= 2) return true;
    return player.money >= JAIL_BAIL + 500;
  }

  async function scheduleCpuTurn() {
    if (!state || cpuLoopActive || busy || state.phase === "ended") return;
    const p = currentPlayer();
    if (!p?.isCpu || p.bankrupt) return;
    cpuLoopActive = true;
    try {
      while (state && state.phase !== "ended" && !busy) {
        const cur = currentPlayer();
        if (!cur?.isCpu || cur.bankrupt) break;

        await delay(600);

        if (state.phase === "roll") {
          if (cur.inJail && cpuShouldPayJail(cur)) {
            payJailAndRoll();
            await delay(450);
            if (state.phase !== "roll") continue;
          }
          await doRoll();
          await delay(350);
          if (state.phase === "postRoll") {
            await delay(400);
            endTurn();
            await delay(250);
          }
        } else if (state.phase === "postRoll") {
          await delay(400);
          endTurn();
          await delay(250);
        } else {
          break;
        }
      }
    } finally {
      cpuLoopActive = false;
    }
  }

  function renderNameFields() {
    const wrap = $("#name-fields");
    wrap.innerHTML = "";
    const count = gameMode === "cpu" ? 1 : selectedCount;
    for (let i = 0; i < count; i++) {
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = gameMode === "cpu" ? "اسمك" : `اسم اللاعب ${i + 1}`;
      input.maxLength = 16;
      input.dataset.index = String(i);
      input.value = gameMode === "cpu" ? "لاعب" : `لاعب ${i + 1}`;
      wrap.appendChild(input);
    }
  }

  function renderBoard() {
    const board = $("#board");
    board.innerHTML = "";

    const center = document.createElement("div");
    center.className = "board-center";
    const cur = currentPlayer();
    const centerTurn =
      cur && !cur.bankrupt && state.phase !== "ended"
        ? `<div class="center-turn">الدور: <strong style="color:${cur.color}">${cur.name}</strong></div>`
        : "<p style='margin:0.35rem 0 0;font-size:0.75rem;color:var(--text-dim)'>٢–٤ لاعبين · نفس الجهاز</p>";
    center.innerHTML = `<h2>بنك الحظ</h2>${centerTurn}`;
    board.appendChild(center);

    for (let i = 0; i < BOARD_LEN; i++) {
      const cell = cells[i];
      const el = document.createElement("div");
      el.className = "cell";
      el.dataset.i = String(i);
      el.title = cell.name;
      if (state.focusCell === i) el.classList.add("cell-focus");
      if (cell.type === "start" || cell.type === "jail" || cell.type === "free" || cell.type === "gojail") {
        el.classList.add("corner");
      } else if (cell.type !== "property") {
        el.classList.add("special");
      }

      if (cell.type === "property") {
        const bar = document.createElement("div");
        bar.className = "color-bar";
        bar.style.background = cell.color;
        el.appendChild(bar);
        const ownerId = state.owners[i];
        if (ownerId != null) {
          el.classList.add("cell-owned");
          const mark = document.createElement("span");
          mark.className = "owner-mark";
          mark.style.background = state.players[ownerId].color;
          el.appendChild(mark);
        }
      }

      const nameEl = document.createElement("div");
      nameEl.className = "cell-name";
      nameEl.textContent = boardCellLabel(cell);
      el.appendChild(nameEl);

      if (cell.type === "property") {
        const price = document.createElement("div");
        price.className = "cell-price";
        price.textContent = `${fmt(cell.price)}`;
        el.appendChild(price);
      }

      const tokens = document.createElement("div");
      tokens.className = "tokens";
      state.players.forEach((p) => {
        if (!p.bankrupt && p.position === i) {
          const t = document.createElement("span");
          t.className = "mini-token";
          t.style.background = p.color;
          t.title = p.name;
          tokens.appendChild(t);
        }
      });
      el.appendChild(tokens);
      board.appendChild(el);
    }
  }

  function renderPlayersPanel() {
    const panel = $("#players-panel");
    panel.innerHTML = '<div class="sidebar-title">اللاعبون</div>';
    const cur = currentPlayer();
    state.players.forEach((p) => {
      const card = document.createElement("div");
      card.className = "player-card";
      if (cur && p.id === cur.id && !p.bankrupt && state.phase !== "ended") {
        card.classList.add("active-turn");
      }
      if (p.bankrupt) card.classList.add("bankrupt");
      card.style.borderRightColor = p.bankrupt ? "transparent" : p.color;

      const props = propertiesOf(p.id);
      const propsHtml = props.length
        ? props.map((pr) => `<span title="${pr.name}">${pr.name.split(" ")[0]}</span>`).join("")
        : '<span class="empty">لا ممتلكات</span>';

      const meta = p.bankrupt
        ? "مفلس"
        : p.inJail
          ? "في السجن"
          : `${props.length} مدينة${p.isCpu ? " · 🤖" : ""}`;

      card.innerHTML = `
        <div class="player-head">
          <span class="player-token" style="background:${p.color}">${p.emoji}</span>
          <span class="player-name">${p.name}${p.isCpu ? ' <span class="cpu-tag">AI</span>' : ""}</span>
        </div>
        <div class="player-money">${fmt(p.money)} <small style="font-size:0.65em;opacity:0.85">د.إ</small></div>
        <div class="player-meta">${meta}</div>
        <div class="player-props">${propsHtml}</div>
      `;
      panel.appendChild(card);
    });
  }

  function renderLog() {
    const ul = $("#game-log");
    ul.innerHTML = state.log.map((line) => `<li>${line}</li>`).join("");
  }

  function renderActions() {
    const wrap = $("#action-buttons");
    wrap.innerHTML = "";
    const p = currentPlayer();
    const banner = $("#turn-banner");

    if (state.phase === "ended") {
      banner.innerHTML = '<span class="turn-pill">انتهت اللعبة</span>';
      return;
    }
    if (!p || p.bankrupt) {
      banner.innerHTML = "";
      return;
    }

    const jailTag = p.inJail ? '<span class="tag">سجن</span>' : "";
    banner.innerHTML = `<div class="turn-pill"><span class="turn-dot" style="background:${p.color};color:${p.color}"></span><strong>${p.name}</strong>${jailTag}</div>`;

    if (p.isCpu) {
      wrap.innerHTML = '<p class="cpu-thinking">🤖 الكمبيوتر يلعب…</p>';
      return;
    }

    if (state.phase === "roll") {
      const rollBtn = mkBtn("🎲 ارمِ النرد", "btn-primary", () => doRoll());
      if (busy) rollBtn.disabled = true;
      wrap.appendChild(rollBtn);

      if (p.inJail) {
        const payBtn = mkBtn(`ادفع ${fmt(JAIL_BAIL)} للخروج`, "btn-secondary", () => payJailAndRoll());
        payBtn.disabled = busy;
        wrap.appendChild(payBtn);
      }
    } else if (state.phase === "postRoll") {
      const endBtn = mkBtn("إنهاء الدور", "btn-secondary", () => endTurn());
      endBtn.disabled = busy;
      wrap.appendChild(endBtn);
    }
  }

  function mkBtn(label, cls, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `btn ${cls}`;
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }

  function renderDice(d1, d2) {
    const el1 = $("#die1");
    const el2 = $("#die2");
    if (d1 == null) {
      el1.querySelector("span").textContent = "—";
      el2.querySelector("span").textContent = "—";
      $("#dice-sum").textContent = "";
      return;
    }
    el1.querySelector("span").textContent = String(d1);
    el2.querySelector("span").textContent = String(d2);
    el1.classList.add("landed");
    el2.classList.add("landed");
    setTimeout(() => {
      el1.classList.remove("landed");
      el2.classList.remove("landed");
    }, 450);
    const sumEl = $("#dice-sum");
    const doublePart = d1 === d2 ? ' · <span class="double">توتّا!</span>' : "";
    sumEl.innerHTML = `المجموع: <strong>${d1 + d2}</strong>${doublePart}`;
  }

  function renderAll() {
    if (!state) return;
    renderBoard();
    renderPlayersPanel();
    renderActions();
    renderLog();
  }

  function animateRoll(d1, d2) {
    return new Promise((resolve) => {
      const el1 = $("#die1");
      const el2 = $("#die2");
      el1.classList.add("rolling");
      el2.classList.add("rolling");
      let ticks = 0;
      const iv = setInterval(() => {
        el1.querySelector("span").textContent = String(1 + Math.floor(Math.random() * 6));
        el2.querySelector("span").textContent = String(1 + Math.floor(Math.random() * 6));
        ticks++;
        if (ticks > 12) {
          clearInterval(iv);
          el1.classList.remove("rolling");
          el2.classList.remove("rolling");
          renderDice(d1, d2);
          resolve();
        }
      }, 55);
    });
  }

  async function doRoll() {
    if (busy || state.phase !== "roll") return;
    const p = currentPlayer();
    if (p.bankrupt || p.inJail === undefined) return;

    busy = true;
    renderActions();

    const d1 = 1 + Math.floor(Math.random() * 6);
    const d2 = 1 + Math.floor(Math.random() * 6);
    const isDouble = d1 === d2;

    await animateRoll(d1, d2);

    if (p.inJail) {
      if (isDouble) {
        p.inJail = false;
        p.jailTurns = 0;
        log(`${p.name} طلع توتا وهرب من السجن!`);
        await movePlayerSteps(p, d1 + d2, true);
      } else {
        p.jailTurns++;
        log(`${p.name} لم يطلع توتا في السجن (محاولة ${p.jailTurns}/٣).`);
        if (p.jailTurns >= 3) {
          p.inJail = false;
          p.jailTurns = 0;
          log(`${p.name} خرج من السجن بعد ٣ دورات.`);
        }
        state.phase = "postRoll";
        state.doublesStreak = 0;
        busy = false;
        saveGame();
        renderAll();
        return;
      }
    } else {
      await movePlayerSteps(p, d1 + d2, true);
    }

    if (isDouble && !p.bankrupt && !p.inJail) {
      state.doublesStreak++;
      if (state.doublesStreak >= MAX_DOUBLES) {
        log(`${p.name} توتا ٣ مرات — اذهب إلى السجن!`);
        sendToJail(p);
        state.doublesStreak = 0;
        state.phase = "postRoll";
      } else {
        state.extraRollFromDoubles = true;
        state.phase = "roll";
        log(`${p.name} توتا — ارمِ مرة أخرى!`);
      }
    } else {
      state.doublesStreak = 0;
      state.extraRollFromDoubles = false;
      state.phase = "postRoll";
    }

    busy = false;
    saveGame();
    renderAll();
    checkWinner();
    scheduleCpuTurn();
  }

  function payJailAndRoll() {
    const p = currentPlayer();
    if (!p.inJail || state.phase !== "roll" || busy) return;
    if (!tryPay(p, JAIL_BAIL, "فدية السجن")) {
      renderAll();
      return;
    }
    log(`${p.name} دفع ${fmt(JAIL_BAIL)} وخرج من السجن.`);
    p.inJail = false;
    p.jailTurns = 0;
    saveGame();
    renderAll();
  }

  async function movePlayerSteps(player, steps, collectPass) {
    if (player.bankrupt) return;
    const dir = steps >= 0 ? 1 : -1;
    const total = Math.abs(steps);
    if (steps > 0 && collectPass && player.position + steps >= BOARD_LEN) {
      player.money += PASS_START_BONUS;
      log(`${player.name} مرّ على البداية (+${fmt(PASS_START_BONUS)}).`);
    }
    for (let s = 0; s < total; s++) {
      player.position = (player.position + dir + BOARD_LEN) % BOARD_LEN;
      state.focusCell = player.position;
      renderBoard();
      renderPlayersPanel();
      await delay(MOVE_STEP_MS);
    }
    await delay(180);
    await resolveLanding(player);
  }

  function sendToJail(player) {
    player.position = JAIL_INDEX;
    player.inJail = true;
    player.jailTurns = 0;
    state.focusCell = JAIL_INDEX;
    renderBoard();
  }

  async function resolveLanding(player) {
    if (player.bankrupt) return;
    const idx = player.position;
    const cell = cells[idx];

    switch (cell.type) {
      case "start":
        log(`${player.name} على البداية.`);
        break;
      case "property":
        await handleProperty(player, idx, cell);
        break;
      case "chance":
        await drawChance(player);
        break;
      case "tax":
        log(`${player.name} يدفع ضريبة ${fmt(cell.amount)}.`);
        tryPay(player, cell.amount, "الضريبة");
        break;
      case "jail":
        log(`${player.name} زيارة للسجن فقط.`);
        break;
      case "free":
        log(`${player.name} استراحة — لا شيء.`);
        break;
      case "gojail":
        log(`${player.name} اذهب إلى السجن!`);
        sendToJail(player);
        break;
      default:
        break;
    }
    saveGame();
    renderAll();
  }

  function delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function handleProperty(player, idx, cell) {
    const ownerId = state.owners[idx];
    if (ownerId == null) {
      let ok = false;
      if (player.isCpu) {
        await delay(350);
        ok = cpuShouldBuy(player, cell);
      } else {
        ok = await confirmDialog(
          `<h3>${cell.name}</h3>
        <p>السعر: <strong>${fmt(cell.price)}</strong> · الإيجار: ${fmt(cell.rent)}</p>
        <p>هل تشتري هذه المدينة؟</p>`,
          [
            { label: "شراء", primary: true, value: true },
            { label: "تخطي", value: false },
          ]
        );
      }
      if (ok && player.money >= cell.price) {
        player.money -= cell.price;
        state.owners[idx] = player.id;
        log(`${player.name} اشترى ${cell.name} بـ ${fmt(cell.price)}.`);
      } else if (ok) {
        log(`${player.name} لا يملك مالاً كافياً لشراء ${cell.name}.`);
      } else {
        log(`${player.name} تخطى شراء ${cell.name}.`);
      }
    } else if (ownerId === player.id) {
      log(`${player.name} على مدينته ${cell.name}.`);
    } else {
      const owner = state.players[ownerId];
      if (owner.bankrupt) {
        state.owners[idx] = null;
        return handleProperty(player, idx, cell);
      }
      log(`${player.name} يدفع إيجار ${fmt(cell.rent)} لـ ${owner.name}.`);
      transferMoney(player, owner, cell.rent, "الإيجار");
    }
  }

  async function drawChance(player) {
    const card = chanceCards[Math.floor(Math.random() * chanceCards.length)];
    log(`🃏 ${player.name}: ${card.text}`);
    await applyChance(player, card);
  }

  async function applyChance(player, card) {
    switch (card.effect) {
      case "goStart":
        player.position = START_INDEX;
        player.money += PASS_START_BONUS;
        renderBoard();
        break;
      case "gain":
        player.money += card.amount;
        break;
      case "pay":
        tryPay(player, card.amount, "كرت الحظ");
        break;
      case "jail":
        sendToJail(player);
        break;
      case "move":
        await movePlayerSteps(player, card.steps, card.steps > 0);
        break;
      case "collectAll":
        activePlayers().forEach((other) => {
          if (other.id !== player.id) {
            transferMoney(other, player, card.amount, "كرت الحظ");
          }
        });
        break;
      case "nearestOrMoney": {
        let found = false;
        for (let d = 1; d < BOARD_LEN; d++) {
          const next = (player.position + d) % BOARD_LEN;
          if (cells[next].type === "property" && state.owners[next] == null) {
            player.position = next;
            found = true;
            renderBoard();
            await resolveLanding(player);
            break;
          }
        }
        if (!found) player.money += 200;
        break;
      }
      default:
        break;
    }
  }

  function confirmDialog(html, buttons) {
    return new Promise((resolve) => {
      const dlg = $("#action-dialog");
      const body = $("#action-dialog-body");
      body.innerHTML = html + '<div class="modal-actions" id="dlg-actions"></div>';
      const actions = body.querySelector("#dlg-actions");
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      buttons.forEach((b) => {
        const btn = mkBtn(b.label, b.primary ? "btn-primary" : "btn-secondary", () => {
          finish(b.value);
          dlg.close();
        });
        actions.appendChild(btn);
      });
      dlg.addEventListener("cancel", () => finish(false), { once: true });
      dlg.addEventListener("close", () => finish(false), { once: true });
      dlg.showModal();
    });
  }

  function endTurn() {
    if (state.phase !== "postRoll" || busy) return;
    state.currentPlayerIndex = nextPlayerIndex(state.currentPlayerIndex);
    state.phase = "roll";
    state.doublesStreak = 0;
    state.extraRollFromDoubles = false;
    renderDice(null, null);
    saveGame();
    renderAll();
    scheduleCpuTurn();
  }

  function startGame(configs, resumeState) {
    state = resumeState ? normalizeSavedState(resumeState) : createInitialState(configs);
    if (!state.log) state.log = [];
    if (!state.owners || state.owners.length !== BOARD_LEN) {
      state.owners = new Array(BOARD_LEN).fill(null);
    }
    if (state.focusCell == null) state.focusCell = state.players[0]?.position ?? 0;
    busy = false;
    saveGame();
    showScreen("game");
    renderDice(null, null);
    renderAll();
    scheduleCpuTurn();
  }

  function setupListeners() {
    document.querySelectorAll(".count-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".count-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        selectedCount = Number(btn.dataset.count);
        renderNameFields();
      });
    });

    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        gameMode = btn.dataset.mode;
        syncSetupModeUi();
      });
    });

    document.querySelectorAll(".cpu-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".cpu-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        cpuOpponents = Number(btn.dataset.cpu);
      });
    });

    $("#btn-start").addEventListener("click", () => {
      clearSave();
      startGame(buildPlayerConfigs(), null);
    });

    $("#btn-resume").addEventListener("click", () => {
      const saved = loadGame();
      if (saved && !saved.winnerId) startGame([], saved);
      else if (saved && saved.winnerId) {
        state = saved;
        showWin(state.players[state.winnerId]);
      }
    });

    const newGame = () => {
      if (confirm("بدء لعبة جديدة؟ سيتم مسح التقدم المحفوظ.")) {
        clearSave();
        state = null;
        showScreen("setup");
      }
    };
    $("#btn-new-game").addEventListener("click", newGame);
    $("#btn-win-new").addEventListener("click", () => {
      clearSave();
      state = null;
      showScreen("setup");
    });
    $("#btn-win-home").addEventListener("click", () => {
      showScreen("setup");
    });

    const rules = $("#rules-dialog");
    $("#btn-rules-setup").addEventListener("click", () => rules.showModal());
    $("#btn-rules-game").addEventListener("click", () => rules.showModal());

    $("#log-toggle").addEventListener("click", () => {
      $("#game-log").classList.toggle("collapsed");
    });

    $("#btn-appearance-game")?.addEventListener("click", openAppearanceDialog);
  }

  function fillAccentSwatches(container) {
    if (!container || container.childElementCount) return;
    ACCENT_SWATCHES.forEach((a) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "swatch";
      b.dataset.accent = a.id;
      b.style.background = a.color;
      b.title = a.id;
      b.setAttribute("aria-label", `لون ${a.id}`);
      container.appendChild(b);
    });
  }

  function initAppearancePanel() {
    document.querySelectorAll(".accent-swatches-host").forEach(fillAccentSwatches);
    applyAppearance(loadAppearance());
    bindAppearanceControls();
  }

  function init() {
    try {
      if (!document.querySelector("#screen-setup")) {
        throw new Error("واجهة اللعبة غير مكتملة");
      }
      document.documentElement.dataset.theme = document.documentElement.dataset.theme || "dark";
      document.documentElement.dataset.accent = document.documentElement.dataset.accent || "gold";
      initAppearancePanel();
      renderNameFields();
      setupListeners();
      if (loadGame()) $("#btn-resume").classList.remove("hidden");
    } catch (err) {
      console.error(err);
      document.body.insertAdjacentHTML(
        "afterbegin",
        `<div style="background:#e94560;color:#fff;padding:1rem;text-align:center;font-family:Tahoma">
          تعذّر تشغيل اللعبة: ${err.message}<br>جرّب النقر على <strong>شغّل-اللعبة.bat</strong> في نفس المجلد.
        </div>`
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

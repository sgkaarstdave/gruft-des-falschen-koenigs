const app = document.querySelector("#app"),
  toast = document.querySelector("#message"),
  status = document.querySelector("#status");
const read = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {}
};
const key =
  read("gruft.key") ||
  Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
save("gruft.key", key);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const params = new URLSearchParams(location.search);
let state = null,
  busy = false,
  draft = "",
  errorTimer,
  connection = "";
const btn = (text, type, disabled = false) =>
  `<button type="button" data-type="${type}" ${disabled ? "disabled" : ""}>${text}</button>`;
function error(text) {
  toast.textContent = text;
  toast.hidden = false;
  clearTimeout(errorTimer);
  errorTimer = setTimeout(() => (toast.hidden = true), 6500);
}
async function api(code, body) {
  const res = await fetch(
    "/api/room" + (code ? "/" + encodeURIComponent(code) : ""),
    {
      method: body ? "POST" : "GET",
      headers: {
        "X-Gruft-Key": key,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  );
  const data = await res.json();
  if (!res.ok) throw Error(data.error || "Verbindung fehlgeschlagen.");
  return data;
}
async function action(body, code = state?.code) {
  if (busy) return;
  busy = true;
  try {
    if (
      [
        "act",
        "use",
        "skill",
        "loot",
        "talent",
        "give",
        "buy",
        "attack",
        "defend",
      ].includes(body.type) &&
      state?.code === code
    ) {
      const latest = await api(code);
      if (latest.room.id !== state.room.id || latest.pending) {
        state = latest;
        render();
        throw Error(
          "Die Szene hat sich geändert. Prüfe deine Idee und sende sie erneut.",
        );
      }
      state = latest;
    }
    state = await api(code, {
      ...body,
      expected: state?.code === code ? state.version : undefined,
    });
    connection = "";
    save("gruft.room", state.code);
    history.replaceState({}, "", "/?room=" + state.code);
    if (body.type === "act") draft = "";
    render();
  } catch (e) {
    error(e.message);
    if (state) {
      try {
        state = await api(state.code);
        render();
      } catch {}
    }
  } finally {
    busy = false;
  }
}
const share = () => location.origin + "/?join=" + state.code;
function qr() {
  const q = new (qrLoader("./index"))(-1, qrLoader("./QRErrorCorrectLevel").M);
  q.addData(share());
  q.make();
  let d = "";
  const n = q.getModuleCount();
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      if (q.isDark(y, x)) d += `M${x + 4} ${y + 4}h1v1h-1z`;
  return `<img class="qr" alt="QR-Code zum Beitreten" src="data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 8} ${n + 8}"><rect width="100%" height="100%" fill="white"/><path d="${d}"/></svg>`)}">`;
}
let tab = "chat",
  targetId = "",
  rolling = false;
const button = (text, type, value = "", disabled = false, cls = "") =>
  `<button type="button" class="${cls}" data-type="${type}" data-value="${esc(value)}" ${disabled ? "disabled" : ""}>${esc(text)}</button>`;
const bar = (n, max, cls = "") =>
  `<progress class="${cls}" max="${max}" value="${n}">${n}/${max}</progress>`;
const chip = (t) => `<span class="chip">${esc(t)}</span>`;
function home() {
  return `<section class="landing"><div class="eyebrow">Dungeon-Crawler · 2–6 Freunde · online</div><h1>Die Gruft des<br><em>falschen Königs.</em></h1><p>Wählt eure Klasse. Plündert die Gruft.<br>Überlebt Günthers Bürokratie und eure eigenen Skills.</p><div class="controls">${button("Auf dem Tablet öffnen", "create")}${button("Allein ausprobieren", "solo", "", "", "secondary")}</div><div class="landing-tags">${chip("13 Räume & Geheimgänge")}${chip("6 Klassen")}${chip("Monster & Beute")}${chip("Virtueller W20")}${chip("Charakterentwicklung")}</div></section><div class="lobby-grid"><section class="card"><h2>Mit dem Handy beitreten</h2>${joinForm(params.get("join") || "")}</section><section class="card"><h2>Ein Raum. Eure Truppe.</h2><p>Das Tablet zeigt den Dungeon. Auf dem Handy findest du deinen Helden, Rucksack, Skills, die wachsende Karte und den gemeinsamen Chat.</p><p>Riskante Aktionen zeigen vor dem virtuellen Wurf ihre Erfolgschance und Folgen. Ihr entscheidet, ob ihr das riskiert.</p>${read("gruft.room") ? button("Letzte Runde fortsetzen", "resume", "", "", "secondary") : ""}</section></div>`;
}
function joinForm(code) {
  return `<form id="join"><label for="code">Raumcode</label><input id="code" name="code" value="${esc(code)}" maxlength="6" required placeholder="ABC234" autocapitalize="characters"><label for="alias">Dein Heldenname</label><input id="alias" name="alias" maxlength="24" required autocomplete="nickname" placeholder="Dave von der traurigen Panade"><button>Beitreten</button></form>`;
}
function partyCards() {
  return `<div class="party-cards">${state.players
    .map((p) => {
      const c = state.classes[p.classId];
      return `<div class="party-mini ${p.down ? "down" : ""}"><div><strong>${esc(p.alias)}</strong><small>${c ? esc(c.name) + " · Stufe " + p.level : "Wählt eine Klasse …"}</small></div>${c ? `<div class="mini-hp">${p.hp}/${p.maxHp} LP${bar(p.hp, p.maxHp)}</div>` : ""}</div>`;
    })
    .join("")}</div>`;
}
function lobby() {
  const ready =
    state.players.length >= (state.solo ? 1 : 2) &&
    state.players.every((p) => p.classId);
  return `<div class="eyebrow">Expedition I · Die Kündigung des Königs</div><h1>Wer steigt hinab?</h1><div class="lobby-grid"><section class="card">${
    state.me
      ? `<h2>${esc(state.me.alias)}, wähle deine Klasse</h2><p>Jeder Held hat eigene Attribute, Ausrüstung und zwei Skills. Der zweite Skill wird auf Stufe 2 frei.</p><div class="class-grid">${Object.entries(
          state.classes,
        )
          .map(
            ([id, c]) =>
              `<button class="class-card ${state.me.classId === id ? "selected" : ""}" data-type="choose" data-value="${id}"><span class="class-sigil">${c.glyph}</span><strong>${esc(c.name)}</strong><small>${esc(c.title)}</small><p>${esc(c.about)}</p><div>${c.hp} LP · ${c.stats.map((n, i) => ["K", "G", "M"][i] + " " + n).join(" · ")}</div></button>`,
          )
          .join("")}</div>`
      : `<h2>Das Tablet ist eure Bühne</h2><div class="code">${esc(state.code)}</div>${qr()}<p>Handys scannen den QR-Code und wählen ihren Helden. Danach startet ihr auf einem Handy.</p><input aria-label="Einladungslink" readonly value="${esc(share())}">${button("Link kopieren", "copy", "", "", "secondary")}`
  }</section><section class="card"><h2>Eure Truppe · ${state.players.length}/6</h2>${partyCards()}<p>Monsterstärke wächst mit der Gruppengröße. Raumwechsel entscheidet die Mehrheit. Im Kampf handelt ihr reihum, Untersuchungen sind kostenlos.</p>${state.me ? button("In die Gruft!", "start", "", !ready) : "<p>Warte auf den Aufbruch der Spieler.</p>"}</section></div>`;
}
function monsterPanel(table = false) {
  const c = state.combat;
  if (!c) return "";
  return `<section class="monster-panel"><div class="monster-title"><div><span class="eyebrow">Runde ${c.round} · ${esc(c.turn)} am Zug</span><h2>${esc(c.enemy.name)}</h2><small>${esc(c.enemy.title)}</small></div><b>${c.enemy.hp}/${c.enemy.maxHp}<small>LP</small></b></div>${bar(c.enemy.hp, c.enemy.maxHp, "enemy-progress")}<div class="intent"><strong>${c.stun ? "Angriff unterbrochen" : esc(c.intent.name)}</strong><span>→ ${esc(c.intent.targets.join(", "))} · ${c.intent.damage} Basisschaden</span><small>Nach euren Zügen. Rüstung, Verteidigung und Gruppenschutz werden abgezogen.${c.shield ? " Gruppenschutz: " + c.shield + "." : ""}</small></div></section>`;
}
function diceResult() {
  const r = state.lastRoll;
  if (!r) return "";
  return `<div class="roll-result ${r.success ? "success" : "failure"}"><span class="die-face">${r.die}</span><div><strong>${esc(r.actor)} · ${esc(r.name)}</strong><div>W20 ${r.die} + ${r.bonus} = ${r.total} / Ziel ${r.dc} · ${r.success ? "Erfolg" : "Fehlschlag"}</div></div></div>`;
}
function dungeonPlan(compact=false){
 const m=state.map;if(!m)return '';
 const point=id=>m.nodes.find(n=>n.id===id);
 const x=n=>45+n.x*80,y=n=>40+n.y*70;
 return `<section class="dungeon-plan ${compact?'compact-map':''}"><h2>Dungeonkarte · ${m.visited}/${m.total}</h2><p class="map-seals">${state.objectives.map(o=>`${o.done?'●':'○'} ${esc(o.name)}`).join(' · ')}</p><svg viewBox="0 0 670 290" role="img" aria-label="Entdeckte Räume und verbundene Gänge. Der aktuelle Raum ist gold markiert.">${m.edges.map(e=>{const a=point(e.from),b=point(e.to);return `<line x1="${x(a)}" y1="${y(a)}" x2="${x(b)}" y2="${y(b)}" class="${e.locked?'locked-path':'open-path'}"/>`;}).join('')}${m.nodes.map(n=>`<g class="map-node ${n.current?'current':n.visited?'visited':'unknown'}"><circle cx="${x(n)}" cy="${y(n)}" r="15"/><text x="${x(n)}" y="${y(n)+5}">${n.current?'◆':n.visited?(n.clear?'✓':'!'):'?'}</text><text class="map-label" x="${x(n)}" y="${y(n)+31}">${esc(n.visited?n.id:'?')}</text></g>`).join('')}</svg><p>◆ Hier seid ihr · ? unerforscht · gestrichelt: gesperrt</p>${compact?'':`<ol class="map-rooms">${m.nodes.filter(n=>n.visited).map(n=>`<li>${esc(n.name)}${n.current?' · aktueller Raum':''}</li>`).join('')}</ol><h3>Wege aus diesem Raum</h3>${state.room.paths.map(p=>`<p><strong>${esc(p.name)}</strong>${p.locked?`<br>${esc(p.locked)}`:' · zugänglich'}</p>`).join('')}<p>Raumwechsel sprecht ihr im Chat ab. Die Mehrheit entscheidet.</p>`}</section>`;
}
function tablet(){return `<div class="table-main"><section class="stage"><img class="room-art" src="/art/${esc(state.room.image)}.webp" alt="${esc(state.room.name)} mit ${esc(state.room.objects.join(', '))}"><div class="stage-heading"><span class="eyebrow">Die Kündigung des Königs · Raum ${state.map?.visited??state.explored.length}/${state.map?.total??13}</span><h1>${esc(state.room.name)}</h1></div></section><aside class="table-sidebar">${monsterPanel(true)}${diceResult()}${dungeonPlan(true)}<div class="table-party">${partyCards()}</div></aside></div><section class="narration" aria-live="polite"><p>${esc(state.narration)}</p>${state.pending?`<div class="pending-line">${esc(state.pending.actor)} bereitet ${esc(state.pending.name)} vor · ${state.pending.chance}% Erfolg</div>`:''}</section><footer class="table-footer">${state.status==='won'?'Krone geborgen!':state.status==='lost'?'Expedition gescheitert.':'Handys sind am Zug'} · Raum ${esc(state.code)} · Sichtbar: ${esc(state.room.objects.join(' · '))}</footer>`;}
function targetSelect() {
  return `<label>Ziel<select name="target" aria-label="Ziel wählen">${state.players.map((p) => `<option value="${p.id}" ${targetId === p.id || (!targetId && p.self) ? "selected" : ""}>${esc(p.alias)}${p.self ? " (du)" : ""} · ${p.hp}/${p.maxHp} LP</option>`).join("")}</select></label>`;
}
function hero() {
  const p = state.me,
    c = state.classes[p.classId];
  const unlocked = [c.skill, c.advanced].map((k) => state.skills[k]);
  return `<section class="hero-banner"><div class="hero-sigil">${c.glyph}</div><span class="eyebrow">Stufe ${p.level} · ${esc(c.name)}</span><h1>${esc(p.alias)}</h1><p>${esc(c.title)}</p><div class="resource-grid"><div><strong>${p.hp}/${p.maxHp}</strong><small>Lebenspunkte</small>${bar(p.hp, p.maxHp)}</div><div><strong>${p.focus}/${p.maxFocus}</strong><small>Fokus</small>${bar(p.focus, p.maxFocus, "focus-progress")}</div></div>${p.down ? '<p class="danger">Du liegst am Boden. Ein Freund kann dich heilen oder aufhelfen.</p>' : ""}</section><section class="card"><h2>Deine Attribute</h2><div class="stat-grid">${p.stats.map((n, i) => `<div><b>+${n}</b><small>${["Kraft", "Geschick", "Magie"][i]}</small></div>`).join("")}</div><p>${p.xp} EP ${p.nextXp ? "· nächste Stufe bei " + p.nextXp : "· Höchststufe dieser Expedition"} · ${p.gold} Gold</p>${p.nextXp ? bar(p.xp, p.nextXp, "focus-progress") : ""}<p>Waffe: <strong>${esc(p.weapon)}</strong><br>Rüstung: <strong>${esc(p.armor || "Keine")}</strong><br>Zusatzschaden: +${p.damageBonus}${p.pet ? " · Begleiter: +1 Schaden" : ""}</p></section>${
    p.points
      ? `<section class="card"><div class="eyebrow">${p.points} Talentpunkt${p.points !== 1 ? "e" : ""} verfügbar</div><h2>Entwickle deinen Helden</h2><p>Talente wählt ihr zwischen Kämpfen. Jeder Punkt wird dauerhaft für diese Runde eingesetzt.</p><div class="talent-grid">${[
          ["kraft", "+1 Kraft"],
          ["geschick", "+1 Geschick"],
          ["magie", "+1 Magie"],
          ["vital", "+4 maximale LP"],
          ["schaden", "+1 Angriffsschaden"],
        ]
          .map(([id, t]) =>
            button(
              t,
              "talent",
              id,
              Boolean(state.combat || state.pending),
              "secondary",
            ),
          )
          .join("")}</div></section>`
      : ""
  }<section class="card"><h2>Deine Entwicklung</h2><p>Stufe 2: zweiter Klassenskill. Jeder Aufstieg: +3 maximale LP, +1 Hauptattribut, ein Talentpunkt.</p><p>${p.talents.length ? "Gewählte Talente: " + esc(p.talents.join(", ")) : "Deine Geschichte beginnt gerade erst."}</p></section>`;
}
function inventory() {
  const p = state.me;
  return `<section class="card"><span class="eyebrow">${p.gold} Gold · ${p.bag.length} Gegenstände</span><h2>Dein Rucksack</h2><p>Ausrüstung wechselt ihr zwischen Kämpfen. Heilmittel und Fokusbrause kosten im Kampf deinen Zug.</p>${[
    ...new Set(p.bag),
  ]
    .map((item) => {
      const it = state.items[item],
        equipped = p.weapon === item || p.armor === item;
      return `<article class="inventory-item"><div class="item-title"><strong>${esc(item)}</strong><span>×${p.bag.filter((x) => x === item).length}${equipped ? " · ausgerüstet" : ""}</span></div><p>${esc(it.desc)}</p>${["heal", "focus"].includes(it.kind) ? `<form data-use="${esc(item)}">${targetSelect()}<button ${state.pending || p.down || (state.combat && !state.combat.mine) ? "disabled" : ""}>Einsetzen</button></form>` : ["weapon", "armor"].includes(it.kind) ? button(equipped ? "Ausgerüstet" : "Ausrüsten", "equip", item, Boolean(equipped || state.combat || state.pending), "secondary") : ""}${it.kind === "armor" && equipped ? button("Rüstung ablegen", "unequip", "armor", Boolean(state.combat || state.pending), "secondary") : ""}${
        !state.combat && !equipped && state.players.length > 1
          ? `<details><summary>Weitergeben</summary><form data-give="${esc(item)}"><select name="target" aria-label="Empfänger">${state.players
              .filter((a) => !a.self)
              .map((a) => `<option value="${a.id}">${esc(a.alias)}</option>`)
              .join("")}</select><button>Geben</button></form></details>`
          : ""
      }</article>`;
    })
    .join(
      "",
    )}</section><section class="card"><h2>Beute im Raum</h2>${state.loot.length ? state.loot.map((item) => `<article class="inventory-item"><strong>${esc(item)}</strong><p>${esc(state.items[item].desc)}</p>${button("Aufnehmen", "loot", item, Boolean(state.combat || state.pending), "secondary")}</article>`).join("") : "<p>Hier liegt gerade keine freie Beute.</p>"}</section>${
    state.shop
      ? `<section class="card"><h2>Buffet gegen Bares</h2><p>Die Braut verkauft Vorräte für den Bosskampf.</p>${Object.entries(
          state.shop,
        )
          .map(([item, cost]) =>
            button(
              item + " · " + cost + " Gold",
              "buy",
              item,
              p.gold < cost,
              "secondary",
            ),
          )
          .join(" ")}</section>`
      : ""
  }<section class="card"><h2>Gemeinsame Questgegenstände</h2><p>${esc(state.quest.join(" · ") || "Noch keine gefunden.")}</p></section>`;
}
function skills() {
  const p = state.me,
    c = state.classes[p.classId];
  return `<section class="card"><div class="eyebrow">${p.focus}/${p.maxFocus} Fokus · ${esc(c.name)}</div><h2>Deine Skills</h2><p>Schutz und Heilung wirken direkt. Angriffs-Skills zeigen zuerst einen Würfelplan mit Chance und Risiko. Verteidigen im Kampf stellt 1 Fokus wieder her.</p>${[
    c.skill,
    c.advanced,
  ]
    .map((id) => {
      const sk = state.skills[id],
        locked = p.level < sk.level;
      return `<article class="skill-card ${sk.backlash ? "risky" : ""}"><div class="item-title"><h3>${esc(sk.name)}</h3><span>${sk.cost} Fokus</span></div><p>${esc(sk.desc)}</p>${locked ? '<p class="muted">Wird auf Stufe 2 freigeschaltet.</p>' : `<form data-skill="${id}">${sk.kind === "heal" ? targetSelect() : ""}<button ${state.pending || p.down || p.focus < sk.cost || (state.combat && !state.combat.mine) ? "disabled" : ""}>${["attack", "risk", "tame"].includes(sk.kind) ? "Einsatz vorbereiten" : "Skill einsetzen"}</button></form>`}</article>`;
    })
    .join("")}</section>`;
}
function pendingPanel() {
  const q = state.pending;
  if (!q) return "";
  return `<section class="dice-plan ${q.downside.includes("Jeder") ? "risky" : ""}" role="region" aria-label="Würfelplan"><div class="eyebrow">${esc(q.actor)} · virtueller W20</div><h2>${esc(q.name)}</h2><div class="dice-equation">W20 + ${q.bonus} <span>gegen ${q.dc}</span><b>${q.chance}%</b></div><p><strong>Erfolg:</strong> ${esc(q.success)}</p><p class="risk-copy"><strong>Fehlschlag:</strong> ${esc(q.downside)}</p><p>${q.cost} Fokus · Verbrauch erst beim Würfeln</p>${q.mine ? `<div class="dice-controls">${button(rolling ? "Würfelt …" : "🎲 Jetzt würfeln", "roll", "", rolling)}${button("Abbrechen", "cancel", "", rolling, "secondary")}</div>` : "<p>Wartet auf den Wurf des aktiven Helden.</p>"}</section>`;
}
function chat() {
  const p = state.me;
  const finished = ["won", "lost"].includes(state.status);
  return `${monsterPanel()}${diceResult()}<section id="chat" class="chat" role="log" aria-label="Gemeinsamer Spielverlauf">${state.messages.map((m) => `<article class="chat-message ${m.who === "Spielleitung" ? "narrator" : "player"}"><div class="speaker">${esc(m.who)}</div><p>${esc(m.text)}</p></article>`).join("")}</section>${state.pending ? pendingPanel() : finished ? `<section class="composer"><strong>${state.status === "won" ? "Die Krone gehört euch." : "Die Gruft hat gewonnen."}</strong><p>Charaktere und Rucksäcke bleiben in ihren Tabs sichtbar.</p>${button("Neue Expedition", "exit")}</section>` : `<form id="idea" class="composer"><label for="phrase">${state.combat ? (state.combat.mine ? "Du bist am Zug" : "Aktiv: " + esc(state.combat.turn) + " · Untersuchen geht trotzdem") : "Was tust du, " + esc(p.alias) + "?"}</label><div class="send-row"><textarea id="phrase" name="idea" maxlength="500" required rows="2" placeholder="Ich untersuche die Kettenwinde …">${esc(draft)}</textarea><button>Senden</button></div></form>`}`;
}
function phone() {
  const p = state.me;
  return `<div class="phone-top"><div><span class="eyebrow">${esc(state.room.name)}</span><small>${esc(state.classes[p.classId].name)} · Stufe ${p.level}</small></div><div class="phone-vitals"><b>${p.hp}/${p.maxHp} LP</b><small>${p.focus}/${p.maxFocus} Fokus</small></div></div><nav class="phone-nav" aria-label="Heldenansicht">${[
    ["chat", "Chat"],
    ["hero", "Held"],
    ["bag", "Rucksack"],
    ["skills", "Skills"],
    ["map", "Karte"],
  ]
    .map(
      ([id, name]) =>
        `<button data-tab="${id}" aria-current="${tab === id ? "page" : "false"}">${name}${id === "hero" && p.points ? " •" : ""}${id === "bag" && state.loot.length ? " •" : ""}</button>`,
    )
    .join(
      "",
    )}</nav><details class="room-context"><summary>Raum, Wege & Beute</summary><p>Sichtbar: ${esc(state.room.objects.join(", "))}</p><p>Wege: ${esc(state.room.paths.map((p) => p.name).join(" · "))}</p><p>Freie Beute: ${esc(state.loot.join(", ") || "keine")}</p></details><div class="phone-content ${tab === "chat" ? "chat-tab" : ""}">${tab === "hero" ? hero() : tab === "bag" ? inventory() : tab === "skills" ? skills() : tab === "map" ? dungeonPlan() : chat()}</div>${tab !== "chat" && state.pending ? pendingPanel() : ""}`;
}
function render() {
  const active = document.activeElement,
    focused = active?.id,
    sel = active?.selectionStart;
  const chatEl = document.querySelector("#chat");
  const near =
    !chatEl ||
    chatEl.scrollHeight - chatEl.scrollTop - chatEl.clientHeight < 110;
  const old = chatEl?.scrollTop ?? 0;
  document.body.classList.toggle(
    "table-mode",
    Boolean(state && !state.me && state.status !== "lobby" && !state.legacy),
  );
  document.body.classList.toggle(
    "phone-mode",
    Boolean(state?.me && state.status !== "lobby" && !state.legacy),
  );
  document.body.classList.toggle("rolling", rolling);
  status.textContent =
    connection ||
    (state
      ? "Raum " + state.code + (state.me ? " · " + state.me.alias : " · Tablet")
      : "Dungeon-Crawler · Online");
  app.innerHTML = !state
    ? home()
    : state.legacy
      ? '<section class="card"><h1>Neue Expedition bereit</h1><p>Dieser Raum stammt aus der früheren Version. Öffnet einen neuen Raum für Klassen, Monster und virtuellen Würfel.</p>' +
        button("Neuen Raum öffnen", "exit") +
        "</section>"
      : state.status === "lobby"
        ? lobby()
        : state.me
          ? phone()
          : tablet();
  const next = document.querySelector("#chat");
  if (next) next.scrollTop = near ? next.scrollHeight : old;
  if (focused) {
    const field = document.getElementById(focused);
    if (field) {
      field.focus({ preventScroll: true });
      if (typeof sel === "number" && field.type !== "number")
        field.setSelectionRange(sel, sel);
    }
  }
}
app.addEventListener("input", (e) => {
  if (e.target.id === "phrase") draft = e.target.value;
});
app.addEventListener("change", (e) => {
  if (e.target.name === "target") targetId = e.target.value;
});
app.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target,
    d = Object.fromEntries(new FormData(f));
  if (f.id === "join")
    return action(
      { type: "join", alias: d.alias },
      d.code.trim().toUpperCase(),
    );
  if (f.id === "idea") return action({ type: "act", idea: d.idea });
  if (f.dataset.use)
    return action({ type: "use", item: f.dataset.use, target: d.target });
  if (f.dataset.give)
    return action({ type: "give", item: f.dataset.give, target: d.target });
  if (f.dataset.skill)
    return action({ type: "skill", skill: f.dataset.skill, target: d.target });
});
app.addEventListener("click", async (e) => {
  const tabBtn = e.target.closest("[data-tab]");
  if (tabBtn) {
    tab = tabBtn.dataset.tab;
    render();
    return;
  }
  const el = e.target.closest("[data-type]");
  if (!el) return;
  const { type, value } = el.dataset;
  if (type === "create" || type === "solo") {
    if (busy) return;
    busy = true;
    try {
      state = await api(null, { solo: type === "solo" });
      if (type === "solo")
        state = await api(state.code, { type: "join", alias: "Entdecker" });
      save("gruft.room", state.code);
      history.replaceState({}, "", "/?room=" + state.code);
      render();
    } catch (err) {
      error(err.message);
    } finally {
      busy = false;
    }
    return;
  }
  if (type === "exit") {
    state = null;
    draft = "";
    tab = "chat";
    history.replaceState({}, "", "/");
    render();
    return;
  }
  if (type === "resume") return resume(read("gruft.room"));
  if (type === "copy") {
    try {
      await navigator.clipboard.writeText(share());
      error("Einladungslink kopiert.");
    } catch {
      error("Kopiere den Link aus dem Feld.");
    }
    return;
  }
  if (type === "roll") {
    if (busy || rolling) return;
    rolling = true;
    render();
    await Promise.all([
      action({ type: "roll" }),
      new Promise((r) => setTimeout(r, 650)),
    ]);
    rolling = false;
    render();
    return;
  }
  const field = {
    choose: "classId",
    talent: "talent",
    equip: "item",
    loot: "item",
    buy: "item",
    unequip: "slot",
  }[type];
  return action(
    field
      ? { type: type === "equip" ? "use" : type, [field]: value }
      : { type },
  );
});
async function resume(code) {
  try {
    state = await api(code);
    render();
  } catch (e) {
    error(e.message);
  }
}
render();
if (params.get("room")) resume(params.get("room"));
let polling = false;
setInterval(async () => {
  if (!state || busy || polling || document.hidden) return;
  polling = true;
  const code = state.code;
  try {
    const next = await api(code);
    if (
      state?.code === code &&
      !busy &&
      (next.version !== state.version || connection)
    ) {
      state = next;
      connection = "";
      render();
    }
  } catch {
    connection = "Verbindung unterbrochen · erneuter Versuch …";
    status.textContent = connection;
  } finally {
    polling = false;
  }
}, 1000);

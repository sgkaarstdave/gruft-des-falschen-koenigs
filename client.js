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
    if (body.type === "act" && state?.code === code) {
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
function home() {
  return `<section class="landing"><div class="eyebrow">Ein gemeinsames Abenteuer · 2–6 Helden</div><h1>Die Gruft des<br><em>falschen Königs.</em></h1><p>Drei Räume. Eine verschwundene Krone.<br>Und eine Hochzeitsgesellschaft, die seit 300 Jahren auf ihr Essen wartet.</p><div class="controls">${btn("Auf dem Tablet öffnen", "create")}${btn("Allein ausprobieren", "solo")}</div></section><section class="card"><h2>Auf dem Handy beitreten</h2>${joinForm(params.get("join") || "")}<p>Alle Geräte im gleichen WLAN. Das Tablet zeigt die Welt; eure Handys erzählen, was ihr tut.</p>${read("gruft.room") ? btn("Letzte Runde fortsetzen", "resume") : ""}</section>`;
}
function joinForm(code) {
  return `<form id="join"><label for="code">Raumcode</label><input id="code" name="code" value="${esc(code)}" maxlength="6" required placeholder="ABC234" autocapitalize="characters"><label for="alias">Dein Name</label><input id="alias" name="alias" maxlength="24" required autocomplete="nickname" placeholder="Wie heißt dein Held?"><button>Beitreten</button></form>`;
}
function lobby() {
  return `<div class="eyebrow">Kapitel I · Die letzte Einladung</div><h1>Vor dem Abstieg</h1><div class="lobby-grid"><section class="card"><h2>${state.me ? "Du bist dabei, " + esc(state.me.alias) : "Eure gemeinsame Bühne"}</h2>${state.me ? "<p>Beschreibt eure Handlungen später frei im Chat. Bei riskanten Versuchen fragt die Spielleitung nach einem echten W20.</p>" : `<div class="code">${esc(state.code)}</div>${qr()}<p>Mit jedem Spielerhandy scannen oder den Raumcode eingeben.</p><input aria-label="Einladungslink" readonly value="${esc(share())}">${btn("Link kopieren", "copy")}`}<p>Auftrag: Bergt die Krone. Untersucht Dinge, verhandelt und findet euren eigenen Weg.</p></section><section class="card"><h2>Eure Truppe · ${state.players.length}/6</h2><ul>${state.players.map((p) => `<li>${esc(p.alias)}${p.self ? " · du" : ""}</li>`).join("") || "<li>Die Gruft wartet auf euch …</li>"}</ul>${state.me ? btn("Gemeinsam aufbrechen", "start", state.players.length < (state.solo ? 1 : 2)) : "<p>Sobald mindestens zwei Helden da sind, startet ihr auf einem Handy. Danach bleibt das Tablet reine Ansicht.</p>"}</section></div>`;
}
function play() {
  const room = state.room;
  const scene = `<section class="stage"><img class="room-art" src="/art/${esc(room.image)}.webp" alt="${esc(room.intro)}"><div class="stage-heading"><span class="eyebrow">Kapitel I · Die letzte Einladung</span><h1>${esc(room.name)}</h1></div></section>`;
  const facts = `<div class="facts">${state.summary.map((t) => `<span>${esc(t)}</span>`).join("")}</div>`;
  if (!state.me)
    return (
      scene +
      `<section class="narration" aria-live="polite"><p>${esc(state.narration)}</p>${state.pending ? `<small>${esc(state.pending.actor)} würfelt · Ziel ${state.pending.dc}</small>` : ""}</section>` +
      facts +
      `<footer class="table-footer">${state.status === "won" ? "Abenteuer geschafft" : "Eure Handys sind am Zug"} · Raum ${esc(state.code)} · ${state.players.map((p) => esc(p.alias)).join(" · ")}</footer>`
    );
  const messages = state.messages
    .map(
      (m) =>
        `<article class="chat-message ${m.who === "Spielleitung" ? "narrator" : "player"}"><div class="speaker">${esc(m.who)}</div><p>${esc(m.text)}</p></article>`,
    )
    .join("");
  let composer = "";
  if (state.status === "won")
    composer =
      '<section class="card"><h2>Die Krone gehört euch.</h2><p>Öffnet eine neue Runde, um andere Wege auszuprobieren.</p>' +
      btn("Neue Runde", "exit") +
      "</section>";
  else if (state.pending)
    composer = state.pending.mine
      ? `<form id="dice" class="composer"><label for="die">${esc(state.pending.actor)} · W20 ab ${state.pending.dc}</label><div class="send-row"><input id="die" name="die" type="number" inputmode="numeric" min="1" max="20" required placeholder="1–20"><button>Wurf senden</button></div></form>`
      : `<div class="composer">${esc(state.pending.actor)} würfelt gerade. Eure nächste Idee wartet im Entwurf.</div>`;
  else
    composer = `<form id="idea" class="composer"><label for="phrase">Was tust du, ${esc(state.me.alias)}?</label><div class="send-row"><textarea id="phrase" name="idea" maxlength="500" required rows="2" placeholder="Beschreibe deine Idee …">${esc(draft)}</textarea><button>Senden</button></div></form>`;
  return `<div class="phone-heading"><span class="eyebrow">${esc(room.name)}</span><details><summary>Gemeinsamer Besitz · ${state.inventory.length}</summary><p>${esc(state.inventory.join(" · ") || "Noch nichts gefunden")}</p>${facts}</details></div><section id="chat" class="chat" role="log" aria-label="Gemeinsamer Spielverlauf">${messages}</section>${composer}`;
}
function render() {
  const active = document.activeElement;
  const focused = active?.id;
  const selection = active?.selectionStart;
  const die = focused === "die" ? active.value : null;
  const chat = document.querySelector("#chat");
  const nearBottom =
    !chat || chat.scrollHeight - chat.scrollTop - chat.clientHeight < 100;
  const oldScroll = chat?.scrollTop || 0;
  document.body.classList.toggle(
    "table-mode",
    Boolean(state && !state.me && state.status !== "lobby"),
  );
  document.body.classList.toggle(
    "phone-mode",
    Boolean(state?.me && state.status !== "lobby"),
  );
  status.textContent =
    connection ||
    (state
      ? "Raum " + state.code + (state.me ? " · " + state.me.alias : " · Tablet")
      : "Tablet + Handys · echter W20");
  app.innerHTML = state
    ? state.legacy
      ? "<h1>Neue Version bereit</h1><p>Dieser Spielstand gehört zum früheren Abenteuer.</p>" +
        btn("Neuen Gruppenraum öffnen", "exit")
      : state.status === "lobby"
        ? lobby()
        : play()
    : home();
  const nextChat = document.querySelector("#chat");
  if (nextChat)
    nextChat.scrollTop = nearBottom ? nextChat.scrollHeight : oldScroll;
  if (focused) {
    const next = document.getElementById(focused);
    if (next) {
      if (die !== null) next.value = die;
      next.focus({ preventScroll: true });
      if (typeof selection === "number" && next.type !== "number")
        next.setSelectionRange(selection, selection);
    }
  }
}
app.addEventListener("input", (e) => {
  if (e.target.id === "phrase") draft = e.target.value;
});
app.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  const d = Object.fromEntries(new FormData(f));
  if (f.id === "join")
    return action(
      { type: "join", alias: d.alias },
      d.code.trim().toUpperCase(),
    );
  if (f.id === "idea") return action({ type: "act", idea: d.idea });
  if (f.id === "dice") return action({ type: "roll", die: d.die });
});
app.addEventListener("click", async (e) => {
  const type = e.target.closest("[data-type]")?.dataset.type;
  if (!type) return;
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
  if (type === "start") return action({ type: "start" });
  if (type === "exit") {
    state = null;
    draft = "";
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
  }
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
if (params.get("room")) resume(params.get("room")); // join links keep the name form visible
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

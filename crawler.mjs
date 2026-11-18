import { dungeonHelp, dungeonHint } from './hints.mjs';
import { interpretDungeonInput, dungeonNormalize } from './language.mjs';
import { dungeonPatches, dungeonItems, dungeonAliases, dungeonPaths, dungeonGate, dungeonMap } from './dungeon.mjs';
// Crawler v2. All resources, turns, loot and dice are authoritative server state.
export const crawlerClasses = {
  ritter: {
    name: "Thekenritter",
    title: "Ritter der letzten Runde",
    glyph: "⚔",
    hp: 18,
    stats: [3, 1, 1],
    weapon: "Deckelschwert",
    skill: "deckel",
    advanced: "zapfen",
    about: "Zäher Beschützer. Dein Schild rettet die ganze Truppe.",
  },
  koch: {
    name: "Schlachtkoch",
    title: "Sous-Chef der Apokalypse",
    glyph: "♨",
    hp: 15,
    stats: [2, 2, 1],
    weapon: "Bratpfanne",
    skill: "suppe",
    advanced: "pfanne",
    about: "Heilt Freunde mit bedenklicher Suppe und brät Feinde knusprig.",
  },
  tinte: {
    name: "Tintenbändigerin",
    title: "Großmeisterin der Gärkunst",
    glyph: "✺",
    hp: 13,
    stats: [1, 2, 3],
    weapon: "Sporenfeder",
    skill: "furz",
    advanced: "zahmen",
    about:
      "Gewaltige Flächenmagie. Bei einem Fehlschlag leidet auch die Gruppe.",
  },
  monch: {
    name: "Nuggetmönch",
    title: "Erleuchteter im Backteig",
    glyph: "☾",
    hp: 15,
    stats: [1, 2, 3],
    weapon: "Flammenstab",
    skill: "glocke",
    advanced: "nugget",
    about:
      "Unterbricht schwere Angriffe und bringt Freunde zurück auf die Beine.",
  },
  hexe: {
    name: "Sonnenpakt-Hexe",
    title: "Beauftragte für Restwärme",
    glyph: "☀",
    hp: 13,
    stats: [1, 2, 3],
    weapon: "Sonnenstab",
    skill: "sonne",
    advanced: "supernova",
    about: "Magischer Schaden und ein riskantes Feuerwerk bei höheren Stufen.",
  },
  dieb: {
    name: "Pfandflaschen-Schurke",
    title: "Freiherr von Leergut",
    glyph: "◇",
    hp: 14,
    stats: [1, 3, 1],
    weapon: "Korkenzieher",
    skill: "stich",
    advanced: "rauch",
    about: "Präzise Angriffe, Sabotage und kontrollierter Rückzug.",
  },
};
export const crawlerSkills = {
  deckel: {
    name: "Deckel drauf!",
    cost: 1,
    kind: "shield",
    desc: "Die ganze Gruppe erleidet beim nächsten Monsterangriff 3 Schaden weniger.",
    level: 1,
  },
  suppe: {
    name: "Suppe der fragwürdigen Herkunft",
    cost: 1,
    kind: "heal",
    power: 7,
    desc: "Heilt dich oder einen gewählten Verbündeten um 7 LP. Hilft auch am Boden.",
    level: 1,
  },
  furz: {
    name: "Furzwolken-Schlag",
    cost: 2,
    kind: "risk",
    power: 10,
    dc: 17,
    stat: 2,
    backlash: 3,
    desc: "Hoher Magieschaden. Fehlschlag: JEDER lebende Held verliert 3 LP, bei einer 1 sogar 5 LP. Danach handelt ihr weiter nach Zugfolge.",
    level: 1,
  },
  glocke: {
    name: "Snooze des Verderbens",
    cost: 2,
    kind: "stun",
    desc: "Der nächste Monsterangriff fällt aus. Pro Kampf einmal einsetzbar.",
    level: 1,
  },
  sonne: {
    name: "Noch einmal Sonne",
    cost: 1,
    kind: "attack",
    power: 7,
    dc: 12,
    stat: 2,
    desc: "Magischer Angriff mit 7 Basisschaden.",
    level: 1,
  },
  stich: {
    name: "Diebstahl mit Körperkontakt",
    cost: 1,
    kind: "attack",
    power: 7,
    dc: 12,
    stat: 1,
    desc: "Präziser Angriff mit 7 Basisschaden.",
    level: 1,
  },
  zapfen: {
    name: "Zapfhahn der Gerechtigkeit",
    cost: 2,
    kind: "attack",
    power: 10,
    dc: 14,
    stat: 0,
    desc: "Schwerer Kraftangriff mit 10 Basisschaden.",
    level: 2,
  },
  pfanne: {
    name: "Pfannenfinale à la Trauma",
    cost: 2,
    kind: "attack",
    power: 10,
    dc: 14,
    stat: 0,
    desc: "Schwerer Pfannenangriff mit 10 Basisschaden.",
    level: 2,
  },
  zahmen: {
    name: "Den hab ich noch nicht!",
    cost: 2,
    kind: "tame",
    dc: 12,
    stat: 2,
    desc: "Nicht-Boss unter 30 % LP zähmen. Erfolg beendet den Kampf; ein Begleiter verstärkt künftig Angriffe um 1.",
    level: 2,
  },
  nugget: {
    name: "Auferstehung, paniert",
    cost: 2,
    kind: "heal",
    power: 11,
    desc: "Heilt dich oder einen Verbündeten um 11 LP, auch am Boden.",
    level: 2,
  },
  supernova: {
    name: "Sonnenbrand Stufe Finanzamt",
    cost: 3,
    kind: "risk",
    power: 15,
    dc: 18,
    stat: 2,
    backlash: 4,
    desc: "15 Basisschaden. Fehlschlag: jeder lebende Held verliert 4 LP; bei einer 1 sind es 6 LP.",
    level: 2,
  },
  rauch: {
    name: "Rauchpause mit Fluchtabsicht",
    cost: 1,
    kind: "shield",
    desc: "Rauch schützt alle beim nächsten Monsterangriff: 3 Schaden weniger.",
    level: 2,
  },
};
export const crawlerItems = {
  Deckelschwert: {
    kind: "weapon",
    stat: 0,
    power: 5,
    desc: "Kraft · 5 Basisschaden. Ein ehemaliger Topfdeckel mit Ambitionen.",
  },
  Bratpfanne: {
    kind: "weapon",
    stat: 0,
    power: 5,
    desc: "Kraft · 5 Basisschaden. Nicht spülmaschinenfest.",
  },
  Sporenfeder: {
    kind: "weapon",
    stat: 2,
    power: 4,
    desc: "Magie · 4 Basisschaden. Schreibt besonders vernichtende Rezensionen.",
  },
  Flammenstab: {
    kind: "weapon",
    stat: 2,
    power: 4,
    desc: "Magie · 4 Basisschaden. TÜV seit 700 Jahren abgelaufen.",
  },
  Sonnenstab: {
    kind: "weapon",
    stat: 2,
    power: 4,
    desc: "Magie · 4 Basisschaden. Restwärme inklusive.",
  },
  Korkenzieher: {
    kind: "weapon",
    stat: 1,
    power: 5,
    desc: "Geschick · 5 Basisschaden. Für Flaschen und Bürokratie.",
  },
  "Riesenschwert der Überstunden": {
    kind: "weapon",
    stat: 0,
    power: 7,
    desc: "Kraft · 7 Basisschaden. Bezahlt wird nur die halbe Klinge.",
  },
  "Tacker der letzten Mahnung": {
    kind: "weapon",
    stat: 1,
    power: 7,
    desc: "Geschick · 7 Basisschaden. Heftet Feinde an ihre Entscheidungen.",
  },
  "Stab der schlechten Beichte": {
    kind: "weapon",
    stat: 2,
    power: 7,
    desc: "Magie · 7 Basisschaden. Kennt deinen Browserverlauf.",
  },
  "Bademantel der Unantastbarkeit": {
    kind: "armor",
    armor: 2,
    desc: "Rüstung 2. Verringert jeden gegnerischen Treffer um 2 LP.",
  },
  Nugget: {
    kind: "heal",
    power: 6,
    desc: "Einmalig: heilt 6 LP, auch bei bewusstlosen Freunden.",
  },
  "Goldener Nugget": {
    kind: "heal",
    power: 10,
    desc: "Einmalig: heilt 10 LP. Die Panade knistert verdächtig.",
  },
  Fokusbrause: {
    kind: "focus",
    power: 2,
    desc: "Einmalig: stellt 2 Fokus wieder her.",
  },
  Messingschlüssel: {
    kind: "quest",
    desc: "Passt zum Schloss der Archivtruhe. Gemeinsamer Questgegenstand.",
  },
  Einladung: {
    kind: "quest",
    desc: "„Essen für alle.“ Die unterschriebene Zusage des Königs.",
  },
  Königssiegel: { kind: "quest", desc: "Öffnet die versiegelte Kronentür." },
  Krone: {
    kind: "quest",
    desc: "Der Grund für diese ausgesprochen schlechte Idee.",
  },
};
export const crawlerRooms = {
  tor: {
    name: "Das Tor ohne Öffnungszeiten",
    image: "tor",
    paths: ["wache"],
    objects: ["Steingesicht", "Messinggong", "trockenes Becken", "Fackeln"],
    story:
      "Das Steingesicht über dem Tor mustert euch: „Beschwerden nur mit Puls oder Sterbeurkunde.“ Links hängt ein gedämpfter Messinggong. Rechts liegt im trockenen Becken ein Messingschlüssel.",
  },
  wache: {
    name: "Amt für ungeklärte Restlebenszeit",
    image: "wache",
    paths: ["tor", "archiv"],
    objects: [
      "Schreibtisch",
      "Stempelhammer",
      "Flasche",
      "Fallgitter",
      "Kettenwinde",
    ],
    story:
      "Günther von Klammer-zurück, Oberstempelführer dritter Vertretung, versperrt den Weg. Sein Stempel ist größer als sein Restgewissen. Hinter ihm hängt ein Fallgitter an einer Kettenwinde. Eine Flasche steht auf dem Schreibtisch.",
    enemy: {
      name: "Günther von Klammer-zurück",
      title: "Oberstempelführer dritter Vertretung",
      hp: 12,
      per: 10,
      defense: 12,
      damage: 6,
      xp: 4,
      pattern: [
        "Mahnung ins Gesicht",
        "Rundschreiben an alle",
        "Pfändung der Kniescheibe",
      ],
      weakness:
        "Die Kettenwinde hält das Fallgitter. Mit Geschick lässt es sich auf Günthers Schreibtisch absenken.",
    },
  },
  archiv: {
    name: "Archiv der freiwilligen Opfer",
    image: "archiv",
    paths: ["wache", "kapelle"],
    objects: [
      "Eichentruhe",
      "Messingschloss",
      "kleine Glocke",
      "Gästebuch",
      "Wachssiegel",
      "Kronentür",
    ],
    story:
      "Die Truhe schnarcht. Eine kleine Glocke hängt an ihrem Deckel. Auf dem Pult liegt ein Gästebuch mit Königssiegel. Drei Noten sind in das Holz der Truhe geritzt. Die Kronentür führt zur Kapelle.",
    enemy: {
      name: "Klaudia Kassensturz",
      title: "Mimic mit unbefristetem Bissvertrag",
      hp: 10,
      per: 8,
      defense: 13,
      damage: 6,
      xp: 4,
      pattern: [
        "Kostenvoranschlag mit Zähnen",
        "Deckelschlag für alle",
        "Ellbogenprüfung",
      ],
      weakness:
        "Die drei Noten auf der Truhe rückwärts summen. Im Kampf hilft ein verkeilter Deckel.",
    },
  },
  kapelle: {
    name: "Kapelle der offenen Rechnungen",
    image: "kapelle",
    paths: ["archiv", "thron"],
    objects: [
      "Brautgeist",
      "leere Teller",
      "Buffetglocke",
      "Blumen",
      "Krönungssockel",
    ],
    story:
      "Die Geisterhochzeit wartet seit dreihundert Jahren aufs Buffet. Auf dem Sockel liegt eine zerbrechliche Theaterkrone – ein falsches Versprechen. „Die echte Krone hat er im Thronsaal“, zischt die Braut. „Zeigt mir seine Einladung. Dann reden wir über Unterstützung.“",
  },
  thron: {
    name: "Thronsaal Ihrer Niedrigkeit",
    image: "thron",
    paths: ["kapelle", "ausgang"],
    objects: [
      "falscher König",
      "lebender Teppich",
      "schwebende Krone",
      "Kronleuchter",
      "Kettenwinde",
    ],
    story:
      "König Horst der Vorläufige sitzt auf Dieter, dem Teppich mit Kündigungsabsicht. Die echte Krone hängt am Kronleuchter. Links führt eine Kette zur Winde. „Schuhe aus!“, kreischt Horst. Dieter öffnet sein Maul.",
    enemy: {
      name: "Dieter, der Kündigungsteppich",
      title: "Mit Horst dem Vorläufigen als unbezahltem Reiter",
      hp: 20,
      per: 13,
      defense: 14,
      damage: 7,
      xp: 6,
      boss: true,
      pattern: [
        "Fransenpeitsche",
        "Stauballergie für alle",
        "Königlicher Totalschaden",
      ],
      weakness:
        "Die linke Kettenwinde kontrolliert den Kronleuchter. Ein erfolgreicher Versuch schwächt Dieter stark.",
    },
  },
  ausgang: {
    name: "Luft zum Atmen, leider steuerpflichtig",
    image: "tor",
    paths: [],
    objects: [],
    story:
      "Mit der echten Krone stolpert ihr ans Tageslicht. Hinter euch eröffnet Günthers Nachfolger bereits ein Verfahren wegen unbefugten Sieges.",
  },
};
for (const [id, patch] of Object.entries(dungeonPatches)) crawlerRooms[id] = {...crawlerRooms[id], ...patch};
Object.assign(crawlerItems,dungeonItems);
const Cplain = (t) =>
  String(t ?? "")
    .toLowerCase()
    .replaceAll("ß", "ss")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
const Cfail = (t) => {
  throw Error(t);
};
const Clog = (s, text, who = "Spielleitung") => {
  s.messages.push({ seq: ++s.seq, who, text, room: s.room });
  if (who === "Spielleitung") s.narration = text;
};
const Cp = (s, id) => s.players.find((p) => p.id === id);
const Croom = (s) => crawlerRooms[s.room];
const Cboard = (s) => s.boards[s.room];
const Cactive = (s) => s.combat && Cboard(s).enemy?.hp > 0;
const Calive = (s) => s.players.filter((p) => p.hp > 0);
const CmaxFocus = (p) => 3 + Math.floor((p.level - 1) / 2);
const Cmain = (p) =>
  crawlerClasses[p.classId].stats.indexOf(
    Math.max(...crawlerClasses[p.classId].stats),
  );
const Cadd = (p, item) => {
  p.bag.push(item);
};
const Cremove = (p, item) => {
  const i = p.bag.indexOf(item);
  if (i < 0) Cfail("Dieser Gegenstand ist nicht in deinem Rucksack.");
  p.bag.splice(i, 1);
};
const Cquest = (s, item) => {
  if (!s.quest.includes(item)) s.quest.push(item);
};
const Cwho = (s, p) => p?.alias ?? "niemand";
export function secureD20() {
  let n;
  do {
    n = crypto.getRandomValues(new Uint8Array(1))[0];
  } while (n >= 240);
  return (n % 20) + 1;
}
export function crawlerNewRoom(host, solo = false) {
  return {
    crawler: 3,
    host,
    solo,
    status: "lobby",
    players: [],
    room: "tor",
    boards: {},
    facts: {},
    quest: [],
    messages: [],
    seq: 0,
    narration: "",
    pending: null,
    combat: null,
    votes: {},
    focus: {},
    lastRoll: null,
  };
}
function Cgain(s, p, xp) {
  p.xp += xp;
  let level = p.xp >= 14 ? 4 : p.xp >= 8 ? 3 : p.xp >= 4 ? 2 : 1;
  while (p.level < level) {
    p.level++;
    p.maxHp += 3;
    p.hp = Math.min(p.maxHp, p.hp + 3);
    p.stats[Cmain(p)]++;
    p.points++;
    p.focus = Math.min(CmaxFocus(p), p.focus + 1);
    Clog(
      s,
      `${p.alias} erreicht Stufe ${p.level}! +3 maximale LP, +1 Hauptattribut und ein Talentpunkt.`,
    );
  }
}
function Creward(s) {
  const b = Cboard(s);
  if (b.rewarded) return;
  b.rewarded = true;
  b.clear = true;
  s.combat = null;
  s.pending = null;
  s.votes = {};
  const xp = Croom(s).enemy?.xp ?? 3;
  for (const p of s.players) {
    Cgain(s, p, xp);
    p.gold += 8 + (Croom(s).enemy?.boss ? 12 : 0);
    p.focus = Math.min(CmaxFocus(p), p.focus + 1);
    if (p.hp === 0) {
      p.hp = 1;
      Clog(s, `${p.alias} kommt nach dem Kampf mit 1 LP wieder zu sich.`);
    }
  }
  const seal = {wache:"Sonnensiegel",pilze:"Mondsiegel",grabkammer:"Grabessiegel"}[s.room];
  if (seal) { Cquest(s,seal); Clog(s,"Ihr bergt das " + seal + ". Es gehört der ganzen Truppe."); }
  const loot =
    s.room === "wache"
      ? [
          "Riesenschwert der Überstunden",
          "Tacker der letzten Mahnung",
          "Stab der schlechten Beichte",
        ]
      : s.room === "archiv"
        ? ["Bademantel der Unantastbarkeit", "Goldener Nugget", "Fokusbrause"]
        : ["Goldener Nugget"];
  b.loot.push(...loot);
  Clog(
    s,
    `Begegnung geschafft. Jeder erhält ${xp} EP und Gold. Am Boden liegen: ${loot.join(", ")}. Beute wird nur einmal vergeben; nehmt sie im Chat oder im Rucksack auf.`,
  );
  if (s.room === "archiv") {
    Cquest(s, "Einladung");
    b.chest = true;
    Clog(
      s,
      "Zwischen Klaudias Versicherungsunterlagen findet ihr die Einladung: „Essen für alle. Gez. Horst.“",
    );
  }
  if (s.room === "thron") {
    Cquest(s, "Krone");
    s.facts.crown = true;
    Clog(
      s,
      "Dieter kündigt fristlos. Horst flieht in seine eigene Garderobe. Die echte Krone gehört euch.",
    );
  }
}
function Cintent(s) {
  if (!Cactive(s)) return;
  const c = s.combat,
    b = Cboard(s),
    e = Croom(s).enemy;
  const alive = Calive(s);
  const phase = (c.round - 1) % 3;
  const target = alive[(c.round - 1) % alive.length];
  c.intent = {
    name: e.pattern[phase],
    targets:
      phase === 1
        ? alive.map((p) => p.id)
        : Array.from(
            { length: Math.ceil(alive.length / 2) },
            (_, i) => alive[(c.round - 1 + i) % alive.length].id,
          ),
    damage:
      phase === 1
        ? Math.max(3, e.damage - 2)
        : phase === 2
          ? e.damage + 3
          : e.damage,
    area: phase === 1,
  };
  c.queue = alive.map((p) => p.id);
  c.index = 0;
  c.acted = [];
  Clog(
    s,
    `Runde ${c.round}. Angekündigt: ${c.intent.name} → ${c.intent.targets.map((id) => Cp(s, id).alias).join(", ")}. ${c.intent.damage} Basisschaden nach euren Zügen; Rüstung und Schutz zählen. Jetzt: ${alive[0].alias}.`,
  );
}
function CstartFight(s) {
  const b = Cboard(s);
  if (b.clear) return;
  if (!b.enemy) {
    const e = Croom(s).enemy;
    b.enemy = {
      hp:
        e.hp + e.per * s.players.length + Math.max(0, s.players.length - 2) * 5,
      maxHp:
        e.hp + e.per * s.players.length + Math.max(0, s.players.length - 2) * 5,
    };
  }
  s.combat = {
    round: 1,
    queue: [],
    index: 0,
    acted: [],
    shield: 0,
    weaken: 0,
    stun: false,
    stunUsed: false,
    setupUsed: false,
  };
  s.votes = {};
  Cintent(s);
}
function Cdamage(s, p, amount) {
  p.hp = Math.max(0, p.hp - amount);
  if (!p.hp)
    Clog(
      s,
      `${p.alias} liegt am Boden. Ein Nugget, Heilskill oder „Ich helfe ${p.alias} auf“ kann helfen.`,
    );
}
function CenemyTurn(s) {
  if (!Cactive(s)) return;
  const c = s.combat;
  if (c.stun) {
    Clog(
      s,
      "Der angekündigte Monsterangriff fällt aus. Snooze ist eine Lebenseinstellung.",
    );
    c.stun = false;
  } else
    for (const id of c.intent.targets) {
      const p = Cp(s, id);
      if (!p?.hp) continue;
      const armor = crawlerItems[p.armor]?.armor ?? 0;
      const damage = Math.max(
        0,
        c.intent.damage - armor - (p.guard ?? 0) - c.shield - c.weaken,
      );
      Cdamage(s, p, damage);
      Clog(
        s,
        `${c.intent.name} trifft ${p.alias}: ${damage} Schaden (${c.intent.damage} Basis, ${armor + (p.guard ?? 0) + c.shield + c.weaken} Schutz).`,
      );
    }
  for (const p of s.players) p.guard = 0;
  c.shield = 0;
  c.weaken = 0;
  if (!Calive(s).length) {
    s.status = "lost";
    s.combat = null;
    Clog(
      s,
      "Die ganze Truppe liegt am Boden. Die Gruft gewinnt diesen Versuch. Keine Würfel werden heimlich zurechtgebogen. Mit einem neuen Raum könnt ihr andere Klassen und Taktiken versuchen.",
    );
    return;
  }
  c.round++;
  Cintent(s);
}
function Cadvance(s, p) {
  if (!Cactive(s)) return;
  const c = s.combat;
  c.acted.push(p.id);
  c.index++;
  while (c.index < c.queue.length && !Cp(s, c.queue[c.index]).hp) c.index++;
  if (c.index >= c.queue.length) CenemyTurn(s);
  else Clog(s, `Am Zug: ${Cp(s, c.queue[c.index]).alias}.`);
}
function Cturn(s, p) {
  if (s.pending)
    Cfail("Zuerst den angekündigten Wurf abschließen oder abbrechen.");
  if (!p.hp) Cfail("Du liegst am Boden. Lass dir von einem Freund helfen.");
  if (Cactive(s) && s.combat.queue[s.combat.index] !== p.id)
    Cfail(
      "Noch nicht dein Zug. Untersuchen und im Chat sprechen geht jederzeit.",
    );
}
function Ctarget(s, p, id) {
  const target = Cp(s, id) || p;
  if (!target.classId) Cfail("Diese Figur ist noch nicht bereit.");
  return target;
}
function Cprepare(s, p, q) {
  Cturn(s, p);
  const bonus = p.stats[q.stat];
  s.pending = { ...q, id: p.id, actor: p.alias, bonus, room: s.room };
  const successes = Array.from({ length: 20 }, (_, i) => i + 1).filter(
    (n) => n === 20 || (n !== 1 && n + bonus >= q.dc),
  ).length;
  Clog(
    s,
    `${p.alias}: ${q.name}. W20 + ${bonus} gegen ${q.dc} · ${successes * 5}% Erfolg. ${q.cost ?? 0} Fokus. Erfolg: ${q.success}. Fehlschlag: ${q.downside} Vor dem Würfeln könnt ihr abbrechen.`,
  );
}
function Cattack(s, p, skill) {
  if (!Cactive(s)) Cfail("Hier gibt es gerade kein aktives Monster.");
  const weapon = crawlerItems[p.weapon];
  const q = skill ? crawlerSkills[skill] : null;
  Cprepare(s, p, {
    kind: q?.kind === "tame" ? "tame" : q?.kind === "risk" ? "risk" : "attack",
    name: q?.name ?? "Angriff mit " + p.weapon,
    stat: q?.stat ?? weapon.stat,
    dc: q?.dc ?? Croom(s).enemy.defense,
    power:
      (q?.power ?? weapon.power) +
      (p.level - 1) +
      (p.pet ? 1 : 0) +
      (p.damageBonus ?? 0),
    cost: q?.cost ?? 0,
    backlash: q?.backlash ?? 0,
    success:
      q?.kind === "tame"
        ? "Monster wird Begleiter."
        : `${(q?.power ?? weapon.power) + (p.level - 1) + (p.pet ? 1 : 0) + (p.damageBonus ?? 0)} Schaden; natürliche 20 zusätzlich +3.`,
    downside: q?.backlash
      ? `Jeder lebende Held verliert ${q.backlash} LP, bei natürlicher 1 ${q.backlash + 2}. Rüstung hilft gegen die eigene Wolke nicht.`
      : "Kein Treffer. Dein Zug ist verbraucht; danach geht die angekündigte Zugfolge weiter.",
  });
}
function Cskill(s, p, key, target) {
  const cls = crawlerClasses[p.classId],
    sk = crawlerSkills[key];
  if (!sk || ![cls.skill, cls.advanced].includes(key))
    Cfail("Diesen Skill hat deine Klasse nicht.");
  if (p.level < sk.level)
    Cfail("Dieser Skill wird auf Stufe 2 freigeschaltet.");
  Cturn(s, p);
  if (p.focus < sk.cost)
    Cfail(
      "Nicht genug Fokus. Verteidigen stellt im Kampf 1 Fokus wieder her; Fokusbrause hilft ebenfalls.",
    );
  if (["attack", "risk", "tame"].includes(sk.kind)) {
    if (
      sk.kind === "tame" &&
      (!Cactive(s) ||
        Croom(s).enemy.boss ||
        Cboard(s).enemy.hp / Cboard(s).enemy.maxHp > 0.3)
    )
      Cfail("Zähmen klappt nur bei einem Nicht-Boss mit höchstens 30% LP.");
    return Cattack(s, p, key);
  }
  if (sk.kind !== "heal" && !Cactive(s))
    Cfail("Diesen Skill brauchst du nur im Kampf.");
  if (sk.kind === "stun" && s.combat.stunUsed)
    Cfail("Snooze ist in diesem Kampf bereits verbraucht.");
  p.focus -= sk.cost;
  if (sk.kind === "heal") {
    const t = Ctarget(s, p, target);
    const old = t.hp;
    t.hp = Math.min(t.maxHp, t.hp + sk.power);
    Clog(
      s,
      `${p.alias} setzt ${sk.name} ein. ${t.alias} erhält ${t.hp - old} LP zurück.`,
    );
  }
  if (sk.kind === "shield") {
    s.combat.shield = Math.max(s.combat.shield, 3);
    Clog(
      s,
      `${p.alias}: ${sk.name} Die ganze Gruppe hat beim nächsten Monsterangriff 3 zusätzlichen Schutz.`,
    );
  }
  if (sk.kind === "stun") {
    s.combat.stun = true;
    s.combat.stunUsed = true;
    Clog(
      s,
      "Snooze! Der nächste angekündigte Monsterangriff fällt komplett aus.",
    );
  }
  Cadvance(s, p);
}
function Cuse(s, p, item, target) {
  Cturn(s, p);
  if (!p.bag.includes(item))
    Cfail("Dieser Gegenstand ist nicht in deinem Rucksack.");
  const it = crawlerItems[item];
  if (it.kind === "weapon" && Cactive(s) && p.weapon === item)
    return Cattack(s, p);
  if (it.kind === "weapon" || it.kind === "armor") {
    if (Cactive(s)) Cfail("Ausrüstung wechselt ihr zwischen den Kämpfen.");
    p[it.kind === "weapon" ? "weapon" : "armor"] = item;
    Clog(s, `${p.alias} rüstet ${item} aus.`);
    return;
  }
  if (!["heal", "focus"].includes(it.kind))
    Cfail("Diesen Gegenstand benutzt du mit einer Idee im Chat.");
  const t = Ctarget(s, p, target);
  if (it.kind === "heal" && t.hp === t.maxHp)
    Cfail("Diese Figur hat bereits volle LP.");
  if (it.kind === "focus" && t.focus === CmaxFocus(t))
    Cfail("Diese Figur hat bereits vollen Fokus.");
  Cremove(p, item);
  if (it.kind === "heal") {
    const old = t.hp;
    t.hp = Math.min(t.maxHp, t.hp + it.power);
    Clog(s, `${p.alias} gibt ${t.alias} ein ${item}: +${t.hp - old} LP.`);
  } else {
    t.focus = Math.min(CmaxFocus(t), t.focus + it.power);
    Clog(
      s,
      `${t.alias} trinkt Fokusbrause. Fokus: ${t.focus}/${CmaxFocus(t)}.`,
    );
  }
  Cadvance(s, p);
}
function Center(s, room) {
  const revisit = Boolean(s.boards[room]);
  s.previous = s.room;
  s.room = room;
  s.language = {};
  s.votes = {};
  s.focus = {};
  s.boards[room] ??= {
    clear: !crawlerRooms[room].enemy,
    loot: [...(crawlerRooms[room].loot ?? [])],
    rewarded: false,
  };
  Clog(s, crawlerRooms[room].name + " — " + (revisit ? "Ihr kehrt zurück. Bereits geöffnete Behälter und Wege bleiben offen; besiegte Gegner kommen nicht wieder. Am Boden: " + (Cboard(s).loot.join(", ") || "keine freie Beute") + ". Sichtbar: " + crawlerRooms[room].objects.join(", ") : crawlerRooms[room].story));
  if (room === "ausgang") {
    s.status = "won";
    Clog(
      s,
      `Krone geborgen! Eure Truppe verlässt die Gruft mit ${s.players.reduce((a, p) => a + p.gold, 0)} Gold und erstaunlich wenig Würde. Eure Charaktere, Beute und Titel bleiben in dieser abgeschlossenen Runde sichtbar.`,
    );
    return;
  }
  if (room === "wache" || room === "thron" || room === "grabkammer") {
    if (!Cboard(s).clear) {
      CstartFight(s);
      if (room === "thron" && s.facts.blessed) {
        s.combat.shield = 2;
        Clog(
          s,
          "Der Segen der Hochzeitsgesellschaft schützt euch beim ersten Monsterangriff um 2 LP.",
        );
      }
    }
  }
}
function Cmove(s, p, target) {
  if (!crawlerRooms[target] || !dungeonPaths(s,crawlerRooms).includes(target))
    return Clog(
      s,
      "Von hier führt kein direkter Weg dorthin. Sichtbare Wege: " +
        dungeonPaths(s,crawlerRooms)
          .map((k) => crawlerRooms[k].name)
          .join(", ") +
        ".",
    );
  if (s.pending) Cfail("Zuerst den offenen Wurf klären.");
  if (s.room === "tor" && !s.facts.gate)
    return Clog(
      s,
      "Das Tor ist geschlossen. Gong und Steingesicht könnten weiterhelfen.",
    );
  if (target === "kapelle" && !s.facts.door)
    return Clog(
      s,
      "Die Kronentür ist versiegelt. Das Gästebuch und sein Königssiegel gehören zum Verschluss.",
    );
  const locked = dungeonGate(s,s.room,target);
  if (locked) return Clog(s,locked);
  if (target === "ausgang" && !s.facts.crown)
    return Clog(
      s,
      "Die echte Krone gehört euch noch nicht. Zuerst müsst ihr Dieter bezwingen.",
    );
  const retreat = Cactive(s);
  if (retreat && !s.boards[target])
    return Clog(
      s,
      "Ein Monster blockiert den Weg nach vorn. Rückzug geht nur in einen bereits entdeckten Raum.",
    );
  if (!p.hp) Cfail("Am Boden kannst du keinen Raumwechsel abstimmen.");
  s.votes[p.id] = target;
  const required = Math.floor(Calive(s).length / 2) + 1,
    count = Object.values(s.votes).filter((x) => x === target).length;
  if (count < required)
    return Clog(
      s,
      `${p.alias} schlägt ${retreat ? "Rückzug nach " : ""}${crawlerRooms[target].name} vor. ${count}/${required} Stimmen. Andere können „Ich stimme zu“ schreiben.`,
    );
  if (retreat) {
    for (const ally of Calive(s)) Cdamage(s, ally, 2);
    s.combat = null;
    Clog(
      s,
      "Rückzug: Jeder stehende Held verliert genau 2 LP. Das Monster behält seine verbleibenden LP.",
    );
    if (!Calive(s).length) {
      s.status = "lost";
      Clog(s, "Beim Rückzug fällt auch der letzte Held.");
      return;
    }
  }
  Center(s, target);
}
function Cexamine(s, p, t) {
  const b = Cboard(s);
  if (
    /monst|gegner|gunther|dieter|klaudia|teppich|wache|zahn/.test(t) &&
    Croom(s).enemy
  )
    return Clog(s, Croom(s).enemy.name + ": " + Croom(s).enemy.weakness);
  if (s.room === "tor" && /gong|filz/.test(t))
    return Clog(
      s,
      s.facts.felt
        ? "Der Filz ist schon entfernt. Der Gong schwingt frei."
        : "Filz dämpft die Rückseite des Gongs. Du kannst ihn abziehen.",
    );
  if (s.room === "tor" && /becken|schlussel/.test(t))
    return Clog(
      s,
      s.quest.includes("Messingschlüssel")
        ? "Das Becken ist leer. Der Schlüssel ist bei euch."
        : "Im trockenen Becken liegt ein Messingschlüssel.",
    );
  if (s.room === "archiv" && /truhe|kiste|noten|schloss/.test(t)) {
    b.inspected = true;
    return Clog(
      s,
      b.clear && b.chest
        ? "Die Truhe ist leer. Eure Einladung bleibt im Questbesitz."
        : "Die Scharniere sehen wie Zähne aus. Drei eingeritzte Noten führen rückwärts aus dem Rhythmus. Ihr könnt die Noten rückwärts summen oder einen Kampf riskieren.",
    );
  }
  if (s.room === "archiv" && /buch|siegel|tur|pult/.test(t))
    return Clog(
      s,
      "Das Gästebuch verlangt einen Eintrag als Beschwerdeführer. Das Wachssiegel ist der passende Abdruck für die Kronentür.",
    );
  if (s.room === "kapelle" && /krone|sockel/.test(t))
    return Clog(
      s,
      "Die Krone auf dem Sockel ist Theaterrequisite aus bemaltem Holz. Die echte Krone hängt bei Horst im Thronsaal.",
    );
  if (s.room === "kapelle" && /geist|braut|teller|glock/.test(t))
    return Clog(
      s,
      "Die Braut will die unterschriebene Einladung aus dem Archiv sehen. Danach kann die Buffetglocke euch einen Segen und eine sichere Rast verschaffen.",
    );
  Clog(
    s,
    "Du erkennst: " +
      Croom(s).objects.join(", ") +
      ". " +
      (Cactive(s)
        ? "Das Monster verrät seine Schwäche, wenn ihr es genauer untersucht."
        : Cboard(s).loot.length
          ? "Am Boden: " + Cboard(s).loot.join(", ") + "."
          : "Hier liegen keine weiteren Beutestücke."),
  );
}
function CideaLegacy(s, p, raw) {
  let t = Cplain(raw);
  const inspect =
    /untersuch|schau|pruf|seh.*an|betracht|inspiz|such|les|was |wo |hinseh/.test(
      t,
    );
  const take = /nehm|nimm|hol|greif|samm|steck.*ein|mitnehm/.test(t);
  if (/\b(nicht|kein\w*|niemals)\b/.test(t))
    return Clog(
      s,
      "Du beschreibst etwas, das du vermeiden willst. Was versuchst du stattdessen?",
    );
  if (/was (?:ware|passiert)|kann ich|konnen wir|konnte ich|wenn ich/.test(t))
    return Clog(
      s,
      "Das wäre ein möglicher Versuch. Beschreibe die konkrete Handlung; vor einem riskanten Wurf zeige ich dir Bonus, Chance und Folgen.",
    );
  const named = Croom(s).objects.find(
    (o) => t.includes(Cplain(o)) || t.includes(Cplain(o).split(" ").at(-1)),
  );
  if (named) s.focus[p.id] = named;
  if (!named && s.focus[p.id] && /\b(sie|ihn|es|das|daran|damit)\b/.test(t))
    t += " " + Cplain(s.focus[p.id]);
  if (inspect) return Cexamine(s, p, t);
  if (
    /\b(stimm\w* zu|zustimm\w*|ja|bin dabei|einverstanden|folge)\b/.test(t) &&
    Object.keys(s.votes).length
  )
    return Cmove(s, p, Object.values(s.votes)[0]);
  if (/geh|betret|weiter|zuruck|verlass|lauf|hinaus/.test(t)) {
    let target = /archiv/.test(t)
      ? "archiv"
      : /amt|wach|gunther/.test(t)
        ? "wache"
        : /kapelle|hochzeit/.test(t)
          ? "kapelle"
          : /thron|konig|horst/.test(t)
            ? "thron"
            : /eingang|zum tor|treppe/.test(t)
              ? "tor"
              : /ausgang|frei|hinaus/.test(t)
                ? "ausgang"
                : null;
    if (!target && /weiter/.test(t))
      target = {
        tor: "wache",
        wache: "archiv",
        archiv: "kapelle",
        kapelle: "thron",
        thron: "ausgang",
      }[s.room];
    if (!target && /zuruck/.test(t))
      target = {
        wache: "tor",
        archiv: "wache",
        kapelle: "archiv",
        thron: "kapelle",
      }[s.room];
    if (target) return Cmove(s, p, target);
  }
  if (/inventar|rucksack|besitz/.test(t))
    return Clog(
      s,
      `${p.alias}: ${p.bag.join(", ")}. Gemeinsame Questgegenstände: ${s.quest.join(", ") || "noch keine"}.`,
    );
  const skill = Object.entries(crawlerSkills).find(
    ([key, sk]) =>
      t.includes(Cplain(sk.name)) ||
      {
        furz: /furz|wolken.?schlag/,
        deckel: /deckel drauf/,
        suppe: /suppe/,
        glocke: /snooze/,
        sonne: /noch einmal sonne/,
        stich: /korperkontakt/,
        zahmen: /zahm|den hab ich/,
        zapfen: /zapfhahn/,
        pfanne: /pfannenfinale/,
        nugget: /aufersteh/,
        supernova: /sonnenbrand/,
        rauch: /rauchpause/,
      }[key]?.test(t),
  );
  const target = s.players.find(
    (x) => x.id !== p.id && t.includes(Cplain(x.alias)),
  );
  if (skill) return Cskill(s, p, skill[0], target?.id);
  if (/verteidig|block|schutz|in deckung|verschnauf/.test(t)) {
    Cturn(s, p);
    if (!Cactive(s))
      return Clog(s, "Hier müsst ihr euch gerade nicht verteidigen.");
    p.guard = 4;
    p.focus = Math.min(CmaxFocus(p), p.focus + 1);
    Clog(
      s,
      `${p.alias} verteidigt sich: 4 Schutz beim nächsten Monsterangriff und +1 Fokus.`,
    );
    return Cadvance(s, p);
  }
  if (/helf.*auf|wiederbele|aufricht/.test(t) && target) {
    Cturn(s, p);
    if (target.hp > 0) Cfail("Diese Figur steht bereits.");
    target.hp = 3;
    Clog(
      s,
      `${p.alias} hilft ${target.alias} auf: 3 LP. Im Kampf kostet das den Zug.`,
    );
    return Cadvance(s, p);
  }
  if (
    /angreif|greif.*an|schlag|attack|hau|stich|schiess|feuer.*auf/.test(t) &&
    Cactive(s) &&
    !/\b(winde|kettenwinde|kette|fallgitter|gitter|deckel|flasche|scharnier|kronleuchter)\b/.test(
      t,
    )
  )
    return Cattack(s, p);
  const item = Object.keys(crawlerItems)
    .sort((a, b) => b.length - a.length)
    .find((k) => t.includes(Cplain(k)));
  if (
    item &&
    /gib|geb|reich|heil|trink|iss|esse|nutz|benutz|setz.*ein|rust/.test(t) &&
    p.bag.includes(item)
  )
    return Cuse(s, p, item, target?.id);
  if (item && take && Cboard(s).loot.includes(item)) {
    if (Cactive(s))
      Cfail("Erst das Monster klären; danach könnt ihr Beute aufnehmen.");
    Cboard(s).loot.splice(Cboard(s).loot.indexOf(item), 1);
    Cadd(p, item);
    return Clog(
      s,
      `${p.alias} nimmt ${item}. Es ist jetzt im persönlichen Rucksack.`,
    );
  }
  if (s.room === "tor") {
    if (/becken|schlussel/.test(t) && take) {
      if (s.quest.includes("Messingschlüssel"))
        return Clog(
          s,
          "Den Schlüssel habt ihr schon; ein zweiter liegt hier nicht.",
        );
      Cquest(s, "Messingschlüssel");
      return Clog(
        s,
        "Ihr nehmt den Messingschlüssel aus dem Becken. Er ist für alle Questaktionen verfügbar.",
      );
    }
    if (/filz/.test(t) && /zieh|entfern|abnehm|los/.test(t)) {
      s.facts.felt = true;
      return Clog(s, "Du entfernst den Filz. Der Gong kann frei schwingen.");
    }
    if (/gong/.test(t) && /laut|schlag|klopf|kling|spiel/.test(t)) {
      if (!s.facts.felt) return Clog(s, "Plopp. Filz dämpft den Ton.");
      s.facts.gate = true;
      return Clog(
        s,
        "Der Gong weckt das Gesicht. Das Tor öffnet sich zur Höhlenkreuzung.",
      );
    }
    if (/gesicht|beschwer/.test(t) && /red|sprech|sag|frag|beschwer/.test(t)) {
      s.facts.gate = true;
      return Clog(
        s,
        "„Beschwerde? Günther ist zuständig.“ Das Gesicht öffnet das Tor.",
      );
    }
  }
  if (
    Cactive(s) &&
    ((s.room === "wache" && /winde|kette|fallgitter|flasche/.test(t)) ||
      (s.room === "archiv" && /deckel|scharnier|verkeil/.test(t)) ||
      (s.room === "thron" && /winde|kette|kronleuchter/.test(t)))
  ) {
    if (s.combat.setupUsed)
      return Clog(
        s,
        "Diesen Raumvorteil habt ihr im aktuellen Kampf bereits genutzt.",
      );
    return Cprepare(s, p, {
      kind: "environment",
      name: "Raumvorteil nutzen",
      stat: 1,
      dc: s.room === "thron" ? 14 : 12,
      cost: 0,
      power: 6 + 2 * s.players.length,
      success: `${6 + 2 * s.players.length} Schaden und 2 weniger Monsterschaden in dieser Runde.`,
      downside: "Kein Vorteil; der Zug ist verbraucht.",
    });
  }
  if (s.room === "archiv") {
    const b = Cboard(s);
    if (
      /noten|melodie/.test(t) &&
      /summ|sing|pfeif/.test(t) &&
      /ruckwart|umgekehrt/.test(t)
    ) {
      if (b.rewarded) return Clog(s, "Die Begegnung ist schon gelöst.");
      if (Cactive(s))
        return Clog(
          s,
          "Mitten im Bissvertrag hört Klaudia nicht mehr zu. Nutzt ihren Deckel oder bezwingt sie.",
        );
      Clog(
        s,
        "Klaudia summt mit und vergisst ihren Bissvertrag. Sie gibt die Einladung frei.",
      );
      return Creward(s);
    }
    if (
      /truhe|kiste|schloss/.test(t) &&
      /offn|aufmach|mach.*auf|aufschliess|brech/.test(t)
    ) {
      if (Cactive(s))
        return Clog(
          s,
          "Klaudia ist bereits wach. Ihr seid im Kampf; die Truhe lässt sich nicht erneut öffnen.",
        );
      if (b.rewarded)
        return Clog(
          s,
          "Die Truhe wurde bereits geleert. Die Einladung ist bei euch.",
        );
      if (!s.quest.includes("Messingschlüssel") && !/brech/.test(t))
        return Clog(
          s,
          "Die Truhe ist verschlossen. Das Schloss trägt das gleiche Wappen wie der Schlüssel am Eingang.",
        );
      Clog(
        s,
        "Das Schloss klickt. Die Scharniere werden zu Zähnen. „Kostenvoranschlag?“, faucht Klaudia.",
      );
      return CstartFight(s);
    }
    if (
      /buch|siegel|tur|pult/.test(t) &&
      /eintrag|trag.*ein|schreib|druck|nutz|nehm|offn/.test(t)
    ) {
      s.facts.door = true;
      Cquest(s, "Königssiegel");
      return Clog(
        s,
        "Ihr tragt euch ins Gästebuch ein und nutzt das Wachssiegel. Die Kronentür zur Kapelle öffnet sich.",
      );
    }
  }
  if (s.room === "kapelle") {
    if (
      /einladung|braut|geister/.test(t) &&
      /zeig|geb|reich|verhandel|red|sprech/.test(t)
    ) {
      if (!s.quest.includes("Einladung"))
        return Clog(
          s,
          "Die Braut wartet auf die unterschriebene Einladung aus der Archivtruhe.",
        );
      s.facts.invited = true;
      return Clog(
        s,
        "Die Braut erkennt Horsts Unterschrift. „Läutet die Buffetglocke. Dann habt ihr meinen Segen – und einen echten Rastplatz.“",
      );
    }
    if (/glock/.test(t) && /laut|zieh|kling|schlag/.test(t)) {
      if (!s.facts.invited)
        return Clog(
          s,
          "Die Glocke bleibt stumm. Erst muss die Braut die Einladung anerkennen.",
        );
      s.facts.blessed = true;
      return Clog(
        s,
        "Endlich Buffet! Die Geister segnen euch: 2 Gruppenschutz in der ersten Bossrunde. Hier könnt ihr einmal sicher rasten.",
      );
    }
    if (/rast|ruh|schlaf|lager|pause/.test(t)) {
      if (s.facts.rest)
        return Clog(
          s,
          "Euren sicheren Rastplatz habt ihr bereits verbraucht. Unbegrenzte Heilung gibt es hier nicht.",
        );
      if (!s.facts.blessed)
        return Clog(
          s,
          "Die Geister lassen euch erst nach Einladung und Buffetglocke sicher rasten.",
        );
      s.facts.rest = true;
      for (const a of s.players) {
        a.hp = a.maxHp;
        a.focus = CmaxFocus(a);
      }
      return Clog(
        s,
        "Sichere Rast: Alle LP und Fokus sind wieder voll. Dieser Rastplatz ist jetzt verbraucht. Für die Thronsaaltür braucht ihr weiterhin die drei Siegel.",
      );
    }
  }
  Clog(
    s,
    "Die Absicht ist noch unklar. Nenne ein sichtbares Ziel und was du damit vorhast. Hier: " +
      Croom(s).objects.join(", ") +
      "." +
      (Cactive(s)
        ? " Angreifen, Verteidigen, Raumobjekte und eure Skills sind mögliche Ansätze."
        : ""),
  );
}
export function crawlerApply(s, id, data, rng = secureD20) {
  if (s.crawler !== 3)
    Cfail(
      "Diese Runde gehört zur früheren Version. Öffnet für den Dungeon-Crawler einen neuen Raum.",
    );
  const p = Cp(s, id);
  if (data.type === "join") {
    if (p) return;
    if (id === s.host && !s.solo)
      Cfail("Das Tablet ist die gemeinsame Bühne. Tritt mit einem Handy bei.");
    if (s.status !== "lobby" || s.players.length >= 6)
      Cfail("Runde voll oder schon unterwegs.");
    const alias =
      String(data.alias ?? "")
        .trim()
        .slice(0, 24) || "Held " + (s.players.length + 1);
    if (
      s.players.some((a) => Cplain(a.alias) === Cplain(alias)) ||
      Cplain(alias) === "spielleitung"
    )
      Cfail("Bitte einen anderen Namen wählen.");
    s.players.push({ id, alias, classId: null });
    return;
  }
  if (!p) Cfail("Das Tablet dient nur zur Ansicht.");
  if (data.type === "choose") {
    if (s.status !== "lobby") Cfail("Klassen wählt ihr vor dem Start.");
    const cls = crawlerClasses[data.classId];
    if (!cls) Cfail("Unbekannte Klasse.");
    Object.assign(p, {
      classId: data.classId,
      level: 1,
      xp: 0,
      points: 0,
      maxHp: cls.hp,
      hp: cls.hp,
      stats: [...cls.stats],
      focus: 3,
      bag: [cls.weapon, "Nugget", "Nugget", "Fokusbrause"],
      weapon: cls.weapon,
      armor: null,
      gold: 0,
      damageBonus: 0,
      pet: false,
      guard: 0,
      talents: [],
    });
    return;
  }
  if (data.type === "start") {
    if (s.status !== "lobby") Cfail("Die Runde läuft schon.");
    if (
      s.players.length < (s.solo ? 1 : 2) ||
      s.players.some((a) => !a.classId)
    )
      Cfail(
        "Mindestens zwei Spieler und eine Klasse pro Held werden benötigt.",
      );
    s.status = "play";
    Clog(
      s,
      "Auftrag: Besiegt den falschen König und bergt seine echte Krone. Im Kampf handelt ihr reihum; das Monster kündigt vor jeder Runde Ziel und Schaden an. Untersuchen ist kostenlos.",
    );
    Center(s, "tor");
    return;
  }
  if (!["play", "won", "lost"].includes(s.status))
    Cfail("Startet zuerst die Runde.");
  if (data.type === "roll") {
    const q = s.pending;
    if (!q || q.id !== id) Cfail("Du hast keinen offenen Wurf.");
    if (q.room !== s.room) Cfail("Dieser Wurf gehört zu einem anderen Raum.");
    if (p.focus < (q.cost ?? 0)) Cfail("Nicht genug Fokus.");
    const die = rng();
    if (!Number.isInteger(die) || die < 1 || die > 20)
      Cfail("Ungültige Würfelquelle.");
    p.focus -= q.cost ?? 0;
    s.pending = null;
    const success = die === 20 || (die !== 1 && die + q.bonus >= q.dc);
    s.lastRoll = {
      seq: s.seq + 1,
      actor: p.alias,
      die,
      bonus: q.bonus,
      total: die + q.bonus,
      dc: q.dc,
      success,
      name: q.name,
    };
    Clog(
      s,
      `🎲 ${p.alias}: ${die} + ${q.bonus} = ${die + q.bonus} gegen ${q.dc}. ${die === 20 ? "KRITISCHER ERFOLG!" : die === 1 ? "PATZER!" : success ? "Erfolg!" : "Fehlschlag."}`,
    );
    if (q.kind === "exploration") {
      if (success) { s.facts[q.effect] = true; Clog(s,q.success); }
      else { for (const ally of q.group ? Calive(s) : [p]) Cdamage(s,ally,q.harm); Clog(s,q.downside); }
      if (!Calive(s).length) { s.status="lost"; Clog(s,"Die Expedition endet an der Falle. Eure Charaktere bleiben sichtbar."); }
      return;
    }
    if (success) {
      if (q.kind === "tame") {
        p.pet = true;
        Clog(
          s,
          "Das Monster unterschreibt freiwillig seinen Begleitervertrag. Deine Angriffe erhalten dauerhaft +1 Schaden.",
        );
        return Creward(s);
      }
      let damage = q.power + (die === 20 ? 3 : 0);
      Cboard(s).enemy.hp = Math.max(0, Cboard(s).enemy.hp - damage);
      Clog(
        s,
        `${q.name} verursacht ${damage} Schaden. Gegner: ${Cboard(s).enemy.hp}/${Cboard(s).enemy.maxHp} LP.`,
      );
      if (q.kind === "environment") {
        s.combat.setupUsed = true;
        s.combat.weaken = 2;
      }
      if (Cboard(s).enemy.hp === 0) return Creward(s);
    } else if (q.backlash) {
      const damage = q.backlash + (die === 1 ? 2 : 0);
      for (const ally of Calive(s)) Cdamage(s, ally, damage);
      Clog(
        s,
        `Die Wolke zieht in die falsche Richtung: ${damage} LP Schaden an jedem zuvor stehenden Gruppenmitglied.`,
      );
      if (!Calive(s).length) {
        s.status = "lost";
        s.combat = null;
        Clog(s, "Die letzte Wolke war eure eigene. Die Truppe ist besiegt.");
        return;
      }
    }
    Cadvance(s, p);
    return;
  }
  if (data.type === "cancel") {
    if (s.pending?.id !== id)
      Cfail("Du kannst nur deinen eigenen Wurf abbrechen.");
    s.pending = null;
    Clog(
      s,
      `${p.alias} bricht die Vorbereitung ab. Kein Fokus und kein Zug verbraucht.`,
    );
    return;
  }
  if (data.type === "talent") {
    if (s.pending) Cfail("Erst den offenen Wurf abschließen.");
    if (!p.points) Cfail("Kein Talentpunkt übrig.");
    if (Cactive(s)) Cfail("Talente lernt ihr zwischen den Kämpfen.");
    if (
      !["kraft", "geschick", "magie", "vital", "schaden"].includes(data.talent)
    )
      Cfail("Unbekanntes Talent.");
    p.points--;
    p.talents.push(data.talent);
    if (data.talent === "vital") {
      p.maxHp += 4;
      p.hp = Math.min(p.maxHp, p.hp + 4);
    } else if (data.talent === "schaden") p.damageBonus++;
    else p.stats[["kraft", "geschick", "magie"].indexOf(data.talent)]++;
    Clog(s, `${p.alias} lernt ${data.talent}: ein Talentpunkt eingesetzt.`);
    return;
  }
  if (s.status !== "play")
    Cfail(
      "Diese Runde ist abgeschlossen. Eure Charakterblätter bleiben sichtbar; für einen neuen Versuch einen neuen Raum öffnen.",
    );
  if (data.type === "buy") {
    if (s.room !== "kapelle" || !s.facts.rest || Cactive(s) || s.pending)
      Cfail("Handeln geht nach der sicheren Rast in der Kapelle.");
    const prices = { Nugget: 8, Fokusbrause: 10, "Goldener Nugget": 14 };
    const price = prices[data.item];
    if (!price) Cfail("Dieses Angebot gibt es nicht.");
    if (p.gold < price) Cfail("Nicht genug Gold.");
    p.gold -= price;
    Cadd(p, data.item);
    Clog(
      s,
      `${p.alias} tauscht ${price} Gold gegen ${data.item}. Die Braut nennt es Servicepauschale.`,
    );
    return;
  }
  if (data.type === "use") return Cuse(s, p, data.item, data.target);
  if (data.type === "skill") return Cskill(s, p, data.skill, data.target);
  if (data.type === "loot") {
    if (Cactive(s) || s.pending) Cfail("Erst die Begegnung abschließen.");
    const b = Cboard(s);
    const i = b.loot.indexOf(data.item);
    if (i < 0) Cfail("Dieses Beutestück wurde bereits genommen.");
    b.loot.splice(i, 1);
    Cadd(p, data.item);
    Clog(s, `${p.alias} nimmt ${data.item}.`);
    return;
  }
  if (data.type === "give") {
    if (Cactive(s) || s.pending)
      Cfail("Gegenstände tauscht ihr zwischen den Kämpfen.");
    const target = Cp(s, data.target);
    if (!target || target.id === id) Cfail("Wähle einen anderen Helden.");
    if (!p.bag.includes(data.item)) Cfail("Das ist nicht in deinem Rucksack.");
    if (p.weapon === data.item || p.armor === data.item)
      Cfail("Lege diesen Gegenstand zuerst ab.");
    Cremove(p, data.item);
    Cadd(target, data.item);
    Clog(s, `${p.alias} gibt ${target.alias}: ${data.item}.`);
    return;
  }
  if (data.type === "unequip") {
    if (Cactive(s) || s.pending)
      Cfail("Ausrüstung wechselt ihr zwischen den Kämpfen.");
    if (data.slot === "armor") p.armor = null;
    else Cfail("Deine Waffe behältst du bis zum Wechsel auf eine andere.");
    return;
  }
  if (data.type === "attack") return Cattack(s, p);
  if (data.type === "defend") return Cidea(s, p, "Ich verteidige mich");
  if (data.type !== "act") Cfail("Unbekannte Aktion.");
  const raw = String(data.idea ?? "").trim();
  if (!raw || raw.length > 500) Cfail("Schreibe 1–500 Zeichen.");
  if (s.pending) Cfail("Zuerst den offenen Wurf abschließen oder abbrechen.");
  Clog(s, raw, p.alias);
  Cidea(s, p, raw);
}
export function crawlerView(s, id, code, version) {
  if (s.crawler !== 3) return { legacy: true, code, version };
  const me = Cp(s, id);
  const combat = Cactive(s) ? s.combat : null;
  const b = Cboard(s);
  const room = Croom(s);
  const playerView = (p) => ({
    id: p.id,
    alias: p.alias,
    classId: p.classId,
    level: p.level,
    hp: p.hp,
    maxHp: p.maxHp,
    focus: p.focus,
    maxFocus: p.classId ? CmaxFocus(p) : 3,
    down: p.hp === 0,
  });
  const q = s.pending;
  const chance = q
    ? Array.from({ length: 20 }, (_, i) => i + 1).filter(
        (n) => n === 20 || (n !== 1 && n + q.bonus >= q.dc),
      ).length * 5
    : null;
  return {
    crawler: 3,
    code,
    version,
    solo: s.solo,
    host: s.host === id,
    status: s.status,
    room: {
      id: s.room,
      name: room.name,
      image: room.image,
      objects: room.objects,
      paths: dungeonPaths(s,crawlerRooms).map((k) => ({
        locked: dungeonGate(s,s.room,k),
        id: k,
        name: crawlerRooms[k].name,
        visited: Boolean(s.boards[k]),
      })),
    },
    players: s.players.map((p) => ({ ...playerView(p), self: p.id === id })),
    me: me
      ? {
          ...playerView(me),
          stats: me.stats,
          bag: me.bag,
          weapon: me.weapon,
          armor: me.armor,
          gold: me.gold,
          points: me.points,
          xp: me.xp,
          nextXp: me.level >= 4 ? null : [4, 8, 14][me.level - 1],
          talents: me.talents,
          pet: me.pet,
          damageBonus: me.damageBonus,
        }
      : null,
    classes: crawlerClasses,
    skills: crawlerSkills,
    items: crawlerItems,
    quest: s.quest,
    messages: s.messages.slice(-100),
    narration: s.narration,
    loot: b?.loot ?? [],
    shop:
      s.room === "kapelle" && s.facts.rest
        ? { Nugget: 8, Fokusbrause: 10, "Goldener Nugget": 14 }
        : null,
    map: dungeonMap(s,crawlerRooms),
    objectives: ["Sonnensiegel","Mondsiegel","Grabessiegel"].map(name=>({name,done:s.quest.includes(name)})),
    explored: Object.keys(s.boards).map((k) => ({
      id: k,
      name: crawlerRooms[k].name,
      clear: s.boards[k].clear,
    })),
    pending: q
      ? {
          mine: q.id === id,
          actor: q.actor,
          name: q.name,
          bonus: q.bonus,
          dc: q.dc,
          cost: q.cost,
          chance,
          success: q.success,
          downside: q.downside,
        }
      : null,
    lastRoll: s.lastRoll,
    combat: combat
      ? {
          round: combat.round,
          turn: Cp(s, combat.queue[combat.index])?.alias,
          mine: combat.queue[combat.index] === id,
          enemy: {
            name: room.enemy.name,
            title: room.enemy.title,
            hp: b.enemy.hp,
            maxHp: b.enemy.maxHp,
            defense: room.enemy.defense,
          },
          intent: {
            ...combat.intent,
            targets: combat.intent.targets.map((k) => Cp(s, k).alias),
          },
          stun: combat.stun,
          shield: combat.shield,
        }
      : null,
    progress: {
      gate: Boolean(s.facts.gate),
      invitation: s.quest.includes("Einladung"),
      rest: Boolean(s.facts.rest),
      crown: Boolean(s.facts.crown),
    },
  };
}

// Intent interpretation is separate from authoritative state changes.
function Cidea(s,p,raw){
 const request=dungeonNormalize(raw);
 if(/^(?:hilfe|help|anleitung|spielregeln|regeln|wie (?:geht|spielt|funktioniert|spiel ich|spielen wir))\b/.test(request))return Clog(s,dungeonHelp);
 if(/\b(?:hinweis|tipp|tip|hint)\b/.test(request)||/^(?:ich|wir) (?:komme|kommen) nicht weiter/.test(request)){
  if(/\b(?:kein|keinen|keine|nicht|ohne)\b/.test(request)&&!/nicht weiter/.test(request))return Clog(s,'Kein Hinweis. Ihr erkundet auf eigene Faust weiter.');
  s.hints??={};s.hints[p.id]??={};const level=Math.min(2,(s.hints[p.id][s.room]??0)+1);s.hints[p.id][s.room]=level;
  return Clog(s,`Hinweis ${level}/2 · `+dungeonHint(s,level)+(level===1?' Für einen konkreteren Tipp schreib „noch ein Hinweis“.':' Das ist die konkretere Hinweisstufe; die Handlung entscheidet ihr selbst.'));
 }

 s.language ??= {};
 const memory=s.language[p.id]??{};
 const objects=Croom(s).objects.map(name=>({id:name,name,aliases:[name.split(' ').at(-1)]}));
 let i=interpretDungeonInput(raw,{objects,lastTarget:s.focus[p.id],lastIntent:memory.ask?memory:null});
 let t=i.text;
 if(i.target)s.focus[p.id]=i.target;
 if(!i.target&&s.focus[p.id]&&/\b(sie|ihn|es|das|daran|damit)\b/.test(t))t+=' '+dungeonNormalize(s.focus[p.id]);
 s.language[p.id]={kind:i.kind,ask:false};
 const say=text=>Clog(s,text), b=Cboard(s), has=item=>p.bag.includes(item), action=!['inspect','question','negated'].includes(i.kind);
 if(!p.hp&&action)return say('Du liegst am Boden. Ein anderer Held muss dich heilen oder dir aufhelfen.');
 const ask=(text,kind=i.kind)=>{s.language[p.id]={kind,ask:true};return say(text);};
 const once=(key,items,text)=>{if(b[key])return say('Schon erledigt. Hier entsteht keine neue Beute.');b[key]=true;b.loot.push(...items);return say(text+' Am Boden: '+items.join(', ')+'.');};
 const risk=(effect,name,stat,dc,harm,group=false)=>{if(s.facts[effect])return say('Dieser Weg ist bereits gesichert.');return Cprepare(s,p,{kind:'exploration',effect,name,stat,dc,harm,group,cost:0,success:'Der Mechanismus ist dauerhaft gesichert; der Weg ist offen.',downside:(group?'Jeder stehende Held':'Du')+' verliert '+harm+' LP. Der Weg bleibt gesperrt.'});};
 if(i.kind==='negated')return say('Du führst diese Handlung nicht aus. Beschreibe, was du stattdessen versuchen möchtest.');
 if(i.kind==='question')return say('Du kannst die Umgebung untersuchen, Werkzeuge kombinieren und eigene Versuche beschreiben. Riskante Handlungen erhalten vorab eine Würfelvorschau mit den genauen Folgen.');
 if(i.kind==='agree'&&Object.keys(s.votes).length)return Cmove(s,p,Object.values(s.votes)[0]);
 const paths=dungeonPaths(s,crawlerRooms);
 const destination=paths.find(id=>(dungeonAliases[id]??[]).some(a=>new RegExp('\\b'+a+'\\b').test(t)));
 if(i.kind==='move'||(i.kind==='unknown'&&destination)){
  let to=destination;
  if(!to&&/zuruck/.test(t)&&paths.includes(s.previous))to=s.previous;
  if(!to&&/weiter|rein/.test(t)){const unseen=paths.filter(k=>!s.boards[k]);if(unseen.length===1)to=unseen[0];else if(paths.length===1)to=paths[0];}
  return to?Cmove(s,p,to):say('Wohin? Von hier führen Wege nach: '+paths.map(k=>crawlerRooms[k].name).join(' · ')+'. Du kannst den Raumnamen schreiben.');
 }
 if(i.kind==='inspect'){
  if(s.room==='archiv'&&/noten|deckel|melodie|truhe/.test(t))b.notes=true;
  if(s.room==='lager')return say(/rucksack|tasche/.test(t)?'Aus dem hängenden Rucksack ragt ein Eisenschlüssel. Du kannst den Rucksack öffnen oder den Schlüssel herausnehmen.':/eisen|schloss/.test(t)?(b.iron?'Die Eisentruhe steht offen und ist leer. Ihr könnt den Inhalt nicht ein zweites Mal finden.':'Die Eisentruhe hat ein Messingschloss. Der Schlüssel vom Eingang passt. Die Vorratskiste daneben ist unverschlossen.'):/rune|riss/.test(t)?'Eine unvollständige Mondrune verläuft im Mauerriss. Runenkreide könnte die verborgenen Linien verbinden.':'Auf der Werkbank: '+(b.loot.join(', ')||'keine freie Beute mehr')+'. Dazu Vorratskiste, verschlossene Eisentruhe und hängender Rucksack.');
  if(s.room==='falle')return say(s.facts.trapSafe?'Die Druckplatte ist dauerhaft gesichert. Ihr könnt zur Grabkammer.':'Die Druckplatte zieht über das Gegengewicht die Speere heraus. Ein Brett mit Stein kann sie sicher blockieren. Mit Brecheisen lässt sich der Hebel riskant verkeilen (W20 + Geschick gegen 14, sonst 3 LP Gruppenschaden).');
  if(s.room==='gabel')return say('Die Wege führen zu Vorratsgrotte, Brücke, Pilzhöhle und Skelettamt. '+(s.facts.oakDoor?'Die Eichentür steht offen.':'Die Eichentür zum Amt ist verriegelt.')+' Am Boden: '+(b.loot.join(', ')||'keine freie Beute')+'.');
  if(s.room==='bruecke')return say(s.facts.bridge?'Der gesicherte Übergang zur Schmiede bleibt begehbar. Die verbauten Materialien sind nicht mehr im Rucksack.':Croom(s).story);
  if(s.room==='schmiede')return say((s.facts.forge?'Die Schmiede läuft. Jeder Held kann einmal für 8 Gold seine Waffe verbessern.':'Dem Blasebalg fehlt ein Zahnrad. Ein Ersatzteil könnte in der Eisentruhe liegen.')+' '+(s.facts.forgeHatch?'Die Eisenluke zum Archiv steht offen.':'Die Eisenluke besitzt hier einen einfachen Riegel.'));
  if(s.room==='quelle')return say(s.facts.springUsed?'Die Quelle hat ihre einmalige Kulanz bereits vergeben. Die Wasserkanäle und das Ventil bleiben zugänglich.':Croom(s).story);
  if(['pilze','grabkammer'].includes(s.room))return say(b.clear?'Der Wächter ist bezwungen. Das Siegel liegt bereits bei euren gemeinsamen Questgegenständen. Am Boden: '+(b.loot.join(', ')||'keine freie Beute')+'.':Croom(s).story+' '+Croom(s).enemy.weakness);
  return CideaLegacy(s,p,'untersuche '+t);
 }
 // Visible loose items can be collected once, including tools not in the old vocabulary.
 if(i.kind==='take'&&b.loot.length&&!/messing|rucksack|siegel/.test(t)){
  if(Cactive(s))return say('Erst die Begegnung klären; im Kampf wird keine Bodenbeute eingesammelt.');
  const found=i.all?[...b.loot]:b.loot.filter(name=>t.includes(Cplain(name)));
  if(found.length){for(const name of found){Cadd(p,name);b.loot.splice(b.loot.indexOf(name),1);}return say(p.alias+' nimmt: '+found.join(', ')+'.');}
 }
 // Shared seal locks cannot be bypassed by generic "open door" parsing.
 if(['kapelle','grabkammer'].includes(s.room)&&/siegel|mulde|throntur|dreisiegel|tur/.test(t)&&action&&!Cactive(s)){
  const missing=['Sonnensiegel','Mondsiegel','Grabessiegel'].filter(x=>!s.quest.includes(x));
  if(missing.length)return say('Die Dreisiegeltür bleibt zu. Es fehlen: '+missing.join(', ')+'.');
  s.facts.throneDoor=true;return say('Sonne, Mond und Grab rasten ein. Die Dreisiegeltür zum Thronsaal ist jetzt offen.');
 }
 if(s.room==='lager'&&action){
  if(/rucksack|tasche|eisenschlussel/.test(t)){if(b.key)return say('Der Rucksack ist leer; der Eisenschlüssel liegt bereits bei euren gemeinsamen Questgegenständen.');b.key=true;Cquest(s,'Eisenschlüssel');return say('Im hängenden Rucksack findet ihr den Eisenschlüssel für die Eichentür an der Weggabelung.');}
  if(/rune|riss|kreide/.test(t)&&i.kind!=='take'){
   if(!has('Runenkreide'))return say('Du brauchst Runenkreide im eigenen Rucksack. Auf der Werkbank lag welche.');
   s.facts.shortcut=true;return say('Die nachgezogene Mondrune öffnet einen schmalen Geheimgang zum Speerkorridor. Er bleibt auf eurer Karte sichtbar.');
  }
  if(/truhe|kiste|eisern|vorrat/.test(t)&&['open','force','use'].includes(i.kind)){
   if(!/eisen|eisern|vorrats|holz|einfache/.test(t))return ask('Welche meinst du: die einfache Vorratskiste oder die verschlossene Eisentruhe?','open');
   if(/eisen|eisern/.test(t)){
    if(!s.quest.includes('Messingschlüssel'))return say('Die Eisentruhe ist verschlossen. Das Messingschloss passt zum Schlüssel am Eingang.');
    return once('iron',['Zahnrad','Bademantel der Unantastbarkeit'],'Du öffnest die Eisentruhe. Ein Zahnrad passt vermutlich in den Blasebalg.');
   }
   return once('supplies',['Nugget','Nugget','Fokusbrause'],'Die Vorratskiste ist offen.');
  }
 }
 if(s.room==='gabel'&&/eichen|tur|schlussel|brecheisen/.test(t)&&action){
  if(s.facts.oakDoor)return say('Die Eichentür ist bereits offen. Dahinter liegt das Skelettamt.');
  if(s.quest.includes('Eisenschlüssel')){s.facts.oakDoor=true;return say('Der Eisenschlüssel öffnet die Eichentür zum Skelettamt.');}
  if(has('Brecheisen'))return risk('oakDoor','Eichentür aufhebeln',0,14,3);
  return say('Die Eichentür ist verriegelt. Suche einen Eisenschlüssel oder hole ein Brecheisen aus der Vorratsgrotte.');
 }
 if(s.room==='bruecke'&&action&&/bruck|seil|brett|plank|haken|spring|sprung|repar|bau|sicher/.test(t)){
  if(s.facts.bridge)return say('Der Übergang ist bereits gesichert und bleibt offen.');
  if(has('Seil')&&has('Brett')){Cremove(p,'Seil');Cremove(p,'Brett');s.facts.bridge=true;return say('Du verbaust Seil und Brett am Eisenhaken. Die ganze Truppe kann die Brücke jetzt sicher zur Schmiede überqueren.');}
  if(/spring|sprung/.test(t))return risk('bridge','Riskanten Übergang erklettern',1,15,4,true);
  return say('Für die sichere Reparatur brauchst du Seil UND Brett im eigenen Rucksack. Alternativ könnt ihr einen riskanten Übergang versuchen: Bei Fehlschlag verliert jeder 4 LP.');
 }
 if(s.room==='schmiede'&&action){
  if(/luke|riegel|tur/.test(t)){s.facts.forgeHatch=true;return say('Du schiebst den Riegel der Eisenluke zurück. Der Weg zum Archiv ist dauerhaft offen.');}
  if(/zahnrad|blasebalg|repar|ofen/.test(t)){
   if(s.facts.forge)return say('Die Schmiede läuft bereits. Du kannst für 8 Gold deine Waffe verbessern.');
   if(!has('Zahnrad'))return say('Das Zahnrad fehlt. Die Eisentruhe in der Vorratsgrotte könnte ein Ersatzteil enthalten.');
   Cremove(p,'Zahnrad');s.facts.forge=true;return say('Das Zahnrad greift, der Ofen erwacht. Jeder Held kann hier einmal für 8 Gold seine Waffe dauerhaft um +1 Schaden verbessern.');
  }
  if(/verbesser|schmied|waffe|hammer|amboss/.test(t)){
   b.upgrades??=[];if(b.upgrades.includes(p.id))return say('Deine einmalige Verbesserung ist schon geschmiedet.');
   if(!s.facts.forge)return say('Erst den Blasebalg mit einem Zahnrad reparieren.');
   if(p.gold<8)return say('Die Verbesserung kostet 8 Gold. Du hast '+p.gold+'.');
   p.gold-=8;p.damageBonus++;b.upgrades.push(p.id);return say('Deine Waffe erhält dauerhaft +1 Schaden. Der Amboss quittiert mit „Klong, du Otto“.');
  }
 }
 if(s.room==='pilze'&&!b.clear&&action&&/futter|futtere|nugget|fress|gib|geb|reich/.test(t)&&!Cactive(s)){
  if(!has('Nugget'))return say('Brösel verlangt ein echtes Nugget aus deinem Rucksack. Erfundenes Essen zählt nicht.');
  Cremove(p,'Nugget');say('Brösel verschlingt dein Nugget und räumt schnaufend das Mondsiegel frei. Ein Kampf ist nicht nötig.');return Creward(s);
 }
 if(s.room==='pilze'&&!b.clear&&!Cactive(s)&&(i.kind==='attack'||(i.kind==='take'&&/siegel/.test(t)))){CstartFight(s);return say('Brösel verteidigt sein Siegel. Der Kampf beginnt; achtet auf Zugfolge und angekündigten Angriff.');}
 if(s.room==='quelle'&&action){
  if(/ventil|kanal|dreh/.test(t)){s.facts.water=true;return say('Das Ventil spült Staub aus der Rille im Speerkorridor. Der Mechanismus ist dort nun leichter zugänglich.');}
  if(s.facts.springUsed)return say('Die einmalige Kulanz ist aufgebraucht. Die Quelle gibt keine weitere Heilung oder Fokus.');
  if(!/heil|leben|\blp\b|fokus|konzentration/.test(t))return ask('Einmal für die ganze Gruppe: Heilung (+6 LP) oder Fokus (+2)? Schreib deine Wahl.','use');
  s.facts.springUsed=true;const focus=/fokus|konzentration/.test(t);for(const ally of s.players){if(focus)ally.focus=Math.min(CmaxFocus(ally),ally.focus+2);else if(ally.hp>0)ally.hp=Math.min(ally.maxHp,ally.hp+6);}
  return say(focus?'Alle erhalten bis zu 2 Fokus. Die Quelle ist verbraucht.':'Alle stehenden Helden heilen bis zu 6 LP. Die Quelle ist verbraucht.');
 }
 if(s.room==='falle'&&action){
  if(/truhe|kiste/.test(t)&&['open','force','use'].includes(i.kind))return once('silver',['Goldener Nugget','Fokusbrause'],'Die silberne Truhe in der sicheren Nische öffnet sich.');
  if(/rune|kreide/.test(t)){if(!has('Runenkreide'))return say('Dazu brauchst du Runenkreide.');s.facts.shortcut=true;return say('Die Mondrune öffnet die Abkürzung zur Vorratsgrotte.');}
  if(/platte|falle|hebel|gegengewicht|brett|stein|speer|entscharf|verkeil/.test(t)){
   if(s.facts.trapSafe)return say('Die Druckplatte ist schon gesichert. Der Weg zur Grabkammer bleibt frei.');
   if(has('Brett')&&has('Stein')){Cremove(p,'Brett');Cremove(p,'Stein');s.facts.trapSafe=true;return say('Brett und Stein blockieren das Gegengewicht dauerhaft. Die Speere bleiben eingezogen.');}
   if(!has('Brecheisen'))return say('Sicher geht es mit Brett und Stein. Für einen riskanten Hebelversuch brauchst du ein Brecheisen.');
   return risk('trapSafe','Speermechanismus verkeilen',1,s.facts.water?11:14,3,true);
  }
 }
 if(s.room==='archiv'&&/luke/.test(t)&&action){if(!has('Brecheisen'))return say('Die Luke klemmt. Ein Brecheisen hilft; von der Schmiedeseite lässt sie sich entriegeln.');s.facts.forgeHatch=true;return say('Du hebelst die Luke auf. Der Weg zur Schmiede bleibt offen.');}
 if(s.room==='archiv'&&/ruckwart|umgekehrt/.test(t)&&/summ|sing|pfeif|melodie|noten/.test(t)&&!b.notes&&!b.inspected)return say('Ihr kennt die Noten noch nicht. Untersucht erst den Truhendeckel; bloßes Raten öffnet Klaudias Bissvertrag nicht.');
 if(Cactive(s)&&((s.room==='grabkammer'&&/kette|raucher|schale|schild.*klemm/.test(t))||(s.room==='pilze'&&/pilz.*(?:werf|wirf)|(?:werf|wirf).*pilz/.test(t)))){
  if(s.combat.setupUsed)return say('Diesen Raumvorteil habt ihr in dieser Begegnung schon genutzt.');
  return Cprepare(s,p,{kind:'environment',name:'Umgebung gegen den Wächter nutzen',stat:1,dc:13,cost:0,power:6+2*s.players.length,success:(6+2*s.players.length)+' Schaden und 2 weniger Monsterschaden in dieser Runde.',downside:'Kein Vorteil. Dein Zug ist verbraucht.'});
 }
 // Skill names and environmental targets retain priority over generic combat verbs.
 const namedSkill=Object.values(crawlerSkills).some(sk=>t.includes(Cplain(sk.name)))||/furz|wolken.?schlag|snooze|pfannenfinale|zahm|suppe|zapfhahn|sonnenbrand|rauchpause|deckel drauf|korperkontakt|aufersteh/.test(t);
 const environment=/winde|kette|fallgitter|flasche|scharnier|kronleuchter|gong/.test(t);
 if(i.kind==='attack'&&!namedSkill&&!environment)return Cactive(s)?Cattack(s,p):say('Hier steht gerade kein angreifendes Monster. Du kannst einen sichtbaren Gegenstand als Ziel nennen.');
 if(i.kind==='defend')return CideaLegacy(s,p,'verteidigen');
 if(i.kind==='rest')return CideaLegacy(s,p,'rasten');
 if(i.kind==='open')t='öffne '+t;
 if(i.kind==='take')t='nehme '+t;
 return CideaLegacy(s,p,t);
}

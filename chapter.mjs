// The first chapter has a bounded narrator: prose never invents committed facts.
export const rooms = {
  tor: {
    name: "Das Tor ohne Öffnungszeiten",
    image: "tor",
    intro:
      "Eine Treppe endet vor einem eisernen Tor. Ein steinernes Gesicht wacht darüber. Links hängt ein Messinggong, rechts steht ein trockenes Becken. „Beschwerden bitte persönlich beim König“, murmelt das Gesicht.",
  },
  archiv: {
    name: "Das Archiv der Ausreden",
    image: "archiv",
    intro:
      "Zwischen Schriftrollen steht eine Eichentruhe mit Messingschloss. An ihrem Deckel hängt eine kleine Glocke an einem Draht. Rechts liegt ein offenes Gästebuch neben einem Siegel auf dem Schreibpult. Eine Tür mit Kronenrelief führt tiefer hinein.",
  },
  kapelle: {
    name: "Die letzte Einladung",
    image: "kapelle",
    intro:
      "Drei Geister einer Hochzeitsgesellschaft warten hinter einem Sockel mit einer Krone. Vor ihnen stehen leere Teller. Links hängt eine Glocke, rechts führen Stufen ins Morgenlicht. „Die Krone bleibt, bis unser versprochenes Fest beginnt.“",
  },
};
const normalize = (t) =>
  String(t)
    .toLowerCase()
    .replaceAll("ß", "ss")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
const reject = (t) => {
  throw Error(t);
};
const say = (s, text, who = "Spielleitung") => {
  s.messages.push({ seq: ++s.seq, who, text, room: s.room });
  // Full history is persisted, independent of the current room.
  if (who === "Spielleitung") s.narration = text;
};
export function newRoom(host, solo = false) {
  return {
    chapter: 1,
    host,
    solo,
    status: "lobby",
    room: "tor",
    players: [],
    facts: {},
    inventory: [],
    messages: [],
    seq: 0,
    narration: "",
    votes: {},
    pending: null,
    focus: null,
  };
}
function describe(s) {
  const f = s.facts;
  if (s.room === "tor")
    return (
      rooms.tor.intro +
      " " +
      (f.gate ? "Das Tor steht offen." : "Das Tor ist geschlossen.") +
      " " +
      (f.key
        ? "Das Becken ist jetzt leer; den Messingschlüssel habt ihr."
        : "Im Becken glitzert etwas Messingfarbenes.")
    );
  if (s.room === "archiv")
    return (
      rooms.archiv.intro +
      " " +
      (f.chest
        ? "Die Truhe habt ihr bereits geöffnet und die Einladung herausgenommen."
        : "Die Truhe ist noch geschlossen.") +
      " " +
      (f.door
        ? "Die Kronentür steht offen."
        : "Die Kronentür ist versiegelt.") +
      (f.bellSafe ? " Die Alarmglocke ist gesichert." : "")
    );
  return (
    (f.crown
      ? "Der Sockel ist leer; ihr habt die Krone."
      : f.permission
        ? "Die Krone ruht auf dem Sockel. Die Geister haben sie euch freigegeben."
        : rooms.kapelle.intro) +
    " " +
    (f.feast
      ? "Auf den Tellern dampft inzwischen das Hochzeitsbuffet."
      : f.permission
        ? "Die Geister warten auf das Signal der Buffetglocke."
        : "Die Teller bleiben leer.") +
    (f.noise && !f.apology ? " Sie erinnern sich an euren Lärm." : "")
  );
}
function move(s, p, target) {
  if (target === s.room) return say(s, "Hier seid ihr bereits. " + describe(s));
  const adjacent = {
    tor: ["archiv"],
    archiv: ["tor", "kapelle"],
    kapelle: ["archiv", "ausgang"],
  };
  if (!adjacent[s.room].includes(target))
    return say(s, "Dorthin führt von hier kein direkter Weg.");
  if (s.room === "tor" && !s.facts.gate)
    return say(
      s,
      "Das Tor ist noch geschlossen. Das Gesicht wartet auf eine Beschwerde; der Gong hängt links.",
    );
  if (target === "kapelle" && !s.facts.door && !s.facts.registered)
    return say(
      s,
      "Die Kronentür ist versiegelt. Neben dem Relief ist eine flache Mulde für ein Siegel.",
    );
  if (target === "ausgang" && !s.facts.crown)
    return say(
      s,
      "Der Ausgang ist frei, aber euer Auftrag ist noch offen: Die Krone ist noch auf dem Sockel.",
    );
  s.votes[p.id] = target;
  const needed = Math.floor(s.players.length / 2) + 1;
  const count = Object.values(s.votes).filter((x) => x === target).length;
  if (count < needed)
    return say(
      s,
      `${p.alias} möchte ${target === "ausgang" ? "ins Freie" : rooms[target].name + " betreten"}. ${count}/${needed} Stimmen. Die anderen können im Chat zustimmen oder ein anderes Ziel nennen.`,
    );
  s.votes = {};
  s.focus = null;
  if (target === "ausgang") {
    s.status = "won";
    return say(
      s,
      "Ihr tragt die Krone ins Morgenlicht. " +
        (s.facts.feast
          ? "Hinter euch beginnt nach dreihundert Jahren endlich das Hochzeitsfest."
          : s.facts.permission
            ? "Die Geister winken euch nach; auf das Buffet warten sie weiter."
            : "Hinter euch schimpft die Braut über den Diebstahl. Ihr habt die Krone, aber keine Freunde in der Gruft gewonnen.") +
        " Der erste Abschnitt ist geschafft.",
    );
  }
  s.room = target;
  say(s, rooms[target].name + " — " + describe(s));
}
function trial(s, p, fact, dc, success) {
  s.pending = { id: p.id, actor: p.alias, fact, dc, success };
  say(
    s,
    `Das ist riskant. ${p.alias}, würfle einen echten W20: ab ${dc} gelingt es. Ein Fehlschlag macht Lärm und erschwert später das Gespräch mit den Geistern.`,
  );
}
function commit(s, fact) {
  s.facts[fact] = true;
  if (fact === "chest" && !s.facts.bellSafe)
    s.facts.noise = Math.min(3, (s.facts.noise || 0) + 1);
  const item = {
    key: "Messingschlüssel",
    chest: "Einladung",
    seal: "Königssiegel",
    crown: "Krone",
  }[fact];
  if (item && !s.inventory.includes(item)) s.inventory.push(item);
}
export function apply(s, id, data) {
  if (!s.chapter)
    reject(
      "Dieser Raum stammt aus der alten Version. Bitte einen neuen Gruppenraum öffnen.",
    );
  const p = s.players.find((x) => x.id === id);
  if (data.type === "join") {
    if (p) return;
    if (id === s.host && !s.solo)
      reject(
        "Das Tablet ist die gemeinsame Ansicht. Tritt auf einem Handy bei.",
      );
    if (s.status !== "lobby" || s.players.length >= 6)
      reject("Diese Runde läuft bereits oder ist voll.");
    const alias =
      String(data.alias ?? "")
        .trim()
        .slice(0, 24) || "Held " + (s.players.length + 1);
    if (s.players.some((x) => normalize(x.alias) === normalize(alias)))
      reject("Dieser Name ist schon vergeben.");
    s.players.push({ id, alias });
    return;
  }
  if (data.type === "start") {
    if (!p)
      reject(
        "Startet auf einem Spielerhandy. Das Tablet dient nur zur Ansicht.",
      );
    if (s.status !== "lobby") reject("Die Runde läuft bereits.");
    if (s.players.length < (s.solo ? 1 : 2))
      reject("Mindestens zwei Spieler müssen beitreten.");
    s.status = "play";
    say(
      s,
      "Euer Auftrag: Holt die Krone des falschen Königs aus der Gruft. Sprecht miteinander, untersucht die Räume und beschreibt eure Ideen auf den Handys.",
    );
    say(s, describe(s));
    return;
  }
  if (!p) reject("Das Tablet dient nur zur Ansicht. Nutze dein Spielerhandy.");
  if (s.status !== "play")
    reject("Die Runde ist noch nicht gestartet oder bereits abgeschlossen.");
  if (data.type === "roll") {
    const q = s.pending;
    if (!q || q.id !== id) reject("Du hast keinen offenen Wurf.");
    const die = Number(data.die);
    if (!Number.isInteger(die) || die < 1 || die > 20)
      reject("Trage eine ganze Zahl von 1 bis 20 ein.");
    s.pending = null;
    say(s, "W20: " + die, p.alias);
    if (die >= q.dc) {
      commit(s, q.fact);
      say(
        s,
        q.success +
          (q.fact === "chest" && !s.facts.bellSafe
            ? " Dabei klingelt die ungesicherte Glocke bis in die Kapelle."
            : ""),
      );
    } else {
      s.facts.noise = Math.min(3, (s.facts.noise || 0) + 1);
      say(
        s,
        "Es misslingt. Der Lärm trägt bis zur Kapelle; dort werden die Gäste misstrauischer. Nichts ist verloren: Ihr könnt einen anderen Weg versuchen oder den Versuch wiederholen.",
      );
    }
    return;
  }
  if (data.type !== "act") reject("Beschreibe deine Absicht im Chat.");
  const raw = String(data.idea ?? "").trim();
  if (!raw || raw.length > 500) reject("Schreibe zwischen 1 und 500 Zeichen.");
  if (s.pending)
    reject(
      "Beantwortet zuerst den offenen W20-Wurf. Dein Text bleibt im Eingabefeld.",
    );
  say(s, raw, p.alias);
  let t = normalize(raw);
  const has = (re) => re.test(t);
  const inspect = has(
    /untersuch|schau|anseh|pruf|betracht|les|such|horch|lausche|was |wo |hinseh|umseh|inspiz/,
  );
  const take = has(/nehm|nimm|hol|greif|fisch|samm|steck.*ein|mitnehm|einpack/);
  const open = has(/offn|aufmach|mach.*auf|aufschliess|schliess.*auf/);
  const force = has(
    /aufbrech|knack|hebel|einschlag|zerschlag|eintret|gewalt|brech.*auf|zauber|magie|verzauber/,
  );
  const f = s.facts;
  // Negation and hypothetical questions must never commit an action.
  if (has(/\b(nicht|kein\w*|niemals)\b/))
    return say(
      s,
      "Du beschreibst etwas, das du vermeiden willst. Welche Handlung möchtest du stattdessen versuchen?",
    );
  if (
    has(
      /was (?:ware|passiert)|kann ich|konnen wir|konnte ich|soll(?:te)? ich|wenn ich/,
    )
  )
    return say(
      s,
      "Das wäre ein Versuch, noch keine Handlung. Beschreibe, was du tatsächlich tust; bei einem Risiko kündige ich vorher den Wurf und die Folgen an.",
    );
  if (has(/inventar|rucksack|was haben|besitz/))
    return say(
      s,
      "Gemeinsamer Besitz: " + (s.inventory.join(", ") || "noch nichts") + ".",
    );
  if (
    has(
      /\b(ja|zustimm\w*|stimm\w* zu|einverstanden|mitgehen|folge|folgen|bin dabei)\b/,
    ) &&
    Object.keys(s.votes).length
  )
    return move(s, p, Object.values(s.votes)[0]);
  if (has(/geh|betret|weiter|zuruck|verlass|lauf|wechsel|hinaus/) && !inspect) {
    let target = has(/archiv/)
      ? "archiv"
      : has(/kapelle|hochzeit|tiefer/)
        ? "kapelle"
        : has(/eingang|treppe|zum tor/)
          ? "tor"
          : has(/ausgang|frei|hinaus|morgenlicht/)
            ? "ausgang"
            : null;
    if (!target && has(/zuruck/))
      target = { archiv: "tor", kapelle: "archiv" }[s.room];
    if (!target && has(/weiter|durch.*tor|durch.*tur/))
      target = { tor: "archiv", archiv: "kapelle", kapelle: "ausgang" }[s.room];
    if (target) return move(s, p, target);
  }
  // Resolve short follow-ups such as “Ich öffne sie” using the shared focus.
  if (
    s.focus &&
    !has(
      /truhe|kiste|gong|becken|gesicht|tor|tur|buch|siegel|glock|geist|gast|gaste|krone|schlussel/,
    ) &&
    has(/\b(sie|ihn|es|das|daran|damit|mich|uns)\b/)
  )
    t += " " + s.focus;
  const focus = (re, name) => {
    if (has(re)) {
      s.focus = name;
      return true;
    }
    return false;
  };
  if (s.room === "tor") {
    if (has(/laser|pistole|drache|teleport/))
      return say(
        s,
        "So etwas ist in diesem Raum nicht vorhanden. Beschreibe einen Versuch mit etwas, das ihr hier seht.",
      );
    if (focus(/becken|\b(?:messing)?schlussel(?:s)?\b/, "becken")) {
      if (take) {
        if (f.key)
          return say(
            s,
            "Den Messingschlüssel habt ihr bereits. Im Becken liegt kein zweiter.",
          );
        commit(s, "key");
        return say(
          s,
          "Du nimmst den Messingschlüssel aus dem trockenen Becken. Er trägt eine winzige Krone.",
        );
      }
      return say(
        s,
        f.key
          ? "Das Becken ist leer. Der Messingschlüssel ist bei euch."
          : "Zwischen Staub und Blättern liegt ein Messingschlüssel mit einer kleinen Krone.",
      );
    }
    if (focus(/gong|filz/, "gong")) {
      if (inspect && f.felt)
        return say(
          s,
          "Der Filz ist bereits entfernt. Der Gong kann frei schwingen." +
            (f.gate ? " Das Tor steht offen." : ""),
        );
      if (inspect)
        return say(
          s,
          "Der Gong ist auf der Rückseite mit Filz gedämpft. Der Filz lässt sich abziehen. Das steinerne Gesicht scheint auf einen klaren Ton zu warten.",
        );
      if (has(/filz/) && has(/zieh|entfern|los|abnehm/)) {
        f.felt = true;
        return say(
          s,
          "Du ziehst den Filz ab. Der Gong kann nun frei schwingen.",
        );
      }
      if (has(/schlag|laut|kling|klopf|hau|betatig|spiel/)) {
        if (f.gate)
          return say(
            s,
            "Das Tor ist bereits offen. Der Ton hallt im Gang nach.",
          );
        if (!f.felt)
          return say(
            s,
            "Nur ein dumpfes Plopp. Etwas auf der Rückseite dämpft den Gong.",
          );
        commit(s, "gate");
        return say(
          s,
          "Der helle Ton weckt das Gesicht. „Beschwerdeführer! Endlich.“ Das Tor schwingt auf. Dahinter liegt das Archiv.",
        );
      }
    }
    if (focus(/gesicht|wachter|beschwer|red|sprech|frag|sag/, "gesicht")) {
      if (has(/beschwer|konig|fest|essen|einlass|offn|bitte/) && !inspect) {
        commit(s, "gate");
        return say(
          s,
          "„Eine Beschwerde gegen den König? Zuständig ist das Archiv.“ Das Gesicht öffnet euch das Tor.",
        );
      }
      return say(
        s,
        "„Ich höre nur Beschwerden. Für Musik ist der Gong zuständig“, sagt das Gesicht.",
      );
    }
    if (focus(/tor|gitter/, "tor")) {
      if (f.gate)
        return say(s, "Das Tor steht offen. Der Weg ins Archiv ist frei.");
      if (force)
        return trial(
          s,
          p,
          "gate",
          13,
          "Das Tor gibt unter eurem Versuch nach. Der Weg ins Archiv ist frei.",
        );
      return say(
        s,
        "Das Tor hat kein Schlüsselloch. Das steinerne Gesicht kontrolliert den Verschluss.",
      );
    }
  }
  if (s.room === "archiv") {
    if (focus(/glock|draht|alarm/, "glocke")) {
      if (f.bellSafe)
        return say(
          s,
          "Die kleine Glocke ist bereits gesichert und kann keinen Alarm mehr schlagen.",
        );
      if (inspect)
        return say(
          s,
          "Der Draht zieht beim Öffnen des Deckels den Klöppel an. Du könntest ihn aushängen oder die Glocke mit dem Stoff des Tisches dämpfen.",
        );
      if (has(/los|ab|entfern|hang|dampf|stoff|tuch|halt|fixier|klemm|wick/)) {
        commit(s, "bellSafe");
        return say(
          s,
          "Du sicherst den Klöppel. Der Deckel kann sich jetzt lautlos öffnen.",
        );
      }
    }
    if (focus(/truhe|kiste|schloss|schlussel/, "truhe")) {
      if (f.chest)
        return say(
          s,
          "Die Truhe ist bereits geöffnet. Die Einladung liegt in eurem gemeinsamen Besitz; sonst ist sie leer.",
        );
      if (inspect)
        return say(
          s,
          "Das Messingschloss trägt eine kleine Krone. Am Deckel sitzt eine Alarmglocke. Ein passender Schlüssel oder ein riskanter Versuch könnten das Schloss öffnen.",
        );
      if (
        open ||
        force ||
        has(/schlussel.*(?:nutz|benutz)|(?:nutz|benutz).*schlussel/)
      ) {
        if (f.key && !force) {
          commit(s, "chest");
          if (!f.bellSafe) {
            say(
              s,
              "Der Schlüssel passt. Beim Öffnen klingelt die Alarmglocke; die Gäste in der Kapelle hören euch.",
            );
          }
          return say(
            s,
            "Die Truhe öffnet sich. Ihr findet eine unterschriebene Einladung: „Essen für alle. Gez. Seine Majestät.“ Die Einladung gehört nun euch.",
          );
        }
        if (force)
          return trial(
            s,
            p,
            "chest",
            12,
            "Das Schloss springt auf. Ihr nehmt die unterschriebene Einladung aus der Truhe: „Essen für alle. Gez. Seine Majestät.“",
          );
        return say(
          s,
          "Die Truhe ist verschlossen. Das Schloss trägt eine kleine Krone.",
        );
      }
    }
    if (
      !has(/tur|relief/) &&
      focus(
        /buch|gasteliste|gastebuch|pult|siegel|schrift|rolle|papier|tisch/,
        "buch",
      )
    ) {
      if (has(/siegel/) && take) {
        if (f.seal) return say(s, "Das Königssiegel ist bereits bei euch.");
        commit(s, "seal");
        return say(
          s,
          "Du löst das Königssiegel vorsichtig vom Buch auf dem Schreibpult. Es passt zur Mulde an der Kronentür.",
        );
      }
      if (
        has(/schreib|eintrag|trag.*ein|falsch|unterzeichn|stempel/) &&
        !inspect
      ) {
        commit(s, "registered");
        return say(
          s,
          "Ihr tragt euch als Beschwerdeführer ein. Das Buch bestätigt: „Zur Kapelle zugelassen.“ Die Kronentür entriegelt sich.",
        );
      }
      f.readBook = true;
      return say(
        s,
        "Im Buch steht: „Beschwerden über das Hochzeitsbuffet: Kapelle. Zutritt mit Königssiegel oder Eintrag im Gästebuch.“ Am Buch haftet ein Königssiegel aus Wachs.",
      );
    }
    if (focus(/tur|relief/, "tur")) {
      if (f.door || f.registered) {
        f.door = true;
        return say(
          s,
          "Die Kronentür ist entriegelt. Dahinter liegt die Kapelle.",
        );
      }
      if (has(/siegel/) && f.seal) {
        commit(s, "door");
        return say(
          s,
          "Du drückst das Königssiegel in die Mulde. Die Tür öffnet sich zur Kapelle.",
        );
      }
      if (force)
        return trial(
          s,
          p,
          "door",
          14,
          "Die Kronentür gibt nach. Dahinter liegt die Kapelle.",
        );
      return say(
        s,
        "Die Kronentür ist versiegelt. Eine flache Mulde trägt das gleiche Wappen wie das Siegel auf dem Pult.",
      );
    }
  }
  if (s.room === "kapelle") {
    if (focus(/glock|seil|kordel/, "glocke")) {
      if (has(/zieh|laut|kling|schlag|betatig/) && !inspect) {
        if (!f.permission)
          return say(
            s,
            "Die Glocke ruft: „Buffet eröffnet!“ Doch die Geister rühren sich nicht. „Erst die unterschriebene Einladung, dann der Service.“",
          );
        commit(s, "feast");
        return say(
          s,
          "Die Glocke läutet. Warmes Brot und dampfende Schüsseln erscheinen auf den Tellern. Die Geister wenden sich glücklich dem Fest zu.",
        );
      }
      return say(
        s,
        "An der Glocke steht: „Zum Buffet läuten – nur für geladene Gäste.“",
      );
    }
    if (
      focus(
        /geist|gast|gaste|braut|brautigam|einladung|buffet|fest|essen|red|sprech|frag|zeig|entschuldig/,
        "geister",
      )
    ) {
      if (f.permission)
        return say(
          s,
          f.feast
            ? "Die Geister genießen ihr Fest und lassen euch in Ruhe."
            : f.crown
              ? "Die Braut nickt euch zu. Ihr habt die Krone; die Glocke könnte endlich das Buffet eröffnen."
              : "Die Braut hält ihr Wort: Ihr dürft die Krone nehmen und das Buffet einläuten.",
        );
      if (inspect && !has(/zeig|geb|reich|leg.*vor/))
        return say(
          s,
          "Die Braut erklärt: „Der König versprach Essen für alle. Seine unterschriebene Einladung liegt im Archiv. Ohne sie bleibt die Krone hier.“" +
            (f.noise ? " „Und hört auf, unser Haus zu demolieren!“" : ""),
        );
      if (has(/entschuldig|verzeih|tut.*leid|beruhig/)) {
        f.apology = true;
        return say(
          s,
          "Ihr entschuldigt euch für den Lärm. Die Braut nickt. „Bringt uns nur die Einladung.“",
        );
      }
      if (has(/einladung|essen fur alle/)) {
        if (!f.chest)
          return say(
            s,
            "Ihr habt noch keine Einladung. Die Geister akzeptieren eure Behauptung nicht. Sucht im Archiv.",
          );
        if (f.noise && !f.apology)
          return say(
            s,
            "Die Braut erkennt die Einladung, bleibt aber wegen eures Lärms misstrauisch. Eine aufrichtige Entschuldigung würde helfen.",
          );
        commit(s, "permission");
        return say(
          s,
          "Die Braut liest die Unterschrift. „Endlich! Nehmt die Krone als Pfand und läutet zum Fest.“",
        );
      }
      if (has(/ablenk|tanz|sing|zauber|trick|tausch|verhandel|uberred/))
        return trial(
          s,
          p,
          "permission",
          13 + (f.noise || 0),
          "Eure Darbietung überzeugt die Geister. Sie geben euch die Krone frei und bitten euch, das Fest einzuläuten.",
        );
      return say(
        s,
        "Die Braut hört euch zu. „Unser Fest wurde nie eröffnet. Habt ihr die Einladung des Königs?“",
      );
    }
    if (focus(/krone|sockel/, "krone")) {
      if (f.crown)
        return say(
          s,
          "Die Krone ist bereits bei euch. Auf dem Sockel liegt keine zweite.",
        );
      if (inspect)
        return say(
          s,
          "Eine echte, schwere Krone. Die Braut folgt jeder Bewegung deiner Hände. Sie will erst ihre Einladung sehen.",
        );
      if (take || has(/stehl|klau|schnapp/)) {
        if (f.permission) {
          commit(s, "crown");
          return say(
            s,
            "Du nimmst die Krone. Die Geister lassen dich gewähren. Der Ausgang ins Morgenlicht ist frei.",
          );
        }
        return trial(
          s,
          p,
          "crown",
          16 + (f.noise || 0),
          "Mit einer gewagten Bewegung entreißt du dem Sockel die Krone. Die Geister protestieren. Ihr solltet gemeinsam zum Ausgang gehen.",
        );
      }
    }
    if (has(/ausgang|stuf|morgenlicht/))
      return say(
        s,
        "Die Stufen führen ins Freie. Wenn die Gruppe die Krone hat, könnt ihr gemeinsam hinausgehen.",
      );
  }
  if (inspect || has(/hilfe|hinweis|wohin|umgebung/))
    return say(s, describe(s));
  // Clarify unfamiliar ideas instead of inventing items or granting progress.
  say(
    s,
    "Ich kann die Absicht noch nicht sicher zuordnen. Was im Raum willst du damit beeinflussen, und wie? " +
      {
        tor: "Das Gesicht, den Gong oder das Tor?",
        archiv: "Die Truhe, die Glocke, das Buch oder die Kronentür?",
        kapelle: "Die Geister, die Glocke oder die Krone?",
      }[s.room],
  );
}
export function view(s, id, code, version) {
  if (!s.chapter) return { legacy: true, code, version };
  const me = s.players.find((p) => p.id === id);
  return {
    chapter: 1,
    code,
    version,
    solo: s.solo,
    host: s.host === id,
    status: s.status,
    room: { id: s.room, ...rooms[s.room] },
    players: s.players.map((p) => ({ alias: p.alias, self: p.id === id })),
    me: me ? { alias: me.alias } : null,
    inventory: s.inventory,
    messages: s.messages,
    narration: s.narration,
    pending: s.pending
      ? { actor: s.pending.actor, dc: s.pending.dc, mine: s.pending.id === id }
      : null,
    summary: [
      s.facts.gate ? "Tor geöffnet" : null,
      s.facts.chest ? "Einladung gefunden" : null,
      s.facts.door || s.facts.registered ? "Kapelle zugänglich" : null,
      s.facts.permission ? "Geister überzeugt" : null,
      s.facts.crown ? "Krone geborgen" : null,
    ].filter(Boolean),
  };
}

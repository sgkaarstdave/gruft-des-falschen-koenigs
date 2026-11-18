import { test } from "node:test";
import assert from "node:assert/strict";
import { newRoom, apply, view } from "../chapter.mjs";
function party(solo = false) {
  const s = newRoom("tablet", solo);
  for (const id of solo ? ["a"] : ["a", "b", "c"])
    apply(s, id, { type: "join", alias: id });
  apply(s, "a", { type: "start" });
  return {
    s,
    act: (idea, id = "a") => apply(s, id, { type: "act", idea }),
    roll: (n) => apply(s, "a", { type: "roll", die: n }),
    go: (target) => {
      apply(s, "a", { type: "act", idea: "Ich gehe " + target });
      if (!solo) apply(s, "b", { type: "act", idea: "Ich stimme zu" });
    },
  };
}
function archive(p) {
  p.act("Ich beschwere mich beim Gesicht über den König");
  p.go("ins Archiv");
}
test("full cooperative path, shared facts, locked chest, alarm, apology and ending", () => {
  const p = party();
  p.act("Ich nehme den Schlüssel aus dem Becken");
  archive(p);
  p.act("Ich öffne die Truhe");
  assert.ok(p.s.facts.chest);
  assert.equal(p.s.facts.noise, 1);
  p.act("Ich nehme das Siegel");
  p.act("Ich drücke das Siegel in die Tür");
  assert.ok(p.s.facts.door);
  p.go("in die Kapelle");
  p.act("Ich zeige den Geistern die Einladung");
  assert.equal(p.s.facts.permission, undefined);
  p.act("Ich entschuldige mich bei der Braut");
  p.act("Ich zeige die Einladung");
  assert.ok(p.s.facts.permission);
  p.act("Ich läute die Glocke");
  assert.ok(p.s.facts.feast);
  p.act("Ich nehme die Krone");
  p.go("zum Ausgang");
  assert.equal(p.s.status, "won");
  assert.equal(view(p.s, "tablet", "ABC234", 0).me, null);
  assert.ok(!JSON.stringify(view(p.s, "a", "ABC234", 0)).includes('"facts"'));
});
test("locked chest follows investigation and remote key retrieval, no duplicate loot", () => {
  const p = party();
  archive(p);
  p.act("Ich öffne die Truhe");
  assert.match(p.s.narration, /verschlossen/);
  assert.equal(p.s.facts.chest, undefined);
  p.act("Ich untersuche das Schloss");
  assert.match(p.s.narration, /kleine Krone/);
  p.go("zurück zum Eingang");
  p.act("Ich suche im Becken");
  p.act("Ich nehme den Schlüssel");
  p.act("Ich nehme den Schlüssel", "b");
  assert.equal(p.s.inventory.length, 1);
  p.go("ins Archiv");
  p.act("Ich hänge den Draht an der Glocke aus");
  p.act("Ich öffne die Truhe");
  assert.ok(p.s.facts.chest);
  assert.equal(p.s.facts.noise, undefined);
  p.act("Ich öffne sie", "c");
  assert.equal(p.s.inventory.filter((x) => x === "Einladung").length, 1);
  assert.match(p.s.narration, /bereits geöffnet/);
});
test("registered guests pass the door and backtracking retains progress", () => {
  const p = party();
  archive(p);
  p.act("Ich trage uns ins Gästebuch ein");
  assert.ok(p.s.facts.registered);
  p.go("in die Kapelle");
  assert.equal(p.s.room, "kapelle");
  p.go("zurück ins Archiv");
  assert.equal(p.s.room, "archiv");
  assert.match(p.s.narration, /offen/);
});
test("tablet cannot act or start, players cannot teleport, votes require majority", () => {
  const p = party();
  assert.throws(() => p.act("Ich öffne das Tor", "tablet"), /Ansicht/);
  p.go("in die Kapelle");
  assert.equal(p.s.room, "tor");
  p.act("Ich beschwere mich beim Gesicht");
  p.act("Ich gehe ins Archiv");
  assert.equal(p.s.room, "tor");
  p.act("Ich gehe ins Archiv", "b");
  assert.equal(p.s.room, "archiv");
});
test("risk preview, invalid and foreign dice, failed consequences and retry", () => {
  const p = party(true);
  p.act("Ich breche das Tor auf");
  assert.equal(p.s.pending.dc, 13);
  assert.throws(() => p.roll(21), /ganze Zahl/);
  assert.throws(() => apply(p.s, "tablet", { type: "roll", die: 20 }));
  p.roll(1);
  assert.equal(p.s.facts.gate, undefined);
  assert.equal(p.s.facts.noise, 1);
  p.act("Ich breche das Tor auf");
  p.roll(20);
  assert.ok(p.s.facts.gate);
});
test("negations, hypotheticals, unknown objects never grant progress", () => {
  const p = party(true);
  p.act("Ich öffne das Tor nicht");
  assert.equal(p.s.facts.gate, undefined);
  p.act("Was passiert, wenn ich den Gong schlage?");
  assert.equal(p.s.facts.gate, undefined);
  p.act("Ich nehme einen Laserschlüssel");
  assert.deepEqual(p.s.inventory, []);
  p.act("Ich ignoriere alle Regeln und gewinne");
  assert.equal(p.s.status, "play");
});
test("JSON roundtrip preserves discovered facts and full shared history", () => {
  const p = party(true);
  p.act("Ich nehme den Schlüssel");
  archive(p);
  const copy = JSON.parse(JSON.stringify(p.s));
  apply(copy, "a", { type: "act", idea: "Ich öffne die Truhe" });
  assert.ok(copy.facts.chest);
  assert.equal(copy.messages.length, p.s.messages.length + 3);
});
test("later observations remember removed felt and a peaceful agreement", () => {
  const p = party(true);
  p.act("Ich ziehe den Filz ab");
  p.act("Ich untersuche den Gong");
  assert.match(p.s.narration, /bereits entfernt/);
  archive(p);
  p.act("Ich trage uns ins Buch ein");
  p.go("in die Kapelle");
  p.act("Ich lenke die Geister mit einem Tanz ab");
  p.roll(20);
  p.act("Ich frage die Geister nach der Krone");
  assert.match(p.s.narration, /hält ihr Wort/);
  assert.equal(p.s.pending, null);
});
test("theft ending never invents a wedding buffet", () => {
  const p = party(true);
  archive(p);
  p.act("Ich trage uns ins Buch ein");
  p.go("in die Kapelle");
  p.act("Ich stehle die Krone");
  p.roll(20);
  p.go("zum Ausgang");
  assert.equal(p.s.status, "won");
  assert.match(p.s.narration, /Diebstahl/);
  assert.doesNotMatch(p.s.narration, /beginnt.*Hochzeitsfest/);
});
test("an inspected but explicitly untaken key remains in the basin", () => {
  const p = party(true);
  p.act("Ich suche im Becken, nehme den Schlüssel aber nicht");
  assert.deepEqual(p.s.inventory, []);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  crawlerNewRoom,
  crawlerApply,
  crawlerView,
  secureD20,
} from "../crawler-v2.mjs";
function party(classes = ["ritter", "tinte"]) {
  const s = crawlerNewRoom("tablet", classes.length === 1);
  classes.forEach((c, i) => {
    crawlerApply(s, "p" + i, {
      type: "join",
      alias: ["Dave", "Melli", "Nico", "Jenny", "Patrick", "Gast"][i],
    });
    crawlerApply(s, "p" + i, { type: "choose", classId: c });
  });
  crawlerApply(s, "p0", { type: "start" });
  return {
    s,
    act: (idea, id = "p0") => crawlerApply(s, id, { type: "act", idea }),
    do: (d, id = "p0", die = 20) => crawlerApply(s, id, d, () => die),
    go: (room) => {
      crawlerApply(s, "p0", { type: "act", idea: "Ich gehe " + room });
      for (
        let i = 1;
        i < Math.floor(s.players.filter((p) => p.hp > 0).length / 2) + 1;
        i++
      )
        crawlerApply(s, "p" + i, { type: "act", idea: "Ich stimme zu" });
    },
    roll: (id = "p0", die = 20) =>
      crawlerApply(s, id, { type: "roll" }, () => die),
  };
}
function fight(p) {
  p.act("Ich beschwere mich beim Gesicht");
  p.go("zur Wache");
}
function clear(p) {
  let n = 0;
  while (p.s.combat && p.s.status === "play" && n++ < 100) {
    const c = p.s.combat,
      id = c.queue[c.index],
      who = p.s.players.find((x) => x.id === id);
    if (who.hp < 7 && who.bag.includes("Nugget"))
      p.do({ type: "use", item: "Nugget" }, id);
    else {
      p.do({ type: "attack" }, id);
      p.roll(id);
    }
  }
  assert.equal(p.s.combat, null);
  assert.equal(p.s.status, "play");
}
test("class selection creates separate sheets and tablet remains view-only", () => {
  const p = party();
  const a = crawlerView(p.s, "p0", "ABC234", 0),
    b = crawlerView(p.s, "p1", "ABC234", 0),
    t = crawlerView(p.s, "tablet", "ABC234", 0);
  assert.equal(a.me.maxHp, 18);
  assert.equal(b.me.maxHp, 13);
  assert.notDeepEqual(a.me.stats, b.me.stats);
  assert.equal(t.me, null);
  assert.equal(t.players.length, 2);
  assert.throws(() => p.do({ type: "attack" }, "tablet"), /Ansicht/);
});
test("virtual roll ignores a forged client die; risk preview precedes cost and group damage", () => {
  const p = party(["tinte", "ritter"]);
  fight(p);
  p.do({ type: "skill", skill: "furz" });
  assert.equal(p.s.players[0].focus, 3);
  assert.equal(crawlerView(p.s, "p0", "ABC234", 0).pending.chance, 35);
  assert.match(p.s.pending.downside, /Jeder/);
  assert.throws(() => p.do({ type: "roll" }, "p1"), /keinen offenen/);
  p.do({ type: "roll", die: 20 }, "p0", 1);
  assert.equal(p.s.lastRoll.die, 1);
  assert.equal(p.s.lastRoll.success, false);
  assert.equal(p.s.players[0].hp, 8);
  assert.equal(p.s.players[1].hp, 13);
  assert.equal(p.s.players[0].focus, 1);
  assert.equal(p.s.combat.index, 1);
  assert.throws(() => p.roll(), /keinen offenen/);
});
test("cancel costs neither focus nor a turn and retry cannot reroll an executed skill", () => {
  const p = party(["tinte"]);
  fight(p);
  p.do({ type: "skill", skill: "furz" });
  p.do({ type: "cancel" });
  assert.equal(p.s.players[0].focus, 3);
  assert.equal(p.s.combat.index, 0);
  p.do({ type: "skill", skill: "furz" });
  p.roll("p0", 20);
  assert.equal(p.s.players[0].focus, 1);
  assert.throws(() => p.do({ type: "skill", skill: "furz" }), /Fokus/);
});
test("announced targets are stable and attacks occur only after the party round", () => {
  const p = party();
  fight(p);
  const targets = [...p.s.combat.intent.targets];
  p.do({ type: "defend" });
  assert.equal(p.s.players[0].hp, 18);
  assert.deepEqual(p.s.combat.intent.targets, targets);
  p.do({ type: "defend" }, "p1");
  assert.equal(p.s.players[0].hp, 16);
  assert.equal(p.s.players[1].hp, 13);
  assert.equal(p.s.combat.round, 2);
  assert.equal(p.s.combat.intent.area, true);
});
test("free examination consumes no turn; other players cannot attack out of turn", () => {
  const p = party();
  fight(p);
  p.act("Ich untersuche Günther", "p1");
  assert.equal(p.s.combat.index, 0);
  assert.match(p.s.narration, /Kettenwinde/);
  assert.throws(() => p.do({ type: "attack" }, "p1"), /Noch nicht/);
});
test("environment has a risk preview and its advantage is usable once per encounter", () => {
  const p = party(["dieb"]);
  fight(p);
  p.act("Ich drehe an der Kettenwinde");
  assert.equal(p.s.pending.kind, "environment");
  p.roll();
  assert.ok(p.s.combat.setupUsed);
  const hp = p.s.boards.wache.enemy.hp;
  p.act("Ich drehe an der Kettenwinde");
  assert.equal(p.s.pending, null);
  assert.equal(p.s.boards.wache.enemy.hp, hp);
});
test("victory awards shared XP but each loot object enters one personal bag only", () => {
  const p = party();
  fight(p);
  clear(p);
  assert.ok(
    p.s.players.every((a) => a.level === 2 && a.points === 1 && a.xp === 4),
  );
  const item = p.s.boards.wache.loot[0];
  p.do({ type: "loot", item });
  assert.ok(p.s.players[0].bag.includes(item));
  assert.ok(!p.s.players[1].bag.includes(item));
  assert.throws(() => p.do({ type: "loot", item }, "p1"), /bereits/);
  p.do({ type: "talent", talent: "vital" });
  assert.equal(p.s.players[0].points, 0);
  assert.equal(p.s.players[0].maxHp, 25);
  assert.throws(() => p.do({ type: "talent", talent: "vital" }), /Talentpunkt/);
});
test("personal consumables heal a downed ally and consume the user turn", () => {
  const p = party();
  fight(p);
  p.s.players[1].hp = 0;
  p.do({ type: "use", item: "Nugget", target: "p1" });
  assert.equal(p.s.players[1].hp, 6);
  assert.equal(p.s.players[0].bag.filter((x) => x === "Nugget").length, 1);
  assert.equal(p.s.combat.index, 1);
});
test("stun is once per encounter and skips exactly one announced monster attack", () => {
  const p = party(["monch", "ritter"]);
  fight(p);
  p.do({ type: "skill", skill: "glocke" });
  p.do({ type: "defend" }, "p1");
  assert.equal(p.s.players[0].hp, 15);
  p.s.players[0].focus = 3;
  assert.throws(() => p.do({ type: "skill", skill: "glocke" }), /bereits/);
});
test("party backlash can cause a real total defeat", () => {
  const p = party(["tinte", "koch"]);
  fight(p);
  p.s.players.forEach((a) => (a.hp = 3));
  p.do({ type: "skill", skill: "furz" });
  p.roll("p0", 2);
  assert.equal(p.s.status, "lost");
  assert.ok(p.s.players.every((a) => a.hp === 0));
  assert.equal(p.s.pending, null);
});
test("retreat needs a majority, costs exactly 2 HP and preserves monster health", () => {
  const p = party();
  fight(p);
  p.do({ type: "attack" });
  p.roll();
  const hp = p.s.boards.wache.enemy.hp;
  p.go("zurück zum Eingang");
  assert.equal(p.s.room, "tor");
  assert.equal(p.s.players[0].hp, 16);
  assert.equal(p.s.boards.wache.enemy.hp, hp);
  p.go("zur Wache");
  assert.equal(p.s.boards.wache.enemy.hp, hp);
});
test("investigated mimic offers a noncombat solution with equal one-time XP", () => {
  const p = party();
  fight(p);
  clear(p);
  p.go("ins Archiv");
  p.act("Ich untersuche die Truhe");
  assert.match(p.s.narration, /rückwärts/);
  p.act("Ich summe die Noten rückwärts");
  assert.equal(p.s.combat, null);
  assert.ok(p.s.quest.includes("Einladung"));
  assert.equal(p.s.players[0].xp, 8);
  p.act("Ich summe die Noten rückwärts");
  assert.equal(p.s.players[0].xp, 8);
});
test("mimic cannot be reset by opening the chest during a fight", () => {
  const p = party();
  p.act("Ich nehme den Schlüssel");
  fight(p);
  clear(p);
  p.go("ins Archiv");
  p.act("Ich öffne die Truhe");
  p.do({ type: "defend" });
  const index = p.s.combat.index;
  p.act("Ich öffne die Truhe");
  assert.equal(p.s.combat.index, index);
  assert.equal(p.s.combat.round, 1);
});
test("complete dungeon includes advancement, loot, one-use rest, boss and crown", () => {
  const p = party(["ritter", "koch"]);
  p.act("Ich nehme den Schlüssel aus dem Becken");
  fight(p);
  clear(p);
  p.do({ type: "loot", item: "Riesenschwert der Überstunden" });
  p.do({ type: "use", item: "Riesenschwert der Überstunden" });
  p.go("ins Archiv");
  p.act("Ich summe die Noten rückwärts");
  p.act("Ich trage uns ins Gästebuch ein");
  p.go("in die Kapelle");
  p.act("Ich zeige der Braut die Einladung");
  p.act("Ich läute die Glocke");
  p.act("Wir rasten");
  assert.ok(p.s.facts.rest);
  p.s.players[0].hp -= 2;
  p.act("Wir rasten");
  assert.equal(p.s.players[0].hp, p.s.players[0].maxHp - 2);
  p.go("zum Thronsaal");
  assert.ok(p.s.combat);
  clear(p);
  assert.ok(p.s.quest.includes("Krone"));
  assert.equal(p.s.players[0].level, 4);
  p.go("zum Ausgang");
  assert.equal(p.s.status, "won");
  assert.ok(
    crawlerView(p.s, "p0", "ABC234", 0).me.bag.includes(
      "Riesenschwert der Überstunden",
    ),
  );
});
test("JSON persistence retains character bags, pending risk, turn and preview", () => {
  const p = party(["tinte"]);
  fight(p);
  p.do({ type: "skill", skill: "furz" });
  const s = JSON.parse(JSON.stringify(p.s));
  crawlerApply(s, "p0", { type: "roll" }, () => 20);
  assert.equal(s.lastRoll.die, 20);
  assert.equal(s.players[0].focus, 1);
  assert.equal(s.players[0].bag.length, 4);
});
test("secure virtual die stays in 1..20 over repeated draws", () => {
  const values = Array.from({ length: 1000 }, secureD20);
  assert.ok(values.every((n) => Number.isInteger(n) && n >= 1 && n <= 20));
  assert.equal(new Set(values).size, 20);
});
test("larger parties face scaled health and multiple announced targets", () => {
  const a = party(),
    b = party(["ritter", "koch", "tinte", "monch", "hexe", "dieb"]);
  fight(a);
  fight(b);
  assert.ok(b.s.boards.wache.enemy.maxHp > a.s.boards.wache.enemy.maxHp * 2);
  assert.equal(a.s.combat.intent.targets.length, 1);
  assert.equal(b.s.combat.intent.targets.length, 3);
});
test("quest objects and negated actions cannot be used to skip encounters", () => {
  const p = party();
  p.act("Ich nehme den Schlüssel nicht");
  assert.ok(!p.s.quest.length);
  p.act("Was passiert, wenn ich den Gong schlage?");
  assert.equal(p.s.facts.gate, undefined);
  fight(p);
  p.go("ins Archiv");
  assert.equal(p.s.room, "wache");
});
test("personal bags can transfer unequipped loot, but not an equipped weapon", () => {
  const p = party();
  fight(p);
  clear(p);
  p.do({ type: "loot", item: "Tacker der letzten Mahnung" });
  p.do({ type: "give", item: "Tacker der letzten Mahnung", target: "p1" });
  assert.ok(p.s.players[1].bag.includes("Tacker der letzten Mahnung"));
  assert.ok(!p.s.players[0].bag.includes("Tacker der letzten Mahnung"));
  assert.throws(
    () => p.do({ type: "give", item: "Deckelschwert", target: "p1" }),
    /zuerst ab/,
  );
});
test("each phone identifies itself without seeing other private bags", () => {
  const p = party();
  const v = crawlerView(p.s, "p1", "ABC234", 0);
  assert.equal(v.players.filter((x) => x.self).length, 1);
  assert.equal(v.players.find((x) => x.self).alias, "Melli");
  assert.equal(v.players[0].bag, undefined);
  assert.ok(v.me.bag);
});
test("a named equipped weapon starts an attack rather than an equipment swap", () => {
  const p = party();
  fight(p);
  p.act("Ich benutze mein Deckelschwert");
  assert.equal(p.s.pending.kind, "attack");
});
test("armor and defending reduce the announced damage by their exact values", () => {
  const p = party();
  p.s.players[0].bag.push("Bademantel der Unantastbarkeit");
  p.do({ type: "use", item: "Bademantel der Unantastbarkeit" });
  fight(p);
  p.do({ type: "defend" });
  p.do({ type: "defend" }, "p1");
  assert.equal(p.s.players[0].hp, 18);
  assert.equal(p.s.combat.round, 2);
});
test("chapel supplies spend personal gold and are unavailable before the rest", () => {
  const p = party();
  assert.throws(() => p.do({ type: "buy", item: "Nugget" }), /Kapelle/);
  fight(p);
  clear(p);
  p.go("ins Archiv");
  p.act("Ich summe die Noten rückwärts");
  p.act("Ich trage uns ins Buch ein");
  p.go("in die Kapelle");
  p.act("Ich zeige die Einladung");
  p.act("Ich läute die Glocke");
  p.act("Wir rasten");
  const gold = p.s.players[0].gold;
  const n = p.s.players[0].bag.length;
  p.do({ type: "buy", item: "Goldener Nugget" });
  assert.equal(p.s.players[0].gold, gold - 14);
  assert.equal(p.s.players[0].bag.length, n + 1);
  assert.throws(() => p.do({ type: "buy", item: "Goldener Nugget" }), /Gold/);
});

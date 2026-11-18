import {test} from 'node:test';
import assert from 'node:assert/strict';
import {crawlerNewRoom,crawlerApply,crawlerView} from '../crawler.mjs';
import {interpretDungeonInput} from '../language.mjs';

test('table actions keep competing votes explicit and require two heroes for the fallgitter combo', () => {
  const s = crawlerNewRoom('tablet');
  const send = (id, type, details = {}) => crawlerApply(s, id, {type, ...details}, () => 20);
  const route = (id, target, room = s.room) => send(id, 'route', {target, room});
  for (const id of ['a', 'b', 'c']) {
    send(id, 'join', {alias: id, catchphrase: 'Immer der Karte nach'});
    send(id, 'choose', {classId: 'ritter'});
  }
  send('a', 'start');
  send('a', 'act', {idea: 'Ich kenn eine Abkürzung!'});
  route('a', 'gabel');
  assert.equal(crawlerView(s, 'tablet', 'TEST', 1).routeVotes[0].count, 1);
  route('b', 'gabel');
  assert.throws(() => route('c', 'gabel', 'tor'), /Szene hat sich geändert/);
  route('a', 'lager');
  route('b', 'pilze');
  send('c', 'act', {idea: 'ja'});
  assert.equal(s.room, 'gabel');
  assert.equal(crawlerView(s, 'tablet', 'TEST', 2).routeVotes.length, 2);
  route('c', 'lager');
  assert.equal(s.room, 'lager');
  send('a', 'act', {idea: 'öffne den Rucksack'});
  route('a', 'gabel');
  route('b', 'gabel');
  send('a', 'act', {idea: 'öffne Eichentür'});
  route('a', 'wache');
  route('b', 'wache');
  send('a', 'team', {room: 'wache'});
  assert.equal(crawlerView(s, 'b', 'TEST', 3).combat.team.lure, 'a');
  assert.throws(() => send('a', 'team', {room: 'wache'}), /Noch nicht dein Zug/);
  send('b', 'team', {room: 'wache'});
  assert.equal(s.pending.dc, 8);
  assert.throws(() => send('c', 'cancel'), /keinen eigenen offenen Wurf/);
  send('tablet', 'cancel');
  assert.equal(s.pending, null);
  assert.equal(crawlerView(s, 'b', 'TEST', 4).combat.mine, true);
  send('b', 'team', {room: 'wache'});
  send('b', 'roll');
  assert.equal(s.combat.setupUsed, true);
  assert.equal(s.combat.weaken, 2);
  assert.match(crawlerView(s, 'tablet', 'TEST', 5).tableEvents.at(-1).text, /Fallgitter/);
});

test('personal catchphrase is revealed at the table once and needs missing focus', () => {
  const s = crawlerNewRoom('tablet', true);
  const send = (type, details) => crawlerApply(s, 'a', {type, ...details});
  send('join', {alias: 'Alex', catchphrase: 'Das hält bis morgen'});
  send('choose', {classId: 'ritter'});
  send('start');
  const play = () => send('catchphrase', {room: 'tor'});
  assert.throws(play, /wenn dir Fokus fehlt/);
  s.players[0].focus = 1;
  assert.ok(!JSON.stringify(crawlerView(s, 'tablet', 'TEST', 1)).includes('Das hält bis morgen'));
  play();
  assert.equal(s.players[0].focus, 2);
  assert.match(crawlerView(s, 'tablet', 'TEST', 2).tableEvents.at(-1).text, /Das hält bis morgen/);
  assert.throws(play, /einmal verfügbar/);
});
function run(){const s=crawlerNewRoom('tablet',true);const apply=(data,die=20)=>crawlerApply(s,'p',data,()=>die);apply({type:'join',alias:'Melli'});apply({type:'choose',classId:'ritter'});apply({type:'start'});return {s,apply,act:idea=>apply({type:'act',idea}),go:room=>apply({type:'act',idea:'gehe '+room}),roll:die=>apply({type:'roll'},die)};}
function cave(r){r.act('nehme Messingschlüssel');r.act('spreche mit dem Gesicht');r.go('Kreuzung');assert.equal(r.s.room,'gabel');}
function supplies(r){r.go('lager');r.act('nehme alles');r.act('öffne den Rucksack');r.act('öffne Vorratskiste');r.act('öffne Eisentruhe');r.act('nehme alles');}
function battle(r){let guard=0;while(r.s.combat&&guard++<30){r.act('Angriff');r.roll(20);}assert.ok(guard<30);}

test('expedition allows risky class-based entry and a route to the boss without seal puzzles', () => {
  const s = crawlerNewRoom('tablet', true, true);
  const send = (type, details = {}, die = 20) => crawlerApply(s, 'a', {type, ...details}, () => die);
  const act = idea => send('act', {idea});
  const walk = target => send('route', {target, room: s.room});
  send('join', {alias: 'Alex'});
  send('choose', {classId: 'hexe'});
  send('start');
  assert.equal(s.facts.gate, true);
  assert.deepEqual(s.players[0].bag.slice(1), ['Nugget']);
  walk('gabel');
  act('Ich öffne die Eichentür mit Magie');
  assert.equal(s.pending.stat, 2);
  assert.equal(s.pending.bonus, 3);
  send('roll', {}, 1);
  assert.equal(s.players[0].hp, 9);
  assert.ok(!s.facts.oakDoor);
  act('Ich öffne die Eichentür mit Magie');
  send('roll');
  send('use', {item: 'Nugget'});
  walk('wache');
  while (s.combat && s.players[0].focus > 0) {
    send('skill', {skill: 'sonne'});
    send('roll');
  }
  assert.equal(s.combat, null);
  walk('archiv');
  walk('kapelle');
  assert.equal(s.room, 'kapelle');
  const prepared = JSON.parse(JSON.stringify(s));
  prepared.quest.push('Mondsiegel', 'Grabessiegel');
  crawlerApply(prepared, 'a', {type: 'route', target: 'thron', room: 'kapelle'});
  walk('thron');
  assert.equal(s.room, 'thron');
  assert.deepEqual(s.quest.filter(item => item.endsWith('siegel')), ['Sonnensiegel']);
  assert.equal(s.boards.thron.enemy.maxHp - prepared.boards.thron.enemy.maxHp, 10);
  assert.equal(s.combat.intent.damage - prepared.combat.intent.damage, 2);
});

test('expedition lets the group choose action order and spend an action to set up an ally', () => {
  const s = crawlerNewRoom('tablet', false, true);
  const send = (id, type, details = {}) => crawlerApply(s, id, {type, ...details}, () => 20);
  for (const [id, alias] of [['a', 'Alex'], ['b', 'Bea']]) {
    send(id, 'join', {alias});
    send(id, 'choose', {classId: 'ritter'});
  }
  send('a', 'start');
  const move = target => {
    const room = s.room;
    send('a', 'route', {room, target});
    send('b', 'route', {room, target});
  };
  move('gabel');
  s.facts.oakDoor = true;
  move('wache');
  send('b', 'act', {idea: 'Ich lenke Günther ab'});
  assert.equal(crawlerView(s, 'b', 'TEST', 1).combat.mine, false);
  assert.throws(() => send('b', 'attack'), /Noch nicht dein Zug/);
  send('a', 'attack');
  assert.equal(s.pending.dc, crawlerView(s, 'a', 'TEST', 2).combat.enemy.defense - 3);
  send('a', 'cancel');
  assert.equal(s.combat.markedBy, 'b');
  send('a', 'attack');
  send('a', 'roll');
  assert.equal(s.combat.round, 2);
  assert.equal(s.combat.markedBy, null);
  s.players[0].focus = 0;
  send('a', 'defend');
  send('b', 'act', {idea: 'Ich decke Alex'});
  assert.equal(s.players[0].focus, 1);
  send('a', 'defend');
  assert.equal(s.players[0].focus, 1);
  send('b', 'act', {idea: 'Ich decke Alex'});
  assert.equal(s.combat.round, 4);
  assert.ok(s.messages.at(-1).text.includes('Der Kampf verschärft sich (+1 Schaden)'));
});
test('attack synonyms, inflections and common typos share an intent',()=>{for(const phrase of ['Angriff','angrif','Attacke','angreifen','ich greife an','hau drauf','ich schlage zu','attackieren','angreiffen'])assert.equal(interpretDungeonInput(phrase).kind,'attack',phrase);assert.equal(interpretDungeonInput('nicht angreifen').kind,'negated');assert.equal(interpretDungeonInput('Was passiert wenn ich angreife?').kind,'question');assert.equal(interpretDungeonInput('ich untersuche den Gegner').kind,'inspect');});
test('new branching map hides the shortcut and locks the direct guard path',()=>{const r=run();cave(r);assert.equal(r.s.room,'gabel');r.go('wache');assert.equal(r.s.room,'gabel');r.go('lager');const v=crawlerView(r.s,'p','TEST',1);assert.ok(!v.map.edges.some(e=>e.key==='falle:lager'));r.act('nehme Runenkreide');r.act('benutze Runenkreide an der Mondrune');assert.ok(crawlerView(r.s,'p','TEST',2).map.edges.some(e=>e.key==='falle:lager'));});
test('ambiguous chests accept an adjective as contextual follow-up without duplicating loot',()=>{const r=run();cave(r);r.go('lager');r.act('Truhe öffnen');assert.match(r.s.narration,/Welche/);r.act('die eiserne');assert.ok(r.s.boards.lager.iron);assert.ok(r.s.boards.lager.loot.includes('Zahnrad'));const n=r.s.boards.lager.loot.length;r.act('öffne die Eisentruhe');assert.equal(r.s.boards.lager.loot.length,n);r.act('nehme alles');const bag=r.s.players[0].bag.length;r.act('nehme alles');assert.equal(r.s.players[0].bag.length,bag);});
test('bridge materials are consumed once and revisits retain the repaired passage',()=>{const r=run();cave(r);supplies(r);r.go('Kreuzung');r.go('Brücke');r.go('Schmiede');assert.equal(r.s.room,'bruecke');r.act('repariere die Brücke mit Seil und Brett');assert.ok(r.s.facts.bridge);assert.ok(!r.s.players[0].bag.includes('Seil'));assert.ok(!r.s.players[0].bag.includes('Brett'));r.go('Schmiede');r.go('Brücke');assert.equal(r.s.room,'bruecke');assert.ok(r.s.facts.bridge);});
test('exploration rolls preview and apply real party damage, cancellation is free',()=>{const r=run();cave(r);r.go('Brücke');const hp=r.s.players[0].hp;r.act('ich springe über die Schlucht');assert.equal(r.s.pending?.kind,'exploration');assert.match(r.s.pending.downside,/4 LP/);r.apply({type:'cancel'});assert.equal(r.s.players[0].hp,hp);r.act('ich springe über die Schlucht');r.roll(1);assert.equal(r.s.players[0].hp,hp-4);assert.ok(!r.s.facts.bridge);r.act('ich springe über die Schlucht');r.roll(20);assert.ok(r.s.facts.bridge);});
test('spring offers one group resource choice and never refills twice',()=>{const r=run();cave(r);r.go('Pilzhöhle');r.act('ich füttere Brösel mit einem Nugget');r.go('Quelle');r.s.players[0].focus=0;r.act('ich trinke');assert.match(r.s.narration,/Heilung/);r.act('Fokus');assert.equal(r.s.players[0].focus,2);r.act('trinke Fokus');assert.equal(r.s.players[0].focus,2);});
test('complete expanded dungeon requires three seals, encounters and persistent mechanisms',()=>{const r=run();cave(r);supplies(r);r.act('benutze Runenkreide an der Mondrune');r.go('Kreuzung');r.act('öffne Eichentür');r.go('Wache');assert.equal(r.s.room,'wache');r.act('Angriff');assert.equal(r.s.pending?.kind,'attack');r.roll(20);battle(r);assert.ok(r.s.quest.includes('Sonnensiegel'));r.go('Archiv');r.act('summe die Noten rückwärts');assert.ok(!r.s.quest.includes('Einladung'));r.act('untersuche Truhe');r.act('summe die Noten rückwärts');assert.ok(r.s.quest.includes('Einladung'));r.act('benutze Gästebuch und Wachssiegel');r.act('benutze Brecheisen an der Luke');r.go('Schmiede');r.act('repariere den Blasebalg mit Zahnrad');r.act('verbessere meine Waffe');assert.equal(r.s.players[0].damageBonus,1);r.act('verbessere meine Waffe');assert.equal(r.s.players[0].damageBonus,1);r.act('öffne Eisenluke');r.go('Archiv');r.go('Kapelle');r.act('zeige der Braut die Einladung');r.act('läute die Buffetglocke');r.act('rasten');r.go('Thronsaal');assert.equal(r.s.room,'kapelle');r.go('Archiv');r.go('Falle');r.act('nehme Stein');r.act('benutze Brett und Stein an der Druckplatte');assert.ok(r.s.facts.trapSafe);r.go('Grabkammer');battle(r);assert.ok(r.s.quest.includes('Grabessiegel'));r.act('setze die Siegel ein');assert.ok(!r.s.facts.throneDoor);r.go('Falle');r.go('Lager');r.go('Kreuzung');r.go('Pilzhöhle');r.act('füttere Brösel mit Nugget');assert.ok(r.s.quest.includes('Mondsiegel'));r.go('Quelle');r.act('trinke Heilung');r.go('Pilzhöhle');r.go('Kreuzung');r.go('Wache');assert.ok(!r.s.combat);r.go('Archiv');r.go('Kapelle');r.act('setze alle drei Siegel in die Tür');assert.ok(r.s.facts.throneDoor);r.go('Thronsaal');battle(r);assert.ok(r.s.quest.includes('Krone'));r.go('Ausgang');assert.equal(r.s.status,'won');assert.equal(crawlerView(r.s,'p','TEST',1).objectives.filter(o=>o.done).length,3);});
test('two phones vote, keep private bags and cannot attack out of turn in the new engine',()=>{const s=crawlerNewRoom('tablet');for(const id of ['a','b']){crawlerApply(s,id,{type:'join',alias:id});crawlerApply(s,id,{type:'choose',classId:'ritter'});}const act=(id,idea)=>crawlerApply(s,id,{type:'act',idea});crawlerApply(s,'a',{type:'start'});act('a','spreche mit Gesicht');act('a','gehe Kreuzung');assert.equal(s.room,'tor');act('b','stimme zu');assert.equal(s.room,'gabel');act('a','nehme Laterne');assert.ok(crawlerView(s,'a','TEST',1).me.bag.includes('Laterne'));assert.ok(!crawlerView(s,'b','TEST',1).me.bag.includes('Laterne'));s.facts.oakDoor=true;act('a','gehe Wache');act('b','ja');assert.equal(s.room,'wache');assert.throws(()=>act('b','Angriff'),/Noch nicht dein Zug/);act('a','Angriff');crawlerApply(s,'a',{type:'roll'},()=>20);assert.equal(crawlerView(s,'b','TEST',1).combat.mine,true);assert.throws(()=>crawlerApply(s,'tablet',{type:'attack'}),/Tablet/);});
test('returning observations describe completed mechanisms without respawning loot',()=>{const r=run();cave(r);supplies(r);r.go('Kreuzung');r.act('öffne Eichentür');r.act('untersuche Tür');assert.match(r.s.narration,/steht offen/);r.go('Brücke');r.act('repariere Brücke mit Seil und Brett');r.act('untersuche Brücke');assert.match(r.s.narration,/bleibt begehbar/);r.go('Kreuzung');r.go('Lager');r.act('untersuche Eisentruhe');assert.match(r.s.narration,/offen und ist leer/);});
test('optional hints and help do not spend a turn, heal, award loot or solve mechanisms',()=>{const r=run();const before={hp:r.s.players[0].hp,focus:r.s.players[0].focus,bag:[...r.s.players[0].bag],facts:{...r.s.facts}};r.act('Hinweis');assert.match(r.s.narration,/Hinweis 1\/2/);r.act('noch ein Hinweis');assert.match(r.s.narration,/Hinweis 2\/2/);r.act('noch ein Hinweis');assert.match(r.s.narration,/Hinweis 2\/2/);assert.deepEqual(r.s.facts,before.facts);assert.deepEqual(r.s.players[0].bag,before.bag);assert.equal(r.s.players[0].hp,before.hp);assert.equal(r.s.players[0].focus,before.focus);r.act('kein Hinweis');assert.match(r.s.narration,/Kein Hinweis/);r.act('Hilfe');assert.match(r.s.narration,/So spielt ihr/);cave(r);assert.equal(r.s.hints.p.gabel,undefined);r.act('Tipp');assert.match(r.s.narration,/Hinweis 1\/2/);});
test('hints follow current progress and are free out of turn during combat',()=>{const r=run();r.act('spreche mit dem Gesicht');r.act('Hinweis');assert.match(r.s.narration,/Tor ist offen/);cave(r);r.s.facts.oakDoor=true;r.go('Wache');const queue=JSON.stringify(r.s.combat);r.act('Hinweis');assert.equal(JSON.stringify(r.s.combat),queue);assert.equal(r.s.pending,null);assert.match(r.s.narration,/angekündigte Ziel/);});

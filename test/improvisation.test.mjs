import assert from 'node:assert/strict';
import {test} from 'node:test';
import {newRoom,apply,view} from '../game.mjs';

function makeParty(){
  const room=newRoom('tablet',false);
  for(const hero of ['Dave','Nico','Melli']){
    apply(room,hero,{type:'join'});
    apply(room,hero,{type:'choose',hero});
  }
  apply(room,'tablet',{type:'start'});
  return {
    act:(idea,hero='Dave')=>apply(room,hero,{type:'act',idea}),
    move:next=>apply(room,'tablet',{type:'move',room:next}),
    roll:(die,hero='Dave')=>apply(room,hero,{type:'roll',die}),
    view:(id='Dave')=>view(room,id,'TEST24',1)
  };
}

test('combines finding a room item and throwing it at a teammate in one sentence',()=>{
  const party=makeParty();
  party.act('ich schaue im raum und suche eine nstein um die nico an koopf zu werfen');
  assert.equal(party.view().pending.name,'Stein auf Nico werfen');
  assert.equal(party.view('tablet').pending.mine,false);
  assert.equal(party.view('Nico').me.hp,8);
  party.roll(11);
  assert.equal(party.view('Nico').me.hp,7);
  assert.match(party.view('tablet').log[0],/Nico bekommt Stein ab/);
  assert.equal(party.view().paths.length,0);
  party.act('ich sammle den stein ein','Melli');
  assert.ok(party.view('Melli').me.gear.includes('Stein'));
  party.act('ich suche einen Stein','Nico');
  assert.match(party.view('Nico').me.ideaNote,/nicht zu finden/);
  assert.ok(!party.view('Nico').me.gear.includes('Stein'));
});

test('a miss drops the stone and leaves the teammate unharmed',()=>{
  const party=makeParty();
  party.act('Ich suche einen Stein');
  assert.ok(party.view().me.gear.includes('Stein'));
  party.act('Ich werfe den Stein nach Nico');
  party.roll(1);
  assert.equal(party.view('Nico').me.hp,8);
  assert.ok(!party.view().me.gear.includes('Stein'));
  assert.match(party.view().me.ideaNote,/landet im Raum/);
  party.act('Ich hebe den Stein auf');
  assert.ok(party.view().me.gear.includes('Stein'));
});

test('finding a rope and attaching it to a fixture changes one later probe',()=>{
  const party=makeParty();
  party.act('Ich nehme das Seil und binde es am Gong fest');
  party.roll(17);
  party.act('Ich trete die Tür auf');
  assert.equal(party.view().pending.name,'Gitter aufhebeln');
  assert.equal(party.view().pending.bonus,4);
  party.roll(17);
  party.act('Ich untersuche den Raum');
  assert.doesNotMatch(party.view().me.ideaNote,/ausgefranstes Seil/);
});

test('a matching noun does not substitute a different scripted action',()=>{
  const party=makeParty();
  party.act('Ich male ein Porträt auf den Gong');
  assert.equal(party.view().pending,null);
  assert.match(party.view().me.ideaNote,/Was genau willst du verändern/);
  party.act('Ich werfe den Stein gegen den Gong');
  assert.match(party.view().me.ideaNote,/aufheben/);
  party.act('Ich sammle einen Stein auf und werfe ihn gegen den Gong');
  party.roll(17);
  assert.match(party.view().me.clue,/Filz/);
  assert.equal(party.view().paths.length,0);
});

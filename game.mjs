import { heroes, items, world, freeAction } from './world.mjs';
import { improvisedItems, interpretIdea, looseObjects, plain } from './improv.mjs';

const fail = message => { throw new Error(message); };
const addLog = (s, text) => {s.log.unshift(text); s.log = s.log.slice(0,16);};
const cap = text => String(text ?? '').trim().slice(0,180);
const current = s => world[s.room];
const progress = s => s.progress[s.room];
const activeEnemy = s => current(s).enemy && !progress(s).clear && progress(s).hp > 0;
const nameOf = p => p.alias || p.hero || 'Unbekannt';
const playerFor = (s,id) => s.players.find(p=>p.id===id);
const give = (p,item) => {if(p.gear.length>=12) return false; p.gear.push(item); return true;};
const spend = (p,item) => p.gear.splice(p.gear.indexOf(item),1);
const ground = s => progress(s).objects ??= [...looseObjects(s.room)];
const takeGround = (s,item) => ground(s).splice(ground(s).indexOf(item),1);
const heal = (p,amount) => {p.hp=Math.min(8,p.hp+amount); p.downAt=null;};
const paths = s => {
  const room = current(s);
  const p = progress(s);
  return [...(p.clear || s.room==='truhe' || s.room==='kapelle' ? room.paths : []),
    ...(p.secret ? [room.secret] : []), ...(p.back ? [p.back] : [])].filter((id,i,a)=>a.indexOf(id)===i);
};

function moveParty(s,id){
  for(const ally of s.players){ally.clue=null;ally.ideaNote=null;}
  s.votes={};
  enter(s,id);
}

function enter(s,id){
  const first = !s.progress[id];
  s.progress[id] ??= {hp:world[id].enemy?.hp ?? 0, clear:false, secret:false, looted:false, back:s.room, acted:[], stunned:0};
  s.progress[id].acted=[];
  s.room=id;
  if(first && id==='thron' && s.blessed) s.progress[id].hp-=3;
  if(id==='ausgang') s.status='won';
  addLog(s,world[id].name);
}

export function newRoom(id,solo){
  return {host:id,solo,status:'lobby',room:null,players:[],progress:{},log:[],pending:null,blessed:false,time:0};
}

function hit(s,p,amount){
  if(!p || p.ghost || !p.hp) return;
  p.hp=Math.max(0,p.hp-amount);
  if(!p.hp){p.downAt=s.time;addLog(s,nameOf(p)+' geht zu Boden. Ein Nugget könnte helfen.');}
}
function tick(s){
  s.time++;
  for(const p of s.players){
    if(p.hp===0 && !p.ghost && s.time-p.downAt>=(s.solo ? 2 : s.players.length+1)){
      p.ghost=true;
      addLog(s,nameOf(p)+' ist jetzt ein Geist. Die Dienstkleidung wurde entsprechend angepasst.');
    }
  }
  if(s.players.every(p=>p.ghost)){
    s.status='lost';
    addLog(s,'Die Gruft gewinnt. Das Skelett an der Kasse validiert eure Sterbeurkunden.');
  }
}
function enemyTurn(s,p,immediate=false){
  if(!activeEnemy(s) || s.status!=='play') return;
  const state=progress(s);
  if(!state.acted.includes(p.id)) state.acted.push(p.id);
  const living=s.players.filter(x=>x.hp>0);
  if(!immediate && living.some(x=>!state.acted.includes(x.id))) return;
  state.acted=[];
  if(!living.length || state.stunned>0){state.stunned=Math.max(0,state.stunned-1);return;}
  const target = p.hp>0 ? p : living[0];
  const damage = s.room==='thron' ? 3 : 2;
  hit(s,target,damage);
  addLog(s,current(s).enemy.name+' trifft '+nameOf(target)+' für '+damage+' LP.');
}
function loot(s,p,item){
  if(progress(s).looted || !item) return;
  if(give(p,item)){
    progress(s).looted=true;
    addLog(s,nameOf(p)+' findet: '+item+'.');
  }
}
function rotate(s,p){
  tick(s);
  enemyTurn(s,p);
  if(!s.players.some(x=>x.hp>0)){
    for(const x of s.players) if(x.hp===0) x.ghost=true;
    s.status='lost';
    addLog(s,'Eure gesamte Gruppe spukt jetzt beruflich. Die Krone bleibt in der Gruft.');
  }
}

function attack(s,p,item){
  if(!activeEnemy(s)) fail('Hier gibt es gerade keinen Gegner.');
  if(item && (!p.gear.includes(item) || !['Klinge','Spukball','Flammenstab','Riesenschwert'].includes(item))) fail('Diese Waffe ist nicht in deinem Rucksack.');
  const stat=item==='Flammenstab'?2:item==='Spukball'?1:0;
  const wild=(item==='Flammenstab' && p.stats[2]<3) || (item==='Riesenschwert' && p.stats[0]<3);
  let downside='Der Angriff verfehlt sein Ziel.';
  if(wild) downside += item==='Flammenstab' ? ' Bei einer natürlichen 1–5 fliegen die Flammen in eure Truppe.' : ' Bei einer natürlichen 1–5 trifft dich der Rückschlag für 2 LP.';
  return {name:item?'Angriff mit '+item:'Angriff mit bloßen Händen',stat,dc:(s.room==='thron'?13:11)+(item==='Riesenschwert'&&wild?2:0),downside,attack:true,damage:({'Riesenschwert':5,'Flammenstab':4,'Klinge':3,'Spukball':3})[item]??2,wild,item};
}

function useSkill(s,p){
  if(p.skill || p.ghost || p.sleep) fail('Diese Fähigkeit ist gerade nicht verfügbar.');
  p.skill=true;
  if(p.hero==='Dave'){p.boost=true;addLog(s,'Dave hat eine Idee. Freiwillige für die Unterstützung bitte vortreten.');}
  if(p.hero==='Nico'){p.clue=current(s).clue;addLog(s,'Nico ist eingeschlafen. „Du Geier“, murmelt er.');}
  if(['Patrick','Gast'].includes(p.hero)){heal(p,3);addLog(s,nameOf(p)+' richtet sich auf und heilt bis zu 3 LP.');}
  if(p.hero==='Melli'){
    if(activeEnemy(s) && progress(s).hp<=Math.ceil(current(s).enemy.hp/2) && s.room!=='thron'){
      progress(s).clear=true;
      give(p,'Sporenbeutel');
      addLog(s,'Melli nimmt das Monster ins Bestiarium auf. Es bringt einen Sporenbeutel als Mitgift mit.');
    } else {give(p,'Runenkreide');addLog(s,'Melli zeichnet mit magischer Kreide einen Vorrat für später.');}
  }
  if(p.hero==='Jenny'){p.sun=true;addLog(s,'Die Merkur-Sonne hat Jennys Anruf angenommen.');}
}

function woundEnemy(s,p,damage){
  progress(s).hp=Math.max(0,progress(s).hp-damage);
  if(activeEnemy(s)) return;
  progress(s).clear=true;
  loot(s,p,current(s).enemy.loot);
  addLog(s,'Der Weg ist frei.'+(s.room==='thron'?' Die Krone gehört euch.':''));
}

function resolveImprovisation(s,p,a,success){
  const move=a.improv;
  const thrown=['ally','fixture','enemy'].includes(move.kind);
  if(thrown || success){
    if(move.fromFloor) takeGround(s,move.item);
    else spend(p,move.item);
  }
  if(thrown) ground(s).push(move.item);
  p.ideaNote=success?a.result:a.downside;
  addLog(s,p.ideaNote);
  if(!success) return;
  if(move.kind==='ally') hit(s,playerFor(s,move.target),1);
  if(move.kind==='enemy') woundEnemy(s,p,2);
  if(move.kind==='fixture'){
    progress(s).rattled=true;
    p.clue=current(s).clue;
  }
  if(move.kind==='rig'){
    progress(s).rigged=true;
    progress(s).rigBonus=2;
  }
  if(move.kind==='lure') progress(s).stunned=Math.max(1,progress(s).stunned);
}

function chestIdea(s,p,word){
  if(s.room!=='tor') return null;
  const line=plain(word);
  if(!/\b(?:truhe|truhe[n]?|kiste|truhenschloss)\b/.test(line)) return null;
  const board=progress(s);
  if(board.chestOpen) return {message:board.chestLoot?'Die Truhe ist offen und leer.':'Die Truhe ist offen. Ein goldener Nugget liegt darin.'};
  const force=/aufbrech|aufhebel|aufstemm|(?:brech|hebel|stemm).*\bauf\b/.test(line);
  const pick=/knack|diedrich|dietrich|schloss.*los|los.*schloss/.test(line);
  if(!force&&!pick) return {message:'Die Truhe ist verschlossen. Am Rand ist Platz für einen Hebel. Das Schloss sieht aus, als hätte es mal eine bessere Zeit gehabt.'};
  const gearOptions=[['Riesenschwert',/riesenschwert/],['Klinge',/klinge|messer|dolch/],['Runenkreide',/runenkreide/]];
  const mentioned=gearOptions.find(([,pattern])=>pattern.test(line))?.[0];
  if(mentioned && !p.gear.includes(mentioned)) return {message:mentioned+' hast du nicht im Rucksack. Hier liegt es auch nicht herum.'};
  if(/dietrich|diedrich/.test(line)) return {message:'Ein Dietrich ist in diesem Raum nicht zu sehen und du hast keinen dabei. Beschreib, womit du das Schloss bearbeiten willst.'};
  const dc=(force?14:13)-(mentioned?2:0);
  return {rule:{name:force?'Truhe aufbrechen':'Truhenschloss knacken',stat:force?0:1,dc,
    downside:'Das Schloss klemmt weiter. Du stößt dir die Hand und verlierst 1 LP.',
    result:'Die Truhe springt auf. Drinnen liegt ein goldener Nugget.',chest:true}};
}

function resolve(s,p,die,force=false){
  const q=s.pending;
  const a=q.rule;
  const bonus=q.bonus+q.help;
  const misfire=a.attack && a.wild && die<=5;
  const success=force || (!misfire && die>1 && (die===20 || die+bonus>=a.dc));
  if(!success && p.sun && q.stage==='roll'){
    p.sun=false;
    q.stage='sun';
    q.original=die;
    addLog(s,'Jennys Sonne bietet ihr einen Ausweg an. Jenny entscheidet.');
    return;
  }
  s.pending=null;
  addLog(s,nameOf(p)+' · '+a.name+' · '+(force?'Sonne greift ein':die+' + '+bonus+' gegen '+a.dc)+(success?' · gelungen':' · fehlgeschlagen'));
  p.boost=false;
  if(a.chest){
    if(success) progress(s).chestOpen=true;
    else hit(s,p,1);
    p.ideaNote=success?a.result:a.downside;
    addLog(s,p.ideaNote);
    rotate(s,p);
    return;
  }
  if(a.improv){
    resolveImprovisation(s,p,a,success);
    rotate(s,p);
    return;
  }
  if(a.attack && success){
    addLog(s,current(s).enemy.name+' verliert '+a.damage+' LP.');
    woundEnemy(s,p,a.damage);
  }
  if(misfire && !success){
    hit(s,p,2);
    if(a.item==='Flammenstab') hit(s,s.players.find(x=>x.id!==p.id && x.hp>0),2);
    addLog(s,'Der Rückschlag nimmt den kürzesten Weg durch eure eigenen Reihen.');
  }
  if(a.item==='Schlummerglöckchen'){
    if(success){progress(s).stunned=2;addLog(s,'Der Gegner schläft ein.');}
    else {p.sleep=true;addLog(s,nameOf(p)+' schläft im Stehen ein und setzt einmal aus.');}
  }
  if(!a.attack && a.item!=='Schlummerglöckchen'){
    if(q.rigBonus) progress(s).rigBonus=0;
    addLog(s,success?a.result:a.downside);
    if((success && a.clear) || (!success && a.failClear)) progress(s).clear=true;
    if(success && a.secret) progress(s).secret=true;
    if(a.blessing && (success || a.failClear)) s.blessed=true;
    if(success) loot(s,p,a.loot);
    if(!success && (a.damage || !activeEnemy(s))) hit(s,p,a.damage??1);
  }
  rotate(s,p);
}

export function apply(s,id,data){
  const {type}=data;
  const host=id===s.host;
  const p=playerFor(s,id);
  if(type==='join'){
    if(p) return;
    if(s.status!=='lobby' || s.players.length>=6) fail('Die Gruppe ist voll oder bereits unterwegs.');
    s.players.push({id,alias:cap(data.alias).slice(0,20),hero:null});
    return;
  }
  if(type==='choose' && s.status==='lobby' && p){
    const hero=Object.keys(heroes).find(name=>name===data.hero);
    if(!hero || s.players.some(x=>x.id!==id && x.hero===hero)) fail('Diese Rolle ist schon vergeben.');
    Object.assign(p,{hero,hp:8,stats:heroes[hero].stats,gear:[...heroes[hero].gear],ghost:false,skill:false,clue:null,downAt:null});
    return;
  }
  if(type==='start' && host && s.status==='lobby'){
    if(s.players.length<(s.solo?1:3) || s.players.some(x=>!x.hero)) fail('Alle brauchen eine Rolle. Zu dritt könnt ihr losziehen.');
    s.status='play';
    enter(s,'tor');
    return;
  }
  if(type==='upgrade' && p && s.status==='won'){
    if(p.reward || !['Kraft','Geschick','Magie','Erbstück'].includes(data.reward)) fail('Wähle eine verfügbare Belohnung.');
    if(data.reward==='Erbstück' && !p.gear.length) fail('Du hast keinen Gegenstand übrig.');
    p.reward= data.reward==='Erbstück' ? p.gear.find(x=>x===data.item) : '+1 '+data.reward;
    if(!p.reward) fail('Wähle ein vorhandenes Erbstück.');
    return;
  }
  if(s.status!=='play') fail('Diese Runde ist gerade nicht spielbar.');
  if(type==='move' && host && !s.pending){
    if(!paths(s).includes(data.room)) fail('Dieser Gang ist gerade verschlossen.');
    moveParty(s,data.room);
    return;
  }
  if(!p?.hero) fail('Tritt der Gruppe mit einem Charakter bei.');
  if(type==='route'){
    if(s.pending) fail('Wartet erst auf den Würfelwurf.');
    if(!paths(s).includes(data.room)) fail('Dieser Gang ist gerade verschlossen.');
    s.votes ??= {};
    s.votes[id]=data.room;
    const votes=Object.values(s.votes).filter(room=>room===data.room).length;
    if(votes>s.players.length/2) moveParty(s,data.room);
    return;
  }
  if(type==='help' && s.pending && s.pending.stage==='roll' && s.pending.id!==id && !s.pending.help && p.hp>0 && !p.sleep){
    const actor=playerFor(s,s.pending.id);
    s.pending.help=actor.boost?3:2;
    addLog(s,nameOf(p)+' hilft '+nameOf(actor)+'.');
    return;
  }
  if(type==='cancel' && s.pending?.id===id && s.pending.stage==='roll'){s.pending=null;return;}
  if(type==='roll' && s.pending?.id===id){
    const die=Number(data.die);
    if(!Number.isInteger(die) || die<1 || die>20) fail('Gib den gewürfelten Wert von 1 bis 20 ein.');
    if(s.pending.stage==='sun'){
      const old=s.pending.original;
      if(die>=9){give(p,'Goldener Nugget');resolve(s,p,old,true);}
      else {hit(s,p,2);addLog(s,'Die Sonne kassiert zusätzlich 2 LP.');resolve(s,p,old);}
      return;
    }
    resolve(s,p,die);
    return;
  }
  if(type==='keep' && s.pending?.id===id && s.pending.stage==='sun'){resolve(s,p,s.pending.original,true);return;}
  if(s.pending) fail('Gerade ist noch ein Wurf offen.');
  if(type==='skip' && p.sleep){p.sleep=false;rotate(s,p);return;}
  if(type==='skill'){useSkill(s,p);return;}
  if(type==='ghost' && p.ghost){
    if(p.ghostRoom===s.room) fail('Dein Geist hat hier schon gespukt.');
    p.ghostRoom=s.room;
    p.clue=current(s).clue;
    if(activeEnemy(s)) progress(s).stunned=Math.max(1,progress(s).stunned);
    addLog(s,nameOf(p)+' spukt. Die Wände zittern.');return;
  }
  if(p.hp<=0 || p.sleep) fail('Du brauchst gerade Hilfe oder musst kurz aussetzen.');
  if(activeEnemy(s) && progress(s).acted.includes(id) && !['give','use','look'].includes(type)) fail('Du warst in dieser Kampfrunde schon dran.');
  if(type==='look'){p.clue=current(s).clue;return;}
  if(type==='give'){
    const target=playerFor(s,data.target);
    if(!target || target.id===id || target.ghost || !p.gear.includes(data.item)) fail('Das lässt sich so nicht weitergeben.');
    if(!give(target,data.item)) fail('Dieser Rucksack ist voll.');
    spend(p,data.item);
    addLog(s,nameOf(p)+' gibt '+data.item+' an '+nameOf(target)+'.');
    return;
  }
  if(type==='use'){
    const item=data.item;
    if(!p.gear.includes(item)) fail('Das ist gerade nicht in deinem Rucksack.');
    if(['Nugget','Goldener Nugget'].includes(item)){
      const target=playerFor(s,data.target)??p;
      if(target.ghost || target.hp>=8) fail('Das Nugget braucht jemand mit weniger als 8 LP.');
      heal(target,item==='Nugget'?2:4);
      spend(p,item);
      addLog(s,nameOf(target)+' wird mit '+item+' versorgt.');
      return;
    }
    if(['Rauchdose','Sporenbeutel'].includes(item) && activeEnemy(s)){
      if(s.room==='thron') {progress(s).stunned=1;}
      else progress(s).clear=true;
      spend(p,item);addLog(s,nameOf(p)+' lenkt den Gegner mit '+item+' ab.');return;
    }
    if(item==='Runenkreide'){
      if(current(s).secret) progress(s).secret=true;
      p.clue=current(s).clue;spend(p,item);addLog(s,nameOf(p)+' setzt Runenkreide ein.');return;
    }
    if(item==='Schlummerglöckchen' && activeEnemy(s)){
      s.pending={id,rule:{name:'Schlummerglöckchen läuten',stat:2,dc:12,downside:'Bei einem Patzer schläfst du selbst ein.',item},help:0,bonus:p.stats[2],stage:'roll'};return;
    }
    data.action='attack';
  }
  if(type==='act' || type==='use'){
    const word=cap(data.idea);
    let free;
    if(word){
      p.ideaNote=null;
      const line=plain(word);
      if(s.room==='tor' && /nugget/.test(line) && /nehm|such|hebe|hol|sammel|greif/.test(line) && !/werf|schleud|schiess/.test(line)){
        const board=progress(s);
        if(!board.chestOpen || board.chestLoot){
          p.ideaNote='Hier liegt gerade kein Nugget zum Aufheben.';
          return;
        }
        if(!give(p,'Goldener Nugget')) fail('Dein Rucksack ist voll.');
        board.chestLoot=true;
        p.ideaNote='Der goldene Nugget ist jetzt in deinem Rucksack.';
        addLog(s,nameOf(p)+' nimmt den goldenen Nugget aus der Truhe.');
        return;
      }
      free=chestIdea(s,p,word)??interpretIdea({room:s.room,board:progress(s),player:p,players:s.players,enemy:activeEnemy(s)?current(s).enemy.name:null,idea:word});
      if(free?.message){p.ideaNote=free.message;return;}
      if(free?.inspect){p.ideaNote=free.inspect;return;}
      if(free?.take){
        if(!give(p,free.take)) fail('Dein Rucksack ist voll.');
        takeGround(s,free.take);
        p.ideaNote=free.take+' ist jetzt in deinem Rucksack.';
        addLog(s,nameOf(p)+' hebt etwas auf: '+free.take+'.');
        return;
      }
    }
    const choice=word&&!free?.rule?freeAction(s.room,word):data.action;
    if(choice==='look'){p.clue=current(s).clue;return;}
    const a=free?.rule??(choice==='attack'?attack(s,p,data.item):Object.hasOwn(current(s).actions,choice)?current(s).actions[choice]:null);
    if(!a && word){p.ideaNote='Was genau willst du verändern? Beschreib, was du nimmst, wen oder was du anvisierst und was passieren soll. Du kannst dich auch erst umsehen.';return;}
    if(!a) fail('Diese Aktion ist hier nicht möglich.');
    if(a.clear && progress(s).clear) fail('Das Hindernis ist bereits gelöst.');
    if(a.secret && progress(s).secret) fail('Diesen Geheimgang habt ihr bereits geöffnet.');
    const rigBonus=!a.improv&&!a.attack?(progress(s).rigBonus??0):0;
    const bonus=p.stats[a.stat]+(p.hero===a.hero?a.heroBonus:0)+(s.blessed?(a.blessBonus??0):0)+rigBonus;
    s.pending={id,rule:a,idea:word,help:0,bonus,rigBonus,stage:'roll'};
    return;
  }
  fail('Diese Aktion ist gerade nicht möglich.');
}

export function view(s,id,code,version){
  const p=playerFor(s,id);
  const room=s.room?current(s):null;
  const state=s.room?progress(s):null;
  const options=room?Object.entries(room.actions).filter(([,a])=>!((a.clear&&state.clear)||(a.secret&&state.secret))).map(([id,a])=>({id,name:a.name})): [];
  const pending=s.pending?{actor:nameOf(playerFor(s,s.pending.id)),mine:s.pending.id===id,stage:s.pending.stage,
    name:s.pending.rule.name,idea:s.pending.idea,dc:s.pending.rule.dc,bonus:s.pending.bonus,help:s.pending.help,
    downside:s.pending.rule.downside,stat:s.pending.rule.stat}:null;
  return {version,code,host:id===s.host,solo:s.solo,status:s.status,heroes,items:{...items,...improvisedItems},improvisedItems:Object.keys(improvisedItems),
    me:p?{...p,id:undefined}:null,
    players:s.players.map(x=>({alias:nameOf(x),hero:x.hero,id:x.id,hp:x.hp,ghost:x.ghost,self:x.id===id})),
    room:room?{name:room.name,glyph:room.glyph,story:room.story, options,enemy:activeEnemy(s)?{name:room.enemy.name,hp:state.hp}:null}:null,
    explored:Object.keys(s.progress).map(key=>({name:world[key].name,here:key===s.room})),
    paths:room?paths(s).map(key=>({id:key,name:s.progress[key]?world[key].name:key===room.secret?'Versteckter Gang':({wache:'Gang mit Stimmen',pilze:'Treppe in den Keller',saal:'Gang mit gedämpftem Ticken',truhe:'Seitengang mit Scharniergeräuschen',thron:'Tor mit goldenem Wappen',ausgang:'Raus aus der Gruft'})[key]??'Weiter'})):[],
    scene:s.room==='tor'?{name:'entry',stone:(state.objects??looseObjects(s.room)).includes('Stein'),
      rope:(state.objects??looseObjects(s.room)).includes('Seil'),chest:state.chestOpen?'open':'locked',
      loot:!!state.chestOpen&&!state.chestLoot}:null,
    vote:s.votes?.[id]??null,
    routeVotes:Object.values(s.votes??{}),
    log:s.log,pending};
}
